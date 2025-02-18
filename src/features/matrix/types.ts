export interface MatrixConfig {
  // Terminal dimensions
  columns: number;
  rows: number;
  
  // Animation settings
  animationSpeed: number;  // Base animation speed multiplier
  fallSpeed: number;       // Speed of falling characters
  cycleSpeed: number;     // How fast characters change
  density: number;        // Density of raindrops (0-1)
  
  // Visual settings
  glowIntensity: number;  // Brightness of the glow effect (0-1)
  maxRows: number;        // Maximum rows to render (for partial screen effect)
}

export interface Raindrop {
  column: number;        // Column position
  length: number;        // Length of the raindrop
  speed: number;        // Individual fall speed
  head: number;         // Current head position
  glowPosition: number; // Position of brightest character
  active: boolean;      // Whether this raindrop is currently active
  brightnesses: number[]; // Pre-calculated brightness values for the trail
}

// Default configuration values
export const DEFAULT_CONFIG: MatrixConfig = {
  columns: 80,          // Default terminal width
  rows: 24,            // Default terminal height
  animationSpeed: 0.2,  // Significantly slower default speed
  fallSpeed: 0.3,      // Slower fall speed
  cycleSpeed: 0.2,     // Slower character cycling
  density: 0.1,        // Lower density for clearer effect
  glowIntensity: 1.0,  // Full glow intensity for better visibility
  maxRows: 12          // Only use top half of screen
};

// Matrix characters pool (mix of katakana and special characters)
export const MATRIX_CHARS = [
  'ｱ', 'ｲ', 'ｳ', 'ｴ', 'ｵ', 'ｶ', 'ｷ', 'ｸ', 'ｹ', 'ｺ',
  'ｻ', 'ｼ', 'ｽ', 'ｾ', 'ｿ', 'ﾀ', 'ﾁ', 'ﾂ', 'ﾃ', 'ﾄ',
  'ﾅ', 'ﾆ', 'ﾇ', 'ﾈ', 'ﾉ', 'ﾊ', 'ﾋ', 'ﾌ', 'ﾍ', 'ﾎ',
  'ﾏ', 'ﾐ', 'ﾑ', 'ﾒ', 'ﾓ', 'ﾔ', 'ﾕ', 'ﾖ', 'ﾗ', 'ﾘ',
  'ﾙ', 'ﾚ', 'ﾛ', 'ﾜ', 'ﾝ', '0', '1', '2', '3', '4',
  '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E',
  'F', '$', '+', '-', '*', '/', '=', '%', '#', '@'
];