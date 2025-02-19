import { Terminal } from 'xterm';
import { MatrixConfig, Raindrop, DEFAULT_CONFIG, MATRIX_CHARS } from './types';
import { getRandomMatrixChar } from './utils';

// Maximum number of raindrops to render at once (for performance)
const MAX_RAINDROPS = 50;

export class MatrixRain {
  private config: MatrixConfig;
  private terminal: Terminal;
  private raindrops: Raindrop[];
  private animationFrameId: number | null = null;
  private lastFrameTime: number = 0;
  public isRunning: boolean = false;
  public reservedRows: number = 2; // Reserve bottom rows for prompt
  private maxRaindrops: number;

  // Control sequences with escape character
  private readonly ESC = '\x1b';
  private readonly CURSOR_POS_PREFIX = this.ESC + '[';
  private readonly COLOR_WHITE = this.ESC + '[97m';
  private readonly COLOR_BRIGHT_GREEN = this.ESC + '[92m';
  private readonly COLOR_GREEN = this.ESC + '[32m';
  private readonly COLOR_DARK_GREEN = this.ESC + '[38;5;22m';
  private readonly COLOR_RESET = this.ESC + '[0m';
  private readonly CLEAR_SCREEN = this.ESC + '[2J';
  private readonly CLEAR_SCROLLBACK = this.ESC + '[3J';
  private readonly HIDE_CURSOR = this.ESC + '[?25l';
  private readonly SHOW_CURSOR = this.ESC + '[?25h';

  constructor(terminal: Terminal, config: Partial<MatrixConfig> = {}) {
    console.warn('[MatrixRain] Initializing with config:', config);
    this.terminal = terminal;
    this.config = { 
      ...DEFAULT_CONFIG, 
      columns: terminal.cols || DEFAULT_CONFIG.columns,
      rows: (terminal.rows || DEFAULT_CONFIG.rows) - this.reservedRows,
      ...config 
    };
    console.warn('[MatrixRain] Final config:', this.config);
    this.raindrops = [];
    this.maxRaindrops = config.maxRaindrops || MAX_RAINDROPS;
  }

  private createRaindrop(): Raindrop {
    const column = Math.floor(Math.random() * this.config.columns);
    const length = Math.floor(Math.random() * 8) + 6; // Random length between 6-13
    const speed = (Math.random() * 0.4 + 0.2) * this.config.fallSpeed; // More consistent speeds

    // Use cubic easing for smoother gradient (matching utils.ts)
    const brightnesses = new Array(length).fill(0).map((_, i) => {
      const t = i / (length - 1);
      return Math.pow(1 - t, 3);
    });

    const raindrop = {
      column,
      length,
      speed,
      head: 0,
      glowPosition: 0,
      active: true,
      brightnesses
    };
    console.warn('[MatrixRain] Created new raindrop:', raindrop);
    return raindrop;
  }

  private updateRaindrops(deltaTime: number): void {
    // Add new raindrops based on density
    if (this.raindrops.length < this.maxRaindrops && Math.random() < this.config.density * deltaTime) {
      this.raindrops.push(this.createRaindrop());
      console.warn('[MatrixRain] Added new raindrop, total:', this.raindrops.length);
    }

    // Update existing raindrops
    this.raindrops = this.raindrops.filter(drop => {
      // Update drop position
      drop.head += drop.speed * this.config.animationSpeed * deltaTime;
      drop.glowPosition = Math.floor(drop.head);

      // Check if raindrop is still visible within the *available* rows
      if (drop.glowPosition - drop.length > this.config.rows) {
        console.warn('[MatrixRain] Removing raindrop at position:', drop.glowPosition);
        return false;
      }

      return true;
    });
  }

  private renderFrame(): void {
    if (!this.terminal) return;

    // Build the output string for the entire frame, row by row
    let output = '';

    // Iterate through the rows of the grid (excluding reserved rows)
    for (let y = 0; y < this.config.rows; y++) {
      // Move cursor to the beginning of the current row
      output += this.CURSOR_POS_PREFIX + `${y + 1};1H`;

      // Iterate through the columns of the current row
      for (let x = 0; x < this.config.columns; x++) {
        let char = ' '; // Default to a space
        let brightness = 0;

        // Find the raindrop that affects this cell, if any
        const drop = this.raindrops.find(d => x === d.column && y <= Math.floor(d.glowPosition) && y > Math.floor(d.glowPosition) - d.length);

        if (drop) {
          const positionInDrop = Math.floor(drop.glowPosition) - y;
          if (positionInDrop >= 0 && positionInDrop < drop.length) {
            char = getRandomMatrixChar(); // Get a random character
            brightness = drop.brightnesses[positionInDrop] * this.config.glowIntensity; // Get brightness
          }
        }
        output += this.renderCharacter(y, x, char, brightness); // Render the character with color
      }
      output += '\r\n';
    }

    // Write the complete frame to the terminal
    this.terminal.write(output);
  }

  private renderCharacter(row: number, col: number, char: string, brightness: number): string {
    // Ensure we don't render outside the terminal bounds
    if (row < 0 || row >= this.config.rows || col < 0 || col >= this.config.columns) {
      return '';
    }

    // Construct the control sequence for cursor positioning
    let sequence = this.CURSOR_POS_PREFIX + `${row + 1};${col + 1}H`;

    // Set color based on brightness
    if (brightness > 0.9) {
      // White for the head (increased threshold)
      sequence += this.COLOR_WHITE;
    } else if (brightness > 0.6) {
      // Bright green (increased threshold)
      sequence += this.COLOR_BRIGHT_GREEN;
    } else if (brightness > 0.3) {
      // Normal green
      sequence += this.COLOR_GREEN;
    } else {
      // Dark green
      sequence += this.COLOR_DARK_GREEN;
    }

    // Add character and reset sequence
    sequence += char + this.COLOR_RESET;
    return sequence;
  }

  private animate(timestamp: number): void {
    if (!this.terminal || !this.isRunning) {
      console.warn('[MatrixRain] Animation stopped:', {
        terminalExists: !!this.terminal,
        isRunning: this.isRunning
      });
      return;
    }

    const deltaTime = (timestamp - this.lastFrameTime) / 1000; // Convert to seconds
    this.lastFrameTime = timestamp;

    console.warn('[MatrixRain] Animation frame:', {
      deltaTime,
      raindrops: this.raindrops.length,
      maxRaindrops: this.maxRaindrops
    });

    this.updateRaindrops(deltaTime);
    this.renderFrame();

    this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
  }

  public start(): void {
    if (!this.terminal || this.isRunning) {
      console.warn('[MatrixRain] Cannot start:', {
        terminalExists: !!this.terminal,
        isRunning: this.isRunning
      });
      return;
    }

    console.warn('[MatrixRain] Starting with dimensions:', {
      columns: this.config.columns,
      rows: this.config.rows,
      maxRaindrops: this.maxRaindrops,
      density: this.config.density
    });

    this.isRunning = true;
    // Clear the entire screen and scrollback buffer
    this.terminal.write(this.CLEAR_SCREEN + this.CLEAR_SCROLLBACK);
    this.terminal.write(this.ESC + '[H');  // Move cursor to home

    this.terminal.write(this.HIDE_CURSOR); // Hide the cursor
    this.lastFrameTime = performance.now();
    this.animate(this.lastFrameTime);
  }

  public stop(): void {
    console.warn('[MatrixRain] Stopping');
    if (!this.terminal) return;
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.terminal.write(this.SHOW_CURSOR); // Show cursor
  }

  public updateConfig(newConfig: Partial<MatrixConfig>): void {
    this.maxRaindrops = newConfig.maxRaindrops || this.maxRaindrops;

    if (!this.terminal) return;
    this.config = { ...this.config, ...newConfig };
    console.warn('[MatrixRain] Updated config:', this.config);
  }

  public resize(columns: number, rows: number): void {
    if (!this.terminal) return;

    console.warn('[MatrixRain] Resizing:', {
      columns,
      rows,
      reservedRows: this.reservedRows
    });

    // Use the actual terminal dimensions, considering reserved rows
    this.config.columns = columns;
    this.config.rows = rows - this.reservedRows;
  }

  public cleanup(): void {
    console.warn('[MatrixRain] Cleaning up');
    if (!this.terminal) return;
    this.stop();
    this.raindrops = [];
  }
}