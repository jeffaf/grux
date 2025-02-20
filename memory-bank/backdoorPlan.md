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
- Tab completion state
- Color output settings

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

New Hackable Commands:
- hack: Execute system penetration (with color output)
- scan: Network scanning simulation
- decrypt: Password cracking simulation
```

### 4. Environment Details
```
Hostname: matrix-defense-system
Username: hacker
Shell: /bin/bash
Default Path: /home/hacker
```

### 5. Enhanced Features

#### Tab Completion
- Command completion
- File/directory path completion
- Command option completion
- Custom completion for special commands (hack, scan, decrypt)

Implementation:
```typescript
interface CompletionProvider {
  getCompletions(input: string): string[];
  getPriority(): number;
}

class CommandCompletionProvider implements CompletionProvider {
  getCompletions(input: string): string[] {
    // Return matching commands
  }
}

class PathCompletionProvider implements CompletionProvider {
  getCompletions(input: string): string[] {
    // Return matching paths
  }
}
```

#### Color Output System
Using xterm.js parser hooks for enhanced color rendering:
```typescript
// Color sequence handler
const colorHandler = terminal.parser.registerCsiHandler(
  {final: 'm'},
  (params) => {
    // Handle custom color sequences
    return false; // Allow default handler
  }
);

// Example color sequences
const colors = {
  error: '\x1b[31m', // Red
  success: '\x1b[32m', // Green
  info: '\x1b[36m',  // Cyan
  reset: '\x1b[0m'
};
```

#### Custom Parser Hooks
```typescript
// Progress indicator sequence
const progressHandler = terminal.parser.registerDcsHandler(
  {prefix: 'P', final: 'p'},
  (params, data) => {
    // Handle progress updates
    return true;
  }
);

// System status sequence
const statusHandler = terminal.parser.registerOscHandler(
  1337, // Custom status code
  (data) => {
    // Update system status
    return true;
  }
);
```

### 6. Interesting Content

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
- Color-coded access levels
- Progress bars in hack attempts

## Implementation Steps

1. Create VirtualLinuxEnvironment class with enhanced features:
```typescript
class VirtualLinuxEnvironment {
  private cwd: string;
  private env: Record<string, string>;
  private fs: VirtualFilesystem;
  private completionManager: CompletionManager;
  private colorManager: ColorManager;
  
  constructor() {
    this.cwd = '/home/hacker';
    this.env = {
      HOME: '/home/hacker',
      USER: 'hacker',
      SHELL: '/bin/bash',
      PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
      PS1: '\\u@\\h:\\w\\$ ',
      TERM: 'xterm-256color'
    };
  }
  
  // Enhanced command handling
  execCommand(cmd: string, args: string[]): CommandResult;
  
  // Tab completion
  getCompletions(input: string): string[];
  
  // Path resolution with cache
  resolvePath(path: string): string;
  
  // Environment management
  getEnv(key: string): string;
  setEnv(key: string, value: string): void;
  
  // Color output helpers
  formatOutput(text: string, type: 'error' | 'success' | 'info'): string;
}
```

2. Implement enhanced virtual filesystem with completion support
3. Add command processors with color output
4. Implement tab completion system
5. Set up parser hooks for special sequences
6. Create interesting content and easter eggs
7. Add visual improvements for hack commands

## Timeline
1. Basic filesystem and navigation (2 hours)
2. Core command implementation (3 hours)
3. Tab completion system (2 hours)
4. Color output and parser hooks (2 hours)
5. Content creation (2 hours)
6. Testing and polish (2 hours)

## Future Enhancements
- Command piping (e.g., ls | grep)
- More complex commands (vim, nano)
- File permissions system
- Process simulation
- Network command simulation
- Real-time system monitoring
- Multiple terminal sessions
- Custom completion providers
- Command suggestions based on history