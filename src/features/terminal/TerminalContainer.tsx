import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Terminal, IDisposable } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import { MatrixRain } from '../matrix';
import { VirtualLinuxEnvironment } from '../backdoor/VirtualLinuxEnvironment';
import { SGR } from './colors';
import 'xterm/css/xterm.css';

const IDLE_TIMEOUT = 30000;

class TerminalLineReader {
  terminal: Terminal;
  buffer: string;
  onLine: (line: string) => void;
  private _dataSubscription: IDisposable | null;
  private _sgrHandler: IDisposable | null;

  constructor(terminal: Terminal, onLine: (line: string) => void) {
    this.terminal = terminal;
    this.buffer = "";
    this.onLine = onLine;
    this._dataSubscription = this.terminal.onData(this.handleData);

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
    
    console.log('[LineReader] Received:', {
      data,
      charCode,
      hex: charCode.toString(16),
      buffer: this.buffer
    });

    // Handle Enter key
    if (data === "\r" || data === "\n") {
      this.terminal.write("\r\n");
      this.onLine(this.buffer);
      this.buffer = "";
      return;
    }

    // Handle backspace/delete
    if (charCode === 127 || charCode === 8 || data === "\b") {
      if (this.buffer.length > 0) {
        this.terminal.write("\b \b");
        this.buffer = this.buffer.slice(0, -1);
        console.log('[LineReader] After backspace:', this.buffer);
      }
      return;
    }

    // Handle TAB key
    if (charCode === 9) {
      // TODO: Implement tab completion
      return;
    }

    // Handle Ctrl+C
    if (charCode === 3) {
      this.terminal.write("^C\r\n");
      this.buffer = "";
      this.terminal.write("grux> ");
      return;
    }

    // Handle printable characters
    if (data >= " " && data <= "~") {
      this.terminal.write(data);
      this.buffer += data;
    }
  };

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

  const enterBackdoorMode = useCallback(() => {
    if (!terminal.current) return;

    const initializeBackdoor = () => {
      virtualEnv.current = new VirtualLinuxEnvironment();
      setIsBackdoorMode(true);
      terminal.current!.clear();
      
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

      terminal.current!.write(virtualEnv.current.getPrompt());
      terminal.current!.focus();
    };

    // Use RAF to ensure DOM is updated
    requestAnimationFrame(() => {
      terminal.current?.focus();
      requestAnimationFrame(initializeBackdoor);
    });
  }, [writeLines]);

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
      const result = virtualEnv.current.execCommand(cmd);
      if (result.shouldExit) {
        setIsBackdoorMode(false);
        virtualEnv.current = null;
        terminal.current.clear();
        writeLines([SGR.green + 'Returned to GRUX Terminal.' + SGR.reset], true);
        terminal.current.focus();
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
        writeLines(result.output, true);
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

      // Register color sequence handler
      terminal.current.parser.registerCsiHandler(
        { final: 'm' },
        params => {
          // Let xterm.js handle all color sequences
          return false;
        }
      );

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

        try {
          await new Promise(resolve => requestAnimationFrame(resolve));
          fitAddon.current.fit();
          await new Promise(resolve => requestAnimationFrame(resolve));
          setIsTerminalReady(true);

          writeLines([
            SGR.brightGreen + "Welcome to GRUX Terminal!" + SGR.reset,
            'Type "help" for a list of available commands.',
            ""
          ]);
          
          lineReader.current = new TerminalLineReader(terminal.current, executeCommand);
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
      }
    };
  }, [writeLines, executeCommand, resetIdleTimer, stopMatrixRain]);

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
