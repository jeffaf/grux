import { VirtualFilesystem } from './VirtualFilesystem';
import { CommandResult, EnvVars, LsOptions } from './types';
import { HACKER_ART } from './art';

export interface BackdoorCommandResult extends CommandResult {
  shouldExit?: boolean;
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
      PS1: '\\u@\\h:\\w\\$ ',
      TERM: 'xterm-256color'
    };
  }

  public execCommand(cmdLine: string): BackdoorCommandResult {
    const parts = this.parseCommandLine(cmdLine);
    if (parts.length === 0) {
      return { output: [], exitCode: 0 };
    }

    const [cmd, ...args] = parts;
    
    try {
      // Handle exit/back commands first
      if (cmd === 'exit' || cmd === 'back') {
        return {
          output: ['Leaving Matrix Defense System...'],
          exitCode: 0,
          shouldExit: true
        };
      }

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
        case 'neofetch':
          return this.neofetch();
        case 'hack':
          return this.hack();
        case 'help':
          return this.help();
        case 'clear':
          return { output: ['c'], exitCode: 0 }; // 'c' will be interpreted as clear screen
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

  private hack(): BackdoorCommandResult {
    const esc = '';
    const green = `${esc}[32m`;
    const brightGreen = `${esc}[92m`;
    const reset = `${esc}[0m`;

    const lines = HACKER_ART.split('\n').map(line =>
      `${brightGreen}${line}${reset}`
    );

    // Add some dramatic text at the bottom
    lines.push('');
    lines.push(`${green}INITIATING SYSTEM HACK SEQUENCE...${reset}`);
    lines.push(`${green}ACCESSING MAINFRAME...${reset}`);
    lines.push(`${green}BYPASSING SECURITY PROTOCOLS...${reset}`);
    lines.push(`${green}SYSTEM COMPROMISED${reset}`);

    return {
      output: lines,
      exitCode: 0,
      delayedOutput: true // Enable typing effect for this command
    };
  }

  private neofetch(): BackdoorCommandResult {
    const esc = '\x1b';
    const green = `${esc}[32m`;
    const reset = `${esc}[0m`;
    const bright = `${esc}[1m`;
    const dim = `${esc}[2m`;

    const logo = [
      `${green}         ███╗   ███╗ █████╗ ████████╗██████╗ ██╗██╗  ██╗${reset}`,
      `${green}         ████╗ ████║██╔══██╗╚══██╔══╝██╔══██╗██║╚██╗██╔╝${reset}`,
      `${green}         ██╔████╔██║███████║   ██║   ██████╔╝██║ ╚███╔╝${reset}`,
      `${green}         ██║╚██╔╝██║██╔══██║   ██║   ██╔══██╗██║ ██╔██╗${reset}`,
      `${green}         ██║ ╚═╝ ██║██║  ██║   ██║   ██║  ██║██║██╔╝ ██╗${reset}`,
      `${green}         ╚═╝     ╚═╝╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝${reset}`,
      `${dim}              Defense System v2.0 - Follow the white rabbit${reset}`,
      ''
    ];

    const info = [
      `${bright}OS:${reset} Matrix Defense System 2.0 (Ubuntu 22.04 base)`,
      `${bright}Kernel:${reset} 5.15.0-matrix`,
      `${bright}Uptime:${reset} 13337 days, 1 hour, 23 mins`,
      `${bright}Packages:${reset} 1999 (dpkg)`,
      `${bright}Shell:${reset} ${this.env.SHELL}`,
      `${bright}Resolution:${reset} 1920x1080 @ 144Hz`,
      `${bright}DE:${reset} Matrix Environment 3.0`,
      `${bright}WM:${reset} Digital Rain`,
      `${bright}Terminal:${reset} xterm-matrix`,
      `${bright}CPU:${reset} Quantum i9-9999K (128) @ 4.2GHz`,
      `${bright}GPU:${reset} Neural Graphics 4090 Ti`,
      `${bright}Memory:${reset} 128GB / 256GB`,
      `${bright}Local IP:${reset} 10.31.33.7`,
      `${bright}System Status:${reset} Compromised`,
      ''
    ];

    // Combine logo and info side by side
    const output: string[] = [];
    const maxLines = Math.max(logo.length, info.length);
    for (let i = 0; i < maxLines; i++) {
      const logoLine = logo[i] || '';
      const infoLine = info[i] || '';
      output.push(`${logoLine}${' '.repeat(5)}${infoLine}`);
    }

    return {
      output,
      exitCode: 0
    };
  }

  private help(): BackdoorCommandResult {
    return {
      output: [
        'Available commands:',
        '  pwd               - Print working directory',
        '  cd [dir]         - Change directory',
        '  ls [-la]         - List directory contents',
        '  cat [file]       - Display file contents',
        '  echo [text]      - Display text',
        '  whoami           - Print current user',
        '  id               - Print user ID info',
        '  uname [-a]       - Print system information',
        '  ps               - List processes',
        '  clear            - Clear screen',
        '  help             - Show this help',
        '  neofetch         - Display system information',
        '  hack             - Initiate system hack sequence',
        '  exit, back       - Return to normal terminal',
      ],
      exitCode: 0
    };
  }

  private parseCommandLine(cmdLine: string): string[] {
    return cmdLine.trim().split(/\s+/).filter(Boolean);
  }

  public getPrompt(): string {
    return this.env.PS1
      .replace('\\u', this.env.USER)
      .replace('\\h', this.env.HOSTNAME)
      .replace('\\w', this.cwd.replace(this.env.HOME, '~'))
      .replace('\\$', this.env.USER === 'root' ? '#' : '$');
  }

  private pwd(): BackdoorCommandResult {
    return { output: [this.cwd], exitCode: 0 };
  }

  private cd(dir: string = this.env.HOME): BackdoorCommandResult {
    const target = dir.startsWith('/') ? dir : `${this.cwd}/${dir}`.replace(/\/+/g, '/');
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

  private ls(args: string[]): BackdoorCommandResult {
    const options: LsOptions = {
      all: false,
      long: false,
      human: false
    };

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
      const resolvedPath = path.startsWith('/') ? path : `${this.cwd}/${path}`.replace(/\/+/g, '/');
      const entry = this.fs.resolvePath(resolvedPath);

      if (!entry) {
        output.push(`ls: cannot access '${path}': No such file or directory`);
        continue;
      }

      if (entry.type === 'directory') {
        const entries = this.fs.listDir(resolvedPath);
        entries.sort().forEach(name => {
          if (!options.all && name.startsWith('.')) return;
          const childEntry = this.fs.resolvePath(`${resolvedPath}/${name}`);
          if (childEntry) {
            output.push(options.long 
              ? this.fs.formatListing(childEntry, name)
              : name + (childEntry.type === 'directory' ? '/' : ''));
          }
        });
      } else {
        output.push(options.long 
          ? this.fs.formatListing(entry, path)
          : path);
      }
    }

    return { output, exitCode: 0 };
  }

  private cat(args: string[]): BackdoorCommandResult {
    if (args.length === 0) {
      return {
        output: ['usage: cat [file...]'],
        exitCode: 1
      };
    }

    const output: string[] = [];
    let exitCode = 0;

    for (const path of args) {
      const resolvedPath = path.startsWith('/') ? path : `${this.cwd}/${path}`.replace(/\/+/g, '/');
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

  private echo(args: string[]): BackdoorCommandResult {
    return {
      output: [args.join(' ')],
      exitCode: 0
    };
  }

  private whoami(): BackdoorCommandResult {
    return {
      output: [this.env.USER],
      exitCode: 0
    };
  }

  private id(): BackdoorCommandResult {
    return {
      output: [`uid=1000(${this.env.USER}) gid=1000(${this.env.USER}) groups=1000(${this.env.USER})`],
      exitCode: 0
    };
  }

  private uname(args: string[]): BackdoorCommandResult {
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

  private ps(): BackdoorCommandResult {
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
}