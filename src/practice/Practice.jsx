import { useState, useRef, useMemo, useEffect } from "react";
import { WEEKS } from "../data/weeks.js";
import { PROBLEMS, byId, forWeek } from "./problems.js";
import { usePractice, updateProblem, addLog, isDue, relDay, todayStr, GRADES, nextInterval, EMPTY, useApiKey, setApiKey } from "./store.js";
import { runTests } from "./runner/runner.js";
import { fmt } from "./runner/compare.js";
// review.js pulls in the Anthropic SDK, so it is only loaded when a review is requested.
const REVIEW_MODEL = "claude-opus-5-5";
import Editor, { CodeView } from "./Editor.jsx";
import Md from "./Md.jsx";
import LeetCodeLists, { LeetCodeWeek, LC_CSS } from "./LeetCode.jsx";

// ─── Icons (same stroke style as App.jsx / the Atlas) ─────────────────────────
const I = {
  check: "M5 12.5l4.5 4.5L19 7.5",
  x: "M6 6l12 12M18 6L6 18",
  play: "M7 4.5v15l12-7.5z",
  arrow: "M5 12h14M13 6l6 6-6 6",
  back: "M19 12H5M11 6l-6 6 6 6",
  dot: "M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2",
  spark: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z",
  reset: "M4 4v6h6M20 20v-6h-6M5.5 15a7 7 0 0 0 12.3 2M18.5 9A7 7 0 0 0 6.2 7",
  ext: "M14 4h6v6M20 4l-9 9M18 14v6H4V6h6",
  stop: "M7 7h10v10H7z",
  chev: "M9 6l6 6-6 6",
};
const Icon = ({ n, s = 18 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={I[n]} /></svg>
);

const LANGS = [{ key: "js", label: "JavaScript" }, { key: "py", label: "Python" }];
const readLang = () => { try { return localStorage.getItem("fp:lang") === "py" ? "py" : "js"; } catch { return "js"; } };
const saveLang = (l) => { try { localStorage.setItem("fp:lang", l); } catch { /* ignore */ } };

const statusOf = (rec) => (rec?.status === "solved" ? "solved" : rec?.status === "attempted" ? "attempted" : "new");
const weekTitle = (n) => WEEKS[n - 1]?.title || "";
const when = (t) => new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" });

function StatusMark({ rec }) {
  const st = statusOf(rec);
  if (st === "solved") return <span className="st st-solved" title="Solved"><Icon n="check" s={14} /></span>;
  if (st === "attempted") return <span className="st st-try" title="Attempted" />;
  return <span className="st st-new" title="Not started" />;
}
const Diff = ({ d }) => <span className={`diff diff-${d}`}>{d}</span>;

// ─── Practice home ───────────────────────────────────────────────────────────
export default function Practice({ onOpen, onLists }) {
  const all = usePractice();
  const [q, setQ] = useState("");
  const [track, setTrack] = useState("all");
  const [diff, setDiff] = useState("all");
  const [status, setStatus] = useState("all");

  const solved = PROBLEMS.filter((p) => statusOf(all[p.id]) === "solved").length;
  const attempted = PROBLEMS.filter((p) => statusOf(all[p.id]) === "attempted").length;
  const due = PROBLEMS.filter((p) => isDue(all[p.id]));
  const mistakes = PROBLEMS.flatMap((p) => (all[p.id]?.log || []).filter((l) => l.kind === "fail").map((l) => ({ ...l, p })))
    .sort((a, b) => b.at - a.at);

  const ql = q.trim().toLowerCase();
  const shown = PROBLEMS.filter((p) => {
    const rec = all[p.id];
    if (track !== "all" && p.track !== track) return false;
    if (diff !== "all" && p.difficulty !== diff) return false;
    if (status === "due" ? !isDue(rec) : status !== "all" && statusOf(rec) !== status) return false;
    return !ql || p.title.toLowerCase().includes(ql) || p.pattern.toLowerCase().includes(ql);
  });
  const groups = [];
  for (const p of shown) {
    const w = p.weeks[0];
    if (!groups.length || groups[groups.length - 1].w !== w) groups.push({ w, items: [] });
    groups[groups.length - 1].items.push(p);
  }

  return (
    <div className="page prac">
      <style>{PRACTICE_CSS}</style>
      <header className="page-head">
        <span className="eyebrow">Practice · {PROBLEMS.length} problems · JavaScript & Python</span>
        <h1>Code it. Break it. <em>Fix it.</em></h1>
        <p className="lede">Solve curriculum problems in the browser, run them against edge-case tests, see exactly which input broke your code, and have Claude explain what went wrong. Solved problems come back for revision on a spaced schedule.</p>
      </header>

      <div className="stats stagger">
        {[
          [`${solved}/${PROBLEMS.length}`, "Solved", "var(--good)"],
          [attempted, "In progress", "var(--ink)"],
          [due.length, "Due for revision", due.length ? "var(--accent)" : "var(--ink)"],
          [mistakes.length, "Mistakes logged", "var(--ink)"],
        ].map(([n, l, c], i) => <div key={l} style={{ "--i": i }}><b style={{ color: c }}>{n}</b><span>{l}</span></div>)}
      </div>

      {due.length > 0 && (
        <>
          <div className="sec-head"><h2>Due for revision</h2><span className="muted small">Re-solve from a blank starter — no peeking</span></div>
          <div className="due-grid stagger">
            {due.map((p, i) => (
              <button key={p.id} className="due-card" style={{ "--i": i }} onClick={() => onOpen(p.id)}>
                <span className="eyebrow" style={{ color: "var(--accent)" }}>{relDay(all[p.id].review.due)}</span>
                <b>{p.title}</b>
                <span className="muted small">{p.pattern} · last interval {all[p.id].review.interval}d</span>
              </button>
            ))}
          </div>
        </>
      )}

      <div className="sec-head"><h2>LeetCode lists</h2><span className="muted small">Track what you've solved on LeetCode</span></div>
      <div className="due-grid lists-grid">
        {[["neetcode150", "NeetCode 150", "150 problems · 18 patterns"], ["blind75", "Blind 75", "The classic 75"], ["weeks", "By week", "Every problem in the 26-week plan"]].map(([k, t, d]) => (
          <button key={k} className="due-card" onClick={() => onLists(k)}>
            <span className="eyebrow">LeetCode</span><b>{t}</b><span className="muted small">{d}</span>
          </button>
        ))}
      </div>

      <div className="sec-head"><h2>Problem bank</h2></div>
      <div className="filters">
        <input className="inp" type="search" placeholder="Search title or pattern…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search problems" />
        <Seg value={track} onChange={setTrack} options={[["all", "All"], ["dsa", "DSA"], ["dp", "DP"]]} />
        <select className="inp sel" value={diff} onChange={(e) => setDiff(e.target.value)} aria-label="Difficulty">
          <option value="all">Any difficulty</option><option>Easy</option><option>Medium</option><option>Hard</option>
        </select>
        <select className="inp sel" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="all">Any status</option><option value="new">Not started</option><option value="attempted">In progress</option><option value="solved">Solved</option><option value="due">Due for revision</option>
        </select>
      </div>

      {groups.length === 0 && <div className="panel muted" style={{ marginTop: 12 }}>No problems match those filters.</div>}
      {groups.map((g) => (
        <section key={g.w} className="pgroup">
          <div className="cat-h"><span>Week {g.w} · {weekTitle(g.w)}</span></div>
          <div className="plist">
            {g.items.map((p) => <ProblemRow key={p.id} p={p} rec={all[p.id]} onOpen={onOpen} />)}
          </div>
        </section>
      ))}

      <div className="g2-wide">
        <section>
          <div className="sec-head"><h2>Mistake log</h2></div>
          {mistakes.length === 0
            ? <div className="panel muted small">Failed runs land here with the input that broke your code, so you can see your patterns of mistakes over time.</div>
            : (
              <div className="panel mlog">
                {mistakes.slice(0, 10).map((m, i) => (
                  <button key={i} className="mlog-row" onClick={() => onOpen(m.p.id)}>
                    <span className="mono muted small">{when(m.at)}</span>
                    <span><b>{m.p.title}</b><span className="small muted">{m.text}</span></span>
                  </button>
                ))}
              </div>
            )}
        </section>
        <section>
          <div className="sec-head"><h2>Claude review settings</h2></div>
          <KeySettings />
        </section>
      </div>
    </div>
  );
}

function ProblemRow({ p, rec, onOpen }) {
  return (
    <button className="prow" onClick={() => onOpen(p.id)}>
      <StatusMark rec={rec} />
      <span className="t"><b>{p.title}</b><small>{p.pattern}</small></span>
      {isDue(rec) && <span className="pill" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>Due</span>}
      {(rec?.solvedLangs || []).map((l) => <span key={l} className="tag">{l === "py" ? "PY" : "JS"}</span>)}
      <span className="pill trackpill" style={{ background: `color-mix(in srgb, var(--t-${p.track}) 12%, transparent)`, color: `var(--t-${p.track})` }}>{p.track.toUpperCase()}</span>
      <Diff d={p.difficulty} />
    </button>
  );
}

function Seg({ value, onChange, options, label }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map(([k, l]) => <button key={k} className={value === k ? "on" : ""} aria-pressed={value === k} onClick={() => onChange(k)}>{l}</button>)}
    </div>
  );
}

function KeySettings({ compact }) {
  const key = useApiKey();
  const [draft, setDraft] = useState("");
  return (
    <div className={compact ? "keybox" : "panel keybox"}>
      {key ? (
        <>
          <p className="small" style={{ margin: 0 }}><span className="pill" style={{ background: "var(--good-soft)", color: "var(--good)" }}><Icon n="check" s={13} />Key saved</span> <span className="mono muted">…{key.slice(-6)}</span></p>
          <button className="btn" onClick={() => setApiKey("")}>Remove key</button>
        </>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); if (draft.trim()) { setApiKey(draft); setDraft(""); } }} className="keyform">
          <input className="inp" type="password" placeholder="sk-ant-…" value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="Anthropic API key" autoComplete="off" />
          <button className="btn primary" type="submit">Save key</button>
        </form>
      )}
      <p className="small muted" style={{ margin: 0 }}>
        Reviews call the Claude API ({REVIEW_MODEL}) directly from your browser with your own Anthropic API key, billed to your account. The key is stored only in this browser's localStorage — use a key you can revoke, and don't save it on a shared computer.
      </p>
    </div>
  );
}

// ─── LeetCode lists (styles shared with practice) ────────────────────────────
export function LeetCodeListsPage(props) {
  return <><style>{PRACTICE_CSS + LC_CSS}</style><LeetCodeLists {...props} /></>;
}
export function WeekLeetCode(props) {
  return <><style>{PRACTICE_CSS + LC_CSS}</style><LeetCodeWeek {...props} /></>;
}

// ─── Week page panel ─────────────────────────────────────────────────────────
export function WeekPractice({ week, onOpen }) {
  const all = usePractice();
  const items = forWeek(week);
  if (!items.length) return null;
  const solved = items.filter((p) => statusOf(all[p.id]) === "solved").length;
  return (
    <section className="track prac" style={{ "--tc": "var(--accent)" }}>
      <style>{PRACTICE_CSS}</style>
      <div className="track-head" style={{ cursor: "default" }}>
        <span className="pill" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>Practice</span>
        <span className="muted small">Code these in the browser with tests</span>
        <span className="count">{solved}/{items.length}</span>
      </div>
      <div className="track-items">
        {items.map((p) => <ProblemRow key={p.id} p={p} rec={all[p.id]} onOpen={onOpen} />)}
      </div>
    </section>
  );
}

// ─── Problem workspace ───────────────────────────────────────────────────────
export function ProblemPage({ id, onBack, onWeek, onOpen }) {
  const problem = byId[id];
  const all = usePractice();
  const rec = all[id] || EMPTY;
  const [lang, setLangState] = useState(() => rec.lang || readLang());
  const [tab, setTab] = useState("problem");
  const [hints, setHints] = useState(0);
  const [run, setRun] = useState({ status: "idle", results: [] });
  const [openTest, setOpenTest] = useState(null);
  const [rated, setRated] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [rev, setRev] = useState({ text: "", streaming: false, error: null });
  const [showKey, setShowKey] = useState(false);
  const abortRef = useRef(null);
  const apiKey = useApiKey();

  useEffect(() => () => abortRef.current?.abort(), []);

  if (!problem) {
    return <div className="page panel"><h3>That problem doesn't exist.</h3><p><button className="btn" onClick={onBack}>Back to practice</button></p></div>;
  }

  const code = rec.code?.[lang] ?? problem.starter[lang];
  const setCode = (v) => updateProblem(id, (r) => ({ ...r, code: { ...r.code, [lang]: v } }));
  const setLang = (l) => {
    setLangState(l);
    saveLang(l);
    setRun({ status: "idle", results: [] });
    setRev({ text: "", streaming: false, error: null });
    updateProblem(id, (r) => ({ ...r, lang: l }));
  };

  const total = problem.tests.length;
  const passed = run.results.filter((r) => r.pass).length;
  const firstFail = run.results.find((r) => !r.pass && !r.skipped);
  const errorLine = run.status === "done" ? firstFail?.line ?? null : null;
  const allPass = run.status === "done" && !run.fatal && passed === total;
  const due = isDue(rec);

  async function doRun() {
    if (run.status === "running") return;
    setRated(null);
    setRun({ status: "running", msg: "Starting…", results: [] });
    setOpenTest(null);
    const res = await runTests({
      lang, code, problem,
      onStatus: (msg) => setRun((s) => ({ ...s, msg })),
      onResult: (r) => setRun((s) => ({ ...s, results: [...s.results, r] })),
    });
    setRun({ status: "done", ...res });
    if (res.fatal) return;
    const ok = res.results.filter((r) => r.pass).length;
    const fail = res.results.find((r) => !r.pass && !r.skipped);
    if (fail) setOpenTest(fail.i);
    updateProblem(id, (r) => {
      const next = { ...r, attempts: (r.attempts || 0) + 1, lastRun: { passed: ok, total, lang, at: Date.now() } };
      if (ok === total) {
        next.status = "solved";
        next.solvedLangs = [...new Set([...(r.solvedLangs || []), lang])];
        next.log = addLog(r, { kind: "pass", text: `All ${total} tests passed in ${lang === "py" ? "Python" : "JavaScript"}` });
      } else {
        if (r.status !== "solved") next.status = "attempted";
        const text = `${ok}/${total} passed · ${failSummary(problem, fail)}`;
        if (!(r.log?.[0]?.kind === "fail" && r.log[0].text === text)) next.log = addLog(r, { kind: "fail", text, lang });
      }
      return next;
    });
  }

  function rate(grade) {
    const interval = nextInterval(rec.review?.interval, grade);
    const g = GRADES.find((x) => x.key === grade);
    updateProblem(id, (r) => ({
      ...r,
      review: { interval, due: todayStr(interval), grade },
      log: addLog(r, { kind: "rate", text: `Rated ${g.label} — next revision in ${interval} day${interval === 1 ? "" : "s"}` }),
    }));
    setRated({ grade, interval });
  }

  function startFresh() {
    updateProblem(id, (r) => ({ ...r, code: { ...r.code, [lang]: problem.starter[lang] } }));
    setRun({ status: "idle", results: [] });
    setRev({ text: "", streaming: false, error: null });
    setConfirmReset(false);
    setTab("problem");
  }

  async function doReview() {
    if (!apiKey) { setShowKey(true); return; }
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    let acc = "";
    setRev({ text: "", streaming: true, error: null });
    let describeError = (e) => e?.message || String(e);
    try {
      const review = await import("./review.js");
      describeError = review.describeError;
      await review.streamReview({
        apiKey, problem, lang, code,
        run: run.status === "done" && !run.fatal ? run : null,
        onText: (t) => { acc += t; setRev((r) => ({ ...r, text: acc })); },
        onReset: () => { acc = ""; setRev((r) => ({ ...r, text: "" })); },
        signal: ctrl.signal,
      });
      setRev((r) => ({ ...r, streaming: false }));
      const verdict = (acc.split(/##\s*Verdict/i)[1] || acc).trim().split("\n").find((l) => l.trim()) || "Review saved";
      updateProblem(id, (r) => ({
        ...r,
        reviews: [{ at: Date.now(), lang, text: acc }, ...(r.reviews || [])].slice(0, 6),
        log: addLog(r, { kind: "review", text: `Claude review: ${verdict.replace(/[*_`]/g, "").slice(0, 160)}` }),
      }));
    } catch (e) {
      setRev((r) => ({ ...r, streaming: false, error: describeError(e) }));
    }
  }

  const idx = PROBLEMS.findIndex((p) => p.id === id);
  const nextP = PROBLEMS[idx + 1];

  return (
    <div className="page prac">
      <style>{PRACTICE_CSS}</style>
      <div className="crumbs" style={{ marginBottom: 12 }}>
        <button className="linkbtn" onClick={onBack}><Icon n="back" s={14} />Practice</button>
        <span className="muted">/</span>
        <button className="linkbtn" onClick={() => onWeek(problem.weeks[0])}>Week {problem.weeks[0]} · {weekTitle(problem.weeks[0])}</button>
      </div>

      {due && (
        <div className="callout duebar">
          <div><span className="ct">Due for revision</span><span>Solve it again from a blank starter, without looking at your old code or the solution.</span></div>
          <button className="btn primary" onClick={startFresh}>Start fresh</button>
        </div>
      )}

      <div className="ws">
        {/* ─── Left: problem / hints / solution / notes ─── */}
        <section className="panel ws-left">
          <div className="tabs" role="tablist">
            {[["problem", "Problem"], ["hints", `Hints${problem.hints.length ? ` (${problem.hints.length})` : ""}`], ["solution", "Solution"], ["notes", `Notes & mistakes${rec.log?.length ? ` (${rec.log.length})` : ""}`]].map(([k, l]) => (
              <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>
            ))}
          </div>

          {tab === "problem" && (
            <div className="tabbody">
              <h1 className="ptitle">{problem.title}</h1>
              <div className="crumbs" style={{ marginBottom: 14 }}>
                <Diff d={problem.difficulty} />
                <span className="pill" style={{ background: `color-mix(in srgb, var(--t-${problem.track}) 12%, transparent)`, color: `var(--t-${problem.track})` }}>{problem.track === "dp" ? "DP" : "DSA"}</span>
                <span className="tag">{problem.pattern}</span>
                {rec.viewedSolution && <span className="tag">solution viewed</span>}
                {problem.link && <a className="linkbtn" href={problem.link} target="_blank" rel="noopener noreferrer">LeetCode<Icon n="ext" s={13} /></a>}
              </div>
              <Md text={problem.statement} lang={lang} />
              <h3 className="sub">Examples</h3>
              {problem.tests.slice(0, 2).map((t, i) => <Example key={i} problem={problem} t={t} n={i + 1} />)}
              {problem.constraints.length > 0 && (<><h3 className="sub">Constraints</h3><ul className="cons">{problem.constraints.map((c) => <li key={c}>{c}</li>)}</ul></>)}
              {problem.compare !== "exact" && <p className="small muted">Order doesn't matter in the answer{problem.compare === "nested-unordered" ? " (at either level)" : ""}.</p>}
            </div>
          )}

          {tab === "hints" && (
            <div className="tabbody">
              <p className="muted small">Reveal one at a time. Try for a few minutes after each.</p>
              <ol className="hints">
                {problem.hints.slice(0, hints).map((h, i) => <li key={i}><Md text={h} lang={lang} /></li>)}
              </ol>
              {hints < problem.hints.length
                ? <button className="btn" onClick={() => setHints((h) => h + 1)}>Show hint {hints + 1} of {problem.hints.length}</button>
                : <p className="muted small">That's every hint. The Solution tab has the full approach.</p>}
            </div>
          )}

          {tab === "solution" && <SolutionTab problem={problem} rec={rec} lang={lang} code={code} id={id} />}

          {tab === "notes" && <NotesTab id={id} rec={rec} />}
        </section>

        {/* ─── Right: editor, tests, review ─── */}
        <section className="ws-right">
          <div className="toolbar">
            <Seg value={lang} onChange={setLang} options={LANGS.map((l) => [l.key, l.label])} label="Language" />
            <span className="spacer" />
            {confirmReset
              ? <><span className="small muted">Replace your code with the starter?</span><button className="btn" onClick={startFresh}>Reset</button><button className="btn" onClick={() => setConfirmReset(false)}>Cancel</button></>
              : <button className="btn" onClick={() => setConfirmReset(true)} title="Reset to the starter code"><Icon n="reset" s={15} />Reset</button>}
            <button className="btn primary" onClick={doRun} disabled={run.status === "running"}><Icon n="play" s={14} />{run.status === "running" ? "Running…" : "Run tests"}<kbd>⌘↵</kbd></button>
          </div>

          <Editor value={code} onChange={setCode} lang={lang} onRun={doRun} errorLine={errorLine} label={`${problem.title} — ${lang === "py" ? "Python" : "JavaScript"} solution`} />
          <p className="small muted edhint">
            {problem.kind === "design" ? `Define class ${problem.cls}.` : `Entry point: ${problem.fn[lang]}(${(problem.params || []).join(", ")})`}
            {lang === "py" ? " · typing, collections, heapq, bisect, math & functools are pre-imported · the first Python run downloads the runtime (~10 MB)" : " · console.log output is captured per test"}
          </p>

          <Results problem={problem} run={run} openTest={openTest} setOpenTest={setOpenTest} passed={passed} total={total} />

          {allPass && (
            <div className="panel solved-panel">
              <div className="row">
                <span className="pill" style={{ background: "var(--good-soft)", color: "var(--good)" }}><Icon n="check" s={13} />All {total} tests passed</span>
                {nextP && <button className="linkbtn" onClick={() => onOpen(nextP.id)}>Next: {nextP.title}<Icon n="arrow" s={14} /></button>}
              </div>
              {rated
                ? <p style={{ margin: 0 }}>Scheduled — this comes back for revision <b>{relDay(todayStr(rated.interval))}</b>.</p>
                : (
                  <>
                    <p style={{ margin: 0 }}>How did that feel? This sets when it comes back for revision.</p>
                    <div className="grades">
                      {GRADES.map((g) => (
                        <button key={g.key} className="grade" onClick={() => rate(g.key)} title={g.hint}>
                          <b>{g.label}</b><span>{nextInterval(rec.review?.interval, g.key)}d</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
            </div>
          )}

          <div className="panel review">
            <div className="row">
              <div>
                <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}><Icon n="spark" s={18} />Review with Claude</h3>
                <p className="small muted" style={{ margin: "2px 0 0" }}>Explains what's wrong (by line), why the failing tests fail, edge cases and complexity. {run.status === "done" ? "Includes your latest test results." : "Run the tests first for a sharper review."}</p>
              </div>
              {rev.streaming
                ? <button className="btn" onClick={() => abortRef.current?.abort()}><Icon n="stop" s={14} />Stop</button>
                : <button className="btn primary" onClick={doReview}>{rev.text ? "Review again" : "Review my code"}</button>}
            </div>
            {showKey && !apiKey && <KeySettings compact />}
            {rev.error && <div className="callout warn-c small">{rev.error}</div>}
            {(rev.text || rev.streaming) && (
              <div className="review-body">
                {rev.text ? <Md text={rev.text} lang={lang} /> : <p className="muted small pulse">Claude is reading your code…</p>}
                {rev.streaming && rev.text && <span className="caret" />}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function failSummary(problem, fail) {
  if (!fail) return "";
  const n = `Test ${fail.i + 1}`;
  if (fail.compile) return `didn't run: ${fail.error}${fail.line ? ` (line ${fail.line})` : ""}`;
  if (fail.timeout) return `${n}: time limit exceeded`;
  if (fail.error) return `${n}: ${fail.error}${fail.line ? ` (line ${fail.line})` : ""}`;
  const t = problem.tests[fail.i];
  const input = problem.kind === "design" ? "" : ` on ${(problem.params || []).map((p, k) => `${p}=${fmt(t.args[k])}`).join(", ")}`.slice(0, 120);
  return `${n}${input}: expected ${fmt(t.expected).slice(0, 80)}, got ${fmt(fail.got).slice(0, 80)}`;
}

function Example({ problem, t, n }) {
  return (
    <div className="example">
      <span className="eyebrow">Example {n}</span>
      {problem.kind === "design"
        ? <pre className="kv">{t.ops.map((op, k) => `${k === 0 ? "new " : "."}${op}(${t.args[k].map(fmt).join(", ")})  →  ${fmt(t.expected[k])}`).join("\n")}</pre>
        : (
          <pre className="kv">
            <span className="muted">Input:  </span>{(problem.params || []).map((p, k) => `${p} = ${fmt(t.args[k])}`).join(", ")}{"\n"}
            <span className="muted">Output: </span>{fmt(t.expected)}
          </pre>
        )}
      {t.note && <span className="small muted">{t.note}</span>}
    </div>
  );
}

function Results({ problem, run, openTest, setOpenTest, passed, total }) {
  if (run.status === "idle") {
    return <div className="results empty-res small muted">Run your code against {total} tests, including edge cases. Failing tests show the input, expected and actual output.</div>;
  }
  const byI = Object.fromEntries(run.results.map((r) => [r.i, r]));
  const compileErr = run.results[0]?.compile ? run.results[0] : null;
  return (
    <div className="results">
      <div className="res-head">
        {run.status === "running"
          ? <span className="small muted pulse">{run.msg}</span>
          : run.fatal
            ? <span className="small" style={{ color: "var(--bad)" }}>{run.fatal}</span>
            : <span className={`pill ${passed === total ? "okp" : "badp"}`}>{passed === total ? <Icon n="check" s={13} /> : <Icon n="x" s={13} />}{passed}/{total} passed</span>}
        <div className="meter" style={{ flex: 1 }}><i style={{ width: `${(run.results.length / total) * 100}%`, background: passed === run.results.length ? "var(--good)" : "var(--bad)" }} /></div>
      </div>
      {compileErr ? (
        <div className="res-detail" style={{ borderTop: 0 }}>
          <Row k="Error"><span style={{ color: "var(--bad)" }}>{compileErr.error}{compileErr.line ? ` (line ${compileErr.line})` : ""}</span></Row>
        </div>
      ) : problem.tests.map((t, i) => {
        const r = byI[i];
        const state = !r ? "pending" : r.skipped ? "skipped" : r.pass ? "pass" : "fail";
        const open = openTest === i && r && !r.skipped;
        return (
          <div key={i} className={`res-row ${state}`}>
            <button className="res-sum" onClick={() => r && !r.skipped && setOpenTest(open ? null : i)} aria-expanded={!!open} disabled={!r || r.skipped}>
              <span className="ri">{state === "pass" ? <Icon n="check" s={14} /> : state === "fail" ? <Icon n="x" s={14} /> : <Icon n="dot" s={14} />}</span>
              <span>Test {i + 1}</span>
              {t.note && <span className="small muted note">{t.note}</span>}
              <span className="spacer" />
              {r && !r.skipped && r.ms !== undefined && <span className="mono small muted">{r.ms < 1 ? "<1" : Math.round(r.ms)} ms</span>}
              {state === "skipped" && <span className="small muted">not run</span>}
              {r && !r.skipped && <span className={`chev ${open ? "open" : ""}`}><Icon n="chev" s={14} /></span>}
            </button>
            {open && <TestDetail problem={problem} t={t} r={r} />}
          </div>
        );
      })}
    </div>
  );
}

const Row = ({ k, children }) => <div className="kvrow"><span className="eyebrow">{k}</span><div className="kvv">{children}</div></div>;

function TestDetail({ problem, t, r }) {
  if (problem.kind === "design") {
    return (
      <div className="res-detail">
        <div className="tbl"><table>
          <thead><tr><th>Call</th><th>Expected</th><th>Yours</th></tr></thead>
          <tbody>
            {t.ops.map((op, k) => {
              const got = r.got?.[k];
              const bad = !r.error && r.got && fmt(got) !== fmt(t.expected[k]);
              return (
                <tr key={k} className={bad ? "bad" : ""}>
                  <td className="mono">{k === 0 ? "new " : "."}{op}({t.args[k].map(fmt).join(", ")})</td>
                  <td className="mono">{fmt(t.expected[k])}</td>
                  <td className="mono">{r.got && k < r.got.length ? fmt(got) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table></div>
        {r.error && <Row k="Error"><span style={{ color: "var(--bad)" }}>{r.error}{r.line ? ` (line ${r.line})` : ""}</span></Row>}
        {r.logs?.length > 0 && <Row k="Output"><pre className="kv">{r.logs.join("\n")}</pre></Row>}
      </div>
    );
  }
  return (
    <div className="res-detail">
      <Row k="Input"><pre className="kv">{(problem.params || []).map((p, k) => `${p} = ${fmt(t.args[k])}`).join("\n")}</pre></Row>
      <Row k="Expected"><pre className="kv">{fmt(t.expected)}</pre></Row>
      {r.error
        ? <Row k={r.timeout ? "Timeout" : "Error"}><span style={{ color: "var(--bad)" }}>{r.error}{r.line ? ` (line ${r.line})` : ""}</span></Row>
        : <Row k="Your output"><pre className={`kv ${r.pass ? "" : "badv"}`}>{fmt(r.got)}</pre></Row>}
      {r.logs?.length > 0 && <Row k="Printed"><pre className="kv">{r.logs.join("\n")}</pre></Row>}
    </div>
  );
}

function SolutionTab({ problem, rec, lang, code, id }) {
  const [solLang, setSolLang] = useState(lang);
  const [compare, setCompare] = useState(false);
  const solved = rec.status === "solved";
  if (!rec.viewedSolution && !solved) {
    return (
      <div className="tabbody gate">
        <h3>Give it a real attempt first</h3>
        <p className="muted">Reading the solution before struggling with the problem is the fastest way to forget it. Try the hints, run your code, or ask Claude to review your attempt.</p>
        <button className="btn" onClick={() => updateProblem(id, (r) => ({ ...r, viewedSolution: true, log: addLog(r, { kind: "rate", text: "Viewed the solution before solving" }) }))}>Reveal the solution anyway</button>
      </div>
    );
  }
  return (
    <div className="tabbody">
      <h3 className="sub" style={{ marginTop: 0 }}>Approach</h3>
      <Md text={problem.approach} lang={lang} />
      <div className="stats" style={{ margin: "12px 0" }}>
        <div><b className="cx">{problem.complexity.time}</b><span>Time</span></div>
        <div><b className="cx">{problem.complexity.space}</b><span>Space</span></div>
      </div>
      <div className="callout warn-c">
        <span className="ct">Common mistakes</span>
        <ul className="pitfalls">{problem.pitfalls.map((p, i) => <li key={i}><Md text={p} lang={lang} /></li>)}</ul>
      </div>
      <div className="row" style={{ margin: "16px 0 8px" }}>
        <Seg value={solLang} onChange={setSolLang} options={LANGS.map((l) => [l.key, l.label])} label="Solution language" />
        <button className={`btn ${compare ? "ok" : ""}`} onClick={() => setCompare((c) => !c)}>{compare ? "Hide my code" : "Compare with my code"}</button>
      </div>
      {compare
        ? (
          <div className="cmp2">
            <div><span className="eyebrow">Yours ({lang === "py" ? "Python" : "JS"})</span><CodeView code={code} lang={lang} /></div>
            <div><span className="eyebrow">Reference</span><CodeView code={problem.solution[solLang]} lang={solLang} /></div>
          </div>
        )
        : <CodeView code={problem.solution[solLang]} lang={solLang} />}
    </div>
  );
}

const LOG_ICON = { fail: "x", pass: "check", rate: "clock", review: "spark" };
function NotesTab({ id, rec }) {
  return (
    <div className="tabbody">
      <label className="eyebrow" htmlFor={`notes-${id}`}>Your notes — what tripped you up, the key insight</label>
      <textarea id={`notes-${id}`} className="inp notes" value={rec.notes || ""} placeholder="e.g. Forgot that the window's left edge must never move backwards…"
        onChange={(e) => { const v = e.target.value; updateProblem(id, (r) => ({ ...r, notes: v })); }} />
      <div className="row" style={{ margin: "16px 0 6px" }}>
        <span className="eyebrow">History</span>
        {rec.review && <span className="small muted">Next revision {relDay(rec.review.due)} · {rec.attempts || 0} runs</span>}
      </div>
      {!rec.log?.length && <p className="small muted">Runs, failures, ratings and Claude reviews show up here.</p>}
      <ol className="hist">
        {(rec.log || []).map((l, i) => (
          <li key={i} className={`h-${l.kind}`}>
            <span className="hi"><Icon n={LOG_ICON[l.kind] || "dot"} s={13} /></span>
            <span><span className="mono small muted">{when(l.at)}{l.lang ? ` · ${l.lang === "py" ? "PY" : "JS"}` : ""}</span><br />{l.text}</span>
          </li>
        ))}
      </ol>
      {rec.reviews?.length > 0 && (
        <>
          <span className="eyebrow" style={{ display: "block", margin: "16px 0 6px" }}>Past Claude reviews</span>
          {rec.reviews.map((rv, i) => (
            <details key={i} className="qa">
              <summary>{when(rv.at)} · {rv.lang === "py" ? "Python" : "JavaScript"}</summary>
              <div><Md text={rv.text} lang={rv.lang} /></div>
            </details>
          ))}
        </>
      )}
    </div>
  );
}

// ─── Styles (uses the shared tokens from App.jsx's :root) ────────────────────
const PRACTICE_CSS = `
  .prac .small { font-size: 13.5px; }
  .prac .row { display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; }
  .prac .spacer { flex:1; }
  .prac .tag { font-size:11px; font-family:var(--f-mono); padding:2px 7px; border-radius:5px; background:var(--surface-2); color:var(--muted); white-space:nowrap; }
  .prac kbd { font-family:var(--f-mono); font-size:11px; opacity:.8; border:1px solid color-mix(in srgb,currentColor 35%,transparent); border-radius:5px; padding:0 5px; }
  .prac .btn.primary { background:var(--accent); border-color:var(--accent); color:#fff; }
  .prac .btn.primary:hover:not([disabled]) { filter:brightness(1.07); }
  .prac .btn.ok { background:var(--good-soft); color:var(--good); border-color:transparent; }
  .linkbtn { display:inline-flex; align-items:center; gap:5px; border:0; background:none; padding:0; cursor:pointer; color:var(--muted); font-size:13.5px; text-decoration:none; }
  .linkbtn:hover { color:var(--accent); }
  .inp { font:inherit; font-size:14px; color:var(--ink); background:var(--surface); border:1px solid var(--line); border-radius:10px; padding:8px 12px; min-width:0; }
  .inp:focus { outline:none; border-color:var(--accent); }
  .sel { padding-right:28px; }
  .filters { display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
  .filters input[type=search] { flex:1; min-width:200px; }
  .seg { display:inline-flex; border:1px solid var(--line); border-radius:10px; padding:2px; background:var(--surface); }
  .seg button { border:0; background:none; padding:6px 12px; border-radius:8px; cursor:pointer; font-size:13.5px; font-weight:600; color:var(--muted); }
  .seg button.on { background:var(--accent-soft); color:var(--accent); }
  .cat-h { font-family:var(--f-mono); font-size:12px; letter-spacing:.08em; text-transform:uppercase; color:var(--muted); margin:24px 0 8px; display:flex; align-items:center; gap:10px; }
  .cat-h::after { content:""; flex:1; height:1px; background:var(--line); }
  .plist { display:grid; gap:6px; }
  .prow { display:flex; align-items:center; gap:10px; width:100%; padding:10px 14px; border-radius:12px; border:1px solid var(--line); background:var(--surface); cursor:pointer; text-align:left; transition:border-color .15s, transform .15s; }
  .prow:hover { border-color:var(--accent); transform:translateX(2px); }
  .track-items .prow { border-color:transparent; background:transparent; padding:8px 10px; }
  .track-items .prow:hover { background:var(--surface-2); transform:none; }
  .prow .t { flex:1; min-width:0; display:flex; flex-direction:column; }
  .prow .t b { font-weight:600; font-size:15px; }
  .prow .t small { font-size:12.5px; color:var(--muted); }
  @media (max-width:620px){ .prow .trackpill, .prow .tag { display:none; } }
  .st { width:20px; height:20px; flex:none; border-radius:50%; display:grid; place-items:center; }
  .st-new { border:1.5px dashed var(--line); }
  .st-try { border:2px solid var(--accent); background:conic-gradient(var(--accent) 0 50%, transparent 50%); }
  .st-solved { background:var(--good); color:#fff; }
  .diff { font-family:var(--f-mono); font-size:12px; font-weight:500; min-width:52px; text-align:right; }
  .diff-Easy { color:var(--good); } .diff-Medium { color:var(--t-beh); } .diff-Hard { color:var(--bad); }
  .due-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:10px; }
  .lists-grid .due-card { border-color:var(--line); }
  .lists-grid .due-card:hover { border-color:var(--accent); }
  .due-card { display:flex; flex-direction:column; gap:4px; padding:14px; border-radius:12px; border:1px solid var(--accent); background:var(--surface); cursor:pointer; text-align:left; transition:transform .2s, box-shadow .2s; }
  .due-card:hover { transform:translateY(-2px); box-shadow:var(--shadow); }
  .due-card b { font-family:var(--f-display); font-stretch:106%; font-size:16px; }
  .g2-wide { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; }
  @media (max-width:900px){ .g2-wide { grid-template-columns:1fr; } }
  .mlog { padding:6px; display:grid; gap:2px; }
  .mlog-row { display:grid; grid-template-columns:56px minmax(0,1fr); gap:10px; text-align:left; border:0; background:none; padding:8px 10px; border-radius:10px; cursor:pointer; }
  .mlog-row:hover { background:var(--surface-2); }
  .mlog-row b { display:block; font-size:14px; }
  .mlog-row .small { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .keybox { display:grid; gap:12px; }
  .keyform { display:flex; gap:8px; } .keyform .inp { flex:1; }

  /* workspace */
  .ws { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1.2fr); gap:16px; align-items:start; }
  @media (max-width:1100px){ .ws { grid-template-columns:minmax(0,1fr); } }
  .ws-left { padding:0; overflow:hidden; }
  @media (min-width:1101px){ .ws-left { position:sticky; top:16px; max-height:calc(100vh - 32px); display:flex; flex-direction:column; } .ws-left .tabbody { overflow-y:auto; } }
  .ws-right { display:grid; gap:12px; min-width:0; }
  .tabs { display:flex; gap:2px; border-bottom:1px solid var(--line); padding:6px 8px 0; overflow-x:auto; scrollbar-width:none; flex:none; }
  .tabs button { border:0; background:none; padding:9px 12px; font-size:13.5px; font-weight:600; color:var(--muted); cursor:pointer; border-bottom:2px solid transparent; margin-bottom:-1px; white-space:nowrap; }
  .tabs button.on { color:var(--ink); border-bottom-color:var(--accent); }
  .tabbody { padding:18px 20px 22px; }
  .ptitle { font-size:clamp(24px,3vw,32px); line-height:1.1; font-weight:800; font-stretch:112%; margin-bottom:10px !important; }
  .prac h3.sub { font-size:15px; font-weight:700; margin:20px 0 8px; font-family:var(--f-display); }
  .example { display:grid; gap:6px; margin-bottom:10px; }
  pre.kv { margin:0; font-family:var(--f-mono); font-size:13px; line-height:1.55; background:var(--surface-2); border-radius:8px; padding:8px 10px; white-space:pre-wrap; word-break:break-word; }
  pre.kv.badv { background:var(--bad-soft); color:var(--bad); }
  .cons, .pitfalls { margin:0; padding-left:1.2em; font-size:14px; } .cons li, .pitfalls li { margin:4px 0; }
  .pitfalls .md p { margin:0; }
  .hints { padding-left:1.3em; } .hints li { margin:0 0 10px; } .hints li::marker { color:var(--accent); font-family:var(--f-mono); }
  .gate { text-align:center; padding:36px 24px; } .gate h3 { margin-bottom:8px; } .gate p { max-width:46ch; margin:0 auto 16px; }
  .cx { font-size:15px !important; line-height:1.35 !important; font-family:var(--f-mono) !important; font-stretch:100% !important; }
  .warn-c { background:var(--bad-soft); } .warn-c .ct { color:var(--bad); }
  .cmp2 { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; } .cmp2 > div { display:grid; gap:6px; min-width:0; }
  @media (max-width:620px){ .cmp2 { grid-template-columns:1fr; } }
  .duebar { display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-bottom:14px; }
  .duebar > div { display:grid; gap:2px; }
  textarea.notes { width:100%; min-height:110px; resize:vertical; margin-top:6px; line-height:1.5; }
  .hist { list-style:none; margin:0; padding:0; display:grid; gap:8px; }
  .hist li { display:grid; grid-template-columns:24px minmax(0,1fr); gap:8px; font-size:14px; line-height:1.45; }
  .hist .hi { width:22px; height:22px; border-radius:7px; display:grid; place-items:center; background:var(--surface-2); color:var(--muted); }
  .h-fail .hi { background:var(--bad-soft); color:var(--bad); } .h-pass .hi { background:var(--good-soft); color:var(--good); }
  .h-review .hi { background:var(--cobalt-soft); color:var(--cobalt); } .h-rate .hi { background:var(--accent-soft); color:var(--accent); }
  details.qa { border:1px solid var(--line); border-radius:12px; background:var(--surface); margin:8px 0; overflow:hidden; }
  details.qa summary { cursor:pointer; padding:10px 14px; font-weight:600; font-size:14px; }
  details.qa > div { padding:0 14px 12px; }

  .toolbar { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
  .edhint { margin:-4px 2px 0; }
  .ed { display:flex; border:1px solid var(--line); border-radius:12px; background:var(--surface); overflow:auto; min-height:320px; max-height:62vh; font-family:var(--f-mono); font-size:13.5px; line-height:1.6; cursor:text; }
  .ed:focus-within { border-color:var(--accent); }
  .ed-gutter { position:sticky; left:0; z-index:2; flex:none; padding:12px 8px 12px 12px; text-align:right; color:var(--muted); background:var(--surface-2); user-select:none; min-width:44px; font-variant-numeric:tabular-nums; height:max-content; min-height:100%; }
  .ed-gutter .err { color:#fff; background:var(--bad); border-radius:4px; margin:0 -4px; padding:0 4px; }
  .ed-body { position:relative; flex:1; min-width:max-content; }
  .ed-hl, .ed-input { margin:0; padding:12px 16px; font:inherit; line-height:inherit; tab-size:4; white-space:pre; letter-spacing:0; word-spacing:0; border:0; }
  .ed-hl { pointer-events:none; color:var(--ink); min-height:100%; }
  .ed-input { position:absolute; inset:0; width:100%; height:100%; resize:none; overflow:hidden; background:transparent; color:transparent; caret-color:var(--ink); outline:none; }
  .ed-input::selection { background:color-mix(in srgb,var(--cobalt) 30%,transparent); color:transparent; }
  .code-view { margin:0; font-family:var(--f-mono); font-size:13px; line-height:1.6; background:var(--surface-2); border:1px solid var(--line); border-radius:12px; padding:12px 14px; overflow-x:auto; white-space:pre; }
  .tk-k { color:var(--t-dp); font-weight:500; } .tk-s { color:var(--good); } .tk-n { color:var(--t-fsd); }
  .tk-c { color:var(--muted); font-style:italic; } .tk-b { color:var(--cobalt); } .tk-f { color:var(--t-beh); }

  .results { border:1px solid var(--line); border-radius:12px; background:var(--surface); overflow:hidden; }
  .empty-res { padding:14px 16px; }
  .res-head { display:flex; align-items:center; gap:12px; padding:12px 14px; border-bottom:1px solid var(--line); }
  .okp { background:var(--good-soft); color:var(--good); } .badp { background:var(--bad-soft); color:var(--bad); }
  .res-row + .res-row { border-top:1px solid var(--line); }
  .res-sum { display:flex; align-items:center; gap:10px; width:100%; padding:9px 14px; border:0; background:none; cursor:pointer; text-align:left; font-size:14px; }
  .res-sum:disabled { cursor:default; }
  .res-sum:hover:not(:disabled) { background:var(--surface-2); }
  .res-sum .note { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; min-width:0; }
  .res-sum .chev { display:flex; color:var(--muted); transition:transform .2s; } .res-sum .chev.open { transform:rotate(90deg); }
  .ri { width:20px; height:20px; border-radius:6px; display:grid; place-items:center; flex:none; background:var(--surface-2); color:var(--muted); }
  .res-row.pass .ri { background:var(--good-soft); color:var(--good); }
  .res-row.fail .ri { background:var(--bad-soft); color:var(--bad); }
  .res-row.fail > .res-sum > span:nth-child(2) { color:var(--bad); font-weight:600; }
  .res-detail { padding:4px 14px 14px 44px; display:grid; gap:10px; animation:enter .25s ease-out both; }
  .kvrow { display:grid; gap:4px; } .kvrow .eyebrow { font-size:11px; } .kvv { min-width:0; font-size:14px; }
  .res-detail .tbl table { min-width:0; } .res-detail tr.bad td { background:var(--bad-soft); }
  .solved-panel { display:grid; gap:12px; border-color:var(--good); animation:enter .35s ease-out both; }
  .grades { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:8px; }
  .grade { display:flex; flex-direction:column; align-items:center; gap:2px; padding:10px 6px; border:1px solid var(--line); border-radius:10px; background:var(--bg); cursor:pointer; transition:border-color .15s, transform .15s; }
  .grade:hover { border-color:var(--accent); transform:translateY(-2px); }
  .grade b { font-size:14px; } .grade span { font-family:var(--f-mono); font-size:12px; color:var(--muted); }
  .review { display:grid; gap:12px; }
  .review-body { border-top:1px solid var(--line); padding-top:12px; position:relative; }
  .caret { display:inline-block; width:8px; height:16px; background:var(--accent); vertical-align:text-bottom; animation:blink 1s steps(1) infinite; }
  @keyframes blink { 50% { opacity:0; } }
  .pulse { animation:pulseText 1.4s ease-in-out infinite; }
  @keyframes pulseText { 50% { opacity:.45; } }

  .md { font-size:15px; line-height:1.6; }
  .md p { margin:0 0 10px; } .md p:last-child { margin-bottom:0; }
  .md h3 { font-size:16px; font-weight:700; margin:18px 0 6px; } .md h3:first-child { margin-top:0; }
  .md h4 { font-size:14.5px; font-weight:700; margin:14px 0 4px; }
  .md ul, .md ol { margin:0 0 10px; padding-left:1.3em; } .md li { margin:4px 0; } .md ul li::marker { color:var(--accent); }
  .md code { font-family:var(--f-mono); font-size:.88em; background:var(--surface-2); padding:.08em .35em; border-radius:4px; }
  .md .code-view { margin:8px 0 12px; }
`;
