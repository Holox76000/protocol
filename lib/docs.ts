import fs from "node:fs";
import path from "node:path";

/**
 * Company handbook / wiki loader.
 *
 * Content lives as plain markdown files in the repo's top-level `docs/`
 * directory. This module reads them at build time so the site regenerates on
 * every deploy — drop a new `NN-slug.md` file in `docs/` and it shows up in the
 * sidebar and gets its own page automatically, no code change required.
 *
 * File naming: `NN-slug.md` where `NN` is a two-digit order prefix.
 *   - `slug`  → the URL (`/docs/slug`), derived from the filename minus prefix.
 *   - `order` → the `NN` prefix, controls sidebar ordering.
 *   - `title` → the first `# H1` in the file.
 *   - `category` (optional) → grouping in the sidebar, set with a leading
 *     HTML comment: `<!-- category: Fondations -->`.
 *   - `summary` (optional) → one-line blurb, set with `<!-- summary: ... -->`.
 */

export const DOCS_DIR = path.join(process.cwd(), "docs");

export type DocMeta = {
  slug: string;
  title: string;
  category: string;
  summary: string;
  order: number;
};

export type Doc = DocMeta & { content: string };

const DEFAULT_CATEGORY = "Guide";

function firstHeadingIndex(raw: string): number {
  const m = raw.match(/^\s*#\s+.+$/m);
  return m && m.index != null ? m.index : raw.length;
}

/**
 * Metadata comments (`<!-- key: value -->`) are only recognized in the header
 * region, before the first `#` heading. This keeps example snippets in the body
 * (e.g. a doc that documents this very syntax) from being parsed as real meta.
 */
function readMetaComment(raw: string, key: string): string | null {
  const head = raw.slice(0, firstHeadingIndex(raw));
  const re = new RegExp(`<!--\\s*${key}\\s*:\\s*([^>]+?)\\s*-->`, "i");
  const m = head.match(re);
  return m ? m[1].trim() : null;
}

function firstHeading(raw: string): string | null {
  const m = raw.match(/^\s*#\s+(.+?)\s*$/m);
  return m ? m[1].trim() : null;
}

/**
 * Remove the leading metadata block — the contiguous run of blank lines and
 * `<!-- key: value -->` comment lines at the very top of the file. react-markdown
 * renders raw HTML comments as literal text, so they must not reach it. Only the
 * header run is stripped, so an inline `<!-- ... -->` example inside a code span
 * further down the body is preserved verbatim.
 */
function stripLeadingMeta(raw: string): string {
  const lines = raw.split("\n");
  let i = 0;
  while (
    i < lines.length &&
    (lines[i].trim() === "" || /^\s*<!--[\s\S]*?-->\s*$/.test(lines[i]))
  ) {
    i++;
  }
  return lines.slice(i).join("\n");
}

function parseFile(file: string): Doc | null {
  if (!file.endsWith(".md")) return null;
  const raw = fs.readFileSync(path.join(DOCS_DIR, file), "utf8");

  const base = file.replace(/\.md$/, "");
  const prefixMatch = base.match(/^(\d+)[-_]?(.*)$/);
  const order = prefixMatch ? parseInt(prefixMatch[1], 10) : 999;
  const slug = (prefixMatch ? prefixMatch[2] : base) || base;

  const title =
    readMetaComment(raw, "title") ||
    firstHeading(raw) ||
    slug.replace(/[-_]/g, " ");
  const category = readMetaComment(raw, "category") || DEFAULT_CATEGORY;
  const summary = readMetaComment(raw, "summary") || "";

  return { slug, title, category, summary, order, content: stripLeadingMeta(raw) };
}

let _cache: Doc[] | null = null;

function loadAll(): Doc[] {
  if (_cache) return _cache;
  let files: string[] = [];
  try {
    files = fs.readdirSync(DOCS_DIR);
  } catch {
    return [];
  }
  const docs = files
    .map(parseFile)
    .filter((d): d is Doc => d !== null)
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
  _cache = docs;
  return docs;
}

export function getAllDocs(): Doc[] {
  return loadAll();
}

export function getDocMetas(): DocMeta[] {
  return loadAll().map(({ content, ...meta }) => meta);
}

export function getDoc(slug: string): Doc | null {
  return loadAll().find((d) => d.slug === slug) || null;
}

/** Sidebar structure: ordered categories, each with its ordered docs. */
export function getDocNav(): { category: string; docs: DocMeta[] }[] {
  const metas = getDocMetas();
  const groups: { category: string; docs: DocMeta[] }[] = [];
  for (const meta of metas) {
    let group = groups.find((g) => g.category === meta.category);
    if (!group) {
      group = { category: meta.category, docs: [] };
      groups.push(group);
    }
    group.docs.push(meta);
  }
  return groups;
}
