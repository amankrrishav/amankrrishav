"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const STAR_COUNT = 6000;
const SPHERE_RADIUS = 400;

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  
  attribute float aSize;
  attribute float aSpeed;
  attribute float aOffset;
  attribute float aBrightness;
  
  varying float vBrightness;
  varying float vTwinkle;
  
  void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    
    gl_Position = projectedPosition;
    
    // Twinkle effect
    float twinkle = sin(uTime * aSpeed + aOffset) * 0.5 + 0.5;
    twinkle = twinkle * twinkle; // exponentiate for sharper twinkle
    vTwinkle = twinkle;
    vBrightness = aBrightness;
    
    // Size with distance attenuation and twinkle
    float size = aSize * uPixelRatio * (0.6 + 0.4 * twinkle);
    gl_PointSize = size * (200.0 / -viewPosition.z);
    gl_PointSize = max(gl_PointSize, 0.5);
  }
`;

const fragmentShader = /* glsl */ `
  varying float vBrightness;
  varying float vTwinkle;
  
  void main() {
    // Circular point with soft edge
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    
    // Soft glow falloff
    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
    alpha *= alpha; // quadratic falloff
    
    // Color: warm white with slight tint variation
    vec3 baseColor = vec3(0.95, 0.95, 1.0);
    vec3 warmTint = vec3(1.0, 0.9, 0.8);
    vec3 coolTint = vec3(0.8, 0.9, 1.0);
    
    vec3 color = mix(warmTint, coolTint, vBrightness);
    color = mix(color, baseColor, 0.5);
    
    float finalAlpha = alpha * vBrightness * (0.5 + 0.5 * vTwinkle);
    
    gl_FragColor = vec4(color, finalAlpha);
  }
`;

export default function Starfield() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const { positions, sizes, speeds, offsets, brightnesses } = useMemo(() => {
    const pos = new Float32Array(STAR_COUNT * 3);
    const siz = new Float32Array(STAR_COUNT);
    const spd = new Float32Array(STAR_COUNT);
    const off = new Float32Array(STAR_COUNT);
    const brt = new Float32Array(STAR_COUNT);

    for (let i = 0; i < STAR_COUNT; i++) {
      // Distribute in a sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = SPHERE_RADIUS * (0.3 + Math.random() * 0.7); // avoid center cluster

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      // Size: most are small, a few are large
      const sizeRand = Math.random();
      siz[i] = sizeRand < 0.9 ? 1.0 + Math.random() * 2.0 : 3.0 + Math.random() * 4.0;

      // Twinkle speed and offset
      spd[i] = 0.5 + Math.random() * 2.5;
      off[i] = Math.random() * Math.PI * 2;

      // Brightness: most dim, some bright
      brt[i] = 0.2 + Math.random() * 0.8;
    }

    return { positions: pos, sizes: siz, speeds: spd, offsets: off, brightnesses: brt };
  }, []);

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-aSize"
          args={[sizes, 1]}
        />
        <bufferAttribute
          attach="attributes-aSpeed"
          args={[speeds, 1]}
        />
        <bufferAttribute
          attach="attributes-aOffset"
          args={[offsets, 1]}
        />
        <bufferAttribute
          attach="attributes-aBrightness"
          args={[brightnesses, 1]}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          uTime: { value: 0 },
          uPixelRatio: { value: typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 2) : 1 },
        }}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
