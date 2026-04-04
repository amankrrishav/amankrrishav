export const pulsarFrag = /* glsl */ `
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

  // Central star core
  float core = 1.0 - smoothstep(0.0, 0.08, dist);

  // Two rotating beams (pulsars emit from poles)
  float angle = atan(uv.y, uv.x);
  float beamSpeed = uTime * 3.0;
  float beam1 = smoothstep(0.15, 0.0, abs(mod(angle + beamSpeed, 3.14159) - 1.5708));
  float beam2 = smoothstep(0.15, 0.0, abs(mod(angle + beamSpeed + 3.14159, 3.14159) - 1.5708));
  float beam = (beam1 + beam2) * (1.0 - smoothstep(0.0, 0.5, dist));

  // Pulsing equatorial ring
  float pulse = sin(uTime * 8.0) * 0.5 + 0.5;
  float ring = smoothstep(0.22, 0.18, dist) * smoothstep(0.12, 0.16, dist) * pulse;

  // Magnetic field lines
  float field = sin(angle * 4.0 + uTime * 2.0) * 0.5 + 0.5;
  field *= smoothstep(0.5, 0.1, dist) * 0.15;

  vec3 col = uAccent * core;
  col += uSecondary * beam * 0.8;
  col += uAccent * ring;
  col += uSecondary * field;

  // Approach reveal
  col *= 0.6 + uApproach * 0.8;

  float alpha = core + beam * 0.6 + ring + field;
  alpha = clamp(alpha, 0.0, 1.0) * uOpacity;

  gl_FragColor = vec4(col, alpha);
}
`;
