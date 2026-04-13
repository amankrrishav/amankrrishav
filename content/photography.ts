// ─── content/photography.ts ──────────────────────
// Photography pin data with PhotoItem + PhotoPin interfaces

import * as THREE from "three";

export interface PhotoItem {
  url: string;
  orientation: "portrait" | "landscape";
  label: string;
}

export interface PhotoPin {
  id: string;
  city: string;
  lat: number;
  lng: number;
  photos: PhotoItem[];
  caption: string;
}

/**
 * Convert latitude/longitude to a THREE.Vector3 on a sphere of given radius.
 * Uses geographic convention: lat is north-positive, lng is east-positive.
 */
export function latLngToVec3(
  lat: number,
  lng: number,
  radius: number
): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -Math.sin(phi) * Math.cos(theta),
    Math.cos(phi),
    Math.sin(phi) * Math.sin(theta)
  ).multiplyScalar(radius);
}

export const INDIA_PINS: PhotoPin[] = [
  {
    id: "mumbai",
    city: "Mumbai",
    lat: 19.076,
    lng: 72.8777,
    caption: "The city that never sleeps",
    photos: [
      { url: "https://picsum.photos/seed/10/600/800", orientation: "portrait", label: "Golden Hour, Gateway" },
      { url: "https://picsum.photos/seed/11/800/600", orientation: "landscape", label: "Marine Drive at Dusk" },
      { url: "https://picsum.photos/seed/12/600/800", orientation: "portrait", label: "Monsoon Chai Stall" },
      { url: "https://picsum.photos/seed/13/800/600", orientation: "landscape", label: "Local Train Blur" },
    ],
  },
  {
    id: "delhi",
    city: "Delhi",
    lat: 28.6139,
    lng: 77.209,
    caption: "Old meets new in every frame",
    photos: [
      { url: "https://picsum.photos/seed/20/600/800", orientation: "portrait", label: "Humayun's Symmetry" },
      { url: "https://picsum.photos/seed/21/800/600", orientation: "landscape", label: "Chandni Chowk Rush" },
      { url: "https://picsum.photos/seed/22/600/800", orientation: "portrait", label: "Qutub Minar Vertigo" },
    ],
  },
  {
    id: "varanasi",
    city: "Varanasi",
    lat: 25.3176,
    lng: 83.0063,
    caption: "Where time dissolves into the Ganges",
    photos: [
      { url: "https://picsum.photos/seed/30/600/800", orientation: "portrait", label: "Morning Aarti Glow" },
      { url: "https://picsum.photos/seed/31/800/600", orientation: "landscape", label: "Ghat Reflections" },
      { url: "https://picsum.photos/seed/32/600/800", orientation: "portrait", label: "Silk Weaver's Hands" },
      { url: "https://picsum.photos/seed/33/800/600", orientation: "landscape", label: "Dusk on the Ganges" },
      { url: "https://picsum.photos/seed/34/600/800", orientation: "portrait", label: "Temple Bell Resonance" },
    ],
  },
  {
    id: "jaipur",
    city: "Jaipur",
    lat: 26.9124,
    lng: 75.7873,
    caption: "Pink walls, golden light",
    photos: [
      { url: "https://picsum.photos/seed/40/600/800", orientation: "portrait", label: "Hawa Mahal Lattice" },
      { url: "https://picsum.photos/seed/41/800/600", orientation: "landscape", label: "Palace Courtyard Dusk" },
      { url: "https://picsum.photos/seed/42/600/800", orientation: "portrait", label: "Block Print Workshop" },
      { url: "https://picsum.photos/seed/43/800/600", orientation: "landscape", label: "Amber Fort Panorama" },
    ],
  },
  {
    id: "kerala",
    city: "Kerala Backwaters",
    lat: 9.4981,
    lng: 76.9993,
    caption: "Still water, loud silence",
    photos: [
      { url: "https://picsum.photos/seed/50/600/800", orientation: "portrait", label: "Houseboat Dawn" },
      { url: "https://picsum.photos/seed/51/800/600", orientation: "landscape", label: "Palm Canopy Mirror" },
      { url: "https://picsum.photos/seed/52/600/800", orientation: "portrait", label: "Fisherman's Net Cast" },
      { url: "https://picsum.photos/seed/53/800/600", orientation: "landscape", label: "Monsoon Paddy Green" },
      { url: "https://picsum.photos/seed/54/600/800", orientation: "portrait", label: "Kathakali Eyes" },
      { url: "https://picsum.photos/seed/55/800/600", orientation: "landscape", label: "Sunset Over Cochin" },
    ],
  },
  {
    id: "ladakh",
    city: "Ladakh",
    lat: 34.1526,
    lng: 77.5771,
    caption: "Earth\u2019s rooftop, wide open",
    photos: [
      { url: "https://picsum.photos/seed/60/600/800", orientation: "portrait", label: "Pangong Blue Silence" },
      { url: "https://picsum.photos/seed/61/800/600", orientation: "landscape", label: "Khardung La Pass" },
      { url: "https://picsum.photos/seed/62/600/800", orientation: "portrait", label: "Prayer Flags Dancing" },
      { url: "https://picsum.photos/seed/63/800/600", orientation: "landscape", label: "Monastery Morning" },
      { url: "https://picsum.photos/seed/64/600/800", orientation: "portrait", label: "Nubra Valley Dunes" },
    ],
  },
  {
    id: "hampi",
    city: "Hampi",
    lat: 15.335,
    lng: 76.46,
    caption: "Ruins that refuse to be forgotten",
    photos: [
      { url: "https://picsum.photos/seed/70/600/800", orientation: "portrait", label: "Stone Chariot Sunrise" },
      { url: "https://picsum.photos/seed/71/800/600", orientation: "landscape", label: "Boulder Landscape" },
      { url: "https://picsum.photos/seed/72/600/800", orientation: "portrait", label: "Temple Corridor Light" },
      { url: "https://picsum.photos/seed/73/800/600", orientation: "landscape", label: "Tungabhadra Coracle" },
    ],
  },
  {
    id: "kutch",
    city: "Rann of Kutch",
    lat: 23.7337,
    lng: 69.8597,
    caption: "White desert, infinite horizon",
    photos: [
      { url: "https://picsum.photos/seed/80/800/600", orientation: "landscape", label: "White Salt Flats" },
      { url: "https://picsum.photos/seed/81/600/800", orientation: "portrait", label: "Full Moon on Salt" },
      { url: "https://picsum.photos/seed/82/800/600", orientation: "landscape", label: "Desert Nomad Trail" },
    ],
  },
  {
    id: "darjeeling",
    city: "Darjeeling",
    lat: 27.041,
    lng: 88.2663,
    caption: "Tea gardens above the clouds",
    photos: [
      { url: "https://picsum.photos/seed/90/600/800", orientation: "portrait", label: "Kanchenjunga Dawn" },
      { url: "https://picsum.photos/seed/91/800/600", orientation: "landscape", label: "Toy Train Window" },
      { url: "https://picsum.photos/seed/92/600/800", orientation: "portrait", label: "Tea Leaf Close-up" },
      { url: "https://picsum.photos/seed/93/800/600", orientation: "landscape", label: "Misty Plantation Walk" },
    ],
  },
  {
    id: "pondicherry",
    city: "Pondicherry",
    lat: 11.9416,
    lng: 79.8083,
    caption: "French doors, Tamil soul",
    photos: [
      { url: "https://picsum.photos/seed/100/600/800", orientation: "portrait", label: "Bougainvillea Doorway" },
      { url: "https://picsum.photos/seed/101/800/600", orientation: "landscape", label: "Promenade at Sunrise" },
      { url: "https://picsum.photos/seed/102/600/800", orientation: "portrait", label: "Auroville Meditation" },
    ],
  },
];
