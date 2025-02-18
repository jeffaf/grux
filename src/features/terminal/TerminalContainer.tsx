import React, { useRef, useEffect, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import { MatrixRain } from '../matrix';
import 'xterm/css/xterm.css';

const IDLE_TIMEOUT = 30000; // 30 seconds before matrix activates

const TerminalContainer: React.FC = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminal = useRef<Terminal | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);
  const matrixRain = useRef<MatrixRain | null>(null);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityTime = useRef<number>(Date.now());

  const writeLines = (lines: string[], addPrompt: boolean = true) => {
    if (!terminal.current) return;
    
    lines.forEach(line => {
      terminal.current?.writeln(line);
    });
    
    if (addPrompt) {
      terminal.current.write('grux> ');
    }
  };

  // Reset idle timer on activity
  const resetIdleTimer = () => {
    if (idleTimer.current) {
      clearTimeout(idleTimer.current);
    }
    lastActivityTime.current = Date.now();
    idleTimer.current = setTimeout(() => {
      if (!matrixRain.current?.isRunning && terminal.current) {
        startMatrixRain();
      }
    }, IDLE_TIMEOUT);
  };

  // Matrix rain effect
  const startMatrixRain = () => {
    if (!terminal.current || matrixRain.current?.isRunning) return;
    
    if (!matrixRain.current) {
      matrixRain.current = new MatrixRain(terminal.current, {
        columns: terminal.current.cols,
        rows: terminal.current.rows,
        maxRows: Math.floor(terminal.current.rows / 2) // Use only top half
      });
    }

    // Set up terminal
    terminal.current.options.cursorBlink = false;
    terminal.current.clear();
    writeLines(['Starting Matrix rain animation...'], false);
    
    matrixRain.current.start();
  };

  // Stop matrix rain
  const stopMatrixRain = () => {
    if (matrixRain.current) {
      matrixRain.current.stop();
      matrixRain.current.cleanup();
    }
    if (terminal.current) {
      terminal.current.options.cursorBlink = true;
      terminal.current.clear();
      writeLines(['Matrix rain stopped']);
    }
    resetIdleTimer();
  };

  const handleCommand = (command: string) => {
    if (!terminal.current) return;
    
    const args = command.trim().split(/\s+/);
    const commandName = args[0].toLowerCase();

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
        ]);
        break;
      
      case 'ls':
      case 'dir':
        writeLines([
          'Documents/',
          'Downloads/',
          'Projects/',
          'README.md',
          'config.json'
        ]);
        break;
      
      case 'clear':
        terminal.current.clear();
        terminal.current.write('grux> ');
        break;
      
      case 'echo':
        const text = args.slice(1).join(' ');
        writeLines([text || '']);
        break;
      
      case 'version':
        writeLines(['GRUX Terminal v1.0.0']);
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
          startMatrixRain();
        }
        break;
      
      case 'stop':
        if (matrixRain.current?.isRunning) {
          stopMatrixRain();
        } else {
          writeLines(['No animation is currently running.']);
        }
        break;
      
      case 'exit':
        terminal.current.clear();
        writeLines(['Terminal reset.']);
        break;
      
      default:
        if (command.trim()) {
          writeLines([`Command not found: ${commandName}`]);
        } else {
          terminal.current.write('grux> ');
        }
    }
  };

  useEffect(() => {
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
    });

    // Initialize fit addon
    fitAddon.current = new FitAddon();
    terminal.current.loadAddon(fitAddon.current);

    if (terminalRef.current) {
      // Open terminal
      terminal.current.open(terminalRef.current);
      
      // Initial fit
      setTimeout(() => {
        fitAddon.current?.fit();
        // Initialize matrix rain with correct dimensions
        if (terminal.current) {
          matrixRain.current = new MatrixRain(terminal.current, {
            columns: terminal.current.cols,
            rows: terminal.current.rows,
            maxRows: Math.floor(terminal.current.rows / 2)
          });
        }
      }, 100);

      const handleResize = () => {
        fitAddon.current?.fit();
        if (terminal.current && matrixRain.current) {
          matrixRain.current.resize(terminal.current.cols, terminal.current.rows);
        }
      };

      window.addEventListener('resize', handleResize);

      // Write welcome message
      writeLines([
        'Welcome to GRUX Terminal!',
        'Type "help" for a list of available commands.',
        ''
      ]);

      // Handle input
      terminal.current.onData((data) => {
        resetIdleTimer(); // Reset idle timer on any input

        if (matrixRain.current?.isRunning) {
          if (data.toLowerCase() === 'stop') {
            stopMatrixRain();
          }
          return;
        }

        if (data === '\r') { // Enter pressed
          terminal.current?.write('\r\n');
          handleCommand(currentInput);
          setCommandHistory(prev => [...prev, currentInput]);
          setCurrentInput('');
        } else if (data === '') { // Backspace
          if (currentInput.length > 0) {
            terminal.current?.write('\b \b');
            setCurrentInput(prev => prev.slice(0, -1));
          }
        } else { // Regular input
          terminal.current?.write(data);
          setCurrentInput(prev => prev + data);
        }
      });

      return () => {
        window.removeEventListener('resize', handleResize);
        if (idleTimer.current) clearTimeout(idleTimer.current);
        if (matrixRain.current) matrixRain.current.cleanup();
        fitAddon.current?.dispose();
        terminal.current?.dispose();
      };
    }
  }, []);

  return (
    <div ref={terminalRef} style={{ 
      height: '100%', 
      width: '100%',
      padding: '10px',
      boxSizing: 'border-box',
      backgroundColor: '#000'
    }} />
  );
};

export default TerminalContainer;