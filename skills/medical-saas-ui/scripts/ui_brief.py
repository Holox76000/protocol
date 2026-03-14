#!/usr/bin/env python3
"""Generate a structured UI brief for medical and wellness SaaS surfaces."""

from __future__ import annotations

import argparse
import textwrap


ANGLE_HINTS = {
    "marketing": "Lead with trust, outcome framing, and one low-friction primary CTA.",
    "app": "Lead with guidance, next-step clarity, and progress reassurance.",
    "hybrid": "Unify marketing credibility with product guidance and calm progression.",
}

SURFACE_MODULES = {
    "marketing": [
        "Hero with trust cue",
        "Proof block",
        "Protocol or process steps",
        "Offer or pricing clarity",
        "FAQ and final CTA",
    ],
    "app": [
        "Welcome and status summary",
        "Progress indicator",
        "Current plan or next task",
        "Messaging or support path",
        "Confirmation or follow-up state",
    ],
    "hybrid": [
        "Credibility-first hero",
        "Assessment or onboarding entry",
        "Process and plan framing",
        "Dashboard preview or guided next steps",
        "Reassurance and FAQ",
    ],
}


def build_brief(product: str, audience: str, surface: str, cta: str) -> str:
    modules = "\n".join(f"- {item}" for item in SURFACE_MODULES[surface])
    return textwrap.dedent(
        f"""\
        UI Brief
        ========

        Product
        - {product}

        Audience
        - {audience}

        Surface
        - {surface}

        Primary CTA
        - {cta}

        Conversion Angle
        - {ANGLE_HINTS[surface]}

        Visual Posture
        - Premium clinical
        - Modern but restrained
        - High trust, low noise, mobile-first

        Required Modules
        {modules}

        Guardrails
        - Keep claims proportional to proof.
        - Make the next action obvious within the first viewport.
        - Use one-column mobile-first form patterns.
        - Show privacy, support, or practitioner reassurance near friction points.
        """
    )


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate a structured UI brief for medical or wellness SaaS work."
    )
    parser.add_argument("--product", required=True, help="Product, offer, or service summary.")
    parser.add_argument("--audience", required=True, help="Primary target audience.")
    parser.add_argument(
        "--surface",
        choices=sorted(SURFACE_MODULES),
        default="hybrid",
        help="Target surface type.",
    )
    parser.add_argument("--cta", default="Start assessment", help="Primary call to action.")
    args = parser.parse_args()

    print(build_brief(args.product.strip(), args.audience.strip(), args.surface, args.cta.strip()))


if __name__ == "__main__":
    main()
