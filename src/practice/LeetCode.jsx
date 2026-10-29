import { useState } from "react";
import { WEEKS } from "../data/weeks.js";
import { LEETCODE, lcSlug, lcUrl } from "../data/leetcode.js";
import { NEETCODE_150, BLIND_75 } from "../data/lists.js";
import { WEEK_SCHEDULE, isDpGroup, estimate, weekTheme } from "../data/schedule.js";
import { PROBLEMS } from "./problems.js";
import { useLeetCode, toggleLeetCode, usePractice } from "./store.js";

// LeetCode checklists: the per-week lists on each week page, and the Blind 75 / NeetCode 150 /
// by-week browser. One "solved" mark per problem, shared by every list.

const DIFF = { E: "Easy", M: "Medium", H: "Hard" };
const slugFromLink = (url) => (url || "").match(/problems\/([^/]+)/)?.[1];
const PRACTICE_BY_SLUG = Object.fromEntries(PROBLEMS.map((p) => [slugFromLink(p.link), p.id]).filter(([s]) => s));
const NC_FLAGS = Object.fromEntries(NEETCODE_150.flatMap((g) => g.items.map((it) => [it[0], it[3] || ""])));

const Check = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;
const Ext = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6" /></svg>;

function LcRow({ item, solved, practice, onOpen, showBlind }) {
  const [n, title, d] = item;
  const slug = lcSlug(item);
  const flags = NC_FLAGS[n] || item[3] || "";
  const practiceId = PRACTICE_BY_SLUG[slug];
  const practiceSolved = practiceId && practice[practiceId]?.status === "solved";
  return (
    <div className={`lc-row ${solved ? "done" : ""}`}>
      <button className="lc-check" role="checkbox" aria-checked={!!solved} aria-label={`Mark ${title} solved`} onClick={() => toggleLeetCode(slug)}>
        {solved && <Check />}
      </button>
      <span className="lc-n mono">{n}</span>
      <a className="lc-title" href={lcUrl(item)} target="_blank" rel="noopener noreferrer">{title}<Ext /></a>
      <span className="lc-tags">
        {showBlind && flags.includes("B") && <span className="tag">Blind 75</span>}
        {flags.includes("P") && <span className="tag prem" title="Needs LeetCode Premium">Premium</span>}
        {practiceId && onOpen && (
          <button className={`lc-prac ${practiceSolved ? "ok" : ""}`} onClick={() => onOpen(practiceId)} title="Solve it here with tests and Claude review">
            {practiceSolved && <Check />}Practice here
          </button>
        )}
      </span>
      <span className={`diff diff-${DIFF[d]}`}>{DIFF[d]}</span>
    </div>
  );
}

const countSolved = (groups, lc) => {
  const all = groups.flatMap((g) => g.items);
  return { total: all.length, done: all.filter((it) => lc[lcSlug(it)]).length };
};

// ─── Week page panel ─────────────────────────────────────────────────────────
const todayIdx = () => (new Date().getDay() + 6) % 7; // Mon = 0
const allItems = (sessions) => sessions.flatMap((s) => s.groups.flatMap((g) => g.items));
const diffMix = (items) => ["E", "M", "H"].map((d) => [d, items.filter((it) => it[2] === d).length]).filter(([, n]) => n);

function DayBreakdown({ day, lc }) {
  const items = allItems(day.sessions);
  const done = items.filter((it) => lc[lcSlug(it)]).length;
  const mins = estimate(items);
  const patterns = [...new Set(day.sessions.flatMap((s) => s.groups.map((g) => g.topic)))];
  return (
    <div className="lc-breakdown">
      <div><b>{day.day}</b><span className="muted small">{patterns.join(" · ") || "Rest day"}</span></div>
      <div className="lc-bd-stats">
        <span><b>{items.length}</b> problem{items.length === 1 ? "" : "s"}</span>
        {mins > 0 && <span>~<b>{mins}</b> min</span>}
        <span><b>{done}</b>/{items.length} solved</span>
        <span className="lc-mix">{diffMix(items).map(([d, n]) => <i key={d} className={`diff-${DIFF[d]}`}>{n} {DIFF[d]}</i>)}</span>
      </div>
    </div>
  );
}

function WeekOverview({ week, days, lc }) {
  const fresh = days.flatMap((d) => d.sessions.filter((x) => !x.repeat).flatMap((x) => x.groups.flatMap((g) => g.items)));
  const again = days.flatMap((d) => d.sessions.filter((x) => x.repeat).flatMap((x) => x.groups.flatMap((g) => g.items)));
  const all = [...fresh, ...again];
  const done = all.filter((it) => lc[lcSlug(it)]).length;
  const newSessions = days.flatMap((d) => d.sessions.filter((x) => !x.repeat));
  const topics = [...new Set((newSessions.length ? newSessions : days.flatMap((d) => d.sessions)).flatMap((x) => x.groups.map((g) => g.topic)))];
  return (
    <div className="lc-week">
      <div className="lc-week-theme"><span className="eyebrow">This week's track</span><b>{weekTheme(week)}</b></div>
      <div className="lc-bd-stats">
        {fresh.length > 0 && <span><b>{fresh.length}</b> new</span>}
        {again.length > 0 && <span><b>{again.length}</b> re-solve{again.length === 1 ? "" : "s"}</span>}
        {all.length > 0 && <span>~<b>{Math.round(estimate(all) / 60 * 10) / 10}</b> h total</span>}
        {all.length > 0 && <span><b>{done}</b>/{all.length} solved</span>}
        <span className="lc-mix">{diffMix(all).map(([d, n]) => <i key={d} className={`diff-${DIFF[d]}`}>{n} {DIFF[d]}</i>)}</span>
      </div>
      {topics.length > 0 && <div className="lc-bd-pats">{topics.map((t) => <span key={t} className={`tag ${isDpGroup(t) ? "dp" : ""}`}>{t}</span>)}</div>}
    </div>
  );
}

export function LeetCodeWeek({ week, onOpen }) {
  const lc = useLeetCode();
  const practice = usePractice();
  const [open, setOpen] = useState(true);
  const [mode, setMode] = useState("day");
  const [sel, setSel] = useState(todayIdx);
  const groups = LEETCODE[week] || [];
  const days = WEEK_SCHEDULE[week] || [];
  const dayItems = days.flatMap((d) => allItems(d.sessions));
  if (!groups.length && !dayItems.length) return null;
  const counted = mode === "day" ? dayItems : groups.flatMap((g) => g.items);
  const total = counted.length;
  const done = counted.filter((it) => lc[lcSlug(it)]).length;
  const day = days[sel];
  return (
    <section className="track prac lc" style={{ "--tc": "var(--t-mock)" }}>
      <div className="track-head lc-head">
        <button className="lc-head-btn" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          <span className="pill" style={{ background: "color-mix(in srgb, var(--t-mock) 12%, transparent)", color: "var(--t-mock)" }}>LeetCode</span>
          <span className="muted small">{mode === "day" ? "1–2 problems a day" : "Topic bank — optional extra practice"}</span>
        </button>
        {open && (
          <div className="seg lc-mode" role="group" aria-label="View">
            <button className={mode === "day" ? "on" : ""} aria-pressed={mode === "day"} onClick={() => setMode("day")}>Daily plan</button>
            {groups.length > 0 && <button className={mode === "pattern" ? "on" : ""} aria-pressed={mode === "pattern"} onClick={() => setMode("pattern")}>Topic bank</button>}
          </div>
        )}
        <span className="count">{done}/{total}</span>
        <button className={`chev ${open ? "open" : ""} lc-chev`} onClick={() => setOpen((o) => !o)} aria-label={open ? "Collapse" : "Expand"}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg></button>
      </div>
      {open && mode === "pattern" && (
        <div className="track-items lc-items">
          {groups.map((g) => (
            <div key={g.topic} className="lc-group">
              <div className="lc-topic eyebrow">{g.topic}</div>
              {g.items.map((it) => <LcRow key={it[0]} item={it} solved={lc[lcSlug(it)]} practice={practice} onOpen={onOpen} showBlind />)}
            </div>
          ))}
        </div>
      )}
      {open && mode === "day" && (
        <div className="track-items lc-items">
          <WeekOverview week={week} days={days} lc={lc} />
          <div className="lc-days" role="tablist" aria-label="Day">
            {days.map((d, i) => {
              const items = allItems(d.sessions);
              const dn = items.filter((it) => lc[lcSlug(it)]).length;
              return (
                <button key={d.day} role="tab" aria-selected={i === sel} className={`${i === sel ? "on" : ""} ${items.length && dn === items.length ? "ok" : ""}`} onClick={() => setSel(i)}>
                  <b>{d.day}{i === todayIdx() && <i className="today" title="Today" />}</b><span>{items.length ? `${dn}/${items.length}` : "rest"}</span>
                </button>
              );
            })}
          </div>
          {day && <DayBreakdown day={day} lc={lc} />}
          {day && !day.sessions.length && <p className="small muted" style={{ padding: "4px 10px 10px" }}>Rest day — no problems. {week >= 17 && week <= 24 ? "Skim your cheat sheet if you like." : ""}</p>}
          {day && day.sessions.map((s, k) => (
            <div key={k} className="lc-session">
              <div className={`lc-session-h ${s.repeat ? "rep" : ""}`}>{s.repeat && "↻ "}{s.label}</div>
              {s.groups.map((g) => (
                <div key={g.topic} className="lc-group">
                  <div className="lc-topic eyebrow">{g.topic}</div>
                  {g.items.map((it) => <LcRow key={it[0]} item={it} solved={lc[lcSlug(it)]} practice={practice} onOpen={onOpen} showBlind />)}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Lists page ──────────────────────────────────────────────────────────────
const LISTS = [
  { key: "neetcode150", label: "NeetCode 150", blurb: "NeetCode's 150 problems across 18 patterns — the Blind 75 plus 75 more to close the gaps." },
  { key: "blind75", label: "Blind 75", blurb: "The original 75 problems that cover the patterns most FAANG coding rounds draw from." },
  { key: "weeks", label: "By week", blurb: "Every problem from the 26-week plan, in the order you meet them." },
];

export default function LeetCodeLists({ list = "neetcode150", onList, onOpen, onWeek }) {
  const lc = useLeetCode();
  const practice = usePractice();
  const [diff, setDiff] = useState("all");
  const [hideSolved, setHideSolved] = useState(false);
  const [q, setQ] = useState("");
  const meta = LISTS.find((l) => l.key === list) || LISTS[0];

  const sections = meta.key === "weeks"
    ? Object.entries(LEETCODE).filter(([, gs]) => gs.length).map(([w, gs]) => ({ key: `w${w}`, week: Number(w), title: `Week ${w} · ${WEEKS[w - 1]?.title || ""}`, groups: gs }))
    : (meta.key === "blind75" ? BLIND_75 : NEETCODE_150).map((g) => ({ key: g.topic, title: g.topic, groups: [g] }));

  const allItems = sections.flatMap((s) => s.groups.flatMap((g) => g.items));
  const unique = [...new Map(allItems.map((it) => [it[0], it])).values()];
  const solvedN = unique.filter((it) => lc[lcSlug(it)]).length;
  const byDiff = ["E", "M", "H"].map((d) => {
    const xs = unique.filter((it) => it[2] === d);
    return { d, total: xs.length, done: xs.filter((it) => lc[lcSlug(it)]).length };
  });

  const ql = q.trim().toLowerCase();
  const keep = (it) => (diff === "all" || it[2] === diff) && (!hideSolved || !lc[lcSlug(it)]) && (!ql || it[1].toLowerCase().includes(ql) || String(it[0]) === ql);

  return (
    <div className="page prac lc">
      <header className="page-head">
        <span className="eyebrow">LeetCode lists</span>
        <h1>Blind 75 & <em>NeetCode 150</em></h1>
        <p className="lede">{meta.blurb} Tick a problem once you've solved it on LeetCode — the mark is shared by every list and week. Where a problem also exists in Practice, you can solve it here with tests and a Claude review.</p>
      </header>

      <div className="filters" style={{ marginBottom: 16 }}>
        <div className="seg" role="group" aria-label="List">
          {LISTS.map((l) => <button key={l.key} className={l.key === meta.key ? "on" : ""} aria-pressed={l.key === meta.key} onClick={() => onList(l.key)}>{l.label}</button>)}
        </div>
      </div>

      <div className="stats stagger">
        <div style={{ "--i": 0 }}><b style={{ color: "var(--good)" }}>{solvedN}/{unique.length}</b><span>Solved{meta.key === "weeks" ? " (distinct problems)" : ""}</span></div>
        {byDiff.map((x, i) => (
          <div key={x.d} style={{ "--i": i + 1 }}><b className={`diff-${DIFF[x.d]}`}>{x.done}/{x.total}</b><span>{DIFF[x.d]}</span></div>
        ))}
      </div>

      <div className="filters" style={{ margin: "20px 0 4px" }}>
        <input className="inp" type="search" placeholder="Search title or number…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search problems" />
        <select className="inp sel" value={diff} onChange={(e) => setDiff(e.target.value)} aria-label="Difficulty">
          <option value="all">Any difficulty</option><option value="E">Easy</option><option value="M">Medium</option><option value="H">Hard</option>
        </select>
        <label className="toggle"><input type="checkbox" checked={hideSolved} onChange={(e) => setHideSolved(e.target.checked)} />Hide solved</label>
      </div>

      {sections.map((s) => {
        const groups = s.groups.map((g) => ({ ...g, items: g.items.filter(keep) })).filter((g) => g.items.length);
        if (!groups.length) return null;
        const { total, done } = countSolved(s.groups, lc);
        return (
          <section key={s.key} className="panel lc-sec">
            <div className="lc-sec-head">
              {s.week
                ? <button className="linkbtn" onClick={() => onWeek(s.week)}><h3>{s.title}</h3></button>
                : <h3>{s.title}</h3>}
              <span className="mono small muted">{done}/{total}</span>
            </div>
            <div className="meter"><i style={{ width: `${total ? (done / total) * 100 : 0}%`, background: "var(--good)" }} /></div>
            {groups.map((g) => (
              <div key={g.topic} className="lc-group">
                {s.week && <div className="lc-topic eyebrow">{g.topic}</div>}
                {g.items.map((it) => <LcRow key={it[0]} item={it} solved={lc[lcSlug(it)]} practice={practice} onOpen={onOpen} showBlind={meta.key !== "blind75"} />)}
              </div>
            ))}
          </section>
        );
      })}
      {sections.every((s) => !s.groups.some((g) => g.items.some(keep))) && <div className="panel muted">Nothing matches those filters.</div>}
    </div>
  );
}

export const LC_CSS = `
  .lc .lc-items { padding:4px 6px 8px; }
  .lc-group + .lc-group { margin-top:6px; }
  .lc-topic { padding:8px 10px 4px; font-size:11px; }
  .lc-row { display:grid; grid-template-columns:22px 46px minmax(0,1fr) auto 62px; align-items:center; gap:10px; padding:6px 10px; border-radius:10px; }
  .lc-row:hover { background:var(--surface-2); }
  .lc-check { width:20px; height:20px; border-radius:6px; border:1.5px solid var(--line); background:transparent; display:grid; place-items:center; cursor:pointer; color:#fff; padding:0; transition:background .15s, border-color .15s; }
  .lc-check:hover { border-color:var(--good); }
  .lc-row.done .lc-check { background:var(--good); border-color:var(--good); }
  .lc-row.done .lc-title { color:var(--muted); text-decoration:line-through; }
  .lc-n { font-size:12px; color:var(--muted); text-align:right; }
  .lc-title { display:inline-flex; align-items:center; gap:6px; min-width:0; text-decoration:none; font-size:14.5px; font-weight:500; }
  .lc-title:hover { color:var(--accent); }
  .lc-title svg { flex:none; opacity:.5; }
  .lc-tags { display:flex; gap:6px; align-items:center; justify-content:flex-end; }
  .lc-tags .prem { background:var(--accent-soft); color:var(--accent); }
  .lc .lc-prac { display:inline-flex; align-items:center; gap:4px; font-size:12px; font-weight:600; padding:3px 9px; border-radius:999px; border:1px solid var(--accent); color:var(--accent); background:transparent; cursor:pointer; white-space:nowrap; }
  .lc .lc-prac:hover { background:var(--accent-soft); }
  .lc .lc-prac.ok { border-color:var(--good); color:var(--good); }
  @media (max-width:620px){
    .lc-row { grid-template-columns:22px minmax(0,1fr) auto; }
    .lc-n, .lc-row .diff { display:none; }
    .lc-tags .tag { display:none; }
  }
  .lc-sec { margin-top:12px; padding:16px 16px 10px; }
  .lc-sec-head { display:flex; align-items:baseline; justify-content:space-between; gap:12px; margin-bottom:8px; }
  .lc-sec-head h3 { font-size:17px; }
  .lc-sec .meter { margin-bottom:8px; }
  .lc .lc-head { flex-wrap:wrap; }
  .lc .lc-head-btn { display:flex; align-items:center; gap:10px; border:0; background:none; padding:0; cursor:pointer; text-align:left; }
  .lc .lc-mode { margin-left:auto; }
  .lc .lc-mode + .count { margin-left:8px; }
  .lc .lc-chev { border:0; background:none; padding:0; cursor:pointer; }
  .lc-week { display:grid; gap:8px; margin:6px 4px 8px; padding:12px 14px; border-radius:12px; background:color-mix(in srgb, var(--t-mock) 6%, var(--bg)); border:1px solid var(--line); }
  .lc-week-theme { display:grid; gap:2px; } .lc-week-theme .eyebrow { font-size:11px; } .lc-week-theme b { font-family:var(--f-display); font-stretch:108%; font-size:16px; }
  .lc-grid-wrap { overflow-x:auto; padding:6px 4px 10px; }
  .lc-grid { border-collapse:separate; border-spacing:3px; width:100%; min-width:560px; font-size:13px; }
  .lc-grid th { font-family:var(--f-mono); font-weight:500; font-size:11px; color:var(--muted); text-align:center; text-transform:uppercase; letter-spacing:.06em; }
  .lc-grid th:first-child { text-align:left; }
  .lc .lc-grid th button { border:0; background:none; font:inherit; color:inherit; cursor:pointer; padding:2px 6px; border-radius:6px; }
  .lc .lc-grid th button.on { background:var(--accent-soft); color:var(--accent); }
  .lc-grid td { text-align:center; height:30px; border-radius:7px; background:var(--surface-2); cursor:pointer; white-space:nowrap; }
  .lc-grid td:first-child { text-align:left; background:none; cursor:default; font-weight:500; padding-right:10px; white-space:normal; min-width:150px; }
  .lc-grid td:last-child { background:none; cursor:default; color:var(--muted); }
  .lc-grid td.dp { color:var(--t-dp); }
  .lc-grid td.sel { outline:1.5px solid var(--accent); }
  .lc-grid td.ok { background:var(--good-soft); }
  .lc-grid .cnt { font-family:var(--f-mono); font-weight:600; color:var(--ink); }
  .lc-grid .cnt.rep { color:var(--muted); font-weight:500; margin-left:4px; font-size:12px; }
  .lc-days { display:grid; grid-template-columns:repeat(7,minmax(0,1fr)); gap:6px; padding:4px; }
  .lc .lc-days button { display:flex; flex-direction:column; align-items:center; gap:1px; padding:8px 2px; border-radius:10px; border:1px solid var(--line); background:var(--bg); cursor:pointer; }
  .lc .lc-days button b { font-size:13.5px; display:inline-flex; align-items:center; gap:4px; }
  .lc .lc-days button span { font-family:var(--f-mono); font-size:11px; color:var(--muted); }
  .lc .lc-days button.on { border-color:var(--accent); background:var(--accent-soft); }
  .lc .lc-days button.ok span { color:var(--good); }
  .lc-days .today { width:6px; height:6px; border-radius:50%; background:var(--accent); display:inline-block; }
  .lc-breakdown { display:grid; gap:8px; margin:8px 4px 4px; padding:12px 14px; border-radius:12px; background:var(--bg); border:1px solid var(--line); }
  .lc-breakdown > div:first-child { display:flex; align-items:baseline; gap:8px; }
  .lc-bd-stats { display:flex; flex-wrap:wrap; gap:6px 16px; font-size:13.5px; color:var(--muted); }
  .lc-bd-stats b { color:var(--ink); font-family:var(--f-mono); }
  .lc-mix { display:inline-flex; gap:10px; } .lc-mix i { font-style:normal; font-family:var(--f-mono); font-size:12.5px; }
  .lc-bd-pats { display:flex; flex-wrap:wrap; gap:6px; } .lc-bd-pats .tag.dp { color:var(--t-dp); }
  .lc-session { margin-top:8px; }
  .lc-session-h { margin:6px 10px 0; padding-top:8px; border-top:1px dashed var(--line); font-family:var(--f-mono); font-size:12px; font-weight:500; color:var(--accent); letter-spacing:.03em; }
  .lc-session-h.rep { color:var(--muted); }
  @media (max-width:620px){ .lc .lc-mode { margin-left:0; order:3; width:100%; } .lc-days button span { font-size:10px; } }
  .toggle { display:inline-flex; align-items:center; gap:8px; font-size:14px; color:var(--muted); cursor:pointer; }
  .toggle input { accent-color:var(--accent); width:16px; height:16px; }
`;
