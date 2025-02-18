import { Terminal } from 'xterm';
import { MatrixConfig, Raindrop, DEFAULT_CONFIG, MATRIX_CHARS } from './types';
import { getRandomMatrixChar } from './utils';

export class MatrixRain {
  private config: MatrixConfig;
  private terminal: Terminal;
  private raindrops: Raindrop[];
  private gridState: string[][];
  private animationFrameId: number | null = null;
  private lastFrameTime: number = 0;
  public isRunning: boolean = false;

  // Control sequences with escape character
  private readonly ESC = '\x1b';
  private readonly CURSOR_POS_PREFIX = this.ESC + '[';
  private readonly COLOR_WHITE = this.ESC + '[97m';
  private readonly COLOR_BRIGHT_GREEN = this.ESC + '[92m';
  private readonly COLOR_GREEN = this.ESC + '[32m';
  private readonly COLOR_DARK_GREEN = this.ESC + '[38;5;22m';
  private readonly COLOR_RESET = this.ESC + '[0m';

  constructor(terminal: Terminal, config: Partial<MatrixConfig> = {}) {
    this.terminal = terminal;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.raindrops = [];
    this.gridState = [];
    this.initializeGrid();
  }

  private initializeGrid(): void {
    this.gridState = Array(this.config.maxRows).fill(null)
      .map(() => Array(this.config.columns).fill(' '));
  }

  private createRaindrop(): Raindrop {
    const column = Math.floor(Math.random() * this.config.columns);
    const length = Math.floor(Math.random() * 6) + 5; // Random length between 5-10
    const speed = (Math.random() * 0.3 + 0.2) * this.config.fallSpeed; // More consistent speeds
    const brightnesses = new Array(length).fill(0).map((_, i) => {
      // Create smooth brightness gradient from head to tail
      return Math.pow(1 - (i / length), 2);
    });

    return {
      column,
      length,
      speed,
      head: 0,
      glowPosition: 0,
      active: true,
      brightnesses
    };
  }

  private updateRaindrops(deltaTime: number): void {
    // Add new raindrops based on density
    if (Math.random() < this.config.density * deltaTime) {
      this.raindrops.push(this.createRaindrop());
    }

    // Update existing raindrops
    this.raindrops = this.raindrops.filter(drop => {
      // Update drop position
      drop.head += drop.speed * this.config.animationSpeed * deltaTime;
      drop.glowPosition = Math.floor(drop.head);

      // Check if raindrop is still visible within maxRows
      if (drop.glowPosition - drop.length > this.config.maxRows) {
        return false;
      }

      return true;
    });
  }

  private renderFrame(): void {
    // Clear grid
    this.initializeGrid();

    // Update grid with raindrop characters
    this.raindrops.forEach(drop => {
      const headPos = Math.floor(drop.glowPosition);
      const tailStart = Math.max(0, headPos - drop.length);

      for (let y = tailStart; y <= headPos && y < this.config.maxRows; y++) {
        if (y < 0) continue;

        // Get random character
        const char = getRandomMatrixChar();
        this.gridState[y][drop.column] = char;

        // Calculate brightness based on position in the drop
        const positionInDrop = headPos - y;
        const brightness = positionInDrop < drop.brightnesses.length 
          ? drop.brightnesses[positionInDrop] * this.config.glowIntensity
          : 0;

        this.renderCharacter(y, drop.column, char, brightness);
      }
    });
  }

  private renderCharacter(row: number, col: number, char: string, brightness: number): void {
    if (row >= this.config.maxRows) return;

    // Move cursor to position
    this.terminal.write(this.CURSOR_POS_PREFIX + `${row + 1};${col + 1}H`);

    // Set color based on brightness
    if (brightness > 0.8) {
      // Bright white
      this.terminal.write(this.COLOR_WHITE);
    } else if (brightness > 0.6) {
      // Bright green
      this.terminal.write(this.COLOR_BRIGHT_GREEN);
    } else if (brightness > 0.3) {
      // Normal green
      this.terminal.write(this.COLOR_GREEN);
    } else {
      // Dark green
      this.terminal.write(this.COLOR_DARK_GREEN);
    }

    // Write character
    this.terminal.write(char);

    // Reset color
    this.terminal.write(this.COLOR_RESET);
  }

  private animate(timestamp: number): void {
    if (!this.isRunning) return;

    const deltaTime = (timestamp - this.lastFrameTime) / 1000; // Convert to seconds
    this.lastFrameTime = timestamp;

    this.updateRaindrops(deltaTime);
    this.renderFrame();

    this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.animate(this.lastFrameTime);
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public updateConfig(newConfig: Partial<MatrixConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.initializeGrid();
  }

  public resize(columns: number, rows: number): void {
    const maxRows = Math.floor(rows / 2);
    this.updateConfig({ columns, rows, maxRows });
  }

  public cleanup(): void {
    this.stop();
    this.raindrops = [];
    this.initializeGrid();
  }
}