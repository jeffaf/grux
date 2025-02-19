// Types for virtual filesystem entries
export interface VirtualFile {
  type: 'file';
  content: string;
  permissions: string; // e.g., "rwxr-xr-x"
  owner: string;
  group: string;
  size: number;
  modified: Date;
}

export interface VirtualDirectory {
  type: 'directory';
  entries: Record<string, VirtualFSEntry>;
  permissions: string;
  owner: string;
  group: string;
  modified: Date;
}

export type VirtualFSEntry = VirtualFile | VirtualDirectory;

// Interface for command processors
export interface CommandProcessor {
  execute(args: string[]): string[];
}

// Environment variables type
export type EnvVars = Record<string, string>;

// Command output type
export interface CommandResult {
  output: string[];
  error?: string;
  exitCode: number;
}

// Options for ls command
export interface LsOptions {
  all: boolean;      // -a show hidden files
  long: boolean;     // -l long format
  human: boolean;    // -h human readable sizes
}

// Options for grep command
export interface GrepOptions {
  ignoreCase: boolean;  // -i
  lineNumber: boolean;  // -n
  count: boolean;       // -c
}

// Path resolution options
export interface PathResolutionOptions {
  followSymlinks?: boolean;
  createMissing?: boolean;
  mustExist?: boolean;
}