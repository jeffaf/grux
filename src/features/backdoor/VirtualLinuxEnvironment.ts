import { VirtualFilesystem } from './VirtualFilesystem';
import { CommandResult, EnvVars, LsOptions } from './types';

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
      PS1: '\\u@\\h:\\w\\$ ',
      TERM: 'xterm-256color'
    };
  }

  public execCommand(cmdLine: string): CommandResult {
    const parts = this.parseCommandLine(cmdLine);
    if (parts.length === 0) {
      return { output: [], exitCode: 0 };
    }

    const [cmd, ...args] = parts;
    
    try {
      switch (cmd) {
        case 'pwd':
          return this.pwd();
        case 'cd':
          return this.cd(args[0]);
        case 'ls':
          return this.ls(args);
        case 'cat':
          return this.cat(args);
        case 'echo':
          return this.echo(args);
        case 'whoami':
          return this.whoami();
        case 'id':
          return this.id();
        case 'uname':
          return this.uname(args);
        case 'ps':
          return this.ps();
        case 'clear':
          return { output: ['\x1bc'], exitCode: 0 }; // ANSI escape sequence to clear screen
        default:
          return {
            output: [`${cmd}: command not found`],
            exitCode: 127
          };
      }
    } catch (error) {
      return {
        output: [`${cmd}: ${error.message}`],
        exitCode: 1
      };
    }
  }

  private parseCommandLine(cmdLine: string): string[] {
    // Basic command line parsing, can be expanded for more complex cases
    return cmdLine.trim().split(/\s+/).filter(Boolean);
  }

  private resolvePath(path: string): string {
    if (path.startsWith('/')) {
      return path;
    }
    return `${this.cwd}/${path}`.replace(/\/+/g, '/');
  }

  // Command implementations
  private pwd(): CommandResult {
    return {
      output: [this.cwd],
      exitCode: 0
    };
  }

  private cd(dir: string = this.env.HOME): CommandResult {
    const target = this.resolvePath(dir || this.env.HOME);
    const entry = this.fs.resolvePath(target);
    
    if (!entry || entry.type !== 'directory') {
      return {
        output: [`cd: ${dir}: No such directory`],
        exitCode: 1
      };
    }

    this.cwd = target;
    this.env.PWD = target;
    return { output: [], exitCode: 0 };
  }

  private ls(args: string[]): CommandResult {
    const options: LsOptions = {
      all: false,
      long: false,
      human: false
    };

    // Parse options
    const paths: string[] = [];
    for (const arg of args) {
      if (arg.startsWith('-')) {
        if (arg.includes('a')) options.all = true;
        if (arg.includes('l')) options.long = true;
        if (arg.includes('h')) options.human = true;
      } else {
        paths.push(arg);
      }
    }

    if (paths.length === 0) paths.push('.');

    const output: string[] = [];
    for (const path of paths) {
      const resolvedPath = this.resolvePath(path);
      const entry = this.fs.resolvePath(resolvedPath);

      if (!entry) {
        output.push(`ls: cannot access '${path}': No such file or directory`);
        continue;
      }

      if (entry.type === 'directory') {
        const entries = this.fs.listDir(resolvedPath);
        for (const name of entries) {
          if (!options.all && name.startsWith('.')) continue;
          const childEntry = this.fs.resolvePath(`${resolvedPath}/${name}`);
          if (childEntry) {
            if (options.long) {
              output.push(this.fs.formatListing(childEntry, name));
            } else {
              output.push(name + (childEntry.type === 'directory' ? '/' : ''));
            }
          }
        }
      } else {
        if (options.long) {
          output.push(this.fs.formatListing(entry, path));
        } else {
          output.push(path);
        }
      }
    }

    return { output, exitCode: 0 };
  }

  private cat(args: string[]): CommandResult {
    if (args.length === 0) {
      return {
        output: ['usage: cat [file...]'],
        exitCode: 1
      };
    }

    const output: string[] = [];
    let exitCode = 0;

    for (const path of args) {
      const resolvedPath = this.resolvePath(path);
      const content = this.fs.readFile(resolvedPath);
      
      if (content === null) {
        output.push(`cat: ${path}: No such file`);
        exitCode = 1;
      } else {
        output.push(...content.split('\n'));
      }
    }

    return { output, exitCode };
  }

  private echo(args: string[]): CommandResult {
    const output = args.map(arg => {
      if (arg.startsWith('$')) {
        const varName = arg.slice(1);
        return this.env[varName] || '';
      }
      return arg;
    }).join(' ');

    return {
      output: [output],
      exitCode: 0
    };
  }

  private whoami(): CommandResult {
    return {
      output: [this.env.USER],
      exitCode: 0
    };
  }

  private id(): CommandResult {
    return {
      output: [`uid=1000(${this.env.USER}) gid=1000(${this.env.USER}) groups=1000(${this.env.USER})`],
      exitCode: 0
    };
  }

  private uname(args: string[]): CommandResult {
    const info = {
      s: 'Linux',
      n: this.env.HOSTNAME,
      r: '5.15.0-matrix',
      v: '#1 SMP PREEMPT Matrix Defense System',
      m: 'x86_64',
      p: 'x86_64',
      i: 'x86_64',
      o: 'GNU/Linux'
    };

    if (args.includes('-a')) {
      return {
        output: [Object.values(info).join(' ')],
        exitCode: 0
      };
    }

    return {
      output: [info.s],
      exitCode: 0
    };
  }

  private ps(): CommandResult {
    return {
      output: [
        'PID TTY          TIME CMD',
        '  1 ?        00:00:00 init',
        '100 ?        00:00:01 systemd',
        '432 pts/0    00:00:00 bash',
        '433 pts/0    00:00:00 ps'
      ],
      exitCode: 0
    };
  }

  public getPrompt(): string {
    return this.env.PS1
      .replace('\\u', this.env.USER)
      .replace('\\h', this.env.HOSTNAME)
      .replace('\\w', this.cwd.replace(this.env.HOME, '~'))
      .replace('\\$', this.env.USER === 'root' ? '#' : '$');
  }
}