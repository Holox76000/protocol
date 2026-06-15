#!/usr/bin/env node
/**
 * Protocol Club — MCP Proxy
 * Relie Claude Desktop (stdio) au serveur MCP distant.
 * Aucune installation requise — Node.js 18+ suffit.
 *
 * Usage dans claude_desktop_config.json :
 * {
 *   "mcpServers": {
 *     "protocol-data": {
 *       "command": "node",
 *       "args": ["/chemin/vers/mcp-proxy.mjs"]
 *     }
 *   }
 * }
 */

import { createInterface } from "readline";

const URL    = "https://protocol-club.com/api/mcp";
const SECRET = "0387056255b72674a5f487003d8d806bfc0e21950e1bfd7fc91a765046c66db1";

const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });

rl.on("line", async (line) => {
  if (!line.trim()) return;
  try {
    const msg = JSON.parse(line);
    const res = await fetch(URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SECRET}`,
      },
      body: JSON.stringify(msg),
    });
    if (res.status === 204) return;
    const text = await res.text();
    if (text) process.stdout.write(text + "\n");
  } catch (e) {
    process.stderr.write(String(e) + "\n");
  }
});
