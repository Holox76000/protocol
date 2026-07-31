// Thin client for Google Gemini 3.1 Flash Image (a.k.a. Nano Banana 2).
// Uses the Interactions API which supports up to 4 character-consistency
// reference images plus explicit image_size/aspect_ratio control.
// https://ai.google.dev/gemini-api/docs/image-generation

const API_URL = "https://generativelanguage.googleapis.com/v1beta/interactions";
// Default to Nano Banana 2 (gemini-3.1-flash-image) — the only model that
// works with the Interactions API used below. NANOBANANA_MODEL is honored
// only if it starts with `gemini-3` (older models require the legacy
// generateContent endpoint we don't implement here).
function resolveModel(): string {
  const envModel = process.env.NANOBANANA_MODEL;
  if (envModel && envModel.startsWith("gemini-3")) return envModel;
  return "gemini-3.1-flash-image";
}

// Meta's Ads Manager crops profiles to portrait; 4:5 is the widest ratio
// that survives Tinder/Hinge/Bumble grid crops without face amputation.
export type Resolution = "1K" | "2K" | "4K";
export type AspectRatio = "1:1" | "3:4" | "4:5" | "9:16";

export type ReferenceImage = {
  data: Buffer;
  mimeType: string;
};

// "high" gives significantly better identity + composition preservation
// than "minimal" (the default) at ~2x latency. Used for every dating
// generation — the extra 2-3s is invisible inside the 6-8h delivery hold.
export type ThinkingLevel = "minimal" | "high";

export type GenerateOptions = {
  prompt: string;
  // The scene we want to reproduce. Sent first so the model treats it as
  // the primary composition to preserve (everything but the identity).
  templateReference?: ReferenceImage;
  // Customer selfies used for character consistency. Capped at 4 (model
  // limit); extras are silently trimmed.
  characterReferences?: ReferenceImage[];
  // Legacy generic-refs path; kept for callers not yet migrated. If set,
  // used as-is (in order). Ignored when template/character are provided.
  referenceImages?: ReferenceImage[];
  resolution?: Resolution;
  aspectRatio?: AspectRatio;
  thinkingLevel?: ThinkingLevel; // default "high"
};

export type GenerateResult = {
  imageBytes: Buffer;
  mimeType: string;
  interactionId: string | null;
};

class NanoBananaError extends Error {
  constructor(
    message: string,
    public readonly status: number | null,
    public readonly retryable: boolean,
    public readonly rawBody: string | null,
    public readonly retryAfterMs: number | null = null,
  ) {
    super(message);
    this.name = "NanoBananaError";
  }
}

// 5xx + 429 = retryable; 4xx (auth, bad request) = permanent.
function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

// Parse a Retry-After header (delta-seconds or HTTP-date) into ms, clamped to
// a sane ceiling so a hostile/huge value can't stall the worker for minutes.
function parseRetryAfterMs(header: string | null): number | null {
  if (!header) return null;
  const secs = Number(header);
  if (Number.isFinite(secs)) return Math.min(Math.max(secs, 0) * 1000, 60_000);
  const when = Date.parse(header);
  if (!Number.isNaN(when)) return Math.min(Math.max(when - Date.now(), 0), 60_000);
  return null;
}

async function callOnce(opts: GenerateOptions, apiKey: string): Promise<GenerateResult> {
  // Assemble refs in the order the model gives them highest attention:
  // template first (composition to preserve), then customer selfies for
  // identity. Cap character refs at 4 per Nano Banana 2 docs.
  const orderedRefs: ReferenceImage[] = [];
  if (opts.templateReference) orderedRefs.push(opts.templateReference);
  if (opts.characterReferences) orderedRefs.push(...opts.characterReferences.slice(0, 4));
  if (opts.referenceImages && orderedRefs.length === 0) {
    // Legacy path: caller hasn't migrated to template/character split.
    orderedRefs.push(...opts.referenceImages.slice(0, 4));
  }

  const input: Array<Record<string, unknown>> = [
    { type: "text", text: opts.prompt },
    ...orderedRefs.map((r) => ({
      type: "image",
      mime_type: r.mimeType,
      data: r.data.toString("base64"),
    })),
  ];

  const body = {
    model: resolveModel(),
    input,
    response_format: {
      type: "image",
      mime_type: "image/jpeg",
      aspect_ratio: opts.aspectRatio ?? "4:5",
      image_size: opts.resolution ?? "2K",
    },
    generation_config: {
      thinking_level: opts.thinkingLevel ?? "high",
    },
  };

  let res: Response;
  try {
    res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    // Network-level failure — always retryable.
    throw new NanoBananaError(`network error: ${String(err)}`, null, true, null);
  }

  const rawText = await res.text();

  if (!res.ok) {
    throw new NanoBananaError(
      `Nano Banana ${res.status}: ${rawText.slice(0, 500)}`,
      res.status,
      isRetryableStatus(res.status),
      rawText,
      parseRetryAfterMs(res.headers.get("retry-after")),
    );
  }

  let parsed: {
    id?: string;
    output_image?: { data?: string; mime_type?: string };
    steps?: Array<{ type?: string; content?: Array<{ type?: string; data?: string; mime_type?: string }> }>;
  };
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new NanoBananaError("invalid JSON in response", res.status, false, rawText);
  }

  // Prefer the convenience field; fall back to walking steps for interleaved responses.
  let dataB64 = parsed.output_image?.data ?? null;
  let mimeType = parsed.output_image?.mime_type ?? "image/jpeg";

  if (!dataB64) {
    for (const step of parsed.steps ?? []) {
      if (step.type !== "model_output") continue;
      for (const part of step.content ?? []) {
        if (part.type === "image" && part.data) {
          dataB64 = part.data;
          mimeType = part.mime_type ?? mimeType;
          break;
        }
      }
      if (dataB64) break;
    }
  }

  if (!dataB64) {
    throw new NanoBananaError("no image data in response", res.status, false, rawText.slice(0, 500));
  }

  return {
    imageBytes: Buffer.from(dataB64, "base64"),
    mimeType,
    interactionId: parsed.id ?? null,
  };
}

const DEFAULT_MAX_ATTEMPTS = 4;

// Exponential backoff with jitter (1s → 3s → 9s + up to 500ms). When the API
// returns a Retry-After (e.g. on 429 throttling), honour it — waiting at least
// that long — so we back off exactly as the provider asks under rate limits.
async function sleepBackoff(attempt: number, retryAfterMs: number | null): Promise<void> {
  const base = 1000 * Math.pow(3, attempt - 1);
  const jitter = Math.floor(Math.random() * 500);
  const wait = retryAfterMs != null ? Math.max(retryAfterMs, base) : base + jitter;
  await new Promise((r) => setTimeout(r, wait));
}

export async function generateImage(opts: GenerateOptions): Promise<GenerateResult> {
  // NANOBANANA_API_KEY matches the existing Netlify convention; the two
  // aliases below are legacy fallbacks (no-op if neither is set).
  const apiKey = process.env.NANOBANANA_API_KEY
    ?? process.env.NANO_BANANA_API_KEY
    ?? process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new NanoBananaError("NANOBANANA_API_KEY not set", null, false, null);
  }

  let lastError: NanoBananaError | null = null;
  for (let attempt = 1; attempt <= DEFAULT_MAX_ATTEMPTS; attempt++) {
    try {
      return await callOnce(opts, apiKey);
    } catch (err) {
      if (!(err instanceof NanoBananaError)) throw err;
      lastError = err;
      if (!err.retryable || attempt === DEFAULT_MAX_ATTEMPTS) throw err;
      await sleepBackoff(attempt, err.retryAfterMs);
    }
  }
  throw lastError ?? new NanoBananaError("exhausted retries", null, false, null);
}

export { NanoBananaError };
