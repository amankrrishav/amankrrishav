# amankumarrishav.com

Personal portfolio — an immersive 3D space-themed experience built with Next.js 16, React Three Fiber, and GSAP. One continuous scroll through a cosmic universe where each section is a distinct celestial destination.

## Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 (App Router) |
| 3D | Three.js · React Three Fiber · Drei |
| Animation | GSAP · useFrame loops |
| Scroll | Lenis smooth scroll |
| State | Zustand |
| Fonts | Syne · Space Grotesk · JetBrains Mono · Fraunces |

## Architecture

```
Single <Canvas> in Scene.tsx — one WebGL renderer, always.
3D components live in components/canvas/.
HTML overlays live in components/overlays/.
Data lives in content/.
```

**Scroll-driven camera:** A spline-based `CameraRig` interpolates through waypoints as the user scrolls. Individual sections (Skills, Timeline) can take over camera control via zustand flags.

## Sections

| Range | Section | 3D Element | Status |
|-------|---------|------------|--------|
| 0.00–0.10 | Hero | Starfield + breathing camera | ✅ |
| 0.10–0.25 | About | Constellation field + shooting stars | ✅ |
| 0.28–0.45 | Skills | 3 planets with orbiting skill moons | ✅ |
| 0.50–0.75 | Timeline | Constellation star map (4 entries + 20 slots) | ✅ v1 |
| 0.75–0.85 | Passions | — | 🔲 |
| 0.85–0.90 | Photography | — | 🔲 |
| 0.90–0.95 | Portfolio | — | 🔲 |
| 0.95–1.00 | Contact | — | 🔲 |