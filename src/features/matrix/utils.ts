import { MATRIX_CHARS } from './types';

/**
 * Character cycling and glyph management utilities for the Matrix rain effect
 */

// xterm-256 color codes for matrix effect
const GREEN_COLORS = [
  22,  // Darkest green
  28,  // Dark green
  34,  // Medium green
  40,  // Bright green
  46,  // Brightest green
  231  // White (for highest brightness)
];

/**
 * Get a matrix color code based on brightness
 */
export function getMatrixColor(brightness: number): string {
  // Map brightness to color index
  const index = Math.min(
    GREEN_COLORS.length - 1,
    Math.floor(brightness * (GREEN_COLORS.length - 1))
  );
  return `[38;5;${GREEN_COLORS[index]}m`;
}

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
 * Generate brightness values for a raindrop trail
 * Creates a smooth gradient from head to tail
 */
export function generateBrightnessGradient(length: number): number[] {
  return new Array(length).fill(0).map((_, i) => {
    // Use cubic easing for smoother gradient
    const t = i / (length - 1);
    return Math.pow(1 - t, 3);
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
 * Create cursor movement sequence
 */
export function createCursorMovement(row: number, col: number): string {
  return `[${row + 1};${col + 1}H`;
}

/**
 * Reset color attributes
 */
export function resetColor(): string {
  return '[0m';
}

/**
 * Clamp a number between a minimum and maximum value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}