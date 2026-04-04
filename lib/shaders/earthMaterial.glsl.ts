// ─── SECTION BOUNDARY ──────────────────────
// lib/shaders/earthMaterial.glsl.ts

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

uniform sampler2D u_dayMap;
uniform sampler2D u_nightMap;
uniform sampler2D u_specMap;
uniform vec3 u_sunDirection;
uniform float u_time;
uniform float u_altitude;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition;
varying float vSunDot;

void main() {
  vec3 dayColor = texture2D(u_dayMap, vUv).rgb;
  vec3 nightColor = texture2D(u_nightMap, vUv).rgb;
  float specMask = texture2D(u_specMap, vUv).r;

  float terminatorBlend = smoothstep(-0.10, 0.12, vSunDot);

  vec3 baseColor = mix(
    nightColor * vec3(1.0, 0.85, 0.5) * 1.8,
    dayColor,
    terminatorBlend
  );

  // Ocean specular (Phong, day side only)
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  vec3 reflDir = reflect(-u_sunDirection, normalize(vNormal));
  float specular = pow(max(dot(viewDir, reflDir), 0.0), 180.0);
  specular *= specMask * terminatorBlend;
  vec3 specColor = vec3(0.65, 0.82, 1.0) * specular * 2.0;

  vec3 finalColor = baseColor + specColor;

  // Atmospheric haze at low altitude (dive effect)
  vec3 hazeColor = vec3(0.9, 0.75, 0.45);
  float hazeAmount = (1.0 - u_altitude) * 0.35;
  finalColor = mix(finalColor, hazeColor, hazeAmount);

  gl_FragColor = vec4(finalColor, 1.0);
}
`;
