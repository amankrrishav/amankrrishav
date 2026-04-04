// ─── SECTION BOUNDARY ──────────────────────
// lib/shaders/earthMaterial.glsl.ts — Fully procedural Earth (no textures)

export const earthVertexShader = /* glsl */ `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition;
varying float vSunDot;

uniform vec3 u_sunDirection;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;
  vec3 worldNormal = normalize(mat3(modelMatrix) * normal);
  vSunDot = dot(worldNormal, u_sunDirection);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const earthFragmentShader = /* glsl */ `
precision highp float;

uniform vec3 u_sunDirection;
uniform float u_time;
uniform float u_altitude;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition;
varying float vSunDot;

// ── Noise functions ──
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
  for (int i = 0; i < 6; i++) {
    v += a * noise(p);
    p = p * 2.1 + vec2(1.7, 9.2);
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = vUv;

  // ── Procedural continent mask ──
  float continent = fbm(uv * vec2(8.0, 5.0) + vec2(2.3, 0.7));
  continent += fbm(uv * vec2(16.0, 10.0) + vec2(5.1, 3.2)) * 0.3;
  float landMask = smoothstep(0.42, 0.52, continent);

  // ── Ice caps at poles ──
  float polar = abs(uv.y - 0.5) * 2.0;
  float iceCap = smoothstep(0.82, 0.95, polar);

  // ── Day colors ──
  vec3 oceanDeep = vec3(0.02, 0.08, 0.22);
  vec3 oceanShallow = vec3(0.05, 0.18, 0.42);
  vec3 oceanColor = mix(oceanDeep, oceanShallow, fbm(uv * 12.0) * 0.5 + 0.5);

  vec3 landGreen = vec3(0.08, 0.28, 0.06);
  vec3 landBrown = vec3(0.35, 0.22, 0.08);
  vec3 landDesert = vec3(0.55, 0.42, 0.22);
  float landVariation = fbm(uv * vec2(20.0, 12.0) + 1.5);
  vec3 landColor = mix(landGreen, landBrown, landVariation);
  landColor = mix(landColor, landDesert, smoothstep(0.55, 0.75, landVariation));

  vec3 iceColor = vec3(0.85, 0.9, 0.95);

  vec3 dayColor = mix(oceanColor, landColor, landMask);
  dayColor = mix(dayColor, iceColor, iceCap);

  // ── Night side: procedural city lights ──
  float cityNoise = fbm(uv * vec2(60.0, 30.0));
  float cityDots = smoothstep(0.72, 0.78, cityNoise) * landMask;
  // Cluster lights near coasts (where continent edges are)
  float coastProximity = smoothstep(0.1, 0.0, abs(continent - 0.47));
  cityDots += smoothstep(0.65, 0.75, fbm(uv * vec2(80.0, 40.0) + 3.0)) * coastProximity * 0.6;
  cityDots = clamp(cityDots, 0.0, 1.0);
  vec3 nightColor = vec3(0.9, 0.7, 0.3) * cityDots * 1.5;
  nightColor += vec3(0.005, 0.008, 0.02); // faint ambient on night side

  // ── Day/night terminator ──
  float terminatorBlend = smoothstep(-0.10, 0.12, vSunDot);
  vec3 baseColor = mix(nightColor, dayColor, terminatorBlend);

  // ── Ocean specular (Phong, day side only) ──
  float isOcean = 1.0 - landMask;
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  vec3 reflDir = reflect(-u_sunDirection, normalize(vNormal));
  float specular = pow(max(dot(viewDir, reflDir), 0.0), 120.0);
  specular *= isOcean * terminatorBlend;
  vec3 specColor = vec3(0.6, 0.8, 1.0) * specular * 1.5;
  baseColor += specColor;

  // ── Atmospheric haze at low altitude (dive effect) ──
  vec3 hazeColor = vec3(0.9, 0.75, 0.45);
  float hazeAmount = (1.0 - u_altitude) * 0.35;
  baseColor = mix(baseColor, hazeColor, hazeAmount);

  gl_FragColor = vec4(baseColor, 1.0);
}
`;
