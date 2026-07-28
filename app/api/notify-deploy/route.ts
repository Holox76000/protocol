import { NextResponse } from "next/server";
import { slackPostMessage } from "../../../lib/slack";

export const runtime = "nodejs";

/**
 * POST /api/notify-deploy
 *
 * Poste une notif de deploy en langage simple sur Slack (canal deploy), via le
 * bot token — qui n'existe qu'en prod. Appelé par le protocole "Après chaque
 * deploy" (voir CLAUDE.md) : après un ship, on résume en mots NON-TECHNIQUES ce
 * que le deploy change + ce que ça implique, avec un lien vers la page de doc.
 *
 * Auth : Bearer CRON_SECRET **ou** BG_FN_SECRET.
 * Body : { message: string, title?: string, doc?: string }
 *   - doc : slug de wiki (-> https://protocol-club.com/docs/<slug>) ou URL complète.
 */

const DEFAULT_CHANNEL = process.env.DEPLOY_NOTIFY_CHANNEL_ID ?? "C0BKXQRPULX";
const DOCS_BASE = "https://protocol-club.com/docs";

function authorized(request: Request): boolean {
  const auth = request.headers.get("authorization");
  const secrets = [process.env.CRON_SECRET, process.env.BG_FN_SECRET].filter(Boolean);
  return secrets.some((s) => auth === `Bearer ${s}`);
}

function docUrl(doc?: string): string | null {
  if (!doc) return null;
  if (/^https?:\/\//.test(doc)) return doc;
  return `${DOCS_BASE}/${doc.replace(/^\/+|\/+$/g, "")}`;
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { message?: string; title?: string; doc?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const message = (body.message ?? "").trim();
  if (!message) {
    return NextResponse.json({ error: "message_required" }, { status: 400 });
  }

  const url = docUrl(body.doc);
  const lines = [
    body.title ? `:rocket: *Deploy — ${body.title}*` : ":rocket: *Nouveau deploy*",
    "",
    message,
  ];
  if (url) {
    lines.push("", `:book: Détails dans le wiki : ${url}`);
  }

  const res = await slackPostMessage({
    channelId: DEFAULT_CHANNEL,
    text: lines.join("\n"),
    unfurl: false,
  });

  if (!res.ok) {
    return NextResponse.json({ error: `slack_failed: ${res.error}` }, { status: 502 });
  }
  return NextResponse.json({ ok: true, channel: res.channel, ts: res.ts });
}
