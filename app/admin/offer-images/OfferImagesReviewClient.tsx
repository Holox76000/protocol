"use client";

import { useState, useCallback } from "react";
import type { ComboStatus } from "./page";

type ImageFeedback = { rating: "ok" | "bad" | null; note: string };
type ComboFeedback = {
  status: "approved" | "needs_rework" | "rejected" | null;
  images: Record<string, ImageFeedback>;
  note: string;
};
type AllFeedback = Record<string, ComboFeedback>;

type ComboImages = {
  result1Before: string; result1After: string;
  result2Before: string; result2After: string;
  result3Before: string; result3After: string;
  portrait: string;
} | null;

const MORPHOLOGIES = ["Skinny", "Skinny-fat", "Overweight", "Average"];
const FILE_KEYS = [
  "result-1-before.png", "result-1-after.png",
  "result-2-before.png", "result-2-after.png",
  "result-3-before.png", "result-3-after.png",
  "portrait.png",
];
const PAIR_LABELS = ["Paire 1", "Paire 2", "Paire 3", "Portrait"];

const STATUS_COLORS: Record<string, string> = {
  approved: "bg-[#d4edda] text-[#2d6a4f]",
  needs_rework: "bg-[#fff3cd] text-[#856404]",
  rejected: "bg-[#f8d7da] text-[#721c24]",
};
const STATUS_LABELS: Record<string, string> = {
  approved: "✓ Approuvé",
  needs_rework: "⚠ À retravailler",
  rejected: "✗ Rejeté",
};

function defaultComboFeedback(): ComboFeedback {
  return { status: null, images: {}, note: "" };
}

function defaultImageFeedback(): ImageFeedback {
  return { rating: null, note: "" };
}

export default function OfferImagesReviewClient({
  combos,
  initialFeedback,
}: {
  combos: ComboStatus[];
  initialFeedback: Record<string, unknown>;
}) {
  const [feedback, setFeedback] = useState<AllFeedback>(initialFeedback as AllFeedback);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [images, setImages] = useState<Record<string, ComboImages>>({});
  const [loadingImages, setLoadingImages] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [filterMorphology, setFilterMorphology] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const toggleExpand = useCallback(async (key: string, cacheKey: string, ageBracket: string, morphology: string, ethnicity: string) => {
    const nowExpanded = !expanded[key];
    setExpanded((p) => ({ ...p, [key]: nowExpanded }));

    if (nowExpanded) {
      setLoadingImages((p) => ({ ...p, [key]: true }));
      try {
        const res = await fetch(
          `/api/offer/personalized-images?age_bracket=${encodeURIComponent(ageBracket)}&morphology=${encodeURIComponent(morphology)}&ethnicity=${encodeURIComponent(ethnicity)}&_t=${Date.now()}`
        );
        const data = await res.json();
        if (data.status === "done") {
          setImages((p) => ({
            ...p,
            [key]: {
              result1Before: data.result1Before,
              result1After: data.result1After,
              result2Before: data.result2Before,
              result2After: data.result2After,
              result3Before: data.result3Before,
              result3After: data.result3After,
              portrait: data.portrait,
            },
          }));
        }
      } finally {
        setLoadingImages((p) => ({ ...p, [key]: false }));
      }
    }
  }, [expanded, images]);

  const setImageRating = (cacheKey: string, file: string, rating: "ok" | "bad" | null) => {
    setFeedback((p) => ({
      ...p,
      [cacheKey]: {
        ...defaultComboFeedback(),
        ...p[cacheKey],
        images: {
          ...(p[cacheKey]?.images ?? {}),
          [file]: { ...defaultImageFeedback(), ...(p[cacheKey]?.images?.[file] ?? {}), rating },
        },
      },
    }));
  };

  const setImageNote = (cacheKey: string, file: string, note: string) => {
    setFeedback((p) => ({
      ...p,
      [cacheKey]: {
        ...defaultComboFeedback(),
        ...p[cacheKey],
        images: {
          ...(p[cacheKey]?.images ?? {}),
          [file]: { ...defaultImageFeedback(), ...(p[cacheKey]?.images?.[file] ?? {}), note },
        },
      },
    }));
  };

  const setComboStatus = (cacheKey: string, status: ComboFeedback["status"]) => {
    setFeedback((p) => ({
      ...p,
      [cacheKey]: { ...defaultComboFeedback(), ...p[cacheKey], status },
    }));
  };

  const setComboNote = (cacheKey: string, note: string) => {
    setFeedback((p) => ({
      ...p,
      [cacheKey]: { ...defaultComboFeedback(), ...p[cacheKey], note },
    }));
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      await fetch("/api/admin/offer-image-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(feedback),
      });
      setSavedAt(new Date().toLocaleTimeString("fr-FR"));
    } finally {
      setSaving(false);
    }
  };

  const filtered = combos.filter((c) => {
    if (filterMorphology !== "all" && c.morphology !== filterMorphology) return false;
    if (filterStatus === "done" && c.status !== "done") return false;
    if (filterStatus === "missing" && c.status !== "missing") return false;
    if (filterStatus === "approved" && feedback[c.cacheKey]?.status !== "approved") return false;
    if (filterStatus === "needs_rework" && feedback[c.cacheKey]?.status !== "needs_rework") return false;
    if (filterStatus === "rejected" && feedback[c.cacheKey]?.status !== "rejected") return false;
    if (filterStatus === "no_feedback" && feedback[c.cacheKey]?.status != null) return false;
    return true;
  });

  const grouped = MORPHOLOGIES.map((m) => ({
    morphology: m,
    combos: filtered.filter((c) => c.morphology === m),
  })).filter((g) => g.combos.length > 0);

  const approvedCount = combos.filter((c) => feedback[c.cacheKey]?.status === "approved").length;
  const needsReworkCount = combos.filter((c) => feedback[c.cacheKey]?.status === "needs_rework").length;
  const rejectedCount = combos.filter((c) => feedback[c.cacheKey]?.status === "rejected").length;
  const noFeedbackCount = combos.filter((c) => c.status === "done" && !feedback[c.cacheKey]?.status).length;

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-[12px] text-mute font-semibold uppercase tracking-wide">Morpho</label>
          <select
            value={filterMorphology}
            onChange={(e) => setFilterMorphology(e.target.value)}
            className="rounded border border-[#e5e5e5] bg-white px-2 py-1 text-[13px] text-void"
          >
            <option value="all">Toutes</option>
            {MORPHOLOGIES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[12px] text-mute font-semibold uppercase tracking-wide">Statut</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded border border-[#e5e5e5] bg-white px-2 py-1 text-[13px] text-void"
          >
            <option value="all">Tous</option>
            <option value="done">Générées ({combos.filter(c => c.status === "done").length})</option>
            <option value="missing">Manquantes ({combos.filter(c => c.status === "missing").length})</option>
            <option value="no_feedback">Sans feedback ({noFeedbackCount})</option>
            <option value="approved">Approuvées ({approvedCount})</option>
            <option value="needs_rework">À retravailler ({needsReworkCount})</option>
            <option value="rejected">Rejetées ({rejectedCount})</option>
          </select>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {savedAt && <span className="text-[12px] text-dim">Sauvegardé à {savedAt}</span>}
          <button
            onClick={saveAll}
            disabled={saving}
            className="rounded bg-void px-4 py-1.5 text-[13px] font-semibold text-white hover:bg-[#1a1a1a] disabled:opacity-50 transition-colors"
          >
            {saving ? "Sauvegarde…" : "Sauvegarder"}
          </button>
        </div>
      </div>

      {/* Groups */}
      {grouped.map(({ morphology, combos: groupCombos }) => (
        <div key={morphology} className="mb-8">
          <h2 className="mb-3 font-display text-xl text-void">{morphology}</h2>
          <div className="space-y-2">
            {groupCombos.map((combo) => {
              const key = combo.cacheKey;
              const cf = feedback[key];
              const isExpanded = expanded[key];
              const comboImages = images[key];
              const isLoading = loadingImages[key];

              return (
                <div key={key} className="rounded-lg border border-[#e5e5e5] bg-white overflow-hidden">
                  {/* Header row */}
                  <button
                    onClick={() => toggleExpand(key, combo.cacheKey, combo.ageBracket, combo.morphology, combo.ethnicity)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#fafafa] transition-colors"
                  >
                    {/* Status dot */}
                    <span className={`h-2 w-2 rounded-full flex-shrink-0 ${
                      combo.status === "done" ? "bg-[#4a7a5e]" :
                      combo.status === "partial" ? "bg-[#c8a44a]" : "bg-[#c85a5a]"
                    }`} />

                    <span className="text-[14px] font-semibold text-void flex-1">
                      {combo.ethnicity} · {combo.ageBracket}
                    </span>

                    {/* Feedback status badge */}
                    {cf?.status && (
                      <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${STATUS_COLORS[cf.status]}`}>
                        {STATUS_LABELS[cf.status]}
                      </span>
                    )}

                    {combo.status !== "done" && (
                      <span className="text-[11px] text-dim">
                        {combo.status === "missing" ? "Non générée" : `${combo.existingFiles.length}/7 fichiers`}
                      </span>
                    )}

                    <span className="text-[12px] text-mute ml-2">{isExpanded ? "▲" : "▼"}</span>
                  </button>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="border-t border-[#f0f0f0] px-4 py-4">
                      {isLoading && (
                        <p className="text-[13px] text-dim text-center py-8">Chargement des images…</p>
                      )}

                      {!isLoading && !comboImages && combo.status !== "done" && (
                        <p className="text-[13px] text-dim text-center py-8">Images non générées pour cette combinaison.</p>
                      )}

                      {!isLoading && comboImages && (
                        <>
                          {/* Images grid: 3 pairs + portrait */}
                          <div className="flex gap-4 overflow-x-auto pb-2">
                            {/* Pair 1 */}
                            {[
                              { label: "Paire 1 — Avant", file: "result-1-before.png", src: comboImages.result1Before },
                              { label: "Paire 1 — Après", file: "result-1-after.png", src: comboImages.result1After },
                              { label: "Paire 2 — Avant", file: "result-2-before.png", src: comboImages.result2Before },
                              { label: "Paire 2 — Après", file: "result-2-after.png", src: comboImages.result2After },
                              { label: "Paire 3 — Avant", file: "result-3-before.png", src: comboImages.result3Before },
                              { label: "Paire 3 — Après", file: "result-3-after.png", src: comboImages.result3After },
                              { label: "Portrait", file: "portrait.png", src: comboImages.portrait },
                            ].map(({ label, file, src }) => {
                              const imgFeedback = cf?.images?.[file] ?? defaultImageFeedback();
                              return (
                                <div key={file} className="flex-shrink-0 w-[130px]">
                                  <p className="mb-1 text-[10px] font-semibold text-mute uppercase tracking-wide truncate">{label}</p>
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={`${src}?_t=${Date.now()}`}
                                    alt={label}
                                    className="w-full rounded object-cover bg-[#f5f5f5]"
                                    style={{ aspectRatio: "3/4" }}
                                  />
                                  {/* Rating buttons */}
                                  <div className="mt-1.5 flex gap-1">
                                    <button
                                      onClick={() => setImageRating(key, file, imgFeedback.rating === "ok" ? null : "ok")}
                                      className={`flex-1 rounded py-1 text-[13px] transition-colors ${
                                        imgFeedback.rating === "ok"
                                          ? "bg-[#d4edda] text-[#2d6a4f]"
                                          : "bg-[#f5f5f5] text-dim hover:bg-[#eee]"
                                      }`}
                                    >
                                      👍
                                    </button>
                                    <button
                                      onClick={() => setImageRating(key, file, imgFeedback.rating === "bad" ? null : "bad")}
                                      className={`flex-1 rounded py-1 text-[13px] transition-colors ${
                                        imgFeedback.rating === "bad"
                                          ? "bg-[#f8d7da] text-[#721c24]"
                                          : "bg-[#f5f5f5] text-dim hover:bg-[#eee]"
                                      }`}
                                    >
                                      👎
                                    </button>
                                  </div>
                                  <textarea
                                    value={imgFeedback.note}
                                    onChange={(e) => setImageNote(key, file, e.target.value)}
                                    placeholder="Note…"
                                    rows={2}
                                    className="mt-1 w-full resize-none rounded border border-[#e5e5e5] px-2 py-1 text-[11px] text-void placeholder:text-dim focus:outline-none focus:border-void"
                                  />
                                </div>
                              );
                            })}
                          </div>

                          {/* Combo-level feedback */}
                          <div className="mt-4 flex flex-wrap items-start gap-3 border-t border-[#f0f0f0] pt-4">
                            <div className="flex gap-2">
                              {(["approved", "needs_rework", "rejected"] as const).map((s) => (
                                <button
                                  key={s}
                                  onClick={() => setComboStatus(key, cf?.status === s ? null : s)}
                                  className={`rounded px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                                    cf?.status === s
                                      ? STATUS_COLORS[s]
                                      : "bg-[#f5f5f5] text-mute hover:bg-[#eee]"
                                  }`}
                                >
                                  {STATUS_LABELS[s]}
                                </button>
                              ))}
                            </div>
                            <textarea
                              value={cf?.note ?? ""}
                              onChange={(e) => setComboNote(key, e.target.value)}
                              placeholder="Note générale sur cette combinaison…"
                              rows={2}
                              className="flex-1 min-w-[200px] resize-none rounded border border-[#e5e5e5] px-3 py-1.5 text-[12px] text-void placeholder:text-dim focus:outline-none focus:border-void"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <p className="text-center text-[13px] text-dim py-16">Aucune combinaison pour ces filtres.</p>
      )}
    </div>
  );
}
