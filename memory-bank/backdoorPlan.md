# Backdoor Mode Implementation Plan

## Overview
Create a fake Ubuntu environment that users can explore when they discover the hidden "backdoor" command. This will add an extra layer of fun and interactivity to the terminal.

## Components

### 1. Virtual Filesystem Structure
```
/
├── bin/
├── etc/
│   ├── passwd
│   ├── hostname
│   ├── shadow
│   └── ssh/
├── home/
│   └── hacker/
│       ├── .bashrc
│       ├── .bash_history
│       └── secret_plans.txt
├── var/
│   └── log/
└── usr/
    └── local/
```

### 2. State Management
- Current working directory
- Environment variables (PATH, HOME, USER, etc.)
- Command history
- Previous command output for pipelines

### 3. Core Commands
```
Basic Navigation:
- pwd: Show current directory
- cd: Change directory
- ls: List files (with -l, -a options)

File Operations:
- cat: Display file contents
- less/more: Page through files
- head/tail: Show file portions
- grep: Search file contents
- find: Search for files

System Info:
- uname: Show system info
- whoami: Show current user
- id: Show user ID info
- ps: List processes
- hostname: Show system name
- echo: Display text/variables
```

### 4. Environment Details
```
Hostname: matrix-defense-system
Username: hacker
Shell: /bin/bash
Default Path: /home/hacker
```

### 5. Interesting Content

Hidden Files:
- /etc/shadow (with encrypted passwords)
- /home/hacker/.bash_history (with interesting commands)
- /var/log/auth.log (with login attempts)
- /etc/ssh/id_rsa (private key)

Easter Eggs:
- Hidden messages in comments
- References to The Matrix
- Fake vulnerability hints
- Secret directories

## Implementation Steps

1. Create VirtualLinuxEnvironment class:
```typescript
class VirtualLinuxEnvironment {
  private cwd: string;
  private env: Record<string, string>;
  private fs: VirtualFilesystem;
  
  constructor() {
    this.cwd = '/home/hacker';
    this.env = {
      HOME: '/home/hacker',
      USER: 'hacker',
      SHELL: '/bin/bash',
      PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
      PS1: '\\u@\\h:\\w\\$ '
    };
  }
  
  // Command handlers
  execCommand(cmd: string, args: string[]): string;
  
  // Path resolution
  resolvePath(path: string): string;
  
  // Environment management
  getEnv(key: string): string;
  setEnv(key: string, value: string): void;
}
```

2. Implement virtual filesystem with proper path handling

3. Add command processors:
```typescript
interface CommandProcessor {
  execute(args: string[]): string;
}

class LsCommand implements CommandProcessor {
  execute(args: string[]): string;
}

class CdCommand implements CommandProcessor {
  execute(args: string[]): string;
}

// etc.
```

4. Add backdoor mode to TerminalContainer:
```typescript
const enterBackdoorMode = () => {
  const env = new VirtualLinuxEnvironment();
  writeLines(["Access granted. Welcome to the Matrix Defense System."]);
  // Change prompt and command handling
};
```

5. Create interesting content and easter eggs

## Timeline
1. Basic filesystem and navigation (2 hours)
2. Core command implementation (3 hours)
3. State management (2 hours)
4. Content creation (2 hours)
5. Testing and polish (1 hour)

## Future Enhancements
- Command piping (e.g., ls | grep)
- More complex commands (vim, nano)
- File permissions system
- Process simulation
- Network command simulation