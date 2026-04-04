/**
 * Skills — Solar System data.
 *
 * 3 planets, each with skills as orbiting moons.
 * Moon SIZE = proficiency level.
 *
 * Synthar  → Technical  ("synthesis of thought")  → Gas giant, deep blue + lime veins
 * Chromara → Creative   ("color of the soul")     → Ringed, violet/magenta atmosphere
 * Velocis  → Physical   ("velocity of the body")  → Rocky Mars-like, coral/red
 */

export interface SkillMoon {
  name: string;
  proficiency: number; // out of 10
  description: string;
}

export interface PlanetData {
  id: string;
  planetName: string;
  meaning: string;
  domain: string;
  color: string;          // primary surface color
  secondaryColor: string; // accent (veins, atmosphere, etc.)
  emissive: string;
  radius: number;
  orbitRadius: number;    // distance from central light
  orbitSpeed: number;     // radians/sec
  skills: SkillMoon[];
}

export const planets: PlanetData[] = [
  {
    id: "synthar",
    planetName: "Synthar",
    meaning: "Synthesis of Thought",
    domain: "Technical",
    color: "#0A2463",       // deep navy blue
    secondaryColor: "#C8FF00", // lime electric veins
    emissive: "#041030",
    radius: 2.0,
    orbitRadius: 6,
    orbitSpeed: 0.06,
    skills: [
      { name: "Python", proficiency: 8, description: "FastAPI, async, typing, decorators" },
      { name: "C++", proficiency: 7, description: "STL, memory mgmt, competitive" },
      { name: "DSA", proficiency: 7, description: "Trees, graphs, DP, greedy" },
      { name: "Git / GitHub", proficiency: 7, description: "Branching, PRs, CI/CD" },
      { name: "SQL", proficiency: 6.5, description: "Joins, indexing, optimization" },
      { name: "ML", proficiency: 5.5, description: "Scikit, pandas, basics of TF" },
      { name: "PostgreSQL", proficiency: 5, description: "Migrations, functions, indexing" },
      { name: "LLM / GenAI", proficiency: 5, description: "API integration, prompt engineering" },
      { name: "Linux / CLI", proficiency: 4.5, description: "Bash, ssh, vim, cron" },
      { name: "System Design", proficiency: 4.5, description: "Load balancing, caching, queues" },
      { name: "FastAPI", proficiency: 4, description: "REST, middleware, auth" },
      { name: "Docker", proficiency: 2, description: "Compose, multi-stage builds" },
    ],
  },
  {
    id: "chromara",
    planetName: "Chromara",
    meaning: "Color of the Soul",
    domain: "Creative",
    color: "#6B21A8",       // deep violet
    secondaryColor: "#E879F9", // magenta atmosphere
    emissive: "#2E0854",
    radius: 1.6,
    orbitRadius: 12,
    orbitSpeed: 0.04,
    skills: [
      { name: "Photography", proficiency: 7, description: "Composition, light, editing" },
      { name: "Film Knowledge", proficiency: 7, description: "Cinematography, direction, analysis" },
      { name: "Art / Illustration", proficiency: 6, description: "Sketching, digital art, color theory" },
    ],
  },
  {
    id: "velocis",
    planetName: "Velocis",
    meaning: "Velocity of the Body",
    domain: "Physical",
    color: "#BF360C",       // deep coral/burnt
    secondaryColor: "#FF6B35", // fiery orange
    emissive: "#4A1400",
    radius: 1.3,
    orbitRadius: 18,
    orbitSpeed: 0.03,
    skills: [
      { name: "Field Hockey", proficiency: 7, description: "Midfield, stamina, team play" },
      { name: "Athletics", proficiency: 6.5, description: "Sprint, endurance, track" },
      { name: "Football", proficiency: 5, description: "Casual, right wing, free kicks" },
    ],
  },
];
