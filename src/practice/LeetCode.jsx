import { useState } from "react";
import { WEEKS } from "../data/weeks.js";
import { LEETCODE, lcSlug, lcUrl } from "../data/leetcode.js";
import { NEETCODE_150, BLIND_75 } from "../data/lists.js";
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
export function LeetCodeWeek({ week, onOpen }) {
  const lc = useLeetCode();
  const practice = usePractice();
  const [open, setOpen] = useState(true);
  const groups = LEETCODE[week] || [];
  if (!groups.length) return null;
  const { total, done } = countSolved(groups, lc);
  return (
    <section className="track prac lc" style={{ "--tc": "var(--t-mock)" }}>
      <button className="track-head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="pill" style={{ background: "color-mix(in srgb, var(--t-mock) 12%, transparent)", color: "var(--t-mock)" }}>LeetCode</span>
        <span className="muted small">{week >= 17 ? "Revision set — re-solve these" : "Problems for this week's topics"}</span>
        <span className="count">{done}/{total}</span>
        <span className={`chev ${open ? "open" : ""}`}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg></span>
      </button>
      {open && (
        <div className="track-items lc-items">
          {groups.map((g) => (
            <div key={g.topic} className="lc-group">
              <div className="lc-topic eyebrow">{g.topic}</div>
              {g.items.map((it) => <LcRow key={it[0]} item={it} solved={lc[lcSlug(it)]} practice={practice} onOpen={onOpen} showBlind />)}
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
  .toggle { display:inline-flex; align-items:center; gap:8px; font-size:14px; color:var(--muted); cursor:pointer; }
  .toggle input { accent-color:var(--accent); width:16px; height:16px; }
`;
