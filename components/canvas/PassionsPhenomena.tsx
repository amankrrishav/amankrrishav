"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useUniverse } from "@/stores/useUniverse";
import { passions } from "@/content/passions";

import { pulsarFrag } from "@/lib/shaders/pulsar.glsl";
import { blackholeFrag } from "@/lib/shaders/blackhole.glsl";
import { nebulaFrag } from "@/lib/shaders/nebula.glsl";
import { binarystarFrag } from "@/lib/shaders/binarystar.glsl";
import { supernovaFrag } from "@/lib/shaders/supernova.glsl";
import { wormholeFrag } from "@/lib/shaders/wormhole.glsl";

/**
 * PassionsPhenomena — 6 cosmic shader phenomena inside the existing Canvas.
 *
 * SHADER CHECK:    All 6 use THREE.ShaderMaterial with custom GLSL. Zero textures.
 * BILLBOARD CHECK: Each mesh copies camera.quaternion every frame.
 * CAMERA CHECK:    Owns camera when passionsSectionActive is true.
 */

const SECTION_START = 0.76;
const SECTION_END = 0.93;
const SECTION_RANGE = SECTION_END - SECTION_START;

const SHADERS: Record<string, string> = {
  pulsar: pulsarFrag,
  blackhole: blackholeFrag,
  nebula: nebulaFrag,
  binarystar: binarystarFrag,
  supernova: supernovaFrag,
  wormhole: wormholeFrag,
};

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export default function PassionsPhenomena() {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const matRefs = useRef<(THREE.ShaderMaterial | null)[]>([]);
  const wasActive = useRef(false);
  const prevIdx = useRef(-1);

  // Pre-build uniforms per phenomenon (stable references)
  const uniformSets = useMemo(() => {
    return passions.map((p) => ({
      uTime: { value: 0 },
      uApproach: { value: 0 },
      uAccent: { value: new THREE.Color(p.accent) },
      uSecondary: { value: new THREE.Color(p.secondary) },
      uOpacity: { value: 1.0 },
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      useUniverse.getState().setPassionsSectionActive(false);
    };
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const progress = useUniverse.getState().scrollProgress;
    const visible = progress >= SECTION_START && progress <= SECTION_END;

    groupRef.current.visible = visible;

    // Sync store flag
    if (visible && !wasActive.current) {
      useUniverse.getState().setPassionsSectionActive(true);
      wasActive.current = true;
    } else if (!visible && wasActive.current) {
      useUniverse.getState().setPassionsSectionActive(false);
      wasActive.current = false;
    }

    if (!visible) return;

    const t = state.clock.elapsedTime;
    const sub = Math.max(
      0,
      Math.min(1, (progress - SECTION_START) / SECTION_RANGE)
    );
    const phenomenonIdx = Math.min(Math.floor(sub * 6), 5);
    const localSub = (sub * 6) % 1;

    // Update store if phenomenon changed
    if (phenomenonIdx !== prevIdx.current) {
      useUniverse.getState().setActivePhenomenonIdx(phenomenonIdx);
      prevIdx.current = phenomenonIdx;
    }

    // Section fade-in/out envelope
    let sectionOpacity = 1.0;
    if (sub < 0.05) {
      sectionOpacity = sub / 0.05;
    } else if (sub > 0.90) {
      sectionOpacity = (1.0 - sub) / 0.10;
    }
    sectionOpacity = Math.max(0, Math.min(1, sectionOpacity));

    // ── Camera choreography ──
    const phenomenonPos = new THREE.Vector3(...passions[phenomenonIdx].position);
    // Stand-off distance: camera stays 15–25 units from phenomenon
    const standoff = 25 - localSub * 10;
    const dirFromPhenomenon = phenomenonPos.clone().negate().normalize();
    const targetCameraPos = phenomenonPos
      .clone()
      .add(dirFromPhenomenon.multiplyScalar(standoff));

    // Exit acceleration at sub > 0.90
    if (sub > 0.90) {
      const exitProgress = (sub - 0.90) / 0.10;
      const exitTarget = new THREE.Vector3(0, 0, 25);
      targetCameraPos.lerp(exitTarget, exitProgress);
    }

    camera.position.lerp(targetCameraPos, 0.035);
    camera.lookAt(phenomenonPos);
    camera.up.set(0, 1, 0);

    // ── Update all shader materials ──
    for (let i = 0; i < passions.length; i++) {
      const mat = matRefs.current[i];
      const mesh = meshRefs.current[i];
      if (!mat || !mesh) continue;

      // Billboard: face camera
      mesh.quaternion.copy(camera.quaternion);

      // Uniforms
      mat.uniforms.uTime.value = t;
      mat.uniforms.uApproach.value = i === phenomenonIdx ? localSub : 0;
      mat.uniforms.uOpacity.value = sectionOpacity;

      // Scale: active phenomenon scales up, others breathe dimly
      if (i === phenomenonIdx) {
        const targetScale = 1.0 + localSub * 0.3;
        mesh.scale.setScalar(
          mesh.scale.x + (targetScale - mesh.scale.x) * 0.08
        );
      } else {
        const breathe = 0.8 + Math.sin(t * 0.5 + i * 1.2) * 0.05;
        mesh.scale.setScalar(
          mesh.scale.x + (breathe - mesh.scale.x) * 0.04
        );
      }
    }
  });

  return (
    <group ref={groupRef}>
      {passions.map((passion, i) => (
        <mesh
          key={passion.id}
          ref={(el) => {
            meshRefs.current[i] = el;
          }}
          position={passion.position}
        >
          <planeGeometry args={[8, 8]} />
          <shaderMaterial
            ref={(el) => {
              matRefs.current[i] = el;
            }}
            vertexShader={vertexShader}
            fragmentShader={SHADERS[passion.phenomenonType]}
            uniforms={uniformSets[i]}
            transparent={true}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}
