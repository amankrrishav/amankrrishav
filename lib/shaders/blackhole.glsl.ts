export const blackholeFrag = /* glsl */ `
precision mediump float;

uniform float uTime;
uniform float uApproach;
uniform vec3 uAccent;
uniform vec3 uSecondary;
uniform float uOpacity;

varying vec2 vUv;

void main() {
  vec2 uv = vUv - 0.5;
  float dist = length(uv);

  // Singularity — pure black event horizon
  float horizon = smoothstep(0.08, 0.06, dist);

  // Photon sphere — thin bright ring at 1.5x Schwarzschild radius
  float photonRing = smoothstep(0.03, 0.0, abs(dist - 0.10));

  // Accretion disk — polar coordinates
  float angle = atan(uv.y, uv.x);
  float diskMask = smoothstep(0.25, 0.08, abs(uv.y * 2.0));
  float diskDist = smoothstep(0.35, 0.10, dist) * smoothstep(0.08, 0.12, dist);
  float diskSpin = fract(angle / 6.28318 + uTime * 0.2 - dist * 2.0);
  float diskHeat = sin(diskSpin * 6.28318 * 8.0) * 0.5 + 0.5;
  float disk = diskDist * diskMask * diskHeat;

  // Gravitational lensing
  float lensing = smoothstep(0.48, 0.12, dist) * smoothstep(0.08, 0.20, dist);
  vec2 lensedUv = uv + normalize(uv + 0.001) * lensing * -0.04 * sin(uTime * 0.5);
  float lensGlow = smoothstep(0.35, 0.10, length(lensedUv)) * 0.3;

  // Relativistic jet
  float jet = smoothstep(0.04, 0.0, abs(uv.x)) * smoothstep(0.5, 0.1, abs(uv.y))
              * step(0.12, abs(uv.y));

  vec3 blackColor = vec3(0.0);
  vec3 diskColor = mix(uSecondary, vec3(1.0, 1.0, 0.8), diskHeat);

  vec3 col = blackColor;
  col = mix(col, diskColor, disk);
  col += vec3(1.0, 0.9, 0.7) * photonRing * 2.0;
  col += uSecondary * lensGlow;
  col += uSecondary * jet * 0.3;
  col = mix(col, blackColor, horizon);

  col *= 0.6 + uApproach * 0.8;

  float alpha = max(disk, photonRing) + lensGlow * 0.5 + jet * 0.2;
  alpha = max(alpha, horizon * 0.95);
  alpha = clamp(alpha, 0.0, 1.0) * uOpacity;

  gl_FragColor = vec4(col, alpha);
}
`;
