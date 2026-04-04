"use client";

import { useRef, useEffect } from "react";
import { useUniverse } from "@/stores/useUniverse";

/**
 * 2 photorealistic shooting stars — Canvas2D.
 * 
 * Fixes applied:
 * - SLOW: ~8-10 seconds to cross the screen
 * - Exits past screen edge (no abrupt end)
 * - Photorealistic thin streak, not cartoon blobs
 * - Modeled after real long-exposure astrophotography
 * 
 * Star 1: 3s after boot. Star 2: 15s after boot.
 * Each respawns every 2 minutes.
 * Hero section only.
 */

export default function ShootingStarsOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio, 2);
    let W = window.innerWidth;
    let H = window.innerHeight;

    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    interface TrailPt { x: number; y: number; age: number }

    interface MeteorState {
      x: number;
      y: number;
      vx: number;
      vy: number;
      trail: TrailPt[];
      phase: "wait" | "fly" | "gone";
      waitLeft: number;
    }

    function createMeteor(waitSec: number): MeteorState {
      const angle = (32 + Math.random() * 5) * (Math.PI / 180);
      // SLOW — ~0.7 px/frame = roughly 8-10s to cross a 1440px screen
      const speed = 0.6 + Math.random() * 0.2;
      return {
        x: W * (0.02 + Math.random() * 0.1),
        y: -(5 + Math.random() * 15), // start slightly above screen
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        trail: [],
        phase: "wait",
        waitLeft: Math.round(waitSec * 60),
      };
    }

    const meteors: MeteorState[] = [createMeteor(3), createMeteor(15)];
    const TRAIL_LIFE = 120; // frames a trail point lives

    function tick() {
      const store = useUniverse.getState();
      const isHero = store.bootComplete && store.scrollProgress < 0.08;

      ctx.clearRect(0, 0, W, H);

      if (!isHero) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      for (const m of meteors) {
        if (m.phase === "wait") {
          m.waitLeft--;
          if (m.waitLeft <= 0) m.phase = "fly";
          continue;
        }

        if (m.phase === "gone") {
          // All trail faded — respawn after 2 min
          Object.assign(m, createMeteor(120));
          continue;
        }

        // ── FLY ──
        const headOnScreen = m.x < W + 100 && m.y < H + 100;

        if (headOnScreen) {
          m.x += m.vx;
          m.y += m.vy;
          m.vy += 0.001; // very subtle gravity arc

          // Add trail point
          m.trail.push({ x: m.x, y: m.y, age: 0 });
        }

        // Age & cull trail
        for (const p of m.trail) p.age++;
        m.trail = m.trail.filter(p => p.age < TRAIL_LIFE);

        // If head off-screen AND trail empty → done
        if (!headOnScreen && m.trail.length === 0) {
          m.phase = "gone";
          continue;
        }

        // ── DRAW TRAIL as continuous gradient stroke ──
        if (m.trail.length > 1) {
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          ctx.lineCap = "round";

          // Draw multiple passes for glow layering

          // Pass 1: Wide soft atmospheric glow
          ctx.lineWidth = 6;
          for (let i = 1; i < m.trail.length; i++) {
            const p0 = m.trail[i - 1];
            const p1 = m.trail[i];
            const ageFrac = p1.age / TRAIL_LIFE;
            const a = (1 - ageFrac) * 0.04;
            if (a <= 0.001) continue;

            // Warm amber glow
            ctx.strokeStyle = `rgba(255,200,80,${a.toFixed(4)})`;
            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);
            ctx.lineTo(p1.x, p1.y);
            ctx.stroke();
          }

          // Pass 2: Medium warm trail
          ctx.lineWidth = 2.5;
          for (let i = 1; i < m.trail.length; i++) {
            const p0 = m.trail[i - 1];
            const p1 = m.trail[i];
            const ageFrac = p1.age / TRAIL_LIFE;
            const a = (1 - ageFrac) * 0.12;
            if (a <= 0.001) continue;

            // Color shift: newest = white-yellow, mid = golden, old = dim amber
            let r: number, g: number, b: number;
            if (ageFrac < 0.08) {
              r = 255; g = 252; b = 240;
            } else if (ageFrac < 0.3) {
              const t = (ageFrac - 0.08) / 0.22;
              r = 255; g = 252 - t * 30; b = 240 - t * 120;
            } else if (ageFrac < 0.6) {
              const t = (ageFrac - 0.3) / 0.3;
              r = 255 - t * 20; g = 222 - t * 50; b = 120 - t * 50;
            } else {
              const t = (ageFrac - 0.6) / 0.4;
              r = 235 - t * 80; g = 172 - t * 60; b = 70 + t * 40;
            }

            ctx.strokeStyle = `rgba(${r},${g},${b},${a.toFixed(4)})`;
            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);
            ctx.lineTo(p1.x, p1.y);
            ctx.stroke();
          }

          // Pass 3: Sharp bright core line
          ctx.lineWidth = 0.8;
          for (let i = 1; i < m.trail.length; i++) {
            const p0 = m.trail[i - 1];
            const p1 = m.trail[i];
            const ageFrac = p1.age / TRAIL_LIFE;
            const a = (1 - ageFrac) * 0.35;
            if (a <= 0.001) continue;

            ctx.strokeStyle = `rgba(255,250,235,${a.toFixed(4)})`;
            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);
            ctx.lineTo(p1.x, p1.y);
            ctx.stroke();
          }

          ctx.restore();
        }

        // ── DRAW HEAD ──
        if (headOnScreen) {
          ctx.save();
          ctx.globalCompositeOperation = "lighter";

          // Atmospheric halo — subtle warm glow
          ctx.shadowBlur = 30;
          ctx.shadowColor = "rgba(255,210,100,0.35)";
          ctx.fillStyle = "rgba(255,220,130,0.06)";
          ctx.beginPath();
          ctx.arc(m.x, m.y, 10, 0, Math.PI * 2);
          ctx.fill();

          // Inner glow
          ctx.shadowBlur = 12;
          ctx.shadowColor = "rgba(255,240,180,0.6)";
          ctx.fillStyle = "rgba(255,245,210,0.25)";
          ctx.beginPath();
          ctx.arc(m.x, m.y, 3.5, 0, Math.PI * 2);
          ctx.fill();

          // White-hot plasma point
          ctx.shadowBlur = 6;
          ctx.shadowColor = "rgba(255,255,255,0.9)";
          ctx.fillStyle = "rgba(255,255,252,0.9)";
          ctx.beginPath();
          ctx.arc(m.x, m.y, 1.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 5,
        pointerEvents: "none",
      }}
    />
  );
}
