"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import gsap from "gsap";
import { useUniverse } from "@/stores/useUniverse";

interface BootLine {
  text: string;
  isProgressBar?: boolean;
}

const BOOT_LINES: BootLine[] = [
  { text: "नमस्ते" },
  { text: "" }, // blank line
  { text: "INITIALIZING DEEP SPACE PROBE..." },
  { text: "TRAJECTORY: INDIA → DEEP SPACE" },
  { text: "[ORIGIN: INDIA]" },
  { text: "LOADING NEURAL MODULES", isProgressBar: true },
  { text: "CONNECTING TO UNIVERSE.AKR.NETWORK..." },
  { text: "DECRYPTING STAR MAP... 847 SECTORS INDEXED" },
  { text: "CALIBRATING VISUAL CORTEX..." },
  { text: "FETCHING IDENTITY: aman.kr.rishav" },
  { text: "" }, // blank line
  { text: "LAUNCH SEQUENCE ACTIVATED" },
];

export default function BootSequence() {
  const containerRef = useRef<HTMLDivElement>(null);
  const linesRef = useRef<(HTMLDivElement | null)[]>([]);
  const flashRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const setBootComplete = useUniverse((s) => s.setBootComplete);

  const setLineRef = useCallback((el: HTMLDivElement | null, i: number) => {
    linesRef.current[i] = el;
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const tl = gsap.timeline({
      onComplete: () => {
        // Glitch effect
        if (containerRef.current) {
          containerRef.current.classList.add("glitch-active");
        }

        // Lime flash
        gsap.to(flashRef.current, {
          opacity: 1,
          duration: 0.15,
          onComplete: () => {
            gsap.to(flashRef.current, {
              opacity: 0,
              duration: 0.3,
            });
          },
        });

        // Fade out entire boot overlay
        gsap.to(containerRef.current, {
          opacity: 0,
          duration: 0.6,
          delay: 0.4,
          onComplete: () => {
            setVisible(false);
            setBootComplete(true);

            // Unlock scroll
            const lenisRef = useUniverse.getState().lenisRef;
            if (lenisRef) {
              lenisRef.start();
            }
          },
        });
      },
    });

    // Type each line with stagger
    linesRef.current.forEach((lineEl, i) => {
      if (!lineEl) return;
      const line = BOOT_LINES[i];

      if (line.text === "") {
        // Blank spacer line
        tl.to(lineEl, { opacity: 1, duration: 0.1 }, "+=0.1");
        return;
      }

      if (line.isProgressBar) {
        // Show "LOADING NEURAL MODULES" text first
        const textSpan = lineEl.querySelector(".boot-text") as HTMLElement;
        const barContainer = lineEl.querySelector(".boot-bar-container") as HTMLElement;
        const barFill = lineEl.querySelector(".boot-bar-fill") as HTMLElement;
        const barPercent = lineEl.querySelector(".boot-bar-percent") as HTMLElement;

        tl.to(lineEl, { opacity: 1, y: 0, duration: 0.05 }, "+=0.15");
        if (textSpan) {
          tl.to(textSpan, { opacity: 1, duration: 0.1 });
        }
        if (barContainer) {
          tl.to(barContainer, { opacity: 1, duration: 0.05 });
        }
        // Animate bar fill
        if (barFill) {
          const barObj = { progress: 0 };
          tl.to(barObj, {
            progress: 1,
            duration: 0.8,
            ease: "power2.inOut",
            onUpdate: () => {
              if (barFill) {
                barFill.style.width = `${barObj.progress * 100}%`;
              }
              if (barPercent) {
                barPercent.textContent = `${Math.round(barObj.progress * 100)}%`;
              }
            },
          });
        }
        return;
      }

      // Normal line: fade in + slight slide up
      tl.to(
        lineEl,
        {
          opacity: 1,
          y: 0,
          duration: 0.08,
          ease: "power2.out",
        },
        "+=0.2"
      );
    });

    return () => {
      tl.kill();
    };
  }, [setBootComplete]);

  if (!visible) return null;

  return (
    <div ref={containerRef} className="boot-overlay">
      {/* Lines */}
      <div className="flex flex-col gap-1 max-w-3xl">
        {BOOT_LINES.map((line, i) => {
          if (line.text === "") {
            return (
              <div
                key={i}
                ref={(el) => setLineRef(el, i)}
                className="h-4 opacity-0"
              />
            );
          }

          if (line.isProgressBar) {
            return (
              <div
                key={i}
                ref={(el) => setLineRef(el, i)}
                className="flex items-center gap-3 opacity-0 translate-y-2"
              >
                <span className="boot-text opacity-0 text-text-secondary text-sm tracking-wider">
                  {line.text}
                </span>
                <div className="boot-bar-container opacity-0 flex items-center gap-2 flex-1">
                  <div className="relative h-3 flex-1 bg-white/5 rounded-sm overflow-hidden border border-white/10">
                    <div
                      className="boot-bar-fill absolute left-0 top-0 h-full rounded-sm"
                      style={{
                        width: "0%",
                        background:
                          "linear-gradient(90deg, var(--lime) 0%, rgba(200,255,0,0.6) 100%)",
                        boxShadow: "0 0 10px rgba(200,255,0,0.4)",
                      }}
                    />
                  </div>
                  <span className="boot-bar-percent text-lime text-xs font-mono min-w-[3ch]">
                    0%
                  </span>
                </div>
              </div>
            );
          }

          // Special styling for first line (नमस्ते) and last line
          const isFirst = i === 0;
          const isLast = line.text === "LAUNCH SEQUENCE ACTIVATED";
          const isCommand = line.text.startsWith("akr.");

          return (
            <div
              key={i}
              ref={(el) => setLineRef(el, i)}
              className={`opacity-0 translate-y-2 text-sm tracking-wider ${isFirst
                ? "text-lime text-2xl mb-2 font-semibold tracking-normal"
                : isLast
                  ? "text-lime text-base font-bold mt-2"
                  : isCommand
                    ? "text-cyan"
                    : "text-text-secondary"
                }`}
            >
              {!isFirst && !isLast && !isCommand && (
                <span className="text-text-muted mr-2 select-none">{">"}</span>
              )}
              {isLast && (
                <span className="text-lime mr-2 select-none">{">>>"}</span>
              )}
              {line.text}
            </div>
          );
        })}
      </div>

      {/* Lime flash overlay */}
      <div
        ref={flashRef}
        className="fixed inset-0 pointer-events-none opacity-0 z-[200]"
        style={{ background: "var(--lime)" }}
      />
    </div>
  );
}
