export const binarystarFrag = /* glsl */ `
precision mediump float;

uniform float uTime;
uniform float uApproach;
uniform vec3 uAccent;
uniform vec3 uSecondary;
uniform float uOpacity;

varying vec2 vUv;

void main() {
  vec2 uv = vUv - 0.5;
  float t = uTime * 0.4;

  // Two star positions — orbiting center of mass
  vec2 starA = vec2(cos(t) * 0.18, sin(t) * 0.18);
  vec2 starB = vec2(cos(t + 3.14159) * 0.12, sin(t + 3.14159) * 0.12);

  float distA = length(uv - starA);
  float distB = length(uv - starB);

  // Star cores
  float coreA = smoothstep(0.07, 0.0, distA);
  float coreB = smoothstep(0.045, 0.0, distB);

  // Gravitational light bridge between stars
  vec2 bridge = starB - starA;
  float bridgeLen = length(bridge);
  vec2 bridgeDir = bridge / (bridgeLen + 0.001);
  float projOnBridge = dot(uv - starA, bridgeDir);
  projOnBridge = clamp(projOnBridge, 0.0, bridgeLen);
  vec2 closestOnBridge = starA + bridgeDir * projOnBridge;
  float bridgeDist = length(uv - closestOnBridge);
  float bridgeGlow = smoothstep(0.05, 0.0, bridgeDist) * 0.6;
  // Roche lobe overflow — matter stream
  float stream = bridgeGlow * (sin(projOnBridge * 20.0 - uTime * 3.0) * 0.5 + 0.5);

  // Corona — glow around each star
  float coronaA = smoothstep(0.3, 0.07, distA) * 0.25;
  float coronaB = smoothstep(0.2, 0.045, distB) * 0.2;

  vec3 colorA = uAccent;
  vec3 colorB = uSecondary;

  vec3 col = vec3(0.0);
  col += colorA * coreA * 2.0;
  col += colorB * coreB * 2.0;
  col += mix(colorA, colorB, projOnBridge / (bridgeLen + 0.001)) * bridgeGlow * stream;
  col += colorA * coronaA;
  col += colorB * coronaB;

  col *= 0.6 + uApproach * 0.8;

  float alpha = max(coreA, coreB) + bridgeGlow * 0.7 + coronaA + coronaB;
  alpha = clamp(alpha, 0.0, 1.0) * uOpacity;
  gl_FragColor = vec4(col, alpha);
}
`;
