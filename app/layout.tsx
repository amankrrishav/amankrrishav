import type { Metadata, Viewport } from "next";
import { spaceGrotesk, jetbrainsMono, clashDisplay, fraunces } from "@/lib/fonts";
import LenisProvider from "@/components/providers/LenisProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aman Kumar Rishav — Universe Portfolio",
  description:
    "Building at the Edge of the Universe. Full-stack developer, trader, photographer, and eternal curious mind. Explore the cosmos of my work.",
  keywords: ["Aman Kumar Rishav", "portfolio", "developer", "3D", "immersive"],
  authors: [{ name: "Aman Kumar Rishav" }],
  openGraph: {
    title: "Aman Kumar Rishav — Universe Portfolio",
    description: "Building at the Edge of the Universe.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#000005",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} ${clashDisplay.variable} ${fraunces.variable}`}
    >
      <body>
        <LenisProvider>{children}</LenisProvider>
      </body>
    </html>
  );
}
