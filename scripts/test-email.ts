import { readFileSync } from "fs";
import { resolve } from "path";
import { Resend } from "resend";

const envFile = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
for (const line of envFile.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

async function main() {
  const resend = new Resend(process.env.RESEND_API_KEY!);

  const { data, error } = await resend.emails.send({
    from: "Protocol Club <hello@protocol-club.com>",
    to: "patrypierrandre@gmail.com",
    subject: "Test email — Protocol Club",
    html: `<p>Test envoi Resend ✓</p>`,
  });

  if (error) {
    console.error("FAILED:", error);
  } else {
    console.log("OK:", data);
  }
}

main().catch(console.error);
