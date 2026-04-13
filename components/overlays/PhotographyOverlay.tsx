"use client";
// ─── components/overlays/PhotographyOverlay.tsx ──────────────────────
// HTML overlay for the photography section: title, coordinates display,
// city labels, pin tooltip, polaroid gallery, lightbox, admin panel.

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import gsap from "gsap";
import { useUniverse } from "@/stores/useUniverse";
import { INDIA_PINS, type PhotoPin, type PhotoItem } from "@/content/photography";

export default function PhotographyOverlay() {
  const scrollProgress = useUniverse((s) => s.scrollProgress);
  const bootComplete = useUniverse((s) => s.bootComplete);
  const photographyActive = useUniverse((s) => s.photographyActive);
  const hoveredPinId = useUniverse((s) => s.hoveredPinId);
  const activePinId = useUniverse((s) => s.activePinId);
  const galleryOpen = useUniverse((s) => s.photographyGalleryOpen);
  const pinScreenPositions = useUniverse((s) => s.pinScreenPositions);
  const dynamicPins = useUniverse((s) => s.dynamicPins);
  const displayCoords = useUniverse((s) => s.displayCoords);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [uploadCaption, setUploadCaption] = useState("");
  const [uploadCity, setUploadCity] = useState("");
  const [uploadLat, setUploadLat] = useState("");
  const [uploadLng, setUploadLng] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [coordsDisplay, setCoordsDisplay] = useState({ lat: 12.9716, lng: 77.5946 });

  const titleRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const adminPanelRef = useRef<HTMLDivElement>(null);
  const polaroidRefs = useRef<HTMLDivElement[]>([]);
  const titleAnimated = useRef(false);
  const coordsAnimRef = useRef({ lat: 12.9716, lng: 77.5946 });

  const allPins = useMemo(
    () => [...INDIA_PINS, ...dynamicPins],
    [dynamicPins]
  );

  const hoveredPin = hoveredPinId
    ? allPins.find((p) => p.id === hoveredPinId) ?? null
    : null;
  const activePin = activePinId
    ? allPins.find((p) => p.id === activePinId) ?? null
    : null;

  // Pre-computed random tilts for polaroids
  const randomTilts = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) =>
      ((i * 7 + 3) % 25) - 12
    );
  }, []);

  // Mouse tracking for tooltip
  useEffect(() => {
    const handler = (e: MouseEvent) =>
      setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  // Title GSAP entrance
  useEffect(() => {
    if (photographyActive && titleRef.current && !titleAnimated.current) {
      titleAnimated.current = true;
      gsap.fromTo(
        titleRef.current,
        { opacity: 0, y: 28, letterSpacing: "0.5em" },
        {
          opacity: 1,
          y: 0,
          letterSpacing: "0.32em",
          duration: 1.4,
          delay: 2.2,
          ease: "power3.out",
        }
      );
    }
    if (!photographyActive) titleAnimated.current = false;
  }, [photographyActive]);

  // Coordinate tween on hover
  useEffect(() => {
    if (hoveredPin) {
      gsap.to(coordsAnimRef.current, {
        lat: hoveredPin.lat,
        lng: hoveredPin.lng,
        duration: 1.2,
        ease: "power2.inOut",
        onUpdate: () => {
          setCoordsDisplay({ ...coordsAnimRef.current });
        },
      });
    } else {
      gsap.to(coordsAnimRef.current, {
        lat: 12.9716,
        lng: 77.5946,
        duration: 1.2,
        ease: "power2.inOut",
        onUpdate: () => {
          setCoordsDisplay({ ...coordsAnimRef.current });
        },
      });
    }
  }, [hoveredPin]);

  // Tooltip GSAP animation
  useEffect(() => {
    if (tooltipRef.current) {
      if (hoveredPin) {
        gsap.to(tooltipRef.current, {
          opacity: 1,
          scale: 1,
          duration: 0.22,
          ease: "back.out(1.5)",
        });
      } else {
        gsap.to(tooltipRef.current, {
          opacity: 0,
          scale: 0.92,
          duration: 0.16,
        });
      }
    }
  }, [hoveredPin]);

  // Gallery stagger entrance
  useEffect(() => {
    if (galleryOpen && activePin && polaroidRefs.current.length > 0) {
      gsap.fromTo(
        polaroidRefs.current.filter(Boolean),
        {
          opacity: 0,
          scale: 0.3,
          rotateY: 75,
          rotateX: -15,
        },
        {
          opacity: 1,
          scale: 1,
          rotateY: 0,
          rotateX: 0,
          duration: 0.55,
          stagger: 0.09,
          ease: "back.out(1.4)",
          delay: 0.1,
        }
      );
    }
  }, [galleryOpen, activePin]);

  // Admin panel GSAP open/close
  useEffect(() => {
    if (adminPanelRef.current) {
      if (adminOpen) {
        gsap.to(adminPanelRef.current, {
          x: 0,
          duration: 0.38,
          ease: "power2.out",
        });
      } else {
        gsap.to(adminPanelRef.current, {
          x: 380,
          duration: 0.3,
          ease: "power2.in",
        });
      }
    }
  }, [adminOpen]);

  // Admin panel keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "A") {
        e.preventDefault();
        setAdminOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Lightbox keyboard navigation
  useEffect(() => {
    if (lightboxIdx === null || !activePin) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIdx(null);
      if (e.key === "ArrowRight")
        setLightboxIdx((prev) =>
          prev !== null ? Math.min(prev + 1, activePin.photos.length - 1) : 0
        );
      if (e.key === "ArrowLeft")
        setLightboxIdx((prev) =>
          prev !== null ? Math.max(prev - 1, 0) : 0
        );
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxIdx, activePin]);

  // Load dynamic pins from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("photography_dynamic_pins");
      if (saved) {
        const pins: PhotoPin[] = JSON.parse(saved);
        pins.forEach((pin) => {
          useUniverse.getState().addPhotographyPin(pin);
        });
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  // Persist dynamic pins to localStorage (debounced)
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (dynamicPins.length > 0) {
        localStorage.setItem(
          "photography_dynamic_pins",
          JSON.stringify(dynamicPins)
        );
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [dynamicPins]);

  const handleBack = useCallback(() => {
    // GSAP gallery exit
    if (polaroidRefs.current.length > 0) {
      gsap.to(polaroidRefs.current.filter(Boolean), {
        opacity: 0,
        scale: 0.2,
        rotateY: -75,
        duration: 0.3,
        stagger: 0.04,
        ease: "power2.in",
      });
    }
    setTimeout(() => {
      useUniverse.getState().setPhotographyGalleryOpen(false);
      useUniverse.getState().setDiveReversing(true);
      useUniverse.getState().setActivePinId(null);
      setLightboxIdx(null);
    }, 350);
  }, []);

  const handlePinClick = useCallback((pinId: string) => {
    useUniverse.getState().setActivePinId(pinId);
    useUniverse.getState().setPhotographyDiveActive(true);
  }, []);

  // File upload handling
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setUploadFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => {
          setUploadPreview(ev.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    },
    []
  );

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type.startsWith("image/") )) {
      setUploadFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setUploadPreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleAdminSubmit = useCallback(() => {
    if (!uploadCity) return;
    const existing = INDIA_PINS.find(
      (p) => p.city.toLowerCase() === uploadCity.toLowerCase()
    );
    const lat = existing ? existing.lat : parseFloat(uploadLat) || 20;
    const lng = existing ? existing.lng : parseFloat(uploadLng) || 78;

    const newPin: PhotoPin = {
      id: crypto.randomUUID(),
      city: uploadCity,
      lat,
      lng,
      caption: uploadCaption || "A new perspective",
      photos: [
        {
          url: uploadPreview || `https://picsum.photos/seed/${Date.now()}/600/800`,
          orientation: "portrait" as const,
          label: uploadCaption || "New Photo",
        },
      ],
    };

    useUniverse.getState().addPhotographyPin(newPin);
    setUploadCaption("");
    setUploadCity("");
    setUploadLat("");
    setUploadLng("");
    setUploadFile(null);
    setUploadPreview(null);

    // Show success toast
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  }, [uploadCity, uploadCaption, uploadLat, uploadLng, uploadPreview]);

  // Auto-fill lat/lng when city matches
  useEffect(() => {
    const match = INDIA_PINS.find(
      (p) => p.city.toLowerCase() === uploadCity.toLowerCase()
    );
    if (match) {
      setUploadLat(match.lat.toString());
      setUploadLng(match.lng.toString());
    }
  }, [uploadCity]);

  if (!bootComplete || !photographyActive) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 10,
      }}
    >
      {/* ── Section Title ── */}
      <div
        ref={titleRef}
        style={{
          position: "absolute",
          top: "2.5rem",
          left: "3rem",
          fontFamily: "var(--font-display)",
          fontSize: "clamp(2.8rem, 8vw, 8.5rem)",
          fontWeight: 200,
          letterSpacing: "0.32em",
          color: "rgba(255, 255, 255, 0.90)",
          textTransform: "uppercase" as const,
          lineHeight: 1,
          opacity: 0,
          textShadow: "0 0 80px rgba(100, 160, 255, 0.3)",
          pointerEvents: "none",
        }}
      >
        PHOTOGRAPHY
      </div>

      {/* ── Coordinates Display ── */}
      {!galleryOpen && (
        <div
          style={{
            position: "absolute",
            top: "clamp(100px, 14vh, 180px)",
            left: "3rem",
            fontFamily: "var(--font-mono)",
            fontSize: "0.78rem",
            color: "rgba(255,255,255,0.55)",
            letterSpacing: "0.06em",
            lineHeight: 1.6,
            pointerEvents: "none",
          }}
        >
          <div>
            {Math.abs(coordsDisplay.lat).toFixed(6)}°{" "}
            {coordsDisplay.lat >= 0 ? "N" : "S"}
          </div>
          <div>
            {Math.abs(coordsDisplay.lng).toFixed(6)}°{" "}
            {coordsDisplay.lng >= 0 ? "E" : "W"}
          </div>
        </div>
      )}

      {/* ── City Labels (floating over globe pins) ── */}
      {!galleryOpen &&
        allPins.map((pin) => {
          const pos = pinScreenPositions[pin.id];
          if (!pos) return null;
          return (
            <div
              key={pin.id}
              style={{
                position: "absolute",
                left: pos.x + 14,
                top: pos.y - 6,
                pointerEvents: "auto",
                cursor: "pointer",
                opacity: pos.visible ? 1 : 0,
                transition: "opacity 0.3s",
                willChange: "transform",
              }}
              onClick={() => handlePinClick(pin.id)}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.65rem",
                  letterSpacing: "0.12em",
                  color: "rgba(255,255,255,0.75)",
                  textTransform: "uppercase" as const,
                  textShadow:
                    "0 2px 8px rgba(0,0,0,0.8), 0 0 20px rgba(100,160,255,0.4)",
                  whiteSpace: "nowrap" as const,
                }}
              >
                {pin.city}
              </span>
            </div>
          );
        })}

      {/* ── Pin Tooltip ── */}
      <div
        ref={tooltipRef}
        style={{
          position: "fixed",
          left: mousePos.x + 16,
          top: mousePos.y - 8,
          background: "rgba(8, 10, 20, 0.78)",
          backdropFilter: "blur(14px) saturate(1.4)",
          WebkitBackdropFilter: "blur(14px) saturate(1.4)",
          border: "1px solid rgba(255,255,255,0.13)",
          borderRadius: "14px",
          padding: "14px 20px",
          boxShadow:
            "0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(100,160,255,0.1)",
          opacity: 0,
          transform: "scale(0.88)",
          pointerEvents: "none",
          zIndex: 20,
          transition: "left 0.05s, top 0.05s",
        }}
      >
        {hoveredPin && (
          <>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.0rem",
                color: "#fff",
                fontWeight: 400,
              }}
            >
              {hoveredPin.city}
            </div>
            <div
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "0.72rem",
                color: "rgba(255,255,255,0.45)",
                marginTop: 2,
              }}
            >
              {hoveredPin.photos.length} photos
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.62rem",
                color: "rgba(140,190,255,0.8)",
                letterSpacing: "0.1em",
                marginTop: 4,
              }}
            >
              Click to explore →
            </div>
          </>
        )}
      </div>

      {/* ── Floating Polaroid Gallery ── */}
      {galleryOpen && activePin && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            perspective: "1400px",
            background:
              "radial-gradient(ellipse 80% 80% at 50% 50%, rgba(5,8,22,0.88) 0%, rgba(0,0,5,0.97) 100%)",
            backdropFilter: "blur(3px)",
            pointerEvents: "auto",
            zIndex: 50,
          }}
        >
          {/* Back button */}
          <button
            onClick={handleBack}
            style={{
              position: "fixed",
              top: "2.5rem",
              left: "3rem",
              fontFamily: "var(--font-mono)",
              fontSize: "0.72rem",
              letterSpacing: "0.2em",
              color: "rgba(255,255,255,0.65)",
              textTransform: "uppercase" as const,
              cursor: "pointer",
              background: "none",
              border: "none",
              zIndex: 55,
              transition: "color 0.2s, text-shadow 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "white";
              e.currentTarget.style.textShadow =
                "0 0 20px rgba(100,160,255,0.6)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgba(255,255,255,0.65)";
              e.currentTarget.style.textShadow = "none";
            }}
          >
            ← BACK TO EARTH
          </button>

          {/* City name */}
          <div
            style={{
              position: "fixed",
              top: "2.5rem",
              left: "50%",
              transform: "translateX(-50%)",
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.5rem, 3vw, 2.5rem)",
              fontWeight: 700,
              color: "#fff",
              letterSpacing: "0.05em",
              zIndex: 55,
            }}
          >
            {activePin.city}
          </div>

          {/* Polaroids arc */}
          <div
            ref={galleryRef}
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {activePin.photos.map((photo: PhotoItem, i: number) => {
              const total = activePin.photos.length;
              const spread = Math.min(total * 180, 720);
              const step = total > 1 ? spread / (total - 1) : 0;
              const startX = -(spread / 2);
              const xOffset = startX + i * step;
              const yOffset =
                Math.sin((i / Math.max(total - 1, 1)) * Math.PI) * -60;
              const zOffset = (i % 3) * -40;
              const tilt = randomTilts[i % randomTilts.length];

              return (
                <div
                  key={i}
                  ref={(el) => {
                    if (el) polaroidRefs.current[i] = el;
                  }}
                  onClick={() => setLightboxIdx(i)}
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    transform: `translateX(calc(-50% + ${xOffset}px)) translateY(calc(-50% + ${yOffset}px)) translateZ(${zOffset}px) rotate(${tilt}deg)`,
                    width:
                      photo.orientation === "portrait" ? "200px" : "265px",
                    background: "#f4efe6",
                    padding: "10px 10px 38px 10px",
                    borderRadius: "2px",
                    boxShadow:
                      "0 24px 64px rgba(0,0,0,0.7), 0 6px 16px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.8)",
                    cursor: "pointer",
                    transition:
                      "transform 0.28s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.28s ease",
                    willChange: "transform",
                    opacity: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = `translateX(calc(-50% + ${xOffset}px)) translateY(calc(-50% + ${yOffset}px)) translateZ(40px) scale(1.07) rotate(0deg)`;
                    e.currentTarget.style.boxShadow =
                      "0 40px 80px rgba(0,0,0,0.8), 0 8px 20px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.8)";
                    e.currentTarget.style.zIndex = "10";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = `translateX(calc(-50% + ${xOffset}px)) translateY(calc(-50% + ${yOffset}px)) translateZ(${zOffset}px) rotate(${tilt}deg)`;
                    e.currentTarget.style.boxShadow =
                      "0 24px 64px rgba(0,0,0,0.7), 0 6px 16px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.8)";
                    e.currentTarget.style.zIndex = "1";
                  }}
                >
                  <img
                    src={photo.url}
                    alt={`${activePin.city} — ${photo.label}`}
                    loading="lazy"
                    style={{
                      width: "100%",
                      height: "auto",
                      display: "block",
                      objectFit: "cover",
                    }}
                  />
                  <div
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: "0.68rem",
                      color: "#6b6056",
                      textAlign: "center" as const,
                      paddingTop: "6px",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {photo.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Lightbox ── */}
      {lightboxIdx !== null && activePin && (
        <div
          onClick={() => setLightboxIdx(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.96)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column" as const,
            cursor: "zoom-out",
            pointerEvents: "auto",
          }}
        >
          <img
            src={activePin.photos[lightboxIdx].url}
            alt={activePin.photos[lightboxIdx].label}
            style={{
              maxWidth: "90vw",
              maxHeight: "85vh",
              objectFit: "contain" as const,
            }}
            onClick={(e) => e.stopPropagation()}
          />
          <div
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "1rem",
              color: "rgba(255,255,255,0.65)",
              textAlign: "center" as const,
              marginTop: "1.2rem",
              maxWidth: "480px",
            }}
          >
            {activePin.photos[lightboxIdx].label} — {lightboxIdx + 1}/
            {activePin.photos.length}
          </div>

          {/* Nav arrows */}
          {lightboxIdx > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIdx((p) => (p !== null ? Math.max(p - 1, 0) : 0));
              }}
              style={{
                position: "fixed",
                left: "2rem",
                top: "50%",
                transform: "translateY(-50%)",
                width: "48px",
                height: "48px",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "50%",
                color: "#fff",
                fontFamily: "var(--font-mono)",
                fontSize: "1.2rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.18)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.08)";
              }}
            >
              ←
            </button>
          )}
          {lightboxIdx < activePin.photos.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIdx((p) =>
                  p !== null
                    ? Math.min(p + 1, activePin.photos.length - 1)
                    : 0
                );
              }}
              style={{
                position: "fixed",
                right: "2rem",
                top: "50%",
                transform: "translateY(-50%)",
                width: "48px",
                height: "48px",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "50%",
                color: "#fff",
                fontFamily: "var(--font-mono)",
                fontSize: "1.2rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.18)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.08)";
              }}
            >
              →
            </button>
          )}

          {/* Close button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIdx(null);
            }}
            style={{
              position: "fixed",
              top: "20px",
              right: "24px",
              width: "40px",
              height: "40px",
              fontFamily: "var(--font-mono)",
              fontSize: "1.2rem",
              color: "#fff",
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Admin Panel Toggle (gear icon) ── */}
      <button
        onClick={() => setAdminOpen((prev) => !prev)}
        style={{
          position: "absolute",
          bottom: "20px",
          right: "20px",
          width: "32px",
          height: "32px",
          background: "none",
          border: "none",
          cursor: "pointer",
          opacity: adminOpen ? 1 : 0.25,
          fontSize: "1.2rem",
          color: "#fff",
          zIndex: 200,
          pointerEvents: "auto",
          transition: "opacity 0.3s",
        }}
      >
        ⚙
      </button>

      {/* ── Admin Panel ── */}
      <div
        ref={adminPanelRef}
        style={{
          position: "fixed",
          right: 0,
          top: 0,
          width: "380px",
          height: "100vh",
          background: "rgba(6,8,16,0.94)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderLeft: "1px solid rgba(255,255,255,0.10)",
          boxShadow: "-20px 0 60px rgba(0,0,0,0.5)",
          zIndex: 200,
          pointerEvents: "auto",
          padding: "2rem",
          display: "flex",
          flexDirection: "column" as const,
          gap: "14px",
          overflowY: "auto" as const,
          transform: "translateX(380px)",
        }}
      >
        {/* Header */}
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.7rem",
            letterSpacing: "0.3em",
            color: "rgba(255,255,255,0.4)",
            marginBottom: "0.5rem",
          }}
        >
          ADMIN
        </div>

        {/* Upload zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          style={{
            border: "2px dashed rgba(100,160,255,0.3)",
            borderRadius: "10px",
            height: "120px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            position: "relative",
            overflow: "hidden",
          }}
          onClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "image/jpeg,image/png,image/webp";
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) {
                setUploadFile(file);
                const reader = new FileReader();
                reader.onload = (ev) =>
                  setUploadPreview(ev.target?.result as string);
                reader.readAsDataURL(file);
              }
            };
            input.click();
          }}
        >
          {uploadPreview ? (
            <img
              src={uploadPreview}
              alt="Upload preview"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "8px",
              }}
            />
          ) : (
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.7rem",
                color: "rgba(255,255,255,0.4)",
                textAlign: "center" as const,
                padding: "0 20px",
              }}
            >
              Drop photo here or click to browse
            </span>
          )}
        </div>

        {/* Country select */}
        <label style={labelStyle}>Country</label>
        <select style={inputStyle} disabled>
          <option>India</option>
        </select>

        {/* City input with datalist */}
        <label style={labelStyle}>City</label>
        <input
          type="text"
          value={uploadCity}
          onChange={(e) => setUploadCity(e.target.value)}
          list="city-suggestions"
          placeholder="Enter city..."
          style={inputStyle}
        />
        <datalist id="city-suggestions">
          {INDIA_PINS.map((p) => (
            <option key={p.id} value={p.city} />
          ))}
        </datalist>

        {/* Lat/Lng (read-only if matched, editable if custom) */}
        {uploadCity &&
          !INDIA_PINS.find(
            (p) => p.city.toLowerCase() === uploadCity.toLowerCase()
          ) && (
            <>
              <label style={labelStyle}>Latitude</label>
              <input
                type="number"
                value={uploadLat}
                onChange={(e) => setUploadLat(e.target.value)}
                placeholder="e.g. 20.5937"
                style={inputStyle}
              />
              <label style={labelStyle}>Longitude</label>
              <input
                type="number"
                value={uploadLng}
                onChange={(e) => setUploadLng(e.target.value)}
                placeholder="e.g. 78.9629"
                style={inputStyle}
              />
            </>
          )}

        {/* Caption */}
        <label style={labelStyle}>Caption</label>
        <div style={{ position: "relative" }}>
          <textarea
            value={uploadCaption}
            onChange={(e) =>
              setUploadCaption(e.target.value.slice(0, 120))
            }
            maxLength={120}
            rows={3}
            placeholder="A brief poetic caption..."
            style={{ ...inputStyle, resize: "vertical" as const }}
          />
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.6rem",
              color: "rgba(255,255,255,0.3)",
              textAlign: "right" as const,
              marginTop: "2px",
            }}
          >
            {uploadCaption.length}/120
          </div>
        </div>

        {/* Submit button */}
        <button
          onClick={handleAdminSubmit}
          style={{
            background:
              "linear-gradient(135deg, rgba(60,100,200,0.8), rgba(40,70,160,0.8))",
            border: "1px solid rgba(100,160,255,0.3)",
            borderRadius: "8px",
            padding: "12px",
            width: "100%",
            fontFamily: "var(--font-sans)",
            fontSize: "0.8rem",
            letterSpacing: "0.15em",
            textTransform: "uppercase" as const,
            color: "white",
            cursor: "pointer",
            transition: "filter 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.filter = "brightness(1.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.filter = "brightness(1)";
          }}
        >
          ADD TO GLOBE
        </button>

        {/* Close admin */}
        <button
          onClick={() => setAdminOpen(false)}
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            background: "none",
            border: "none",
            color: "#fff",
            cursor: "pointer",
            fontSize: "1.2rem",
            opacity: 0.5,
          }}
        >
          ✕
        </button>
      </div>

      {/* ── Success Toast ── */}
      {toastVisible && (
        <div
          style={{
            position: "fixed",
            bottom: "3rem",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(40,100,200,0.9)",
            backdropFilter: "blur(12px)",
            padding: "12px 28px",
            borderRadius: "10px",
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
            letterSpacing: "0.1em",
            color: "#fff",
            zIndex: 300,
            pointerEvents: "none",
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          }}
        >
          Pin added to globe ✓
        </div>
      )}
    </div>
  );
}

/* ─── Shared styles ─── */
const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "0.65rem",
  letterSpacing: "0.15em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.5)",
};

const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "8px",
  padding: "10px 14px",
  color: "white",
  fontFamily: "var(--font-sans)",
  fontSize: "0.85rem",
  width: "100%",
  outline: "none",
};
