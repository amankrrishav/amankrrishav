export const nebulaFrag = /* glsl */ `
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

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = p * 2.1 + vec2(1.7, 9.2);
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = vUv - 0.5;
  vec2 animUv = uv + vec2(uTime * 0.008, uTime * 0.005);

  float gas1 = fbm(animUv * 3.0);
  float gas2 = fbm(animUv * 5.0 + vec2(4.2, 1.7));
  float gas = gas1 * 0.7 + gas2 * 0.3;

  // Density falloff from center
  float dist = length(uv);
  float density = gas * smoothstep(0.7, 0.0, dist);

  // Color layers
  vec3 deepColor = vec3(0.05, 0.0, 0.15);
  vec3 col = mix(deepColor, uAccent, density * 0.8);
  col = mix(col, uSecondary, fbm(animUv * 8.0 + 3.0) * density * 0.5);

  // Star formation points — bright hotspots
  for (int i = 0; i < 5; i++) {
    vec2 starPos = vec2(
      hash(vec2(float(i), 1.7)) - 0.5,
      hash(vec2(float(i), 2.3)) - 0.5
    ) * 0.4;
    float starDist = length(uv - starPos);
    float star = smoothstep(0.025, 0.0, starDist) * (0.7 + 0.3 * sin(uTime * 2.0 + float(i)));
    col += vec3(1.0) * star;
    density = max(density, star * 0.8);
  }

  col *= 0.6 + uApproach * 0.8;

  float alpha = clamp(density * 1.2, 0.0, 0.9) * uOpacity;
  gl_FragColor = vec4(col, alpha);
}
`;
