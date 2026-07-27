// Shared generation + release logic for dating orders.
// Called by:
//   - /api/cron/dating-generate (automatic FIFO queue draining)
//   - /api/admin/dating/orders/[sessionId]/action (manual override
//     from the admin panel — "generate now", "send now", "regenerate")
//
// Both callers share the same happy path: download source photos + template
// refs → parallel Nano Banana calls → upload outputs → transition DB state
// → refresh the per-order Slack feed.

import { supabaseAdmin } from "./supabase";
import { generateImage, NanoBananaError, type ReferenceImage } from "./nanoBanana";
import { loadActiveTemplates, buildPrompt, getTemplateBySlug, type DatingTemplate } from "./datingTemplates";
import { refinePromptForPair } from "./promptAnalyzer";
import { listOrderPhotoPaths, orderPhotosPrefix } from "./datingOrders";
import { sendDatingDeliveryEmail } from "./email";
import {
  refreshDatingOrderRoot,
  replyDatingOrderThread,
  costMarginLines,
} from "./datingSlackFeed";

const SITE_URL = process.env.SITE_URL ?? "https://protocol-club.com";

// Nano Banana Pro (gemini-3-pro-image-preview) — Google official:
//   - 1K/2K output = $0.134/image (same price)
//   - 5 image inputs (template + 4 selfies) = ~$0.006
//   - prompt refinement text call (~$0.001)
// Rounded up so Slack / ops digest never underquote.
const COST_PER_IMAGE_CENTS = 14;

const MAX_REFERENCE_IMAGES = 4;
const CONCURRENCY = 5;

// Artificial delivery hold — 6-8h randomized to create a "we're reviewing"
// perception without breaking the 24h SLA. Manual delivery bypasses this.
const DELIVERY_HOLD_MIN_HOURS = 6;
const DELIVERY_HOLD_MAX_HOURS = 8;

export function computeDeliverAt(uploadedIso: string): string {
  const uploadedMs = new Date(uploadedIso).getTime();
  const spanHours = DELIVERY_HOLD_MAX_HOURS - DELIVERY_HOLD_MIN_HOURS;
  const holdHours = DELIVERY_HOLD_MIN_HOURS + Math.random() * spanHours;
  return new Date(uploadedMs + holdHours * 3600 * 1000).toISOString();
}

export type GenerationOrder = {
  id: string;
  stripe_session_id: string;
  email: string;
  first_name: string | null;
  photos_uploaded_at: string | null;
  amount_cents: number | null;
  utm_source: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  slack_sales_thread_ts: string | null;
};

export type GenerateResult = {
  ok: boolean;
  generated?: number;
  deliverAt?: string;
  error?: string;
};

// Options control:
//   - holdBeforeDelivery: true (cron default) sets deliver_at to now + 6-8h.
//     false (admin manual) sets deliver_at to now — the order becomes
//     immediately releasable, but status stays "generated" so the admin can
//     still preview before firing the delivery email.
export async function generateForOrder(
  order: GenerationOrder,
  opts: { holdBeforeDelivery?: boolean } = {},
): Promise<GenerateResult> {
  const holdBeforeDelivery = opts.holdBeforeDelivery !== false; // default true
  const { id: orderId, stripe_session_id: sessionId } = order;

  // 1. List source photos from storage (source of truth, not the jsonb col)
  const sourcePaths = await listOrderPhotoPaths(sessionId);
  if (sourcePaths.length < 4) {
    return { ok: false, error: `only ${sourcePaths.length} source photos — need ≥4` };
  }
  const refPaths = sourcePaths.slice(0, MAX_REFERENCE_IMAGES);

  // 2. Download references once, hold in memory for all shots.
  const refs: ReferenceImage[] = [];
  for (const path of refPaths) {
    const { data, error } = await supabaseAdmin.storage.from("dating-photos").download(path);
    if (error || !data) {
      return { ok: false, error: `download ref failed: ${error?.message ?? "no data"}` };
    }
    const buf = Buffer.from(await data.arrayBuffer());
    const ext = path.split(".").pop()?.toLowerCase() ?? "jpeg";
    const mimeType =
      ext === "png" ? "image/png" :
      ext === "webp" ? "image/webp" :
      ext === "heic" || ext === "heif" ? "image/heic" :
      "image/jpeg";
    refs.push({ data: buf, mimeType });
  }

  // 3. Load active templates from DB. Each one = 1 generated photo.
  const templates = await loadActiveTemplates();
  if (templates.length === 0) {
    return { ok: false, error: "no active templates configured" };
  }

  // Download each template's reference image from Storage once.
  const templateRefs = new Map<string, ReferenceImage>();
  for (const tpl of templates) {
    const { data, error } = await supabaseAdmin.storage
      .from("dating-photos")
      .download(tpl.refImagePath);
    if (error || !data) {
      return { ok: false, error: `template ${tpl.slug} ref download failed: ${error?.message ?? "no data"}` };
    }
    const buf = Buffer.from(await data.arrayBuffer());
    const ext = tpl.refImagePath.split(".").pop()?.toLowerCase() ?? "jpeg";
    const mimeType =
      ext === "png" ? "image/png" :
      ext === "webp" ? "image/webp" :
      "image/jpeg";
    templateRefs.set(tpl.id, { data: buf, mimeType });
  }

  // 4. Fan out one call per template with bounded concurrency.
  const outputPrefix = `${orderPhotosPrefix(sessionId)}/output`;
  const uploaded: string[] = [];
  const errors: string[] = [];

  async function runTemplate(tpl: DatingTemplate) {
    const templateRef = templateRefs.get(tpl.id);
    if (!templateRef) {
      errors.push(`${tpl.id}: template ref missing in-memory (should not happen)`);
      return;
    }
    // Two-phase: (1) Gemini refines the prompt using the actual visual
    // content of template + selfies; (2) Nano Banana Pro generates.
    // Falls back to buildPrompt(tpl.prompt) when refinement is disabled
    // (NANOBANANA_AI_PROMPT_REFINE=false) or errors.
    const refined = await refinePromptForPair({
      templateReference: templateRef,
      characterReferences: refs,
      scenePromptHint: tpl.prompt,
    });
    const promptForGeneration = refined?.refinedPrompt ?? buildPrompt(tpl.prompt);
    try {
      const result = await generateImage({
        prompt: promptForGeneration,
        templateReference: templateRef,
        characterReferences: refs,
        resolution: "1K",
        aspectRatio: "4:5",
      });
      const uploadPath = `${outputPrefix}/${tpl.slug}.jpg`;
      const { error: upErr } = await supabaseAdmin.storage
        .from("dating-photos")
        .upload(uploadPath, result.imageBytes, {
          contentType: result.mimeType,
          upsert: true,
        });
      if (upErr) throw new Error(`upload: ${upErr.message}`);
      uploaded.push(uploadPath);
    } catch (err) {
      const msg = err instanceof NanoBananaError
        ? `NB2 ${err.status ?? "net"}: ${err.message.slice(0, 200)}`
        : String(err).slice(0, 200);
      errors.push(`${tpl.slug}: ${msg}`);
    }
  }

  let cursor = 0;
  async function worker() {
    while (cursor < templates.length) {
      const idx = cursor++;
      await runTemplate(templates[idx]);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  // 5. Any error blocks delivery — caller retries by re-running the whole
  // generation (upsert:true above means overwrites are safe).
  if (errors.length > 0) {
    const errSummary = `${errors.length}/${templates.length} templates failed. First: ${errors[0]}`;
    return { ok: false, error: errSummary };
  }

  // 6. Compute deliver_at based on the caller's intent.
  //   - Cron: hold 6-8h from photos_uploaded_at ("we're reviewing" narrative)
  //   - Admin manual: deliver_at = now (skip the wait; the release action
  //     is a separate explicit click by the admin)
  const anchor = order.photos_uploaded_at ?? new Date().toISOString();
  const deliverAt = holdBeforeDelivery ? computeDeliverAt(anchor) : new Date().toISOString();
  const generationCostCents = uploaded.length * COST_PER_IMAGE_CENTS;

  const { error: upOrderErr } = await supabaseAdmin
    .from("dating_orders")
    .update({
      status: "generated",
      output_paths: uploaded,
      output_count: uploaded.length,
      generation_cost_cents: generationCostCents,
      generation_error: null,
      generated_at: new Date().toISOString(),
      deliver_at: deliverAt,
    })
    .eq("id", orderId);
  if (upOrderErr) {
    return { ok: false, error: `db update: ${upOrderErr.message}` };
  }

  const deliverInHours = Math.max(0, (new Date(deliverAt).getTime() - Date.now()) / 3600000);
  void refreshDatingOrderRoot({
    orderId,
    ts: order.slack_sales_thread_ts,
    status: "generated",
    email: order.email,
    firstName: order.first_name,
    stripeSessionId: sessionId,
    amountCents: order.amount_cents,
    utmSource: order.utm_source,
    utmCampaign: order.utm_campaign,
    utmContent: order.utm_content,
    holdHoursRemaining: deliverInHours,
  });
  const { costLine, marginLine } = costMarginLines({
    revenueCents: order.amount_cents ?? 3900,
    generationCostCents,
  });
  const adminUrl = `${SITE_URL}/admin/dating/${encodeURIComponent(sessionId)}`;
  const releaseNote = holdBeforeDelivery
    ? `Releases in ${deliverInHours.toFixed(1)}h.`
    : "Ready for admin review — manual delivery pending.";
  void replyDatingOrderThread({
    ts: order.slack_sales_thread_ts,
    text: [
      `:test_tube: *Generated* — ${uploaded.length} photos in ${refs.length}-ref mode.`,
      `${costLine}`,
      `${marginLine}`,
      `Preview + download: <${adminUrl}|admin gallery>`,
      releaseNote,
    ].join("\n"),
  });

  return { ok: true, generated: uploaded.length, deliverAt };
}

export type ReleaseOrder = {
  id: string;
  stripe_session_id: string;
  email: string;
  first_name: string | null;
  output_count: number;
  amount_cents: number | null;
  utm_source: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  slack_sales_thread_ts: string | null;
};

// Transition status generated → delivered, fire customer email + Slack ping.
// Called by:
//   - Cron (auto-release when deliver_at has passed)
//   - Admin manual "Send to customer now" button
export async function releaseOrder(order: ReleaseOrder): Promise<{ ok: boolean; error?: string }> {
  const { error: upErr } = await supabaseAdmin
    .from("dating_orders")
    .update({
      status: "delivered",
      delivered_at: new Date().toISOString(),
    })
    .eq("id", order.id)
    .eq("status", "generated");
  if (upErr) {
    return { ok: false, error: `release update: ${upErr.message}` };
  }

  void refreshDatingOrderRoot({
    orderId: order.id,
    ts: order.slack_sales_thread_ts,
    status: "delivered",
    email: order.email,
    firstName: order.first_name,
    stripeSessionId: order.stripe_session_id,
    amountCents: order.amount_cents,
    utmSource: order.utm_source,
    utmCampaign: order.utm_campaign,
    utmContent: order.utm_content,
  });
  void replyDatingOrderThread({
    ts: order.slack_sales_thread_ts,
    text: `:package: *Delivered* — email sent, ${order.output_count} photos live on the gallery.`,
  });

  try {
    await sendDatingDeliveryEmail({
      email: order.email,
      firstName: order.first_name ?? undefined,
      galleryUrl: `${SITE_URL}/dating/gallery?session_id=${order.stripe_session_id}`,
      photoCount: order.output_count,
    });
  } catch (err) {
    console.error("[dating/release] delivery email failed", {
      error: String(err), orderId: order.id, email: order.email,
    });
  }

  return { ok: true };
}

// ── Single-template regeneration (admin action per photo) ──────────

export type SingleRegenOrder = {
  id: string;
  stripe_session_id: string;
  generation_cost_cents: number | null;
};

// Regenerate ONE photo for a given (order, template) pair. Used by the
// admin per-photo "↻" button. Optional feedback string is appended to
// the prompt as a corrective clause so the next run fixes what the
// admin flagged (e.g. "The nose is too thin — keep the wide bulbous
// tip visible in the selfies").
export async function regenerateSingleTemplate(args: {
  order: SingleRegenOrder;
  templateSlug: string;
  feedback?: string | null;
}): Promise<{ ok: boolean; path?: string; error?: string }> {
  const { order, templateSlug, feedback } = args;
  const sessionId = order.stripe_session_id;

  const tpl = await getTemplateBySlug(templateSlug);
  if (!tpl) return { ok: false, error: `template "${templateSlug}" not found` };

  // 1. Load source selfies (same as full generation).
  const sourcePaths = await listOrderPhotoPaths(sessionId);
  if (sourcePaths.length < 4) {
    return { ok: false, error: `only ${sourcePaths.length} source photos — need ≥4` };
  }
  const refPaths = sourcePaths.slice(0, MAX_REFERENCE_IMAGES);

  const refs: ReferenceImage[] = [];
  for (const path of refPaths) {
    const { data, error } = await supabaseAdmin.storage.from("dating-photos").download(path);
    if (error || !data) {
      return { ok: false, error: `download ref failed: ${error?.message ?? "no data"}` };
    }
    const buf = Buffer.from(await data.arrayBuffer());
    const ext = path.split(".").pop()?.toLowerCase() ?? "jpeg";
    const mimeType =
      ext === "png" ? "image/png" :
      ext === "webp" ? "image/webp" :
      ext === "heic" || ext === "heif" ? "image/heic" :
      "image/jpeg";
    refs.push({ data: buf, mimeType });
  }

  // 2. Load template ref.
  const { data: tplData, error: tplErr } = await supabaseAdmin.storage
    .from("dating-photos")
    .download(tpl.refImagePath);
  if (tplErr || !tplData) {
    return { ok: false, error: `template ref download: ${tplErr?.message ?? "no data"}` };
  }
  const tplBuf = Buffer.from(await tplData.arrayBuffer());
  const tplExt = tpl.refImagePath.split(".").pop()?.toLowerCase() ?? "jpeg";
  const tplMime = tplExt === "png" ? "image/png" : tplExt === "webp" ? "image/webp" : "image/jpeg";
  const templateRef: ReferenceImage = { data: tplBuf, mimeType: tplMime };

  // 3. Build prompt. If feedback is present, append it as a
  // high-priority corrective clause so the model sees it. The refined
  // prompt path also gets the feedback woven into the scenePromptHint.
  const feedbackClause = feedback && feedback.trim()
    ? `\n\nADMIN CORRECTIVE FEEDBACK (highest priority — the previous generation had this specific issue, fix it in this one): ${feedback.trim()}`
    : "";

  const scenePromptHint = tpl.prompt + feedbackClause;
  const refined = await refinePromptForPair({
    templateReference: templateRef,
    characterReferences: refs,
    scenePromptHint,
  });
  const promptForGeneration = refined?.refinedPrompt
    ? refined.refinedPrompt + feedbackClause
    : buildPrompt(scenePromptHint);

  try {
    const result = await generateImage({
      prompt: promptForGeneration,
      templateReference: templateRef,
      characterReferences: refs,
      resolution: "1K",
      aspectRatio: "4:5",
    });
    const uploadPath = `${orderPhotosPrefix(sessionId)}/output/${tpl.slug}.jpg`;
    const { error: upErr } = await supabaseAdmin.storage
      .from("dating-photos")
      .upload(uploadPath, result.imageBytes, {
        contentType: result.mimeType,
        upsert: true, // overwrite the previous version
      });
    if (upErr) return { ok: false, error: `upload: ${upErr.message}` };

    // Bump the recorded generation cost by one extra photo so the
    // Slack digest and admin gallery stay honest about spend.
    await supabaseAdmin
      .from("dating_orders")
      .update({
        generation_cost_cents: (order.generation_cost_cents ?? 0) + COST_PER_IMAGE_CENTS,
      })
      .eq("id", order.id);

    return { ok: true, path: uploadPath };
  } catch (err) {
    const msg = err instanceof NanoBananaError
      ? `NB2 ${err.status ?? "net"}: ${err.message.slice(0, 200)}`
      : String(err).slice(0, 200);
    return { ok: false, error: msg };
  }
}
