export const wormholeFrag = /* glsl */ `
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

  // Throat of the wormhole
  float throat = smoothstep(0.25, 0.22, dist) * smoothstep(0.20, 0.24, dist);

  // Tunnel effect — UV warped via inversion distortion
  vec2 tunnelUv = uv / (dist * dist + 0.001);
  tunnelUv *= 0.05;
  float tunnel = noise(tunnelUv + vec2(uTime * 0.3, uTime * 0.1));
  tunnel *= smoothstep(0.22, 0.0, dist);

  // Rotation swirl — spacetime dragging
  float swirl = sin(dist * 15.0 - uTime * 4.0 + angle * 3.0) * 0.5 + 0.5;
  swirl *= smoothstep(0.25, 0.02, dist) * smoothstep(0.0, 0.08, dist);

  // Gravitational lensing ring
  float lensRing = smoothstep(0.04, 0.0, abs(dist - 0.24));

  // Stars visible through the other side (distorted)
  float starField = 0.0;
  for (int i = 0; i < 6; i++) {
    vec2 sp = vec2(
      hash(vec2(float(i) * 1.7, 3.2)) - 0.5,
      hash(vec2(float(i) * 2.1, 1.4)) - 0.5
    ) * 0.15;
    starField += smoothstep(0.015, 0.0, length(uv - sp));
  }
  starField *= smoothstep(0.22, 0.0, dist);

  vec3 col = vec3(0.0);
  col += uAccent * tunnel * 0.8;
  col += uSecondary * swirl * 0.6;
  col += vec3(1.0) * lensRing * 1.5;
  col += vec3(0.8, 0.9, 1.0) * starField;
  col += uAccent * 0.1 * smoothstep(0.25, 0.0, dist);

  col *= 0.6 + uApproach * 0.8;

  float alpha = tunnel * 0.7 + swirl * 0.5 + lensRing + starField * 0.9;
  alpha = clamp(alpha, 0.0, 1.0) * uOpacity;
  gl_FragColor = vec4(col, alpha);
}
`;
