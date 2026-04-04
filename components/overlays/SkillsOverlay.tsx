"use client";

import { useUniverse } from "@/stores/useUniverse";
import { planets } from "@/content/skills";

/**
 * Skills Overlay — pure HTML/CSS.
 * Zero WebGL. Zero <canvas>. Zero THREE imports.
 *
 * Shows: section label, active planet info card, planet nav dots.
 * The 3D planets render in SkillsPlanets.tsx (inside the R3F Canvas).
 */

const PLANET_COLORS = ["#C8FF00", "#cc44ff", "#ff6633"];

export default function SkillsOverlay() {
  const scrollProgress = useUniverse((s) => s.scrollProgress);
  const bootComplete = useUniverse((s) => s.bootComplete);

  const sectionStart = 0.28;
  const sectionEnd = 0.45;
  const fadeInEnd = 0.30;
  const fadeOutStart = 0.43;

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

  // Active planet
  const sub =
    scrollProgress >= sectionStart && scrollProgress <= sectionEnd
      ? (scrollProgress - sectionStart) / (sectionEnd - sectionStart)
      : -1;
  const activeIdx = sub < 0 ? 0 : sub < 0.33 ? 0 : sub < 0.66 ? 1 : 2;

  if (!bootComplete || opacity <= 0) return null;

  const activePlanet = planets[activeIdx];

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
        <span style={{ width: "20px", height: "1px", background: "#00C8C8" }} />
        <span style={{ width: "20px", height: "1px", background: "#00C8C8" }} />
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.6rem",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "#00C8C8",
          }}
        >
          Skill Domains
        </span>
      </div>

      {/* Active planet info card — bottom left */}
      <div
        key={activePlanet.id}
        style={{
          position: "absolute",
          bottom: "clamp(28px, 5vh, 56px)",
          left: "clamp(24px, 4vw, 56px)",
          width: "clamp(260px, 24vw, 340px)",
          background: "rgba(255,255,255,0.025)",
          backdropFilter: "blur(14px) saturate(1.4)",
          WebkitBackdropFilter: "blur(14px) saturate(1.4)",
          border: `1px solid ${PLANET_COLORS[activeIdx]}22`,
          borderRadius: "8px",
          padding: "clamp(16px, 2vh, 24px) clamp(14px, 1.5vw, 20px)",
        }}
      >
        {/* Planet name */}
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: "clamp(1.4rem, 2vw, 1.8rem)",
            color: PLANET_COLORS[activeIdx],
            letterSpacing: "-0.02em",
            textShadow: `0 0 30px ${PLANET_COLORS[activeIdx]}33`,
          }}
        >
          {activePlanet.planetName}
        </div>

        {/* Domain + meaning */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px", marginBottom: "14px" }}>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.55rem",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: PLANET_COLORS[activeIdx],
              opacity: 0.7,
            }}
          >
            {activePlanet.domain}
          </span>
          <span style={{ width: "1px", height: "10px", background: "rgba(255,255,255,0.1)" }} />
          <span
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontSize: "0.7rem",
              color: "rgba(255,255,255,0.3)",
            }}
          >
            &ldquo;{activePlanet.meaning}&rdquo;
          </span>
        </div>

        {/* Skill tags */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {activePlanet.skills.map((skill) => (
            <div
              key={skill.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "4px 10px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "4px",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.72rem",
                  color: "#FAFAFA",
                  fontWeight: 500,
                }}
              >
                {skill.name}
              </span>
              <span
                style={{
                  width: `${4 + (skill.proficiency / 10) * 8}px`,
                  height: `${4 + (skill.proficiency / 10) * 8}px`,
                  borderRadius: "50%",
                  background: PLANET_COLORS[activeIdx],
                  opacity: 0.6 + (skill.proficiency / 10) * 0.4,
                  flexShrink: 0,
                }}
              />
            </div>
          ))}
        </div>

        {/* Skill count */}
        <div
          style={{
            marginTop: "10px",
            fontFamily: "var(--font-mono)",
            fontSize: "0.5rem",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.2)",
          }}
        >
          {activePlanet.skills.length} skills · Moons sized by proficiency
        </div>
      </div>

      {/* Planet nav dots — right side */}
      <div
        style={{
          position: "absolute",
          right: "clamp(24px, 4vw, 56px)",
          top: "50%",
          transform: "translateY(-50%)",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          alignItems: "flex-end",
        }}
      >
        {planets.map((p, i) => (
          <div
            key={p.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              opacity: activeIdx === i ? 1 : 0.25,
              transition: "opacity 0.5s ease",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.55rem",
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: activeIdx === i ? PLANET_COLORS[i] : "#B0C4DE",
                transition: "color 0.5s ease",
              }}
            >
              {p.planetName}
            </span>
            <div
              style={{
                width: activeIdx === i ? "12px" : "6px",
                height: activeIdx === i ? "12px" : "6px",
                borderRadius: "50%",
                background: PLANET_COLORS[i],
                boxShadow: activeIdx === i ? `0 0 14px ${PLANET_COLORS[i]}` : "none",
                transition: "all 0.5s ease",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
