# GRUX Project Context

## Project Vision
GRUX is envisioned as a frontend-only terminal interface that delivers tech feeds with a retro hacker aesthetic. It aims to provide users with a visually engaging and informative experience, reminiscent of classic terminal interfaces, while displaying modern tech news and updates.

## Project Goals
- Develop a visually appealing terminal interface using React and xterm.js.
- Implement Matrix-style animations and auto-scrolling headlines for a retro hacker aesthetic.
- Display tech feeds in a clear and organized manner within the terminal interface.
- Utilize local storage for caching feeds and settings (if needed, but not a priority initially).
- Maintain a simple and efficient architecture focused on frontend implementation.
- Achieve a classic green phosphor terminal look with specific visual effects.
- Implement Matrix-style rain animation, scanline effect, typed boot sequence text, and auto-scrolling headlines.
- Use HackerNews API (https://hn.algolia.com/api/v1/search) as the initial tech feed source.
- Organize project structure using a feature-based approach under `/src/features`.
- Implement error handling where it makes sense to improve user experience.
- Explore different themes if feasible, but this is a secondary goal.

## Project Constraints
- Frontend-only application, no backend services required.
- Reliance on xterm.js for terminal emulation and React for UI components.
- Design should prioritize visual appeal and retro aesthetic, specifically green phosphor on black.
- Caching limited to local storage capabilities (not a priority initially).
- Initial tech feed source is HackerNews API.
- No user accounts or persistence needed.
- No feed management features required.
- No sound effects.

## Visual Style Details
- **Color Palette:** Classic green phosphor terminal look (#33ff33 on black background).
- **Matrix Rain Animation:** Runs when idle, using xterm.js cursor positioning, bright and normal ANSI green colors, and random katakana or ASCII characters.
- **Scanline Effect:** For CRT authenticity.
- **Typed Boot Sequence Text:** Text appears to be typed out during boot.
- **Auto-scrolling Headlines:** Headlines fade in/out with auto-scrolling.
- **Animation Speed:** Configurable, starting with a moderate pace.

## Tech Feeds
- **Initial Feed:** HackerNews API (https://hn.algolia.com/api/v1/search) - simple and CORS-friendly.
- **Potential Future Feeds:** CVE feeds (to be considered later).

## Project Structure
Feature-based structure under `/src/features`:
- `/src/features/terminal`: Core terminal functionality.
- `/src/features/matrix`: Matrix rain animation.
- `/src/features/feeds`: Feed handling.
- `/src/features/animations`: Other visual effects.
- `/src/components`: Shared components.
- `/src/utils`: Shared utilities.
- `/src/styles`: Global styles.

## Memory Bank Files

This Memory Bank contains the following core files to maintain project context and track progress:

- **productContext.md:** (This file) Defines the project's vision, goals, constraints, and the purpose of each file in the Memory Bank. It serves as the central document for understanding the project's overall context.
- **activeContext.md:** Tracks the current session's context, including active tasks, current goals, and any open questions or issues. It provides a snapshot of the ongoing work and immediate priorities.
- **progress.md:** Records the work completed, tracks progress against project goals, and outlines the next steps. It serves as a log of accomplishments and a roadmap for future development.
- **decisionLog.md:** Documents key architectural and design decisions, along with their context, rationale, and implementation details. It ensures that important decisions are recorded and easily accessible for future reference.

Additional files may be added to the Memory Bank as needed to further document and organize project-related information.