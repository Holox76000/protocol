import { NextResponse } from "next/server";
import crypto from "node:crypto";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const DEFAULT_PROMPT =
  "Create a realistic athletic transformation preview of this exact person. Preserve identity, face, skin tone, hair, camera angle, and lighting. Improve body composition into a natural muscular physique with broader shoulders, more upper chest, visible arms, a tighter waist, and lower body fat. Keep the result believable, proportional, and non-steroidal.";

export const runtime = "nodejs";
const DEFAULT_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_MODEL = "gemini-3.1-flash-image-preview";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function formatUnknownError(error: unknown) {
  if (error instanceof Error) {
    return [error.message, error.stack].filter(Boolean).join("\n\n");
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error, null, 2);
  } catch {
    return String(error);
  }
}

function toDataUrl(base64: string, mimeType = "image/png") {
  return `data:${mimeType};base64,${base64}`;
}

function extensionFromMimeType(mimeType: string) {
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "bin";
}

function bufferFromImageUrl(imageUrl: string) {
  if (!imageUrl.startsWith("data:")) {
    throw new Error("Only data URLs are supported for server-side persistence.");
  }

  const match = imageUrl.match(/^data:(.+?);base64,(.+)$/);
  if (!match) {
    throw new Error("The generated data URL is invalid.");
  }

  const [, mimeType, base64Data] = match;
  return {
    mimeType,
    buffer: Buffer.from(base64Data, "base64"),
  };
}

async function parseVisualizationRequest(request: Request) {
  const formData = await request.formData();
  const image = formData.get("image");
  const promptInput = formData.get("prompt");

  if (!(image instanceof File)) {
    return { error: jsonError("Please upload an image.", 400) } as const;
  }

  if (!image.type.startsWith("image/")) {
    return { error: jsonError("Only image uploads are supported.", 400) } as const;
  }

  if (image.size > MAX_FILE_SIZE) {
    return { error: jsonError("Image too large. Use a file under 10 MB.", 400) } as const;
  }

  const prompt = typeof promptInput === "string" && promptInput.trim() ? promptInput.trim() : DEFAULT_PROMPT;

  return { image, prompt } as const;
}

function extractImageUrl(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;

  const record = payload as Record<string, unknown>;

  if (typeof record.imageUrl === "string") return record.imageUrl;
  if (typeof record.url === "string") return record.url;
  if (typeof record.output === "string") return record.output;
  if (typeof record.result === "string") return record.result;

  if (typeof record.b64_json === "string") {
    return toDataUrl(record.b64_json);
  }

  if (Array.isArray(record.data)) {
    for (const item of record.data) {
      const url = extractImageUrl(item);
      if (url) return url;
    }
  }

  if (Array.isArray(record.output)) {
    for (const item of record.output) {
      const url = extractImageUrl(item);
      if (url) return url;
      if (typeof item === "string") return item;
    }
  }

  if (record.image && typeof record.image === "object") {
    const nested = record.image as Record<string, unknown>;
    if (typeof nested.url === "string") return nested.url;
    if (typeof nested.base64 === "string") {
      return toDataUrl(nested.base64, typeof nested.mimeType === "string" ? nested.mimeType : "image/png");
    }
  }

  if (typeof record.base64 === "string") {
    return toDataUrl(record.base64, typeof record.mimeType === "string" ? record.mimeType : "image/png");
  }

  if (Array.isArray(record.candidates)) {
    for (const candidate of record.candidates) {
      const url = extractImageUrl(candidate);
      if (url) return url;
    }
  }

  if (record.content && typeof record.content === "object") {
    const content = record.content as Record<string, unknown>;
    if (Array.isArray(content.parts)) {
      for (const part of content.parts) {
        if (!part || typeof part !== "object") continue;
        const partRecord = part as Record<string, unknown>;

        if (partRecord.inlineData && typeof partRecord.inlineData === "object") {
          const inlineData = partRecord.inlineData as Record<string, unknown>;
          if (typeof inlineData.data === "string") {
            return toDataUrl(
              inlineData.data,
              typeof inlineData.mimeType === "string" ? inlineData.mimeType : "image/png"
            );
          }
        }

        if (partRecord.inline_data && typeof partRecord.inline_data === "object") {
          const inlineData = partRecord.inline_data as Record<string, unknown>;
          if (typeof inlineData.data === "string") {
            return toDataUrl(
              inlineData.data,
              typeof inlineData.mime_type === "string" ? inlineData.mime_type : "image/png"
            );
          }
        }
      }
    }
  }

  return null;
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();

  try {
    const configuredUrl = process.env.NANOBANANA_API_URL;
    const apiKey = process.env.NANOBANANA_API_KEY;
    const model = process.env.NANOBANANA_MODEL || DEFAULT_MODEL;

    if (!apiKey) {
      return jsonError("NANOBANANA_API_KEY is not configured on the server.", 503);
    }

    const parsedRequest = await parseVisualizationRequest(request);
    if ("error" in parsedRequest) {
      return parsedRequest.error;
    }

    const { image, prompt } = parsedRequest;
    const base64 = Buffer.from(await image.arrayBuffer()).toString("base64");

    const requestUrl = (() => {
      if (!configuredUrl) {
        return new URL(`${DEFAULT_API_BASE}/models/${model}:generateContent`);
      }

      const candidate = new URL(configuredUrl);

      if (!candidate.hostname.includes("googleapis.com")) {
        return new URL(`${DEFAULT_API_BASE}/models/${model}:generateContent`);
      }

      if (configuredUrl.includes(":generateContent")) {
        return candidate;
      }

      const normalized = configuredUrl.replace(/\/$/, "");

      if (normalized.endsWith("/v1beta")) {
        return new URL(`${normalized}/models/${model}:generateContent`);
      }

      if (normalized.includes("/models/")) {
        return new URL(`${normalized}:generateContent`);
      }

      return new URL(`${normalized}/models/${model}:generateContent`);
    })();

    const upstreamResponse = await fetch(requestUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                inline_data: {
                  mime_type: image.type,
                  data: base64,
                },
              },
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
          imageConfig: {
            aspectRatio: "3:4",
            imageSize: "1K",
          },
        },
      }),
    });

    const responseText = await upstreamResponse.text();

    console.log("[api/visualize] upstream response", {
      requestId,
      status: upstreamResponse.status,
      ok: upstreamResponse.ok,
      responsePreview: responseText.slice(0, 300),
    });

    if (!upstreamResponse.ok) {
      const verboseError = [
        `Visualization request failed.`,
        `Request ID: ${requestId}`,
        `Status: ${upstreamResponse.status}`,
        responseText || "Nanobanana returned an empty error response.",
      ].join("\n\n");

      return jsonError(verboseError, upstreamResponse.status);
    }

    let parsed: unknown = null;

    try {
      parsed = responseText ? JSON.parse(responseText) : null;
    } catch {
      if (responseText.startsWith("data:image/") || responseText.startsWith("http")) {
        return NextResponse.json({
          imageUrl: responseText,
          previewId: crypto.randomUUID(),
        });
      }

      return jsonError(
        [
          "Nanobanana response could not be parsed.",
          `Request ID: ${requestId}`,
          responseText.slice(0, 2000),
        ].join("\n\n"),
        502
      );
    }

    const imageUrl = extractImageUrl(parsed);

    console.log("[api/visualize] extracted image", {
      hasImageUrl: Boolean(imageUrl),
      isDataUrl: imageUrl?.startsWith("data:") ?? false,
    });

    if (!imageUrl) {
      const summary =
        parsed && typeof parsed === "object"
          ? JSON.stringify(parsed).slice(0, 800)
          : responseText.slice(0, 800);
      return jsonError(
        [`Gemini response did not contain an image.`, `Request ID: ${requestId}`, `Payload: ${summary}`].join("\n\n"),
        502
      );
    }

    if (imageUrl.startsWith("data:")) {
      const generatedImage = bufferFromImageUrl(imageUrl);
      return NextResponse.json({
        imageUrl: toDataUrl(generatedImage.buffer.toString("base64"), generatedImage.mimeType),
        previewId: crypto.randomUUID(),
      });
    }

    return NextResponse.json({
      imageUrl,
      previewId: crypto.randomUUID(),
    });
  } catch (error) {
    const verboseError = [`The visualizer failed on the server.`, `Request ID: ${requestId}`, formatUnknownError(error)].join(
      "\n\n"
    );

    console.error("[api/visualize] unhandled error", {
      requestId,
      error,
    });
    return jsonError(verboseError, 500);
  }
}
