"use client";

import dynamic from "next/dynamic";

const Universe = dynamic(() => import("@/components/Universe"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#000005",
      }}
    />
  ),
});

export default function Home() {
  return <Universe />;
}
