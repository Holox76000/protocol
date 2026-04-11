"use client";

import Image from "next/image";
import type { KeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useId, useRef, useState } from "react";

type BeforeAfterSliderProps = {
  afterSrc: string;
  beforeSrc: string;
  afterAlt?: string;
  beforeAlt?: string;
  afterPosition?: string;
  beforePosition?: string;
  afterScale?: number;
  beforeScale?: number;
  afterTranslateX?: string;
  afterTranslateY?: string;
  beforeTranslateX?: string;
  beforeTranslateY?: string;
  className?: string;
  subject?: string;
};


function clampPosition(value: number) {
  return Math.min(100, Math.max(0, value));
}

export default function BeforeAfterSlider({
  afterSrc,
  beforeSrc,
  afterAlt,
  beforeAlt,
  afterPosition = "50% 50%",
  beforePosition = "50% 50%",
  afterScale = 1,
  beforeScale = 1,
  afterTranslateX = "0%",
  afterTranslateY = "0%",
  beforeTranslateX = "0%",
  beforeTranslateY = "0%",
  className,
  subject = "comparison",
}: BeforeAfterSliderProps) {
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const sliderId = useId();

  const updatePositionFromClientX = (clientX: number) => {
    const root = rootRef.current;
    if (!root) return;
    const rect = root.getBoundingClientRect();
    if (!rect.width) return;
    const nextPosition = ((clientX - rect.left) / rect.width) * 100;
    setPosition(clampPosition(nextPosition));
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    pointerIdRef.current = event.pointerId;
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    updatePositionFromClientX(event.clientX);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDragging || pointerIdRef.current !== event.pointerId) return;
    updatePositionFromClientX(event.clientX);
  };

  const stopDragging = () => {
    pointerIdRef.current = null;
    setIsDragging(false);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleWindowPointerUp = () => {
      stopDragging();
    };

    window.addEventListener("pointerup", handleWindowPointerUp);
    window.addEventListener("pointercancel", handleWindowPointerUp);

    return () => {
      window.removeEventListener("pointerup", handleWindowPointerUp);
      window.removeEventListener("pointercancel", handleWindowPointerUp);
    };
  }, [isDragging]);

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight" && event.key !== "Home" && event.key !== "End") {
      return;
    }

    event.preventDefault();

    if (event.key === "Home") {
      setPosition(0);
      return;
    }

    if (event.key === "End") {
      setPosition(100);
      return;
    }

    const delta = event.key === "ArrowRight" ? 2 : -2;
    setPosition((current) => clampPosition(current + delta));
  };

  return (
    <article className={className ? `program-hero__compare-card ${className}` : "program-hero__compare-card"}>
      <div
        ref={rootRef}
        className={`program-hero__compare-media${isDragging ? " is-dragging" : ""}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
      >
        <div
          className="program-hero__compare-pane program-hero__compare-pane--before"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)`, zIndex: 1 }}
          aria-hidden="true"
        >
          <Image
            className="program-hero__compare-image"
            src={beforeSrc}
            alt={beforeAlt ?? `${subject} before`}
            fill
            sizes="(max-width: 768px) 100vw, 640px"
            draggable={false}
            style={{
              objectFit: "cover",
              objectPosition: beforePosition,
              transform: `translate(${beforeTranslateX}, ${beforeTranslateY}) scale(${beforeScale})`,
              transformOrigin: "center center",
              userSelect: "none",
              pointerEvents: "none",
            }}
          />
        </div>

        <div
          className="program-hero__compare-pane program-hero__compare-pane--after"
          style={{ clipPath: `inset(0 0 0 ${position}%)`, zIndex: 0 }}
          aria-hidden="true"
        >
          <Image
            className="program-hero__compare-image"
            src={afterSrc}
            alt={afterAlt ?? `${subject} after`}
            fill
            sizes="(max-width: 768px) 100vw, 640px"
            draggable={false}
            style={{
              objectFit: "cover",
              objectPosition: afterPosition,
              transform: `translate(${afterTranslateX}, ${afterTranslateY}) scale(${afterScale})`,
              transformOrigin: "center center",
              userSelect: "none",
              pointerEvents: "none",
            }}
          />
        </div>

        <div className="program-hero__compare-divider" style={{ left: `${position}%` }} aria-hidden="true">
          <span className="program-hero__compare-handle-button">
            <span className="program-hero__compare-handle-arrow program-hero__compare-handle-arrow--left" />
            <span className="program-hero__compare-handle-arrow program-hero__compare-handle-arrow--right" />
          </span>
        </div>

        <button
          id={sliderId}
          type="button"
          className="program-hero__compare-hitbox"
          aria-label={`Adjust before and after comparison for ${subject}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(position)}
          aria-valuetext={`${Math.round(position)} percent after`}
          role="slider"
          onKeyDown={handleKeyDown}
        />
      </div>

      <div className="program-hero__compare-labels" aria-hidden="true">
        <span>Before</span>
        <span>After</span>
      </div>
    </article>
  );
}
