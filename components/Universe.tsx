"use client";

import Scene from "@/components/canvas/Scene";
import BootSequence from "@/components/overlays/BootSequence";
import HeroOverlay from "@/components/overlays/HeroOverlay";
import AboutOverlay from "@/components/overlays/AboutOverlay";
import ShootingStarsOverlay from "@/components/overlays/ShootingStarsOverlay";
import SkillsOverlay from "@/components/overlays/SkillsOverlay";
import TimelineOverlay from "@/components/overlays/TimelineOverlay";
import PassionsOverlay from "@/components/overlays/PassionsOverlay";

/**
 * Universe — the main orchestrator component.
 * 
 * Layers:
 * 1. Scroll spacer (creates scrollable height, ~2000vh)
 * 2. Fixed R3F Canvas (z-index: 0) — 3D universe
 * 3. Shooting stars overlay (z-index: 5) — CSS-based, guaranteed visible
 * 4. Fixed HTML overlays (z-index: 10+) — section content
 * 5. Boot sequence (z-index: 100) — startup animation
 */
export default function Universe() {
  return (
    <>
      {/* Scroll spacer — creates the scrollable height */}
      <div className="scroll-spacer" style={{ height: "2000vh" }} />

      {/* 3D Canvas Layer — fixed fullscreen */}
      <Scene />

      {/* Shooting Stars — CSS overlay, always visible */}
      <ShootingStarsOverlay />

      {/* Section Overlays — positioned over the canvas */}
      <HeroOverlay />
      <AboutOverlay />
      <SkillsOverlay />
      <TimelineOverlay />
      <PassionsOverlay />

      {/* Boot Sequence — highest z-index, covers everything during boot */}
      <BootSequence />
    </>
  );
}
