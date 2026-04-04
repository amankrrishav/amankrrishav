export interface Passion {
  id: string;
  name: string;
  phenomenon: string;
  phenomenonType:
    | "pulsar"
    | "blackhole"
    | "nebula"
    | "binarystar"
    | "supernova"
    | "wormhole";
  quote: string;
  accent: string;
  secondary: string;
  position: [number, number, number];
}

export const passions: Passion[] = [
  {
    id: "football",
    name: "Football / Barcelona",
    phenomenon: "Pulsar",
    phenomenonType: "pulsar",
    quote:
      "Barcelona isn\u2019t a team \u2014 it\u2019s a heartbeat. Every matchday is a pulse of energy I can\u2019t explain. Messi taught me that genius looks effortless, and losing taught me that faith is a choice.",
    accent: "#A50044",
    secondary: "#004D98",
    position: [-30, 8, -10],
  },
  {
    id: "movies",
    name: "Cinema",
    phenomenon: "Black Hole",
    phenomenonType: "blackhole",
    quote:
      "500+ films and counting. Nolan bends time, Kubrick breaks minds, Tarantino rewrites history. Cinema is the closest thing to dreaming while awake.",
    accent: "#111111",
    secondary: "#ff6600",
    position: [25, -5, -15],
  },
  {
    id: "photography",
    name: "Photography",
    phenomenon: "Nebula",
    phenomenonType: "nebula",
    quote:
      "Freezing moments that felt real. Street corners, golden hours, faces that tell stories. Still figuring out what my eye sees that others miss \u2014 but I keep shooting.",
    accent: "#cc44ff",
    secondary: "#ff44aa",
    position: [-20, -12, -5],
  },
  {
    id: "finance",
    name: "Finance",
    phenomenon: "Binary Star",
    phenomenonType: "binarystar",
    quote:
      "Started at 19 with zero knowledge and a Zerodha account. Now I read balance sheets for fun. Indian equities, US markets, long-term compounding.",
    accent: "#C8FF00",
    secondary: "#00C8C8",
    position: [32, 15, -8],
  },
  {
    id: "art",
    name: "Art & Drawing",
    phenomenon: "Supernova",
    phenomenonType: "supernova",
    quote:
      "Drew my first picture before I could write. 10+ years of sketches, portraits, abstracts. Art is what happens when words aren\u2019t enough.",
    accent: "#ff6633",
    secondary: "#ffcc00",
    position: [-8, 18, -20],
  },
  {
    id: "travel",
    name: "Travel",
    phenomenon: "Wormhole",
    phenomenonType: "wormhole",
    quote:
      "Not a tourist \u2014 a curious person with a camera and no plan. Every new place rewires how I see the world.",
    accent: "#00ffcc",
    secondary: "#0066ff",
    position: [10, -18, -12],
  },
];
