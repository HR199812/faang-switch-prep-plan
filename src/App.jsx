import { useState, useCallback, useEffect, lazy, Suspense } from "react";
import { PHASES, TRACKS, WEEKS, MILESTONES, DAILY_BLOCKS } from "./data/weeks.js";
import { usePractice, dueCount } from "./practice/store.js";

// The practice area (problems, code runner, Claude review) loads as its own chunk.
const Practice = lazy(() => import("./practice/Practice.jsx"));
const ProblemPage = lazy(() => import("./practice/Practice.jsx").then((m) => ({ default: m.ProblemPage })));
const WeekPractice = lazy(() => import("./practice/Practice.jsx").then((m) => ({ default: m.WeekPractice })));
const WeekLeetCode = lazy(() => import("./practice/Practice.jsx").then((m) => ({ default: m.WeekLeetCode })));
const LeetCodeLists = lazy(() => import("./practice/Practice.jsx").then((m) => ({ default: m.LeetCodeListsPage })));

// ─── Helpers ─────────────────────────────────────────────────────────────────
const phaseFor = (n) => PHASES.find((p) => n >= p.weeks[0] && n <= p.weeks[1]);
const trackMeta = (key) => TRACKS.find((t) => t.key === key);

const TRACK_LABELS = {
  dsa: "DSA", dp: "DP", sd: "Sys Design", fsd: "Full-Stack", mock: "Mock / Apply", beh: "Behavioural",
};

// The data file's neon hex colours map onto the Atlas palette tokens (--t-*), which
// have light and dark variants. Phase and milestone colours reuse the track hexes.
const HEX_TO_TRACK = Object.fromEntries(TRACKS.map((t) => [t.color.toUpperCase(), t.key]));
const tone = (hexOrKey) => {
  const key = HEX_TO_TRACK[String(hexOrKey).toUpperCase()] || hexOrKey;
  return TRACK_LABELS[key] ? `var(--t-${key})` : "var(--accent)";
};
const soft = (color, pct = 12) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;

// ─── Icons (same set and stroke style as the Atlas) ──────────────────────────
const I = {
  week: "M4 5h16v15H4zM4 9h16M9 3v4M15 3v4",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  heat: "M3 3h4v4H3zM10 3h4v4h-4zM17 3h4v4h-4zM3 10h4v4H3zM10 10h4v4h-4zM17 10h4v4h-4zM3 17h4v4H3zM10 17h4v4h-4zM17 17h4v4h-4z",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2",
  flag: "M5 21V4M5 4h11l-2 4 2 4H5",
  bolt: "M13 2 4 14h7l-1 8 9-12h-7z",
  map: "M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15",
  check: "M5 12.5l4.5 4.5L19 7.5",
  arrow: "M5 12h14M13 6l6 6-6 6",
  back: "M19 12H5M11 6l-6 6 6 6",
  chev: "M9 6l6 6-6 6",
  code: "M8 6l-6 6 6 6M16 6l6 6-6 6",
  list: "M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01",
};
const Icon = ({ n, s = 18 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={I[n]} /></svg>
);
const Mark = () => (
  <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden="true"><rect x="1" y="1" width="30" height="30" rx="8" fill="var(--ink)" /><circle cx="10" cy="10" r="3" fill="var(--accent)" /><circle cx="22" cy="10" r="3" fill="var(--bg)" /><circle cx="16" cy="22" r="3" fill="var(--bg)" /><path d="M10 10L16 22L22 10" stroke="var(--bg)" strokeWidth="1.6" fill="none" /></svg>
);

const VIEWS = [
  { key: "week",       label: "Week plan",   short: "Week",     icon: "week" },
  { key: "practice",   label: "Practice",    short: "Practice", icon: "code" },
  { key: "lists",      label: "LeetCode lists", short: "Lists",  icon: "list", dock: false },
  { key: "overview",   label: "Overview",    short: "Overview", icon: "grid" },
  { key: "heatmap",    label: "Heatmap",     short: "Heatmap",  icon: "heat", dock: false },
  { key: "daily",      label: "Daily split", short: "Daily",    icon: "clock" },
  { key: "milestones", label: "Milestones",  short: "Goals",    icon: "flag" },
  { key: "streaks",    label: "Streaks",     short: "Streaks",  icon: "bolt" },
];

// ─── Styles (CSS-in-JS strings injected via <style>) ─────────────────────────
// Tokens, fonts and shell are shared with the System Design Atlas (src/atlas/Atlas.jsx).
const PALETTE_LIGHT = `
    --bg:#F2F4F6; --surface:#FFFFFF; --surface-2:#E8ECF0; --ink:#121A24; --muted:#556172; --line:#D3DAE2;
    --accent:#D9530A; --accent-soft:rgba(217,83,10,.10); --cobalt:#2B57C9; --cobalt-soft:rgba(43,87,201,.10);
    --good:#0F7A55; --good-soft:rgba(15,122,85,.12); --bad:#C2341B; --bad-soft:rgba(194,52,27,.10);
    --t-dsa:#2B57C9; --t-dp:#6D3FD1; --t-sd:#0F7A55; --t-fsd:#C2410C; --t-mock:#BE2F73; --t-beh:#A16207;
    --shadow:0 1px 2px rgba(18,26,36,.06),0 8px 24px -12px rgba(18,26,36,.18);`;
const PALETTE_DARK = `
    --bg:#0C1219; --surface:#131B25; --surface-2:#1A2431; --ink:#E4E9EF; --muted:#94A2B4; --line:#253142;
    --accent:#FF7A33; --accent-soft:rgba(255,122,51,.14); --cobalt:#7FA3FF; --cobalt-soft:rgba(127,163,255,.13);
    --good:#3CC48F; --good-soft:rgba(60,196,143,.14); --bad:#FF6B52; --bad-soft:rgba(255,107,82,.13);
    --t-dsa:#7FA3FF; --t-dp:#A98BFF; --t-sd:#3CC48F; --t-fsd:#FF8A4C; --t-mock:#F57AB4; --t-beh:#E5B13A;
    --shadow:0 1px 2px rgba(0,0,0,.3),0 10px 30px -14px rgba(0,0,0,.6); color-scheme:dark;`;

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..800&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap');

  :root {${PALETTE_LIGHT}
    --f-display:"Archivo","Arial Narrow",system-ui,sans-serif; --f-body:"IBM Plex Sans",system-ui,-apple-system,"Segoe UI",sans-serif; --f-mono:"IBM Plex Mono",ui-monospace,Menlo,Consolas,monospace;
    --rail:264px; --dock:64px;
  }
  @media (prefers-color-scheme: dark){ :root:not([data-theme="light"]){${PALETTE_DARK}} }
  :root[data-theme="dark"]{${PALETTE_DARK}}

  *, *::before, *::after { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); }
  .trk { background: var(--bg); color: var(--ink); min-height: 100vh; font-family: var(--f-body); font-size: 16px; line-height: 1.6; -webkit-font-smoothing: antialiased; }
  .trk::before { content:""; position:fixed; inset:0 0 auto; height:env(safe-area-inset-top,0px); z-index:40; background:var(--bg); }
  .trk a { color: inherit; }
  .trk button { font: inherit; color: inherit; }
  .trk :focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: 6px; }
  .trk h1, .trk h2, .trk h3 { font-family: var(--f-display); text-wrap: balance; margin: 0; letter-spacing: -.01em; }
  .eyebrow { font-family: var(--f-mono); font-size: 12px; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); }
  .muted { color: var(--muted); }
  .mono { font-family: var(--f-mono); font-variant-numeric: tabular-nums; }

  /* shell */
  .rail { position:fixed; top:0; bottom:0; left:0; width:var(--rail); background:var(--surface); border-right:1px solid var(--line); display:flex; flex-direction:column; z-index:30; padding-top:env(safe-area-inset-top,0px); padding-left:env(safe-area-inset-left,0px); }
  .brand { display:flex; align-items:center; gap:10px; padding:20px 20px 14px; text-decoration:none; background:none; border:0; cursor:pointer; text-align:left; }
  .brand-mark { width:30px; height:30px; flex:none; }
  .brand-name { font-family:var(--f-display); font-weight:800; font-stretch:115%; font-size:17px; line-height:1.05; letter-spacing:-.01em; }
  .brand-name small { display:block; font-family:var(--f-mono); font-weight:400; font-stretch:100%; font-size:11px; color:var(--muted); letter-spacing:.06em; text-transform:uppercase; margin-top:3px; }
  .atlas-link { margin:4px 16px 12px; display:flex; align-items:center; gap:8px; padding:9px 12px; border:1px solid var(--line); background:var(--bg); border-radius:10px; color:var(--ink); font-size:14px; font-weight:600; text-decoration:none; transition:border-color .2s; }
  .atlas-link:hover { border-color:var(--accent); }
  .atlas-link svg:last-child { margin-left:auto; color:var(--accent); }
  .rail-progress { margin:0 20px 6px; }
  .rail-progress .row { display:flex; justify-content:space-between; font-size:12px; }
  .nav { overflow-y:auto; padding:4px 10px 20px; flex:1; }
  .nav-group { margin-top:14px; }
  .nav-group .eyebrow { padding:0 10px 6px; display:flex; align-items:center; gap:7px; font-size:11px; }
  .nav-group .eyebrow i { width:7px; height:7px; border-radius:2px; flex:none; }
  .nav-item { display:flex; align-items:center; gap:10px; width:100%; padding:7px 10px; border:0; border-radius:8px; background:transparent; cursor:pointer; text-align:left; font-size:14px; color:var(--muted); position:relative; transition:background .15s,color .15s; }
  .nav-item:hover { background:var(--surface-2); color:var(--ink); }
  .nav-item.on { color:var(--ink); background:var(--accent-soft); font-weight:600; }
  .nav-item.on::before { content:""; position:absolute; left:-10px; top:8px; bottom:8px; width:3px; border-radius:3px; background:var(--accent); }
  .nav-item .num { font-family:var(--f-mono); font-size:11px; color:var(--muted); width:20px; flex:none; }
  .nav-item .t { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .nav-item .tick { margin-left:auto; color:var(--good); display:flex; }
  .main { margin-left:var(--rail); min-height:100vh; padding-bottom:48px; }
  .topbar, .dock { display:none; }
  .wrap { max-width:1120px; margin:0 auto; padding-left:max(28px,env(safe-area-inset-left,0px)); padding-right:max(28px,env(safe-area-inset-right,0px)); padding-block:32px; }
  .wrap.wide { max-width:1480px; }
  .nav-item .badge { margin-left:auto; font-family:var(--f-mono); font-size:11px; font-weight:500; min-width:20px; padding:1px 6px; border-radius:999px; background:var(--accent); color:#fff; text-align:center; }
  .icon-btn { border:1px solid var(--line); background:var(--surface); border-radius:10px; width:40px; height:40px; display:grid; place-items:center; cursor:pointer; }
  @media (max-width:900px){
    .rail { display:none; }
    .main { margin-left:0; padding-bottom:calc(var(--dock) + 24px + env(safe-area-inset-bottom,0px)); }
    .topbar { display:flex; position:sticky; top:env(safe-area-inset-top,0px); z-index:25; align-items:center; gap:10px; background:color-mix(in srgb,var(--bg) 88%,transparent); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); border-bottom:1px solid var(--line); padding-block:10px; padding-left:max(16px,env(safe-area-inset-left,0px)); padding-right:max(16px,env(safe-area-inset-right,0px)); }
    .topbar .brand { padding:0; }
    .topbar .atlas-link { margin:0 0 0 auto; padding:6px 10px; font-size:13px; }
    .dock { display:flex; position:fixed; left:0; right:0; bottom:0; z-index:30; background:var(--surface); border-top:1px solid var(--line); padding-bottom:env(safe-area-inset-bottom,0px); padding-left:env(safe-area-inset-left,0px); padding-right:env(safe-area-inset-right,0px); }
    .dock button { flex:1; min-width:0; display:flex; flex-direction:column; align-items:center; gap:2px; padding:9px 0 8px; border:0; background:none; cursor:pointer; font-size:11px; color:var(--muted); position:relative; }
    .dock button.on { color:var(--accent); }
    .dock button.on::after { content:""; position:absolute; top:0; left:30%; right:30%; height:2px; background:var(--accent); border-radius:0 0 2px 2px; animation:grow .3s ease-out; }
    .wrap { padding-left:max(16px,env(safe-area-inset-left,0px)); padding-right:max(16px,env(safe-area-inset-right,0px)); padding-block:20px; }
  }

  /* motion */
  .page { animation:enter .42s cubic-bezier(.2,.7,.2,1) both; }
  .stagger > * { animation:enter .5s cubic-bezier(.2,.7,.2,1) both; animation-delay:calc(min(var(--i,0),8) * 55ms); }
  @keyframes enter { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:none; } }
  @keyframes grow { from { transform:scaleX(0); } to { transform:scaleX(1); } }
  @keyframes pop { 0% { transform:scale(.85); } 60% { transform:scale(1.12); } 100% { transform:scale(1); } }
  @media (prefers-reduced-motion: reduce){ *, *::before, *::after { animation:none!important; transition:none!important; } }

  /* shared atoms */
  .panel { background:var(--surface); border:1px solid var(--line); border-radius:14px; padding:18px; min-width:0; }
  .panel h3 { font-size:18px; font-weight:700; font-stretch:108%; }
  .pill { display:inline-flex; align-items:center; gap:5px; font-size:12px; font-weight:600; padding:3px 9px; border-radius:999px; white-space:nowrap; }
  .btn { display:inline-flex; align-items:center; gap:8px; padding:9px 14px; border-radius:10px; border:1px solid var(--line); background:var(--surface); cursor:pointer; font-size:14px; font-weight:600; transition:transform .15s,border-color .15s,background .15s; }
  .btn:hover:not([disabled]) { border-color:var(--accent); }
  .btn:active:not([disabled]) { transform:scale(.97); }
  .btn[disabled] { opacity:.45; cursor:default; }
  .meter { height:6px; background:var(--surface-2); border-radius:6px; overflow:hidden; }
  .meter i { display:block; height:100%; background:var(--accent); border-radius:6px; transition:width .45s cubic-bezier(.2,.7,.2,1); }
  .stats { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:10px; }
  .stats > div { padding:14px; border-radius:12px; background:var(--surface); border:1px solid var(--line); }
  .stats b { display:block; font-family:var(--f-display); font-stretch:112%; font-size:26px; font-variant-numeric:tabular-nums; line-height:1.1; }
  .stats span { font-size:12.5px; color:var(--muted); }
  .sec-head { display:flex; align-items:baseline; justify-content:space-between; gap:12px; margin:34px 0 14px; flex-wrap:wrap; }
  .sec-head h2 { font-size:24px; font-weight:750; font-stretch:112%; }
  .page-head { margin-bottom:22px; }
  .page-head h1 { font-size:clamp(30px,4.6vw,46px); line-height:1.02; font-weight:800; font-stretch:116%; margin:8px 0 12px; }
  .page-head h1 em { font-style:normal; color:var(--accent); }
  .page-head p.lede { font-size:18px; color:var(--muted); max-width:62ch; margin:0; }
  .callout { border-radius:12px; padding:14px 16px; display:grid; gap:4px; background:var(--accent-soft); }
  .callout .ct { font-family:var(--f-mono); font-size:11.5px; letter-spacing:.07em; text-transform:uppercase; font-weight:500; color:var(--accent); }
  .key-row { display:flex; flex-wrap:wrap; gap:6px 14px; font-size:13px; color:var(--muted); }
  .key-row span { display:inline-flex; align-items:center; gap:6px; }
  .key-row i { width:10px; height:10px; border-radius:3px; }

  /* week view */
  .crumbs { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
  .week-bar { display:flex; align-items:center; gap:14px; flex-wrap:wrap; margin:18px 0 22px; }
  .week-bar .meter { flex:1; min-width:140px; }
  .week-bar .nav-btns { display:flex; gap:8px; }
  .chipbar { display:none; }
  @media (max-width:900px){
    .chipbar { display:flex; gap:6px; overflow-x:auto; margin:0 0 16px; padding-bottom:4px; scrollbar-width:none; }
    .chipbar::-webkit-scrollbar { display:none; }
    .chipbar button { flex:none; font-family:var(--f-mono); font-size:13px; padding:5px 11px; border-radius:999px; border:1px solid var(--line); color:var(--muted); background:var(--surface); cursor:pointer; }
    .chipbar button.on { border-color:var(--accent); color:var(--accent); }
  }
  .track { background:var(--surface); border:1px solid var(--line); border-radius:14px; overflow:hidden; margin-bottom:12px; position:relative; }
  .track::before { content:""; position:absolute; left:0; top:14px; height:22px; width:3px; border-radius:0 3px 3px 0; background:var(--tc); }
  .track-head { display:flex; align-items:center; gap:10px; width:100%; padding:12px 16px; border:0; background:transparent; cursor:pointer; text-align:left; }
  .track-head .count { margin-left:auto; font-family:var(--f-mono); font-size:13px; color:var(--muted); font-variant-numeric:tabular-nums; }
  .track-head .chev { color:var(--muted); display:flex; transition:transform .2s; }
  .track-head .chev.open { transform:rotate(90deg); }
  .track-items { border-top:1px solid var(--line); padding:6px; display:grid; gap:2px; }
  .item { display:flex; align-items:flex-start; gap:12px; width:100%; padding:9px 10px; border:0; border-radius:10px; background:transparent; cursor:pointer; text-align:left; font-size:15px; line-height:1.5; transition:background .15s; }
  .item:hover { background:var(--surface-2); }
  .item.done .txt { text-decoration:line-through; color:var(--muted); }
  .cbox { width:20px; height:20px; flex:none; margin-top:1px; border-radius:6px; border:1.5px solid var(--line); display:grid; place-items:center; color:#fff; transition:background .15s,border-color .15s; }
  .item:hover .cbox { border-color:var(--tc); }
  .item.done .cbox { background:var(--tc); border-color:var(--tc); animation:pop .3s ease-out; }

  /* overview */
  .phases { display:grid; grid-template-columns:repeat(auto-fill,minmax(320px,1fr)); gap:12px; }
  .phase { position:relative; display:flex; flex-direction:column; gap:10px; }
  .phase::before { content:""; position:absolute; left:0; top:18px; height:24px; width:3px; border-radius:0 3px 3px 0; background:var(--pc); }
  .phase .head { display:flex; align-items:baseline; justify-content:space-between; gap:10px; }
  .wk-chips { display:flex; flex-wrap:wrap; gap:6px; }
  .wk-chip { display:inline-flex; align-items:center; gap:6px; font-size:13px; padding:5px 10px; border-radius:8px; border:1px solid var(--line); background:var(--bg); cursor:pointer; text-align:left; transition:border-color .15s,transform .15s; }
  .wk-chip:hover { border-color:var(--pc); transform:translateY(-1px); }
  .wk-chip .n { font-family:var(--f-mono); font-size:11.5px; color:var(--pc); }
  .wk-chip .ok { color:var(--good); display:flex; }

  /* heatmap */
  .hm-scroll { overflow-x:auto; }
  .hm { display:grid; grid-template-columns:64px repeat(26,minmax(18px,1fr)); gap:3px; min-width:720px; font-family:var(--f-mono); }
  .hm-phase { height:20px; display:flex; align-items:center; justify-content:center; font-size:10.5px; font-weight:500; overflow:hidden; }
  .hm-wk { font-size:11px; color:var(--muted); text-align:center; }
  .hm-label { font-size:11.5px; font-weight:500; display:flex; align-items:center; }
  .hm-cell { height:24px; border-radius:4px; border:0; padding:0; cursor:pointer; transition:transform .12s,box-shadow .12s; }
  .hm-cell:hover { transform:scale(1.15); box-shadow:var(--shadow); }
  .hm-cell.empty { background:var(--surface-2); cursor:default; }
  .hm-cell.empty:hover { transform:none; box-shadow:none; }
  .hm-detail { margin-top:14px; min-height:68px; }

  /* daily */
  .days { display:grid; grid-template-columns:repeat(7,minmax(140px,1fr)); gap:10px; overflow-x:auto; padding-bottom:6px; }
  .day { padding:14px; display:flex; flex-direction:column; gap:8px; }
  .day h3 { font-size:17px; }
  .day-block { position:relative; padding:8px 10px 8px 12px; border-radius:10px; background:var(--bg); border:1px solid var(--line); }
  .day-block::before { content:""; position:absolute; left:0; top:8px; bottom:8px; width:3px; border-radius:0 3px 3px 0; background:var(--tc); }
  .day-block b { display:block; font-size:14px; }
  .day-block span { font-family:var(--f-mono); font-size:12px; color:var(--muted); }
  .tbl { overflow-x:auto; border:1px solid var(--line); border-radius:12px; background:var(--surface); }
  .tbl table { border-collapse:collapse; width:100%; font-size:14px; min-width:480px; }
  .tbl th { text-align:left; font-family:var(--f-mono); font-weight:500; font-size:11.5px; letter-spacing:.06em; text-transform:uppercase; color:var(--muted); background:var(--surface-2); padding:10px 12px; }
  .tbl td { padding:10px 12px; border-top:1px solid var(--line); vertical-align:top; line-height:1.5; }
  .tbl tr:hover td { background:var(--accent-soft); }
  .tbl td:first-child { font-weight:600; white-space:nowrap; }

  /* milestones */
  .tl { list-style:none; margin:0; padding:0; position:relative; }
  .tl::before { content:""; position:absolute; left:43px; top:10px; bottom:10px; width:2px; background:var(--line); }
  .tl li { position:relative; }
  .tl button { display:grid; grid-template-columns:88px minmax(0,1fr); gap:14px; width:100%; padding:8px 0; border:0; background:none; cursor:pointer; text-align:left; }
  .tl .m { font-family:var(--f-mono); font-size:12px; font-variant-numeric:tabular-nums; background:var(--surface); border:1px solid var(--line); border-radius:999px; text-align:center; padding:4px 0; height:fit-content; position:relative; z-index:1; transition:background .2s,color .2s,border-color .2s; }
  .tl button:hover .m { background:var(--mc); color:#fff; border-color:var(--mc); }
  .tl b { display:block; font-size:15px; }
  .tl span { font-size:14px; color:var(--muted); }

  /* streaks */
  .g2 { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }
  @media (max-width:760px){ .g2 { grid-template-columns:1fr; } }
  .streak-head { display:flex; align-items:center; gap:12px; margin-bottom:14px; }
  .streak-stats { display:flex; gap:20px; margin-left:auto; }
  .stat b { display:block; font-family:var(--f-display); font-stretch:112%; font-size:28px; font-weight:700; font-variant-numeric:tabular-nums; line-height:1.1; }
  .stat span { font-size:12px; color:var(--muted); }
  .cal { display:grid; grid-template-columns:repeat(7,1fr); gap:4px; }
  .cal .dow { font-family:var(--f-mono); font-size:11px; color:var(--muted); text-align:center; }
  .cal button { height:18px; border-radius:4px; border:0; padding:0; background:var(--surface-2); cursor:pointer; transition:transform .12s; }
  .cal button:hover { transform:scale(1.15); }
  .cal button.today { outline:1.5px solid var(--sc); outline-offset:1px; }
  .cal button.on { background:var(--sc); }
`;

// ─── TrackBlock Component ─────────────────────────────────────────────────────
function TrackBlock({ trackKey, items, checked, onToggle, index }) {
  const [open, setOpen] = useState(true);
  const meta = trackMeta(trackKey);
  if (!meta || !items?.length) return null;
  const doneCount = items.filter((_, i) => checked[`${trackKey}-${i}`]).length;
  const c = tone(trackKey);

  return (
    <section className="track" style={{ "--tc": c, "--i": index }}>
      <button className="track-head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="pill" style={{ background: soft(c), color: c }}>{meta.label}</span>
        {doneCount === items.length && (
          <span className="pill" style={{ background: "var(--good-soft)", color: "var(--good)" }}><Icon n="check" s={13} />Done</span>
        )}
        <span className="count">{doneCount}/{items.length}</span>
        <span className={`chev ${open ? "open" : ""}`}><Icon n="chev" s={16} /></span>
      </button>
      {open && (
        <div className="track-items">
          {items.map((item, i) => {
            const ck = `${trackKey}-${i}`;
            const isDone = !!checked[ck];
            return (
              <button key={i} className={`item ${isDone ? "done" : ""}`} role="checkbox" aria-checked={isDone} onClick={() => onToggle(ck)}>
                <span className="cbox">{isDone && <Icon n="check" s={14} />}</span>
                <span className="txt">{item}</span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

function TrackKey() {
  return (
    <div className="key-row">
      {TRACKS.map((t) => (
        <span key={t.key}><i style={{ background: tone(t.key) }} />{t.label}</span>
      ))}
    </div>
  );
}

// ─── Heatmap Tab ──────────────────────────────────────────────────────────────
function HeatmapTab({ onWeekClick }) {
  const [hovered, setHovered] = useState(null);

  return (
    <div className="page">
      <header className="page-head">
        <span className="eyebrow">Load by week</span>
        <h1>Curriculum heatmap</h1>
        <p className="lede">Each cell is one track in one week. Darker means more items. Click a cell to open that week.</p>
      </header>

      <div className="panel">
        <div style={{ marginBottom: 16 }}><TrackKey /></div>
        <div className="hm-scroll">
          <div className="hm">
            {/* Phase band */}
            <div />
            {Array.from({ length: 26 }, (_, i) => i + 1).map((wn) => {
              const ph = phaseFor(wn);
              const c = tone(ph?.color);
              const isStart = ph && ph.weeks[0] === wn;
              return (
                <div key={wn} className="hm-phase" style={{
                  background: ph ? soft(c, isStart ? 22 : 10) : "transparent",
                  color: c,
                  borderRadius: isStart ? "4px 0 0 4px" : ph?.weeks[1] === wn ? "0 4px 4px 0" : 0,
                }}>
                  {isStart ? `P${ph.id}` : ""}
                </div>
              );
            })}

            {/* Week numbers */}
            <div />
            {Array.from({ length: 26 }, (_, i) => (
              <div key={i} className="hm-wk">{i + 1}</div>
            ))}

            {/* Track rows */}
            {TRACKS.map((track) => {
              const c = tone(track.key);
              return (
                <div key={track.key} style={{ display: "contents" }}>
                  <div className="hm-label" style={{ color: c }}>{track.label.split(" ")[0]}</div>
                  {WEEKS.map((w) => {
                    const items = w[track.key] || [];
                    const hasData = items.length > 0;
                    const pct = Math.round(Math.min(30 + (items.length / 4) * 70, 100));
                    return (
                      <button
                        key={w.n}
                        className={`hm-cell ${hasData ? "" : "empty"}`}
                        style={hasData ? { background: `color-mix(in srgb, ${c} ${pct}%, var(--surface))` } : undefined}
                        title={`Week ${w.n} · ${track.label}: ${hasData ? items[0] : "—"}`}
                        aria-label={`Week ${w.n} ${track.label}, ${items.length} items`}
                        onMouseEnter={() => setHovered({ week: w.n, track: track.key })}
                        onFocus={() => setHovered({ week: w.n, track: track.key })}
                        onMouseLeave={() => setHovered(null)}
                        onClick={() => hasData && onWeekClick(w.n)}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="panel hm-detail">
        {hovered ? (() => {
          const w = WEEKS[hovered.week - 1];
          const items = w[hovered.track] || [];
          const t = trackMeta(hovered.track);
          return (
            <>
              <div className="crumbs">
                <span className="pill" style={{ background: soft(tone(t.key)), color: tone(t.key) }}>{t.label}</span>
                <span className="eyebrow">Week {hovered.week} · {w.title}</span>
              </div>
              <div style={{ marginTop: 6 }}>{items.length > 0 ? items[0] : <span className="muted">Nothing scheduled for this track.</span>}</div>
            </>
          );
        })() : <span className="muted">Hover a cell to preview what's scheduled.</span>}
      </div>
    </div>
  );
}

// ─── Daily Schedule Tab ───────────────────────────────────────────────────────
function DailyTab() {
  return (
    <div className="page">
      <header className="page-head">
        <span className="eyebrow">Weekly rhythm</span>
        <h1>Daily split</h1>
        <p className="lede">How each day of the week is spent, and the hours every track gets.</p>
      </header>

      <div className="stats stagger">
        {TRACKS.map((t, i) => {
          const wkHours = DAILY_BLOCKS.reduce((sum, day) => {
            return sum + day.blocks.filter((b) => b.track === t.key).reduce((s, b) => s + b.mins, 0);
          }, 0) / 60;
          return (
            <div key={t.key} style={{ "--i": i }}>
              <b style={{ color: tone(t.key) }}>{wkHours.toFixed(1)}h</b>
              <span>{t.label} / week</span>
            </div>
          );
        })}
      </div>

      <div className="sec-head"><h2>The week</h2></div>
      <div className="days stagger">
        {DAILY_BLOCKS.map((day, i) => (
          <div key={day.day} className="panel day" style={{ "--i": i }}>
            <div>
              <h3>{day.day}</h3>
              <span className="eyebrow" style={{ fontSize: 11 }}>{day.theme}</span>
            </div>
            {day.blocks.map((b, j) => (
              <div key={j} className="day-block" style={{ "--tc": tone(b.track) }}>
                <b>{b.label}</b>
                <span>{b.mins} min</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="sec-head"><h2>Execution rules</h2></div>
      <div className="tbl">
        <table>
          <thead><tr><th>Block</th><th>Rule</th></tr></thead>
          <tbody>
            {[
              ["DSA blocks", "Always timed. 25 min per problem. No peeking before the timer ends."],
              ["DP blocks", "Write the recurrence on paper first. Never start coding before defining state."],
              ["Sys Design", "Whiteboard or paper first. No keyboard until you have the full diagram sketched."],
              ["FSD blocks", "No passive reading. Every session ends with code written or a diagram drawn."],
              ["Breaks", "Non-negotiable. 30 min after each major block. No screens."],
              ["Saturday", "Treat as a real interview loop. Camera on, timer running, no pausing."],
              ["Error log", "Every failed problem → root cause in one sentence. Review every Sunday."],
            ].map(([title, rule]) => (
              <tr key={title}><td>{title}</td><td>{rule}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Milestones Tab ───────────────────────────────────────────────────────────
function MilestonesTab({ onWeekClick }) {
  return (
    <div className="page">
      <header className="page-head">
        <span className="eyebrow">Checkpoints</span>
        <h1>Milestones</h1>
        <p className="lede">The outcomes each stretch of the plan should land. Click one to open its week.</p>
      </header>
      <ol className="tl stagger">
        {MILESTONES.map((m, i) => {
          const ph = phaseFor(m.week);
          return (
            <li key={i} style={{ "--i": i, "--mc": tone(m.color) }}>
              <button onClick={() => onWeekClick(m.week)}>
                <span className="m" style={{ borderColor: tone(m.color), color: tone(m.color) }}>Wk {m.week}</span>
                <span>
                  <b style={{ color: "var(--ink)" }}>{m.text}</b>
                  {ph && <span>{ph.label} · {ph.name}</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ─── Week View ────────────────────────────────────────────────────────────────
function WeekView({ week, checked, onToggle, onWeekClick, onOpenProblem }) {
  const ph = phaseFor(week.n);
  const pc = tone(ph?.color);
  const activeTracks = TRACKS.filter((t) => (week[t.key] || []).length > 0);
  const totalItems = activeTracks.reduce((s, t) => s + (week[t.key] || []).length, 0);
  const doneItems = activeTracks.reduce((s, t) => {
    return s + (week[t.key] || []).filter((_, i) => checked[`${t.key}-${i}`]).length;
  }, 0);
  const progress = totalItems > 0 ? (doneItems / totalItems) * 100 : 0;

  return (
    <div className="page">
      <div className="chipbar" aria-label="Weeks">
        {WEEKS.map((w) => (
          <button key={w.n} className={w.n === week.n ? "on" : ""} onClick={() => onWeekClick(w.n)}>W{w.n}</button>
        ))}
      </div>

      <header className="page-head" style={{ marginBottom: 0 }}>
        <div className="crumbs">
          {ph && <span className="pill" style={{ background: soft(pc), color: pc }}>{ph.label} · {ph.name}</span>}
          <span className="eyebrow">Week {week.n} of 26</span>
        </div>
        <h1>{week.title}</h1>
        {week.goal && <p className="lede">{week.goal}</p>}
      </header>

      <div className="week-bar">
        <div className="meter" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
          <i style={{ width: `${progress}%` }} />
        </div>
        <span className="mono small muted" style={{ fontSize: 13 }}>{doneItems}/{totalItems} done</span>
        <div className="nav-btns">
          <button className="btn" disabled={week.n <= 1} onClick={() => onWeekClick(week.n - 1)}><Icon n="back" s={16} />Prev</button>
          <button className="btn" disabled={week.n >= 26} onClick={() => onWeekClick(week.n + 1)}>Next<Icon n="arrow" s={16} /></button>
        </div>
      </div>

      <div className="stagger">
        {activeTracks.map((t, i) => (
          <TrackBlock
            key={t.key}
            index={i}
            trackKey={t.key}
            items={week[t.key] || []}
            checked={checked}
            onToggle={onToggle}
          />
        ))}
      </div>

      <Suspense fallback={null}>
        <WeekLeetCode week={week.n} onOpen={onOpenProblem} />
        <WeekPractice week={week.n} onOpen={onOpenProblem} />
      </Suspense>

      {week.goal && (
        <div className="callout" style={{ marginTop: 16 }}>
          <span className="ct">Goal this week</span>
          <span>{week.goal}</span>
        </div>
      )}
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ onWeekClick, checked }) {
  const weekDone = (w) => {
    const total = TRACKS.reduce((s, t) => s + (w[t.key] || []).length, 0);
    const done = TRACKS.reduce((s, t) => s + (w[t.key] || []).filter((_, i) => checked[`w${w.n}-${t.key}-${i}`]).length, 0);
    return { total, done };
  };

  return (
    <div className="page">
      <header className="page-head">
        <span className="eyebrow">26-week curriculum</span>
        <h1>Six phases. <em>One offer.</em></h1>
        <p className="lede">Foundations, pattern mastery, system design depth, full-stack, then interview execution — overlapping so no track goes cold.</p>
      </header>

      <div className="stats stagger">
        {[["26", "Total weeks"], ["500+", "DSA problems"], ["40+", "Systems"], ["8", "STAR stories"]].map(([n, l], i) => (
          <div key={l} style={{ "--i": i }}><b>{n}</b><span>{l}</span></div>
        ))}
      </div>

      <div className="sec-head"><h2>Phases</h2></div>
      <div className="phases stagger">
        {PHASES.map((ph, i) => {
          const pc = tone(ph.color);
          const weeks = WEEKS.filter((w) => w.n >= ph.weeks[0] && w.n <= ph.weeks[1]);
          const agg = weeks.reduce((a, w) => { const d = weekDone(w); return { total: a.total + d.total, done: a.done + d.done }; }, { total: 0, done: 0 });
          return (
            <div key={ph.id} className="panel phase" style={{ "--pc": pc, "--i": i }}>
              <div className="head">
                <div>
                  <span className="eyebrow" style={{ color: pc }}>{ph.label}</span>
                  <h3>{ph.name}</h3>
                </div>
                <span className="mono muted" style={{ fontSize: 12 }}>Wk {ph.weeks[0]}–{ph.weeks[1]}</span>
              </div>
              <div className="meter"><i style={{ width: `${agg.total ? (agg.done / agg.total) * 100 : 0}%`, background: pc }} /></div>
              <div className="wk-chips">
                {weeks.map((w) => {
                  const d = weekDone(w);
                  return (
                    <button key={w.n} className="wk-chip" onClick={() => onWeekClick(w.n)}>
                      <span className="n">W{w.n}</span>{w.title}
                      {d.total > 0 && d.done === d.total && <span className="ok"><Icon n="check" s={13} /></span>}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Streak Helpers ───────────────────────────────────────────────────────────
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDays(dateStr, n) {
  const [y, m, dd] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, dd + n);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function computeStreak(dateSet) {
  const today = todayStr();
  const yesterday = addDays(today, -1);
  let current = 0;
  if (dateSet.has(today) || dateSet.has(yesterday)) {
    let cur = dateSet.has(today) ? today : yesterday;
    while (dateSet.has(cur)) { current++; cur = addDays(cur, -1); }
  }
  const sorted = [...dateSet].sort();
  let longest = 0, run = 0, prev = null;
  for (const ds of sorted) {
    run = (prev && addDays(prev, 1) === ds) ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = ds;
  }
  return { current, longest };
}

const STREAK_TRACKS = [
  { key: "dsa", label: "DSA" },
  { key: "dp",  label: "DP" },
  { key: "sd",  label: "Sys Design" },
  { key: "fsd", label: "Full-Stack" },
];

// ─── Streak Tab ───────────────────────────────────────────────────────────────
function StreakTab({ streaks, onToggle }) {
  const today = todayStr();
  const days = [];
  for (let i = 90; i >= 0; i--) days.push(addDays(today, -i));
  const [fy, fm, fd] = days[0].split("-").map(Number);
  const startDow = new Date(fy, fm - 1, fd).getDay();

  return (
    <div className="page">
      <header className="page-head">
        <span className="eyebrow">Last 90 days</span>
        <h1>Streak log</h1>
        <p className="lede">Click a day to mark that track done. Saved in this browser.</p>
      </header>
      <div className="g2 stagger">
        {STREAK_TRACKS.map((track, i) => {
          const sc = tone(track.key);
          const dateSet = new Set(Object.keys(streaks[track.key] || {}).filter((k) => streaks[track.key][k]));
          const { current, longest } = computeStreak(dateSet);
          return (
            <div key={track.key} className="panel" style={{ "--sc": sc, "--i": i }}>
              <div className="streak-head">
                <span className="pill" style={{ background: soft(sc), color: sc }}>{track.label}</span>
                <div className="streak-stats">
                  <div className="stat"><b style={{ color: sc }}>{current}</b><span>Current</span></div>
                  <div className="stat"><b>{longest}</b><span>Longest</span></div>
                </div>
              </div>
              <div className="cal">
                {["S", "M", "T", "W", "T", "F", "S"].map((d, j) => (
                  <div key={j} className="dow">{d}</div>
                ))}
                {Array.from({ length: startDow }, (_, j) => <div key={`p${j}`} />)}
                {days.map((ds) => {
                  const done = dateSet.has(ds);
                  return (
                    <button
                      key={ds}
                      title={ds}
                      aria-label={`${track.label} ${ds}${done ? ", done" : ""}`}
                      aria-pressed={done}
                      onClick={() => onToggle(track.key, ds)}
                      className={`${done ? "on" : ""} ${ds === today ? "today" : ""}`}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
// Practice views keep a hash (#practice, #p/<id>) so a refresh lands back on the same problem.
function initialRoute() {
  const h = window.location.hash;
  if (h.startsWith("#p/")) return { tab: "problem", problem: decodeURIComponent(h.slice(3)) };
  if (h === "#practice") return { tab: "practice", problem: null };
  if (h.startsWith("#lists")) return { tab: "lists", problem: null, list: h.slice(7) || "neetcode150" };
  return { tab: "week", problem: null };
}

export default function App() {
  const [activeWeek, setActiveWeek] = useState(1);
  const [activeTab, setActiveTab] = useState(() => initialRoute().tab);
  const [activeProblem, setActiveProblem] = useState(() => initialRoute().problem);
  const [activeList, setActiveList] = useState(() => initialRoute().list || "neetcode150");
  const practice = usePractice();
  const due = dueCount(practice);
  const [checked, setChecked] = useState({});
  const [streaks, setStreaks] = useState(() => {
    try { return JSON.parse(localStorage.getItem("faang-streaks") || "{}"); } catch { return {}; }
  });

  useEffect(() => {
    localStorage.setItem("faang-streaks", JSON.stringify(streaks));
  }, [streaks]);

  useEffect(() => {
    window.scrollTo(0, 0);
    const hash = activeTab === "problem" ? `#p/${encodeURIComponent(activeProblem)}` : activeTab === "practice" ? "#practice" : activeTab === "lists" ? `#lists/${activeList}` : "";
    if (hash !== window.location.hash) window.history.pushState(null, "", hash || window.location.pathname);
  }, [activeTab, activeWeek, activeProblem, activeList]);

  // Back/forward and hand-edited hashes.
  useEffect(() => {
    const sync = () => {
      const r = initialRoute();
      if (r.tab === "week") {
        // Left the practice area: back to the week plan (other tabs aren't in the URL).
        setActiveTab((t) => (t === "practice" || t === "problem" || t === "lists" ? "week" : t));
        return;
      }
      setActiveTab(r.tab);
      setActiveProblem(r.problem);
      if (r.list) setActiveList(r.list);
    };
    window.addEventListener("popstate", sync);
    window.addEventListener("hashchange", sync);
    return () => { window.removeEventListener("popstate", sync); window.removeEventListener("hashchange", sync); };
  }, []);

  const handleToggle = useCallback((key) => {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleStreakToggle = useCallback((trackKey, dateStr) => {
    setStreaks((prev) => ({
      ...prev,
      [trackKey]: { ...(prev[trackKey] || {}), [dateStr]: !(prev[trackKey]?.[dateStr]) },
    }));
  }, []);

  const goToWeek = (n) => {
    setActiveWeek(n);
    setActiveTab("week");
  };

  const openProblem = (id) => {
    setActiveProblem(id);
    setActiveTab("problem");
  };

  const currentWeek = WEEKS[activeWeek - 1];

  // Progress across all weeks
  const totalAll = WEEKS.reduce((s, w) => s + TRACKS.reduce((ts, t) => ts + (w[t.key] || []).length, 0), 0);
  const doneAll = Object.values(checked).filter(Boolean).length;
  const weekComplete = (w) => {
    const total = TRACKS.reduce((s, t) => s + (w[t.key] || []).length, 0);
    return total > 0 && TRACKS.every((t) => (w[t.key] || []).every((_, i) => checked[`w${w.n}-${t.key}-${i}`]));
  };

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div className="trk">

        {/* ─── Rail (desktop) ───────────────────────── */}
        <aside className="rail">
          <button className="brand" onClick={() => setActiveTab("overview")}>
            <Mark />
            <span className="brand-name">FAANG Prep<small>26-week tracker</small></span>
          </button>
          <a className="atlas-link" href="/atlas">
            <Icon n="map" s={16} />System Design Atlas<Icon n="arrow" s={15} />
          </a>
          <div className="rail-progress">
            <div className="row"><span className="eyebrow" style={{ fontSize: 11 }}>Overall</span><span className="mono" style={{ color: "var(--accent)" }}>{doneAll}/{totalAll}</span></div>
            <div className="meter" style={{ marginTop: 6 }}><i style={{ width: `${(doneAll / totalAll) * 100}%` }} /></div>
          </div>

          <nav className="nav">
            <div className="nav-group">
              <span className="eyebrow">Views</span>
              {VIEWS.filter((v) => v.key !== "week").map((v) => (
                <button key={v.key} className={`nav-item ${activeTab === v.key || (v.key === "practice" && activeTab === "problem") ? "on" : ""}`} onClick={() => setActiveTab(v.key)}>
                  <Icon n={v.icon} s={17} />{v.label}
                  {v.key === "practice" && due > 0 && <span className="badge" title={`${due} due for revision`}>{due}</span>}
                </button>
              ))}
            </div>
            {PHASES.map((ph) => (
              <div key={ph.id} className="nav-group">
                <span className="eyebrow"><i style={{ background: tone(ph.color) }} />{ph.label} · {ph.name}</span>
                {WEEKS.filter((w) => w.n >= ph.weeks[0] && w.n <= ph.weeks[1]).map((w) => (
                  <button
                    key={w.n}
                    className={`nav-item ${activeWeek === w.n && activeTab === "week" ? "on" : ""}`}
                    onClick={() => goToWeek(w.n)}
                  >
                    <span className="num">{String(w.n).padStart(2, "0")}</span>
                    <span className="t">{w.title}</span>
                    {weekComplete(w) && <span className="tick"><Icon n="check" s={14} /></span>}
                  </button>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        {/* ─── Main ─────────────────────────────────── */}
        <main className="main">
          <div className="topbar">
            <button className="brand" onClick={() => setActiveTab("overview")}><Mark /><span className="brand-name">FAANG Prep</span></button>
            <a className="atlas-link" href="/atlas"><Icon n="map" s={15} />Atlas</a>
          </div>

          <div
            className={`wrap ${activeTab === "problem" ? "wide" : ""}`}
            key={activeTab + (activeTab === "week" ? activeWeek : activeTab === "problem" ? activeProblem : "")}
          >
            {activeTab === "week" && (
              <WeekView
                week={currentWeek}
                checked={
                  // Scope checked state per week
                  Object.fromEntries(
                    Object.entries(checked)
                      .filter(([k]) => k.startsWith(`w${activeWeek}-`))
                      .map(([k, v]) => [k.replace(`w${activeWeek}-`, ""), v])
                  )
                }
                onToggle={(key) => handleToggle(`w${activeWeek}-${key}`)}
                onWeekClick={goToWeek}
                onOpenProblem={openProblem}
              />
            )}
            {activeTab === "overview" && <OverviewTab onWeekClick={goToWeek} checked={checked} />}
            {activeTab === "heatmap" && <HeatmapTab onWeekClick={goToWeek} />}
            {activeTab === "daily" && <DailyTab />}
            {activeTab === "milestones" && <MilestonesTab onWeekClick={goToWeek} />}
            {activeTab === "streaks" && <StreakTab streaks={streaks} onToggle={handleStreakToggle} />}
            {(activeTab === "practice" || activeTab === "problem" || activeTab === "lists") && (
              <Suspense fallback={<div className="muted mono" style={{ fontSize: 13 }}>Loading practice…</div>}>
                {activeTab === "practice"
                  ? <Practice onOpen={openProblem} onLists={(k) => { setActiveList(k); setActiveTab("lists"); }} />
                  : activeTab === "lists"
                  ? <LeetCodeLists list={activeList} onList={setActiveList} onOpen={openProblem} onWeek={goToWeek} />
                  : <ProblemPage id={activeProblem} onOpen={openProblem} onBack={() => setActiveTab("practice")} onWeek={goToWeek} />}
              </Suspense>
            )}
          </div>
        </main>

        {/* ─── Dock (phone) ─────────────────────────── */}
        <nav className="dock" aria-label="Main">
          {VIEWS.filter((v) => v.dock !== false).map((v) => (
            <button key={v.key} className={activeTab === v.key || (v.key === "practice" && activeTab === "problem") ? "on" : ""} onClick={() => setActiveTab(v.key)}>
              <Icon n={v.icon} s={21} />{v.short}
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}
