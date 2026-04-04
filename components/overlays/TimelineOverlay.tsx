"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { useUniverse } from "@/stores/useUniverse";
import { timelineEntries } from "@/content/timeline";

/**
 * Timeline Overlay — pure HTML/CSS.
 * Zero WebGL. Zero canvas. Zero THREE imports.
 *
 * Shows:
 *  - Section label (top-left)
 *  - Year + title labels floating above each real star (projected from 3D)
 *  - "?" labels on empty stars
 *  - Hover info panel (center-right)
 *  - Scroll indicator (right edge)
 *  - Entry count (bottom-left)
 */

const SECTION_START = 0.5;
const SECTION_END = 0.75;

const realEntries = timelineEntries.filter((e) => e.type !== "empty");
const emptyEntries = timelineEntries.filter((e) => e.type === "empty");
const realCount = realEntries.length;
const emptyCount = emptyEntries.length;

export default function TimelineOverlay() {
  const scrollProgress = useUniverse((s) => s.scrollProgress);
  const bootComplete = useUniverse((s) => s.bootComplete);
  const hoveredStarId = useUniverse((s) => s.hoveredStarId);
  const starScreenPositions = useUniverse((s) => s.starScreenPositions);
  const illuminatedStarIds = useUniverse((s) => s.illuminatedStarIds);

  const panelRef = useRef<HTMLDivElement>(null);
  const prevHovered = useRef<string | null>(null);

  // Section visibility with fade in/out
  const fadeInEnd = SECTION_START + 0.02;
  const fadeOutStart = SECTION_END - 0.02;

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

  // Sub-progress for scroll indicator
  const sub =
    scrollProgress >= SECTION_START && scrollProgress <= SECTION_END
      ? (scrollProgress - SECTION_START) / (SECTION_END - SECTION_START)
      : 0;

  // Find hovered entry (only non-empty)
  const hoveredEntry =
    hoveredStarId && hoveredStarId !== ""
      ? timelineEntries.find(
          (e) => e.id === hoveredStarId && e.type !== "empty"
        )
      : null;

  const panelVisible = !!hoveredEntry;

  // GSAP panel animation
  useEffect(() => {
    if (!panelRef.current) return;

    if (hoveredEntry && prevHovered.current !== hoveredStarId) {
      gsap.fromTo(
        panelRef.current,
        { opacity: 0, x: 20 },
        { opacity: 1, x: 0, duration: 0.5, ease: "power3.out" }
      );
    } else if (!hoveredEntry && prevHovered.current) {
      gsap.to(panelRef.current, {
        opacity: 0,
        x: 20,
        duration: 0.3,
        ease: "power2.in",
      });
    }

    prevHovered.current = hoveredStarId;
  }, [hoveredStarId, hoveredEntry]);

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
          Timeline
        </span>
      </div>

      {/* ── FIX 2: Floating year + title labels for real stars ── */}
      {realEntries.map((entry) => {
        const pos = starScreenPositions[entry.id];
        if (!pos || !pos.visible) return null;
        const isIlluminated = illuminatedStarIds.has(entry.id);

        return (
          <div
            key={`label-${entry.id}`}
            style={{
              position: "absolute",
              left: `${pos.x}px`,
              top: `${pos.y}px`,
              transform: "translate(-50%, -180%)",
              pointerEvents: "none",
              textAlign: "center",
              opacity: isIlluminated ? 1 : 0,
              transition: "opacity 0.6s ease",
              zIndex: 5,
            }}
          >
            {/* Period / year */}
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.55rem",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: entry.accent,
                opacity: 0.85,
                marginBottom: "3px",
              }}
            >
              {entry.period}
            </div>
            {/* Title */}
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "0.75rem",
                color: "rgba(255,255,255,0.9)",
                maxWidth: "160px",
                lineHeight: 1.3,
                textShadow:
                  "0 0 12px rgba(0,0,0,1), 0 0 24px rgba(0,0,0,0.8)",
                margin: "0 auto",
              }}
            >
              {entry.title}
            </div>
            {/* Connector line from label to star */}
            <div
              style={{
                width: "1px",
                height: "16px",
                background: `linear-gradient(to bottom, ${entry.accent}66, transparent)`,
                margin: "3px auto 0",
              }}
            />
            {/* Current badge */}
            {entry.current && (
              <div
                style={{
                  marginTop: "4px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "2px 8px",
                  background: "#C8FF0015",
                  border: "1px solid #C8FF0040",
                  borderRadius: "20px",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.45rem",
                  letterSpacing: "0.2em",
                  color: "#C8FF00",
                }}
              >
                <span style={{ animation: "tlPulse 1.5s infinite" }}>●</span>{" "}
                NOW
              </div>
            )}
          </div>
        );
      })}

      {/* ── FIX 3: "?" labels for empty stars ── */}
      {emptyEntries.map((entry) => {
        const pos = starScreenPositions[entry.id];
        if (!pos || !pos.visible) return null;

        return (
          <div
            key={`empty-label-${entry.id}`}
            style={{
              position: "absolute",
              left: `${pos.x}px`,
              top: `${pos.y}px`,
              transform: "translate(-50%, -150%)",
              pointerEvents: "none",
              fontFamily: "var(--font-mono)",
              fontSize: "0.4rem",
              color: "rgba(255,255,255,0.15)",
              zIndex: 4,
            }}
          >
            ?
          </div>
        );
      })}

      {/* ── FIX 4: Star info panel — center-right ── */}
      <div
        ref={panelRef}
        style={{
          position: "absolute",
          right: "clamp(48px, 6vw, 96px)",
          top: "50%",
          transform: panelVisible
            ? "translateY(-50%) translateX(0)"
            : "translateY(-50%) translateX(20px)",
          width: "clamp(280px, 28vw, 380px)",
          background: "rgba(255,255,255,0.03)",
          backdropFilter: "blur(16px) saturate(1.3)",
          WebkitBackdropFilter: "blur(16px) saturate(1.3)",
          border: hoveredEntry
            ? `1px solid ${hoveredEntry.accent}22`
            : "1px solid transparent",
          borderRadius: "8px",
          padding: "clamp(20px, 2.5vh, 32px)",
          opacity: panelVisible ? 1 : 0,
          pointerEvents: panelVisible ? "auto" : "none",
          transition: "opacity 0.4s ease, transform 0.4s ease",
          zIndex: 10,
        }}
      >
        {hoveredEntry && (
          <>
            {/* Period */}
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.6rem",
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: hoveredEntry.accent,
                opacity: 0.7,
              }}
            >
              {hoveredEntry.period}
            </div>

            <div style={{ height: "6px" }} />

            {/* Title */}
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "clamp(1.1rem, 1.8vw, 1.5rem)",
                color: "#FFFFFF",
                lineHeight: 1.3,
              }}
            >
              {hoveredEntry.title}
            </div>

            <div style={{ height: "14px" }} />

            {/* Divider */}
            <div
              style={{
                width: "28px",
                height: "1px",
                background: hoveredEntry.accent,
                opacity: 0.4,
              }}
            />

            <div style={{ height: "14px" }} />

            {/* Description */}
            <div
              style={{
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
                fontSize: "0.85rem",
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.55)",
              }}
            >
              {hoveredEntry.description}
            </div>

            {/* Current badge */}
            {hoveredEntry.current && (
              <>
                <div style={{ height: "16px" }} />
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "5px 12px",
                    background: "#C8FF0022",
                    border: "1px solid #C8FF0044",
                    borderRadius: "100px",
                  }}
                >
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "#C8FF00",
                      animation: "tlPulseOpacity 1.5s ease-in-out infinite",
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.55rem",
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      color: "#C8FF00",
                    }}
                  >
                    Currently
                  </span>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Scroll progress indicator — right edge, vertical */}
      <div
        style={{
          position: "absolute",
          right: "clamp(16px, 2vw, 32px)",
          top: "50%",
          transform: "translateY(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
          height: "40vh",
        }}
      >
        {/* Track */}
        <div
          style={{
            width: "1px",
            flex: 1,
            background: "rgba(255,255,255,0.08)",
            position: "relative",
          }}
        >
          {/* Dot */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: `${sub * 100}%`,
              transform: "translate(-50%, -50%)",
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#00C8C8",
              boxShadow: "0 0 8px #00C8C8",
              transition: "top 0.1s linear",
            }}
          />
        </div>
        {/* Label */}
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.5rem",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.2)",
            writingMode: "vertical-lr",
          }}
        >
          Timeline
        </span>
      </div>

      {/* Entry count — bottom left */}
      <div
        style={{
          position: "absolute",
          bottom: "clamp(24px, 4vh, 40px)",
          left: "clamp(24px, 4vw, 56px)",
          fontFamily: "var(--font-mono)",
          fontSize: "0.5rem",
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.2)",
        }}
      >
        {realCount} Events · {emptyCount} Open
      </div>

      <style jsx>{`
        @keyframes tlPulseOpacity {
          0%,
          100% {
            opacity: 0.4;
          }
          50% {
            opacity: 1;
          }
        }
        @keyframes tlPulse {
          0%,
          100% {
            opacity: 0.4;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
