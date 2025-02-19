import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Terminal, IDisposable } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import { MatrixRain } from '../matrix';
import 'xterm/css/xterm.css';

const IDLE_TIMEOUT = 30000;

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

/**
 * TerminalLineReader: A helper class that collects input from the Terminal.
 * It listens for onData events, accumulates printable characters into a buffer,
 * and when an Enter key is detected ("\r" or "\n"), it invokes the onLine callback with the input.
 */
class TerminalLineReader {
  terminal: Terminal;
  buffer: string;
  onLine: (line: string) => void;
  // Store the IDisposable returned by onData.
  private _dataSubscription: IDisposable | null;

  constructor(terminal: Terminal, onLine: (line: string) => void) {
    this.terminal = terminal;
    this.buffer = "";
    this.onLine = onLine;
    // Store the subscription.
    this._dataSubscription = this.terminal.onData(this.handleData);
  }

  private handleData = (data: string) => {
    console.log('[LineReader] Received:', { data, buffer: this.buffer });

    if (data === "\r" || data === "\n") {
      // User pressed Enter.
      this.terminal.write("\r\n");
      console.log('[LineReader] Enter pressed. Final buffer:', this.buffer);
      this.onLine(this.buffer);
      this.buffer = "";
      return;
    }
    // Handle backspace (xterm sends "\b").
    if (data === "\b" || data === "") {
      if (this.buffer.length > 0) {
        this.terminal.write("\b \b");
        this.buffer = this.buffer.slice(0, -1);
        console.log('[LineReader] Backspace. New buffer:', this.buffer);
      }
      return;
    }
    // Handle printable characters.
    if (data >= " " && data <= "~") {
      this.terminal.write(data);
      this.buffer += data;
      console.log('[LineReader] Buffer updated:', this.buffer);
    }
  };

  dispose() {
    // Properly dispose of the subscription.
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

  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityTime = useRef<number>(Date.now());
  const [isTerminalReady, setIsTerminalReady] = useState(false);

  const writeLines = useCallback((lines: string[], addPrompt: boolean = true) => {
    if (!terminal.current) return;
    lines.forEach(line => terminal.current!.writeln(line));
    if (addPrompt) {
      terminal.current!.write("grux> ");
    }
  }, []);

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
    // Process the input command.
    const cmd = input.trim();
    if (!cmd) {
      terminal.current!.write("grux> ");
      return;
    }
    const [command, ...args] = cmd.split(/\s+/);
    console.log("[Terminal] Command:", { command, args });
    let showPrompt = true;
    switch (command.toLowerCase()) {
      case "help":
        writeLines(
          [
            "Available commands:",
            "  help            - Show this help message",
            "  ls, dir        - List files in current directory",
            "  clear          - Clear the terminal screen",
            "  echo [text]    - Display text in terminal",
            "  version        - Show terminal version",
            "  matrix         - Start Matrix rain animation",
            "  matrix speed   - Set matrix animation speed (0.1-2.0)",
            "  matrix density - Set raindrop density (0.1-1.0)",
            "  stop           - Stop Matrix rain animation",
            "  exit           - Clear screen and reset terminal",
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
        writeLines([args.join(" ")], false);
        break;
      case "version":
        writeLines(["GRUX Terminal v1.0.0"], false);
        break;
      case "matrix":
        console.log("[Terminal] Matrix command:", args);
        if (args[0] === "speed" && args[1]) {
          const speed = parseFloat(args[1]);
          if (!isNaN(speed) && speed >= 0.1 && speed <= 2.0 && matrixRain.current) {
            matrixRain.current.updateConfig({ animationSpeed: speed });
            writeLines([`Matrix speed set to ${speed}`]);
          } else {
            writeLines(["Invalid speed value. Use a number between 0.1 and 2.0"]);
          }
        } else if (args[0] === "density" && args[1]) {
          const density = parseFloat(args[1]);
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
        if (command) {
          writeLines([`Command not found: ${command}`]);
        }
    }
    if (showPrompt) {
      terminal.current!.write("grux> ");
    }
  }, [writeLines, startMatrixRain, stopMatrixRain]);

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
        try {
          await new Promise(resolve => requestAnimationFrame(resolve));
          fitAddon.current!.fit();
          await new Promise(resolve => requestAnimationFrame(resolve));
          setIsTerminalReady(true);
          console.log("[Terminal] Ready");
        } catch (error) {
          console.error("[Terminal] Error during fit:", error);
        }
        writeLines([
          "Welcome to GRUX Terminal!",
          'Type "help" for a list of available commands.',
          ""
        ]);
        resetIdleTimer();
        // Initialize TerminalLineReader to capture full lines.
        lineReader.current = new TerminalLineReader(terminal.current!, executeCommand);
        // Handle focus on click.
        terminalRef.current.addEventListener("click", () => {
          terminal.current?.focus();
          console.log("[Terminal] Focus");
        });
      }
    };
    initializeTerminal().catch(console.error);
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      if (matrixRain.current) matrixRain.current.cleanup();
      if (fitAddon.current) fitAddon.current.dispose();
      if (lineReader.current) lineReader.current.dispose();
      if (terminal.current) terminal.current.dispose();
      if (terminalRef.current) {
        terminalRef.current.removeEventListener("click", () => {});
      }
    };
  }, [writeLines, executeCommand, resetIdleTimer]);

  return (
    <div style={containerStyle}>
      <div ref={terminalRef} style={terminalStyle} />
    </div>
  );
};

export default TerminalContainer;
