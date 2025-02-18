# TerminalContainer Component Implementation Plan

This file details the implementation plan for the `TerminalContainer` React component, which is the core of the GRUX terminal interface.

## Component: `TerminalContainer` (`/src/features/terminal/TerminalContainer.tsx`)

### Purpose:
- Main container component for the terminal.
- Initializes and manages the `xterm.js` instance.
- Handles terminal input and output.
- Integrates with other features (feeds, animations).

### Implementation Steps:

1. **Setup `xterm.js` Instance:**
   - Import `Terminal` from `xterm`.
   - In `TerminalContainer` component, create a ref to hold the terminal instance.
   - In `useEffect`, initialize a new `Terminal()` instance and attach it to a div element ref.
   - Ensure proper disposal of the terminal instance on component unmount.

2. **Basic Input Handling:**
   - Use `terminal.onData(data => { ... })` to capture user input.
   - For now, simply echo the input back to the terminal using `terminal.write(data)`.
   - Later, this will be expanded to handle commands.

3. **Basic Output Handling:**
   - Create a function `writeToTerminal(text: string)` within `TerminalContainer`.
   - This function will use `terminal.write(text)` to display text in the terminal.
   - This will be used by other features to display output in the terminal.

4. **Component Props and State:**
   - Define initial props (if any) for `TerminalContainer`. For now, we can start without specific props.
   - Define component state (if needed). Initially, we might not need state in `TerminalContainer` itself, but child components might have state.

5. **Styling:**
   - Apply basic styling to the terminal container to achieve the green phosphor on black look.
   - Use CSS to set background color, text color, font family, and potentially add the scanline effect later.

6. **Integration Points:**
   - Identify points where other features (Matrix rain, feeds) will integrate with `TerminalContainer`.
   - For example, the Matrix rain animation will need to access the `xterm.js` instance to write characters.
   - The FeedDisplay component will need to use `writeToTerminal` to display feed data.

### Initial Code Structure (`/src/features/terminal/TerminalContainer.tsx`):**

```typescript jsx
import React, { useRef, useEffect } from 'react';
import { Terminal } from 'xterm';
import 'xterm/css/xterm.css'; // Import default styles

const TerminalContainer: React.FC = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminal = useRef<Terminal | null>(null);

  useEffect(() => {
    terminal.current = new Terminal({
      theme: {
        background: '#000000',
        foreground: '#33ff33',
      },
    });

    terminal.current.open(terminalRef.current!);

    terminal.current.onData(data => {
      terminal.current?.write(data); // Echo input for now
    });

    return () => {
      terminal.current?.dispose();
      terminal.current = null;
    };
  }, []);

  const writeToTerminal = (text: string) => {
    terminal.current?.write(text);
  };

  return (
    <div ref={terminalRef} />
  );
};

export default TerminalContainer;
```

---

This plan provides a starting point for implementing the `TerminalContainer` component. We can refine it further as we progress.

What do you think of this plan? Would you like to make any adjustments before I proceed to update the Memory Bank files?