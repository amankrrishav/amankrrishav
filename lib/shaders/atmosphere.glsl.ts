// ─── lib/shaders/atmosphere.glsl.ts ──────────────────────
// 3-layer Fresnel atmosphere shader for altis.to-grade limb glow.
// One shader pair reused for all 3 layers via different uniform values.
// Layer A: main blue limb (radius 1.06, power 3.2)
// Layer B: thin white inner haze (radius 1.025, power 7.0)
// Layer C: wide outer scatter (radius 1.12, power 2.0)

export const atmosphereVertexShader = /* glsl */ `
varying vec3 vNormal;
varying vec3 vViewDir;
varying vec3 vWorldNormal;

void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vNormal    = normalize(normalMatrix * normal);
  vViewDir   = normalize(-mvPosition.xyz);
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position  = projectionMatrix * mvPosition;
}
`;

export const atmosphereFragmentShader = /* glsl */ `
precision mediump float;

uniform vec3  u_color;
uniform float u_power;
uniform float u_opacity;
uniform vec3  u_sunDirection;

varying vec3 vNormal;
varying vec3 vViewDir;
varying vec3 vWorldNormal;

void main() {
  float fresnel = pow(
    1.0 - abs(dot(normalize(vNormal), normalize(vViewDir))),
    u_power
  );

  // Sun influence: glow brighter on sun-facing limb
  float sunFactor = clamp(
    dot(normalize(vWorldNormal), normalize(u_sunDirection)) * 0.5 + 0.5,
    0.3, 1.0
  );

  float finalOpacity = fresnel * u_opacity * sunFactor;
  gl_FragColor = vec4(u_color, finalOpacity);
}
`;
