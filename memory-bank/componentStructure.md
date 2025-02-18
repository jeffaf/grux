# GRUX Component Structure

This file outlines the component structure for the GRUX project, detailing the hierarchy and purpose of components within each feature area.

## 1. Terminal Feature (`/src/features/terminal`)

This feature encompasses the core terminal functionality using `xterm.js`.

### Components:
- **TerminalContainer:**
    - **Purpose:** Main container component for the terminal.
    - **Responsibilities:**
        - Initializes and manages the `xterm.js` instance.
        - Handles terminal input and output.
        - Integrates with other features (feeds, animations).
- **TerminalPrompt:**
    - **Purpose:** Component for displaying the terminal prompt.
    - **Responsibilities:**
        - Renders the prompt text (e.g., `grux>`).
        - Handles user input within the prompt.
- **TerminalOutput:**
    - **Purpose:** Component for displaying terminal output.
    - **Responsibilities:**
        - Renders text output from commands or feeds.
        - Handles formatting and styling of output text.

## 2. Matrix Rain Feature (`/src/features/matrix`)

This feature implements the Matrix rain animation.

### Components:
- **MatrixRain:**
    - **Purpose:** Main component for rendering the Matrix rain animation.
    - **Responsibilities:**
        - Creates and manages the animation loop.
        - Uses `xterm.js` API to position characters and apply colors.
        - Generates random characters (Katakana or ASCII).

## 3. Feeds Feature (`/src/features/feeds`)

This feature handles fetching and displaying tech feeds.

### Components:
- **FeedDisplay:**
    - **Purpose:** Component for displaying the tech feed within the terminal.
    - **Responsibilities:**
        - Fetches data from the HackerNews API.
        - Formats and renders feed headlines.
        - Implements auto-scrolling headlines.

## 4. Animations Feature (`/src/features/animations`)

This feature will contain other visual effects beyond Matrix rain. (Initially might just contain Matrix rain, and expanded later)

### Components:
- **ScanlineEffect:** (To be implemented later)
    - **Purpose:** Component for rendering the scanline effect.
    - **Responsibilities:**
        - Applies a scanline visual effect to the terminal.
- **BootSequence:** (To be implemented later)
    - **Purpose:** Component for rendering the typed boot sequence text.
    - **Responsibilities:**
        - Displays animated boot sequence text at startup.

---

*This is an initial component structure and may evolve as the project develops.*