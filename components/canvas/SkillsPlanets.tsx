"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useUniverse } from "@/stores/useUniverse";
import { planets } from "@/content/skills";
import {
  createSyntharTexture,
  createChromaraTexture,
  createVelocisTexture,
} from "@/lib/planetTextures";

/**
 * SkillsPlanets — renders 3 planets + moons inside the EXISTING R3F scene.
 *
 * ✓ Zero new WebGLRenderer — shares the global Canvas
 * ✓ SphereGeometry(r, 64, 64) — smooth spheres
 * ✓ CanvasTexture + MeshPhongMaterial — no vertex displacement
 * ✓ Takes over camera via useThree when skills section is active
 * ✓ CameraRig yields via skillsSectionActive flag
 */

const PLANET_POSITIONS: THREE.Vector3[] = [
  new THREE.Vector3(-6, 0, 0),
  new THREE.Vector3(3, 1.5, -2),
  new THREE.Vector3(7, -2, 1),
];

const CAMERA_TARGETS: THREE.Vector3[] = [
  new THREE.Vector3(-4, 0.5, 8),
  new THREE.Vector3(2, 2, 7),
  new THREE.Vector3(6, -1, 7),
];

const ATMOS_COLORS = ["#C8FF00", "#cc44ff", "#ff6633"];
const PLANET_RADII = [2.2, 1.6, 1.4];

interface MoonData {
  skillName: string;
  proficiency: number;
  radius: number;
  orbitR: number;
  speed: number;
  tiltX: number;
  tiltZ: number;
  phase: number;
}

/** Pre-compute moon orbit data for all planets */
function buildMoonData(): MoonData[][] {
  return planets.map((p, pi) => {
    return p.skills.map((skill, si) => {
      const radius = (skill.proficiency / 10) * 0.22 + 0.06;
      const orbitR = PLANET_RADII[pi] * 1.5 + si * 0.5 + 0.8;
      const speed = 0.15 + Math.random() * 0.3;
      const tiltX = (10 + Math.random() * 50) * (Math.PI / 180);
      const tiltZ = (Math.random() - 0.5) * 0.5;
      const phase = (si / p.skills.length) * Math.PI * 2;
      return { skillName: skill.name, proficiency: skill.proficiency, radius, orbitR, speed, tiltX, tiltZ, phase };
    });
  });
}

/* ─── Per-Planet sub-component ─── */

function PlanetGroup({
  planetIdx,
  texture,
  isActive,
  moonDataList,
}: {
  planetIdx: number;
  texture: THREE.CanvasTexture;
  isActive: boolean;
  moonDataList: MoonData[];
}) {
  const planetMeshRef = useRef<THREE.Mesh>(null);
  const moonRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;

    // Planet rotation
    if (planetMeshRef.current) {
      planetMeshRef.current.rotation.y += 0.001;

      // Active planet pulse
      if (isActive) {
        const s = 1.0 + Math.sin(t * 0.8) * 0.03;
        planetMeshRef.current.scale.setScalar(s);
      } else {
        planetMeshRef.current.scale.setScalar(1);
      }
    }

    // Moon orbits
    moonRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const m = moonDataList[i];
      const angle = t * m.speed + m.phase;
      mesh.position.x = Math.cos(angle) * m.orbitR * Math.cos(m.tiltX);
      mesh.position.y = Math.sin(angle) * m.orbitR * Math.sin(m.tiltX);
      mesh.position.z = Math.sin(angle + m.tiltZ) * m.orbitR * 0.4;
    });
  });

  const pos = PLANET_POSITIONS[planetIdx];
  const r = PLANET_RADII[planetIdx];

  return (
    <group position={pos}>
      {/* Planet sphere — smooth, 64 segments */}
      <mesh ref={planetMeshRef}>
        <sphereGeometry args={[r, 64, 64]} />
        <meshPhongMaterial map={texture} shininess={15} specular={new THREE.Color(0x222233)} />
      </mesh>

      {/* Atmosphere glow */}
      <mesh>
        <sphereGeometry args={[r * 1.08, 32, 32]} />
        <meshBasicMaterial
          color={ATMOS_COLORS[planetIdx]}
          transparent
          opacity={planetIdx === 0 ? 0.07 : planetIdx === 1 ? 0.08 : 0.06}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Ring — Chromara only */}
      {planetIdx === 1 && (
        <mesh rotation={[Math.PI * 0.42, 0, 0]}>
          <torusGeometry args={[2.6, 0.18, 2, 80]} />
          <meshBasicMaterial color="#cc44ff" transparent opacity={0.5} />
        </mesh>
      )}

      {/* Planet-local light (illuminates moons from planet side) */}
      <pointLight color={ATMOS_COLORS[planetIdx]} intensity={0.3} distance={15} />

      {/* Moons */}
      {moonDataList.map((m, i) => (
        <mesh
          key={m.skillName}
          ref={(el) => { moonRefs.current[i] = el; }}
        >
          <sphereGeometry args={[m.radius, 16, 16]} />
          <meshPhongMaterial color="#ffffff" transparent opacity={0.9} shininess={30} />
        </mesh>
      ))}
    </group>
  );
}

/* ─── Main SkillsPlanets component ─── */

export default function SkillsPlanets() {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const cameraLerpTarget = useRef(new THREE.Vector3());
  const lookAtTarget = useRef(new THREE.Vector3());

  // Build textures once (client-side only)
  const textures = useMemo(() => {
    if (typeof window === "undefined") return [null, null, null];
    return [createSyntharTexture(), createChromaraTexture(), createVelocisTexture()];
  }, []);

  // Build moon data once
  const allMoonData = useMemo(() => buildMoonData(), []);

  // Track active state for store sync
  const wasActive = useRef(false);

  useFrame(() => {
    const progress = useUniverse.getState().scrollProgress;
    const sectionStart = 0.28;
    const sectionEnd = 0.45;
    const visible = progress >= sectionStart && progress <= sectionEnd;

    // Toggle visibility
    if (groupRef.current) {
      groupRef.current.visible = visible;
    }

    // Sync skillsSectionActive flag
    if (visible && !wasActive.current) {
      useUniverse.getState().setSkillsSectionActive(true);
      wasActive.current = true;
    } else if (!visible && wasActive.current) {
      useUniverse.getState().setSkillsSectionActive(false);
      wasActive.current = false;
    }

    // Skip camera work when not visible
    if (!visible) return;

    // Active planet
    const sub = (progress - sectionStart) / (sectionEnd - sectionStart);
    const activeIdx = sub < 0.33 ? 0 : sub < 0.66 ? 1 : 2;

    // Camera takeover — lerp toward active planet view
    cameraLerpTarget.current.copy(CAMERA_TARGETS[activeIdx]);
    camera.position.lerp(cameraLerpTarget.current, 0.05);

    lookAtTarget.current.copy(PLANET_POSITIONS[activeIdx]);
    camera.lookAt(lookAtTarget.current);
  });

  // Cleanup: ensure flag is reset on unmount
  useEffect(() => {
    return () => {
      useUniverse.getState().setSkillsSectionActive(false);
    };
  }, []);

  // Derive active index for passing to children
  const scrollProgress = useUniverse((s) => s.scrollProgress);
  const sub = scrollProgress >= 0.28 && scrollProgress <= 0.45
    ? (scrollProgress - 0.28) / 0.17
    : -1;
  const activeIdx = sub < 0 ? 0 : sub < 0.33 ? 0 : sub < 0.66 ? 1 : 2;

  return (
    <group ref={groupRef}>
      {/* Scene-local light */}
      <pointLight position={[0, 5, 8]} intensity={1.2} color="#ffffff" />

      {/* Three planets */}
      {planets.map((_, i) => (
        <PlanetGroup
          key={planets[i].id}
          planetIdx={i}
          texture={textures[i]!}
          isActive={activeIdx === i}
          moonDataList={allMoonData[i]}
        />
      ))}
    </group>
  );
}
