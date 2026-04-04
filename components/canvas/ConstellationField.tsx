"use client";

import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useUniverse } from "@/stores/useUniverse";

/**
 * Bright constellation field that the camera PASSES THROUGH
 * during Hero→About transition. Stars and lines are positioned
 * along the camera path so the user flies through them.
 */

const STAR_COUNT = 40;
const MAX_LINES = 35;

export default function ConstellationField() {
  const starsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const lineMaterialRef = useRef<THREE.LineBasicMaterial>(null);

  // Generate stars distributed along the camera path (Hero → About)
  // Camera goes from [0,0,50] to [0,2,25] — so place stars around z=25..45
  const { starPositions, starSizes, starBrightness, linePositions } = useMemo(() => {
    const sPos = new Float32Array(STAR_COUNT * 3);
    const sSizes = new Float32Array(STAR_COUNT);
    const sBright = new Float32Array(STAR_COUNT);
    const starVectors: THREE.Vector3[] = [];

    for (let i = 0; i < STAR_COUNT; i++) {
      // Spread around the camera path
      const x = (Math.random() - 0.5) * 60;
      const y = (Math.random() - 0.5) * 40 + 2;
      const z = 20 + Math.random() * 35; // z=20..55 — camera flies through this

      sPos[i * 3] = x;
      sPos[i * 3 + 1] = y;
      sPos[i * 3 + 2] = z;

      sSizes[i] = 3.0 + Math.random() * 5.0;
      sBright[i] = 0.5 + Math.random() * 0.5;

      starVectors.push(new THREE.Vector3(x, y, z));
    }

    // Connect nearby stars
    const lPos: number[] = [];
    const used = new Set<string>();

    for (let i = 0; i < STAR_COUNT; i++) {
      const distances: { idx: number; dist: number }[] = [];
      for (let j = 0; j < STAR_COUNT; j++) {
        if (i === j) continue;
        distances.push({ idx: j, dist: starVectors[i].distanceTo(starVectors[j]) });
      }
      distances.sort((a, b) => a.dist - b.dist);

      for (let c = 0; c < 2 && c < distances.length; c++) {
        const j = distances[c].idx;
        const key = `${Math.min(i, j)}-${Math.max(i, j)}`;
        if (used.has(key) || lPos.length / 6 >= MAX_LINES) continue;
        if (distances[c].dist > 20) continue;

        used.add(key);
        lPos.push(
          starVectors[i].x, starVectors[i].y, starVectors[i].z,
          starVectors[j].x, starVectors[j].y, starVectors[j].z
        );
      }
    }

    return {
      starPositions: sPos,
      starSizes: sSizes,
      starBrightness: sBright,
      linePositions: new Float32Array(lPos),
    };
  }, []);

  const vertexShader = /* glsl */ `
    attribute float aSize;
    attribute float aBrightness;
    uniform float uOpacity;
    uniform float uTime;
    uniform float uPixelRatio;
    
    varying float vOpacity;
    varying float vBrightness;
    
    void main() {
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      
      // Twinkle
      float twinkle = sin(uTime * 1.5 + position.x * 3.0) * 0.2 + 0.8;
      
      gl_PointSize = aSize * uPixelRatio * twinkle * (200.0 / -mvPosition.z);
      gl_PointSize = max(gl_PointSize, 1.5);
      
      vOpacity = uOpacity;
      vBrightness = aBrightness * twinkle;
    }
  `;

  const fragmentShader = /* glsl */ `
    varying float vOpacity;
    varying float vBrightness;
    
    void main() {
      float dist = length(gl_PointCoord - vec2(0.5));
      if (dist > 0.5) discard;
      
      // Bright core + soft glow
      float core = 1.0 - smoothstep(0.0, 0.12, dist);
      float glow = 1.0 - smoothstep(0.0, 0.5, dist);
      glow *= glow;
      
      float brightness = core * 0.5 + glow * 0.5;
      
      // Slightly blue-white star color
      vec3 color = vec3(0.85, 0.9, 1.0);
      
      gl_FragColor = vec4(color * vBrightness, brightness * vOpacity);
    }
  `;

  const uniforms = useMemo(
    () => ({
      uOpacity: { value: 0 },
      uTime: { value: 0 },
      uPixelRatio: {
        value: typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 2) : 1,
      },
    }),
    []
  );

  useFrame(({ clock }) => {
    const scrollProgress = useUniverse.getState().scrollProgress;
    const bootComplete = useUniverse.getState().bootComplete;
    if (!bootComplete) return;

    // Visible from early scroll through About section (0.02 → 0.30)
    let opacity = 0;
    if (scrollProgress > 0.01 && scrollProgress < 0.32) {
      if (scrollProgress < 0.05) {
        opacity = (scrollProgress - 0.01) / 0.04;
      } else if (scrollProgress > 0.26) {
        opacity = (0.32 - scrollProgress) / 0.06;
      } else {
        opacity = 1;
      }
    }

    if (materialRef.current) {
      materialRef.current.uniforms.uOpacity.value = opacity;
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
    }
    if (lineMaterialRef.current) {
      lineMaterialRef.current.opacity = opacity * 0.25;
    }
  });

  return (
    <group>
      {/* Constellation stars */}
      <points ref={starsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[starPositions, 3]} />
          <bufferAttribute attach="attributes-aSize" args={[starSizes, 1]} />
          <bufferAttribute attach="attributes-aBrightness" args={[starBrightness, 1]} />
        </bufferGeometry>
        <shaderMaterial
          ref={materialRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Constellation lines */}
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          ref={lineMaterialRef}
          color="#99BBCC"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  );
}
