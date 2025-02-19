# GRUX - Retro Terminal Feed Reader

GRUX is a frontend-only terminal interface that displays tech feeds with a retro hacker aesthetic. Built with React and xterm.js, GRUX aims to provide a visually engaging and informative experience, reminiscent of classic terminal interfaces, while displaying modern tech news and updates.

Key features include:
- Retro terminal aesthetic with green phosphor display
- Matrix-style rain animation
- Auto-scrolling tech news headlines
- Simple, frontend-only architecture

This project is coded collaboratively by Roo Code and various LLM models.

This project utilizes a Memory Bank (in the `memory-bank` directory) to maintain project context, track progress, and document decisions.

## Available Commands

The GRUX terminal supports the following commands:

- `help`: Shows a list of available commands.
- `ls`, `dir`: Lists files in the current directory (simulated).
- `clear`: Clears the terminal screen.
- `echo [text]`: Displays text in the terminal.
- `version`: Shows the terminal version.
- `matrix`: Starts the Matrix rain animation.
  - `matrix speed [value]`: Sets the animation speed (value between 0.1 and 2.0). Example: `matrix speed 1.5`
  - `matrix density [value]`: Sets the raindrop density (value between 0.1 and 1.0). Example: `matrix density 0.7`
- `stop`: Stops the Matrix rain animation.
- `exit`: Clears the screen and resets the terminal.