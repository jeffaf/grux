import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Terminal, IDisposable } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import { MatrixRain } from '../matrix';
import { VirtualLinuxEnvironment } from '../backdoor/VirtualLinuxEnvironment';
import 'xterm/css/xterm.css';

const IDLE_TIMEOUT = 30000;

class TerminalLineReader {
  terminal: Terminal;
  buffer: string;
  onLine: (line: string) => void;
  private _dataSubscription: IDisposable | null;

  constructor(terminal: Terminal, onLine: (line: string) => void) {
    this.terminal = terminal;
    this.buffer = "";
    this.onLine = onLine;
    this._dataSubscription = this.terminal.onData(this.handleData);
  }

  private handleData = (data: string) => {
    const charCode = data.charCodeAt(0);
    
    // Debug logging
    console.log('[LineReader] Received:', {
      data,
      charCode,
      buffer: this.buffer
    });

    // Handle Enter
    if (data === "\r" || data === "\n") {
      this.terminal.write("\r\n");
      this.onLine(this.buffer);
      this.buffer = "";
      return;
    }

    // Handle backspace/delete (various codes that different systems might send)
    if (charCode === 127 || charCode === 8 || data === "\b" || data === "" || data === "") {
      if (this.buffer.length > 0) {
        this.terminal.write("\b \b"); // move back, clear character, move back again
        this.buffer = this.buffer.slice(0, -1);
        console.log('[LineReader] After backspace:', this.buffer);
      }
      return;
    }

    // Handle printable characters
    if (data >= " " && data <= "~") {
      this.terminal.write(data);
      this.buffer += data;
    }
  };

  dispose() {
    this._dataSubscription?.dispose();
    this._dataSubscription = null;
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

  const enterBackdoorMode = useCallback(() => {
    if (!terminal.current) return;
    
    // Set focus first
    terminal.current.focus();
    
    virtualEnv.current = new VirtualLinuxEnvironment();
    setIsBackdoorMode(true);
    terminal.current.clear();
    writeLines([
      "ACCESS GRANTED",
      "Welcome to the Matrix Defense System",
      "Initializing secure shell...",
      "Connecting to mainframe...",
      "Connected.",
      "",
      "Type 'help' for available commands.",
      "TIP: Check out the installation guide at ~/docs/INSTALL.md",
      ""
    ], false);
    terminal.current.write(virtualEnv.current.getPrompt());
  }, []);

  const writeLines = useCallback((lines: string[], addPrompt: boolean = true) => {
    if (!terminal.current) return;
    lines.forEach(line => terminal.current!.writeln(line));
    if (addPrompt) {
      if (isBackdoorMode && virtualEnv.current) {
        terminal.current.write(virtualEnv.current.getPrompt());
      } else {
        terminal.current.write("grux> ");
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
    console.log("[Matrix] Starting", {
      terminal: !!terminal.current,
      isReady: isTerminalReady,
      isRunning: matrixRain.current?.isRunning,
    });

    if (!terminal.current || matrixRain.current?.isRunning || !isTerminalReady) {
      console.log("[Matrix] Cannot start - conditions not met");
      return;
    }

    try {
      matrixRain.current = new MatrixRain(terminal.current!, {
        columns: terminal.current!.cols,
        rows: terminal.current!.rows,
      });
      terminal.current!.options.cursorBlink = false;
      matrixRain.current.start();
      console.log("[Matrix] Started");
    } catch (error) {
      console.error("[Matrix] Error:", error);
    }
  }, [isTerminalReady]);

  const stopMatrixRain = useCallback(() => {
    if (!matrixRain.current) return;

    console.log("[Matrix] Stopping");
    matrixRain.current.stop();
    matrixRain.current.cleanup();
    matrixRain.current = null;

    if (terminal.current) {
      terminal.current!.options.cursorBlink = true;
      terminal.current!.clear();
      writeLines(["Matrix rain stopped"]);
    }
    resetIdleTimer();
  }, [writeLines, resetIdleTimer]);

  const executeCommand = useCallback((input: string) => {
    if (!terminal.current) return;

    console.log("[Terminal] Execute command:", input);
    const cmd = input.trim();
    if (!cmd) {
      if (isBackdoorMode && virtualEnv.current) {
        terminal.current.write(virtualEnv.current.getPrompt());
      } else {
        terminal.current.write("grux> ");
      }
      return;
    }

    if (isBackdoorMode && virtualEnv.current) {
      const result = virtualEnv.current.execCommand(cmd);
      if (result.shouldExit) {
        setIsBackdoorMode(false);
        virtualEnv.current = null;
        terminal.current.clear();
        writeLines(['Returned to GRUX Terminal.']);
        terminal.current.focus();
      } else if (result.delayedOutput) {
        // Handle delayed output with typing effect
        (async () => {
          for (const line of result.output) {
            if (line.includes('INITIATING') || line.includes('ACCESSING') || 
                line.includes('BYPASSING') || line.includes('COMPROMISED')) {
              // Type each character of the status messages
              for (let i = 0; i < line.length; i++) {
                terminal.current?.write(line[i]);
                await new Promise(resolve => setTimeout(resolve, 50));
              }
              terminal.current?.write('\r\n');
              await new Promise(resolve => setTimeout(resolve, 500));
            } else {
              // Print ASCII art lines instantly
              terminal.current?.writeln(line);
            }
          }
          terminal.current?.write(virtualEnv.current?.getPrompt() || '');
          terminal.current?.focus();
        })();
      } else {
        writeLines(result.output, true);
      }
      return;
    }

    // Special hidden command to enter backdoor mode
    if (cmd.toLowerCase() === 'backdoor') {
      enterBackdoorMode();
      return;
    }

    let showPrompt = true;
    switch (cmd.toLowerCase()) {
      case "help":
        writeLines(
          [
            "Available commands:",
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
          ],
          false
        );
        break;
      case "ls":
      case "dir":
        writeLines(
          ["Documents/", "Downloads/", "Projects/", "README.md", "config.json"],
          false
        );
        break;
      case "clear":
        terminal.current!.clear();
        break;
      case "echo":
        const args = cmd.split(/\s+/).slice(1);
        writeLines([args.join(" ")], false);
        break;
      case "version":
        writeLines(["GRUX Terminal v1.0.0"], false);
        break;
      case "matrix":
        if (cmd.includes("speed")) {
          const speed = parseFloat(cmd.split(/\s+/)[2]);
          if (!isNaN(speed) && speed >= 0.1 && speed <= 2.0 && matrixRain.current) {
            matrixRain.current.updateConfig({ animationSpeed: speed });
            writeLines([`Matrix speed set to ${speed}`]);
          } else {
            writeLines(["Invalid speed value. Use a number between 0.1 and 2.0"]);
          }
        } else if (cmd.includes("density")) {
          const density = parseFloat(cmd.split(/\s+/)[2]);
          if (!isNaN(density) && density >= 0.1 && density <= 1.0 && matrixRain.current) {
            matrixRain.current.updateConfig({ density });
            writeLines([`Matrix density set to ${density}`]);
          } else {
            writeLines(["Invalid density value. Use a number between 0.1 and 1.0"]);
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
        terminal.current!.clear();
        writeLines(["Terminal reset."], false);
        break;
      default:
        writeLines([`Command not found: ${cmd.split(/\s+/)[0]}`]);
    }
    
    if (showPrompt) {
      terminal.current!.write("grux> ");
    }
  }, [writeLines, startMatrixRain, stopMatrixRain, isBackdoorMode, enterBackdoorMode]);

  useEffect(() => {
    const initializeTerminal = async () => {
      console.log("[Terminal] Initializing...");
      terminal.current = new Terminal({
        rows: 24,
        cols: 80,
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        fontSize: 14,
        theme: {
          background: "#000000",
          foreground: "#33ff33",
          cursor: "#33ff33"
        },
        cursorBlink: true,
        allowTransparency: true,
      });
      
      fitAddon.current = new FitAddon();
      terminal.current.loadAddon(fitAddon.current);
      
      if (terminalRef.current) {
        terminal.current.open(terminalRef.current);
        terminal.current.onResize(({ cols, rows }) => {
          console.log("[Terminal] Resize:", { cols, rows });
          if (matrixRain.current) {
            matrixRain.current.resize(cols, rows);
          }
        });

        // Stop matrix effect on any key press
        terminal.current.onKey(() => {
          if (matrixRain.current?.isRunning) {
            stopMatrixRain();
          }
        });

        // Stop matrix effect on mouse movement
        mouseMoveHandler.current = () => {
          if (matrixRain.current?.isRunning) {
            stopMatrixRain();
          }
        };
        terminalRef.current.addEventListener("mousemove", mouseMoveHandler.current);
        
        try {
          await new Promise(resolve => requestAnimationFrame(resolve));
          fitAddon.current!.fit();
          await new Promise(resolve => requestAnimationFrame(resolve));
          setIsTerminalReady(true);
          console.log("[Terminal] Ready");

          writeLines([
            "Welcome to GRUX Terminal!",
            'Type "help" for a list of available commands.',
            ""
          ]);
          
          resetIdleTimer();
          
          // Initialize TerminalLineReader to capture full lines.
          lineReader.current = new TerminalLineReader(terminal.current!, executeCommand);
          
          // Set initial focus
          terminal.current.focus();
          
        } catch (error) {
          console.error("[Terminal] Error during fit:", error);
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
        terminalRef.current.removeEventListener("click", () => {});
      }
    };
  }, [writeLines, executeCommand, resetIdleTimer, stopMatrixRain]);

  return (
    <div style={containerStyle}
         onClick={() => terminal.current?.focus()}>
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
