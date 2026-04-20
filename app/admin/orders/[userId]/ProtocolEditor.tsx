"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import type { CalibrationMetrics } from "./PhotoCalibrator";

const ProtocolView = dynamic(() => import("../../../protocol/ProtocolView"), { ssr: false });

/* ─── Types ─────────────────────────────────────────────────────────────────── */

export type ProtocolQuestionnaire = {
  firstName?:           string;
  goal?:                string;
  age?:                 number;
  height_cm?:           number;
  weight_kg?:           number;
  trainingExperience?:  string;
  trainingLocation?:    string;
  sessionsPerWeek?:     number;
  preferredActivities?: string[];
  concernAreas?:        string[];
  professionalEnv?:     string;
  injuries?:            string[];
  dietaryProfile?:      string;
  sleepHours?:          string;
  stressLevel?:         number;
};

/* ─── Template generation ──────────────────────────────────────────────────── */

const RANGES: Record<keyof CalibrationMetrics, [number, number]> = {
  swr: [1.41, 1.63], cwr: [1.25, 1.35], bf: [10, 17],
  pas: [80,   95  ], ti:  [1.1,  1.5 ], pc: [75, 95],
};

const METRIC_META: Record<keyof CalibrationMetrics, {
  fullName:     string;
  abbr:         string;
  modifiability: number;
  goalBoost?:   Record<string, number>;
}> = {
  bf:  { fullName: "Body Fat",              abbr: "BF%", modifiability: 0.95, goalBoost: { reshape: 1.4, full_transformation: 1.2 } },
  swr: { fullName: "Shoulder-Waist Ratio",  abbr: "SWR", modifiability: 0.85, goalBoost: { sharpen_proportions: 1.3, build_muscle: 1.2 } },
  cwr: { fullName: "Chest-Waist Ratio",     abbr: "CWR", modifiability: 0.75, goalBoost: { build_muscle: 1.3, sharpen_proportions: 1.1 } },
  ti:  { fullName: "Taper Index",           abbr: "TI",  modifiability: 0.70, goalBoost: { sharpen_proportions: 1.2, full_transformation: 1.1 } },
  pas: { fullName: "Posture Alignment",     abbr: "PAS", modifiability: 0.65, goalBoost: { improve_posture: 1.5, full_transformation: 1.1 } },
  pc:  { fullName: "Proportion Coherence",  abbr: "PC",  modifiability: 0.40 },
};

const GOAL_LABELS: Record<string, string> = {
  sharpen_proportions: "Affiner les proportions",
  build_muscle:        "Construire du muscle",
  reshape:             "Recomposition corporelle",
  improve_posture:     "Améliorer la posture",
  full_transformation: "Transformation complète",
};

const EXPERIENCE_LABELS: Record<string, string> = {
  beginner:     "Débutant",
  novice:       "Novice",
  intermediate: "Intermédiaire",
  experienced:  "Confirmé",
  advanced:     "Avancé",
};

const LOCATION_LABELS: Record<string, string> = {
  commercial_gym: "salle commerciale",
  home_gym:       "home gym",
  bodyweight:     "poids du corps",
  outdoor:        "outdoor",
  mixed:          "mixte",
};

const INJURY_NOTES: Record<string, string> = {
  shoulder:   "Éviter élévations latérales lourdes et dips. Prioriser rotateurs externes, press à angle neutre.",
  lower_back: "Éviter deadlift conventionnel lourd. Renforcer érecteurs + fessiers progressivement.",
  knee:       "Limiter flexion profonde sous charge. Prioriser chaîne postérieure (hip hinge).",
  hip:        "Mobilité de hanche avant chaque séance. Éviter squats profonds initialement.",
  elbow:      "Réduire volume biceps/triceps. Renforcer avant-bras, prises neutres en traction.",
  wrist:      "Remplacer prise pronation par prise neutre sur tous les mouvements de presse.",
  ankle:      "Éviter sauts et sprints. Proprioception et renforcement mollet en priorité.",
  neck:       "Stretching cervical quotidien. Éviter shrugs lourds. Corriger posture crânio-cervicale.",
};

function computePriority(key: keyof CalibrationMetrics, value: number, goal?: string): number {
  const [min, max] = RANGES[key];
  const meta = METRIC_META[key];
  let gap = 0;
  if (value < min) gap = (min - value) / (max - min);
  else if (value > max) gap = (value - max) / (max - min);
  const goalMult: number = (goal ? (meta.goalBoost?.[goal] ?? 1.0) : 1.0);
  return gap * meta.modifiability * goalMult;
}

function gapDescription(key: keyof CalibrationMetrics, value: number): string {
  const [min, max] = RANGES[key];
  if (value >= min && value <= max) return "Dans la zone optimale — maintenir";
  if (key === "bf") {
    if (value < min) return `${min - value}% sous le plancher`;
    return `+${Math.round(value - max)}% au-dessus de la cible`;
  }
  if (value < min) return `+${(min - value).toFixed(2)} à combler`;
  return `${(value - max).toFixed(2)} au-dessus du plafond`;
}

function twelveWeekTarget(key: keyof CalibrationMetrics, value: number): string {
  const [min, max] = RANGES[key];
  if (value >= min && value <= max) return "Maintenir";
  if (key === "bf") {
    const target = Math.max(min, value - 4);
    return `~${Math.round(target)}% (−${Math.round(value - target)} pts)`;
  }
  if (key === "pas" || key === "pc") {
    if (value < min) {
      const target = Math.min((min + max) / 2, value + 10);
      return `${Math.round(target)} (+${Math.round(target - value)} pts)`;
    }
    return "Maintenir";
  }
  if (value < min) {
    const step = Math.min(min - value, (max - min) * 0.6);
    return `${(value + step).toFixed(2)} (+${step.toFixed(2)})`;
  }
  return `${(value - (value - max) * 0.5).toFixed(2)}`;
}

function bfTargetByAge(age?: number): string {
  if (!age) return "10–17%";
  if (age < 30) return "10–14%";
  if (age <= 45) return "12–16%";
  return "14–18%";
}

function fmt(key: keyof CalibrationMetrics, v: number): string {
  if (key === "bf") return `${v}%`;
  if (key === "pas" || key === "pc") return `${v}/100`;
  return String(v);
}

function fmtRange(key: keyof CalibrationMetrics): string {
  const [min, max] = RANGES[key];
  if (key === "bf") return `${min}–${max}%`;
  if (key === "pas" || key === "pc") return `${min}–${max}`;
  return `${min}–${max}`;
}

function buildTemplate(
  metrics: CalibrationMetrics | null,
  qr?: ProtocolQuestionnaire,
): string {
  const name       = qr?.firstName ?? "Client";
  const goalLabel  = qr?.goal ? (GOAL_LABELS[qr.goal] ?? qr.goal) : null;
  const expLabel   = qr?.trainingExperience ? (EXPERIENCE_LABELS[qr.trainingExperience] ?? qr.trainingExperience) : null;
  const locLabel   = qr?.trainingLocation   ? (LOCATION_LABELS[qr.trainingLocation]     ?? qr.trainingLocation)   : null;
  const injuries   = (qr?.injuries ?? []).filter(i => i !== "none");
  const isPro      = ["corporate", "public_facing", "entrepreneur"].includes(qr?.professionalEnv ?? "");

  const profileParts = [
    goalLabel,
    qr?.age     ? `${qr.age} ans`                        : null,
    qr?.height_cm && qr?.weight_kg
      ? `${qr.height_cm} cm / ${qr.weight_kg} kg`        : null,
    expLabel,
  ].filter(Boolean);

  let out = `# Attractiveness Protocol™ — ${name}\n\n`;
  if (profileParts.length) out += `**Profil :** ${profileParts.join(" · ")}\n\n`;
  out += `---\n\n`;

  /* ── Métriques ─────────────────────────────────────────────────────────── */
  out += `## Métriques & Analyse\n\n`;

  if (!metrics) {
    out += `> *Calibration non effectuée — à compléter après la session photo.*\n\n`;
    out += `---\n\n`;
  } else {
    const sortedKeys = (Object.keys(metrics) as (keyof CalibrationMetrics)[])
      .sort((a, b) =>
        computePriority(b, metrics[b], qr?.goal) -
        computePriority(a, metrics[a], qr?.goal),
      );

    out += `| Métrique | Valeur | Optimal | Écart |\n`;
    out += `|---|---|---|---|\n`;
    for (const key of sortedKeys) {
      const v      = metrics[key];
      const [mn, mx] = RANGES[key];
      const arrow  = v < mn ? "↑" : v > mx ? "↓" : "✓";
      out += `| ${METRIC_META[key].fullName} (${METRIC_META[key].abbr}) | ${fmt(key, v)} | ${fmtRange(key)} | ${arrow} ${gapDescription(key, v)} |\n`;
    }
    out += `\n---\n\n`;

    out += `## Analyse par variable\n\n`;
    for (const key of sortedKeys) {
      const v        = metrics[key];
      const priority = computePriority(v === metrics[key] ? key : key, v, qr?.goal);
      // priority tag
      let tag: string;
      if (priority > 0.5)      tag = "PRIORITÉ HAUTE";
      else if (priority > 0.2) tag = "PRIORITÉ MODÉRÉE";
      else                     tag = "À MAINTENIR";

      out += `### ${METRIC_META[key].fullName} (${METRIC_META[key].abbr}) — ${tag}\n\n`;
      out += `| | |\n|---|---|\n`;
      out += `| **Valeur mesurée** | ${fmt(key, v)} |\n`;
      out += `| **Zone optimale** | ${fmtRange(key)} |\n`;
      out += `| **Écart** | ${gapDescription(key, v)} |\n`;
      out += `| **Objectif 12 semaines** | ${twelveWeekTarget(key, v)} |\n`;
      out += `\n> *(note coach)*\n\n`;
    }
    out += `---\n\n`;
  }

  /* ── Plan d'action ─────────────────────────────────────────────────────── */
  out += `## Plan d'action\n\n`;

  /* Entraînement */
  out += `### Entraînement\n`;
  const trainingCtx: string[] = [];
  if (locLabel)              trainingCtx.push(locLabel);
  if (qr?.sessionsPerWeek)   trainingCtx.push(`${qr.sessionsPerWeek} séances/semaine`);
  if (trainingCtx.length)    out += `*${trainingCtx.join(" · ")}*\n\n`;

  if (metrics) {
    const swrP = computePriority("swr", metrics.swr, qr?.goal);
    const cwrP = computePriority("cwr", metrics.cwr, qr?.goal);
    const tiP  = computePriority("ti",  metrics.ti,  qr?.goal);
    const pasP = computePriority("pas", metrics.pas, qr?.goal);

    if (swrP > 0.1 || cwrP > 0.1) {
      out += `**Développement du haut du corps**\n`;
      out += `- Shoulder press + élévations latérales → élargir SWR\n`;
      out += `- Développé incliné + dips → CWR et projection du buste\n`;
      out += `- Tirage horizontal (rowing) + vertical (tractions) → épaisseur dorsale\n\n`;
    }
    if (tiP > 0.1) {
      out += `**Taper Index — évasement dorsal**\n`;
      out += `- Lat pulldown prise large + pull-ups à chaque séance\n`;
      out += `- Éviter les exercices qui élargissent la ceinture abdominale sous charge lourde\n\n`;
    }
    if (pasP > 0.1) {
      out += `**Posture & Alignement**\n`;
      out += `- Face pulls + rotation externe (bande élastique) à chaque séance d'upper body\n`;
      out += `- Stretching pectoraux + hip flexors quotidien (surtout si travail assis)\n`;
      if (isPro) out += `- En réunion/debout : aligner oreille–épaule–hanche — impact direct sur la perception d'autorité\n`;
      out += `\n`;
    }
    if (swrP <= 0.1 && cwrP <= 0.1 && tiP <= 0.1 && pasP <= 0.1) {
      out += `- Métriques dans la zone optimale — plan de maintenance progressive\n`;
      out += `- Continuer le volume actuel avec progression de charge douce (+2–5% toutes les 2 semaines)\n\n`;
    }
  } else {
    out += `- *À adapter après calibration*\n\n`;
  }

  if (injuries.length > 0) {
    out += `**Contra-indications (blessures déclarées)**\n`;
    for (const injury of injuries) {
      const note = INJURY_NOTES[injury as keyof typeof INJURY_NOTES];
      if (note) out += `- **${injury.replace("_", " ")}** : ${note}\n`;
    }
    out += `\n`;
  }

  /* Nutrition */
  out += `### Nutrition\n`;
  const bfTarget = bfTargetByAge(qr?.age);
  const bfPriority = metrics ? computePriority("bf", metrics.bf, qr?.goal) : 0;

  if (bfPriority > 0.05) {
    out += `**Cible BF% : ${bfTarget}**\n`;
    out += `- Déficit calorique modéré (200–350 kcal/j) — éviter le déficit agressif pour préserver le muscle\n`;
    out += `- Protéines : 2.0–2.2 g/kg de poids corporel\n`;
    out += `- Fenêtre post-entraînement : 30–50 g de protéines dans les 90 min\n`;
    if (qr?.dietaryProfile) out += `- Profil alimentaire déclaré : *${qr.dietaryProfile}* — adapter les sources protéiques en conséquence\n`;
  } else {
    out += `- BF% dans la zone cible — maintenir les apports actuels\n`;
    out += `- Protéines : 1.8–2.2 g/kg pour soutenir la synthèse musculaire en phase de construction\n`;
    out += `- Légère surcharge calorique possible (+150–250 kcal/j) si objectif prise de masse\n`;
  }
  out += `\n`;

  /* Récupération */
  out += `### Récupération\n`;
  if (qr?.sleepHours) {
    const poor = ["less_than_6", "6"].includes(qr.sleepHours);
    if (poor) {
      out += `- **Sommeil insuffisant détecté** — prioriser +1h/nuit. Impact direct : testostérone, GH, rétention de graisse viscérale.\n`;
    } else {
      out += `- Sommeil dans la norme — maintenir la régularité des horaires d'endormissement.\n`;
    }
  } else {
    out += `- Viser 7–9h de sommeil par nuit, horaires réguliers\n`;
  }
  if (qr?.stressLevel && qr.stressLevel >= 7) {
    out += `- **Stress élevé (${qr.stressLevel}/10)** — cortisol chronique : résistance à la lipolyse + catabolisme musculaire. Intégrer 20–30 min de zone 2 (marche rapide, vélo lent) les jours off.\n`;
  }
  out += `\n`;

  /* 12-week summary */
  if (metrics) {
    out += `### Objectifs 12 semaines\n\n`;
    out += `| Variable | Actuel | Cible 12 sem. | Zone optimale |\n`;
    out += `|---|---|---|---|\n`;
    for (const key of Object.keys(metrics) as (keyof CalibrationMetrics)[]) {
      const v = metrics[key];
      out += `| ${METRIC_META[key].fullName} | ${fmt(key, v)} | ${twelveWeekTarget(key, v)} | ${fmtRange(key)} |\n`;
    }
    out += `\n`;
  }

  return out;
}

/* ─── Component ────────────────────────────────────────────────────────────── */

type Props = {
  userId:         string;
  initialContent: string;
  initialStatus:  string;
  metrics?:       CalibrationMetrics | null;
  questionnaire?: ProtocolQuestionnaire;
};

export default function ProtocolEditor({
  userId,
  initialContent,
  initialStatus,
  metrics,
  questionnaire,
}: Props) {
  const [content,        setContent]        = useState(initialContent);
  const [status,         setStatus]         = useState(initialStatus);
  const [mode,           setMode]           = useState<"edit" | "preview">("edit");
  const [saving,         setSaving]         = useState(false);
  const [delivering,     setDelivering]     = useState(false);
  const [savedAt,        setSavedAt]        = useState<Date | null>(null);
  const [confirmDeliver, setConfirmDeliver] = useState(false);
  const [confirmRegen,   setConfirmRegen]   = useState(false);
  const [error,          setError]          = useState<string | null>(null);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${userId}/protocol`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        setError(d.error ?? "Save failed.");
      } else {
        setSavedAt(new Date());
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [content, userId]);

  const handleDeliver = useCallback(async () => {
    if (!confirmDeliver) {
      setConfirmDeliver(true);
      setTimeout(() => setConfirmDeliver(false), 4000);
      return;
    }
    setDelivering(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${userId}/deliver`, { method: "POST" });
      const d = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(d.error ?? "Delivery failed.");
      } else {
        setStatus("delivered");
        setConfirmDeliver(false);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setDelivering(false);
    }
  }, [confirmDeliver, userId]);

  const isDelivered   = status === "delivered";
  const isEmpty       = !content.trim();
  const templateLabel = metrics ? "Use calibration" : "Use template";

  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-mute">Protocol</p>
        <div className="flex items-center gap-3">
          {savedAt && !isDelivered && (
            <p className="text-[11px] text-emerald-600">
              Saved {savedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
          {isDelivered && (
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-emerald-700">
              Delivered
            </span>
          )}
          {!isDelivered && isEmpty && (
            <button
              onClick={() => setContent(buildTemplate(metrics ?? null, questionnaire))}
              className="px-3 py-1 text-[11px] font-semibold text-violet-700 transition-colors hover:text-violet-900"
            >
              {templateLabel}
            </button>
          )}
          {!isDelivered && !isEmpty && metrics && (
            <button
              onClick={() => {
                if (!confirmRegen) {
                  setConfirmRegen(true);
                  setTimeout(() => setConfirmRegen(false), 3500);
                  return;
                }
                setContent(buildTemplate(metrics, questionnaire));
                setConfirmRegen(false);
              }}
              className={`px-3 py-1 text-[11px] font-semibold transition-colors ${
                confirmRegen
                  ? "text-red-600 hover:text-red-800"
                  : "text-mute hover:text-void"
              }`}
            >
              {confirmRegen ? "Confirm — replaces content" : "↺ Regenerate"}
            </button>
          )}
          {/* Edit / Preview toggle */}
          <div className="flex overflow-hidden rounded-lg border border-wire">
            {(["edit", "preview"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-1 text-[11px] font-semibold capitalize transition-colors ${
                  mode === m ? "bg-void text-white" : "bg-white text-dim hover:bg-ash"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Editor */}
      {mode === "edit" ? (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isDelivered}
          placeholder="Write the protocol in Markdown…&#10;&#10;# Analyse&#10;## Plan nutrition&#10;## Plan training"
          className="w-full rounded-xl border border-wire bg-ash p-4 font-mono text-[12.5px] leading-relaxed text-void placeholder:text-mute/60 focus:border-void focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          style={{ minHeight: "480px", resize: "vertical" }}
        />
      ) : (
        <div
          className="w-full overflow-y-auto rounded-xl border border-wire bg-white p-5"
          style={{ minHeight: "480px" }}
        >
          {content.trim() ? (
            <ProtocolView content={content} />
          ) : (
            <p className="text-[13px] text-mute">Nothing to preview yet.</p>
          )}
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-[12px] text-red-600">{error}</p>
      )}

      <div className="flex flex-col gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex w-full items-center justify-center rounded-lg border border-wire bg-white px-4 py-2.5 text-[12px] font-semibold text-void transition-colors hover:bg-ash disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save draft"}
        </button>

        <button
          onClick={handleDeliver}
          disabled={delivering}
          className={`flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-[12px] font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
            confirmDeliver
              ? "bg-red-600 text-white hover:bg-red-700"
              : "bg-void text-white hover:bg-[#1a1a1b]"
          }`}
        >
          {delivering
            ? "Delivering…"
            : confirmDeliver
            ? "Confirm — this will notify the client"
            : isDelivered
            ? "Re-deliver"
            : "Mark as delivered"}
        </button>
      </div>
    </div>
  );
}
