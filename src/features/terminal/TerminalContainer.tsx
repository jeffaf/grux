import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Terminal, IDisposable } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import { MatrixRain } from '../matrix';
import { VirtualLinuxEnvironment } from '../backdoor/VirtualLinuxEnvironment';
import { SGR, ColorManager } from './colors';
import { CompletionManager, BackdoorCommandProvider, PathCompletionProvider } from './completion';
import { CommandHistory } from './history';
import 'xterm/css/xterm.css';

const IDLE_TIMEOUT = 30000;

class TerminalLineReader {
  terminal: Terminal;
  buffer: string;
  onLine: (line: string) => void;
  private _dataSubscription: IDisposable | null;
  private _sgrHandler: IDisposable | null;
  private completionManager: CompletionManager;
  private history: CommandHistory;
  private cursorPosition: number = 0;

  constructor(terminal: Terminal, onLine: (line: string) => void, isBackdoorMode: boolean = false, virtualEnv?: VirtualLinuxEnvironment) {
    this.terminal = terminal;
    this.buffer = "";
    this.onLine = onLine;
    this._dataSubscription = this.terminal.onData(this.handleData);
    this.completionManager = new CompletionManager();
    this.history = new CommandHistory();

    // Add completion providers for backdoor mode
    if (isBackdoorMode && virtualEnv) {
      this.completionManager.registerProvider(new BackdoorCommandProvider(virtualEnv));
      this.completionManager.registerProvider(new PathCompletionProvider(virtualEnv.getFilesystem(), virtualEnv.getCurrentDirectory()));
    }

    // Add SGR sequence handler
    this._sgrHandler = this.terminal.parser.registerCsiHandler(
      { final: 'm' },
      (params) => {
        // Let default handler process color sequences
        return false;
      }
    );
  }

  private handleData = (data: string) => {
    const charCode = data.charCodeAt(0);
    
    // Handle special key sequences
    if (data.length > 1 && data.startsWith('')) {
      const remaining = data.slice(1);
      if (remaining === '[A') {  // Up arrow
        const historyCommand = this.history.back(this.buffer);
        if (historyCommand !== undefined) {
          this.updateBufferContent(historyCommand);
        }
        return;
      } else if (remaining === '[B') {  // Down arrow
        const historyCommand = this.history.forward();
        this.updateBufferContent(historyCommand);
        return;
      }
    }

    // Handle Enter key
    if (data === "\r" || data === "\n") {
      this.terminal.write("\r\n");
      if (this.buffer.trim()) {
        this.history.add(this.buffer);
      }
      this.onLine(this.buffer);
      this.buffer = "";
      this.cursorPosition = 0;
      return;
    }

    // Handle backspace/delete
    if (charCode === 127 || charCode === 8 || data === "\b") {
      if (this.buffer.length > 0 && this.cursorPosition > 0) {
        this.terminal.write("\b \b");
        this.buffer = this.buffer.slice(0, -1);
        this.cursorPosition--;
      }
      return;
    }

    // Handle TAB key
    if (charCode === 9) {
      this.handleTabCompletion();
      return;
    }

    // Handle Ctrl+C
    if (charCode === 3) {
      this.terminal.write("^C\r\n");
      this.buffer = "";
      this.cursorPosition = 0;
      this.history.reset();
      this.terminal.write("grux> ");
      return;
    }

    // Handle printable characters
    if (data >= " " && data <= "~") {
      this.terminal.write(data);
      this.buffer += data;
      this.cursorPosition++;
    }
  };

  private updateBufferContent(newContent: string): void {
    // Clear current line
    const clearLine = "\r" + " ".repeat(this.buffer.length + 6) + "\r"; // 6 = "grux> ".length
    this.terminal.write(clearLine);
    this.terminal.write("grux> " + newContent);
    this.buffer = newContent;
    this.cursorPosition = newContent.length;
  }

  private handleTabCompletion = () => {
    const result = this.completionManager.complete(this.buffer, this.cursorPosition);

    if (result.matches.length === 0) {
      // No matches - bell sound
      this.terminal.write('');
      return;
    }

    if (result.matches.length === 1) {
      // Single match - complete the word
      this.terminal.write('\r\n');
      this.buffer = result.prefix || result.matches[0];
      this.cursorPosition = this.buffer.length;
      this.terminal.write(this.buffer);
      return;
    }

    // Multiple matches - show options
    const display = this.completionManager.formatCompletionDisplay(result);
    this.terminal.write('\r\n');
    display.forEach(line => this.terminal.writeln(line));

    // Rewrite the prompt and current input
    this.terminal.write('grux> ' + this.buffer);

    // If there's a common prefix, extend the input
    if (result.prefix && result.prefix.length > this.buffer.length) {
      const extension = result.prefix.slice(this.buffer.length);
      this.terminal.write(extension);
      this.buffer += extension;
      this.cursorPosition = this.buffer.length;
    }
  };

  updateBackdoorMode(isBackdoorMode: boolean, virtualEnv?: VirtualLinuxEnvironment) {
    this.completionManager = new CompletionManager();
    if (isBackdoorMode && virtualEnv) {
      this.completionManager.registerProvider(new BackdoorCommandProvider(virtualEnv));
      this.completionManager.registerProvider(new PathCompletionProvider(virtualEnv.getFilesystem(), virtualEnv.getCurrentDirectory()));
    }
  }

  dispose() {
    if (this._dataSubscription) {
      this._dataSubscription.dispose();
      this._dataSubscription = null;
    }
    if (this._sgrHandler) {
      this._sgrHandler.dispose();
      this._sgrHandler = null;
    }
  }
}

const TerminalContainer: React.FC = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminal = useRef<Terminal | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);
  const matrixRain = useRef<MatrixRain | null>(null);
  const lineReader = useRef<TerminalLineReader | null>(null);
  const mouseMoveHandler = useRef<(() => void) | null>(null);
  const virtualEnv = useRef<VirtualLinuxEnvironment | null>(null);
  
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityTime = useRef<number>(Date.now());
  const [isTerminalReady, setIsTerminalReady] = useState(false);
  const [isBackdoorMode, setIsBackdoorMode] = useState(false);

  const writeLines = useCallback((lines: string[], addPrompt: boolean = true) => {
    if (!terminal.current) return;
    lines.forEach(line => terminal.current!.writeln(line));
    if (addPrompt) {
      if (isBackdoorMode && virtualEnv.current) {
        terminal.current.write(virtualEnv.current.getPrompt());
      } else {
        terminal.current.write(SGR.green + "grux> " + SGR.reset);
      }
    }
  }, [isBackdoorMode]);

  const resetIdleTimer = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    lastActivityTime.current = Date.now();
    idleTimer.current = setTimeout(() => {
      if (!matrixRain.current?.isRunning && terminal.current) {
        startMatrixRain();
      }
    }, IDLE_TIMEOUT);
  }, []);

  const startMatrixRain = useCallback(() => {
    if (!terminal.current || matrixRain.current?.isRunning || !isTerminalReady) return;

    try {
      matrixRain.current = new MatrixRain(terminal.current!, {
        columns: terminal.current!.cols,
        rows: terminal.current!.rows,
      });
      terminal.current!.options.cursorBlink = false;
      matrixRain.current.start();
    } catch (error) {
      console.error("[Matrix] Error:", error);
    }
  }, [isTerminalReady]);

  const stopMatrixRain = useCallback(() => {
    if (!matrixRain.current) return;

    matrixRain.current.stop();
    matrixRain.current.cleanup();
    matrixRain.current = null;

    if (terminal.current) {
      terminal.current.options.cursorBlink = true;
      terminal.current.clear();
      writeLines([SGR.green + "Matrix rain stopped" + SGR.reset]);
    }
    resetIdleTimer();
  }, [writeLines, resetIdleTimer]);

  // Comprehensive monkey patch for xterm.js dimensions issue
  const monkeyPatchTerminal = useCallback((term: Terminal) => {
    try {
      // @ts-ignore - Accessing internal property to apply monkey patch
      const core = term._core;
      if (!core) return;

      console.log("Applying comprehensive terminal monkey patch");

      // 1. Patch the renderService dimensions
      if (core.renderer?._renderService && !core.renderer._renderService.dimensions) {
        // @ts-ignore - Create a minimal dimensions object to prevent errors
        core.renderer._renderService.dimensions = {
          device: {
            cell: { width: 9, height: 17 },
            canvas: { width: 800, height: 600 }
          },
          actualCellWidth: 9,
          actualCellHeight: 17
        };
      }

      // 2. Patch the Viewport._innerRefresh method to handle missing dimensions
      if (core.viewport) {
        // @ts-ignore - Save the original method
        const originalInnerRefresh = core.viewport._innerRefresh;
        
        // @ts-ignore - Replace with our safe version
        core.viewport._innerRefresh = function() {
          try {
            // @ts-ignore - Check if renderService exists
            if (!this._renderService) return;
            
            // @ts-ignore - Check if dimensions exists
            if (!this._renderService.dimensions) {
              // @ts-ignore - Create dimensions if missing
              this._renderService.dimensions = {
                device: {
                  cell: { width: 9, height: 17 },
                  canvas: { width: 800, height: 600 }
                },
                actualCellWidth: 9,
                actualCellHeight: 17
              };
            }
            
            // Call original with try/catch
            try {
              originalInnerRefresh.apply(this);
            } catch (e) {
              console.warn("Error in original _innerRefresh:", e);
            }
          } catch (e) {
            console.warn("Error in patched _innerRefresh:", e);
          }
        };
      }
    } catch (e) {
      console.warn("Failed to apply terminal monkey patch:", e);
    }
  }, []);

  const enterBackdoorMode = useCallback(() => {
    if (!terminal.current || !isTerminalReady) return;

    // Make sure Matrix Rain is stopped before entering backdoor mode
    if (matrixRain.current?.isRunning) {
      stopMatrixRain();
    }

    try {
      // Apply comprehensive monkey patch to prevent dimensions error
      if (terminal.current) {
        monkeyPatchTerminal(terminal.current);
      }
      
      // Create virtual environment
      virtualEnv.current = new VirtualLinuxEnvironment();
      setIsBackdoorMode(true);
      
      // Clear the terminal safely
      try {
        terminal.current.clear();
      } catch (error) {
        console.error("[Terminal] Error clearing terminal:", error);
      }
      
      // Write the welcome message
      writeLines([
        SGR.brightGreen + "ACCESS GRANTED" + SGR.reset,
        SGR.green + "Welcome to the Matrix Defense System" + SGR.reset,
        SGR.dim + "Initializing secure shell..." + SGR.reset,
        SGR.dim + "Connecting to mainframe..." + SGR.reset,
        SGR.brightGreen + "Connected." + SGR.reset,
        "",
        "Type 'help' for available commands.",
        SGR.dim + "TIP: Check out the installation guide at ~/docs/INSTALL.md" + SGR.reset,
        ""
      ], false);

      // Write the prompt and focus
      if (terminal.current && virtualEnv.current) {
        terminal.current.write(virtualEnv.current.getPrompt());
        terminal.current.focus();
      }

      // Update line reader with backdoor mode
      if (lineReader.current && virtualEnv.current) {
        lineReader.current.updateBackdoorMode(true, virtualEnv.current);
      }
    } catch (error) {
      console.error("[Terminal] Error initializing backdoor:", error);
      writeLines([
        SGR.brightRed + "Error entering backdoor mode" + SGR.reset,
        SGR.red + String(error) + SGR.reset
      ]);
      setIsBackdoorMode(false);
      virtualEnv.current = null;
    }
  }, [writeLines, stopMatrixRain, isTerminalReady, monkeyPatchTerminal]);

  const executeCommand = useCallback((input: string) => {
    if (!terminal.current) return;

    const cmd = input.trim();
    if (!cmd) {
      if (isBackdoorMode && virtualEnv.current) {
        terminal.current.write(virtualEnv.current.getPrompt());
      } else {
        terminal.current.write(SGR.green + "grux> " + SGR.reset);
      }
      terminal.current.focus();
      return;
    }

    if (isBackdoorMode && virtualEnv.current) {
      try {
        const result = virtualEnv.current.execCommand(cmd);
        
        if (result.shouldExit) {
          setIsBackdoorMode(false);
          virtualEnv.current = null;
          terminal.current.clear();
          writeLines([SGR.green + 'Returned to GRUX Terminal.' + SGR.reset], true);
          terminal.current.focus();

          // Update line reader mode
          if (lineReader.current) {
            lineReader.current.updateBackdoorMode(false);
          }
        } else if (result.delayedOutput) {
          (async () => {
            for (const line of result.output) {
              if (line.includes('INITIATING') || line.includes('ACCESSING') ||
                  line.includes('BYPASSING') || line.includes('COMPROMISED')) {
                for (let i = 0; i < line.length; i++) {
                  terminal.current?.write(line[i]);
                  await new Promise(resolve => setTimeout(resolve, 50));
                }
                terminal.current?.write('\r\n');
                await new Promise(resolve => setTimeout(resolve, 500));
              } else {
                terminal.current?.writeln(line);
              }
            }
            terminal.current?.write(virtualEnv.current?.getPrompt() || '');
            terminal.current?.focus();
          })();
        } else {
          // Make sure we handle possibly empty output arrays
          if (result.output && result.output.length > 0) {
            writeLines(result.output, true);
          } else {
            // Just write the prompt for empty output
            terminal.current.write(virtualEnv.current.getPrompt());
          }
          terminal.current.focus();
        }
      } catch (error) {
        console.error("[Terminal] Error executing command:", error);
        writeLines([ColorManager.style(`Error: ${error.message}`, ['brightRed'])], true);
        terminal.current.focus();
      }
      return;
    }

    if (cmd.toLowerCase() === 'backdoor') {
      enterBackdoorMode();
      return;
    }

    let showPrompt = true;
    switch (cmd.toLowerCase()) {
      case "help":
        writeLines([
          SGR.brightGreen + "Available commands:" + SGR.reset,
          "  help              - Show this help message",
          "  ls, dir          - List files in current directory",
          "  cat [file]       - Display contents of a file",
          "  clear            - Clear the terminal screen",
          "  echo [text]      - Display text in terminal",
          "  version          - Show terminal version",
          "  matrix           - Start Matrix rain animation",
          "  matrix speed     - Set matrix animation speed (0.1-2.0)",
          "  matrix density   - Set raindrop density (0.1-1.0)",
          "  stop             - Stop Matrix rain animation",
          "  exit             - Clear screen and reset terminal",
        ], false);
        break;
      case "ls":
      case "dir":
        writeLines([
          SGR.brightBlue + "Documents/" + SGR.reset,
          SGR.brightBlue + "Downloads/" + SGR.reset,
          SGR.brightBlue + "Projects/" + SGR.reset,
          "README.md",
          "config.json"
        ], false);
        break;
      case "clear":
        terminal.current.clear();
        break;
      case "echo":
        const args = cmd.split(/\s+/).slice(1);
        writeLines([args.join(" ")], false);
        break;
      case "version":
        writeLines([SGR.brightGreen + "GRUX Terminal v1.0.0" + SGR.reset], false);
        break;
      case "matrix":
        if (cmd.includes("speed")) {
          const speed = parseFloat(cmd.split(/\s+/)[2]);
          if (!isNaN(speed) && speed >= 0.1 && speed <= 2.0 && matrixRain.current) {
            matrixRain.current.updateConfig({ animationSpeed: speed });
            writeLines([SGR.green + `Matrix speed set to ${speed}` + SGR.reset]);
          } else {
            writeLines([SGR.brightRed + "Invalid speed value. Use a number between 0.1 and 2.0" + SGR.reset]);
          }
        } else if (cmd.includes("density")) {
          const density = parseFloat(cmd.split(/\s+/)[2]);
          if (!isNaN(density) && density >= 0.1 && density <= 1.0 && matrixRain.current) {
            matrixRain.current.updateConfig({ density });
            writeLines([SGR.green + `Matrix density set to ${density}` + SGR.reset]);
          } else {
            writeLines([SGR.brightRed + "Invalid density value. Use a number between 0.1 and 1.0" + SGR.reset]);
          }
        } else {
          startMatrixRain();
          showPrompt = false;
        }
        break;
      case "stop":
        stopMatrixRain();
        break;
      case "exit":
        terminal.current.clear();
        writeLines([SGR.green + "Terminal reset." + SGR.reset], false);
        break;
      default:
        writeLines([SGR.brightRed + `Command not found: ${cmd.split(/\s+/)[0]}` + SGR.reset]);
    }
    
    if (showPrompt) {
      if (isBackdoorMode && virtualEnv.current) {
        terminal.current.write(virtualEnv.current.getPrompt());
      } else {
        terminal.current.write(SGR.green + "grux> " + SGR.reset);
      }
      terminal.current.focus();
    }
  }, [writeLines, startMatrixRain, stopMatrixRain, isBackdoorMode, enterBackdoorMode]);

  useEffect(() => {
    const initializeTerminal = async () => {
      terminal.current = new Terminal({
        rows: 24,
        cols: 80,
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        fontSize: 14,
        theme: {
          background: "#000000",
          foreground: "#33ff33",
          cursor: "#33ff33",
          black: "#000000",
          red: "#C51E14",
          green: "#1DC121",
          yellow: "#C7C329",
          blue: "#0A2FC4",
          magenta: "#C839C5",
          cyan: "#20C5C6",
          white: "#C7C7C7",
          brightBlack: "#686868",
          brightRed: "#FD6F6B",
          brightGreen: "#67F86F",
          brightYellow: "#FFFA72",
          brightBlue: "#6A76FB",
          brightMagenta: "#FD7CFC",
          brightCyan: "#68FDFE",
          brightWhite: "#FFFFFF"
        },
        cursorBlink: true,
        allowTransparency: true,
      });

      fitAddon.current = new FitAddon();
      terminal.current.loadAddon(fitAddon.current);

      if (terminalRef.current) {
        terminal.current.open(terminalRef.current);
        
        terminal.current.onResize(({ cols, rows }) => {
          if (matrixRain.current) {
            matrixRain.current.resize(cols, rows);
          }
        });

        terminal.current.onKey(() => {
          if (matrixRain.current?.isRunning) {
            stopMatrixRain();
          }
        });

        mouseMoveHandler.current = () => {
          if (matrixRain.current?.isRunning) {
            stopMatrixRain();
          }
        };
        terminalRef.current.addEventListener("mousemove", mouseMoveHandler.current);

        // Simple terminal initialization
        try {
          // First animation frame to ensure terminal is in DOM
          await new Promise(resolve => requestAnimationFrame(resolve));
          
          // Perform initial fit
          if (fitAddon.current) {
            fitAddon.current.fit();
          }
          
          // Second animation frame to allow fit to complete
          await new Promise(resolve => requestAnimationFrame(resolve));
          
          // Apply monkey patch to prevent dimensions error
          if (terminal.current) {
            monkeyPatchTerminal(terminal.current);
          }
          
          // Mark terminal as ready
          setIsTerminalReady(true);
          
          // Write welcome message
          writeLines([
            SGR.brightGreen + "Welcome to GRUX Terminal!" + SGR.reset,
            'Type "help" for a list of available commands.',
            ""
          ]);
          
          // Create line reader
          if (terminal.current) {
            lineReader.current = new TerminalLineReader(terminal.current, executeCommand);
            terminal.current.focus();
          }
          
          // Start idle timer
          resetIdleTimer();
        } catch (error) {
          console.error("[Terminal] Error during initialization:", error);
        }
      }
    };

    initializeTerminal().catch(console.error);
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      if (matrixRain.current) matrixRain.current.cleanup();
      if (fitAddon.current) fitAddon.current.dispose();
      if (lineReader.current) lineReader.current.dispose();
      if (terminal.current) terminal.current.dispose();
      if (terminalRef.current && mouseMoveHandler.current) {
        terminalRef.current.removeEventListener("mousemove", mouseMoveHandler.current);
      }
    };
  }, [writeLines, executeCommand, resetIdleTimer, stopMatrixRain, monkeyPatchTerminal]);

  return (
    <div style={containerStyle} onClick={() => terminal.current?.focus()}>
      <div ref={terminalRef} style={terminalStyle} />
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: '#000',
  display: 'flex',
  flexDirection: 'column',
};

const terminalStyle: React.CSSProperties = {
  flex: 1,
  padding: '10px',
  minHeight: '400px',
  minWidth: '600px',
  boxSizing: 'border-box',
  backgroundColor: '#000',
  overflow: 'hidden',
};

export default TerminalContainer;
