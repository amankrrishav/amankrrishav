"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { useUniverse } from "@/stores/useUniverse";
import { aboutContent } from "@/content/about";

/**
 * About — Asymmetric Bento Grid.
 *
 * Cell 1 (left, 52%): Hero statement — massive weight-split typography
 * Cell 2 (mid, 30%): Background paragraphs — glass card, Fraunces serif
 * Cell 3 (right, 18%): Currently — narrow, rotated label, radar dot
 * Bottom: Quote — watermark treatment, barely there
 *
 * All cells: 1px borders, hover glow, transparent bg, stars bleed through.
 * SVG noise grain overlay for analog texture.
 */

const BORDER = "1px solid rgba(255,255,255,0.07)";
const GLASS = {
  background: "rgba(255,255,255,0.025)",
  backdropFilter: "blur(14px) saturate(1.4)",
  WebkitBackdropFilter: "blur(14px) saturate(1.4)",
};

export default function AboutOverlay() {
  const rootRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  // Animation targets
  const cell1Ref = useRef<HTMLDivElement>(null);
  const cell2Ref = useRef<HTMLDivElement>(null);
  const cell3Ref = useRef<HTMLDivElement>(null);
  const quoteRef = useRef<HTMLDivElement>(null);
  const word1Ref = useRef<HTMLSpanElement>(null);
  const word2Ref = useRef<HTMLSpanElement>(null);
  const word3Ref = useRef<HTMLSpanElement>(null);
  const word4Ref = useRef<HTMLSpanElement>(null);
  const halfwayRef = useRef<HTMLSpanElement>(null);
  const subRef = useRef<HTMLDivElement>(null);

  const scrollProgress = useUniverse((s) => s.scrollProgress);
  const bootComplete = useUniverse((s) => s.bootComplete);

  const sectionStart = 0.08;
  const sectionEnd = 0.28;
  const fadeInEnd = 0.12;
  const fadeOutStart = 0.24;

  let opacity = 0;
  if (scrollProgress >= sectionStart && scrollProgress <= sectionEnd) {
    if (scrollProgress < fadeInEnd) {
      opacity = (scrollProgress - sectionStart) / (fadeInEnd - sectionStart);
    } else if (scrollProgress > fadeOutStart) {
      opacity = (sectionEnd - scrollProgress) / (sectionEnd - fadeOutStart);
    } else {
      opacity = 1;
    }
  }
  opacity = Math.max(0, Math.min(1, opacity));

  useEffect(() => {
    if (opacity > 0.2 && bootComplete && !hasAnimated.current) {
      hasAnimated.current = true;
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      // 1. Hero words — clipPath reveal, one by one
      const words = [word1Ref, word2Ref, word3Ref, word4Ref];
      words.forEach((ref, i) => {
        if (ref.current) {
          tl.fromTo(
            ref.current,
            { clipPath: "inset(0 100% 0 0)" },
            { clipPath: "inset(0 0% 0 0)", duration: 0.75 },
            i * 0.1
          );
        }
      });

      // "halfway." lands LAST, 250ms after
      if (halfwayRef.current) {
        tl.fromTo(
          halfwayRef.current,
          { clipPath: "inset(0 100% 0 0)" },
          { clipPath: "inset(0 0% 0 0)", duration: 0.75 },
          0.65
        );
      }

      // Sub-line
      if (subRef.current) {
        tl.fromTo(subRef.current, { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, 0.9);
      }

      // 2. Cards — placed like physical objects
      [cell2Ref, cell3Ref].forEach((ref, i) => {
        if (ref.current) {
          tl.fromTo(
            ref.current,
            { opacity: 0, rotateY: 10, y: 20, transformOrigin: "left center" },
            { opacity: 1, rotateY: 0, y: 0, duration: 0.9 },
            0.8 + i * 0.15
          );
        }
      });

      // 3. Quote
      if (quoteRef.current) {
        tl.fromTo(quoteRef.current, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6 }, 1.2);
      }
    }
  }, [opacity, bootComplete]);

  useEffect(() => {
    if (scrollProgress < sectionStart - 0.02 && hasAnimated.current) {
      hasAnimated.current = false;
    }
  }, [scrollProgress]);

  if (!bootComplete || opacity <= 0) return null;

  return (
    <div
      ref={rootRef}
      className="overlay-layer"
      style={{
        opacity,
        pointerEvents: opacity < 0.1 ? "none" : "auto",
        background: "transparent",
      }}
    >
      {/* ─── SVG noise grain overlay ─── */}
      <svg
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 100,
          opacity: 0.035,
        }}
      >
        <filter id="noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noise)" />
      </svg>

      {/* ─── BENTO GRID ─── */}
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "grid",
          gridTemplateColumns: "52fr 30fr 18fr",
          gridTemplateRows: "1fr auto",
          padding: "clamp(24px, 4vh, 48px) clamp(24px, 4vw, 56px)",
        }}
      >
        {/* ══════════════════════════════════════════════ */}
        {/* CELL 1 — Hero Statement (left, large)        */}
        {/* ══════════════════════════════════════════════ */}
        <div
          ref={cell1Ref}
          style={{
            gridColumn: "1",
            gridRow: "1",
            borderRight: BORDER,
            borderBottom: BORDER,
            padding: "clamp(20px, 3vh, 36px) clamp(16px, 2.5vw, 36px)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            transition: "box-shadow 0.3s cubic-bezier(0.25,0.46,0.45,0.94)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "inset 0 0 0 1px rgba(200,255,0,0.12)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          {/* Section label */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "clamp(20px, 3vh, 32px)" }}>
            <span style={{ width: "20px", height: "1px", background: "#00C8C8" }} />
            <span style={{ width: "20px", height: "1px", background: "#00C8C8" }} />
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.6rem",
                letterSpacing: "0.35em",
                textTransform: "uppercase" as const,
                color: "#00C8C8",
              }}
            >
              Who I am
            </span>
          </div>

          {/* Hero text — weight split */}
          <div style={{ lineHeight: 0.9, marginBottom: "clamp(20px, 3vh, 32px)" }}>
            <div>
              <span
                ref={word1Ref}
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 400,
                  fontSize: "clamp(3rem, 8.5vw, 7.5rem)",
                  color: "rgba(255,255,255,0.85)",
                  display: "inline-block",
                  clipPath: "inset(0 100% 0 0)",
                }}
              >
                I&nbsp;
              </span>
              <span
                ref={word2Ref}
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 400,
                  fontSize: "clamp(3rem, 8.5vw, 7.5rem)",
                  color: "rgba(255,255,255,0.85)",
                  display: "inline-block",
                  clipPath: "inset(0 100% 0 0)",
                }}
              >
                don&apos;t&nbsp;
              </span>
              <span
                ref={word3Ref}
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 400,
                  fontSize: "clamp(3rem, 8.5vw, 7.5rem)",
                  color: "rgba(255,255,255,0.85)",
                  display: "inline-block",
                  clipPath: "inset(0 100% 0 0)",
                }}
              >
                do&nbsp;
              </span>
              <span
                ref={word4Ref}
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 400,
                  fontSize: "clamp(3rem, 8.5vw, 7.5rem)",
                  color: "rgba(255,255,255,0.85)",
                  display: "inline-block",
                  clipPath: "inset(0 100% 0 0)",
                }}
              >
                things
              </span>
            </div>
            <div>
              <span
                ref={halfwayRef}
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 800,
                  fontSize: "clamp(3rem, 8.5vw, 7.5rem)",
                  color: "#C8FF00",
                  textShadow: "0 0 60px rgba(200,255,0,0.2)",
                  display: "inline-block",
                  clipPath: "inset(0 100% 0 0)",
                }}
              >
                halfway.
              </span>
            </div>
          </div>

          {/* Sub-line */}
          <div
            ref={subRef}
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: "clamp(0.9rem, 1.3vw, 1.15rem)",
              lineHeight: 1.6,
              color: "rgba(255,255,255,0.45)",
              maxWidth: "440px",
              letterSpacing: "0.01em",
              opacity: 0,
            }}
          >
            Obsession isn&apos;t a flaw — it&apos;s how I{" "}
            <span style={{ color: "#C8FF00", textShadow: "0 0 40px rgba(200,255,0,0.15)", fontWeight: 500 }}>
              learn
            </span>
            .
          </div>
        </div>

        {/* ══════════════════════════════════════════════ */}
        {/* CELL 2 — Background (middle, glass card)     */}
        {/* ══════════════════════════════════════════════ */}
        <div
          ref={cell2Ref}
          style={{
            gridColumn: "2",
            gridRow: "1",
            borderRight: BORDER,
            borderBottom: BORDER,
            ...GLASS,
            padding: "clamp(20px, 2.5vh, 32px) clamp(16px, 2vw, 24px)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            opacity: 0,
            borderRadius: "0",
            transition: "box-shadow 0.3s cubic-bezier(0.25,0.46,0.45,0.94), transform 0.3s cubic-bezier(0.25,0.46,0.45,0.94)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "inset 0 0 0 1px rgba(200,255,0,0.12)";
            e.currentTarget.style.transform = "translateY(-4px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          {/* Label */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "clamp(12px, 1.5vh, 18px)" }}>
            <span style={{ width: "12px", height: "1px", background: "#00C8C8" }} />
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.6rem",
                letterSpacing: "0.35em",
                textTransform: "uppercase" as const,
                color: "#00C8C8",
              }}
            >
              Background
            </span>
          </div>

          {/* Paragraphs */}
          {aboutContent.bio.split("\n\n").map((para, i) => (
            <div key={i}>
              {i > 0 && (
                <div
                  style={{
                    width: "28px",
                    height: "1px",
                    background: "#C8FF00",
                    opacity: 0.4,
                    margin: "clamp(14px, 1.8vh, 22px) 0",
                  }}
                />
              )}
              <p
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "clamp(0.82rem, 0.95vw, 0.95rem)",
                  lineHeight: 1.75,
                  color: "rgba(255,255,255,0.55)",
                  letterSpacing: "0.015em",
                }}
              >
                {para}
              </p>
            </div>
          ))}
        </div>

        {/* ══════════════════════════════════════════════ */}
        {/* CELL 3 — Currently (right, narrow)           */}
        {/* ══════════════════════════════════════════════ */}
        <div
          ref={cell3Ref}
          style={{
            gridColumn: "3",
            gridRow: "1",
            borderBottom: BORDER,
            ...GLASS,
            padding: "clamp(20px, 2.5vh, 32px) clamp(12px, 1.5vw, 20px)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            position: "relative",
            opacity: 0,
            overflow: "hidden",
            transition: "box-shadow 0.3s cubic-bezier(0.25,0.46,0.45,0.94), transform 0.3s cubic-bezier(0.25,0.46,0.45,0.94)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "inset 0 0 0 1px rgba(200,255,0,0.12)";
            e.currentTarget.style.transform = "translateY(-4px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          {/* Rotated label on left edge */}
          <div
            style={{
              position: "absolute",
              left: "-2px",
              top: "50%",
              transform: "rotate(-90deg) translateX(-50%)",
              transformOrigin: "0 0",
              fontFamily: "var(--font-mono)",
              fontSize: "0.55rem",
              letterSpacing: "0.4em",
              textTransform: "uppercase" as const,
              color: "rgba(255,255,255,0.12)",
              whiteSpace: "nowrap",
            }}
          >
            Status Report
          </div>

          {/* Radar dot */}
          <div style={{ marginBottom: "clamp(14px, 2vh, 22px)", display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ position: "relative", width: "14px", height: "14px" }}>
              {/* Core dot */}
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%,-50%)",
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#C8FF00",
                  boxShadow: "0 0 8px rgba(200,255,0,0.6)",
                }}
              />
              {/* Ring 1 */}
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%,-50%)",
                  width: "14px",
                  height: "14px",
                  borderRadius: "50%",
                  border: "1px solid #C8FF00",
                  animation: "radar-ring 2s ease-out infinite",
                }}
              />
              {/* Ring 2 */}
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%,-50%)",
                  width: "14px",
                  height: "14px",
                  borderRadius: "50%",
                  border: "1px solid #C8FF00",
                  animation: "radar-ring 2s ease-out infinite 0.6s",
                }}
              />
              {/* Ring 3 */}
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%,-50%)",
                  width: "14px",
                  height: "14px",
                  borderRadius: "50%",
                  border: "1px solid #C8FF00",
                  animation: "radar-ring 2s ease-out infinite 1.2s",
                }}
              />
            </div>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.6rem",
                letterSpacing: "0.35em",
                textTransform: "uppercase" as const,
                color: "#C8FF00",
                fontWeight: 600,
              }}
            >
              Now
            </span>
          </div>

          {/* Currently text */}
          <p
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(0.78rem, 0.88vw, 0.9rem)",
              lineHeight: 1.75,
              color: "rgba(255,255,255,0.5)",
              letterSpacing: "0.015em",
            }}
          >
            {aboutContent.currently}
          </p>

          {/* Decorative accent arrow */}
          <div
            style={{
              marginTop: "auto",
              paddingTop: "clamp(16px, 2.5vh, 28px)",
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2rem, 3vw, 3.5rem)",
              fontWeight: 800,
              color: "#C8FF00",
              lineHeight: 1,
              opacity: 0.25,
            }}
          >
            →
          </div>
        </div>

        {/* ══════════════════════════════════════════════ */}
        {/* BOTTOM — Quote (watermark treatment)         */}
        {/* ══════════════════════════════════════════════ */}
        <div
          ref={quoteRef}
          style={{
            gridColumn: "1 / -1",
            gridRow: "2",
            padding: "clamp(14px, 2vh, 22px) clamp(16px, 2.5vw, 36px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "clamp(16px, 3vw, 40px)",
            opacity: 0,
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: "clamp(0.85rem, 1vw, 0.95rem)",
              lineHeight: 1.5,
              color: "rgba(255,255,255,0.25)",
              letterSpacing: "0.02em",
            }}
          >
            &ldquo;{aboutContent.quote.text}&rdquo;
          </p>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.55rem",
              letterSpacing: "0.3em",
              textTransform: "uppercase" as const,
              color: "rgba(255,255,255,0.15)",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            — {aboutContent.quote.author}
          </span>
        </div>
      </div>
    </div>
  );
}
