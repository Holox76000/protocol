import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { generateImage, NanoBananaError, type ReferenceImage } from "../../../../lib/nanoBanana";
import { loadActiveTemplates, buildPrompt, type DatingTemplate } from "../../../../lib/datingTemplates";
import { refinePromptForPair } from "../../../../lib/promptAnalyzer";
import { listOrderPhotoPaths, orderPhotosPrefix } from "../../../../lib/datingOrders";
import { sendDatingDeliveryEmail } from "../../../../lib/email";
import {
  refreshDatingOrderRoot,
  replyDatingOrderThread,
  costMarginLines,
} from "../../../../lib/datingSlackFeed";

const SITE_URL = process.env.SITE_URL ?? "https://protocol-club.com";

export const runtime = "nodejs";
export const maxDuration = 60;

// Nano Banana Pro (gemini-3-pro-image-preview) — official Google API:
//   - 1K or 2K output = $0.134/image (same price, resolution doesn't matter)
//   - 5 image inputs (template + 4 selfies) = 5 × $0.0011 = $0.0055
//   - prompt refinement text call (~$0.001)
// Rounded up to 14 cents so we never underquote in Slack / ops digest.
const COST_PER_IMAGE_CENTS = 14;

// Model accepts up to 4 character-consistency references; more is wasted
// context. Pick the first 4 selfies uploaded (users typically upload their
// best first).
const MAX_REFERENCE_IMAGES = 4;

// Parallel Nano Banana calls per order. Higher = faster order completion but
// risks hitting per-account rate limits. 5 keeps 30 shots ≈ 20-25s wall time.
const CONCURRENCY = 5;

// One order per tick. Prevents a single stuck order from blocking the queue
// AND keeps us well under the 60s function timeout even in worst case.
const ORDERS_PER_TICK = 1;

// Resurrection window: an order in `generating` older than this is presumed
// crashed and gets reprocessed.
const STUCK_MINUTES = 30;

// Artificial hold before we notify the customer their photos are ready. The
// spread creates a "we're reviewing" perception without ever crossing the
// 24 h SLA. Anchored on photos_uploaded_at, not paid_at, because clients may
// upload hours or days after paying.
const DELIVERY_HOLD_MIN_HOURS = 6;
const DELIVERY_HOLD_MAX_HOURS = 8;

function computeDeliverAt(uploadedIso: string): string {
  const uploadedMs = new Date(uploadedIso).getTime();
  const spanHours = DELIVERY_HOLD_MAX_HOURS - DELIVERY_HOLD_MIN_HOURS;
  const holdHours = DELIVERY_HOLD_MIN_HOURS + Math.random() * spanHours;
  return new Date(uploadedMs + holdHours * 3600 * 1000).toISOString();
}

type GenerationOrder = {
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

async function processOrder(order: GenerationOrder): Promise<{ ok: boolean; generated?: number; deliverAt?: string; error?: string }> {
  const { id: orderId, stripe_session_id: sessionId } = order;

  // 1. List source photos from storage (source of truth, not the jsonb col)
  const sourcePaths = await listOrderPhotoPaths(sessionId);
  if (sourcePaths.length < 4) {
    return { ok: false, error: `only ${sourcePaths.length} source photos — need ≥4` };
  }
  const refPaths = sourcePaths.slice(0, MAX_REFERENCE_IMAGES);

  // 2. Download references once, hold in memory for all 30 shots.
  const refs: { data: Buffer; mimeType: string }[] = [];
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

  // 3. Load all active face-swap templates. Each one = 1 generated photo.
  const templates = await loadActiveTemplates();
  if (templates.length === 0) {
    return { ok: false, error: "no active templates configured" };
  }

  // Download each template's reference image from Storage once, hold in
  // memory for the whole run. Paths live under dating-photos/templates/
  // and are set by the admin CRUD.
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
    // Two-phase generation: (1) ask Gemini to write a bespoke face-swap
    // prompt based on the actual visual content of the template + selfies;
    // (2) feed that refined prompt into Nano Banana Pro. Falls back to
    // buildPrompt(tpl.prompt) if refinement is disabled or errors.
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

  // Simple worker pool — kick off CONCURRENCY workers that pull from a queue.
  let cursor = 0;
  async function worker() {
    while (cursor < templates.length) {
      const idx = cursor++;
      await runTemplate(templates[idx]);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  // 5. Persist results. Atomicity: any error blocks delivery so we retry
  // cleanly next tick (upsert:true above means retries overwrite).
  if (errors.length > 0) {
    const errSummary = `${errors.length}/${templates.length} templates failed. First: ${errors[0]}`;
    return { ok: false, error: errSummary };
  }

  // Phase 1 end: photos are ready but held. Compute deliver_at anchored on
  // photos_uploaded_at (falls back to now if the timestamp is somehow null).
  const anchor = order.photos_uploaded_at ?? new Date().toISOString();
  const deliverAt = computeDeliverAt(anchor);
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

  const deliverInHours = (new Date(deliverAt).getTime() - Date.now()) / 3600000;
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
  void replyDatingOrderThread({
    ts: order.slack_sales_thread_ts,
    text: [
      `:test_tube: *Generated* — ${uploaded.length} photos in ${refs.length}-ref mode.`,
      `${costLine}`,
      `${marginLine}`,
      `Preview + download: <${adminUrl}|admin gallery>`,
      `Releases in ${deliverInHours.toFixed(1)}h.`,
    ].join("\n"),
  });

  return { ok: true, generated: uploaded.length, deliverAt };
}

type ReleaseOrder = {
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

// Phase 2: pick generated orders whose deliver_at has arrived, flip to
// delivered, notify customer + Slack.
async function releaseOrder(order: ReleaseOrder): Promise<{ ok: boolean; error?: string }> {
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
    console.error("[cron/dating-generate] delivery email failed", {
      error: String(err), orderId: order.id, email: order.email,
    });
  }

  return { ok: true };
}

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const nowIso = new Date().toISOString();
  const summary: {
    released: Array<{ orderId: string; ok: boolean; error?: string }>;
    generated: Array<{ orderId: string; ok: boolean; generated?: number; deliverAt?: string; error?: string }>;
  } = { released: [], generated: [] };

  // ── Phase 2 first: release any generated orders whose hold has expired.
  // Cheap query (indexed on status+deliver_at), no external API calls, so we
  // do it every tick regardless of generation load. Batch up to 20 per tick.
  const { data: dueOrders, error: dueErr } = await supabaseAdmin
    .from("dating_orders")
    .select("id, stripe_session_id, email, first_name, output_count, amount_cents, utm_source, utm_campaign, utm_content, slack_sales_thread_ts")
    .eq("status", "generated")
    .lte("deliver_at", nowIso)
    .order("deliver_at", { ascending: true })
    .limit(20);

  if (dueErr) {
    console.error("[cron/dating-generate] fetch due orders failed", { error: dueErr.message });
  } else {
    for (const order of dueOrders ?? []) {
      const res = await releaseOrder(order);
      summary.released.push({ orderId: order.id, ...res });
    }
  }

  // ── Phase 1: generate one fresh order per tick. Candidates are `photos_uploaded`
  // or `generating` stuck > STUCK_MINUTES (crashed mid-run). Oldest-first FIFO.
  const stuckCutoff = new Date(Date.now() - STUCK_MINUTES * 60 * 1000).toISOString();

  const { data: candidates, error: fetchErr } = await supabaseAdmin
    .from("dating_orders")
    .select("id, stripe_session_id, email, first_name, status, generation_started_at, photos_uploaded_at, amount_cents, utm_source, utm_campaign, utm_content, slack_sales_thread_ts")
    .or(
      `status.eq.photos_uploaded,and(status.eq.generating,generation_started_at.lt.${stuckCutoff})`
    )
    .order("photos_uploaded_at", { ascending: true, nullsFirst: false })
    .limit(ORDERS_PER_TICK);

  if (fetchErr) {
    console.error("[cron/dating-generate] fetch candidates failed", { error: fetchErr.message });
    return NextResponse.json({ error: "fetch failed", released: summary.released.length }, { status: 500 });
  }

  for (const order of candidates ?? []) {
    // CAS claim: two ticks can't grab the same order.
    const { data: claimed, error: claimErr } = await supabaseAdmin
      .from("dating_orders")
      .update({
        status: "generating",
        generation_started_at: new Date().toISOString(),
        generation_error: null,
      })
      .eq("id", order.id)
      .eq("status", order.status)
      .select("id");

    if (claimErr) {
      summary.generated.push({ orderId: order.id, ok: false, error: `claim: ${claimErr.message}` });
      continue;
    }
    if (!claimed || claimed.length === 0) {
      summary.generated.push({ orderId: order.id, ok: false, error: "already claimed" });
      continue;
    }

    try {
      const res = await processOrder(order);
      summary.generated.push({ orderId: order.id, ...res });

      if (!res.ok) {
        await supabaseAdmin
          .from("dating_orders")
          .update({
            status: "photos_uploaded",
            generation_error: res.error ?? "unknown",
          })
          .eq("id", order.id);
      }
    } catch (err) {
      const msg = String(err).slice(0, 500);
      console.error("[cron/dating-generate] processOrder crashed", { orderId: order.id, msg });
      await supabaseAdmin
        .from("dating_orders")
        .update({ status: "photos_uploaded", generation_error: msg })
        .eq("id", order.id);
      summary.generated.push({ orderId: order.id, ok: false, error: msg });
    }
  }

  return NextResponse.json({ ok: true, ...summary });
}
