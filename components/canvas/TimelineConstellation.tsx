"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useUniverse } from "@/stores/useUniverse";
import { timelineEntries } from "@/content/timeline";
import {
  computeConstellationLayout,
  computeConnections,
} from "@/lib/constellationLayout";

/**
 * TimelineConstellation — R3F component inside the existing Canvas.
 *
 * STAR SIZE:  Real entry stars are radius 0.12. Empty stars are radius 0.04.
 *             No atmosphere glow sphere exists — only a PointLight.
 * LABELS:    Every real entry star has screen position projected and stored
 *             in the zustand store for TimelineOverlay to render labels.
 * HOVER:     The raycaster uses mouse coordinates from a useRef updated by
 *             mousemove, intersects only real-entry mesh refs, and sets
 *             hoveredStarId in the store on every frame.
 */

const SECTION_START = 0.5;
const SECTION_END = 0.75;
const SECTION_RANGE = SECTION_END - SECTION_START;

const CAM_START = new THREE.Vector3(0, 0, 80);
const CAM_END = new THREE.Vector3(0, -15, 30);
const _camTarget = new THREE.Vector3();
const _lookAt = new THREE.Vector3(0, 0, 0);
const _worldPos = new THREE.Vector3();
const _projected = new THREE.Vector3();

/* ─── Seeded background dim stars ─── */

function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface BgStar {
  pos: [number, number, number];
  radius: number;
}

function buildBgStars(): BgStar[] {
  const rng = mulberry32(999);
  const stars: BgStar[] = [];
  for (let i = 0; i < 10; i++) {
    stars.push({
      pos: [rng() * 120 - 60, rng() * 80 - 40, -40 - rng() * 40],
      radius: 0.05 + rng() * 0.03,
    });
  }
  return stars;
}

/* ─── Derived counts ─── */

const realEntriesList = timelineEntries.filter((e) => e.type !== "empty");
const totalReal = realEntriesList.length;

/* ─── Main component ─── */

export default function TimelineConstellation() {
  const groupRef = useRef<THREE.Group>(null);
  const { camera, gl } = useThree();

  // Mouse position ref — updated via mousemove, no useState lag
  const mouse = useRef(new THREE.Vector2());
  const raycasterRef = useRef(new THREE.Raycaster());

  // Set raycaster thresholds for small targets
  useEffect(() => {
    raycasterRef.current.params.Line = { threshold: 0.5 };
  }, []);

  // Track mouse position
  useEffect(() => {
    const canvas = gl.domElement;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };
    canvas.addEventListener("mousemove", handleMouseMove);
    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
    };
  }, [gl]);

  // Stable layout — computed once, memoised, never re-randomised
  const positions = useMemo(
    () => computeConstellationLayout(timelineEntries),
    []
  );
  const connections = useMemo(
    () => computeConnections(timelineEntries, positions),
    [positions]
  );
  const bgStars = useMemo(() => buildBgStars(), []);

  // Refs for imperative animation
  const starMeshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const ring1Refs = useRef<(THREE.Mesh | null)[]>([]);
  const ring2Refs = useRef<(THREE.Mesh | null)[]>([]);
  const lineMaterialRefs = useRef<(THREE.LineBasicMaterial | null)[]>([]);
  const illumination = useRef(new Float32Array(timelineEntries.length));
  const hoverScales = useRef(
    new Float32Array(timelineEntries.length).fill(1)
  );
  const hoveredIdx = useRef(-1);
  const wasActive = useRef(false);
  const prevIlluminatedSize = useRef(0);
  const frameCount = useRef(0);

  // Line geometries — one per connection, each with its own material ref
  const lineGeos = useMemo(() => {
    return connections.map(([a, b]) => {
      const geo = new THREE.BufferGeometry();
      geo.setFromPoints([positions[a], positions[b]]);
      return geo;
    });
  }, [connections, positions]);

  // Collect only real entry mesh refs for raycasting
  const realMeshIndices = useMemo(() => {
    return timelineEntries
      .map((e, i) => (e.type !== "empty" ? i : -1))
      .filter((i) => i >= 0);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      useUniverse.getState().setTimelineSectionActive(false);
      useUniverse.getState().setHoveredStarId(null);
    };
  }, []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const progress = useUniverse.getState().scrollProgress;
    const visible = progress >= SECTION_START && progress <= SECTION_END;

    groupRef.current.visible = visible;

    // Sync store flag
    if (visible && !wasActive.current) {
      useUniverse.getState().setTimelineSectionActive(true);
      wasActive.current = true;
    } else if (!visible && wasActive.current) {
      useUniverse.getState().setTimelineSectionActive(false);
      useUniverse.getState().setHoveredStarId(null);
      wasActive.current = false;
    }

    if (!visible) return;

    const sub = Math.max(
      0,
      Math.min(1, (progress - SECTION_START) / SECTION_RANGE)
    );
    const t = clock.elapsedTime;
    frameCount.current++;

    // ── Camera ──
    _camTarget.lerpVectors(CAM_START, CAM_END, sub);
    _camTarget.x += Math.sin(sub * Math.PI) * 3;

    const fadeProgress = sub > 0.92 ? (sub - 0.92) / 0.08 : 0;
    if (fadeProgress > 0) {
      _camTarget.z -= fadeProgress * 15;
    }

    camera.position.lerp(_camTarget, 0.04);
    camera.lookAt(_lookAt);
    camera.up.set(0, 1, 0);

    // ── Raycaster hover detection ──
    // Use our own raycaster with mouse ref (not the stale pointer from R3F)
    raycasterRef.current.setFromCamera(mouse.current, camera);
    const realMeshes: THREE.Mesh[] = [];
    for (const idx of realMeshIndices) {
      const m = starMeshRefs.current[idx];
      if (m) realMeshes.push(m);
    }
    const intersects = raycasterRef.current.intersectObjects(realMeshes, false);
    let newHoveredIdx = -1;
    if (intersects.length > 0) {
      const hitMesh = intersects[0].object;
      for (const idx of realMeshIndices) {
        if (starMeshRefs.current[idx] === hitMesh) {
          newHoveredIdx = idx;
          break;
        }
      }
    }
    if (newHoveredIdx !== hoveredIdx.current) {
      hoveredIdx.current = newHoveredIdx;
      if (newHoveredIdx >= 0) {
        useUniverse
          .getState()
          .setHoveredStarId(timelineEntries[newHoveredIdx].id);
      } else {
        useUniverse.getState().setHoveredStarId(null);
      }
    }

    // ── Illumination tracking ──
    const illuminated = new Set<string>();

    // ── Stars ──
    for (let i = 0; i < timelineEntries.length; i++) {
      const entry = timelineEntries[i];
      const mesh = starMeshRefs.current[i];
      if (!mesh) continue;

      const isReal = entry.type !== "empty";

      let isIlluminated: boolean;
      if (isReal) {
        const realIndex = realEntriesList.indexOf(entry);
        isIlluminated = sub >= realIndex / totalReal;
        if (isIlluminated) illuminated.add(entry.id);
      } else {
        // Empty stars are always visible — no illumination animation
        isIlluminated = true;
      }

      const target = isIlluminated ? 1 : 0;
      illumination.current[i] += (target - illumination.current[i]) * 0.08;
      const illum = illumination.current[i];

      // Hover scale lerp
      const isHovered = hoveredIdx.current === i;
      const hTarget = isHovered ? 1.4 : 1.0;
      hoverScales.current[i] +=
        (hTarget - hoverScales.current[i]) * 0.12;

      const mat = mesh.material as THREE.MeshBasicMaterial;

      if (!isReal) {
        // Empty star — always visible, dim blue-grey, no animation
        mesh.scale.setScalar(1);
        mat.opacity = 1.0 * (1 - fadeProgress);
      } else {
        // Real star — illumination-driven
        const s = (0.3 + illum * 0.7) * hoverScales.current[i];
        mesh.scale.setScalar(s);
        mat.opacity = Math.max(0.05, illum) * (1 - fadeProgress);
      }

      // Current star pulse rings
      if (entry.current) {
        const r1 = ring1Refs.current[i];
        const r2 = ring2Refs.current[i];
        if (r1) {
          r1.rotation.z += 0.003;
          const pulse1 = 0.6 + Math.sin(t * 2) * 0.4;
          r1.scale.setScalar(1 + Math.sin(t * 2) * 0.08);
          (r1.material as THREE.MeshBasicMaterial).opacity =
            illum * pulse1 * (1 - fadeProgress);
        }
        if (r2) {
          r2.rotation.z += 0.003;
          const pulse2 = 0.3 + Math.sin(t * 2 + 1) * 0.3;
          r2.scale.setScalar(1 + Math.sin(t * 2 + 1) * 0.12);
          (r2.material as THREE.MeshBasicMaterial).opacity =
            illum * pulse2 * (1 - fadeProgress);
        }
      }
    }

    // ── Update illuminated star IDs in store (only when changed) ──
    if (illuminated.size !== prevIlluminatedSize.current) {
      useUniverse.getState().setIlluminatedStarIds(illuminated);
      prevIlluminatedSize.current = illuminated.size;
    }

    // ── Lines ──
    for (let i = 0; i < connections.length; i++) {
      const [a, b] = connections[i];
      const mat = lineMaterialRefs.current[i];
      if (!mat) continue;
      const bothLit =
        illumination.current[a] > 0.5 && illumination.current[b] > 0.5;
      const lineTarget = bothLit ? 0.25 : 0;
      mat.opacity += (lineTarget - mat.opacity) * 0.08;
      mat.opacity *= 1 - fadeProgress;
    }

    // ── Project star screen positions (throttled to every 3rd frame) ──
    if (frameCount.current % 3 === 0) {
      const canvas = gl.domElement;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const newPositions: Record<
        string,
        { x: number; y: number; visible: boolean }
      > = {};

      for (let i = 0; i < timelineEntries.length; i++) {
        const mesh = starMeshRefs.current[i];
        if (!mesh) continue;
        mesh.getWorldPosition(_worldPos);
        _projected.copy(_worldPos).project(camera);
        const screenX = ((_projected.x + 1) / 2) * w;
        const screenY = ((-_projected.y + 1) / 2) * h;
        const behind = _projected.z < 0 || _projected.z > 1;
        newPositions[timelineEntries[i].id] = {
          x: screenX,
          y: screenY,
          visible: !behind,
        };
      }
      useUniverse.getState().setBatchStarScreenPos(newPositions);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Faint grid — star map chart lines, very subtle */}
      <gridHelper
        args={[120, 30, "#0a1520", "#0a1520"]}
        position={[0, -20, 0]}
      />

      {/* ── Stars ── */}
      {timelineEntries.map((entry, i) => {
        const isReal = entry.type !== "empty";
        // FIX 1: Correct star radii — points of light, not planets
        const radius = entry.current ? 0.16 : isReal ? 0.12 : 0.04;
        const pos = positions[i];

        return (
          <group key={entry.id} position={pos}>
            {/* Star sphere */}
            <mesh
              ref={(el) => {
                starMeshRefs.current[i] = el;
              }}
            >
              <sphereGeometry args={[radius, 16, 16]} />
              <meshBasicMaterial
                color={isReal ? entry.accent : "#1a3a5c"}
                transparent={isReal}
                opacity={isReal ? 0.05 : 1}
              />
            </mesh>

            {/* FIX 1: PointLight glow instead of glow sphere */}
            {isReal && (
              <pointLight
                intensity={0.4}
                distance={4}
                color={entry.accent}
              />
            )}

            {/* Current star: double pulse rings — FIX 1: smaller ring sizes */}
            {entry.current && (
              <>
                <mesh
                  ref={(el) => {
                    ring1Refs.current[i] = el;
                  }}
                  rotation={[Math.PI / 2, 0, 0]}
                >
                  <torusGeometry args={[0.22, 0.008, 8, 40]} />
                  <meshBasicMaterial
                    color="#C8FF00"
                    transparent
                    opacity={0}
                  />
                </mesh>
                <mesh
                  ref={(el) => {
                    ring2Refs.current[i] = el;
                  }}
                  rotation={[Math.PI / 3, 0.4, 0]}
                >
                  <torusGeometry args={[0.35, 0.005, 8, 40]} />
                  <meshBasicMaterial
                    color="#C8FF00"
                    transparent
                    opacity={0}
                  />
                </mesh>
              </>
            )}
          </group>
        );
      })}

      {/* ── Constellation lines ── */}
      {connections.map((_conn, i) => (
        <lineSegments key={`line-${i}`} geometry={lineGeos[i]}>
          <lineBasicMaterial
            ref={(el) => {
              lineMaterialRefs.current[i] = el;
            }}
            color="#00C8C8"
            transparent
            opacity={0}
          />
        </lineSegments>
      ))}

      {/* ── Background dim stars ── */}
      {bgStars.map((s, i) => (
        <mesh key={`bg-${i}`} position={s.pos}>
          <sphereGeometry args={[s.radius, 6, 6]} />
          <meshBasicMaterial color="#1a2a3a" transparent opacity={0.4} />
        </mesh>
      ))}
    </group>
  );
}
