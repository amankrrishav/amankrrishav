"use client";

import { EffectComposer, Bloom, Vignette, Noise } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";

export default function Effects() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        luminanceThreshold={0.2}
        luminanceSmoothing={0.9}
        intensity={1.5}
        mipmapBlur
      />
      <Vignette
        offset={0.3}
        darkness={0.85}
        blendFunction={BlendFunction.NORMAL}
      />
      <Noise
        opacity={0.03}
        blendFunction={BlendFunction.OVERLAY}
      />
    </EffectComposer>
  );
}
