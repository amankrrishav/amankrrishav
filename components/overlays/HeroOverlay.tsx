"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import gsap from "gsap";
import { useUniverse } from "@/stores/useUniverse";

const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:',.<>?/~`";
const NAME = "AMAN KUMAR RISHAV";

function useTextScramble(finalText: string, startDelay: number = 0) {
  const [display, setDisplay] = useState("");
  const [active, setActive] = useState(false);

  const start = useCallback(() => {
    setActive(true);
  }, []);

  useEffect(() => {
    if (!active) return;

    const chars = finalText.split("");
    const locked = new Array(chars.length).fill(false);
    let frame = 0;

    const interval = setInterval(() => {
      frame++;

      // Gradually lock in characters
      const lockRate = Math.floor(frame / 3);
      for (let i = 0; i < Math.min(lockRate, chars.length); i++) {
        locked[i] = true;
      }

      // Build display string
      const result = chars
        .map((char, i) => {
          if (char === " ") return " ";
          if (locked[i]) return char;
          return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        })
        .join("");

      setDisplay(result);

      // All locked — done
      if (locked.every(Boolean)) {
        clearInterval(interval);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [active, finalText]);

  return { display: display || "\u00A0".repeat(finalText.length), start };
}

export default function HeroOverlay() {
  const containerRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);

  const bootComplete = useUniverse((s) => s.bootComplete);
  const scrollProgress = useUniverse((s) => s.scrollProgress);

  const { display: scrambledName, start: startScramble } = useTextScramble(NAME);

  // Entrance animation after boot completes
  useEffect(() => {
    if (!bootComplete) return;

    const tl = gsap.timeline({ delay: 0.3 });

    // Badge
    tl.fromTo(
      badgeRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
    );

    // Name scramble
    tl.add(() => startScramble(), "-=0.2");

    // Headline
    tl.fromTo(
      headlineRef.current,
      { opacity: 0, y: 25 },
      { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" },
      "-=0.5"
    );

    // Scroll indicator
    tl.fromTo(
      scrollIndicatorRef.current,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" },
      "+=0.5"
    );

    return () => {
      tl.kill();
    };
  }, [bootComplete, startScramble]);

  // Fade out on scroll — give hero more time to breathe
  const opacity = bootComplete ? Math.max(0, 1 - scrollProgress / 0.10) : 0;
  const translateY = -scrollProgress * 400;

  if (!bootComplete && scrollProgress < 0.001) return null;

  return (
    <div
      ref={containerRef}
      className="overlay-layer flex flex-col items-center justify-center"
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
        transition: "none",
        pointerEvents: opacity < 0.1 ? "none" : "auto",
      }}
    >
      {/* Location Badge */}
      <div
        ref={badgeRef}
        className="opacity-0 mb-8"
      >
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10"
          style={{ background: "rgba(255,255,255,0.04)" }}
        >
          {/* Pulse dot */}
          <span
            className="pulse-dot inline-block w-2 h-2 rounded-full"
            style={{ background: "#22C55E", boxShadow: "0 0 8px rgba(34,197,94,0.6)" }}
          />
          <span className="text-text-secondary text-xs tracking-wide">
            India — Open to opportunities
          </span>
        </div>
      </div>

      {/* Name with scramble effect */}
      <div
        ref={nameRef}
        className="mb-6"
      >
        <h1
          className="text-text-primary font-mono text-lg md:text-xl tracking-[0.3em] text-center"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {scrambledName}
        </h1>
      </div>

      {/* Headline */}
      <div ref={headlineRef} className="opacity-0 text-center px-4">
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: "clamp(32px, 7vw, 100px)",
            lineHeight: 1.0,
            letterSpacing: "-0.03em",
          }}
        >
          Building at the{" "}
          <span
            style={{
              color: "var(--lime)",
              textShadow:
                "0 0 40px rgba(200,255,0,0.3), 0 0 80px rgba(200,255,0,0.15), 0 0 120px rgba(200,255,0,0.05)",
            }}
          >
            Edge of the Universe
          </span>
        </h2>
      </div>

      {/* Scroll Indicator */}
      <div
        ref={scrollIndicatorRef}
        className="opacity-0 absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
      >
        <span className="text-text-muted text-xs tracking-[0.4em] uppercase">
          Explore
        </span>
        <div className="relative w-6 h-10 rounded-full border border-white/15 flex items-start justify-center pt-2">
          <div
            className="bounce-scroll w-1.5 h-1.5 rounded-full"
            style={{
              background: "var(--lime)",
              boxShadow: "0 0 6px rgba(200,255,0,0.5)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
