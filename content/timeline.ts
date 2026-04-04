/**
 * Timeline — constellation data.
 * Each entry = a star in the constellation map.
 * 4 real entries + 20 empty placeholder stars.
 */

export interface TimelineEntry {
  id: string;
  period: string;
  title: string;
  description: string;
  type: "education" | "milestone" | "sport" | "creative" | "empty";
  accent: string;
  current: boolean;
  order: number;
}

export const timelineEntries: TimelineEntry[] = [
  {
    id: "btech-cse",
    period: "2024–Present",
    title: "BTech CSE · Data Science, Bengaluru",
    description:
      "Enrolled in Computer Science with a Data Science specialisation. Currently building systems from the ground up — FastAPI, C++, market psychology. The problems never run out.",
    type: "education",
    accent: "#C8FF00",
    current: true,
    order: 1,
  },
  {
    id: "first-investment",
    period: "Aug 2024",
    title: "First Investment — NSE, BSE, NASDAQ",
    description:
      "Moved from studying markets to participating in them. Started with Indian equities, expanded to tracking global indices. Fundamentals first, always.",
    type: "milestone",
    accent: "#00C8C8",
    current: false,
    order: 2,
  },
  {
    id: "discipline-years",
    period: "2016–2019",
    title: "Hockey, Football, Athletics — the discipline years",
    description:
      "Three sports simultaneously. Early mornings, coaches, competition. Learned that consistency is a skill before it became a philosophy.",
    type: "sport",
    accent: "#ff6633",
    current: false,
    order: 3,
  },
  {
    id: "art-and-drawing",
    period: "2010–2017",
    title: "Art & Drawing — where creativity began",
    description:
      "Seven years of sketching before ever touching a keyboard. Pattern recognition, patience, the habit of looking closely. Still pays dividends.",
    type: "creative",
    accent: "#cc44ff",
    current: false,
    order: 4,
  },
  ...Array.from({ length: 20 }, (_, i) => ({
    id: `empty-${i + 1}`,
    period: "",
    title: "",
    description: "",
    type: "empty" as const,
    accent: "#ffffff",
    current: false,
    order: 5 + i,
  })),
];
