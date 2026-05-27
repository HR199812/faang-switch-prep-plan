import { useState, useCallback } from "react";
import { PHASES, TRACKS, WEEKS, MILESTONES, DAILY_BLOCKS } from "./data/weeks.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const phaseFor = (n) => PHASES.find((p) => n >= p.weeks[0] && n <= p.weeks[1]);
const trackMeta = (key) => TRACKS.find((t) => t.key === key);

const TRACK_LABELS = {
  dsa: "DSA", dp: "DP", sd: "Sys Design", fsd: "Full-Stack", mock: "Mock / Apply", beh: "Behavioural",
};

// ─── Styles (CSS-in-JS strings injected via <style>) ─────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,300;0,400;0,500;0,700;1,400&family=Outfit:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --font-mono: 'JetBrains Mono', monospace;
    --font-sans: 'Outfit', sans-serif;
    --bg: #09090C;
    --bg1: #0F0F14;
    --bg2: #141419;
    --bg3: #1A1A22;
    --border: #1E1E2A;
    --border2: #2A2A38;
    --text: #E8E8F0;
    --text2: #8888A0;
    --text3: #444458;
    --accent: #22D3EE;
  }

  html, body, #root { height: 100%; width: 100%; }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-sans);
    font-size: 14px;
    line-height: 1.5;
    overflow: hidden;
  }

  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }

  /* Sidebar */
  .sidebar {
    width: 220px;
    flex-shrink: 0;
    background: var(--bg1);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .sidebar-logo {
    padding: 16px 16px 14px;
    border-bottom: 1px solid var(--border);
  }
  .sidebar-logo h1 {
    font-family: var(--font-mono);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text);
  }
  .sidebar-logo p {
    font-size: 10px;
    color: var(--text3);
    margin-top: 2px;
    font-family: var(--font-mono);
  }

  .sidebar-nav {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0;
  }

  .nav-section {
    padding: 8px 14px 4px;
    font-size: 9px;
    font-family: var(--font-mono);
    letter-spacing: 0.15em;
    color: var(--text3);
    text-transform: uppercase;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 14px;
    cursor: pointer;
    border: none;
    background: transparent;
    width: 100%;
    text-align: left;
    color: var(--text2);
    font-family: var(--font-sans);
    font-size: 12px;
    transition: all 0.12s;
    border-left: 2px solid transparent;
  }
  .nav-item:hover { background: var(--bg2); color: var(--text); }
  .nav-item.active { background: var(--bg3); color: var(--text); border-left-color: var(--item-color, var(--accent)); }
  .nav-item .week-num {
    font-family: var(--font-mono);
    font-size: 10px;
    color: inherit;
    opacity: 0.7;
    min-width: 28px;
  }
  .nav-item .week-dot {
    width: 6px; height: 6px; border-radius: 50%;
    flex-shrink: 0;
    background: var(--item-color, var(--border2));
  }
  .nav-item .week-title {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 11px;
  }

  /* Tabs */
  .tab-bar {
    display: flex;
    border-bottom: 1px solid var(--border);
    padding: 0 20px;
    gap: 0;
    flex-shrink: 0;
  }
  .tab-btn {
    padding: 10px 14px;
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text3);
    border: none;
    background: transparent;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    transition: all 0.12s;
  }
  .tab-btn:hover { color: var(--text2); }
  .tab-btn.active { color: var(--text); border-bottom-color: var(--accent); }

  /* Main area */
  .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
  .content { flex: 1; overflow-y: auto; padding: 24px; }

  /* Week header */
  .week-header {
    padding: 14px 20px 12px;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }
  .week-meta {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 4px;
  }
  .phase-badge {
    font-family: var(--font-mono);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    padding: 2px 8px;
    border-radius: 3px;
    border: 1px solid;
  }
  .week-title-main {
    font-family: var(--font-mono);
    font-size: 18px;
    font-weight: 700;
    color: var(--text);
    letter-spacing: -0.02em;
  }
  .week-goal {
    font-size: 12px;
    color: var(--text2);
    font-style: italic;
    margin-top: 3px;
    padding-left: 2px;
  }

  /* Track blocks */
  .track-block {
    margin-bottom: 10px;
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid var(--border);
  }
  .track-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 12px;
    cursor: pointer;
    user-select: none;
  }
  .track-label-pill {
    font-family: var(--font-mono);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 2px 7px;
    border-radius: 3px;
  }
  .track-count {
    font-family: var(--font-mono);
    font-size: 9px;
    color: var(--text3);
    margin-left: auto;
  }
  .track-chevron {
    font-size: 10px;
    color: var(--text3);
    transition: transform 0.15s;
  }
  .track-chevron.open { transform: rotate(90deg); }

  .track-items {
    border-top: 1px solid var(--border);
    padding: 6px 0;
  }
  .track-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 5px 12px;
    font-size: 12px;
    color: var(--text2);
    line-height: 1.55;
    transition: background 0.1s;
  }
  .track-item:hover { background: var(--bg3); color: var(--text); }
  .item-dot {
    width: 4px; height: 4px; border-radius: 50%;
    flex-shrink: 0; margin-top: 6px;
  }

  /* Heatmap */
  .heatmap-grid {
    display: grid;
    grid-template-columns: 40px repeat(26, 1fr);
    gap: 2px;
    font-family: var(--font-mono);
  }
  .hm-cell {
    height: 20px;
    border-radius: 2px;
    cursor: pointer;
    transition: opacity 0.1s, transform 0.1s;
  }
  .hm-cell:hover { opacity: 0.7 !important; transform: scaleY(1.2); }
  .hm-empty { background: var(--bg2); cursor: default; }
  .hm-empty:hover { opacity: 1 !important; transform: none; }
  .hm-label { font-size: 9px; color: var(--text3); display: flex; align-items: center; }
  .hm-wk-label { font-size: 9px; color: var(--text3); text-align: center; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 2px; }

  /* Daily schedule */
  .day-col {
    background: var(--bg1);
    border: 1px solid var(--border);
    border-radius: 6px;
    overflow: hidden;
    flex: 1;
    min-width: 0;
  }
  .day-header {
    padding: 8px 10px 6px;
    border-bottom: 1px solid var(--border);
  }
  .day-name { font-family: var(--font-mono); font-size: 11px; font-weight: 700; color: var(--text); }
  .day-theme { font-size: 9px; color: var(--text3); margin-top: 1px; }
  .day-block {
    padding: 6px 10px;
    border-bottom: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .day-block:last-child { border-bottom: none; }
  .day-block-label { font-family: var(--font-mono); font-size: 10px; font-weight: 700; }
  .day-block-mins { font-size: 9px; color: var(--text3); }

  /* Milestone timeline */
  .milestone-row {
    display: flex;
    gap: 12px;
    padding: 8px 0;
    border-bottom: 1px solid var(--border);
    align-items: flex-start;
  }
  .milestone-row:last-child { border-bottom: none; }
  .milestone-wk { font-family: var(--font-mono); font-size: 10px; color: var(--text3); min-width: 48px; padding-top: 1px; }
  .milestone-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 4px; }
  .milestone-text { font-size: 12px; color: var(--text); line-height: 1.5; }

  /* Stats bar */
  .stats-row {
    display: flex;
    gap: 1px;
    margin-bottom: 20px;
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid var(--border);
  }
  .stat-box {
    flex: 1;
    padding: 10px 14px;
    background: var(--bg1);
    display: flex;
    flex-direction: column;
    gap: 2px;
    border-right: 1px solid var(--border);
  }
  .stat-box:last-child { border-right: none; }
  .stat-num { font-family: var(--font-mono); font-size: 20px; font-weight: 700; color: var(--text); }
  .stat-label { font-size: 10px; color: var(--text3); }

  /* Legend */
  .legend { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 16px; }
  .legend-item { display: flex; align-items: center; gap: 5px; font-size: 11px; color: var(--text2); }
  .legend-swatch { width: 10px; height: 10px; border-radius: 2px; }

  /* Checked item */
  .item-checked { text-decoration: line-through; opacity: 0.4; }
  .check-box {
    width: 12px; height: 12px; border-radius: 2px; border: 1px solid var(--border2);
    flex-shrink: 0; margin-top: 3px; cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: all 0.1s; font-size: 8px; color: white;
  }
  .check-box.done { background: var(--item-color, var(--border2)); border-color: var(--item-color, var(--border2)); }

  /* Animations */
  @keyframes fadeSlide {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .fade-slide { animation: fadeSlide 0.2s ease; }

  /* Scrollable sidebar weeks */
  .sidebar-weeks { flex: 1; overflow-y: auto; }
`;

// ─── TrackBlock Component ─────────────────────────────────────────────────────
function TrackBlock({ trackKey, items, checked, onToggle }) {
  const [open, setOpen] = useState(true);
  const meta = trackMeta(trackKey);
  if (!meta || !items?.length) return null;
  const doneCount = items.filter((_, i) => checked[`${trackKey}-${i}`]).length;

  return (
    <div className="track-block" style={{ borderColor: meta.color + "22", background: meta.dimColor + "88" }}>
      <div className="track-header" onClick={() => setOpen((o) => !o)}>
        <span className="track-label-pill" style={{ background: meta.color + "22", color: meta.color }}>
          {meta.label}
        </span>
        <span className="track-count">{doneCount}/{items.length}</span>
        {doneCount === items.length && items.length > 0 && (
          <span style={{ fontSize: 9, color: meta.color, fontFamily: "JetBrains Mono, monospace", marginLeft: 4 }}>✓ done</span>
        )}
        <span className={`track-chevron ${open ? "open" : ""}`}>›</span>
      </div>
      {open && (
        <div className="track-items fade-slide">
          {items.map((item, i) => {
            const ck = `${trackKey}-${i}`;
            const isDone = !!checked[ck];
            return (
              <div key={i} className="track-item" onClick={() => onToggle(ck)}>
                <div
                  className={`check-box ${isDone ? "done" : ""}`}
                  style={{ "--item-color": meta.color }}
                >
                  {isDone && "✓"}
                </div>
                <div className={`item-dot`} style={{ background: meta.color }} />
                <span className={isDone ? "item-checked" : ""}>{item}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Heatmap Tab ──────────────────────────────────────────────────────────────
function HeatmapTab({ onWeekClick }) {
  const [hovered, setHovered] = useState(null);

  return (
    <div>
      <div className="legend">
        {TRACKS.map((t) => (
          <div key={t.key} className="legend-item">
            <div className="legend-swatch" style={{ background: t.color }} />
            {t.label}
          </div>
        ))}
      </div>

      {/* Phase labels */}
      <div style={{ display: "grid", gridTemplateColumns: "40px repeat(26, 1fr)", gap: 2, marginBottom: 4 }}>
        <div />
        {Array.from({ length: 26 }, (_, i) => i + 1).map((wn) => {
          const ph = phaseFor(wn);
          const isStart = ph && ph.weeks[0] === wn;
          return (
            <div key={wn} style={{
              height: 18,
              background: isStart ? ph.color + "22" : (ph ? ph.color + "11" : "transparent"),
              borderRadius: isStart ? "3px 0 0 3px" : ph?.weeks[1] === wn ? "0 3px 3px 0" : 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 7, color: ph?.color || "transparent", fontFamily: "JetBrains Mono, monospace",
              fontWeight: 700, overflow: "hidden",
            }}>
              {isStart ? `P${ph.id}` : ""}
            </div>
          );
        })}
      </div>

      <div className="heatmap-grid">
        {/* Header row */}
        <div />
        {Array.from({ length: 26 }, (_, i) => (
          <div key={i} className="hm-wk-label">{i + 1}</div>
        ))}

        {/* Track rows */}
        {TRACKS.map((track) => (
          <div key={track.key} style={{ display: "contents" }}>
            <div className="hm-label" style={{ fontSize: 8, color: track.color, fontWeight: 700 }}>
              {track.label.slice(0, 3).toUpperCase()}
            </div>
            {WEEKS.map((w) => {
              const items = w[track.key] || [];
              const hasData = items.length > 0;
              const opacity = hasData ? Math.min(0.3 + (items.length / 4) * 0.7, 1) : 1;
              return (
                <div
                  key={w.n}
                  className={`hm-cell ${hasData ? "" : "hm-empty"}`}
                  style={hasData ? { background: track.color, opacity } : {}}
                  title={hasData ? `Week ${w.n} · ${track.label}: ${items[0]}` : `Week ${w.n} · ${track.label}: —`}
                  onMouseEnter={() => setHovered({ week: w.n, track: track.key })}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => hasData && onWeekClick(w.n)}
                />
              );
            })}
          </div>
        ))}
      </div>

      {hovered && (
        <div style={{
          marginTop: 16, padding: "10px 14px", background: "var(--bg1)", border: "1px solid var(--border2)",
          borderRadius: 6, fontSize: 12, color: "var(--text2)", fontFamily: "JetBrains Mono, monospace"
        }}>
          {(() => {
            const w = WEEKS[hovered.week - 1];
            const items = w[hovered.track] || [];
            const t = trackMeta(hovered.track);
            return (
              <>
                <span style={{ color: t.color }}>{t.label}</span>
                <span style={{ color: "var(--text3)" }}> · Week {hovered.week} · {w.title}</span>
                {items.length > 0 && <div style={{ marginTop: 4, color: "var(--text)" }}>{items[0]}</div>}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}

// ─── Daily Schedule Tab ───────────────────────────────────────────────────────
function DailyTab() {
  return (
    <div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        {TRACKS.map((t) => {
          const wkHours = DAILY_BLOCKS.reduce((sum, day) => {
            return sum + day.blocks.filter((b) => b.track === t.key).reduce((s, b) => s + b.mins, 0);
          }, 0) / 60;
          return (
            <div key={t.key} style={{
              background: t.dimColor, border: `1px solid ${t.color}33`, borderRadius: 5,
              padding: "5px 10px", textAlign: "center", minWidth: 70,
            }}>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 14, fontWeight: 700, color: t.color }}>
                {wkHours.toFixed(1)}h
              </div>
              <div style={{ fontSize: 9, color: t.textColor, opacity: 0.7 }}>{t.label}/wk</div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8 }}>
        {DAILY_BLOCKS.map((day) => (
          <div key={day.day} className="day-col">
            <div className="day-header">
              <div className="day-name">{day.day}</div>
              <div className="day-theme">{day.theme}</div>
            </div>
            {day.blocks.map((b, i) => {
              const t = trackMeta(b.track);
              return (
                <div key={i} className="day-block" style={{ background: t.dimColor }}>
                  <div className="day-block-label" style={{ color: t.color }}>{b.label}</div>
                  <div className="day-block-mins">{b.mins} min</div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 16, padding: "12px 14px", background: "var(--bg1)", border: "1px solid var(--border)", borderRadius: 6 }}>
        <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "JetBrains Mono, monospace", marginBottom: 8, letterSpacing: "0.1em" }}>EXECUTION RULES</div>
        {[
          ["DSA blocks", "Always timed. 25 min per problem. No peeking before the timer ends."],
          ["DP blocks", "Write the recurrence on paper first. Never start coding before defining state."],
          ["Sys Design", "Whiteboard or paper first. No keyboard until you have the full diagram sketched."],
          ["FSD blocks", "No passive reading. Every session ends with code written or a diagram drawn."],
          ["Breaks", "Non-negotiable. 30 min after each major block. No screens."],
          ["Saturday", "Treat as a real interview loop. Camera on, timer running, no pausing."],
          ["Error log", "Every failed problem → root cause in one sentence. Review every Sunday."],
        ].map(([title, rule]) => (
          <div key={title} style={{ display: "flex", gap: 12, padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "var(--accent)", minWidth: 100, flexShrink: 0 }}>{title}</div>
            <div style={{ fontSize: 11, color: "var(--text2)" }}>{rule}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Milestones Tab ───────────────────────────────────────────────────────────
function MilestonesTab({ onWeekClick }) {
  return (
    <div>
      {MILESTONES.map((m, i) => (
        <div key={i} className="milestone-row" style={{ cursor: "pointer" }} onClick={() => onWeekClick(m.week)}>
          <div className="milestone-wk">Wk {m.week}</div>
          <div className="milestone-dot" style={{ background: m.color }} />
          <div className="milestone-text">{m.text}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Week View ────────────────────────────────────────────────────────────────
function WeekView({ week, checked, onToggle }) {
  const ph = phaseFor(week.n);
  const activeTracks = TRACKS.filter((t) => (week[t.key] || []).length > 0);
  const totalItems = activeTracks.reduce((s, t) => s + (week[t.key] || []).length, 0);
  const doneItems = activeTracks.reduce((s, t) => {
    return s + (week[t.key] || []).filter((_, i) => checked[`${t.key}-${i}`]).length;
  }, 0);
  const progress = totalItems > 0 ? (doneItems / totalItems) * 100 : 0;

  return (
    <div className="fade-slide">
      {/* Progress bar */}
      <div style={{ height: 2, background: "var(--border)", borderRadius: 1, marginBottom: 20, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${progress}%`, background: ph?.color || "var(--accent)", borderRadius: 1, transition: "width 0.3s" }} />
      </div>

      {activeTracks.map((t) => (
        <TrackBlock
          key={t.key}
          trackKey={t.key}
          items={week[t.key] || []}
          checked={checked}
          onToggle={onToggle}
        />
      ))}

      {/* Week goal callout */}
      {week.goal && (
        <div style={{
          marginTop: 16, padding: "10px 14px", background: "var(--bg2)",
          borderLeft: `3px solid ${ph?.color || "var(--accent)"}`,
          borderRadius: "0 6px 6px 0", fontSize: 12, color: "var(--text2)", lineHeight: 1.6,
        }}>
          <span style={{ color: ph?.color || "var(--accent)", fontWeight: 600, fontFamily: "JetBrains Mono, monospace", fontSize: 10 }}>GOAL </span>
          {week.goal}
        </div>
      )}
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ onWeekClick }) {
  return (
    <div>
      <div className="stats-row">
        {[["26", "Total Weeks"], ["500+", "DSA Problems"], ["40+", "Systems"], ["8", "STAR Stories"]].map(([n, l]) => (
          <div key={l} className="stat-box">
            <div className="stat-num">{n}</div>
            <div className="stat-label">{l}</div>
          </div>
        ))}
      </div>

      {PHASES.map((ph) => (
        <div key={ph.id} style={{
          marginBottom: 10, background: ph.bg + "CC", border: `1px solid ${ph.border}`,
          borderRadius: 6, overflow: "hidden",
        }}>
          <div style={{
            padding: "10px 14px", display: "flex", alignItems: "center", gap: 10,
            borderBottom: `1px solid ${ph.border}`,
          }}>
            <span style={{
              fontFamily: "JetBrains Mono, monospace", fontSize: 9, fontWeight: 700,
              color: ph.color, letterSpacing: "0.1em",
            }}>
              {ph.label.toUpperCase()}
            </span>
            <span style={{ fontWeight: 600, color: "var(--text)", fontSize: 13 }}>{ph.name}</span>
            <span style={{ marginLeft: "auto", fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "var(--text3)" }}>
              Wk {ph.weeks[0]}–{ph.weeks[1]}
            </span>
          </div>
          <div style={{ padding: "8px 14px", display: "flex", flexWrap: "wrap", gap: 4 }}>
            {WEEKS.filter((w) => w.n >= ph.weeks[0] && w.n <= ph.weeks[1]).map((w) => (
              <button key={w.n} onClick={() => onWeekClick(w.n)} style={{
                background: "transparent", border: `1px solid ${ph.color}44`, borderRadius: 4,
                padding: "3px 8px", cursor: "pointer", fontFamily: "JetBrains Mono, monospace",
                fontSize: 10, color: ph.color, transition: "all 0.1s",
              }}
                onMouseOver={(e) => { e.target.style.background = ph.color + "22"; }}
                onMouseOut={(e) => { e.target.style.background = "transparent"; }}
              >
                W{w.n} {w.title}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [activeWeek, setActiveWeek] = useState(1);
  const [activeTab, setActiveTab] = useState("week");
  const [checked, setChecked] = useState({});

  const handleToggle = useCallback((key) => {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const goToWeek = (n) => {
    setActiveWeek(n);
    setActiveTab("week");
  };

  const currentWeek = WEEKS[activeWeek - 1];
  const currentPhase = phaseFor(activeWeek);

  // Progress across all weeks
  const totalAll = WEEKS.reduce((s, w) => s + TRACKS.reduce((ts, t) => ts + (w[t.key] || []).length, 0), 0);
  const doneAll = Object.values(checked).filter(Boolean).length;

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden" }}>

        {/* ─── Sidebar ──────────────────────────────── */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <h1>FAANG Prep</h1>
            <p>26-Week Tracker</p>
            {/* Global progress */}
            <div style={{ marginTop: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontSize: 9, color: "var(--text3)", fontFamily: "JetBrains Mono, monospace" }}>OVERALL</span>
                <span style={{ fontSize: 9, color: "var(--accent)", fontFamily: "JetBrains Mono, monospace" }}>
                  {doneAll}/{totalAll}
                </span>
              </div>
              <div style={{ height: 3, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{
                  height: "100%", width: `${(doneAll / totalAll) * 100}%`,
                  background: "var(--accent)", borderRadius: 2, transition: "width 0.3s",
                }} />
              </div>
            </div>
          </div>

          <nav className="sidebar-nav">
            {PHASES.map((ph) => (
              <div key={ph.id}>
                <div className="nav-section" style={{ color: ph.color + "99" }}>{ph.label} — {ph.name}</div>
                {WEEKS.filter((w) => w.n >= ph.weeks[0] && w.n <= ph.weeks[1]).map((w) => (
                  <button
                    key={w.n}
                    className={`nav-item ${activeWeek === w.n && activeTab === "week" ? "active" : ""}`}
                    style={{ "--item-color": ph.color }}
                    onClick={() => goToWeek(w.n)}
                  >
                    <span className="week-num">W{w.n}</span>
                    <span className="week-dot" style={{ background: activeWeek === w.n && activeTab === "week" ? ph.color : "var(--border2)" }} />
                    <span className="week-title">{w.title}</span>
                  </button>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        {/* ─── Main ─────────────────────────────────── */}
        <div className="main">
          {/* Week header */}
          {activeTab === "week" && (
            <div className="week-header">
              <div className="week-meta">
                {currentPhase && (
                  <span className="phase-badge" style={{
                    color: currentPhase.color,
                    background: currentPhase.bg,
                    borderColor: currentPhase.border,
                  }}>
                    {currentPhase.label}
                  </span>
                )}
                <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "var(--text3)" }}>
                  Week {activeWeek} of 26
                </span>
                {/* Nav arrows */}
                <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
                  {activeWeek > 1 && (
                    <button onClick={() => setActiveWeek((n) => n - 1)} style={{
                      background: "var(--bg2)", border: "1px solid var(--border2)", borderRadius: 4,
                      color: "var(--text2)", cursor: "pointer", padding: "3px 8px",
                      fontFamily: "JetBrains Mono, monospace", fontSize: 11,
                    }}>← Prev</button>
                  )}
                  {activeWeek < 26 && (
                    <button onClick={() => setActiveWeek((n) => n + 1)} style={{
                      background: "var(--bg2)", border: "1px solid var(--border2)", borderRadius: 4,
                      color: "var(--text2)", cursor: "pointer", padding: "3px 8px",
                      fontFamily: "JetBrains Mono, monospace", fontSize: 11,
                    }}>Next →</button>
                  )}
                </div>
              </div>
              <div className="week-title-main" style={{ color: currentPhase?.color || "var(--text)" }}>
                {currentWeek?.title}
              </div>
              {currentWeek?.goal && <div className="week-goal">"{currentWeek.goal}"</div>}
            </div>
          )}

          {/* Tabs */}
          <div className="tab-bar">
            {[
              { key: "week",       label: "Week Plan" },
              { key: "overview",   label: "Overview" },
              { key: "heatmap",    label: "Heatmap" },
              { key: "daily",      label: "Daily Split" },
              { key: "milestones", label: "Milestones" },
            ].map((t) => (
              <button
                key={t.key}
                className={`tab-btn ${activeTab === t.key ? "active" : ""}`}
                onClick={() => setActiveTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="content">
            {activeTab === "week" && (
              <WeekView
                key={activeWeek}
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
              />
            )}
            {activeTab === "overview" && <OverviewTab onWeekClick={goToWeek} />}
            {activeTab === "heatmap" && <HeatmapTab onWeekClick={goToWeek} />}
            {activeTab === "daily" && <DailyTab />}
            {activeTab === "milestones" && <MilestonesTab onWeekClick={goToWeek} />}
          </div>
        </div>
      </div>
    </>
  );
}
