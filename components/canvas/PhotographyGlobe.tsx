"use client";
// ─── SECTION BOUNDARY ──────────────────────
// components/canvas/PhotographyGlobe.tsx

import { useRef, useMemo, useEffect, Suspense } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { useUniverse } from "@/stores/useUniverse";
import { INDIA_PINS, latLngToVec3 } from "@/content/photography";
import { earthVertexShader, earthFragmentShader } from "@/lib/shaders/earthMaterial.glsl";
import { atmosphereVertexShader, atmosphereFragmentShader } from "@/lib/shaders/atmosphere.glsl";

const SECTION_START = 0.94;
const SECTION_END = 0.99;
const SECTION_RANGE = SECTION_END - SECTION_START;
const TILT = THREE.MathUtils.degToRad(23.5);

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/* ─── Canvas textures for pin dot & ring ─── */
function makeDotTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 32; c.height = 32;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.3, "rgba(255,255,255,0.8)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(c);
}

function makeRingTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 64; c.height = 64;
  const ctx = c.getContext("2d")!;
  ctx.strokeStyle = "rgba(255,255,255,1)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(32, 32, 24, 0, Math.PI * 2);
  ctx.stroke();
  return new THREE.CanvasTexture(c);
}

/* ─── Wireframe fallback while textures load ─── */
function EarthFallback() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => { if (ref.current) ref.current.rotation.y += 0.001; });
  return (
    <mesh ref={ref} rotation-z={TILT}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshBasicMaterial color="#1a3a6b" wireframe />
    </mesh>
  );
}

/* ─── Main Earth System (loaded inside Suspense) ─── */
function EarthSystem() {
  const { camera, gl } = useThree();
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const wasActive = useRef(false);
  const frameCount = useRef(0);

  // Dive state (click-driven, NOT scroll-driven)
  const isDiving = useRef(false);
  const isReversing = useRef(false);
  const diveProgress = useRef(0);
  const diveTarget = useRef<typeof INDIA_PINS[0] | null>(null);
  const preDiveRotY = useRef(0);

  // Mouse for raycaster
  const mouse = useRef(new THREE.Vector2());
  const raycaster = useRef(new THREE.Raycaster());
  const pinSphereRefs = useRef<(THREE.Mesh | null)[]>([]);

  // Canvas textures for pins
  const dotTex = useMemo(() => makeDotTexture(), []);
  const ringTex = useMemo(() => makeRingTexture(), []);

  // Load NASA textures
  const [dayMap, nightMap, cloudMap, specMap] = useTexture([
    "https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73909/world.topo.bathy.200412.3x5400x2700.jpg",
    "https://eoimages.gsfc.nasa.gov/images/imagerecords/79000/79765/dnb_land_ocean_ice.2012.3600x1800.jpg",
    "https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57747/cloud_combined_2048.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/1/1e/Earthspec1k.jpg",
  ]);

  // Earth custom shader material
  const earthMat = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: earthVertexShader,
      fragmentShader: earthFragmentShader,
      uniforms: {
        u_dayMap: { value: dayMap },
        u_nightMap: { value: nightMap },
        u_specMap: { value: specMap },
        u_sunDirection: { value: new THREE.Vector3(1, 0.3, 0.5).normalize() },
        u_time: { value: 0 },
        u_altitude: { value: 1.0 },
      },
    });
  }, [dayMap, nightMap, specMap]);

  // Atmosphere materials
  const atmoOuter = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: atmosphereVertexShader,
    fragmentShader: atmosphereFragmentShader,
    uniforms: {
      u_color: { value: new THREE.Color(0x5599ff) },
      u_power: { value: 3.5 },
      u_opacity: { value: 0.72 },
    },
    side: THREE.BackSide, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), []);

  const atmoInner = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: atmosphereVertexShader,
    fragmentShader: atmosphereFragmentShader,
    uniforms: {
      u_color: { value: new THREE.Color(0x2244ff) },
      u_power: { value: 6.0 },
      u_opacity: { value: 0.18 },
    },
    side: THREE.BackSide, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), []);

  // Cloud material ref for opacity control
  const cloudMat = useRef<THREE.MeshStandardMaterial>(null);

  // Mouse tracking
  useEffect(() => {
    const canvas = gl.domElement;
    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.current.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      mouse.current.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    };
    const onClick = () => {
      const hoveredId = useUniverse.getState().hoveredPinId;
      if (hoveredId && !isDiving.current) {
        const pin = INDIA_PINS.find(p => p.id === hoveredId);
        if (pin) {
          diveTarget.current = pin;
          isDiving.current = true;
          isReversing.current = false;
          diveProgress.current = 0;
          preDiveRotY.current = earthRef.current?.rotation.y ?? 0;
          useUniverse.getState().setPhotographyDiveActive(true);
          useUniverse.getState().setActivePinId(pin.id);
        }
      }
    };
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("click", onClick);
    return () => {
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("click", onClick);
    };
  }, [gl]);

  // Listen for dive reverse (from overlay back button)
  useEffect(() => {
    return useUniverse.subscribe((state) => {
      if (state.diveReversing && isDiving.current && !isReversing.current) {
        isReversing.current = true;
        useUniverse.getState().setPhotographyGalleryOpen(false);
      }
    });
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      useUniverse.getState().setPhotographyActive(false);
      useUniverse.getState().setPhotographyDiveActive(false);
      useUniverse.getState().setPhotographyGalleryOpen(false);
      useUniverse.getState().setActivePinId(null);
      useUniverse.getState().setHoveredPinId(null);
    };
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const progress = useUniverse.getState().scrollProgress;
    const visible = progress >= SECTION_START - 0.02 && progress <= SECTION_END + 0.02;
    groupRef.current.visible = visible;

    if (visible && !wasActive.current) {
      useUniverse.getState().setPhotographyActive(true);
      wasActive.current = true;
    } else if (!visible && wasActive.current) {
      useUniverse.getState().setPhotographyActive(false);
      useUniverse.getState().setPhotographyDiveActive(false);
      useUniverse.getState().setPhotographyGalleryOpen(false);
      useUniverse.getState().setActivePinId(null);
      isDiving.current = false;
      wasActive.current = false;
    }
    if (!visible) return;

    const sub = clamp((progress - SECTION_START) / SECTION_RANGE, 0, 1);
    const t = state.clock.elapsedTime;
    frameCount.current++;

    // ── Camera: entry cinematic ──
    if (!isDiving.current) {
      const entryT = easeInOutCubic(clamp(sub / 0.4, 0, 1));
      const targetZ = THREE.MathUtils.lerp(12, 2.8, entryT);

      // Exit pull-back
      let camZ = targetZ;
      if (sub > 0.85) {
        const exitT = (sub - 0.85) / 0.15;
        camZ = THREE.MathUtils.lerp(targetZ, 8, exitT);
      }

      camera.position.x += (0 - camera.position.x) * delta * 3;
      camera.position.y += (0 - camera.position.y) * delta * 3;
      camera.position.z += (camZ - camera.position.z) * delta * 3;
      camera.lookAt(0, 0, 0);
      camera.up.set(0, 1, 0);
    }

    // ── Globe rotation (idle) ──
    if (!isDiving.current && earthRef.current && cloudRef.current) {
      earthRef.current.rotation.y += 0.00008;
      cloudRef.current.rotation.y += 0.000095;
    }

    // ── Dive sequence ──
    if (isDiving.current && diveTarget.current) {
      const pin = diveTarget.current;
      const speed = 0.6;
      if (isReversing.current) {
        diveProgress.current -= delta * speed;
        if (diveProgress.current <= 0) {
          diveProgress.current = 0;
          isDiving.current = false;
          isReversing.current = false;
          useUniverse.getState().setPhotographyDiveActive(false);
          useUniverse.getState().setDiveReversing(false);
          useUniverse.getState().setActivePinId(null);
          diveTarget.current = null;
        }
      } else {
        diveProgress.current += delta * speed;
        if (diveProgress.current >= 1) {
          diveProgress.current = 1;
          useUniverse.getState().setPhotographyGalleryOpen(true);
        }
      }

      const dp = clamp(diveProgress.current, 0, 1);

      // Phase 1: rotate earth to face pin toward camera
      if (dp < 0.35 && earthRef.current) {
        const [px, , pz] = latLngToVec3(pin.lat, pin.lng, 1.0);
        const pinAngle = -Math.atan2(px, pz);
        const targetRotY = pinAngle;
        earthRef.current.rotation.y += (targetRotY - earthRef.current.rotation.y) * delta * 4;
        if (cloudRef.current) cloudRef.current.rotation.y = earthRef.current.rotation.y;
      }

      // Phase 2: camera dive toward pin surface
      if (dp >= 0.35) {
        const diveT = clamp((dp - 0.35) / 0.45, 0, 1);
        const eased = easeInOutCubic(diveT);
        const pinWorld = latLngToVec3(pin.lat, pin.lng, 1.08);
        const targetPos = new THREE.Vector3(
          THREE.MathUtils.lerp(0, pinWorld[0] * 2.6, eased),
          THREE.MathUtils.lerp(0, pinWorld[1] * 2.6, eased),
          THREE.MathUtils.lerp(2.8, 1.08 + pinWorld[2], eased),
        );
        camera.position.lerp(targetPos, delta * 4);
        camera.lookAt(0, 0, 0);

        // Shader: altitude decreases
        earthMat.uniforms.u_altitude.value = 1.0 - eased;
        // Cloud fade
        if (cloudMat.current) {
          cloudMat.current.opacity = 1.0 - eased;
        }
      }
    } else {
      // Reset altitude when not diving
      earthMat.uniforms.u_altitude.value += (1.0 - earthMat.uniforms.u_altitude.value) * delta * 2;
      if (cloudMat.current) {
        cloudMat.current.opacity += (1.0 - cloudMat.current.opacity) * delta * 2;
      }
    }

    // ── Pin raycasting (every other frame) ──
    if (frameCount.current % 2 === 0 && !isDiving.current) {
      raycaster.current.setFromCamera(mouse.current, camera);
      const meshes = pinSphereRefs.current.filter(Boolean) as THREE.Mesh[];
      const hits = raycaster.current.intersectObjects(meshes, false);
      if (hits.length > 0) {
        const idx = pinSphereRefs.current.indexOf(hits[0].object as THREE.Mesh);
        if (idx >= 0) {
          useUniverse.getState().setHoveredPinId(INDIA_PINS[idx].id);
        }
      } else {
        if (useUniverse.getState().hoveredPinId) {
          useUniverse.getState().setHoveredPinId(null);
        }
      }
    }

    // Update time uniform
    earthMat.uniforms.u_time.value += delta;

    // ── Section opacity envelope ──
    let sectionOp = 1.0;
    if (sub < 0.05) sectionOp = sub / 0.05;
    else if (sub > 0.95) sectionOp = (1.0 - sub) / 0.05;
    sectionOp = clamp(sectionOp, 0, 1);
    if (groupRef.current) {
      groupRef.current.traverse((child) => {
        if ((child as THREE.Mesh).material) {
          const mat = (child as THREE.Mesh).material as THREE.Material;
          if ("opacity" in mat && mat.transparent) {
            (mat as THREE.MeshBasicMaterial).opacity *= sectionOp;
          }
        }
      });
    }
  });

  // Pin positions (computed once, in local earth space — they rotate with the earth group)
  const pinPositions = useMemo(() =>
    INDIA_PINS.map(p => latLngToVec3(p.lat, p.lng, 1.03)),
  []);

  return (
    <group ref={groupRef}>
      {/* Earth */}
      <mesh ref={earthRef} rotation-z={TILT}>
        <sphereGeometry args={[1.0, 128, 128]} />
        <primitive object={earthMat} attach="material" />
      </mesh>

      {/* Clouds */}
      <mesh ref={cloudRef} rotation-z={TILT}>
        <sphereGeometry args={[1.018, 64, 64]} />
        <meshStandardMaterial
          ref={cloudMat}
          map={cloudMap}
          alphaMap={cloudMap}
          transparent
          depthWrite={false}
          color="#ffffff"
          roughness={1}
        />
      </mesh>

      {/* Atmosphere outer glow */}
      <mesh>
        <sphereGeometry args={[1.065, 64, 64]} />
        <primitive object={atmoOuter} attach="material" />
      </mesh>

      {/* Atmosphere inner haze */}
      <mesh>
        <sphereGeometry args={[1.025, 64, 64]} />
        <primitive object={atmoInner} attach="material" />
      </mesh>

      {/* Photo pins — rotate with Earth via parent group is not needed,
          pins are in world space so they stay correct on the globe */}
      {INDIA_PINS.map((pin, i) => {
        const pos = pinPositions[i];
        return (
          <group key={pin.id} position={pos}>
            {/* Invisible hit sphere for raycasting */}
            <mesh
              ref={el => { pinSphereRefs.current[i] = el; }}
              visible={false}
            >
              <sphereGeometry args={[0.04, 8, 8]} />
              <meshBasicMaterial />
            </mesh>
            {/* Glowing dot */}
            <sprite scale={[0.03, 0.03, 0.03]}>
              <spriteMaterial map={dotTex} transparent depthWrite={false} />
            </sprite>
            {/* Pulse ring — animated via shader time */}
            <sprite scale={[0.03, 0.03, 0.03]}>
              <spriteMaterial map={ringTex} transparent opacity={0.5} depthWrite={false} />
            </sprite>
          </group>
        );
      })}

      {/* Directional light (sun) */}
      <directionalLight
        position={[5, 1.5, 2.5]}
        intensity={1.2}
        color="#fffaf0"
      />
    </group>
  );
}

/* ─── Exported component with Suspense boundary ─── */
export default function PhotographyGlobe() {
  return (
    <Suspense fallback={<EarthFallback />}>
      <EarthSystem />
    </Suspense>
  );
}
