import type { Metadata } from "next";
import { SectionShell } from "../../components/landing/SectionShell";
import { StatList } from "../../components/landing/StatList";
import { ThreeColumn } from "../../components/landing/ThreeColumn";
import { Marquee } from "../../components/landing/Marquee";
import { SplitFeature } from "../../components/landing/SplitFeature";
import { Testimonials } from "../../components/landing/Testimonials";
import { WhoFor } from "../../components/landing/WhoFor";
import { ProcessSteps } from "../../components/landing/ProcessSteps";
import { FAQ } from "../../components/landing/FAQ";
import { StickyCta } from "../../components/landing/StickyCta";

export const metadata: Metadata = {
  title: "Protocol | The 30-Day Recomp Reset (Coached Edition)",
  description:
    "A premium 30-day transformation for men stuck between cutting and bulking. Calibrated training, nutrition, and execution support."
};

const frustrations = [
  "You train consistently but still look soft.",
  "Cutting makes you smaller, bulking makes you thicker in the waist.",
  "You do more cardio, but the mirror doesn’t change.",
  "You feel stuck, unsure of the next move."
];

const testimonials = [
  {
    quote: "Dropped 4 cm off my waist and finally saw shoulder lines.",
    name: "Alex M., 31",
    result: "-4 cm waist",
    image: "/1.webp"
  },
  {
    quote: "Stopped spinning my wheels. Clear plan, weekly targets, real change.",
    name: "Damien R., 28",
    result: "+2 kg lean mass",
    image: "/2.jpeg"
  },
  {
    quote: "Structure + accountability made the difference. I feel in control again.",
    name: "Julien P., 34",
    result: "Visible recomposition",
    image: "/3.jpeg"
  }
];

const rootCauses = [
  {
    title: "Over-Cardio",
    body: "High volume cardio without the right training signal keeps you flat and drains recovery."
  },
  {
    title: "No Progressive Overload",
    body: "Without measurable strength increases, your body has no reason to build muscle."
  },
  {
    title: "Nutrition Miscalibration",
    body: "Eating clean isn’t the same as eating for recomposition. Precision matters."
  }
];

const includedItems = [
  {
    title: "Daily Coach Check-Ins",
    detail: "A real coach follows up every day. No AI. No automation."
  },
  {
    title: "Personalized Nutrition Plan",
    detail: "Built for your body, schedule, and goals."
  },
  {
    title: "Personalized Training Plan",
    detail: "Progressive plan calibrated to your current level."
  },
  {
    title: "Supplements Delivered",
    detail: "Supplements shipped to your door with a simple protocol."
  },
  {
    title: "Video Walkthroughs",
    detail: "Short, clear videos on how to execute each step."
  },
  {
    title: "Sleep & Recovery Optimization",
    detail: "Better sleep signals faster, leaner progress."
  }
];

const whoFor = [
  "You train but still feel soft or undefined.",
  "You’re stuck between cutting and bulking.",
  "You want a clear 30-day execution plan.",
  "You want daily coaching and accountability."
];

const notFor = [
  "You’re looking for a quick trick or hack.",
  "You won’t follow a structured plan.",
  "You want extreme bulking or cutting.",
  "You’re not ready to track progress."
];

const processSteps = ["Apply", "Calibrate", "Execute"];

const faqItems = [
  {
    question: "How much time does it take each week?",
    answer: "Most clients train 4x/week with 60-minute sessions. Coaching is unlimited."
  },
  {
    question: "Do I need a full gym?",
    answer: "A standard gym setup is ideal. We can adjust to limited equipment if needed."
  },
  {
    question: "What if I’m new to structured training?",
    answer: "That’s exactly who this is for. We keep it simple, progressive, and measurable."
  },
  {
    question: "Will I have to track everything I eat?",
    answer: "We calibrate nutrition without obsessive tracking. You’ll get a clear plan and adjustments."
  },
  {
    question: "What kind of support do I get?",
    answer: "Unlimited coaching with daily access, plus clear targets for training, nutrition, sleep, and supplements."
  },
  {
    question: "Is this AI or automated?",
    answer: "No. You’re supported by real coaches who follow up daily and adjust your plan."
  }
];

export default function ProgramPage() {
  return (
    <main className="bg-white text-black">
      <SectionShell className="relative overflow-hidden bg-grid" ghost="Protocol" sparkle>
        <div className="pointer-events-none absolute inset-0 opacity-[0.08]">
          <div
            className="h-full w-full"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1526481280695-3c687fd643ed?auto=format&fit=crop&w=1600&q=80')",
              backgroundSize: "cover",
              backgroundPosition: "center"
            }}
          />
        </div>
        <div className="relative grid items-center gap-10 md:grid-cols-[1.2fr_0.8fr]">
          <div className="fade-in">
            <p className="text-xs uppercase tracking-[0.5em] text-black/60">Protocol Presents</p>
            <h1 className="mt-6 text-4xl font-display font-semibold uppercase tracking-[0.12em] md:text-6xl">
              Still Skinny-Fat… Even Though You Train?
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-black/70">
              You don’t need more discipline. You need a calibrated strategy.
            </p>
            <p className="mt-4 text-base text-black/70">
              You’ve done the work. The strategy is what’s miscalibrated.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <a
                href="https://buy.stripe.com/00weVd8dVdoG0LVbv4ebu00"
                className="inline-flex items-center justify-center border border-black bg-black px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white shadow-hard ring-2 ring-black/70 ring-offset-2 ring-offset-white transition hover:bg-white hover:text-black"
              >
                Apply Now
              </a>
              <a
                href="#problem"
                className="inline-flex items-center justify-center border border-black px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-black hover:text-white"
              >
                See The Framework
              </a>
            </div>
          </div>
          <div className="fade-in">
            <div className="card-raise overflow-hidden rounded-[32px] border border-black/20 bg-white shadow-soft">
              <div className="aspect-[4/3] w-full">
                <img
                  src="https://skinnyfattransformation.com/wp-content/uploads/2023/11/Daniel-Ngan-skinny-fat-transformation.jpeg"
                  alt="Marble statue torso"
                  className="h-full w-full object-cover object-[center_20%] grayscale"
                />
              </div>
            </div>
            <p className="mt-4 text-xs uppercase tracking-[0.35em] text-black/60">
              Discipline. Structure. Execution.
            </p>
          </div>
        </div>
      </SectionShell>

      <Marquee
        items={[
          "CALIBRATED TRAINING",
          "HOLISTIC COACHING",
          "SLEEP & RECOVERY",
          "SUPPLEMENT OPTIMIZATION",
          "UNLIMITED COACHING",
          "PROTOCOL DISCIPLINE"
        ]}
      />

      <SectionShell id="problem" className="bg-white">
        <div className="mx-auto max-w-3xl text-center fade-in">
          <h2 className="text-3xl font-display font-semibold uppercase tracking-[0.18em]">
            The Frustration Is Real
          </h2>
          <p className="mt-6 text-lg text-black/70">
            You’re not lazy. You’re not broken. You’re just running a strategy built for someone else.
          </p>
        </div>
        <StatList items={frustrations} />
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="card-raise rounded-3xl border border-black/15 bg-white p-6">
            <p className="text-xs uppercase tracking-[0.35em] text-black/60">Proof</p>
            <p className="mt-4 text-lg text-black/80">
              Clients report tighter waists, stronger lifts, and a body that finally looks trained.
            </p>
          </div>
          <div className="card-raise rounded-3xl border border-black/15 bg-black p-6 text-white">
            <p className="text-xs uppercase tracking-[0.35em] text-white/70">What Changes</p>
            <p className="mt-4 text-lg text-white/80">
              Daily coaching removes guesswork. Your nutrition, training, and recovery are aligned to one goal.
            </p>
          </div>
        </div>
      </SectionShell>

      <SectionShell className="bg-black text-white bg-grid-dark" tone="dark">
        <div className="mx-auto max-w-3xl text-center fade-in">
          <p className="text-xs uppercase tracking-[0.5em] text-white/70">Proof</p>
          <h2 className="mt-4 text-3xl font-display font-semibold uppercase tracking-[0.18em]">
            Real Outcomes From Real Clients
          </h2>
          <p className="mt-4 text-base text-white/75">
            Results from men who were stuck in the same loop.
          </p>
        </div>
        <div className="mt-10">
          <Testimonials items={testimonials} />
        </div>
      </SectionShell>

      <SectionShell>
        <div className="max-w-3xl fade-in">
          <h2 className="text-3xl font-display font-semibold uppercase tracking-[0.18em]">
            The Real Problem
          </h2>
          <p className="mt-4 text-lg text-black/70">
            Skinny-fat isn’t about effort. It’s about the wrong plan and no clear structure.
          </p>
        </div>
        <ThreeColumn items={rootCauses} />
        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <a
            href="https://buy.stripe.com/00weVd8dVdoG0LVbv4ebu00"
            className="inline-flex items-center justify-center border border-black bg-black px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white shadow-hard ring-2 ring-black/70 ring-offset-2 ring-offset-white transition hover:bg-white hover:text-black"
          >
            Apply Now
          </a>
        </div>
      </SectionShell>

      <SectionShell className="bg-black text-white bg-grid-dark" tone="dark">
        <div className="max-w-3xl fade-in">
          <p className="text-xs uppercase tracking-[0.5em] text-white/70">The Solution</p>
          <h2 className="mt-4 text-3xl font-display font-semibold uppercase tracking-[0.18em]">
            The 30-Day Recomp Reset
          </h2>
          <p className="mt-6 text-lg text-white/75">
            A holistic 30-day coaching program with real coaches who follow up daily. You get a personalized
            training plan, personalized nutrition plan, sleep optimization, supplement delivery, and daily
            execution guidance — built like an athlete’s protocol.
          </p>
          <p className="mt-4 text-base text-white/70">
            This is not an app. Not AI. It’s human coaching with daily accountability.
          </p>
        </div>
        <div className="mt-12 grid gap-10 md:grid-cols-2">
          <SplitFeature
            title="Daily Human Coaching"
            body="You’re followed up every day by real coaches who review your execution and adjust the plan."
            image="/coach2.png"
            tone="dark"
          />
          <SplitFeature
            title="Holistic Athlete Protocol"
            body="Training, nutrition, sleep, and supplements are built as one system around your body."
            image="/system.png"
            flipped
            tone="dark"
          />
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Personalized Nutrition",
              body: "Built for your metabolism, schedule, and goals — not a template."
            },
            {
              title: "Personalized Training",
              body: "Progressive plan calibrated to your current level and equipment."
            },
            {
              title: "Supplements + Videos",
              body: "Supplements delivered plus short videos to execute perfectly."
            }
          ].map((item) => (
            <div key={item.title} className="card-raise border border-white/20 bg-white/5 p-6">
              <p className="text-xs uppercase tracking-[0.35em] text-white/70">{item.title}</p>
              <p className="mt-4 text-base text-white/75">{item.body}</p>
            </div>
          ))}
        </div>
      </SectionShell>

      <SectionShell>
        <div className="max-w-3xl fade-in">
          <h2 className="text-3xl font-display font-semibold uppercase tracking-[0.18em]">
            Your Coach
          </h2>
          <p className="mt-4 text-lg text-black/70">
            A coach who lived the skinny-fat loop — and now helps men escape it with a clear system.
          </p>
        </div>
        <div className="mt-10 grid items-center gap-8 md:grid-cols-2">
          <div className="card-raise overflow-hidden rounded-3xl border border-black/15">
            <img
              src="/coach.png"
              alt="Program coach"
              className="h-full w-full object-cover grayscale"
            />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-black/60">Coach Story</p>
            <h3 className="mt-4 text-2xl font-display font-semibold uppercase tracking-[0.18em]">
              From Skinny-Fat To Coach
            </h3>
            <p className="mt-4 text-base text-black/70">
              He trained hard, ate clean, and still felt soft. No plan. No measurable progress.
              Protocol became a holistic coaching system — training, nutrition, sleep, and supplements
              aligned to one outcome.
            </p>
            <p className="mt-4 text-base text-black/70">
              Today the method is the same: structured plans, daily coaching, and accountability that sticks.
            </p>
          </div>
        </div>
      </SectionShell>

      <SectionShell>
        <div className="max-w-3xl fade-in">
          <h2 className="text-3xl font-display font-semibold uppercase tracking-[0.18em]">
            Who It’s For
          </h2>
          <p className="mt-4 text-lg text-black/70">
            This is a disciplined reset. If you want clarity and results, you’ll fit right in.
          </p>
        </div>
        <WhoFor forItems={whoFor} notForItems={notFor} />
      </SectionShell>

      <SectionShell>
        <div className="max-w-3xl fade-in">
          <h2 className="text-3xl font-display font-semibold uppercase tracking-[0.18em]">
            The Process
          </h2>
          <p className="mt-4 text-lg text-black/70">
            Simple sequence. Clear expectations. Structured accountability.
          </p>
        </div>
        <ProcessSteps steps={processSteps} />
      </SectionShell>

      <SectionShell>
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div className="fade-in">
            <p className="text-xs uppercase tracking-[0.5em] text-black/60">Offer</p>
            <h2 className="mt-4 text-3xl font-display font-semibold uppercase tracking-[0.18em]">
              The 30-Day Recomp Reset (Coached Edition)
            </h2>
            <p className="mt-4 text-lg text-black/70">
              A complete coaching system with daily human accountability, personalized plans, and full execution support.
            </p>
          <div className="card-raise mt-8 rounded-3xl border border-black/60 bg-gradient-to-br from-white via-white to-black/5 p-6 shadow-hard">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.35em] text-black/70">Program Investment</p>
              <span className="rounded-full border border-black bg-black px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-white">
                Best Value
              </span>
            </div>
            <p className="mt-4 text-5xl font-display font-semibold uppercase tracking-[0.12em] text-black">
              $250
            </p>
            <p className="mt-3 text-sm text-black/80">One-time. Unlimited daily coaching included.</p>
          </div>
          <div className="card-raise mt-6 rounded-3xl border border-black/40 bg-black p-6 text-white shadow-hard">
            <p className="text-xs uppercase tracking-[0.35em] text-white/70">February Intake</p>
            <p className="mt-4 text-lg text-white/80">
              Only 3 spots left this month. One coach, limited capacity.
            </p>
            <p className="mt-3 text-xs uppercase tracking-[0.3em] text-white/60">
              Apply now to secure your place.
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-4 sm:flex-row">
            <a
              href="https://buy.stripe.com/00weVd8dVdoG0LVbv4ebu00"
              className="inline-flex items-center justify-center border border-black bg-black px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white shadow-hard ring-2 ring-black/70 ring-offset-2 ring-offset-white transition hover:bg-white hover:text-black"
            >
              Apply Now
            </a>
          </div>
            <p className="mt-4 text-xs uppercase tracking-[0.3em] text-black/60">
              Results or refunded guarantee included.
            </p>
          </div>
          <div className="card-raise rounded-3xl border border-black/15 bg-white p-6">
            <p className="text-xs uppercase tracking-[0.35em] text-black/60">What’s Included</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {includedItems.map((item, index) => (
                <div
                  key={item.title}
                  className="card-raise rounded-2xl border border-black/10 px-4 py-3"
                >
                  <span className="block text-[10px] uppercase tracking-[0.3em] text-black/60">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="mt-2 block text-sm uppercase tracking-[0.2em] text-black">
                    {item.title}
                  </span>
                  <span className="mt-2 block text-xs text-black/60">{item.detail}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionShell>

      <SectionShell className="bg-black text-white bg-grid-dark" tone="dark">
        <div className="mx-auto max-w-3xl text-center fade-in">
          <h2 className="text-3xl font-display font-semibold uppercase tracking-[0.18em]">
            The Protocol Guarantee
          </h2>
          <p className="mt-6 text-lg text-white/75">
            Execute the plan for 30 days. If you don’t see measurable progress,
            you get your money back. Results or refunded.
          </p>
        </div>
      </SectionShell>

      <SectionShell className="bg-white">
        <div className="max-w-3xl fade-in">
          <h2 className="text-3xl font-display font-semibold uppercase tracking-[0.18em]">
            Questions, Answered
          </h2>
          <p className="mt-4 text-lg text-black/70">
            No fluff. Just clear expectations before you commit.
          </p>
        </div>
        <FAQ items={faqItems} />
      </SectionShell>

      <SectionShell className="bg-white">
        <div className="mx-auto max-w-4xl text-center fade-in">
          <h2 className="text-3xl font-display font-semibold uppercase tracking-[0.18em]">
            Ready To Reset?
          </h2>
          <p className="mt-6 text-lg text-black/70">
            Capacity is limited to keep it personal and accountable.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="https://buy.stripe.com/00weVd8dVdoG0LVbv4ebu00"
              className="inline-flex items-center justify-center border border-black bg-black px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white shadow-hard ring-2 ring-black/70 ring-offset-2 ring-offset-white transition hover:bg-white hover:text-black"
            >
              Apply Now
            </a>
          </div>
        </div>
      </SectionShell>

      <StickyCta />
    </main>
  );
}
