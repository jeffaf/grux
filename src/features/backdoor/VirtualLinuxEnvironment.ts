// ... [Previous imports and interface remain the same]

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

  // ... [Rest of the implementation remains the same]