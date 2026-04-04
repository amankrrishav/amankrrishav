export const supernovaFrag = /* glsl */ `
precision mediump float;

uniform float uTime;
uniform float uApproach;
uniform vec3 uAccent;
uniform vec3 uSecondary;
uniform float uOpacity;

varying vec2 vUv;

float hash(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

void main() {
  vec2 uv = vUv - 0.5;
  float dist = length(uv);
  float angle = atan(uv.y, uv.x);

  // Expanding shockwave — clamped so it doesn't grow forever
  float waveRadius = 0.15 + mod(uTime * 0.02, 0.25);
  float shockwave = smoothstep(0.025, 0.0, abs(dist - waveRadius));

  // Ejection filaments — radial + turbulent
  float filamentAngle = angle + noise(vec2(angle * 3.0, uTime * 0.3)) * 0.8;
  float filament = sin(filamentAngle * 7.0) * 0.5 + 0.5;
  filament *= smoothstep(0.35, 0.05, dist) * smoothstep(0.04, 0.15, dist);
  filament *= 0.5 + 0.5 * noise(vec2(dist * 8.0, uTime * 0.5));

  // Hot core — blue-white remnant
  float core = smoothstep(0.06, 0.0, dist);

  // Outer cool shell
  float shell = smoothstep(0.38, 0.30, dist) * smoothstep(0.25, 0.33, dist);

  vec3 col = vec3(0.0);
  col += vec3(1.0, 0.95, 0.9) * core * 2.0;
  col += uAccent * shockwave * 2.0;
  col += uSecondary * filament * 0.7;
  col += mix(uAccent, vec3(0.1, 0.02, 0.0), 0.5) * shell * 0.6;

  col *= 0.6 + uApproach * 0.8;

  float alpha = core + shockwave * 0.9 + filament * 0.5 + shell * 0.4;
  alpha = clamp(alpha, 0.0, 1.0) * uOpacity;
  gl_FragColor = vec4(col, alpha);
}
`;
