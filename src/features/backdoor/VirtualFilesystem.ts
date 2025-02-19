import { VirtualFSEntry, VirtualFile, VirtualDirectory, PathResolutionOptions } from './types';

const INSTALL_GUIDE = `# Ubuntu Installation Guide

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
1. Find USB device:
   \`\`\`
   lsblk
   \`\`\`
2. Unmount if mounted:
   \`\`\`
   sudo umount /dev/sdX
   \`\`\`
3. Write ISO:
   \`\`\`
   sudo dd bs=4M if=ubuntu-22.04-desktop-amd64.iso of=/dev/sdX status=progress
   \`\`\`

## Step 3: BIOS/UEFI Setup
1. Restart computer
2. Enter BIOS (usually F2, F12, or Del)
3. Disable Secure Boot
4. Set USB as first boot device
5. Save and exit

## Step 4: Installation
1. Boot from USB
2. Select "Try or Install Ubuntu"
3. Choose your language
4. Select "Install Ubuntu"
5. Choose keyboard layout
6. Choose:
   - Normal installation
   - Download updates
   - Install third-party software
7. Installation type:
   - "Install alongside" (dual boot)
   - "Erase disk" (single OS)
   - "Something else" (manual partitioning)
8. Select timezone
9. Create user account
10. Wait for installation

## Step 5: Post-Install
1. Update system:
   \`\`\`
   sudo apt update
   sudo apt upgrade
   \`\`\`
2. Install essential packages:
   \`\`\`
   sudo apt install build-essential git curl wget
   \`\`\`
3. Install graphics drivers:
   \`\`\`
   ubuntu-drivers devices
   sudo ubuntu-drivers autoinstall
   \`\`\`
4. Configure firewall:
   \`\`\`
   sudo ufw enable
   \`\`\`

## Common Issues
1. Black screen: Add 'nomodeset' to kernel parameters
2. Wi-Fi not working: Install additional drivers
3. Grub not found: Boot-repair from live USB

## Security Tips
1. Enable automatic updates
2. Set up UFW firewall
3. Install ClamAV antivirus
4. Enable disk encryption
5. Regular system updates

## Useful Commands
1. System update:
   \`\`\`
   sudo apt update && sudo apt upgrade
   \`\`\`
2. Install package:
   \`\`\`
   sudo apt install package-name
   \`\`\`
3. Remove package:
   \`\`\`
   sudo apt remove package-name
   \`\`\`
4. System information:
   \`\`\`
   neofetch  # install first: sudo apt install neofetch
   \`\`\`

## Need Help?
- Ubuntu Forums: https://ubuntuforums.org
- Ask Ubuntu: https://askubuntu.com
- Ubuntu Wiki: https://wiki.ubuntu.com
- IRC: #ubuntu on Libera.Chat`;

export class VirtualFilesystem {
  private root: VirtualDirectory;

  constructor() {
    // Initialize root directory
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
    // Create basic directory structure
    this.mkdir('/bin');
    this.mkdir('/etc');
    this.mkdir('/home');
    this.mkdir('/home/hacker');
    this.mkdir('/var');
    this.mkdir('/var/log');
    this.mkdir('/usr');
    this.mkdir('/usr/local');
    this.mkdir('/etc/ssh');
    this.mkdir('/home/hacker/docs');

    // Create some initial files
    this.writeFile('/etc/hostname', 'matrix-defense-system\n');
    this.writeFile('/etc/passwd', 'root:x:0:0:root:/root:/bin/bash\nhacker:x:1000:1000:Matrix Hacker:/home/hacker:/bin/bash\n');
    this.writeFile('/home/hacker/.bashrc', '# ~/.bashrc\nPS1="\\u@\\h:\\w\\$ "\nPATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"\n');
    this.writeFile('/home/hacker/secret_plans.txt', 'TODO: Find a way to hack into the mainframe...\nNote: The system seems to be running on something called "The Matrix"?\n');
    this.writeFile('/home/hacker/docs/INSTALL.md', INSTALL_GUIDE);
  }

  public resolvePath(path: string, options: PathResolutionOptions = {}): VirtualFSEntry | null {
    const parts = path.split('/').filter(p => p !== '');
    let current: VirtualFSEntry = this.root;
    
    if (path.startsWith('/')) {
      // Absolute path
      current = this.root;
    } else {
      // Relative path - would need current working directory context
      // For now, treat as absolute
      current = this.root;
    }

    for (const part of parts) {
      if (part === '.' || part === '') continue;
      if (part === '..') {
        // Handle parent directory
        continue;
      }

      if (current.type !== 'directory') {
        return null;
      }

      const next = current.entries[part];
      if (!next) {
        if (options.createMissing) {
          // Create missing directories if specified
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