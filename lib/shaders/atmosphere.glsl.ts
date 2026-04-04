// ─── SECTION BOUNDARY ──────────────────────
// lib/shaders/atmosphere.glsl.ts

export const atmosphereVertexShader = /* glsl */ `
varying float vFresnel;

void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vec3 viewNormal = normalize(normalMatrix * normal);
  vec3 viewDir = normalize(-mvPosition.xyz);
  vFresnel = 1.0 - abs(dot(viewNormal, viewDir));
  gl_Position = projectionMatrix * mvPosition;
}
`;

export const atmosphereFragmentShader = /* glsl */ `
precision mediump float;

uniform vec3 u_color;
uniform float u_power;
uniform float u_opacity;

varying float vFresnel;

void main() {
  float rim = pow(vFresnel, u_power);
  gl_FragColor = vec4(u_color, rim * u_opacity);
}
`;
