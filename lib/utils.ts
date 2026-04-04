import { type ClassValue, clsx } from "clsx";

// If clsx isn't installed, use a simple implementation
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Map a value from one range to another
 */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return outMin + ((value - inMin) * (outMax - outMin)) / (inMax - inMin);
}

/**
 * Check if scroll progress is within a section's range
 */
export function isInRange(progress: number, start: number, end: number): boolean {
  return progress >= start && progress <= end;
}

/**
 * Get section opacity based on scroll progress (fade in and out)
 */
export function getSectionOpacity(
  progress: number,
  start: number,
  end: number,
  fadeRange: number = 0.02
): number {
  if (progress < start || progress > end) return 0;
  
  // Fade in
  if (progress < start + fadeRange) {
    return (progress - start) / fadeRange;
  }
  
  // Fade out
  if (progress > end - fadeRange) {
    return (end - progress) / fadeRange;
  }
  
  return 1;
}
