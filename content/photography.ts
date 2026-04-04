// ─── SECTION BOUNDARY ──────────────────────
// content/photography.ts

export interface PhotoPin {
  id: string;
  city: string;
  lat: number;
  lng: number;
  photos: string[];
  caption: string;
}

export function latLngToVec3(lat: number, lng: number, radius: number): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return [
    -Math.sin(phi) * Math.cos(theta) * radius,
    Math.cos(phi) * radius,
    Math.sin(phi) * Math.sin(theta) * radius,
  ];
}

export const INDIA_PINS: PhotoPin[] = [
  { id: "mumbai", city: "Mumbai", lat: 19.076, lng: 72.8777, caption: "The city that never sleeps", photos: ["https://picsum.photos/seed/mumbai1/600/800","https://picsum.photos/seed/mumbai2/800/600","https://picsum.photos/seed/mumbai3/600/800","https://picsum.photos/seed/mumbai4/800/600"] },
  { id: "delhi", city: "Delhi", lat: 28.6139, lng: 77.209, caption: "Old meets new in every frame", photos: ["https://picsum.photos/seed/delhi1/600/800","https://picsum.photos/seed/delhi2/800/600","https://picsum.photos/seed/delhi3/600/800"] },
  { id: "varanasi", city: "Varanasi", lat: 25.3176, lng: 83.0063, caption: "Where time dissolves into the Ganges", photos: ["https://picsum.photos/seed/varanasi1/600/800","https://picsum.photos/seed/varanasi2/800/600","https://picsum.photos/seed/varanasi3/600/800","https://picsum.photos/seed/varanasi4/800/600","https://picsum.photos/seed/varanasi5/600/800"] },
  { id: "jaipur", city: "Jaipur", lat: 26.9124, lng: 75.7873, caption: "Pink walls, golden light", photos: ["https://picsum.photos/seed/jaipur1/600/800","https://picsum.photos/seed/jaipur2/800/600","https://picsum.photos/seed/jaipur3/600/800","https://picsum.photos/seed/jaipur4/800/600"] },
  { id: "kerala", city: "Kerala Backwaters", lat: 9.4981, lng: 76.9993, caption: "Still water, loud silence", photos: ["https://picsum.photos/seed/kerala1/600/800","https://picsum.photos/seed/kerala2/800/600","https://picsum.photos/seed/kerala3/600/800","https://picsum.photos/seed/kerala4/800/600","https://picsum.photos/seed/kerala5/600/800","https://picsum.photos/seed/kerala6/800/600"] },
  { id: "ladakh", city: "Ladakh", lat: 34.1526, lng: 77.5771, caption: "Earth\u2019s rooftop, wide open", photos: ["https://picsum.photos/seed/ladakh1/600/800","https://picsum.photos/seed/ladakh2/800/600","https://picsum.photos/seed/ladakh3/600/800","https://picsum.photos/seed/ladakh4/800/600","https://picsum.photos/seed/ladakh5/600/800"] },
  { id: "hampi", city: "Hampi", lat: 15.335, lng: 76.46, caption: "Ruins that refuse to be forgotten", photos: ["https://picsum.photos/seed/hampi1/600/800","https://picsum.photos/seed/hampi2/800/600","https://picsum.photos/seed/hampi3/600/800","https://picsum.photos/seed/hampi4/800/600"] },
  { id: "kutch", city: "Rann of Kutch", lat: 23.7337, lng: 69.8597, caption: "White desert, infinite horizon", photos: ["https://picsum.photos/seed/kutch1/800/600","https://picsum.photos/seed/kutch2/600/800","https://picsum.photos/seed/kutch3/800/600"] },
  { id: "darjeeling", city: "Darjeeling", lat: 27.041, lng: 88.2663, caption: "Tea gardens above the clouds", photos: ["https://picsum.photos/seed/darjeeling1/600/800","https://picsum.photos/seed/darjeeling2/800/600","https://picsum.photos/seed/darjeeling3/600/800","https://picsum.photos/seed/darjeeling4/800/600"] },
  { id: "pondicherry", city: "Pondicherry", lat: 11.9416, lng: 79.8083, caption: "French doors, Tamil soul", photos: ["https://picsum.photos/seed/pondy1/600/800","https://picsum.photos/seed/pondy2/800/600","https://picsum.photos/seed/pondy3/600/800"] },
];
