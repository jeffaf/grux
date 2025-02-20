import { VirtualFilesystem } from './VirtualFilesystem';
import { CommandResult, EnvVars, LsOptions } from './types';
import { HACKER_ART } from './art';
import { ColorManager, SGR } from '../terminal/colors';

export interface BackdoorCommandResult extends CommandResult {
  shouldExit?: boolean;
  delayedOutput?: boolean;
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
          output: [ColorManager.fg('Leaving Matrix Defense System...', 'cyan')],
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
            output: [ColorManager.error(`${cmd}: command not found`)],
            exitCode: 127
          };
      }
    } catch (error) {
      return {
        output: [ColorManager.error(`${cmd}: ${error.message}`)],
        exitCode: 1
      };
    }
  }

  private hack(): BackdoorCommandResult {
    const lines = HACKER_ART.split('\n').map(line =>
      ColorManager.style(line, ['brightGreen'])
    );

    // Add dramatic text with proper color sequences
    lines.push('');
    lines.push(ColorManager.style('INITIATING SYSTEM HACK SEQUENCE...', ['green', 'bold']));
    lines.push(ColorManager.style('ACCESSING MAINFRAME...', ['green', 'bold']));
    lines.push(ColorManager.style('BYPASSING SECURITY PROTOCOLS...', ['green', 'bold']));
    lines.push(ColorManager.style('SYSTEM COMPROMISED', ['brightGreen', 'bold', 'blink']));

    return {
      output: lines,
      exitCode: 0,
      delayedOutput: true
    };
  }

  private neofetch(): BackdoorCommandResult {
    const logo = [
      ColorManager.fg('         ███╗   ███╗ █████╗ ████████╗██████╗ ██╗██╗  ██╗', 'green'),
      ColorManager.fg('         ████╗ ████║██╔══██╗╚══██╔══╝██╔══██╗██║╚██╗██╔╝', 'green'),
      ColorManager.fg('         ██╔████╔██║███████║   ██║   ██████╔╝██║ ╚███╔╝', 'green'),
      ColorManager.fg('         ██║╚██╔╝██║██╔══██║   ██║   ██╔══██╗██║ ██╔██╗', 'green'),
      ColorManager.fg('         ██║ ╚═╝ ██║██║  ██║   ██║   ██║  ██║██║██╔╝ ██╗', 'green'),
      ColorManager.fg('         ╚═╝     ╚═╝╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝', 'green'),
      ColorManager.style('              Defense System v2.0 - Follow the white rabbit', ['dim']),
      ''
    ];

    const info = [
      `${ColorManager.style('OS:', ['bold'])} Matrix Defense System 2.0 (Ubuntu 22.04 base)`,
      `${ColorManager.style('Kernel:', ['bold'])} 5.15.0-matrix`,
      `${ColorManager.style('Uptime:', ['bold'])} 13337 days, 1 hour, 23 mins`,
      `${ColorManager.style('Packages:', ['bold'])} 1999 (dpkg)`,
      `${ColorManager.style('Shell:', ['bold'])} ${this.env.SHELL}`,
      `${ColorManager.style('Resolution:', ['bold'])} 1920x1080 @ 144Hz`,
      `${ColorManager.style('DE:', ['bold'])} Matrix Environment 3.0`,
      `${ColorManager.style('WM:', ['bold'])} Digital Rain`,
      `${ColorManager.style('Terminal:', ['bold'])} xterm-matrix`,
      `${ColorManager.style('CPU:', ['bold'])} Quantum i9-9999K (128) @ 4.2GHz`,
      `${ColorManager.style('GPU:', ['bold'])} Neural Graphics 4090 Ti`,
      `${ColorManager.style('Memory:', ['bold'])} 128GB / 256GB`,
      `${ColorManager.style('Local IP:', ['bold'])} 10.31.33.7`,
      `${ColorManager.style('System Status:', ['bold'])} ${ColorManager.style('Compromised', ['brightGreen', 'bold'])}`,
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
        ColorManager.style('Available commands:', ['bold', 'brightCyan']),
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
        ColorManager.style('  hack             - Initiate system hack sequence', ['brightGreen']),
        ColorManager.style('  exit, back       - Return to normal terminal', ['dim'])
      ],
      exitCode: 0
    };
  }

  private parseCommandLine(cmdLine: string): string[] {
    return cmdLine.trim().split(/\s+/).filter(Boolean);
  }

  public getPrompt(): string {
    return ColorManager.style(
      this.env.PS1
        .replace('\\u', this.env.USER)
        .replace('\\h', this.env.HOSTNAME)
        .replace('\\w', this.cwd.replace(this.env.HOME, '~'))
        .replace('\\$', this.env.USER === 'root' ? '#' : '$'),
      ['brightGreen']
    );
  }

  private pwd(): BackdoorCommandResult {
    return { output: [this.cwd], exitCode: 0 };
  }

  private cd(dir: string = this.env.HOME): BackdoorCommandResult {
    const target = dir.startsWith('/') ? dir : `${this.cwd}/${dir}`.replace(/\/+/g, '/');
    const entry = this.fs.resolvePath(target);
    
    if (!entry || entry.type !== 'directory') {
      return {
        output: [ColorManager.error(`cd: ${dir}: No such directory`)],
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
        output.push(ColorManager.error(`ls: cannot access '${path}': No such file or directory`));
        continue;
      }

      if (entry.type === 'directory') {
        const entries = this.fs.listDir(resolvedPath);
        entries.sort().forEach(name => {
          if (!options.all && name.startsWith('.')) return;
          const childEntry = this.fs.resolvePath(`${resolvedPath}/${name}`);
          if (childEntry) {
            const displayName = childEntry.type === 'directory' ? 
              ColorManager.style(name + '/', ['brightBlue', 'bold']) :
              name;
            output.push(options.long 
              ? this.fs.formatListing(childEntry, displayName)
              : displayName);
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
        output: [ColorManager.error('usage: cat [file...]')],
        exitCode: 1
      };
    }

    const output: string[] = [];
    let exitCode = 0;

    for (const path of args) {
      const resolvedPath = path.startsWith('/') ? path : `${this.cwd}/${path}`.replace(/\/+/g, '/');
      const content = this.fs.readFile(resolvedPath);
      
      if (content === null) {
        output.push(ColorManager.error(`cat: ${path}: No such file`));
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
      output: [ColorManager.style(this.env.USER, ['brightGreen'])],
      exitCode: 0
    };
  }

  private id(): BackdoorCommandResult {
    return {
      output: [
        ColorManager.style(
          `uid=1000(${this.env.USER}) gid=1000(${this.env.USER}) groups=1000(${this.env.USER})`,
          ['brightGreen']
        )
      ],
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
        output: [ColorManager.style(Object.values(info).join(' '), ['brightGreen'])],
        exitCode: 0
      };
    }

    return {
      output: [ColorManager.style(info.s, ['brightGreen'])],
      exitCode: 0
    };
  }

  private ps(): BackdoorCommandResult {
    const header = ColorManager.style('  PID TTY          TIME CMD', ['bold']);
    const processes = [
      '    1 ?        00:00:00 init',
      '  100 ?        00:00:01 systemd',
      '  432 pts/0    00:00:00 bash',
      '  433 pts/0    00:00:00 ps'
    ].map(line => ColorManager.style(line, ['dim']));

    return {
      output: [header, ...processes],
      exitCode: 0
    };
  }
}