# GRUX - Retro Terminal Feed Reader

## Project Purpose
GRUX is a frontend-only terminal interface that displays tech feeds with a retro hacker aesthetic. It aims to provide a visually engaging and informative experience, reminiscent of classic terminal interfaces, while displaying modern tech news and updates. GRUX will feature auto-scrolling content, interactive commands, and Matrix-style animations, built using React and xterm.js.

## Core Objectives
- Create an authentic retro terminal experience using xterm.js and React.
- Display auto-scrolling tech news headlines and feed content without user interaction.
- Implement visually engaging Matrix-style animations and effects.
- Integrate various tech news feeds as content sources.
- Maintain a simple, efficient, and frontend-only architecture.
- Utilize local storage for caching feeds and user settings.

## Technical Specifications
- Frontend Framework: React
- Terminal Emulation: xterm.js
- State Management: React Context or similar (simple, frontend-focused)
- Data Storage: Local Storage (for caching feeds and settings)
- Styling: CSS with a retro terminal aesthetic
- No Backend: Frontend-only application

## Project Architecture
GRUX will follow a simple component-based architecture in React. Key components include:
- **Terminal Component:** Core component using xterm.js to render the terminal interface.
- **Feed Display Component:** Responsible for fetching and displaying tech feeds in the terminal.
- **Animation Component:** Implements Matrix-style animations and visual effects.
- **Command Processor:** Handles user input and executes terminal commands (initially simple commands).
- **Data Caching:** Utilizes local storage to cache fetched feeds and potentially user preferences.

The architecture will be designed to be modular and easy to extend, focusing on clear separation of concerns for visual effects, data display, and terminal interaction.

## Development Approach
1. **Basic Terminal Setup:** Initialize a React application and set up the core terminal component using xterm.js.
2. **Visual Effects Implementation:** Add Matrix-style animations and retro aesthetic styling.
3. **Feed Integration:** Implement feed fetching and display within the terminal.
4. **Command Interface:** Develop a basic command processor for user interaction.
5. **Local Storage Caching:** Implement caching for feeds and settings using local storage.
6. **Refinement and Testing:** Focus on performance, responsiveness, and user experience.

## Success Criteria
- Smooth and responsive terminal emulation using xterm.js.
- Engaging and visually appealing passive content display (auto-scrolling feeds, Matrix animations).
- Functional and responsive command interface for basic interactions.
- Authentic retro terminal aesthetic and user experience.
- Efficient caching of feeds using local storage.

## Memory Bank
This project utilizes a Memory Bank located in the `memory-bank` directory to maintain project context, track progress, and document decisions. Key files within the Memory Bank include:
- `productContext.md`: Defines project vision, goals, and constraints (this file).
- `activeContext.md`: Tracks current session context and goals.
- `progress.md`: Records work completed and next steps.
- `decisionLog.md`: Documents key decisions and rationale.
