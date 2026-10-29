# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server at http://localhost:5173
npm run build    # Production build → dist/
npm run preview  # Preview production build
npm run check:problems  # Run every practice reference solution against its tests (Node + python3); validate LeetCode lists
npm run check:atlas     # Validate Atlas content: block shapes, diagram kinds, links, roadmap, deep-dive coverage
```

No unit-test or lint tooling is configured. The two `check:*` scripts validate content only.

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

Shares the System Design Atlas's design system: same tokens (`--bg`, `--surface`, `--surface-2`, `--ink`, `--muted`, `--line`, `--accent`, `--good`, …), fonts (Archivo / IBM Plex Sans / IBM Plex Mono), light + dark palettes via `prefers-color-scheme` (or `data-theme` on `<html>`), and shell (fixed left rail on desktop, topbar + bottom dock under 900px). Track colours are tokens `--t-dsa`, `--t-dp`, `--t-sd`, `--t-fsd`, `--t-mock`, `--t-beh`; the neon hex colours in `weeks.js` are mapped onto them by `tone()` in `App.jsx`, so phases/milestones (which reuse track hexes) follow the theme. Keep the two palettes in sync if the atlas palette changes.

### Data Shape

Each week in `WEEKS` has: `{ n, phase, title, goal, dsa[], dp[], sd[], fsd[], mock[], beh[] }`. Track keys match the `TRACKS` definitions in `weeks.js`.

## System Design Atlas (`/atlas`)

A second view inside this same app, rendered instead of the tracker when the path is `/atlas` (or `/system-design`). `src/main.jsx` picks the view from `window.location.pathname` and lazy-loads the atlas as its own chunk. The tracker sidebar's "System Design Atlas" button links to `/atlas`; the atlas links back to `/`.

- `src/atlas/Atlas.jsx` — the whole atlas UI (home, playbook, building blocks, case studies, drills, quizzes, search). Written with `htm` tagged templates (`html\`...\``) rather than JSX; `htm` is vendored in `src/atlas/vendor/htm.js`, so there's no extra npm dependency. Its CSS is a string scoped under `.atlas`, so it never collides with the tracker's `GLOBAL_CSS`. Internal navigation uses hash routes: `#home`, `#playbook`, `#blocks`, `#block-<id>`, `#studies`, `#study-<id>`, `#drills`, `#drill-<date>`, `#quiz-<id>`.
- `src/atlas/content/` — all content as JSON, bundled by Vite (`import.meta.glob`): `playbook.json`, `blocks.json` (29 building blocks), `roadmap.json` (case-study order), `studies/NN-<id>.json` (34), `deep/block-<id>.json` / `deep/study-<id>.json`, `drills/<date>.json`, `quizzes/<id>.json`. Dropping a new JSON file into `studies/`, `deep/`, `drills/` or `quizzes/` is enough for it to appear; add new case studies to `roadmap.json` too so they show in the roadmap and sidebar. Run `npm run check:atlas` after editing content.
- **Revision notes / Deep dive tabs:** a block or study page shows two tabs when `deep/<kind>-<id>.json` exists (`{ minutes, sections }`). The page's own `sections` are the revision notes. The deep file holds the long-form explanation. Every building block has one; case studies don't yet. The chosen tab is remembered in localStorage (`sda:tab`).
- Block types used in content `sections[].blocks`: `p`, `list`, `table`, `flow`, `callout` (tones `say`/`tip`/`warn`/`key`), `code`, `stats`, `compare`, `steps`, `timeline`, `qa`, `ring`, `seq` (sequence diagram: `actors[]`, `steps[{from,to,label,note?,dashed?}]`), `bits` (bit/field layout: `fields[{label,bits,sub?}]`). Flow node kinds: `client`, `edge`, `service`, `cache`, `db`, `queue`, `store`, `ext`.
- Atlas progress ("Mark revised", quiz best scores) is saved in localStorage under `sda:*` keys.
- `vercel.json` rewrites `/atlas` and `/system-design` (and subpaths) to `index.html` so direct visits and refreshes work.

## Practice (`#practice`, `#p/<id>`)

The tracker's coding practice area: write JS or Python in the browser, run it against tests, see what failed, get a Claude review, and revisit solved problems on a spaced-repetition schedule. It lives in `src/practice/` and is lazy-loaded from `App.jsx` (the tabs are `practice` and `problem`; the hash keeps the current problem across refreshes and makes Back work).

- `problems/*.js` — the content, written with `define()` / the `code` tag from `define.js` (that file documents the problem shape). `problems.js` bundles every file via `import.meta.glob`. Each problem lists the curriculum `weeks` it belongs to, and the week view shows them. **After adding or editing a problem, run `npm run check:problems`**: it runs every reference solution against every test in both languages and checks that the starters compile.
- `runner/` — `harness-js.js` and `harness.py` hold the language-specific run logic (ListNode/TreeNode conversion, "design" problems driven by `ops`, error line numbers, captured stdout). `compare.js` checks answers (`exact`, `unordered`, `nested-unordered`, `float`). The browser runs code in module Web Workers (`jsWorker.js`, `pyWorker.js`, which loads Pyodide from jsDelivr). `runner.js` enforces time limits by terminating the worker. The Node checker imports the same harness files.
- `review.js` — "Review with Claude": calls the Claude API from the browser via `@anthropic-ai/sdk` (`dangerouslyAllowBrowser`) with the user's own key, streaming, model `claude-opus-5-5`, `fallbacks: "default"`. It's loaded lazily because the SDK is large. `Practice.jsx` repeats the model name in `REVIEW_MODEL`, so keep the two in sync.
- `store.js` — progress (code per language, run history, mistake log, notes, saved reviews, review schedule) in localStorage under `fp:practice:v1`. The API key is stored under `fp:anthropic-key` and the preferred language under `fp:lang`.
- `Editor.jsx` is a dependency-free highlighted textarea editor; `Md.jsx` is a small markdown renderer for statements and reviews.
- **Daily LeetCode track** (the week page's LeetCode panel, "Daily plan" view): `src/data/daily.js` holds the curated day-by-day curriculum, at most 1–2 problems a day. It ramps from warm-ups through data structures, algorithms (Boyer–Moore, string matching), graphs and DP/backtracking capstones by week 16; weeks 17–24 are re-solves. `src/data/schedule.js` turns it into per-day sessions with time estimates. `check:problems` enforces 1–2 problems per day, no problem introduced twice, and no re-solve before a problem has been introduced. The panel's "Topic bank" view shows the larger optional per-week list from `leetcode.js`.
- **LeetCode lists** (`#lists/<neetcode150|blind75|weeks>`, plus a panel on each week page): data in `src/data/leetcode.js` (per-week lists keyed by week number) and `src/data/lists.js` (NeetCode 150 with Blind 75 flags). Items are `[number, title, difficulty, flags?]`; URLs come from `slugify(title)`. UI is `src/practice/LeetCode.jsx`. One solved mark per problem slug is shared by every list (localStorage `fp:leetcode:v1`). `check:problems` verifies counts and that every list agrees on each problem's title and difficulty.
