/**
 * Command history management for terminal
 */

export class CommandHistory {
  private history: string[] = [];
  private maxSize: number;
  private position: number = -1;
  private tempBuffer: string = '';

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  /**
   * Add a command to history
   */
  add(command: string): void {
    // Don't add empty commands or duplicates
    if (!command.trim() || (this.history.length > 0 && this.history[0] === command)) {
      return;
    }

    this.history.unshift(command);
    if (this.history.length > this.maxSize) {
      this.history.pop();
    }
    this.position = -1;
    this.tempBuffer = '';
  }

  /**
   * Move back in history (up arrow)
   */
  back(currentBuffer: string): string {
    // Save current buffer if starting history navigation
    if (this.position === -1) {
      this.tempBuffer = currentBuffer;
    }

    if (this.position < this.history.length - 1) {
      this.position++;
      return this.history[this.position];
    }
    return this.history[this.position] || '';
  }

  /**
   * Move forward in history (down arrow)
   */
  forward(): string {
    if (this.position > 0) {
      this.position--;
      return this.history[this.position];
    }
    if (this.position === 0) {
      this.position = -1;
      return this.tempBuffer;
    }
    return this.tempBuffer;
  }

  /**
   * Reset history navigation
   */
  reset(): void {
    this.position = -1;
    this.tempBuffer = '';
  }

  /**
   * Get all history entries
   */
  getEntries(): string[] {
    return [...this.history];
  }

  /**
   * Search history for commands starting with prefix
   */
  search(prefix: string): string[] {
    return this.history.filter(cmd => cmd.startsWith(prefix));
  }

  /**
   * Clear history
   */
  clear(): void {
    this.history = [];
    this.position = -1;
    this.tempBuffer = '';
  }
}