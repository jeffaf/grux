import { VirtualFSEntry, VirtualFile, VirtualDirectory, PathResolutionOptions } from './types';

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

    // Create some initial files
    this.writeFile('/etc/hostname', 'matrix-defense-system\n');
    this.writeFile('/etc/passwd', 'root:x:0:0:root:/root:/bin/bash\nhacker:x:1000:1000:Matrix Hacker:/home/hacker:/bin/bash\n');
    this.writeFile('/home/hacker/.bashrc', '# ~/.bashrc\nPS1="\\u@\\h:\\w\\$ "\nPATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"\n');
    this.writeFile('/home/hacker/secret_plans.txt', 'TODO: Find a way to hack into the mainframe...\nNote: The system seems to be running on something called "The Matrix"?\n');
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