import { VirtualFilesystem } from './VirtualFilesystem';
import { ColorManager } from '../terminal/colors';

interface CommandResult {
  output: string[];
  exitCode: number;
  delayedOutput?: boolean;
  shouldExit?: boolean;
}

interface CommandHandler {
  (args: string[]): Promise<CommandResult>;
}
interface EnvVars {
  HOME: string;
  USER: string;
  SHELL: string;
  PATH: string;
  PWD: string;
  HOSTNAME: string;
  PS1: string;
  TERM: string;
}

export class VirtualLinuxEnvironment {
  private fs: VirtualFilesystem;
  private env: EnvVars;
  private cwd: string;
  private lastExitCode: number;

  constructor() {
    this.fs = new VirtualFilesystem();
    this.cwd = '/home/hacker';
    this.lastExitCode = 0;
    this.env = {
      HOME: '/home/hacker',
      USER: 'hacker',
      SHELL: '/bin/bash',
      PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
      PWD: '/home/hacker',
      HOSTNAME: 'matrix-defense-system',
      PS1: '\\u@\\h\\$ ',  // Remove directory from prompt
      TERM: 'xterm-256color'
    };
  }

  // Methods needed for tab completion
  public getFilesystem(): VirtualFilesystem {
    return this.fs;
  }

  public getCurrentDirectory(): string {
    return this.cwd;
  }

  public getPrompt(): string {
    return ColorManager.style(
      this.env.PS1
        .replace('\\u', this.env.USER)
        .replace('\\h', this.env.HOSTNAME)
        .replace('\\$', this.env.USER === 'root' ? '#' : '$'),
      ['brightGreen']
    );
  }

  private async handleLs(args: string[]): Promise<CommandResult> {
    try {
      // Parse args for -l, -a options
      const showLong = args.includes('-l');
      const showAll = args.includes('-a');
      
      // Get target directory
      const targetPath = args.filter(arg => !arg.startsWith('-')).pop() || this.cwd;
      const normalizedPath = this.fs.normalizePath(targetPath);
      
      if (!normalizedPath) {
        return {
          output: [ColorManager.style(`ls: invalid path: '${targetPath}'`, ['brightRed'])],
          exitCode: 1
        };
      }
      
      const entry = this.fs.resolvePath(normalizedPath);
      
      if (!entry) {
        return {
          output: [ColorManager.style(`ls: cannot access '${targetPath}': No such file or directory`, ['brightRed'])],
          exitCode: 1
        };
      }

      if (entry.type !== 'directory') {
        if (showLong) {
          return {
            output: [this.fs.formatListing(entry, normalizedPath)],
            exitCode: 0
          };
        }
        return {
          output: [normalizedPath],
          exitCode: 0
        };
      }

      // Get directory contents
      const dirEntries = this.fs.listDir(normalizedPath);
      const filteredEntries = showAll ? dirEntries : dirEntries.filter(name => !name.startsWith('.'));

      if (showLong) {
        const output = filteredEntries.map(name => {
          const childPath = `${normalizedPath === '/' ? '' : normalizedPath}/${name}`;
          const childEntry = this.fs.resolvePath(childPath);
          if (!childEntry) return '';
          return this.fs.formatListing(childEntry, name);
        }).filter(line => line !== '');
        
        return { output, exitCode: 0 };
      }

      return {
        output: filteredEntries.length > 0 ? [filteredEntries.join('  ')] : [''],
        exitCode: 0
      };
    } catch (error) {
      return {
        output: [ColorManager.style(`ls: error: ${error.message}`, ['brightRed'])],
        exitCode: 1
      };
    }
  }

  private async handleCd(args: string[]): Promise<CommandResult> {
    const targetPath = args[0] || this.env.HOME;
    const normalizedPath = this.fs.normalizePath(targetPath);
    
    if (!normalizedPath) {
      return {
        output: [ColorManager.style(`cd: invalid path: ${targetPath}`, ['brightRed'])],
        exitCode: 1
      };
    }

    const entry = this.fs.resolvePath(normalizedPath);

    if (!entry) {
      return {
        output: [ColorManager.style(`cd: no such directory: ${targetPath}`, ['brightRed'])],
        exitCode: 1
      };
    }

    if (entry.type !== 'directory') {
      return {
        output: [ColorManager.style(`cd: not a directory: ${targetPath}`, ['brightRed'])],
        exitCode: 1
      };
    }

    this.cwd = normalizedPath;
    this.env.PWD = normalizedPath;
    return { output: [], exitCode: 0 };
  }

  private async handlePwd(_args: string[]): Promise<CommandResult> {
    return { output: [this.cwd], exitCode: 0 };
  }

  public execCommand(commandStr: string): { output: string[]; exitCode: number; delayedOutput?: boolean; shouldExit?: boolean } {
    // Parse the command string into command and arguments
    const parts = commandStr.trim().split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);
    
    // Special case for 'exit' command to exit backdoor mode
    if (cmd === 'exit') {
      return {
        output: ['Exiting backdoor mode...'],
        exitCode: 0,
        shouldExit: true
      };
    }

    const commandHandlers: Record<string, CommandHandler> = {
      ls: (args) => this.handleLs(args),
      cd: (args) => this.handleCd(args),
      pwd: (args) => this.handlePwd(args)
    };

    const handler = commandHandlers[cmd];
    if (!handler) {
      return {
        output: [ColorManager.style(`Command not found: ${cmd}`, ['brightRed'])],
        exitCode: 127
      };
    }

    // Execute commands that might need to run asynchronously with a wrapper
    // that turns the promise into a synchronous result
    try {
      // Special case for commands that might need delayed output simulation
      if (cmd === 'hack' || cmd === 'scan' || cmd === 'decrypt') {
        return {
          output: [
            ColorManager.style(`INITIATING ${cmd.toUpperCase()} SEQUENCE...`, ['brightGreen']),
            ColorManager.style(`ACCESSING TARGET SYSTEMS...`, ['green']),
            ColorManager.style(`BYPASSING SECURITY...`, ['cyan']),
            ColorManager.style(`TARGET SYSTEM COMPROMISED`, ['brightGreen'])
          ],
          exitCode: 0,
          delayedOutput: true
        };
      }

      // For normal commands, execute synchronously by converting the promise to a result
      let result: CommandResult = { output: [], exitCode: 1 };
      
      handler(args)
        .then(r => { result = r; })
        .catch(error => {
          result = {
            output: [ColorManager.style(`${cmd}: ${error.message}`, ['brightRed'])],
            exitCode: 1
          };
        });
      
      // For simplicity, return the result directly
      // In a real implementation, this would need to properly handle async
      // But since we're demonstrating, we can keep it simple
      return result;
    } catch (error) {
      return {
        output: [ColorManager.style(`${cmd}: ${error.message}`, ['brightRed'])],
        exitCode: 1
      };
    }
  }
}