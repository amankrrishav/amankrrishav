import * as THREE from "three";

/**
 * Procedural canvas textures for the 3 skill planets.
 * These produce 2D painted surfaces applied as CanvasTexture —
 * NOT vertex displacement (which creates flat polygon faces).
 */

export function createSyntharTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 256;
  const x = c.getContext("2d")!;

  // Base: deep navy
  x.fillStyle = "#0a1628";
  x.fillRect(0, 0, 512, 256);

  // Horizontal gas bands
  for (let y = 0; y < 256; y += 6) {
    const b = Math.random() * 0.2;
    x.fillStyle = `rgba(15, 40, 80, ${b})`;
    x.fillRect(0, y, 512, 4 + Math.random() * 6);
  }

  // Lime electric veins
  x.strokeStyle = "#C8FF00";
  x.lineWidth = 1;
  x.globalAlpha = 0.25;
  for (let i = 0; i < 25; i++) {
    x.beginPath();
    const yy = Math.random() * 256;
    x.moveTo(0, yy);
    for (let xx = 0; xx < 512; xx += 15) {
      x.lineTo(xx, yy + (Math.random() - 0.5) * 12);
    }
    x.stroke();
  }

  // Bright spots
  x.globalAlpha = 0.15;
  for (let i = 0; i < 8; i++) {
    const grd = x.createRadialGradient(
      Math.random() * 512, Math.random() * 256, 0,
      Math.random() * 512, Math.random() * 256, 30 + Math.random() * 40
    );
    grd.addColorStop(0, "#C8FF00");
    grd.addColorStop(1, "transparent");
    x.fillStyle = grd;
    x.fillRect(0, 0, 512, 256);
  }
  x.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

export function createChromaraTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 256;
  const x = c.getContext("2d")!;

  // Base: deep violet
  x.fillStyle = "#1a0a2e";
  x.fillRect(0, 0, 512, 256);

  // Swirling violet/magenta bands
  for (let y = 0; y < 256; y += 5) {
    const hue = 270 + Math.sin(y * 0.05) * 30;
    x.fillStyle = `hsla(${hue}, 70%, ${20 + Math.random() * 25}%, 0.4)`;
    x.fillRect(0, y, 512, 3 + Math.random() * 5);
  }

  // White wisps
  x.strokeStyle = "rgba(255, 255, 255, 0.08)";
  x.lineWidth = 2;
  for (let i = 0; i < 15; i++) {
    x.beginPath();
    const yy = Math.random() * 256;
    x.moveTo(Math.random() * 200, yy);
    x.bezierCurveTo(
      150 + Math.random() * 100, yy + (Math.random() - 0.5) * 40,
      300 + Math.random() * 100, yy + (Math.random() - 0.5) * 40,
      512, yy + (Math.random() - 0.5) * 30
    );
    x.stroke();
  }

  // Magenta glow spots
  x.globalAlpha = 0.2;
  for (let i = 0; i < 6; i++) {
    const grd = x.createRadialGradient(
      Math.random() * 512, Math.random() * 256, 0,
      Math.random() * 512, Math.random() * 256, 25 + Math.random() * 35
    );
    grd.addColorStop(0, "#cc44ff");
    grd.addColorStop(1, "transparent");
    x.fillStyle = grd;
    x.fillRect(0, 0, 512, 256);
  }
  x.globalAlpha = 1;

  return new THREE.CanvasTexture(c);
}

export function createVelocisTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 256;
  const x = c.getContext("2d")!;

  // Base: coral/rust
  x.fillStyle = "#c1440e";
  x.fillRect(0, 0, 512, 256);

  // Darker crater blotches
  x.globalAlpha = 0.5;
  for (let i = 0; i < 30; i++) {
    const cx = Math.random() * 512;
    const cy = Math.random() * 256;
    const r = 5 + Math.random() * 25;
    const grd = x.createRadialGradient(cx, cy, 0, cx, cy, r);
    grd.addColorStop(0, "#7a2000");
    grd.addColorStop(1, "#c1440e");
    x.fillStyle = grd;
    x.beginPath();
    x.ellipse(cx, cy, r, r * (0.6 + Math.random() * 0.4), Math.random() * Math.PI, 0, Math.PI * 2);
    x.fill();
  }

  // Orange highlights
  x.globalAlpha = 0.3;
  for (let i = 0; i < 12; i++) {
    const cx = Math.random() * 512;
    const cy = Math.random() * 256;
    const r = 8 + Math.random() * 20;
    const grd = x.createRadialGradient(cx, cy, 0, cx, cy, r);
    grd.addColorStop(0, "#ff6633");
    grd.addColorStop(1, "transparent");
    x.fillStyle = grd;
    x.fillRect(cx - r, cy - r, r * 2, r * 2);
  }
  x.globalAlpha = 1;

  return new THREE.CanvasTexture(c);
}
