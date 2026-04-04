import * as THREE from "three";
import type { TimelineEntry } from "@/content/timeline";

/**
 * Seeded PRNG — mulberry32.
 * Deterministic: same seed → same sequence. No Math.random().
 */
function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Compute stable 3D positions for a constellation of timeline stars.
 *
 * Step 1 — Real entries spread left→right on x-axis by order.
 * Step 2 — Empty entries fill a loose halo around real entries.
 * Step 3 — Minimum separation enforcement (3 relaxation iterations).
 * Step 4 — Return positions array indexed to match entries array order.
 *
 * Pure function. Deterministic. No side effects.
 */
export function computeConstellationLayout(
  entries: TimelineEntry[]
): THREE.Vector3[] {
  const rng = mulberry32(42);
  const realEntries = entries.filter((e) => e.type !== "empty");
  const totalReal = realEntries.length;

  const positions: THREE.Vector3[] = [];

  for (const entry of entries) {
    if (entry.type !== "empty") {
      // Step 1: Seed positions with time-axis bias
      const xBase = (entry.order / totalReal) * 60 - 30;
      const y = rng() * 30 - 15;
      const z = rng() * 20 - 10;
      positions.push(new THREE.Vector3(xBase, y, z));
    } else {
      // Step 2: Empty stars fill remaining space in a loose halo
      const x = rng() * 80 - 40;
      const y = rng() * 50 - 25;
      const z = rng() * 30 - 15;
      positions.push(new THREE.Vector3(x, y, z));
    }
  }

  // Step 3: Minimum separation enforcement — 3 relaxation iterations
  const minDist = 6;
  const _dir = new THREE.Vector3();

  for (let iter = 0; iter < 3; iter++) {
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const dist = positions[i].distanceTo(positions[j]);
        if (dist < minDist && dist > 0.01) {
          _dir.subVectors(positions[j], positions[i]).normalize();
          const push = (minDist - dist) / 2;
          positions[i].addScaledVector(_dir, -push);
          positions[j].addScaledVector(_dir, push);
        }
      }
    }
  }

  // Step 4: Return positions indexed to match entries array order
  return positions;
}

/**
 * Compute constellation line connections.
 *
 * Sequential: real entries connected in order (0→1, 1→2, 2→3).
 * Nearest: each real entry also connects to its nearest 1–2 non-sequential real neighbours.
 * Empty entries get zero connections.
 *
 * Returns array of [indexA, indexB] pairs referencing the entries array.
 */
export function computeConnections(
  entries: TimelineEntry[],
  positions: THREE.Vector3[]
): [number, number][] {
  const realIndices = entries
    .map((e, i) => (e.type !== "empty" ? i : -1))
    .filter((i) => i >= 0);

  const connections: [number, number][] = [];
  const added = new Set<string>();

  const key = (a: number, b: number) =>
    `${Math.min(a, b)}-${Math.max(a, b)}`;

  // Sequential connections
  for (let i = 0; i < realIndices.length - 1; i++) {
    const a = realIndices[i];
    const b = realIndices[i + 1];
    connections.push([a, b]);
    added.add(key(a, b));
  }

  // Nearest non-sequential connections (1–2 per real entry)
  for (let i = 0; i < realIndices.length; i++) {
    let bestJ = -1;
    let bestDist = Infinity;

    for (let j = 0; j < realIndices.length; j++) {
      if (Math.abs(i - j) <= 1) continue; // skip self + sequential
      const k = key(realIndices[i], realIndices[j]);
      if (added.has(k)) continue;
      const dist = positions[realIndices[i]].distanceTo(
        positions[realIndices[j]]
      );
      if (dist < bestDist) {
        bestDist = dist;
        bestJ = j;
      }
    }

    if (bestJ >= 0) {
      const pair: [number, number] = [
        Math.min(realIndices[i], realIndices[bestJ]),
        Math.max(realIndices[i], realIndices[bestJ]),
      ];
      const k = key(pair[0], pair[1]);
      if (!added.has(k)) {
        connections.push(pair);
        added.add(k);
      }
    }
  }

  return connections;
}
