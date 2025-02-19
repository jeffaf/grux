import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import { MatrixRain } from '../matrix';
import 'xterm/css/xterm.css';

const IDLE_TIMEOUT = 30000; // 30 seconds before matrix activates

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
  minHeight: '400px', // Ensure minimum height
  minWidth: '600px',  // Ensure minimum width
  boxSizing: 'border-box',
  backgroundColor: '#000',
  overflow: 'hidden',
};

const TerminalContainer: React.FC = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminal = useRef<Terminal | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);
  const matrixRain = useRef<MatrixRain | null>(null);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityTime = useRef<number>(Date.now());
  const [isTerminalReady, setIsTerminalReady] = useState(false);

  const writeLines = useCallback((lines: string[], addPrompt: boolean = true) => {
    if (!terminal.current) {
      console.warn('[Terminal] Cannot write lines - terminal not initialized');
      return;
    }

    lines.forEach(line => {
      terminal.current?.writeln(line);
    });

    if (addPrompt) {
      terminal.current.write('grux> ');
    }
  }, []);

  // Reset idle timer on activity
  const resetIdleTimer = useCallback(() => {
    if (idleTimer.current) {
      clearTimeout(idleTimer.current);
    }
    lastActivityTime.current = Date.now();
    idleTimer.current = setTimeout(() => {
      if (!matrixRain.current?.isRunning && terminal.current) {
        startMatrixRain();
      }
    }, IDLE_TIMEOUT);
  }, []);

  // Matrix rain effect
  const startMatrixRain = useCallback(() => {
    console.warn('[Terminal] Attempting to start matrix rain:', {
      terminalExists: !!terminal.current,
      isRunning: matrixRain.current?.isRunning,
      isReady: isTerminalReady,
      cols: terminal.current?.cols,
      rows: terminal.current?.rows
    });

    if (!terminal.current || matrixRain.current?.isRunning || !isTerminalReady) {
      console.warn('[Terminal] Cannot start matrix rain - conditions not met');
      return;
    }

    try {
      // Initialize MatrixRain with current terminal dimensions
      console.warn('[Terminal] Creating new MatrixRain instance');
      matrixRain.current = new MatrixRain(terminal.current, {
        columns: terminal.current.cols,
        rows: terminal.current.rows,
      });

      // Set up terminal: hide cursor
      terminal.current.options.cursorBlink = false;

      console.warn('[Terminal] Starting matrix rain animation');
      matrixRain.current.start();
    } catch (error) {
      console.error('[Terminal] Error starting matrix rain:', error);
    }
  }, [isTerminalReady]);

  // Stop matrix rain
  const stopMatrixRain = useCallback(() => {
    console.warn('[Terminal] Stopping matrix rain');
    if (matrixRain.current) {
      matrixRain.current.stop();
      matrixRain.current.cleanup();
      matrixRain.current = null; // Ensure it's reinitialized next time
    }
    if (terminal.current) {
      terminal.current.options.cursorBlink = true;
      terminal.current.clear();
      writeLines(['Matrix rain stopped']); // Includes prompt
    }
    resetIdleTimer();
  }, [writeLines, resetIdleTimer]);

  const handleCommand = useCallback((command: string) => {
    console.warn('[Terminal] Processing command:', { command });
    
    if (!terminal.current) {
      console.warn('[Terminal] Cannot handle command - terminal not initialized');
      return;
    }

    // Clean up command by removing special characters and trimming
    const cleanCommand = command.replace(/[\r\n\\]/g, '').trim();
    console.warn('[Terminal] Cleaned command:', { cleanCommand });

    const args = cleanCommand.split(/\s+/);
    const commandName = args[0].toLowerCase();
    let prompt = true;

    console.warn('[Terminal] Handling command:', { commandName, args });

    switch (commandName) {
      case 'help':
        writeLines([
          'Available commands:',
          '  help            - Show this help message',
          '  ls, dir        - List files in current directory',
          '  clear          - Clear the terminal screen',
          '  echo [text]    - Display text in terminal',
          '  version        - Show terminal version',
          '  matrix         - Start Matrix rain animation',
          '  matrix speed   - Set matrix animation speed (0.1-2.0)',
          '  matrix density - Set raindrop density (0.1-1.0)',
          '  stop           - Stop Matrix rain animation',
          '  exit           - Clear screen and reset terminal'
        ], false);
        break;

      case 'ls':
      case 'dir':
        writeLines([
          'Documents/',
          'Downloads/',
          'Projects/',
          'README.md',
          'config.json'
        ], false);
        break;

      case 'clear':
        terminal.current.clear();
        terminal.current.write('grux> ');
        break;

      case 'echo':
        const text = args.slice(1).join(' ');
        writeLines([text || ''], false);
        break;

      case 'version':
        writeLines(['GRUX Terminal v1.0.0'], false);
        break;

      case 'matrix':
        if (args[1] === 'speed' && args[2]) {
          const speed = parseFloat(args[2]);
          if (!isNaN(speed) && speed >= 0.1 && speed <= 2.0 && matrixRain.current) {
            matrixRain.current.updateConfig({ animationSpeed: speed });
            writeLines([`Matrix speed set to ${speed}`]);
          } else {
            writeLines(['Invalid speed value. Use a number between 0.1 and 2.0']);
          }
        } else if (args[1] === 'density' && args[2]) {
          const density = parseFloat(args[2]);
          if (!isNaN(density) && density >= 0.1 && density <= 1.0 && matrixRain.current) {
            matrixRain.current.updateConfig({ density: density });
            writeLines([`Matrix density set to ${density}`]);
          } else {
            writeLines(['Invalid density value. Use a number between 0.1 and 1.0']);
          }
        } else {
          console.warn('[Terminal] Starting matrix rain from command');
          startMatrixRain();
          prompt = false;
        }
        break;

      case 'stop':
        stopMatrixRain();
        break;

      case 'exit':
        terminal.current.clear();
        writeLines(['Terminal reset.'], false);
        break;

      default:
        if (cleanCommand) {
          writeLines([`Command not found: ${commandName}`]);
        }
    }
    if (prompt) {
      terminal.current.write('grux> ');
    }
  }, [writeLines, startMatrixRain, stopMatrixRain]);

  useEffect(() => {
    const initializeTerminal = async () => {
      console.warn('[Terminal] Initializing terminal');
      // Initialize terminal
      terminal.current = new Terminal({
        rows: 24,
        cols: 80,
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        fontSize: 14,
        theme: {
          background: '#000000',
          foreground: '#33ff33',
          cursor: '#33ff33'
        },
        cursorBlink: true,
        allowTransparency: true,
        convertEol: true, // Convert line endings
      });

      // Initialize fit addon
      fitAddon.current = new FitAddon();
      terminal.current.loadAddon(fitAddon.current);

      if (terminalRef.current) {
        // Open terminal
        terminal.current.open(terminalRef.current);

        // Set up resize handler
        terminal.current.onResize(({ cols, rows }) => {
          console.warn('[Terminal] Resized:', { cols, rows });
          if (matrixRain.current && terminal.current) {
            matrixRain.current.resize(cols, rows);
          }
        });

        // Initial fit
        try {
          // Wait for a frame to ensure the DOM is ready
          await new Promise(resolve => requestAnimationFrame(resolve));
          
          fitAddon.current.fit();
          console.warn('[Terminal] Fitted:', {
            cols: terminal.current.cols,
            rows: terminal.current.rows
          });
          
          // Wait another frame to ensure dimensions are set
          await new Promise(resolve => requestAnimationFrame(resolve));
          console.warn('[Terminal] Ready');
          setIsTerminalReady(true);
        } catch (error) {
          console.error('[Terminal] Error fitting terminal:', error);
        }

        // Write welcome message and initial prompt
        writeLines([
          'Welcome to GRUX Terminal!',
          'Type "help" for a list of available commands.',
          ''
        ]);

        // Start idle detection
        resetIdleTimer();

        // Handle input using onData
        terminal.current.onData((data) => {
          console.warn('[Terminal] Received data:', { 
            data,
            charCodes: data.split('').map(c => c.charCodeAt(0)),
            currentInput
          });

          resetIdleTimer();

          if (data === '\r') { // Enter pressed
            console.warn('[Terminal] Enter pressed, current input:', currentInput);
            terminal.current?.write('\r\n');
            handleCommand(currentInput);
            setCommandHistory(prev => [...prev, currentInput]);
            setCurrentInput(''); // Clear input after handling command
          } else if (data === '\x7f') { // Backspace
            if (currentInput.length > 0) {
              terminal.current?.write('\b \b');
              setCurrentInput(prev => {
                const newInput = prev.slice(0, -1);
                console.warn('[Terminal] Backspace, new input:', newInput);
                return newInput;
              });
            }
          } else { // Regular input
            // Filter out special characters
            if (!/[\r\n\\]/.test(data)) {
              terminal.current?.write(data);
              setCurrentInput(prev => {
                const newInput = prev + data;
                console.warn('[Terminal] Updated input:', newInput);
                return newInput;
              });
            }
          }
        });

        // Focus terminal on click
        terminalRef.current.addEventListener('click', () => {
          console.warn('[Terminal] Clicked, focusing terminal');
          terminal.current?.focus();
        });
      }
    };

    initializeTerminal().catch(console.error);

    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      if (matrixRain.current) matrixRain.current.cleanup();
      if (fitAddon.current) fitAddon.current.dispose();
      if (terminal.current) terminal.current.dispose();
      if (terminalRef.current) {
        terminalRef.current.removeEventListener('click', () => {});
      }
    };
  }, [writeLines, handleCommand, resetIdleTimer]);

  return (
    <div style={containerStyle}>
      <div ref={terminalRef} style={terminalStyle} />
    </div>
  );
};

export default TerminalContainer;