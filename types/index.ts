/* ─── Section Registry ─── */
export interface SectionConfig {
  id: string;
  name: string;
  scrollStart: number; // 0–1 normalized
  scrollEnd: number;   // 0–1 normalized
  order: number;
}

/* ─── Boot Sequence ─── */
export interface BootLine {
  text: string;
  delay: number;      // delay before this line starts (seconds)
  duration: number;   // how long the typing takes (seconds)
  className?: string; // extra CSS classes
}

/* ─── Skills ─── */
export interface Skill {
  name: string;
  proficiency: number; // 0–10
  description?: string;
}

export interface SkillCategory {
  id: string;
  name: string;
  planetName: string;
  skills: Skill[];
}

/* ─── Timeline ─── */
export interface TimelineEntry {
  id: string;
  period: string;
  title: string;
  description: string;
  type: "education" | "career" | "hobby" | "achievement" | "personal";
  accent: string;
  current: boolean;
  order: number;
}

/* ─── Passions ─── */
export interface Passion {
  id: string;
  name: string;
  phenomenon: string;
  description: string;
  accent: string;
}

/* ─── Projects ─── */
export interface Project {
  id: string;
  name: string;
  description: string;
  techStack: string[];
  status: "deployed" | "in-progress" | "idea";
  githubUrl?: string;
  deployedUrl?: string;
  image?: string;
}

/* ─── Blog ─── */
export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  date: string;
  content?: string;
}

/* ─── Contact ─── */
export interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

/* ─── Camera Waypoint ─── */
export interface CameraWaypoint {
  position: [number, number, number];
  lookAt: [number, number, number];
  section: string;
}
