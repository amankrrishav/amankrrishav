"use client";
// ─── SECTION BOUNDARY ──────────────────────
// components/overlays/PhotographyOverlay.tsx

import { useRef, useEffect, useState, useCallback } from "react";
import gsap from "gsap";
import { useUniverse } from "@/stores/useUniverse";
import { INDIA_PINS, type PhotoPin } from "@/content/photography";

const SECTION_START = 0.94;
const SECTION_END = 0.99;

export default function PhotographyOverlay() {
  const scrollProgress = useUniverse((s) => s.scrollProgress);
  const bootComplete = useUniverse((s) => s.bootComplete);
  const hoveredPinId = useUniverse((s) => s.hoveredPinId);
  const activePinId = useUniverse((s) => s.activePinId);
  const galleryOpen = useUniverse((s) => s.photographyGalleryOpen);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [uploadCaption, setUploadCaption] = useState("");
  const [uploadCity, setUploadCity] = useState("");

  const titleRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const titleAnimated = useRef(false);

  // Section visibility
  let opacity = 0;
  if (scrollProgress >= SECTION_START && scrollProgress <= SECTION_END) {
    const fadeIn = SECTION_START + 0.005;
    const fadeOut = SECTION_END - 0.005;
    if (scrollProgress < fadeIn) opacity = (scrollProgress - SECTION_START) / 0.005;
    else if (scrollProgress > fadeOut) opacity = (SECTION_END - scrollProgress) / 0.005;
    else opacity = 1;
  }
  opacity = Math.max(0, Math.min(1, opacity));

  const hoveredPin = hoveredPinId ? INDIA_PINS.find(p => p.id === hoveredPinId) : null;
  const activePin = activePinId ? INDIA_PINS.find(p => p.id === activePinId) : null;

  // Mouse tracking for tooltip
  useEffect(() => {
    const handler = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  // Title GSAP animation
  useEffect(() => {
    if (opacity > 0.5 && titleRef.current && !titleAnimated.current) {
      titleAnimated.current = true;
      gsap.fromTo(titleRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1.2, delay: 0.5, ease: "power3.out" }
      );
    }
    if (opacity <= 0) titleAnimated.current = false;
  }, [opacity]);

  // Gallery stagger entrance
  useEffect(() => {
    if (galleryOpen && galleryRef.current) {
      const cards = galleryRef.current.querySelectorAll(".polaroid");
      gsap.fromTo(cards,
        { opacity: 0, scale: 0, rotateY: 90 },
        { opacity: 1, scale: 1, rotateY: 0, duration: 0.5, stagger: 0.1, ease: "back.out(1.2)" }
      );
    }
  }, [galleryOpen]);

  // Tooltip animation
  useEffect(() => {
    if (tooltipRef.current) {
      if (hoveredPin) {
        gsap.to(tooltipRef.current, { opacity: 1, scale: 1, duration: 0.25, ease: "power2.out" });
      } else {
        gsap.to(tooltipRef.current, { opacity: 0, scale: 0.9, duration: 0.2 });
      }
    }
  }, [hoveredPin]);

  // Admin panel keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "A") {
        e.preventDefault();
        setAdminOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Lightbox keyboard nav
  useEffect(() => {
    if (lightboxIdx === null || !activePin) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIdx(null);
      if (e.key === "ArrowRight") setLightboxIdx(prev => prev !== null ? Math.min(prev + 1, activePin.photos.length - 1) : 0);
      if (e.key === "ArrowLeft") setLightboxIdx(prev => prev !== null ? Math.max(prev - 1, 0) : 0);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxIdx, activePin]);

  const handleBack = useCallback(() => {
    useUniverse.getState().setDiveReversing(true);
    setLightboxIdx(null);
  }, []);

  const handleAdminSubmit = useCallback(() => {
    if (!uploadCity) return;
    const existing = INDIA_PINS.find(p => p.city.toLowerCase() === uploadCity.toLowerCase());
    if (existing) {
      const newPin: PhotoPin = {
        ...existing,
        id: `${existing.id}-custom-${Date.now()}`,
        caption: uploadCaption || existing.caption,
      };
      useUniverse.getState().addPhotographyPin(newPin);
      setUploadCaption("");
      setUploadCity("");
    }
  }, [uploadCity, uploadCaption]);

  if (!bootComplete || opacity <= 0) return null;

  // Assign random tilts to polaroids (deterministic from index)
  const getTilt = (i: number) => ((i * 7 + 3) % 25) - 12;
  const getTz = (i: number) => -(i * 8) % 60;

  return (
    <div className="overlay-layer" style={{ opacity, pointerEvents: opacity < 0.1 ? "none" : "auto", background: "transparent" }}>

      {/* ── Section Title ── */}
      <div ref={titleRef} style={{
        position: "absolute", top: "clamp(24px,4vh,48px)", left: "clamp(24px,4vw,56px)",
        fontFamily: "var(--font-display)", fontSize: "clamp(3rem,9vw,9rem)",
        fontWeight: 200, letterSpacing: "0.3em", color: "rgba(255,255,255,0.92)",
        opacity: 0, lineHeight: 1,
      }}>
        PHOTOGRAPHY
      </div>

      {/* ── Pin Tooltip ── */}
      <div ref={tooltipRef} style={{
        position: "fixed", left: mousePos.x + 16, top: mousePos.y - 8,
        background: "rgba(10,12,20,0.72)", backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: "12px", padding: "12px 18px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        opacity: 0, transform: "scale(0.9)",
        pointerEvents: "none", zIndex: 20, transition: "left 0.05s, top 0.05s",
      }}>
        {hoveredPin && (
          <>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1rem", color: "#fff" }}>{hoveredPin.city}</div>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{hoveredPin.photos.length} photos</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "rgba(150,200,255,0.8)", marginTop: 4 }}>Click to explore →</div>
          </>
        )}
      </div>

      {/* ── Gallery ── */}
      {galleryOpen && activePin && (
        <div style={{
          position: "fixed", inset: 0, display: "flex", alignItems: "center",
          justifyContent: "center", perspective: "1200px", zIndex: 30,
          background: "radial-gradient(ellipse at center, rgba(5,8,20,0.85) 0%, rgba(0,0,0,0.95) 100%)",
          backdropFilter: "blur(2px)", flexWrap: "wrap", gap: "24px", padding: "60px 40px",
          pointerEvents: "auto", overflowY: "auto",
        }}>
          {/* Back button */}
          <button onClick={handleBack} style={{
            position: "fixed", top: "clamp(80px,12vh,140px)", left: "clamp(24px,4vw,56px)",
            fontFamily: "var(--font-mono)", fontSize: "0.75rem", letterSpacing: "0.2em",
            color: "#fff", background: "none", border: "none", cursor: "pointer",
            zIndex: 40, textTransform: "uppercase", opacity: 0.8,
          }}>
            ← Back to Earth
          </button>

          {/* City name */}
          <div style={{
            position: "fixed", top: "clamp(24px,4vh,48px)", left: "50%", transform: "translateX(-50%)",
            fontFamily: "var(--font-display)", fontSize: "clamp(1.5rem,3vw,2.5rem)",
            fontWeight: 700, color: "#fff", letterSpacing: "0.05em", zIndex: 40,
          }}>
            {activePin.city}
          </div>

          {/* Polaroid grid */}
          <div ref={galleryRef} style={{ display: "flex", flexWrap: "wrap", gap: "24px", justifyContent: "center", alignItems: "center", marginTop: "40px" }}>
            {activePin.photos.map((url, i) => (
              <div key={i} className="polaroid" onClick={() => setLightboxIdx(i)} style={{
                width: url.includes("600/800") ? "220px" : "280px",
                background: "#f5f0e8", padding: "12px 12px 40px 12px",
                boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 4px 12px rgba(0,0,0,0.3)",
                borderRadius: "2px", cursor: "pointer",
                transform: `rotate(${getTilt(i)}deg) translateZ(${getTz(i)}px)`,
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = `rotate(${getTilt(i) * 0.3}deg) scale(1.06) translateZ(10px)`; e.currentTarget.style.zIndex = "10"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = `rotate(${getTilt(i)}deg) translateZ(${getTz(i)}px)`; e.currentTarget.style.zIndex = "1"; }}
              >
                <img src={url} alt={`${activePin.city} ${i + 1}`} style={{ width: "100%", height: "auto", display: "block", objectFit: "cover" }} />
                <div style={{ fontFamily: "var(--font-serif)", fontSize: "0.75rem", color: "#555", textAlign: "center", paddingTop: "8px" }}>
                  {activePin.caption}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Lightbox ── */}
      {lightboxIdx !== null && activePin && (
        <div onClick={() => setLightboxIdx(null)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)",
          zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
          flexDirection: "column", cursor: "zoom-out", pointerEvents: "auto",
        }}>
          <img src={activePin.photos[lightboxIdx]} alt="" style={{ maxWidth: "90vw", maxHeight: "85vh", objectFit: "contain" }} onClick={e => e.stopPropagation()} />
          <div style={{ fontFamily: "var(--font-serif)", fontSize: "1rem", color: "rgba(255,255,255,0.7)", marginTop: "16px", textAlign: "center" }}>
            {activePin.caption} — {lightboxIdx + 1}/{activePin.photos.length}
          </div>
          <button onClick={(e) => { e.stopPropagation(); setLightboxIdx(null); }} style={{
            position: "fixed", top: "20px", right: "24px", fontFamily: "var(--font-mono)",
            fontSize: "1.5rem", color: "#fff", background: "none", border: "none", cursor: "pointer",
          }}>✕</button>
        </div>
      )}

      {/* ── Admin Panel Toggle ── */}
      <button onClick={() => setAdminOpen(prev => !prev)} style={{
        position: "absolute", bottom: "20px", right: "20px", width: "32px", height: "32px",
        background: "none", border: "none", cursor: "pointer", opacity: adminOpen ? 1 : 0.3,
        fontSize: "1.2rem", color: "#fff", zIndex: 50, pointerEvents: "auto",
        transition: "opacity 0.3s",
      }}>⚙</button>

      {/* ── Admin Panel ── */}
      <div style={{
        position: "fixed", top: 0, right: adminOpen ? 0 : -400, width: "380px", height: "100vh",
        background: "rgba(8,10,18,0.92)", backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)", borderLeft: "1px solid rgba(255,255,255,0.12)",
        transition: "right 0.4s ease", zIndex: 60, padding: "40px 24px",
        display: "flex", flexDirection: "column", gap: "16px", pointerEvents: "auto",
        overflowY: "auto",
      }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", color: "#fff", marginBottom: "8px" }}>Add Photo Pin</div>

        <label style={labelStyle}>City / Location</label>
        <select value={uploadCity} onChange={e => setUploadCity(e.target.value)} style={inputStyle}>
          <option value="">Select...</option>
          {INDIA_PINS.map(p => <option key={p.id} value={p.city}>{p.city}</option>)}
        </select>

        <label style={labelStyle}>Caption (max 120)</label>
        <textarea value={uploadCaption} onChange={e => setUploadCaption(e.target.value.slice(0, 120))} maxLength={120} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "rgba(255,255,255,0.3)", textAlign: "right" }}>{uploadCaption.length}/120</div>

        <button onClick={handleAdminSubmit} style={{
          fontFamily: "var(--font-sans)", fontSize: "0.85rem", textTransform: "uppercase",
          letterSpacing: "0.15em", padding: "12px", background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.2)", borderRadius: "6px", color: "#fff",
          cursor: "pointer", marginTop: "8px", transition: "background 0.2s",
        }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.15)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
        >
          Add to Globe
        </button>

        <button onClick={() => setAdminOpen(false)} style={{
          position: "absolute", top: "12px", right: "12px", background: "none",
          border: "none", color: "#fff", cursor: "pointer", fontSize: "1.2rem", opacity: 0.5,
        }}>✕</button>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.15em",
  textTransform: "uppercase", color: "rgba(255,255,255,0.5)",
};

const inputStyle: React.CSSProperties = {
  fontFamily: "var(--font-sans)", fontSize: "0.85rem", padding: "10px 12px",
  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "6px", color: "#fff", outline: "none",
};
