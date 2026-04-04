"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { useUniverse } from "@/stores/useUniverse";
import { passions } from "@/content/passions";

/**
 * PassionsOverlay — pure HTML/CSS over the canvas.
 * Section label, phenomenon name, passion name, quote panel, progress dots.
 */

const SECTION_START = 0.76;
const SECTION_END = 0.93;

export default function PassionsOverlay() {
  const scrollProgress = useUniverse((s) => s.scrollProgress);
  const bootComplete = useUniverse((s) => s.bootComplete);
  const activeIdx = useUniverse((s) => s.activePhenomenonIdx);

  const quoteRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLDivElement>(null);
  const prevIdx = useRef(-1);

  // Section visibility
  const fadeInEnd = SECTION_START + 0.01;
  const fadeOutStart = SECTION_END - 0.01;

  let opacity = 0;
  if (scrollProgress >= SECTION_START && scrollProgress <= SECTION_END) {
    if (scrollProgress < fadeInEnd) {
      opacity = (scrollProgress - SECTION_START) / (fadeInEnd - SECTION_START);
    } else if (scrollProgress > fadeOutStart) {
      opacity = (SECTION_END - scrollProgress) / (SECTION_END - fadeOutStart);
    } else {
      opacity = 1;
    }
  }
  opacity = Math.max(0, Math.min(1, opacity));

  const sub =
    scrollProgress >= SECTION_START && scrollProgress <= SECTION_END
      ? (scrollProgress - SECTION_START) / (SECTION_END - SECTION_START)
      : 0;

  const passion = passions[activeIdx] || passions[0];

  // GSAP animations on phenomenon change
  useEffect(() => {
    if (activeIdx === prevIdx.current) return;
    prevIdx.current = activeIdx;

    if (quoteRef.current) {
      gsap.fromTo(
        quoteRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power3.out", delay: 0.15 }
      );
    }
    if (nameRef.current) {
      gsap.fromTo(
        nameRef.current,
        { clipPath: "inset(0 100% 0 0)" },
        {
          clipPath: "inset(0 0% 0 0)",
          duration: 0.6,
          ease: "power2.out",
        }
      );
    }
  }, [activeIdx]);

  if (!bootComplete || opacity <= 0) return null;

  return (
    <div
      className="overlay-layer"
      style={{
        opacity,
        pointerEvents: opacity < 0.1 ? "none" : "auto",
        background: "transparent",
      }}
    >
      {/* Section label — top left */}
      <div
        style={{
          position: "absolute",
          top: "clamp(24px, 4vh, 48px)",
          left: "clamp(24px, 4vw, 56px)",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <span
          style={{ width: "20px", height: "1px", background: "#00C8C8" }}
        />
        <span
          style={{ width: "20px", height: "1px", background: "#00C8C8" }}
        />
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.6rem",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "#00C8C8",
          }}
        >
          Passions
        </span>
      </div>

      {/* Phenomenon label + passion name — center top */}
      <div
        style={{
          position: "absolute",
          top: "clamp(60px, 10vh, 120px)",
          left: "50%",
          transform: "translateX(-50%)",
          textAlign: "center",
        }}
      >
        {/* Phenomenon type */}
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.7rem",
            letterSpacing: "0.35em",
            textTransform: "uppercase",
            color: passion.accent === "#111111" ? "#ff6600" : passion.accent,
            opacity: 0.8,
            marginBottom: "8px",
          }}
        >
          {passion.phenomenon}
        </div>
        {/* Passion name — clip reveal */}
        <div
          ref={nameRef}
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "clamp(1.4rem, 2.5vw, 2rem)",
            color: "#FFFFFF",
            letterSpacing: "-0.01em",
          }}
        >
          {passion.name}
        </div>
      </div>

      {/* Progress dots — bottom center, above quote */}
      <div
        style={{
          position: "absolute",
          bottom: "clamp(120px, 18vh, 200px)",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: "16px",
          alignItems: "center",
        }}
      >
        {passions.map((p, i) => (
          <div
            key={p.id}
            style={{
              width: i === activeIdx ? "10px" : "5px",
              height: i === activeIdx ? "10px" : "5px",
              borderRadius: "50%",
              background:
                i === activeIdx
                  ? p.accent === "#111111"
                    ? "#ff6600"
                    : p.accent
                  : "rgba(255,255,255,0.2)",
              boxShadow:
                i === activeIdx
                  ? `0 0 10px ${p.accent === "#111111" ? "#ff6600" : p.accent}`
                  : "none",
              transition: "all 0.4s ease",
            }}
          />
        ))}
      </div>

      {/* Quote panel — bottom center */}
      <div
        ref={quoteRef}
        style={{
          position: "absolute",
          bottom: "clamp(40px, 7vh, 80px)",
          left: "50%",
          transform: "translateX(-50%)",
          width: "clamp(400px, 50vw, 680px)",
          maxWidth: "90vw",
          textAlign: "center",
        }}
      >
        {/* Opening quote mark */}
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "4rem",
            lineHeight: 0.5,
            color: passion.accent === "#111111" ? "#ff6600" : passion.accent,
            opacity: 0.3,
            marginBottom: "12px",
          }}
        >
          &ldquo;
        </div>
        {/* Quote text */}
        <div
          style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontSize: "clamp(0.9rem, 1.3vw, 1.1rem)",
            lineHeight: 1.8,
            color: "rgba(255,255,255,0.75)",
          }}
        >
          {passion.quote}
        </div>
      </div>

      {/* Navigation hint — first phenomenon only */}
      {sub < 0.15 && (
        <div
          style={{
            position: "absolute",
            bottom: "clamp(20px, 3vh, 36px)",
            right: "clamp(24px, 4vw, 56px)",
            fontFamily: "var(--font-mono)",
            fontSize: "0.5rem",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.3)",
            opacity: 1 - sub / 0.15,
            transition: "opacity 0.3s ease",
          }}
        >
          Scroll to explore phenomena
        </div>
      )}
    </div>
  );
}
