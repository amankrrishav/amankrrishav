// ─── lib/shaders/earthMaterial.glsl.ts ──────────────────────
// Texture-based Earth shader for altis.to-grade visual quality.
// Uses NASA Blue Marble day + city lights night textures.
// Ocean mask derived from day texture luminance (no external spec map — CORS).

export const earthVertexShader = /* glsl */ `
varying vec2  vUv;
varying vec3  vNormal;
varying vec3  vWorldPosition;
varying float vSunDot;

uniform vec3 u_sunDirection;

void main() {
  vUv = uv;
  vec4 worldPos  = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;
  vNormal        = normalize(normalMatrix * normal);
  vSunDot        = dot(
    normalize(mat3(modelMatrix) * normal),
    normalize(u_sunDirection)
  );
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const earthFragmentShader = /* glsl */ `
precision highp float;

uniform sampler2D u_dayMap;
uniform sampler2D u_nightMap;
uniform vec3      u_sunDirection;
uniform vec3      u_cameraPosition;
uniform float     u_time;
uniform float     u_altitude;

varying vec2  vUv;
varying vec3  vNormal;
varying vec3  vWorldPosition;
varying float vSunDot;

void main() {
  // ── 1. Base textures ────────────────────────────────────────
  vec3  dayColor   = texture2D(u_dayMap,   vUv).rgb;
  vec3  nightColor = texture2D(u_nightMap, vUv).rgb;

  // ── 1b. Compute ocean mask from day texture ─────────────────
  // Ocean pixels are dark blue — low red channel relative to blue
  float specMask = 1.0 - smoothstep(0.0, 0.3, dayColor.r - dayColor.b);
  // Also check overall darkness (deep ocean is very dark)
  float dayLum = dot(dayColor, vec3(0.299, 0.587, 0.114));
  specMask *= smoothstep(0.05, 0.25, dayLum);

  // ── 2. Terminator (soft day/night boundary) ─────────────────
  float terminator     = smoothstep(-0.08, 0.14, vSunDot);
  float terminatorEdge = smoothstep(-0.01, 0.01, vSunDot) * 0.15;
  terminator = clamp(
    terminator + terminatorEdge * (1.0 - terminator),
    0.0, 1.0
  );

  // ── 3. Night side: city lights with warm amber tint ─────────
  vec3 cityLights = nightColor * vec3(1.0, 0.82, 0.48) * 2.2;
  float cityBrightness = dot(nightColor, vec3(0.33));
  cityLights += nightColor * smoothstep(0.15, 0.6, cityBrightness) * 0.8;

  // ── 4. Day side: color grading for altis.to tone ────────────
  vec3 gradedDay = dayColor;
  // Boost saturation on water (low red relative to blue = water)
  float isWater = 1.0 - smoothstep(0.0, 0.3, dayColor.r - dayColor.b);
  gradedDay = mix(
    gradedDay,
    gradedDay * vec3(0.85, 0.95, 1.12),
    isWater * 0.4
  );
  // Slight global contrast curve
  gradedDay = pow(gradedDay, vec3(0.92)) * 1.08;

  // ── 5. Blend day + night ────────────────────────────────────
  vec3 baseColor = mix(cityLights, gradedDay, terminator);

  // ── 6. Ocean specular (Phong, ocean-masked) ─────────────────
  vec3  viewDir  = normalize(u_cameraPosition - vWorldPosition);
  vec3  reflDir  = reflect(-normalize(u_sunDirection), vNormal);
  float spec     = pow(max(dot(viewDir, reflDir), 0.0), 220.0);
  spec          *= specMask * terminator * 2.5;
  vec3  specular = vec3(0.6, 0.82, 1.0) * spec;

  // ── 7. Altitude haze (dive effect) ─────────────────────────
  vec3  hazeColor  = vec3(0.72, 0.85, 1.0);
  float hazeAmount = pow(1.0 - u_altitude, 2.2) * 0.45;
  baseColor = mix(baseColor, hazeColor, hazeAmount);

  // ── 8. Limb darkening (subsurface scatter approximation) ───
  float limbDark = 1.0 - pow(1.0 - max(vSunDot, 0.0), 3.5) * 0.25;
  baseColor *= limbDark;

  gl_FragColor = vec4(baseColor + specular, 1.0);
}
`;
