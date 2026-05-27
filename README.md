# FAANG Prep Tracker — 26-Week Plan

A VSCode-ready React app tracking your full FAANG prep from Week 1 through Week 26, including the DBFlow launch sprint.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Stack

- React 18 (no external UI library)
- Vite 4
- JetBrains Mono + Outfit fonts (Google Fonts)
- Zero dependencies beyond React

## Features

- **Week Plan** — All 26 weeks with per-track items (DSA, DP, Sys Design, Full-Stack, Mock/Apply, Behavioural)
- **Checkboxes** — Tick off items as you complete them (persisted in React state — add localStorage if you want persistence)
- **Progress bar** — Per-week and overall across all 26 weeks
- **Heatmap** — Visual density of work across all tracks × all weeks, click to jump
- **Daily Split** — The 5-hour/day Mon–Sun block schedule with weekly hour totals
- **Milestones** — 17 key checkpoints from Week 2 to Week 26
- **Overview** — Phase-by-phase summary with direct week navigation

## Phase Structure

| Phase | Name                   | Weeks  |
|-------|------------------------|--------|
| 1     | Foundation Audit       | 1–2    |
| 2     | DSA & DP Mastery       | 3–10   |
| 3     | System Design Depth    | 8–14   |
| 4     | Full-Stack Deep Dive   | 10–16  |
| 5     | Interview Execution    | 14–20  |
| 6     | Extended / DBFlow Ship | 21–26  |

## Making It Persistent

To persist checkbox state across sessions, add to App.jsx:

```js
const [checked, setChecked] = useState(
  () => JSON.parse(localStorage.getItem("faang-checked") || "{}")
);

// In handleToggle:
const next = { ...prev, [key]: !prev[key] };
localStorage.setItem("faang-checked", JSON.stringify(next));
return next;
```

## Project Structure

```
faang-tracker/
├── src/
│   ├── App.jsx          # Main app (sidebar, tabs, all views)
│   └── data/
│       └── weeks.js     # All 26 weeks of data + phases + milestones
├── index.html
├── vite.config.js
└── package.json
```
