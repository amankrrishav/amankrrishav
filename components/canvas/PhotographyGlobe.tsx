"use client";
// ─── components/canvas/PhotographyGlobe.tsx ──────────────────────
// altis.to-grade 3D Earth with NASA textures, 3-layer atmosphere,
// custom starfield, photo pins, dive cinematic, and post-processing.
// Child of Scene.tsx <Canvas>. No new renderer, no OrbitControls.

import { useRef, useMemo, useEffect, Suspense, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
  Noise,
  DepthOfField,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import { useTexture } from "@react-three/drei";
import { useUniverse } from "@/stores/useUniverse";
import { INDIA_PINS, latLngToVec3 } from "@/content/photography";
import type { PhotoPin } from "@/content/photography";
import {
  earthVertexShader,
  earthFragmentShader,
} from "@/lib/shaders/earthMaterial.glsl";
import {
  atmosphereVertexShader,
  atmosphereFragmentShader,
} from "@/lib/shaders/atmosphere.glsl";

/* ─── Constants ─── */
const SECTION_START = 0.94;
const SECTION_RANGE = 0.26;
const TILT = THREE.MathUtils.degToRad(23.5);
const SUN_DIR = new THREE.Vector3(1, 0.3, 0.5).normalize();

/* ─── Utility functions ─── */
function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
function easeInCubic(t: number): number {
  return t * t * t;
}

/* ─── Texture paths (local — NASA servers block CORS) ─── */
const DAY_URL = "/textures/earth_day.jpg";
const NIGHT_URL = "/textures/earth_night.jpg";
const CLOUD_URL = "/textures/earth_clouds.jpg";

/* ─── Canvas textures for pin visuals ─── */
function makeDotTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1.0)");
  g.addColorStop(0.3, "rgba(255,255,255,0.8)");
  g.addColorStop(1.0, "rgba(255,255,255,0.0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

function makeRingTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext("2d")!;
  ctx.strokeStyle = "rgba(255,255,255,1.0)";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(64, 64, 56, 0, Math.PI * 2);
  ctx.stroke();
  return new THREE.CanvasTexture(c);
}

/* ─── Star field shaders ─── */
const starVertexShader = /* glsl */ `
  uniform float u_time;
  attribute float a_size;
  attribute float a_phase;
  attribute float a_speed;
  attribute float a_tier;
  varying float vOpacity;
  varying vec3 vColor;
  attribute vec3 a_color;

  void main() {
    vColor = a_color;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

    // Twinkle: only medium (1) and bright (2) tiers
    float twinkle = 1.0;
    if (a_tier > 0.5) {
      twinkle = 0.5 + 0.5 * sin(u_time * a_speed + a_phase);
    }
    vOpacity = twinkle;

    // Perspective-correct point size
    gl_PointSize = a_size * (300.0 / -mvPosition.z);
    gl_PointSize = max(gl_PointSize, 0.5);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const starFragmentShader = /* glsl */ `
  varying float vOpacity;
  varying vec3 vColor;

  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    float alpha = 1.0 - smoothstep(0.35, 0.5, dist);
    gl_FragColor = vec4(vColor, alpha * vOpacity);
  }
`;

/* ─── Cloud shader ─── */
const cloudVertexShader = /* glsl */ `
  varying vec2 vUv;
  varying float vSunDot;
  uniform vec3 u_sunDirection;

  void main() {
    vUv = uv;
    vec3 worldNormal = normalize(mat3(modelMatrix) * normal);
    vSunDot = dot(worldNormal, normalize(u_sunDirection));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const cloudFragmentShader = /* glsl */ `
  precision mediump float;
  uniform sampler2D u_cloudMap;
  uniform float u_cloudOpacity;
  varying vec2 vUv;
  varying float vSunDot;

  void main() {
    float cloudAlpha = texture2D(u_cloudMap, vUv).r;
    float terminator = smoothstep(-0.08, 0.14, vSunDot);
    float cloudLight = mix(0.08, 1.0, terminator);
    float cloudOpacity = cloudAlpha * cloudLight * u_cloudOpacity;
    gl_FragColor = vec4(vec3(1.0) * cloudLight, cloudOpacity);
  }
`;

/* ─── Photography Star Field (6000 stars, Fibonacci sphere) ─── */
function PhotographyStarField() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const { positions, sizes, phases, speeds, tiers, colors } = useMemo(() => {
    const STAR_COUNT = 6000;
    const golden = (1 + Math.sqrt(5)) / 2;
    const pos = new Float32Array(STAR_COUNT * 3);
    const siz = new Float32Array(STAR_COUNT);
    const pha = new Float32Array(STAR_COUNT);
    const spd = new Float32Array(STAR_COUNT);
    const tier = new Float32Array(STAR_COUNT);
    const col = new Float32Array(STAR_COUNT * 3);

    // Color palette
    const palette = [
      { r: 0.722, g: 0.784, b: 1.0, weight: 0.6 }, // #b8c8ff cool blue-white
      { r: 1.0, g: 1.0, b: 1.0, weight: 0.2 }, // #ffffff pure white
      { r: 0.867, g: 0.933, b: 1.0, weight: 0.12 }, // #ddeeff pale blue
      { r: 1.0, g: 0.91, b: 0.8, weight: 0.08 }, // #ffe8cc warm white
    ];

    for (let i = 0; i < STAR_COUNT; i++) {
      // Fibonacci sphere distribution
      const theta = (2 * Math.PI * i) / golden;
      const phi = Math.acos(1 - (2 * (i + 0.5)) / STAR_COUNT);
      const radius = 80 + Math.random() * 40; // 80-120

      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.cos(phi);
      pos[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

      // Size tiers: 80% tiny, 15% medium, 5% bright
      const rand = Math.random();
      if (rand < 0.8) {
        siz[i] = 0.6 + Math.random() * 0.4; // tiny
        tier[i] = 0.0;
      } else if (rand < 0.95) {
        siz[i] = 1.2 + Math.random() * 0.6; // medium
        tier[i] = 1.0;
      } else {
        siz[i] = 2.2 + Math.random() * 0.8; // bright
        tier[i] = 2.0;
      }

      pha[i] = Math.random() * Math.PI * 2;
      spd[i] = 0.3 + Math.random() * 1.5;

      // Color from weighted palette
      const colorRand = Math.random();
      let cumWeight = 0;
      let chosenColor = palette[0];
      for (const p of palette) {
        cumWeight += p.weight;
        if (colorRand < cumWeight) {
          chosenColor = p;
          break;
        }
      }
      col[i * 3] = chosenColor.r;
      col[i * 3 + 1] = chosenColor.g;
      col[i * 3 + 2] = chosenColor.b;
    }

    return {
      positions: pos,
      sizes: siz,
      phases: pha,
      speeds: spd,
      tiers: tier,
      colors: col,
    };
  }, []);

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.u_time.value = clock.getElapsedTime();
    }
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-a_size" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-a_phase" args={[phases, 1]} />
        <bufferAttribute attach="attributes-a_speed" args={[speeds, 1]} />
        <bufferAttribute attach="attributes-a_tier" args={[tiers, 1]} />
        <bufferAttribute attach="attributes-a_color" args={[colors, 3]} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={starVertexShader}
        fragmentShader={starFragmentShader}
        uniforms={{ u_time: { value: 0 } }}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

/* ─── Post-processing stack (only active when photographyActive) ─── */
function PhotographyEffects() {
  const photographyActive = useUniverse((s) => s.photographyActive);

  if (!photographyActive) return null;

  return (
    <EffectComposer multisampling={0} enabled={photographyActive}>
      <Bloom
        luminanceThreshold={0.15}
        luminanceSmoothing={0.025}
        intensity={1.85}
        radius={0.55}
        mipmapBlur
      />
      <ChromaticAberration
        blendFunction={BlendFunction.NORMAL}
        offset={new THREE.Vector2(0.0005, 0.0005)}
      />
      <Vignette
        eskil={false}
        offset={0.12}
        darkness={0.85}
        blendFunction={BlendFunction.NORMAL}
      />
      <Noise
        premultiply={false}
        blendFunction={BlendFunction.SCREEN}
        opacity={0.04}
      />
      <DepthOfField
        focusDistance={0.0}
        focalLength={0.02}
        bokehScale={0.8}
      />
    </EffectComposer>
  );
}

/* ─── Wireframe fallback while textures load ─── */
function WireframeEarth() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (ref.current) ref.current.rotation.y += 0.001;
  });
  return (
    <mesh ref={ref} rotation-z={TILT}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshBasicMaterial color="#1a3a6b" wireframe />
    </mesh>
  );
}

/* ─── Main Earth System ─── */
function EarthSystem() {
  const { camera, gl, scene } = useThree();

  // Refs for 60fps — no React state updates in hot path
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudRef = useRef<THREE.Mesh>(null);
  const globeGroupRef = useRef<THREE.Group>(null);
  const diveProgressRef = useRef<number>(0);
  const currentAltitudeRef = useRef<number>(1.0);
  const frameCounterRef = useRef<number>(0);
  const originalBgColorRef = useRef<THREE.Color | null>(null);
  const wasActiveRef = useRef<boolean>(false);
  const isDivingRef = useRef<boolean>(false);
  const isReversingRef = useRef<boolean>(false);
  const diveTargetRef = useRef<PhotoPin | null>(null);
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const pinHitMeshRefs = useRef<(THREE.Mesh | null)[]>([]);

  // Ring sprite refs for animation
  const ringRefs = useRef<(THREE.Sprite | null)[]>([]);
  const ringMatRefs = useRef<(THREE.SpriteMaterial | null)[]>([]);
  const dotRefs = useRef<(THREE.Sprite | null)[]>([]);

  // Canvas textures
  const dotTex = useMemo(() => makeDotTexture(), []);
  const ringTex = useMemo(() => makeRingTexture(), []);

  // Load NASA textures (no Wikipedia spec map — CORS blocked)
  const [dayMap, nightMap, cloudMap] = useTexture([
    DAY_URL,
    NIGHT_URL,
    CLOUD_URL,
  ]);

  // Max anisotropy on all textures
  useEffect(() => {
    const maxAniso = gl.capabilities.getMaxAnisotropy();
    [dayMap, nightMap, cloudMap].forEach((tex) => {
      tex.anisotropy = maxAniso;
      tex.minFilter = THREE.LinearMipMapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.needsUpdate = true;
    });
  }, [dayMap, nightMap, cloudMap, gl]);

  // Earth custom ShaderMaterial
  const earthMat = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: earthVertexShader,
      fragmentShader: earthFragmentShader,
      uniforms: {
        u_dayMap: { value: dayMap },
        u_nightMap: { value: nightMap },
        u_sunDirection: { value: SUN_DIR.clone() },
        u_cameraPosition: { value: new THREE.Vector3() },
        u_time: { value: 0 },
        u_altitude: { value: 1.0 },
      },
    });
  }, [dayMap, nightMap]);

  // Cloud custom ShaderMaterial
  const cloudMat = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: cloudVertexShader,
      fragmentShader: cloudFragmentShader,
      uniforms: {
        u_cloudMap: { value: cloudMap },
        u_cloudOpacity: { value: 1.0 },
        u_sunDirection: { value: SUN_DIR.clone() },
      },
      transparent: true,
      depthWrite: false,
      side: THREE.FrontSide,
    });
  }, [cloudMap]);

  // Atmosphere materials — 3 layers
  const atmoLayerA = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: atmosphereVertexShader,
        fragmentShader: atmosphereFragmentShader,
        uniforms: {
          u_color: { value: new THREE.Color(0x4488ff) },
          u_power: { value: 3.2 },
          u_opacity: { value: 0.75 },
          u_sunDirection: { value: SUN_DIR.clone() },
        },
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  const atmoLayerB = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: atmosphereVertexShader,
        fragmentShader: atmosphereFragmentShader,
        uniforms: {
          u_color: { value: new THREE.Color(0xaaccff) },
          u_power: { value: 7.0 },
          u_opacity: { value: 0.22 },
          u_sunDirection: { value: SUN_DIR.clone() },
        },
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  const atmoLayerC = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: atmosphereVertexShader,
        fragmentShader: atmosphereFragmentShader,
        uniforms: {
          u_color: { value: new THREE.Color(0x1133aa) },
          u_power: { value: 2.0 },
          u_opacity: { value: 0.14 },
          u_sunDirection: { value: SUN_DIR.clone() },
        },
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  // GPU tier detection
  const gpuTier = useMemo(() => {
    const glContext = gl.getContext();
    const maxTex = glContext.getParameter(glContext.MAX_TEXTURE_SIZE) as number;
    return maxTex >= 4096 ? "high" : "low";
  }, [gl]);

  const earthSegments = gpuTier === "high" ? 128 : 64;
  const cloudsEnabled = gpuTier === "high";

  // Pin positions computed once
  const allPinsRef = useRef<PhotoPin[]>([...INDIA_PINS]);

  // Mouse tracking
  useEffect(() => {
    const canvas = gl.domElement;
    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    };
    const onClick = () => {
      const hoveredId = useUniverse.getState().hoveredPinId;
      if (hoveredId && !isDivingRef.current) {
        const allPins = [
          ...INDIA_PINS,
          ...useUniverse.getState().dynamicPins,
        ];
        const pin = allPins.find((p) => p.id === hoveredId);
        if (pin) {
          diveTargetRef.current = pin;
          isDivingRef.current = true;
          isReversingRef.current = false;
          diveProgressRef.current = 0;
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
      if (
        state.diveReversing &&
        isDivingRef.current &&
        !isReversingRef.current
      ) {
        isReversingRef.current = true;
        useUniverse.getState().setPhotographyGalleryOpen(false);
      }
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      useUniverse.getState().setPhotographyActive(false);
      useUniverse.getState().setPhotographyDiveActive(false);
      useUniverse.getState().setPhotographyGalleryOpen(false);
      useUniverse.getState().setActivePinId(null);
      useUniverse.getState().setHoveredPinId(null);
      if (originalBgColorRef.current && scene.background) {
        scene.background = originalBgColorRef.current;
      }
    };
  }, [scene]);

  // Activation effect — toggle scene background
  const handleActivation = useCallback(
    (active: boolean) => {
      if (active && !wasActiveRef.current) {
        wasActiveRef.current = true;
        if (scene.background instanceof THREE.Color) {
          originalBgColorRef.current = scene.background.clone();
        } else {
          originalBgColorRef.current = new THREE.Color(0x000005);
        }
        scene.background = new THREE.Color(0x010208);
        useUniverse.getState().setPhotographyActive(true);
      } else if (!active && wasActiveRef.current) {
        wasActiveRef.current = false;
        if (originalBgColorRef.current) {
          scene.background = originalBgColorRef.current;
        }
        useUniverse.getState().setPhotographyActive(false);
        useUniverse.getState().setPhotographyDiveActive(false);
        useUniverse.getState().setPhotographyGalleryOpen(false);
        useUniverse.getState().setActivePinId(null);
        isDivingRef.current = false;
      }
    },
    [scene]
  );

  useFrame((state, delta) => {
    if (!globeGroupRef.current) return;

    const progress = useUniverse.getState().scrollProgress;
    const visible = progress >= SECTION_START - 0.06 && progress <= SECTION_START + SECTION_RANGE + 0.06;
    globeGroupRef.current.visible = visible;

    if (!visible) {
      handleActivation(false);
      return;
    }

    const sub = clamp((progress - SECTION_START) / SECTION_RANGE, 0, 1);

    // Activation
    if (sub > 0 && sub < 1) {
      handleActivation(true);
    } else {
      handleActivation(false);
    }

    if (!wasActiveRef.current) return;

    const t = state.clock.elapsedTime;
    frameCounterRef.current++;

    const allPins = [...INDIA_PINS, ...useUniverse.getState().dynamicPins];
    allPinsRef.current = allPins;

    // ── CAMERA: Entry cinematic (not diving) ──
    if (!isDivingRef.current) {
      const entryP = easeInOutCubic(clamp(sub / 0.25, 0, 1));
      const targetZ = lerp(14.0, 2.8, entryP);
      camera.position.z = lerp(camera.position.z, targetZ, delta * 2.8);
      camera.position.x = lerp(camera.position.x, 0, delta * 3);
      camera.position.y = lerp(camera.position.y, 0, delta * 3);
      camera.lookAt(0, 0, 0);

      // Idle rotation
      if (earthRef.current) earthRef.current.rotation.y += 0.000075;
      if (cloudRef.current) cloudRef.current.rotation.y += 0.000092;
    }

    // ── Pin ring animation ──
    allPins.forEach((pin, i) => {
      const ringSprite = ringRefs.current[i];
      const ringMat = ringMatRefs.current[i];
      const dotSprite = dotRefs.current[i];
      if (!ringSprite || !ringMat || !dotSprite) return;

      const phase = i / allPins.length;
      const ringT = ((t * 0.42 + phase) % 1.0);
      const eased = 1.0 - Math.pow(1.0 - ringT, 2);
      const scale = lerp(0.022, 0.085, eased);
      ringSprite.scale.setScalar(scale);
      ringMat.opacity = (1.0 - ringT) * 0.75;

      const hoveredId = useUniverse.getState().hoveredPinId;
      if (pin.id === hoveredId) {
        ringMat.color.set("#ffd700");
        dotSprite.scale.setScalar(0.022 * 1.8);
      } else {
        ringMat.color.set("#88bbff");
        dotSprite.scale.setScalar(0.022);
      }
    });

    // ── Pin screen positions (half frequency) ──
    if (frameCounterRef.current % 2 === 0 && earthRef.current) {
      const positions: Record<
        string,
        { x: number; y: number; visible: boolean }
      > = {};
      allPins.forEach((pin) => {
        const wp = latLngToVec3(pin.lat, pin.lng, 1.06);
        if (earthRef.current) {
          wp.applyQuaternion(earthRef.current.quaternion);
        }
        const projected = wp.clone().project(camera);
        const dotProduct = wp.clone().normalize().dot(
          camera.position.clone().normalize()
        );
        const isVisible = projected.z < 1.0 && dotProduct > 0;
        const rect = gl.domElement.getBoundingClientRect();
        positions[pin.id] = {
          x: (projected.x * 0.5 + 0.5) * rect.width,
          y: (-projected.y * 0.5 + 0.5) * rect.height,
          visible: isVisible,
        };
      });
      useUniverse.getState().setPinScreenPositions(positions);
    }

    // ── Hover raycasting (half frequency) ──
    if (frameCounterRef.current % 2 === 0 && !isDivingRef.current) {
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const meshes = pinHitMeshRefs.current.filter(Boolean) as THREE.Mesh[];
      const hits = raycasterRef.current.intersectObjects(meshes, false);
      if (hits.length > 0) {
        const idx = pinHitMeshRefs.current.indexOf(
          hits[0].object as THREE.Mesh
        );
        if (idx >= 0 && idx < allPins.length) {
          useUniverse.getState().setHoveredPinId(allPins[idx].id);
        }
      } else {
        if (useUniverse.getState().hoveredPinId) {
          useUniverse.getState().setHoveredPinId(null);
        }
      }
    }

    // ── Dive sequence ──
    if (isDivingRef.current && diveTargetRef.current) {
      const pin = diveTargetRef.current;
      const speed = isReversingRef.current ? 0.8 : 0.55;

      if (isReversingRef.current) {
        diveProgressRef.current = Math.max(
          diveProgressRef.current - delta * speed,
          0
        );
        const dp = diveProgressRef.current;
        currentAltitudeRef.current = lerp(0.0, 1.0, 1.0 - dp);
        earthMat.uniforms.u_altitude.value = currentAltitudeRef.current;
        cloudMat.uniforms.u_cloudOpacity.value = 1.0 - dp;

        const startPos = new THREE.Vector3(0, 0, 2.8);
        camera.position.lerp(startPos, delta * 2.5);
        camera.lookAt(0, 0, 0);

        if (dp === 0) {
          isReversingRef.current = false;
          isDivingRef.current = false;
          diveTargetRef.current = null;
          useUniverse.getState().setDiveReversing(false);
          useUniverse.getState().setPhotographyDiveActive(false);
          useUniverse.getState().setActivePinId(null);
        }
      } else {
        diveProgressRef.current = Math.min(
          diveProgressRef.current + delta * speed,
          1.0
        );
        const dp = diveProgressRef.current;

        // Phase 1 (0→0.35): Rotate globe so pin faces camera
        if (dp < 0.35 && earthRef.current) {
          const pinWorld = latLngToVec3(pin.lat, pin.lng, 1.0);
          const targetQuat = new THREE.Quaternion().setFromUnitVectors(
            pinWorld.clone().normalize(),
            new THREE.Vector3(0, 0, 1)
          );
          earthRef.current.quaternion.slerp(
            targetQuat,
            clamp(dp / 0.35, 0, 1) * delta * 4
          );
          if (cloudRef.current) {
            cloudRef.current.quaternion.copy(earthRef.current.quaternion);
          }
        }

        // Phase 2 (0.35→0.80): Camera dives toward pin
        if (dp >= 0.35 && dp < 0.8) {
          const phaseP = easeInCubic((dp - 0.35) / 0.45);
          const pinPos = latLngToVec3(pin.lat, pin.lng, 1.0);
          if (earthRef.current) {
            pinPos.applyQuaternion(earthRef.current.quaternion);
          }

          const startPos = new THREE.Vector3(0, 0, 2.8);
          const endPos = pinPos.clone().multiplyScalar(1.08);
          camera.position.lerpVectors(startPos, endPos, phaseP);
          camera.lookAt(pinPos.clone().multiplyScalar(0.5));

          currentAltitudeRef.current = lerp(1.0, 0.0, phaseP);
          earthMat.uniforms.u_altitude.value = currentAltitudeRef.current;
          cloudMat.uniforms.u_cloudOpacity.value = lerp(1.0, 0.0, phaseP);
        }

        // Phase 3 (0.80→1.0): Gallery opens
        if (
          dp >= 0.8 &&
          !useUniverse.getState().photographyGalleryOpen
        ) {
          useUniverse.getState().setPhotographyGalleryOpen(true);
        }
      }
    } else {
      // Reset altitude when not diving
      earthMat.uniforms.u_altitude.value +=
        (1.0 - earthMat.uniforms.u_altitude.value) * delta * 2;
      cloudMat.uniforms.u_cloudOpacity.value +=
        (1.0 - cloudMat.uniforms.u_cloudOpacity.value) * delta * 2;
    }

    // ── Warp exit (sub 0.92→1.0) ──
    if (sub > 0.92 && !isDivingRef.current) {
      const warpP = (sub - 0.92) / 0.08;
      useUniverse.getState().setWarpIntensity(easeInCubic(warpP));
      camera.position.z = lerp(2.8, 18.0, easeInCubic(warpP));
    } else if (sub <= 0.92) {
      if (useUniverse.getState().warpIntensity > 0) {
        useUniverse.getState().setWarpIntensity(0);
      }
    }

    // ── Material uniform updates ──
    earthMat.uniforms.u_time.value += delta;
    earthMat.uniforms.u_cameraPosition.value.copy(camera.position);
  });

  // Pin positions in local earth space
  const pinPositions = useMemo(
    () => INDIA_PINS.map((p) => latLngToVec3(p.lat, p.lng, 1.03)),
    []
  );

  return (
    <>
      <group ref={globeGroupRef}>
        {/* Photography-specific dense starfield */}
        <PhotographyStarField />

        {/* Earth */}
        <mesh ref={earthRef} rotation-z={TILT}>
          <sphereGeometry args={[1.0, earthSegments, earthSegments]} />
          <primitive object={earthMat} attach="material" />
        </mesh>

        {/* Clouds */}
        {cloudsEnabled && (
          <mesh ref={cloudRef} rotation-z={TILT}>
            <sphereGeometry args={[1.018, 64, 64]} />
            <primitive object={cloudMat} attach="material" />
          </mesh>
        )}

        {/* Atmosphere Layer A — main blue limb glow */}
        <mesh rotation-z={TILT}>
          <sphereGeometry args={[1.06, 64, 64]} />
          <primitive object={atmoLayerA} attach="material" />
        </mesh>

        {/* Atmosphere Layer B — thin white inner haze */}
        <mesh rotation-z={TILT}>
          <sphereGeometry args={[1.025, 64, 64]} />
          <primitive object={atmoLayerB} attach="material" />
        </mesh>

        {/* Atmosphere Layer C — wide outer scatter */}
        <mesh rotation-z={TILT}>
          <sphereGeometry args={[1.12, 64, 64]} />
          <primitive object={atmoLayerC} attach="material" />
        </mesh>

        {/* Photo pins */}
        {INDIA_PINS.map((pin, i) => {
          const pos = pinPositions[i];
          return (
            <group key={pin.id} position={pos.toArray() as [number, number, number]}>
              {/* Invisible hit sphere for raycasting */}
              <mesh
                ref={(el) => {
                  pinHitMeshRefs.current[i] = el;
                }}
                visible={false}
              >
                <sphereGeometry args={[0.04, 8, 8]} />
                <meshBasicMaterial />
              </mesh>

              {/* Glowing dot (inner bright core) */}
              <sprite
                ref={(el) => {
                  dotRefs.current[i] = el;
                }}
                scale={[0.022, 0.022, 0.022]}
              >
                <spriteMaterial
                  map={dotTex}
                  transparent
                  depthWrite={false}
                  blending={THREE.AdditiveBlending}
                  opacity={0.9}
                />
              </sprite>

              {/* Halo (larger, dimmer — bloom pickup) */}
              <sprite scale={[0.044, 0.044, 0.044]}>
                <spriteMaterial
                  map={dotTex}
                  color="#4488ff"
                  transparent
                  depthWrite={false}
                  blending={THREE.AdditiveBlending}
                  opacity={0.3}
                />
              </sprite>

              {/* Ring pulse */}
              <sprite
                ref={(el) => {
                  ringRefs.current[i] = el;
                }}
                scale={[0.022, 0.022, 0.022]}
              >
                <spriteMaterial
                  ref={(el) => {
                    ringMatRefs.current[i] = el;
                  }}
                  map={ringTex}
                  transparent
                  depthWrite={false}
                  blending={THREE.AdditiveBlending}
                  opacity={0.5}
                  color="#88bbff"
                />
              </sprite>
            </group>
          );
        })}

        {/* Sun light */}
        <directionalLight
          position={[5, 1.5, 2.5]}
          intensity={1.2}
          color="#fffaf0"
        />
      </group>

      {/* Photography-specific post-processing */}
      <PhotographyEffects />
    </>
  );
}

/* ─── Exported component with Suspense boundary ─── */
export default function PhotographyGlobe() {
  return (
    <Suspense fallback={<WireframeEarth />}>
      <EarthSystem />
    </Suspense>
  );
}
