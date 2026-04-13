import { create } from "zustand";
import type { PhotoPin } from "@/content/photography";

interface StarScreenPos {
  x: number;
  y: number;
  visible: boolean;
}

interface PinScreenPos {
  x: number;
  y: number;
  visible: boolean;
}

interface UniverseState {
  /** Scroll progress from 0 (top) to 1 (bottom) */
  scrollProgress: number;

  /** Whether the boot sequence has completed */
  bootComplete: boolean;

  /** Currently active section name */
  activeSection: string;

  /** Lenis instance reference for start/stop control */
  lenisRef: { stop: () => void; start: () => void } | null;

  /** Whether skills section controls the camera */
  skillsSectionActive: boolean;

  /** Whether timeline section controls the camera */
  timelineSectionActive: boolean;

  /** Currently hovered star id (null = none) */
  hoveredStarId: string | null;

  /** Screen-space positions of all timeline stars (projected from 3D) */
  starScreenPositions: Record<string, StarScreenPos>;

  /** Set of star IDs currently illuminated by scroll progress */
  illuminatedStarIds: Set<string>;

  /** Whether passions section controls the camera */
  passionsSectionActive: boolean;

  /** Currently active phenomenon index (0–5) */
  activePhenomenonIdx: number;

  /** Photography section state */
  photographyActive: boolean;
  photographyDiveActive: boolean;
  photographyGalleryOpen: boolean;
  diveReversing: boolean;
  activePinId: string | null;
  hoveredPinId: string | null;
  dynamicPins: PhotoPin[];
  warpIntensity: number;
  pinScreenPositions: Record<string, PinScreenPos>;
  displayCoords: { lat: number; lng: number };

  // Actions
  setScrollProgress: (progress: number) => void;
  setBootComplete: (complete: boolean) => void;
  setActiveSection: (section: string) => void;
  setLenisRef: (lenis: { stop: () => void; start: () => void } | null) => void;
  setSkillsSectionActive: (active: boolean) => void;
  setTimelineSectionActive: (active: boolean) => void;
  setHoveredStarId: (id: string | null) => void;
  setStarScreenPos: (id: string, pos: StarScreenPos) => void;
  setBatchStarScreenPos: (positions: Record<string, StarScreenPos>) => void;
  setIlluminatedStarIds: (ids: Set<string>) => void;
  setPassionsSectionActive: (active: boolean) => void;
  setActivePhenomenonIdx: (idx: number) => void;
  setPhotographyActive: (active: boolean) => void;
  setPhotographyDiveActive: (active: boolean) => void;
  setPhotographyGalleryOpen: (open: boolean) => void;
  setDiveReversing: (reversing: boolean) => void;
  setActivePinId: (id: string | null) => void;
  setHoveredPinId: (id: string | null) => void;
  addPhotographyPin: (pin: PhotoPin) => void;
  setWarpIntensity: (v: number) => void;
  setPinScreenPositions: (positions: Record<string, PinScreenPos>) => void;
  setDisplayCoords: (coords: { lat: number; lng: number }) => void;
}

export const useUniverse = create<UniverseState>((set) => ({
  scrollProgress: 0,
  bootComplete: false,
  activeSection: "hero",
  lenisRef: null,
  skillsSectionActive: false,
  timelineSectionActive: false,
  hoveredStarId: null,
  starScreenPositions: {},
  illuminatedStarIds: new Set<string>(),
  passionsSectionActive: false,
  activePhenomenonIdx: 0,
  photographyActive: false,
  photographyDiveActive: false,
  photographyGalleryOpen: false,
  diveReversing: false,
  activePinId: null,
  hoveredPinId: null,
  dynamicPins: [],
  warpIntensity: 0,
  pinScreenPositions: {},
  displayCoords: { lat: 12.9716, lng: 77.5946 },

  setScrollProgress: (progress) => set({ scrollProgress: progress }),
  setBootComplete: (complete) => set({ bootComplete: complete }),
  setActiveSection: (section) => set({ activeSection: section }),
  setLenisRef: (lenis) => set({ lenisRef: lenis }),
  setSkillsSectionActive: (active) => set({ skillsSectionActive: active }),
  setTimelineSectionActive: (active) => set({ timelineSectionActive: active }),
  setHoveredStarId: (id) => set({ hoveredStarId: id }),
  setStarScreenPos: (id, pos) =>
    set((state) => ({
      starScreenPositions: { ...state.starScreenPositions, [id]: pos },
    })),
  setBatchStarScreenPos: (positions) =>
    set({ starScreenPositions: positions }),
  setIlluminatedStarIds: (ids) => set({ illuminatedStarIds: ids }),
  setPassionsSectionActive: (active) => set({ passionsSectionActive: active }),
  setActivePhenomenonIdx: (idx) => set({ activePhenomenonIdx: idx }),
  setPhotographyActive: (active) => set({ photographyActive: active }),
  setPhotographyDiveActive: (active) => set({ photographyDiveActive: active }),
  setPhotographyGalleryOpen: (open) => set({ photographyGalleryOpen: open }),
  setDiveReversing: (reversing) => set({ diveReversing: reversing }),
  setActivePinId: (id) => set({ activePinId: id }),
  setHoveredPinId: (id) => set({ hoveredPinId: id }),
  addPhotographyPin: (pin) =>
    set((state) => ({ dynamicPins: [...state.dynamicPins, pin] })),
  setWarpIntensity: (v) => set({ warpIntensity: v }),
  setPinScreenPositions: (positions) =>
    set({ pinScreenPositions: positions }),
  setDisplayCoords: (coords) => set({ displayCoords: coords }),
}));
