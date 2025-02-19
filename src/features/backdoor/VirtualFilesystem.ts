import { VirtualFSEntry, VirtualFile, VirtualDirectory, PathResolutionOptions } from './types';
import { HACKER_ART } from './art';

const virtualFiles: Record<string, string> = {
  "README.md": "# GRUX Terminal\n\nA retro-styled terminal interface with Matrix rain animation.\n\n## Features\n- Matrix-style digital rain\n- Basic terminal commands\n- Idle animation\n\n## Usage\nType \"help\" for available commands.",
  "config.json": "{\n  \"terminal\": {\n    \"theme\": \"matrix\",\n    \"fontSize\": 14,\n    \"idleTimeout\": 30000\n  }\n}",
  "Projects/hello.txt": "Hello from the virtual filesystem!\nThis is a simulated text file.",
  "etc/passwd": "root:x:0:0:Too late lamer:/root:/bin/grux\nneo:x:1337:1337:The One:/dev/matrix:/bin/zsh\nhacker:x:31337:31337:1337 D0Gz:/home/hack:/bin/bash\nmorpheus:x:101:101:Free your mind:/usr/local/matrix:/bin/red-pill\nsmith:x:666:666:Me...me...me...:/tmp/matrix:/bin/virus\ntank:x:102:102:Operator:/var/matrix/construct:/bin/load\ndozer:x:103:103:Not like this:/var/matrix/nebuchadnezzar:/bin/die\nswitch:x:104:104:Such a pretty face:/var/matrix/resistance:/bin/fight\nmouse:x:105:105:Everything is a test:/var/matrix/training:/bin/jump\ncypher:x:999:999:Ignorance is bliss:/tmp/steak:/bin/betray",
  "/etc/passwd": "root:x:0:0:Too late lamer:/root:/bin/grux\nneo:x:1337:1337:The One:/dev/matrix:/bin/zsh\nhacker:x:31337:31337:1337 D0Gz:/home/hack:/bin/bash\nmorpheus:x:101:101:Free your mind:/usr/local/matrix:/bin/red-pill\nsmith:x:666:666:Me...me...me...:/tmp/matrix:/bin/virus\ntank:x:102:102:Operator:/var/matrix/construct:/bin/load\ndozer:x:103:103:Not like this:/var/matrix/nebuchadnezzar:/bin/die\nswitch:x:104:104:Such a pretty face:/var/matrix/resistance:/bin/fight\nmouse:x:105:105:Everything is a test:/var/matrix/training:/bin/jump\ncypher:x:999:999:Ignorance is bliss:/tmp/steak:/bin/betray",
  "etc/shadow": "Access denied: Nice try! ;)",
  "/etc/shadow": "Access denied: Nice try! ;)",
  "home/hacker/docs/INSTALL.md": `# Ubuntu Installation Guide

## Prerequisites
- USB drive (8GB or larger)
- Backup of important data
- Internet connection

## Step 1: Download Ubuntu
1. Visit ubuntu.com/download/desktop
2. Download Ubuntu 22.04 LTS
3. Verify the checksum (SHA256)
   \`\`\`
   sha256sum ubuntu-22.04-desktop-amd64.iso
   \`\`\`

## Step 2: Create Bootable USB
### Using Rufus (Windows):
1. Download Rufus from rufus.ie
2. Insert USB drive
3. Select Ubuntu ISO
4. Click Start
5. Wait for completion

### Using Terminal (Linux/Mac):
\`\`\`bash
# Find USB device
lsblk
# Unmount if mounted
sudo umount /dev/sdX
# Write ISO
sudo dd bs=4M if=ubuntu-22.04-desktop-amd64.iso of=/dev/sdX status=progress
\`\`\`

## Step 3: BIOS Setup
1. Restart computer
2. Enter BIOS (F2/F12/Del)
3. Disable Secure Boot
4. Set USB first in boot order
5. Save and exit

## Step 4: Installation
1. Boot from USB
2. Choose "Install Ubuntu"
3. Follow the wizard
4. Set up partitions
5. Create user account
6. Wait for completion

## Step 5: Post-Install
\`\`\`bash
# Update system
sudo apt update
sudo apt upgrade

# Install essentials
sudo apt install build-essential git vim

# Set up firewall
sudo ufw enable

# Install graphics drivers
ubuntu-drivers autoinstall
\`\`\`

## Need Help?
- Ubuntu Forums
- Ask Ubuntu
- Wiki Ubuntu
- IRC: #ubuntu
`
};

const passwdAliases = [
  "etc/passwd",
  "/etc/passwd",
  "passwd",
  "/passwd",
  "../etc/passwd",
  "../../etc/passwd",
  "../../../etc/passwd",
  "../../../../etc/passwd",
  "/var/etc/passwd",
  "/var/passwd",
  "%2fetc%2fpasswd",
  "....//....//etc/passwd"
];

export class VirtualFilesystem {
  private root: VirtualDirectory;

  constructor() {
    this.root = {
      type: 'directory',
      entries: {},
      permissions: 'rwxr-xr-x',
      owner: 'root',
      group: 'root',
      modified: new Date()
    };

    // Initialize basic directory structure
    this.createBasicStructure();
  }

  private createBasicStructure() {
    // Create directories
    [
      '/bin',
      '/etc',
      '/home',
      '/home/hacker',
      '/var',
      '/var/log',
      '/usr',
      '/usr/local',
      '/etc/ssh',
      '/home/hacker/docs'
    ].forEach(dir => this.mkdir(dir));

    // Create files
    Object.entries(virtualFiles).forEach(([path, content]) => {
      this.writeFile(path, content);
    });
  }

  public resolvePath(path: string, options: PathResolutionOptions = {}): VirtualFSEntry | null {
    const parts = path.split('/').filter(p => p !== '');
    let current: VirtualFSEntry = this.root;
    
    if (path.startsWith('/')) {
      current = this.root;
    }

    for (const part of parts) {
      if (part === '.' || part === '') continue;
      if (part === '..') continue;

      if (current.type !== 'directory') {
        return null;
      }

      const next = current.entries[part];
      if (!next) {
        if (options.createMissing) {
          current.entries[part] = {
            type: 'directory',
            entries: {},
            permissions: 'rwxr-xr-x',
            owner: 'hacker',
            group: 'hacker',
            modified: new Date()
          };
          current = current.entries[part];
        } else {
          return null;
        }
      } else {
        current = next;
      }
    }

    return current;
  }

  public mkdir(path: string): boolean {
    const parent = this.resolvePath(this.getParentPath(path));
    if (!parent || parent.type !== 'directory') return false;

    const name = this.getBasename(path);
    if (parent.entries[name]) return false;

    parent.entries[name] = {
      type: 'directory',
      entries: {},
      permissions: 'rwxr-xr-x',
      owner: 'hacker',
      group: 'hacker',
      modified: new Date()
    };

    return true;
  }

  public writeFile(path: string, content: string): boolean {
    const parent = this.resolvePath(this.getParentPath(path));
    if (!parent || parent.type !== 'directory') return false;

    const name = this.getBasename(path);
    parent.entries[name] = {
      type: 'file',
      content,
      permissions: 'rw-r--r--',
      owner: 'hacker',
      group: 'hacker',
      size: content.length,
      modified: new Date()
    };

    return true;
  }

  public readFile(path: string): string | null {
    const entry = this.resolvePath(path);
    if (!entry || entry.type !== 'file') return null;
    return entry.content;
  }

  public listDir(path: string): string[] {
    const entry = this.resolvePath(path);
    if (!entry || entry.type !== 'directory') return [];
    return Object.keys(entry.entries);
  }

  public exists(path: string): boolean {
    return this.resolvePath(path) !== null;
  }

  private getParentPath(path: string): string {
    const parts = path.split('/');
    return parts.slice(0, -1).join('/') || '/';
  }

  private getBasename(path: string): string {
    const parts = path.split('/');
    return parts[parts.length - 1];
  }

  public formatListing(entry: VirtualFSEntry, name: string): string {
    if (entry.type === 'directory') {
      return `drwxr-xr-x ${entry.owner} ${entry.group} 4096 ${entry.modified.toLocaleString()} ${name}/`;
    } else {
      return `-${entry.permissions} ${entry.owner} ${entry.group} ${entry.size} ${entry.modified.toLocaleString()} ${name}`;
    }
  }
}