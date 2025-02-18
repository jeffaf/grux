import { MATRIX_CHARS } from './types';

/**
 * Character cycling and glyph management utilities for the Matrix rain effect
 */

const ESC = '\x1b';

/**
 * Get a random character from the Matrix character set
 */
export function getRandomMatrixChar(): string {
  return MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
}

/**
 * Generate a sequence of n random Matrix characters
 */
export function generateMatrixSequence(length: number): string[] {
  return Array(length).fill(null).map(() => getRandomMatrixChar());
}

/**
 * Cycle a character to the next one in the sequence
 */
export function cycleCharacter(current: string): string {
  const currentIndex = MATRIX_CHARS.indexOf(current);
  if (currentIndex === -1) return getRandomMatrixChar();
  const nextIndex = (currentIndex + 1) % MATRIX_CHARS.length;
  return MATRIX_CHARS[nextIndex];
}

/**
 * Format a character with ANSI escape codes for color and brightness
 */
export function formatMatrixChar(
  char: string, 
  brightness: number,
  config: { glowIntensity: number }
): string {
  // Apply glow intensity to brightness
  const adjustedBrightness = brightness * config.glowIntensity;
  
  if (adjustedBrightness > 0.8) {
    // Bright white for highest intensity
    return `${ESC}[1;97m${char}${ESC}[0m`;
  } else if (adjustedBrightness > 0.6) {
    // Bright green for high intensity
    return `${ESC}[1;32m${char}${ESC}[0m`;
  } else if (adjustedBrightness > 0.3) {
    // Normal green for medium intensity
    return `${ESC}[32m${char}${ESC}[0m`;
  } else {
    // Dark green for low intensity
    return `${ESC}[38;5;22m${char}${ESC}[0m`;
  }
}

/**
 * Generate brightness values for a raindrop trail
 */
export function generateBrightnessGradient(length: number): number[] {
  return new Array(length).fill(0).map((_, i) => {
    return Math.pow(1 - (i / length), 2);
  });
}

/**
 * Calculate brightness for a specific position in the raindrop
 */
export function calculateBrightness(
  position: number,
  headPosition: number,
  length: number,
  brightnesses: number[]
): number {
  const positionInDrop = headPosition - position;
  if (positionInDrop < 0 || positionInDrop >= brightnesses.length) {
    return 0;
  }
  return brightnesses[positionInDrop];
}

/**
 * Create terminal cursor movement sequence
 */
export function createCursorMovement(row: number, col: number): string {
  return `${ESC}[${row + 1};${col + 1}H`;
}

/**
 * Create a smooth easing function for animations
 */
export function createEasing(start: number, end: number, steps: number): number[] {
  return new Array(steps).fill(0).map((_, i) => {
    const t = i / (steps - 1);
    return start + (end - start) * (1 - Math.pow(1 - t, 2));
  });
}