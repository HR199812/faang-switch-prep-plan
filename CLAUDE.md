# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server at http://localhost:5173
npm run build    # Production build → dist/
npm run preview  # Preview production build
```

No test or lint tooling is configured.

## Architecture

A single-page React 18 + Vite app for tracking a 26-week FAANG interview prep curriculum. No backend, no router, no external UI library.

### Key Files

- `src/App.jsx` — Single monolithic component (~824 lines). Contains all UI components, a `GLOBAL_CSS` string injected via `<style>`, and all app logic.
- `src/data/weeks.js` — All static curriculum data: `PHASES`, `TRACKS`, `WEEKS` (26 entries), `MILESTONES`, `DAILY_BLOCKS`.

### State

All state lives in the root `App` component via `useState`:
- `activeWeek` (1–26) — currently viewed week
- `activeTab` (`week` | `overview` | `heatmap` | `daily` | `milestones`)
- `checked` — object keyed by `w{week}-{track}-{itemIndex}` tracking completed items

State is **not persisted** (no localStorage). The README includes a snippet showing how to add it.

### Navigation

Tab-based; no router. `goToWeek(n)` sets `activeWeek` and switches to the `week` tab. The heatmap and milestones tabs call this to jump to specific weeks.

### Styling

CSS custom properties (`--bg`, `--text`, `--accent`, `--border`, `--font-mono`, `--font-sans`) defined in `GLOBAL_CSS`. Dark theme (`#09090C` background, `#22D3EE` accent). Dynamic colors (phase/track) are applied as inline styles.

### Data Shape

Each week in `WEEKS` has: `{ n, phase, title, goal, dsa[], dp[], sd[], fsd[], mock[], beh[] }`. Track keys match the `TRACKS` definitions in `weeks.js`.
