"use client";

import { Canvas } from "@react-three/fiber";
import Starfield from "./Starfield";
import CameraRig from "./CameraRig";
import Effects from "./Effects";

import ConstellationField from "./ConstellationField";
import SkillsPlanets from "./SkillsPlanets";

export default function Scene() {
  return (
    <div className="canvas-layer">
      <Canvas
        camera={{
          fov: 60,
          near: 0.1,
          far: 2000,
          position: [0, 0, 50],
        }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          stencil: false,
        }}
        dpr={[1, 2]}
        style={{ background: "#000005" }}
      >
        {/* Ambient light for non-emissive objects */}
        <ambientLight intensity={0.1} />

        {/* Stars */}
        <Starfield />

        {/* About section: constellation */}
        <ConstellationField />

        {/* Skills section: 3 planets + moons */}
        <SkillsPlanets />

        {/* Scroll-driven camera */}
        <CameraRig />

        {/* Post-processing */}
        <Effects />
      </Canvas>
    </div>
  );
}
