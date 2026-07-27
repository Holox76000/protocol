"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Template = {
  id: string;
  slug: string;
  label: string;
  prompt: string;
  refImagePath: string;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  signedUrl: string | null;
};

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function labelToSlug(label: string): string {
  return label
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export default function TemplatesClient({ initial }: { initial: Template[] }) {
  const router = useRouter();
  const [templates, setTemplates] = useState(initial);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [testing, setTesting] = useState<Template | null>(null);

  const activeCount = useMemo(() => templates.filter(t => t.active).length, [templates]);

  async function refresh() {
    router.refresh();
  }

  async function toggleActive(t: Template) {
    setBusyId(t.id);
    try {
      const res = await fetch(`/api/admin/dating/templates/${t.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !t.active }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(`Toggle failed: ${j.error ?? res.status}`);
        return;
      }
      setTemplates(prev => prev.map(x => x.id === t.id ? { ...x, active: !t.active } : x));
    } finally {
      setBusyId(null);
    }
  }

  async function remove(t: Template) {
    if (!confirm(`Delete "${t.label}" and its reference image? This cannot be undone.`)) return;
    setBusyId(t.id);
    try {
      const res = await fetch(`/api/admin/dating/templates/${t.id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(`Delete failed: ${j.error ?? res.status}`);
        return;
      }
      setTemplates(prev => prev.filter(x => x.id !== t.id));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[13px] text-mute">
          {templates.length} template{templates.length !== 1 ? "s" : ""} · <strong>{activeCount} active</strong> — each customer receives one photo per active template.
        </p>
        <button
          type="button"
          onClick={() => { setEditing(null); setFormOpen(true); }}
          className="rounded-lg bg-void px-4 py-2 text-[12px] font-semibold text-white transition-opacity hover:opacity-90"
        >
          + New template
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="rounded-2xl border border-pebble bg-white px-6 py-16 text-center">
          <p className="text-[14px] text-mute">
            No templates yet. Create one — until then, the generation cron won&apos;t deliver any photo.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map(t => (
            <div
              key={t.id}
              className={`overflow-hidden rounded-2xl border bg-white transition-shadow hover:shadow-md ${t.active ? "border-pebble" : "border-pebble opacity-60"}`}
            >
              {t.signedUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={t.signedUrl} alt={t.label} className="aspect-[4/5] w-full object-cover" loading="lazy" />
              ) : (
                <div className="flex aspect-[4/5] items-center justify-center bg-ash text-[12px] text-mute">
                  no preview
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-medium text-void">{t.label}</div>
                    <div className="truncate font-mono text-[11px] text-mute">{t.slug}</div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${t.active ? "bg-emerald-50 text-emerald-700" : "bg-pebble text-dim"}`}
                  >
                    {t.active ? "active" : "off"}
                  </span>
                </div>
                <p className="mt-3 line-clamp-3 text-[12px] leading-relaxed text-mute">
                  {t.prompt.replace(/\s+/g, " ").slice(0, 240)}{t.prompt.length > 240 ? "…" : ""}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTesting(t)}
                    className="rounded-lg bg-void px-3 py-1.5 text-[11px] font-semibold text-white transition-opacity hover:opacity-90"
                  >
                    Test →
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleActive(t)}
                    disabled={busyId === t.id}
                    className="rounded-lg border border-pebble bg-white px-3 py-1.5 text-[11px] font-semibold text-void hover:bg-ash transition-colors disabled:opacity-60"
                  >
                    {t.active ? "Turn off" : "Turn on"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEditing(t); setFormOpen(true); }}
                    className="rounded-lg border border-pebble bg-white px-3 py-1.5 text-[11px] font-semibold text-void hover:bg-ash transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(t)}
                    disabled={busyId === t.id}
                    className="ml-auto rounded-lg border border-red-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {formOpen && (
        <TemplateForm
          existing={editing}
          onClose={() => { setFormOpen(false); setEditing(null); }}
          onDone={() => { setFormOpen(false); setEditing(null); refresh(); }}
        />
      )}

      {testing && (
        <TestModal
          template={testing}
          onClose={() => setTesting(null)}
        />
      )}
    </div>
  );
}

function TestModal({ template, onClose }: { template: Template; onClose: () => void }) {
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);
  const [promptUsed, setPromptUsed] = useState<string | null>(null);
  const [promptSource, setPromptSource] = useState<string | null>(null);
  const [promptFinishReason, setPromptFinishReason] = useState<string | null>(null);

  function onFilesChange(list: FileList | null) {
    if (!list) return;
    // Cap at 4 (Nano Banana character reference limit).
    setFiles(Array.from(list).slice(0, 4));
    setResultUrl(null);
    setError(null);
  }

  async function run() {
    if (files.length === 0) {
      setError("Upload at least one selfie.");
      return;
    }
    setBusy(true);
    setError(null);
    setResultUrl(null);
    const start = Date.now();
    try {
      const fd = new FormData();
      for (const f of files) fd.append("selfies", f);
      const res = await fetch(`/api/admin/dating/templates/${template.id}/test`, {
        method: "POST",
        body: fd,
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(j.error ?? `HTTP ${res.status}`);
        return;
      }
      setResultUrl(j.dataUrl as string);
      setPromptUsed(typeof j.promptUsed === "string" ? j.promptUsed : null);
      setPromptSource(typeof j.promptSource === "string" ? j.promptSource : null);
      setPromptFinishReason(typeof j.promptFinishReason === "string" ? j.promptFinishReason : null);
      setElapsedMs(Date.now() - start);
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6 backdrop-blur-sm">
      <div className="mt-6 mb-10 w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mute">Test template</p>
            <h2 className="mt-1 font-display text-xl text-void">{template.label}</h2>
            <p className="mt-1 font-mono text-[11px] text-mute">{template.slug}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-[12px] font-semibold text-mute hover:bg-ash"
          >
            ✕ Close
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Left: reference + selfie upload */}
          <div>
            <div className="mb-3">
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-mute">
                Template reference
              </label>
              {template.signedUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={template.signedUrl}
                  alt={template.label}
                  className="w-full rounded-lg border border-pebble object-cover"
                />
              ) : (
                <div className="flex aspect-[4/5] items-center justify-center rounded-lg border border-pebble bg-ash text-[12px] text-mute">
                  no preview
                </div>
              )}
            </div>

            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-mute">
              Test selfie(s) <span className="text-dim">(up to 4 — face refs)</span>
            </label>
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              onChange={e => onFilesChange(e.target.files)}
              className="w-full text-[13px]"
              disabled={busy}
            />
            {files.length > 0 && (
              <ul className="mt-2 space-y-1 text-[11px] text-mute">
                {files.map((f, i) => (
                  <li key={i}>• {f.name} · {(f.size / 1024 / 1024).toFixed(2)} MB</li>
                ))}
              </ul>
            )}

            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={run}
                disabled={busy || files.length === 0}
                className="rounded-lg bg-void px-4 py-2 text-[12px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-wait"
              >
                {busy ? "Generating… (~10-30s)" : "Run test →"}
              </button>
              <span className="text-[11px] text-dim">
                Cost: ~$0.14 (Nano Banana Pro · 1K · refined)
              </span>
            </div>

            {error && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
                {error}
              </div>
            )}
          </div>

          {/* Right: result */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-mute">
              Result
            </label>
            {resultUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resultUrl}
                  alt="generation result"
                  className="w-full rounded-lg border border-pebble object-cover"
                />
                <div className="mt-2 flex items-center justify-between text-[11px] text-mute">
                  <span>{elapsedMs ? `Generated in ${(elapsedMs / 1000).toFixed(1)}s` : ""}</span>
                  <a
                    href={resultUrl}
                    download={`${template.slug}-test.jpg`}
                    className="font-semibold text-void hover:underline"
                  >
                    Download ↓
                  </a>
                </div>
                {promptUsed && (
                  <details className="mt-3 rounded-lg border border-pebble bg-ash/60 p-3 text-[12px]" open>
                    <summary className="cursor-pointer font-semibold text-void">
                      Prompt used <span className="font-normal text-mute">
                        ({promptSource === "fallback:buildPrompt"
                          ? "template body (refinement skipped)"
                          : `refined by ${promptSource}, ${promptUsed.length} chars`}
                        {promptFinishReason && promptFinishReason !== "STOP" && (
                          <span className="ml-1 text-amber-700">· finish={promptFinishReason}</span>
                        )})
                      </span>
                    </summary>
                    <pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-void">
{promptUsed}
                    </pre>
                  </details>
                )}
              </>
            ) : (
              <div className="flex aspect-[4/5] items-center justify-center rounded-lg border border-dashed border-pebble bg-ash text-[12px] text-mute">
                {busy ? "Refining prompt + generating…" : "Upload a selfie and hit Run."}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TemplateForm({
  existing,
  onClose,
  onDone,
}: {
  existing: Template | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const isEdit = !!existing;
  const [label, setLabel] = useState(existing?.label ?? "");
  const [slug, setSlug] = useState(existing?.slug ?? "");
  const [slugDirty, setSlugDirty] = useState(!!existing);
  const [prompt, setPrompt] = useState(existing?.prompt ?? PROMPT_TEMPLATE);
  const [active, setActive] = useState(existing?.active ?? true);
  const [sortOrder, setSortOrder] = useState(existing?.sortOrder ?? 0);
  const [image, setImage] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onLabelChange(v: string) {
    setLabel(v);
    if (!slugDirty) setSlug(labelToSlug(v));
  }

  const slugValid = SLUG_RE.test(slug) && slug.length >= 2 && slug.length <= 60;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!label.trim()) return setError("Label required.");
    if (!slugValid) return setError("Slug must be kebab-case (a-z0-9-), 2–60 chars.");
    if (!prompt.trim()) return setError("Prompt required.");
    if (!isEdit && !image) return setError("Reference image required.");

    setSubmitting(true);
    try {
      if (isEdit) {
        const res = await fetch(`/api/admin/dating/templates/${existing!.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ label, prompt, active, sort_order: sortOrder }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          setError(j.error ?? `HTTP ${res.status}`);
          return;
        }
      } else {
        const fd = new FormData();
        fd.set("label", label);
        fd.set("slug", slug);
        fd.set("prompt", prompt);
        fd.set("active", active ? "true" : "false");
        fd.set("sort_order", String(sortOrder));
        if (image) fd.set("image", image);
        const res = await fetch("/api/admin/dating/templates", {
          method: "POST",
          body: fd,
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          setError(j.error ?? `HTTP ${res.status}`);
          return;
        }
      }
      onDone();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6 backdrop-blur-sm">
      <form
        onSubmit={submit}
        className="mt-6 mb-10 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl text-void">
            {isEdit ? "Edit template" : "New template"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-[12px] font-semibold text-mute hover:bg-ash"
          >
            ✕ Close
          </button>
        </div>

        <div className="grid gap-4">
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-mute">Label</label>
            <input
              type="text"
              value={label}
              onChange={e => onLabelChange(e.target.value)}
              placeholder="Snorkel Selfie"
              className="w-full rounded-lg border border-pebble bg-white px-3 py-2 text-[14px]"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-mute">
              Slug {isEdit && <span className="text-dim">(immutable)</span>}
            </label>
            <input
              type="text"
              value={slug}
              onChange={e => { setSlug(e.target.value); setSlugDirty(true); }}
              disabled={isEdit}
              placeholder="snorkel-selfie"
              className={`w-full rounded-lg border ${slugValid ? "border-pebble" : "border-red-300"} bg-white px-3 py-2 font-mono text-[13px] disabled:bg-ash`}
            />
            {!slugValid && (
              <p className="mt-1 text-[11px] text-red-600">Kebab-case, a–z 0–9, 2–60 chars.</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-mute">
              Prompt <span className="text-dim">(body only — identity + hygiene clauses are added automatically)</span>
            </label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              rows={12}
              className="w-full rounded-lg border border-pebble bg-white px-3 py-2 font-mono text-[12px] leading-relaxed"
            />
          </div>

          {!isEdit && (
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-mute">
                Reference image <span className="text-dim">(JPEG/PNG/WebP, max 8 MB)</span>
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={e => setImage(e.target.files?.[0] ?? null)}
                className="w-full text-[13px]"
              />
              {image && (
                <p className="mt-1 text-[11px] text-mute">
                  {image.name} · {(image.size / 1024 / 1024).toFixed(2)} MB
                </p>
              )}
            </div>
          )}

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-[13px] text-void">
              <input
                type="checkbox"
                checked={active}
                onChange={e => setActive(e.target.checked)}
              />
              Active
            </label>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-mute">Sort order</label>
              <input
                type="number"
                value={sortOrder}
                onChange={e => setSortOrder(Number(e.target.value) || 0)}
                className="w-24 rounded-lg border border-pebble bg-white px-3 py-1.5 text-[13px]"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
              {error}
            </div>
          )}

          <div className="mt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-pebble bg-white px-4 py-2 text-[12px] font-semibold text-void hover:bg-ash"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-void px-4 py-2 text-[12px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? "Saving…" : isEdit ? "Save changes" : "Create template"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

const PROMPT_TEMPLATE = `Replace the man in the reference image with the man from the selfie photos.
Keep absolutely everything else identical to the reference image:
- Same body position and posture (describe: e.g. close-up selfie, facing camera)
- Same facial expression (e.g. neutral, direct gaze)
- Same accessories and gear (list what's in the ref: mask, necklace, clothing)
- Same background (describe: e.g. open sea, blue sky)
- Same framing and camera angle (e.g. tight selfie crop, eye level)
- Same lighting (e.g. bright natural sunlight)`;
