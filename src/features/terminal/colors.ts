/**
 * Terminal color handling utilities
 * Based on ANSI SGR (Select Graphic Rendition) escape sequences
 */

const ESC = '\x1b';
const CSI = `${ESC}[`;

export const SGR = {
  // Reset
  reset: `${CSI}0m`,

  // Text effects
  bold: `${CSI}1m`,
  dim: `${CSI}2m`,
  italic: `${CSI}3m`,
  underline: `${CSI}4m`,
  blink: `${CSI}5m`,
  inverse: `${CSI}7m`,
  hidden: `${CSI}8m`,
  strikethrough: `${CSI}9m`,

  // Foreground colors
  black: `${CSI}30m`,
  red: `${CSI}31m`,
  green: `${CSI}32m`,
  yellow: `${CSI}33m`,
  blue: `${CSI}34m`,
  magenta: `${CSI}35m`,
  cyan: `${CSI}36m`,
  white: `${CSI}37m`,

  // Background colors
  bgBlack: `${CSI}40m`,
  bgRed: `${CSI}41m`,
  bgGreen: `${CSI}42m`,
  bgYellow: `${CSI}43m`,
  bgBlue: `${CSI}44m`,
  bgMagenta: `${CSI}45m`,
  bgCyan: `${CSI}46m`,
  bgWhite: `${CSI}47m`,

  // Bright foreground colors
  brightBlack: `${CSI}90m`,
  brightRed: `${CSI}91m`,
  brightGreen: `${CSI}92m`,
  brightYellow: `${CSI}93m`,
  brightBlue: `${CSI}94m`,
  brightMagenta: `${CSI}95m`,
  brightCyan: `${CSI}96m`,
  brightWhite: `${CSI}97m`,

  // Bright background colors
  bgBrightBlack: `${CSI}100m`,
  bgBrightRed: `${CSI}101m`,
  bgBrightGreen: `${CSI}102m`,
  bgBrightYellow: `${CSI}103m`,
  bgBrightBlue: `${CSI}104m`,
  bgBrightMagenta: `${CSI}105m`,
  bgBrightCyan: `${CSI}106m`,
  bgBrightWhite: `${CSI}107m`,
};

/**
 * Helper class to manage terminal colors and text effects
 */
export class ColorManager {
  /**
   * Wrap text with color/effect and reset
   */
  static wrap(text: string, ...effects: string[]): string {
    return `${effects.join('')}${text}${SGR.reset}`;
  }

  /**
   * Create text with foreground color
   */
  static fg(text: string, color: keyof typeof SGR): string {
    return this.wrap(text, SGR[color]);
  }

  /**
   * Create text with background color
   */
  static bg(text: string, color: keyof typeof SGR): string {
    return this.wrap(text, SGR[color]);
  }

  /**
   * Create text with multiple effects
   */
  static style(text: string, effects: (keyof typeof SGR)[]): string {
    return this.wrap(text, ...effects.map(e => SGR[e]));
  }

  /**
   * Create styled progress bar
   */
  static progress(percent: number, width: number = 20): string {
    const filled = Math.floor(width * (percent / 100));
    const empty = width - filled;

    return this.style(
      '[' +
      '='.repeat(filled) +
      ' '.repeat(empty) +
      ']' +
      ` ${percent}%`,
      ['brightGreen', 'bold']
    );
  }

  /**
   * Create error text
   */
  static error(text: string): string {
    return this.style(text, ['brightRed', 'bold']);
  }

  /**
   * Create success text
   */
  static success(text: string): string {
    return this.style(text, ['brightGreen', 'bold']);
  }

  /**
   * Create warning text
   */
  static warning(text: string): string {
    return this.style(text, ['brightYellow', 'bold']);
  }

  /**
   * Create info text
   */
  static info(text: string): string {
    return this.style(text, ['brightCyan']);
  }
}