"use client";

import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useUniverse } from "@/stores/useUniverse";
import type { CameraWaypoint } from "@/types";

/**
 * Camera waypoints — each section has a position and lookAt target.
 * Positions are spaced out in a 3D path through the universe.
 * More waypoints will be added as sections are built.
 */
const WAYPOINTS: CameraWaypoint[] = [
  // Hero — floating in vast space
  { position: [0, 0, 50], lookAt: [0, 0, 0], section: "hero" },
  // About — dolly forward deeper into space
  { position: [0, 2, 25], lookAt: [0, 0, -10], section: "about" },
  // Skills — pan toward planet cluster
  { position: [15, 5, -10], lookAt: [20, 5, -30], section: "skills" },
  // Timeline — constellation vista
  { position: [30, 10, -40], lookAt: [40, 8, -60], section: "timeline" },
  // Passions — drift through phenomena
  { position: [20, 0, -80], lookAt: [10, 0, -100], section: "passions" },
  // Photography — approach Earth
  { position: [0, -5, -110], lookAt: [0, 0, -130], section: "photography" },
  // Portfolio — enter trading station
  { position: [-15, 5, -150], lookAt: [-20, 5, -170], section: "portfolio" },
  // Projects — alien planet surface
  { position: [-10, -10, -190], lookAt: [0, -15, -210], section: "projects" },
  // Blog — galaxy interior
  { position: [10, 5, -230], lookAt: [5, 0, -250], section: "blog" },
  // Contact — zoom out to final point
  { position: [0, 0, -260], lookAt: [0, 0, -280], section: "contact" },
];

export default function CameraRig() {
  const { camera } = useThree();
  const smoothProgress = useRef(0);

  // Build spline curves from waypoints
  const { positionCurve, lookAtCurve } = useMemo(() => {
    const posPoints = WAYPOINTS.map(
      (w) => new THREE.Vector3(w.position[0], w.position[1], w.position[2])
    );
    const lookPoints = WAYPOINTS.map(
      (w) => new THREE.Vector3(w.lookAt[0], w.lookAt[1], w.lookAt[2])
    );

    return {
      positionCurve: new THREE.CatmullRomCurve3(posPoints, false, "centripetal", 0.5),
      lookAtCurve: new THREE.CatmullRomCurve3(lookPoints, false, "centripetal", 0.5),
    };
  }, []);

  useFrame(({ clock }) => {
    const scrollProgress = useUniverse.getState().scrollProgress;
    const bootComplete = useUniverse.getState().bootComplete;
    const skillsActive = useUniverse.getState().skillsSectionActive;
    const timelineActive = useUniverse.getState().timelineSectionActive;

    // Yield control to section-specific camera controllers
    if (skillsActive || timelineActive) return;

    // Smooth interpolation to avoid jitter
    smoothProgress.current += (scrollProgress - smoothProgress.current) * 0.05;

    // Clamp to [0, 1]
    const t = Math.max(0, Math.min(1, smoothProgress.current));

    // Get position and lookAt from curves
    const pos = positionCurve.getPointAt(t);
    const look = lookAtCurve.getPointAt(t);

    // Hero breathing animation — gentle sine wave drift when near start
    if (bootComplete && t < 0.05) {
      const breathe = clock.getElapsedTime();
      pos.x += Math.sin(breathe * 0.3) * 0.15;
      pos.y += Math.sin(breathe * 0.5) * 0.1;
      pos.z += Math.sin(breathe * 0.2) * 0.08;
    }

    camera.position.copy(pos);
    camera.lookAt(look);
  });

  return null;
}
