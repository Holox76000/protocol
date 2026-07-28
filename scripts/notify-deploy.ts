/**
 * notify-deploy.ts — poste une notif de deploy en langage simple sur Slack.
 *
 * Utilisé par le protocole "Après chaque deploy" (voir CLAUDE.md). Après avoir
 * mis à jour le wiki, on résume ici en mots NON-TECHNIQUES ce que le deploy
 * change et ce que ça implique, avec un lien vers la page de doc concernée.
 *
 * Le post Slack part vers un canal précis (le bot token n'existe qu'en prod),
 * donc ce script appelle l'endpoint prod `/api/notify-deploy` (auth Bearer
 * BG_FN_SECRET / CRON_SECRET) qui fait le post côté serveur.
 *
 * Usage :
 *   npx tsx scripts/notify-deploy.ts \
 *     --title "Upsells dating" \
 *     --message "On propose maintenant 2 options payantes après l'achat..." \
 *     --doc produit            # slug -> https://protocol-club.com/docs/produit
 *
 * --message peut aussi être passé sur stdin.
 */
import { readFileSync } from "fs";
import { resolve } from "path";

// Charge .env.local (le fichier vit dans le dossier sibling non-tmp).
for (const p of [
  "/Users/pierre-andrepatry/Desktop/protocol_v2.nosync/.env.local",
  resolve(process.cwd(), ".env.local"),
]) {
  try {
    const env = readFileSync(p, "utf-8");
    for (const line of env.split("\n")) {
      const m = line.match(/^([^#=]+)=(.*)/);
      if (m && !process.env[m[1].trim()]) {
        process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
      }
    }
    break;
  } catch {
    /* essaie le chemin suivant */
  }
}

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const c of process.stdin) chunks.push(c as Buffer);
  return Buffer.concat(chunks).toString("utf-8").trim();
}

async function main() {
  const title = arg("title");
  const doc = arg("doc");
  let message = arg("message");
  if (!message && !process.stdin.isTTY) message = await readStdin();

  if (!message) {
    console.error("❌ --message requis (ou passé sur stdin).");
    process.exit(1);
  }

  const base = (
    arg("base") ||
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://protocol-club.com"
  ).replace(/\/+$/, "");
  const secret = process.env.BG_FN_SECRET || process.env.CRON_SECRET;
  if (!secret) {
    console.error("❌ BG_FN_SECRET / CRON_SECRET introuvable dans .env.local.");
    process.exit(1);
  }

  const res = await fetch(`${base}/api/notify-deploy`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
    body: JSON.stringify({ title, message, doc }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok || !(json as any).ok) {
    console.error(`❌ Échec (${res.status}): ${(json as any).error ?? "réponse inattendue"}`);
    process.exit(1);
  }
  console.log(`✅ Notif deploy postée (channel=${(json as any).channel}, ts=${(json as any).ts}).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
