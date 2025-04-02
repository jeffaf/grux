import { VirtualLinuxEnvironment } from '../backdoor/VirtualLinuxEnvironment';
import { VirtualFilesystem } from '../backdoor/VirtualFilesystem';
import { ColorManager, SGR } from './colors';

export interface CompletionResult {
  matches: string[];
  displayMatches?: string[];  // Colored/formatted matches for display
  prefix?: string;            // Common prefix for matches
  isPartial: boolean;         // Whether there are more matches
}

export interface CompletionProvider {
  getCompletions(input: string, cursorPosition: number): CompletionResult;
  getPriority(): number;  // Higher priority providers are checked first
}

/**
 * Command completion provider for basic terminal commands
 */
export class BasicCommandProvider implements CompletionProvider {
  private commands: Set<string>;

  constructor() {
    this.commands = new Set([
      'help',
      'ls',
      'dir',
      'cat',
      'clear',
      'echo',
      'version',
      'matrix',
      'stop',
      'exit',
      'backdoor'
    ]);
  }

  getCompletions(input: string): CompletionResult {
    const inputLower = input.toLowerCase();
    const matches = Array.from(this.commands)
      .filter(cmd => cmd.startsWith(inputLower));

    if (matches.length === 0) {
      return { matches: [], isPartial: false };
    }

    // Find common prefix
    const prefix = matches.reduce((acc, curr) => {
      for (let i = 0; i < acc.length; i++) {
        if (acc[i] !== curr[i]) {
          return acc.substring(0, i);
        }
      }
      return acc;
    });

    // Format matches for display
    const displayMatches = matches.map(match =>
      ColorManager.style(match, ['brightCyan'])
    );

    return {
      matches,
      displayMatches,
      prefix,
      isPartial: matches.length > 1
    };
  }

  getPriority(): number {
    return 100; // High priority for basic commands
  }
}

/**
 * Command completion provider for backdoor mode
 */
export class BackdoorCommandProvider implements CompletionProvider {
  private env: VirtualLinuxEnvironment;

  constructor(env: VirtualLinuxEnvironment) {
    this.env = env;
  }

  getCompletions(input: string): CompletionResult {
    const commands = [
      'pwd',
      'cd',
      'ls',
      'cat',
      'echo',
      'whoami',
      'id',
      'uname',
      'ps',
      'clear',
      'help',
      'neofetch',
      'hack',
      'exit',
      'back'
    ];

    const inputLower = input.toLowerCase();
    const matches = commands.filter(cmd => cmd.startsWith(inputLower));

    if (matches.length === 0) {
      return { matches: [], isPartial: false };
    }

    const prefix = matches.reduce((acc, curr) => {
      for (let i = 0; i < acc.length; i++) {
        if (acc[i] !== curr[i]) {
          return acc.substring(0, i);
        }
      }
      return acc;
    });

    const displayMatches = matches.map(match =>
      ColorManager.style(match, ['brightGreen'])
    );

    return {
      matches,
      displayMatches,
      prefix,
      isPartial: matches.length > 1
    };
  }

  getPriority(): number {
    return 200; // Higher priority than basic commands in backdoor mode
  }
}

/**
 * Path completion provider for file system navigation
 */
export class PathCompletionProvider implements CompletionProvider {
  private fs: VirtualFilesystem;
  private currentDir: string;

  constructor(fs: VirtualFilesystem, currentDir: string) {
    this.fs = fs;
    this.currentDir = currentDir;
  }

  getCompletions(input: string): CompletionResult {
    // Extract the last part of the input as the path to complete
    const parts = input.split(/\s+/);
    const lastPart = parts[parts.length - 1] || '';

    // Determine the directory to look in
    let searchDir = this.currentDir;
    let searchPattern = lastPart;

    if (lastPart.includes('/')) {
      // Handle absolute and relative paths
      const isAbsolute = lastPart.startsWith('/');
      const lastSlash = lastPart.lastIndexOf('/');
      searchDir = isAbsolute
        ? lastPart.substring(0, lastSlash) || '/'
        : `${this.currentDir}/${lastPart.substring(0, lastSlash)}`;
      searchPattern = lastPart.substring(lastSlash + 1);
    }

    // Get directory entries
    try {
      const entries = this.fs.listDir(searchDir);
      const matches = entries.filter(entry => 
        entry.startsWith(searchPattern) &&
        (!searchPattern.startsWith('.') ? !entry.startsWith('.') : true)
      );

      if (matches.length === 0) {
        return { matches: [], isPartial: false };
      }

      // Find common prefix
      const prefix = matches.reduce((acc, curr) => {
        for (let i = 0; i < acc.length; i++) {
          if (acc[i] !== curr[i]) {
            return acc.substring(0, i);
          }
        }
        return acc;
      });

      // Format matches for display with colors
      const displayMatches = matches.map(match => {
        const fullPath = `${searchDir}/${match}`.replace(/\/+/g, '/');
        const entry = this.fs.resolvePath(fullPath);
        return entry?.type === 'directory'
          ? ColorManager.style(match + '/', ['brightBlue', 'bold'])
          : match;
      });

      return {
        matches,
        displayMatches,
        prefix: parts.slice(0, -1).join(' ') + ' ' + prefix,
        isPartial: matches.length > 1
      };
    } catch {
      return { matches: [], isPartial: false };
    }
  }

  getPriority(): number {
    return 50; // Lower priority than commands
  }
}

/**
 * Manages tab completion for the terminal
 */
export class CompletionManager {
  private providers: CompletionProvider[] = [];

  constructor() {
    // Register basic command provider by default
    this.registerProvider(new BasicCommandProvider());
  }

  registerProvider(provider: CompletionProvider): void {
    this.providers.push(provider);
    // Sort providers by priority (highest first)
    this.providers.sort((a, b) => b.getPriority() - a.getPriority());
  }

  complete(input: string, cursorPosition: number): CompletionResult {
    // Try each provider in priority order
    for (const provider of this.providers) {
      const result = provider.getCompletions(input, cursorPosition);
      if (result.matches.length > 0) {
        return result;
      }
    }
    return { matches: [], isPartial: false };
  }

  /**
   * Format completion results for display in terminal
   */
  formatCompletionDisplay(result: CompletionResult): string[] {
    if (!result.matches.length) return [];

    const output: string[] = [''];
    if (result.displayMatches) {
      // Group matches into rows
      const maxWidth = 20;
      let currentLine = '';
      result.displayMatches.forEach((match, i) => {
        if (currentLine.length + match.length + 2 > 80) {
          output.push(currentLine);
          currentLine = '';
        }
        currentLine += match.padEnd(maxWidth);
      });
      if (currentLine) {
        output.push(currentLine);
      }
    }
    return output;
  }
}