// System Design Atlas — served at /atlas (and /system-design) inside the tracker app.
// Written with htm tagged templates (vendored in ./vendor/htm.js) instead of JSX.
import React, { useState, useEffect, useMemo, useRef, useCallback, Fragment } from "react";
import htm from "./vendor/htm.js";
import PLAYBOOK from "./content/playbook.json";
import BLOCKS from "./content/blocks.json";
import ROADMAP from "./content/roadmap.json";

const html = htm.bind(React.createElement);

/* ---------- content (bundled by Vite) ---------- */
const STUDY_FILES = import.meta.glob("./content/studies/*.json", { eager: true, import: "default" });
const DRILL_FILES = import.meta.glob("./content/drills/*.json", { eager: true, import: "default" });
const QUIZ_FILES = import.meta.glob("./content/quizzes/*.json", { eager: true, import: "default" });
// Long-form "Deep dive" tab content: deep/block-<id>.json and deep/study-<id>.json, each { sections: [...] }.
const DEEP_FILES = import.meta.glob("./content/deep/*.json", { eager: true, import: "default" });
function loadContent(){
  const byName = (m) => Object.keys(m).sort().map((k) => m[k]);
  const studies = {}; byName(STUDY_FILES).forEach((s) => { studies[s.id] = s; });
  const deep = {}; Object.keys(DEEP_FILES).forEach((k) => { deep[k.split("/").pop().replace(/\.json$/, "")] = DEEP_FILES[k]; });
  return { playbook: PLAYBOOK, blocks: BLOCKS, roadmap: ROADMAP.studies, studies, deep, drills: byName(DRILL_FILES), quizzes: byName(QUIZ_FILES) };
}

const TZ_OFFSET = "+05:30";

/* ---------- storage ---------- */
const store = {
  get(k, d){ try { const v = localStorage.getItem("sda:" + k); return v == null ? d : JSON.parse(v); } catch(e){ return d; } },
  set(k, v){ try { localStorage.setItem("sda:" + k, JSON.stringify(v)); } catch(e){} }
};
function useStored(key, init){
  const [v, setV] = useState(() => store.get(key, init));
  const set = useCallback((nv) => { setV(nv); store.set(key, nv); }, [key]);
  return [v, set];
}

/* ---------- time helpers (IST) ---------- */
const istDate = (d = new Date()) => new Date(d.getTime() + (330 + d.getTimezoneOffset()) * 60000);
const todayIST = () => { const d = istDate(); return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0"); };
const at = (date, hm) => new Date(date + "T" + hm + ":00" + TZ_OFFSET);
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const fmtDate = (s) => { const m = Number(s.slice(5,7)), d = Number(s.slice(8,10)); return MONTHS[m-1] + " " + d; };

/* ---------- routing ---------- */
const PREFIXES = ["block", "study", "drill", "quiz"];
function parseHash(){
  const h = (location.hash || "").replace(/^#/, "");
  if (!h) return { page: "home" };
  for (const p of PREFIXES) if (h.startsWith(p + "-")) return { page: p, id: h.slice(p.length + 1) };
  return { page: h };
}
function useRoute(){
  const [r, setR] = useState(parseHash);
  useEffect(() => {
    const on = () => { setR(parseHash()); window.scrollTo({ top: 0 }); };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return r;
}

/* ---------- inline markup: **bold** and `code` ---------- */
function Md({ text }){
  if (text == null) return null;
  const parts = String(text).split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((s, i) =>
    s.startsWith("**") && s.endsWith("**") ? html`<strong key=${i}>${s.slice(2,-2)}</strong>` :
    s.startsWith("`") && s.endsWith("`") && s.length > 1 ? html`<code key=${i}>${s.slice(1,-1)}</code>` : s);
}

/* ---------- icons ---------- */
const I = {
  home: "M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z",
  book: "M4 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM20 4h-5a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h6z",
  blocks: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  map: "M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15",
  quiz: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.5-3 4.5M12 17.5h.01",
  bolt: "M13 2 4 14h7l-1 8 9-12h-7z",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3",
  lock: "M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4",
  check: "M5 12.5l4.5 4.5L19 7.5",
  arrow: "M5 12h14M13 6l6 6-6 6",
};
const Icon = ({ n, s = 18 }) => html`<svg width=${s} height=${s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d=${I[n]}/></svg>`;
const Mark = () => html`<svg className="brand-mark" viewBox="0 0 32 32" aria-hidden="true"><rect x="1" y="1" width="30" height="30" rx="8" fill="var(--ink)"/><circle cx="10" cy="10" r="3" fill="var(--accent)"/><circle cx="22" cy="10" r="3" fill="var(--bg)"/><circle cx="16" cy="22" r="3" fill="var(--bg)"/><path d="M10 10L16 22L22 10" stroke="var(--bg)" strokeWidth="1.6" fill="none"/></svg>`;

/* ---------- block renderers ---------- */
const KINDS = { client: "Client", edge: "Edge", service: "Service", cache: "Cache", db: "Database", queue: "Queue", store: "Storage", ext: "External" };
function Flow({ b }){
  const used = new Set(); b.rows.forEach(r => r.forEach(n => used.add(n.kind || "service")));
  return html`<div className="blk wide"><div className="flow" role="img" aria-label=${b.caption || "Architecture diagram"}>
    ${b.rows.map((row, ri) => html`<${Fragment} key=${ri}>
      ${ri > 0 && html`<div className="link"></div>`}
      <div className="flow-row">${row.map((n, ni) => html`<div key=${ni} className="node" style=${{ "--kc": "var(--k-" + (n.kind || "service") + ")", "--r": ri }}>
        <span className="kind">${KINDS[n.kind || "service"]}</span>${n.label}${n.sub && html`<small>${n.sub}</small>`}</div>`)}</div>
    <//>`)}
    <div className="legend">${[...used].map(k => html`<span key=${k} style=${{ "--kc": "var(--k-" + k + ")" }}><i></i>${KINDS[k]}</span>`)}</div>
  </div>${b.caption && html`<div className="flow-cap">${b.caption}</div>`}</div>`;
}
function hash32(s){ let h = 2166136261; for (let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; }
function Ring(){
  const [extra, setExtra] = useState(false);
  const [vnodes, setVnodes] = useState(false);
  const names = extra ? ["A","B","C","D"] : ["A","B","C"];
  const colors = { A: "var(--k-edge)", B: "var(--k-service)", C: "var(--k-db)", D: "var(--accent)" };
  const pts = []; names.forEach(n => { const reps = vnodes ? 4 : 1; for (let r = 0; r < reps; r++) pts.push({ n, a: hash32(n + "#" + r + "salt") }); });
  pts.sort((x, y) => x.a - y.a);
  const owner = (a) => (pts.find(p => p.a >= a) || pts[0]).n;
  const keys = Array.from({ length: 28 }, (_, i) => ({ id: i, a: hash32("key" + i) }));
  const base = (() => { const bp = []; ["A","B","C"].forEach(n => { const reps = vnodes ? 4 : 1; for (let r = 0; r < reps; r++) bp.push({ n, a: hash32(n + "#" + r + "salt") }); }); bp.sort((x,y)=>x.a-y.a); return (a) => (bp.find(p => p.a >= a) || bp[0]).n; })();
  const moved = keys.filter(k => owner(k.a) !== base(k.a)).length;
  const P = (a, r) => [140 + r * Math.sin(a * 2 * Math.PI), 140 - r * Math.cos(a * 2 * Math.PI)];
  return html`<div className="blk wide ring">
    <svg viewBox="0 0 280 280" role="img" aria-label="Consistent hashing ring">
      <circle cx="140" cy="140" r="110" fill="none" stroke="var(--line)" strokeWidth="10"/>
      ${keys.map(k => { const [x, y] = P(k.a, 110); const o = owner(k.a); const mv = o !== base(k.a); return html`<circle key=${"k"+k.id} className="key" cx=${x} cy=${y} r=${mv ? 6 : 4} fill=${colors[o]} stroke=${mv ? "var(--ink)" : "none"} strokeWidth="1.5"/>`; })}
      ${pts.map((p, i) => { const [x, y] = P(p.a, 110); const [lx, ly] = P(p.a, 136); return html`<g key=${"n"+i}><rect x=${x-9} y=${y-9} width="18" height="18" rx="4" fill="var(--surface)" stroke=${colors[p.n]} strokeWidth="2.5"/><text x=${lx} y=${ly+4} textAnchor="middle" fontSize="12" fontWeight="700" fill=${colors[p.n]} fontFamily="IBM Plex Mono, monospace">${p.n}${vnodes ? "" : ""}</text></g>`; })}
      <text x="140" y="136" textAnchor="middle" fontSize="13" fontWeight="600" fill="var(--ink)">${keys.length} keys</text>
      <text x="140" y="154" textAnchor="middle" fontSize="11.5" fill="var(--muted)">${pts.length} ring points</text>
    </svg>
    <div>
      <p style=${{ margin: "0 0 10px" }}>Each dot is a key, coloured by the server that owns it: the next server clockwise. ${extra ? html`Adding <strong>D</strong> moved <strong>${moved} of ${keys.length}</strong> keys (outlined); everything else stayed put.` : "Add a fourth server and watch how few keys move."}</p>
      <div style=${{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className=${"btn" + (extra ? " ok" : " primary")} onClick=${() => setExtra(!extra)}>${extra ? "Remove server D" : "Add server D"}</button>
        <button className="btn" onClick=${() => setVnodes(!vnodes)} aria-pressed=${vnodes}>${vnodes ? "Virtual nodes: 4 each" : "Virtual nodes: off"}</button>
      </div>
      <p className="muted small" style=${{ margin: "10px 0 0" }}>With hash mod N, going from 3 to 4 servers would move about 75% of keys.</p>
    </div></div>`;
}
// Sequence diagram: { t: "seq", actors: [...], steps: [{ from, to, label, note? }], caption? }
function Seq({ b }){
  const n = b.actors.length, colW = 150, rowH = 46, top = 58, W = n * colW;
  const H = top + b.steps.length * rowH + 18;
  const x = (a) => (b.actors.indexOf(a) + 0.5) * colW;
  return html`<div className="blk wide seq"><div className="seq-scroll"><svg viewBox=${"0 0 " + W + " " + H} style=${{ minWidth: Math.min(W, 640), maxWidth: W * 1.3, margin: "0 auto" }} role="img" aria-label=${b.caption || "Sequence diagram"}>
    <defs><marker id="seq-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--muted)"/></marker></defs>
    ${b.actors.map((a, i) => html`<g key=${a}>
      <line x1=${x(a)} y1=${top - 10} x2=${x(a)} y2=${H - 6} stroke="var(--line)" strokeWidth="1.5" strokeDasharray="4 4"/>
      <rect x=${x(a) - colW / 2 + 10} y="8" width=${colW - 20} height="34" rx="9" fill="var(--surface)" stroke="var(--line)"/>
      <text x=${x(a)} y="30" textAnchor="middle" fontSize="13" fontWeight="600" fill="var(--ink)">${a}</text>
    </g>`)}
    ${b.steps.map((st, i) => {
      const y = top + i * rowH + 24, x1 = x(st.from), x2 = x(st.to), self = st.from === st.to;
      const mid = self ? x1 + 46 : (x1 + x2) / 2;
      return html`<g key=${i} className="seq-step" style=${{ "--d": i }}>
        ${self
          ? html`<path d=${"M" + x1 + " " + (y - 6) + " h28 v14 h-26"} fill="none" stroke=${st.dashed ? "var(--muted)" : "var(--accent)"} strokeWidth="1.6" markerEnd="url(#seq-arrow)"/>`
          : html`<line x1=${x1} y1=${y} x2=${x2 + (x2 > x1 ? -4 : 4)} y2=${y} stroke=${st.dashed ? "var(--muted)" : "var(--accent)"} strokeWidth="1.6" strokeDasharray=${st.dashed ? "5 4" : ""} markerEnd="url(#seq-arrow)"/>`}
        <text x=${mid} y=${y - 7} textAnchor=${self ? "start" : "middle"} fontSize="11.5" fill="var(--ink)" fontFamily="IBM Plex Mono, monospace">${st.label}</text>
        ${st.note && html`<text x=${mid} y=${y + 15} textAnchor=${self ? "start" : "middle"} fontSize="10.5" fill="var(--muted)">${st.note}</text>`}
      </g>`;
    })}
  </svg></div>${b.caption && html`<div className="flow-cap">${b.caption}</div>`}</div>`;
}
// Bit / field layout: { t: "bits", fields: [{ label, bits, sub? }], total?, caption? }
function Bits({ b }){
  const total = b.total || b.fields.reduce((a, f) => a + f.bits, 0);
  return html`<div className="blk wide bits"><div className="bits-row">${b.fields.map((f, i) => html`<div key=${i} className="bit" style=${{ flexGrow: f.bits, "--kc": "var(--k-" + (["edge", "service", "db", "cache", "queue", "store"][i % 6]) + ")" }}>
    <b>${f.label}</b><span>${f.bits} bit${f.bits === 1 ? "" : "s"}</span>${f.sub && html`<small>${f.sub}</small>`}</div>`)}</div>
    <div className="flow-cap">${b.caption || total + " bits"}</div></div>`;
}
function Block({ b }){
  switch (b.t){
    case "p": return html`<p className="blk"><${Md} text=${b.text}/></p>`;
    case "list": { const T = b.ordered ? "ol" : "ul"; return html`<${T} className="blk">${b.items.map((x, i) => html`<li key=${i}><${Md} text=${x}/></li>`)}<//>`; }
    case "table": return html`<div className="blk wide tbl"><table><thead><tr>${b.head.map((h, i) => html`<th key=${i}>${h}</th>`)}</tr></thead><tbody>${b.rows.map((r, i) => html`<tr key=${i}>${r.map((c, j) => html`<td key=${j}><${Md} text=${c}/></td>`)}</tr>`)}</tbody></table></div>`;
    case "flow": return html`<${Flow} b=${b}/>`;
    case "ring": return html`<${Ring}/>`;
    case "seq": return html`<${Seq} b=${b}/>`;
    case "bits": return html`<${Bits} b=${b}/>`;
    case "callout": return html`<div className=${"blk callout " + (b.tone || "tip")}>${b.title && html`<span className="ct">${b.title}</span>`}<div><${Md} text=${b.text}/></div></div>`;
    case "code": return html`<div className="blk wide code-wrap"><pre className="code"><code>${b.text}</code></pre>${b.lang && html`<span className="lang">${b.lang}</span>`}</div>`;
    case "stats": return html`<div className="blk wide stats">${b.items.map((s, i) => html`<div key=${i}><b>${s.value}</b><span>${s.label}${s.sub ? " · " + s.sub : ""}</span></div>`)}</div>`;
    case "compare": return html`<div className="blk wide cmp">${b.cols.map((c, i) => html`<div key=${i}><h4>${c.title}</h4><ul>${(c.pros||[]).map((x, j) => html`<li key=${"p"+j} className="pro"><span><${Md} text=${x}/></span></li>`)}${(c.cons||[]).map((x, j) => html`<li key=${"c"+j} className="con"><span><${Md} text=${x}/></span></li>`)}</ul></div>`)}</div>`;
    case "steps": return html`<div className="blk wide steps">${b.items.map((s, i) => html`<div key=${i}><b>${s.title}</b><span><${Md} text=${s.text}/></span></div>`)}</div>`;
    case "timeline": return html`<ol className="blk tl">${b.items.map((s, i) => html`<li key=${i}><span className="m">${s.min}</span><div><b>${s.title}</b><span><${Md} text=${s.text}/></span></div></li>`)}</ol>`;
    case "qa": return html`<div className="blk">${b.items.map((x, i) => html`<details key=${i} className="qa"><summary><${Md} text=${x.q}/></summary><div><${Md} text=${x.a}/></div></details>`)}</div>`;
    default: return null;
  }
}

/* ---------- article (shared by playbook, blocks, studies, drills) ---------- */
function useSpy(ids){
  const [on, setOn] = useState(ids[0]);
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((es) => { es.forEach(e => { if (e.isIntersecting) setOn(e.target.id.replace(/^s-/, "")); }); }, { rootMargin: "-25% 0px -65% 0px" });
    ids.forEach(id => { const el = document.getElementById("s-" + id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, [ids.join("|")]);
  return on;
}
function jump(e, id){ e.preventDefault(); const el = document.getElementById("s-" + id); if (el) el.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); }
function Article({ crumbs, eyebrow, title, lede, meta, sections: notes, deep, doneKey, done, toggleDone, footer }){
  const [tabPref, setTabPref] = useStored("tab", "notes");
  const tab = deep ? tabPref : "notes";
  const sections = tab === "deep" ? deep.sections : notes;
  const ids = sections.map(s => s.id);
  const on = useSpy(ids);
  const isDone = !!done[doneKey];
  return html`<div className="page"><div className="art"><article style=${{ minWidth: 0 }}>
    <header className="art-head">
      <div className="crumbs">${crumbs}</div>
      ${eyebrow && html`<div className="eyebrow" style=${{ marginTop: 14 }}>${eyebrow}</div>`}
      <h1>${title}</h1>
      ${lede && html`<p className="lede"><${Md} text=${lede}/></p>`}
      ${meta}
    </header>
    ${deep && html`<div className="atabs" role="tablist" aria-label="View">
      <button role="tab" aria-selected=${tab === "notes"} className=${tab === "notes" ? "on" : ""} onClick=${() => setTabPref("notes")}><${Icon} n="bolt" s=${16}/>Revision notes<small>quick recall</small></button>
      <button role="tab" aria-selected=${tab === "deep"} className=${tab === "deep" ? "on" : ""} onClick=${() => setTabPref("deep")}><${Icon} n="book" s=${16}/>Deep dive<small>${deep.minutes ? deep.minutes + " min read" : "full explanation"}</small></button>
    </div>`}
    <nav className="chipbar" aria-label="Sections">${sections.map(s => html`<a key=${s.id} href=${"#"} className=${on === s.id ? "on" : ""} onClick=${(e) => jump(e, s.id)}>${s.title}</a>`)}</nav>
    ${sections.map((s, i) => html`<section key=${tab + s.id} id=${"s-" + s.id} className="sect">
      <h2><span className="idx">${String(i + 1).padStart(2, "0")}</span>${s.title}</h2>
      ${(s.blocks || []).map((b, j) => html`<${Block} key=${j} b=${b}/>`)}
    </section>`)}
    <div style=${{ marginTop: 34, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
      <button className=${"btn " + (isDone ? "ok" : "primary")} onClick=${() => toggleDone(doneKey)}><${Icon} n="check" s=${16}/>${isDone ? "Marked as revised" : "Mark as revised"}</button>
      ${footer}
    </div>
  </article>
  <aside className="toc" aria-label="On this page"><div className="eyebrow" style=${{ marginBottom: 8 }}>On this page</div>
    ${sections.map(s => html`<a key=${s.id} href="#" className=${on === s.id ? "on" : ""} onClick=${(e) => jump(e, s.id)}>${s.title}</a>`)}
    <button className=${"btn done-btn " + (isDone ? "ok" : "")} onClick=${() => toggleDone(doneKey)}><${Icon} n="check" s=${15}/>${isDone ? "Revised" : "Mark revised"}</button>
  </aside></div></div>`;
}

/* ---------- hero network ---------- */
function HeroNet(){
  const paths = ["M40 110 H130", "M170 110 C200 110 200 60 230 60", "M170 110 C200 110 200 160 230 160", "M290 60 C320 60 320 60 350 60", "M290 160 C320 160 320 160 350 160", "M290 60 C320 60 330 110 350 110", "M290 160 C320 160 330 110 350 110"];
  const N = (x, y, w, label, kind) => html`<g><rect x=${x} y=${y-17} width=${w} height="34" rx="8" fill="var(--surface)" stroke=${"var(--k-" + kind + ")"} strokeWidth="1.6"/><text x=${x + w/2} y=${y+4} textAnchor="middle" fontSize="11.5" fontWeight="600" fill="var(--ink)" fontFamily="IBM Plex Sans, sans-serif">${label}</text></g>`;
  return html`<svg viewBox="0 0 420 220" className="hero-net" role="img" aria-label="Requests flowing from client through load balancer and services to cache and database">
    <defs><pattern id="dots" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="var(--line)"/></pattern></defs>
    <rect width="420" height="220" fill="url(#dots)" rx="10"/>
    ${paths.map((d, i) => html`<path key=${i} id=${"hp" + i} d=${d} fill="none" stroke="var(--line)" strokeWidth="2"/>`)}
    ${[[0,0],[1,.3],[2,.9],[3,.7],[4,1.4],[5,1.1],[6,1.8]].map(([i, delay]) => html`<circle key=${"pk"+i} className="pk" r="4" fill=${i > 4 ? "var(--k-db)" : i > 2 ? "var(--k-cache)" : "var(--accent)"}><animateMotion dur="1.6s" repeatCount="indefinite" begin=${(-delay - 0.05) + "s"}><mpath href=${"#hp" + i}/></animateMotion></circle>`)}
    ${N(8, 110, 60, "Client", "client")}${N(118, 110, 58, "LB", "edge")}${N(222, 60, 72, "API", "service")}${N(222, 160, 72, "API", "service")}
    ${N(346, 60, 66, "Redis", "cache")}${N(346, 110, 66, "Kafka", "queue")}${N(346, 160, 66, "Postgres", "db")}
    <text x="12" y="208" fontSize="10" fill="var(--muted)" fontFamily="IBM Plex Mono, monospace">${"p99 < 200 ms · 3 AZ · RF=3"}</text>
  </svg>`;
}

/* ---------- pages ---------- */
function useNow(ms = 1000){ const [n, setN] = useState(Date.now()); useEffect(() => { const t = setInterval(() => setN(Date.now()), ms); return () => clearInterval(t); }, [ms]); return n; }
function Countdown({ target }){
  const now = useNow();
  let s = Math.max(0, Math.floor((target - now) / 1000));
  const d = Math.floor(s / 86400); s -= d * 86400; const h = Math.floor(s / 3600); s -= h * 3600; const m = Math.floor(s / 60); s -= m * 60;
  const pad = (x) => String(x).padStart(2, "0");
  return html`<div className="countdown">${d > 0 ? d + "d " : ""}${pad(h)}:${pad(m)}:${pad(s)}</div>`;
}
function Home({ data, done }){
  const { roadmap, studies, drills, quizzes, blocks } = data;
  const today = todayIST();
  const nextStudy = roadmap.find(r => studies[r.id] && !done["study-" + r.id]);
  const unlocked = roadmap.filter(r => done["study-" + r.id]).length;
  const readBlocks = blocks.topics.filter(t => done["block-" + t.id]).length;
  const drillToday = drills.find(d => d.date === today);
  const quizToday = quizzes.find(q => q.date === today && q.id !== "warmup");
  const studyToday = roadmap.find(r => r.date === today);
  const now = Date.now();
  const slot = (hm) => at(today, hm).getTime() <= now;
  const bestScores = store.get("quizbest", {});
  const avg = Object.values(bestScores).length ? Math.round(Object.values(bestScores).reduce((a, b) => a + b, 0) / Object.values(bestScores).length) : null;
  return html`<div className="page">
    <section className="hero stagger">
      <div style=${{ "--i": 0 }}>
        <div className="eyebrow">${roadmap.length} case studies · ${blocks.topics.length} building blocks · daily drills</div>
        <h1 style=${{ marginTop: 10 }}>System design, <em>one layer</em> at a time.</h1>
        <p>Every case study and building block is open. Follow the suggested pace of one case study every three days, with a deep dive at 3 PM and a quiz at 8 PM in between, or jump to anything whenever you need it.</p>
        <div style=${{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
          <a className="btn primary" href="#playbook" style=${{ textDecoration: "none" }}>Open the playbook <${Icon} n="arrow" s=${16}/></a>
          <a className="btn" href="#blocks" style=${{ textDecoration: "none" }}>Building blocks</a>
        </div>
      </div>
      <div className="hero-art" style=${{ "--i": 1 }}><${HeroNet}/></div>
    </section>

    <div className="grid g3 stagger">
      <div className="panel" style=${{ "--i": 2 }}>
        <div className="eyebrow">${nextStudy ? "Continue with" : "Roadmap"}</div>
        ${nextStudy ? html`<h3 style=${{ marginTop: 6 }}>#${nextStudy.num} ${nextStudy.title}</h3>
          <div className="muted small" style=${{ margin: "6px 0 12px" }}>Suggested for ${fmtDate(nextStudy.date)} · ${nextStudy.focus.slice(0, 3).join(" · ")}</div>
          <a className="btn primary" href=${"#study-" + nextStudy.id} style=${{ textDecoration: "none" }}>Open case study <${Icon} n="arrow" s=${16}/></a>` : html`<h3 style=${{ marginTop: 6 }}>All ${roadmap.length} revised</h3>`}
      </div>
      <div className="panel" style=${{ "--i": 3 }}>
        <div className="eyebrow">Progress</div>
        <div className="stat-row">
          <div className="stat"><b>${unlocked}<span style=${{ fontSize: 16 }}>/${roadmap.length}</span></b><span>studies revised</span></div>
          <div className="stat"><b>${readBlocks}<span style=${{ fontSize: 16 }}>/${blocks.topics.length}</span></b><span>blocks revised</span></div>
          <div className="stat"><b>${avg == null ? "—" : avg + "%"}</b><span>quiz average</span></div>
        </div>
        <div className="meter"><i style=${{ width: Math.round((readBlocks / blocks.topics.length) * 100) + "%" }}></i></div>
      </div>
      <div className="panel" style=${{ "--i": 4 }}>
        <div className="eyebrow">Today · ${fmtDate(today)}</div>
        <ul className="sched">
          <li><span className="t">3:00 PM</span><span>${drillToday ? html`<a href=${"#drill-" + drillToday.id}>${drillToday.topic}</a>` : "Deep dive"}</span>${drillToday ? html`<span className="pill live">Open</span>` : html`<span className=${"pill " + (slot("15:00") ? "next" : "wait")}>${slot("15:00") ? "Arriving" : "Later"}</span>`}</li>
          <li><span className="t">8:00 PM</span><span>${quizToday ? html`<a href=${"#quiz-" + quizToday.id}>${quizToday.topic}</a>` : "Quiz"}</span>${quizToday ? html`<span className="pill live">Open</span>` : html`<span className=${"pill " + (slot("20:00") ? "next" : "wait")}>${slot("20:00") ? "Arriving" : "Later"}</span>`}</li>
          ${studyToday && html`<li><span className="t">10:00 PM</span><span>${studies[studyToday.id] ? html`<a href=${"#study-" + studyToday.id}>${studyToday.title}</a>` : studyToday.title}</span>${studies[studyToday.id] ? html`<span className="pill live">Open</span>` : html`<span className="pill next">Tonight</span>`}</li>`}
        </ul>
      </div>
    </div>

    <div className="sec-head"><h2>Case study roadmap</h2><a href="#studies">All case studies →</a></div>
    <${Roadmap} roadmap=${roadmap} studies=${studies} done=${done}/>

    <div className="sec-head"><h2>Recent drills</h2><a href="#drills">All drills →</a></div>
    <div className="cards stagger">
      ${[...quizzes].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3).map((q, i) => html`<a key=${q.id} className="card" href=${"#quiz-" + q.id} style=${{ "--i": i }}><div className="row"><span className="eyebrow">Quiz · ${q.slot || fmtDate(q.date)}</span>${bestScores[q.id] != null && html`<span className="pill done">${bestScores[q.id]}%</span>`}</div><b>${q.title || q.topic}</b><p>${q.questions.length} questions · ${q.topic}</p></a>`)}
      ${[...drills].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3).map((d, i) => html`<a key=${d.id} className="card" href=${"#drill-" + d.id} style=${{ "--i": i + 3 }}><span className="eyebrow">Deep dive · ${fmtDate(d.date)}</span><b>${d.title}</b><p>${d.summary}</p></a>`)}
    </div>
  </div>`;
}
function Roadmap({ roadmap, studies, done }){
  const nextId = (roadmap.find(r => !done["study-" + r.id]) || {}).id;
  return html`<div className="road stagger">${roadmap.map((r, i) => {
    const open = !!studies[r.id]; const nx = r.id === nextId;
    const inner = html`<span className="n">#${String(r.num).padStart(2, "0")}</span><b>${r.title}</b><div className="tags">${r.focus.slice(0, 2).map(f => html`<span key=${f} className="tag">${f}</span>`)}</div><span className="d">${done["study-" + r.id] ? "Revised" : (open ? "" : "Preparing · ") + "Suggested " + fmtDate(r.date)}</span>
      <span className="st">${done["study-" + r.id] ? html`<span style=${{ color: "var(--good)" }}><${Icon} n="check" s=${16}/></span>` : null}</span>`;
    return html`<a key=${r.id} className=${"stop" + (nx ? " next" : "")} href=${"#study-" + r.id} style=${{ "--i": i }}>${inner}</a>`;
  })}</div>`;
}
function BlocksIndex({ data, done }){
  const cats = []; data.blocks.topics.forEach(t => { if (!cats.includes(t.category)) cats.push(t.category); });
  return html`<div className="page">
    <div className="eyebrow">Reference</div>
    <h1 style=${{ fontSize: "clamp(30px,4.6vw,46px)", fontWeight: 800, fontStretch: "116%", margin: "8px 0 10px" }}>Building blocks</h1>
    <p className="muted" style=${{ maxWidth: "60ch", margin: 0 }}>Every component a system design answer is assembled from: when to reach for it, the strategies inside it, the traps, and the sentence to say in the interview.</p>
    ${cats.map(c => html`<div key=${c}><div className="cat-h">${c}</div><div className="cards stagger">${data.blocks.topics.filter(t => t.category === c).map((t, i) => html`<a key=${t.id} className="card" href=${"#block-" + t.id} style=${{ "--i": i }}><div className="row"><b>${t.title}</b>${done["block-" + t.id] && html`<span style=${{ color: "var(--good)" }}><${Icon} n="check" s=${16}/></span>`}</div><p>${t.summary}</p></a>`)}</div></div>`)}
  </div>`;
}
function StudiesIndex({ data, done }){
  return html`<div className="page">
    <div className="eyebrow">All open · suggested pace: one every 3 days</div>
    <h1 style=${{ fontSize: "clamp(30px,4.6vw,46px)", fontWeight: 800, fontStretch: "116%", margin: "8px 0 10px" }}>Case studies</h1>
    <p className="muted" style=${{ maxWidth: "60ch", margin: "0 0 22px" }}>${data.roadmap.length} real systems, each walked through the full interview: requirements, estimates, API, data model, architecture, deep dives, trade-offs and follow-up questions.</p>
    <${Roadmap} roadmap=${data.roadmap} studies=${data.studies} done=${done}/>
  </div>`;
}
function DrillsIndex({ data }){
  const best = store.get("quizbest", {});
  const qs = [...data.quizzes].sort((a, b) => b.date.localeCompare(a.date));
  const ds = [...data.drills].sort((a, b) => b.date.localeCompare(a.date));
  return html`<div className="page">
    <div className="eyebrow">3 PM deep dive · 8 PM quiz</div>
    <h1 style=${{ fontSize: "clamp(30px,4.6vw,46px)", fontWeight: 800, fontStretch: "116%", margin: "8px 0 10px" }}>Daily drills</h1>
    <p className="muted" style=${{ maxWidth: "60ch", margin: 0 }}>Spaced revision so concepts don't fade between case studies. Each deep dive focuses on where a strategy applies; each quiz tests the choice under a scenario.</p>
    <div className="cat-h">Quizzes</div>
    <div className="cards stagger">${qs.map((q, i) => html`<a key=${q.id} className="card" href=${"#quiz-" + q.id} style=${{ "--i": i }}><div className="row"><span className="eyebrow">${q.slot || "Quiz"} · ${fmtDate(q.date)}</span>${best[q.id] != null && html`<span className="pill done">${best[q.id]}%</span>`}</div><b>${q.title || q.topic}</b><p>${q.questions.length} questions · ${q.topic}</p></a>`)}</div>
    <div className="cat-h">Deep dives</div>
    ${ds.length ? html`<div className="cards stagger">${ds.map((d, i) => html`<a key=${d.id} className="card" href=${"#drill-" + d.id} style=${{ "--i": i }}><span className="eyebrow">${fmtDate(d.date)} · ${d.topic}</span><b>${d.title}</b><p>${d.summary}</p></a>`)}</div>` : html`<div className="panel muted">The first deep dive arrives today at 3:00 PM IST.</div>`}
  </div>`;
}
function Quiz({ quiz }){
  const [i, setI] = useState(0);
  const [pick, setPick] = useState(null);
  const [right, setRight] = useState(0);
  const [finished, setFinished] = useState(false);
  const q = quiz.questions[i];
  const choose = (k) => { if (pick != null) return; setPick(k); if (k === q.answer) setRight(r => r + 1); };
  const next = () => {
    if (i + 1 < quiz.questions.length){ setI(i + 1); setPick(null); return; }
    setFinished(true);
    const pct = Math.round((right / quiz.questions.length) * 100);
    const best = store.get("quizbest", {}); if (best[quiz.id] == null || pct > best[quiz.id]) { best[quiz.id] = pct; store.set("quizbest", best); }
  };
  const restart = () => { setI(0); setPick(null); setRight(0); setFinished(false); };
  const crumbs = html`<div className="crumbs"><a href="#drills">Daily drills</a><span>/</span><span>${quiz.title || quiz.topic}</span></div>`;
  if (finished){
    const pct = Math.round((right / quiz.questions.length) * 100); const C = 2 * Math.PI * 58;
    return html`<div className="page quiz">${crumbs}
      <div style=${{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap", marginTop: 24 }}>
        <svg className="score-ring" viewBox="0 0 140 140"><circle cx="70" cy="70" r="58" fill="none" stroke="var(--surface-2)" strokeWidth="12"/><circle cx="70" cy="70" r="58" fill="none" stroke=${pct >= 70 ? "var(--good)" : "var(--accent)"} strokeWidth="12" strokeLinecap="round" strokeDasharray=${C} strokeDashoffset=${C * (1 - pct / 100)} transform="rotate(-90 70 70)"/><text x="70" y="78" textAnchor="middle" fontSize="28" fontWeight="700" fill="var(--ink)" fontFamily="Archivo, sans-serif">${pct}%</text></svg>
        <div><h1 style=${{ fontSize: 30, fontWeight: 800, fontStretch: "112%" }}>${right} of ${quiz.questions.length} right</h1><p className="muted" style=${{ margin: "6px 0 14px" }}>${pct >= 85 ? "Solid. These choices are sticking." : pct >= 60 ? "Close. Re-read the explanations you missed, then retry tomorrow." : "Worth a second pass on the building blocks for this topic."}</p>
        <div style=${{ display: "flex", gap: 8, flexWrap: "wrap" }}><button className="btn primary" onClick=${restart}>Retry quiz</button><a className="btn" href="#drills" style=${{ textDecoration: "none" }}>All drills</a></div></div>
      </div></div>`;
  }
  return html`<div className="page quiz">${crumbs}
    <div className="eyebrow" style=${{ marginTop: 16 }}>${quiz.topic} · question ${i + 1} of ${quiz.questions.length}</div>
    <div className="qbar"><i style=${{ width: ((i + (pick != null ? 1 : 0)) / quiz.questions.length) * 100 + "%" }}></i></div>
    <div key=${i} style=${{ animation: "enter .35s ease-out both" }}>
      <div className="qq"><${Md} text=${q.q}/></div>
      <div className="opts">${q.options.map((o, k) => {
        const cls = pick == null ? "" : k === q.answer ? " right" : k === pick ? " wrong" : "";
        return html`<button key=${k} className=${"opt" + cls} disabled=${pick != null} onClick=${() => choose(k)}><span className="l">${"ABCDEF"[k]}</span><span><${Md} text=${o}/></span></button>`;
      })}</div>
      ${pick != null && html`<div className=${"why callout " + (pick === q.answer ? "tip" : "warn")}><span className="ct">${pick === q.answer ? "Correct" : "Not quite"}</span><div><${Md} text=${q.why}/></div></div>
        <div style=${{ marginTop: 16 }}><button className="btn primary" onClick=${next} autoFocus>${i + 1 < quiz.questions.length ? "Next question" : "See score"} <${Icon} n="arrow" s=${16}/></button></div>`}
    </div></div>`;
}

/* ---------- search palette ---------- */
function buildIndex(data){
  const out = [{ k: "Page", t: "Home", h: "#home" }, { k: "Page", t: "Interview Playbook", h: "#playbook" }, { k: "Page", t: "Building blocks", h: "#blocks" }, { k: "Page", t: "Case studies", h: "#studies" }, { k: "Page", t: "Daily drills", h: "#drills" }];
  data.playbook.sections.forEach(s => out.push({ k: "Playbook", t: s.title, h: "#playbook", s: "Interview Playbook" }));
  data.blocks.topics.forEach(t => { out.push({ k: "Block", t: t.title, h: "#block-" + t.id, s: t.category }); t.sections.forEach(s => out.push({ k: "Block", t: s.title, h: "#block-" + t.id, s: t.title })); });
  data.roadmap.forEach(r => out.push({ k: "Study", t: r.title, h: "#study-" + r.id, s: "Case study #" + r.num }));
  Object.values(data.studies).forEach(st => (st.sections || []).forEach(s => out.push({ k: "Study", t: s.title, h: "#study-" + st.id, s: st.title })));
  data.drills.forEach(d => out.push({ k: "Drill", t: d.title, h: "#drill-" + d.id, s: fmtDate(d.date) }));
  data.quizzes.forEach(q => out.push({ k: "Quiz", t: q.title || q.topic, h: "#quiz-" + q.id, s: fmtDate(q.date) }));
  return out;
}
function Palette({ data, onClose }){
  const [q, setQ] = useState(""); const [sel, setSel] = useState(0);
  const idx = useMemo(() => buildIndex(data), [data]);
  const res = useMemo(() => { const n = q.trim().toLowerCase(); if (!n) return idx.slice(0, 12); const ws = n.split(/\s+/); return idx.filter(x => ws.every(w => (x.t + " " + (x.s || "") + " " + x.k).toLowerCase().includes(w))).slice(0, 30); }, [q, idx]);
  useEffect(() => setSel(0), [q]);
  const go = (r) => { location.hash = r.h.slice(1); onClose(); };
  const onKey = (e) => {
    if (e.key === "Escape") onClose();
    else if (e.key === "ArrowDown"){ e.preventDefault(); setSel(s => Math.min(res.length - 1, s + 1)); }
    else if (e.key === "ArrowUp"){ e.preventDefault(); setSel(s => Math.max(0, s - 1)); }
    else if (e.key === "Enter" && res[sel]) go(res[sel]);
  };
  return html`<div className="scrim" onClick=${onClose}><div className="pal" role="dialog" aria-label="Search" onClick=${(e) => e.stopPropagation()}>
    <input id="pal-q" autoFocus placeholder="Search topics, sections, case studies…" value=${q} onInput=${(e) => setQ(e.target.value)} onKeyDown=${onKey}/>
    ${res.length ? html`<ul>${res.map((r, i) => html`<li key=${i}><a href=${r.h} className=${i === sel ? "on" : ""} onMouseEnter=${() => setSel(i)} onClick=${(e) => { e.preventDefault(); go(r); }}><span className="k">${r.k}</span><span>${r.t}</span>${r.s && html`<span className="s">${r.s}</span>`}</a></li>`)}</ul>` : html`<div className="empty">Nothing matches “${q}”. Try “cache”, “lock” or “kafka”.</div>`}
  </div></div>`;
}

/* ---------- shell ---------- */
function Rail({ data, route, done, openSearch }){
  const is = (p, id) => route.page === p && (id == null || route.id === id);
  return html`<aside className="rail">
    <a className="brand" href="#home"><${Mark}/><span className="brand-name">System Design Atlas<small>Interview prep</small></span></a>
    <a className="back-link" href="/">← 26-week tracker</a>
    <button className="search-btn" onClick=${openSearch}><${Icon} n="search" s=${16}/>Search<kbd>⌘K</kbd></button>
    <nav className="nav" aria-label="Main">
      <a href="#home" className=${is("home") ? "on" : ""}><${Icon} n="home" s=${17}/>Home</a>
      <a href="#playbook" className=${is("playbook") ? "on" : ""}><${Icon} n="book" s=${17}/>Interview playbook${done["playbook"] && html`<span className="tick"><${Icon} n="check" s=${14}/></span>`}</a>
      <a href="#drills" className=${is("drills") || is("quiz") || is("drill") ? "on" : ""}><${Icon} n="bolt" s=${17}/>Daily drills</a>
      <div className="nav-group"><span className="eyebrow">Case studies</span>
        ${data.roadmap.map(r => true ? html`<a key=${r.id} href=${"#study-" + r.id} className=${is("study", r.id) ? "on" : ""}><span className="num">${String(r.num).padStart(2, "0")}</span>${r.title}${done["study-" + r.id] && html`<span className="tick"><${Icon} n="check" s=${14}/></span>`}</a>` : html`<a key=${r.id} href="#studies" style=${{ opacity: .6 }}><span className="num">${String(r.num).padStart(2, "0")}</span>${r.title}<span className="lock"><${Icon} n="lock" s=${13}/></span></a>`)}
      </div>
      <div className="nav-group"><span className="eyebrow">Building blocks</span>
        ${data.blocks.topics.map(t => html`<a key=${t.id} href=${"#block-" + t.id} className=${is("block", t.id) ? "on" : ""}>${t.title}${done["block-" + t.id] && html`<span className="tick"><${Icon} n="check" s=${14}/></span>`}</a>`)}
      </div>
    </nav>
  </aside>`;
}
function Dock({ route }){
  const items = [["home", "Home", "home", ["home"]], ["playbook", "Playbook", "book", ["playbook"]], ["blocks", "Blocks", "blocks", ["blocks", "block"]], ["studies", "Studies", "map", ["studies", "study"]], ["drills", "Drills", "bolt", ["drills", "drill", "quiz"]]];
  return html`<nav className="dock" aria-label="Main">${items.map(([h, l, ic, pages]) => html`<a key=${h} href=${"#" + h} className=${pages.includes(route.page) ? "on" : ""}><${Icon} n=${ic} s=${21}/>${l}</a>`)}</nav>`;
}
function NotFound({ what }){ return html`<div className="page panel" style=${{ marginTop: 20 }}><h3>${what} isn't here yet</h3><p className="muted">It may still be scheduled. <a href="#home">Back to home</a></p></div>`; }

function AtlasApp(){
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [search, setSearch] = useState(false);
  const [done, setDone] = useStored("done", {});
  const route = useRoute();
  const toggleDone = (k) => setDone({ ...done, [k]: !done[k] });
  useEffect(() => {
    try { setData(loadContent()); } catch (e) { setErr(String(e.message || e)); }
  }, []);
  useEffect(() => {
    const k = (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k"){ e.preventDefault(); setSearch(s => !s); } else if (e.key === "/" && !/input|textarea/i.test(document.activeElement.tagName)){ e.preventDefault(); setSearch(true); } };
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  }, []);
  useEffect(() => { if (data && route.page !== "home"){ const t = { playbook: "Playbook", blocks: "Building blocks", studies: "Case studies", drills: "Daily drills" }[route.page]; document.title = (t || "System Design Atlas"); } }, [route, data]);
  if (err) return html`<div className="loading">Couldn't load content: ${err}</div>`;
  if (!data) return html`<div className="loading">Loading the atlas…</div>`;

  let body;
  const crumb = (label, href) => html`<a href=${href}>${label}</a><span>/</span>`;
  switch (route.page){
    case "playbook": body = html`<${Article} key="pb" crumbs=${html`${crumb("Home", "#home")}<span>Playbook</span>`} eyebrow="Start to end" title=${data.playbook.title} lede=${data.playbook.summary} sections=${data.playbook.sections} doneKey="playbook" done=${done} toggleDone=${toggleDone}/>`; break;
    case "blocks": body = html`<${BlocksIndex} data=${data} done=${done}/>`; break;
    case "block": {
      const list = data.blocks.topics; const i = list.findIndex(t => t.id === route.id); const t = list[i];
      if (!t){ body = html`<${NotFound} what="That building block"/>`; break; }
      const nx = list[i + 1];
      body = html`<${Article} key=${"b" + t.id} crumbs=${html`${crumb("Building blocks", "#blocks")}<span>${t.category}</span>`} eyebrow=${t.category} title=${t.title} lede=${t.summary} sections=${t.sections} deep=${data.deep["block-" + t.id]} doneKey=${"block-" + t.id} done=${done} toggleDone=${toggleDone} footer=${nx && html`<a className="btn" href=${"#block-" + nx.id} style=${{ textDecoration: "none" }}>Next: ${nx.title} <${Icon} n="arrow" s=${16}/></a>`}/>`;
      break;
    }
    case "studies": body = html`<${StudiesIndex} data=${data} done=${done}/>`; break;
    case "study": {
      const st = data.studies[route.id]; const r = data.roadmap.find(x => x.id === route.id);
      if (!st){ body = html`<${NotFound} what=${r ? r.title : "That case study"}/>`; break; }
      const rel = (st.related || []).map(id => data.blocks.topics.find(t => t.id === id)).filter(Boolean);
      const meta = html`<div style=${{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 14 }}>${(st.tags || (r && r.focus) || []).map(f => html`<span key=${f} className="tag">${f}</span>`)}${st.difficulty && html`<span className="tag">${st.difficulty}</span>`}</div>
        ${st.doc && html`<p style=${{ margin: "14px 0 0" }}><a className="btn" href=${st.doc} target="_blank" rel="noopener" style=${{ textDecoration: "none" }}><${Icon} n="book" s=${16}/>Open the deep-notes doc</a></p>`}
        ${rel.length > 0 && html`<p className="small muted" style=${{ margin: "10px 0 0" }}>Builds on: ${rel.map((t, i) => html`<${Fragment} key=${t.id}>${i ? ", " : ""}<a href=${"#block-" + t.id}>${t.title}</a><//>`)}</p>`}`;
      body = html`<${Article} key=${"s" + st.id} crumbs=${html`${crumb("Case studies", "#studies")}<span>#${st.num || (r && r.num)}</span>`} eyebrow=${"Case study " + (st.num || (r && r.num)) + " of " + data.roadmap.length} title=${st.title} lede=${st.summary} meta=${meta} sections=${st.sections} deep=${data.deep["study-" + st.id]} doneKey=${"study-" + st.id} done=${done} toggleDone=${toggleDone} footer=${(() => { const k = data.roadmap.findIndex(x => x.id === st.id); const nx = data.roadmap[k + 1]; return nx && html`<a className="btn" href=${"#study-" + nx.id} style=${{ textDecoration: "none" }}>Next: ${nx.title} <${Icon} n="arrow" s=${16}/></a>`; })()}/>`;
      break;
    }
    case "drills": body = html`<${DrillsIndex} data=${data}/>`; break;
    case "drill": {
      const d = data.drills.find(x => x.id === route.id);
      if (!d){ body = html`<${NotFound} what="That deep dive"/>`; break; }
      const q = data.quizzes.find(x => x.date === d.date && x.id !== "warmup");
      body = html`<${Article} key=${"d" + d.id} crumbs=${html`${crumb("Daily drills", "#drills")}<span>${fmtDate(d.date)}</span>`} eyebrow=${"3 PM deep dive · " + d.topic} title=${d.title} lede=${d.summary} sections=${d.sections} doneKey=${"drill-" + d.id} done=${done} toggleDone=${toggleDone} footer=${q && html`<a className="btn" href=${"#quiz-" + q.id} style=${{ textDecoration: "none" }}>Tonight's quiz <${Icon} n="arrow" s=${16}/></a>`}/>`;
      break;
    }
    case "quiz": {
      const q = data.quizzes.find(x => x.id === route.id);
      body = q ? html`<${Quiz} key=${q.id} quiz=${q}/>` : html`<${NotFound} what="That quiz"/>`; break;
    }
    default: body = html`<${Home} data=${data} done=${done}/>`;
  }
  return html`<${Fragment}>
    <${Rail} data=${data} route=${route} done=${done} openSearch=${() => setSearch(true)}/>
    <main className="main">
      <div className="topbar"><a className="brand" href="#home"><${Mark}/><span className="brand-name">System Design Atlas</span></a><a className="back-link" href="/" style=${{ margin: "0 0 0 auto" }}>Tracker</a><button className="icon-btn" aria-label="Search" style=${{ marginLeft: 8 }} onClick=${() => setSearch(true)}><${Icon} n="search" s=${18}/></button></div>
      <div className="wrap" key=${route.page + (route.id || "")}>${body}</div>
    </main>
    <${Dock} route=${route}/>
    ${search && html`<${Palette} data=${data} onClose=${() => setSearch(false)}/>`}
  <//>`;
}


const CSS = "@import url('https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..800&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap');\n/* Layout: control-room atlas — fixed left rail (desktop) / bottom dock (phone), one reading column, schematic diagrams as the hero material */\n.atlas{\n  --bg:#F2F4F6; --surface:#FFFFFF; --surface-2:#E8ECF0; --ink:#121A24; --muted:#556172; --line:#D3DAE2;\n  --accent:#D9530A; --accent-soft:rgba(217,83,10,.10); --cobalt:#2B57C9; --cobalt-soft:rgba(43,87,201,.10);\n  --good:#0F7A55; --good-soft:rgba(15,122,85,.12); --bad:#C2341B; --bad-soft:rgba(194,52,27,.10);\n  --k-client:#5B6B80; --k-edge:#2B57C9; --k-service:#0F7A55; --k-cache:#C2410C; --k-db:#6D3FD1; --k-queue:#A16207; --k-store:#0E7490; --k-ext:#6B7280;\n  --shadow:0 1px 2px rgba(18,26,36,.06),0 8px 24px -12px rgba(18,26,36,.18);\n  --f-display:\"Archivo\",\"Arial Narrow\",system-ui,sans-serif; --f-body:\"IBM Plex Sans\",system-ui,-apple-system,\"Segoe UI\",sans-serif; --f-mono:\"IBM Plex Mono\",ui-monospace,Menlo,Consolas,monospace;\n  --rail:264px; --dock:64px;\n}\n@media (prefers-color-scheme: dark){.atlas:not([data-theme=\"light\"]){\n  --bg:#0C1219; --surface:#131B25; --surface-2:#1A2431; --ink:#E4E9EF; --muted:#94A2B4; --line:#253142;\n  --accent:#FF7A33; --accent-soft:rgba(255,122,51,.14); --cobalt:#7FA3FF; --cobalt-soft:rgba(127,163,255,.13);\n  --good:#3CC48F; --good-soft:rgba(60,196,143,.14); --bad:#FF6B52; --bad-soft:rgba(255,107,82,.13);\n  --k-client:#94A2B4; --k-edge:#7FA3FF; --k-service:#3CC48F; --k-cache:#FF8A4C; --k-db:#A98BFF; --k-queue:#E5B13A; --k-store:#4CC3D9; --k-ext:#9CA3AF;\n  --shadow:0 1px 2px rgba(0,0,0,.3),0 10px 30px -14px rgba(0,0,0,.6); color-scheme:dark}}\n.atlas[data-theme=\"dark\"]{\n  --bg:#0C1219; --surface:#131B25; --surface-2:#1A2431; --ink:#E4E9EF; --muted:#94A2B4; --line:#253142;\n  --accent:#FF7A33; --accent-soft:rgba(255,122,51,.14); --cobalt:#7FA3FF; --cobalt-soft:rgba(127,163,255,.13);\n  --good:#3CC48F; --good-soft:rgba(60,196,143,.14); --bad:#FF6B52; --bad-soft:rgba(255,107,82,.13);\n  --k-client:#94A2B4; --k-edge:#7FA3FF; --k-service:#3CC48F; --k-cache:#FF8A4C; --k-db:#A98BFF; --k-queue:#E5B13A; --k-store:#4CC3D9; --k-ext:#9CA3AF;\n  --shadow:0 1px 2px rgba(0,0,0,.3),0 10px 30px -14px rgba(0,0,0,.6); color-scheme:dark}\n.atlas, .atlas *{box-sizing:border-box}\nbody{margin:0;background:var(--atlas-page,#F2F4F6)}\n.atlas{background:var(--bg);color:var(--ink);min-height:100vh}\n.atlas{font-family:var(--f-body);font-size:16px;line-height:1.6;-webkit-font-smoothing:antialiased}\n.atlas::before{content:\"\";position:fixed;inset:0 0 auto;height:env(safe-area-inset-top,0px);z-index:40;background:var(--bg)}\n.atlas a{color:inherit}\n.atlas button{font:inherit;color:inherit}\n.atlas :focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:6px}\n.atlas code,.atlas kbd{font-family:var(--f-mono);font-size:.88em}\np code,li code,td code{background:var(--surface-2);padding:.08em .35em;border-radius:4px}\n.atlas h1,.atlas h2,.atlas h3{font-family:var(--f-display);text-wrap:balance;margin:0;letter-spacing:-.01em}\n.atlas .eyebrow{font-family:var(--f-mono);font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}\n\n/* shell */\n.rail{position:fixed;top:0;bottom:0;left:0;width:var(--rail);background:var(--surface);border-right:1px solid var(--line);display:flex;flex-direction:column;z-index:30;padding-top:env(safe-area-inset-top,0px);padding-left:env(safe-area-inset-left,0px)}\n.brand{display:flex;align-items:center;gap:10px;padding:20px 20px 14px;text-decoration:none}\n.brand-mark{width:30px;height:30px;flex:none}\n.brand-name{font-family:var(--f-display);font-weight:800;font-stretch:115%;font-size:17px;line-height:1.05;letter-spacing:-.01em}\n.brand-name small{display:block;font-family:var(--f-mono);font-weight:400;font-stretch:100%;font-size:11px;color:var(--muted);letter-spacing:.06em;text-transform:uppercase;margin-top:3px}\n.search-btn{margin:4px 16px 12px;display:flex;align-items:center;gap:8px;padding:9px 12px;border:1px solid var(--line);background:var(--bg);border-radius:10px;cursor:pointer;color:var(--muted);font-size:14px;text-align:left;transition:border-color .2s}\n.search-btn:hover{border-color:var(--accent)}\n.search-btn kbd{margin-left:auto;font-size:11px;border:1px solid var(--line);border-radius:5px;padding:1px 5px}\n.nav{overflow-y:auto;padding:4px 10px 20px;flex:1}\n.nav-group{margin-top:14px}\n.nav-group .eyebrow{padding:0 10px 6px;display:block;font-size:11px}\n.nav a{display:flex;align-items:center;gap:10px;padding:7px 10px;border-radius:8px;text-decoration:none;font-size:14px;color:var(--muted);position:relative;transition:background .15s,color .15s}\n.nav a:hover{background:var(--surface-2);color:var(--ink)}\n.nav a.on{color:var(--ink);background:var(--accent-soft);font-weight:600}\n.nav a.on::before{content:\"\";position:absolute;left:-10px;top:8px;bottom:8px;width:3px;border-radius:3px;background:var(--accent)}\n.nav .num{font-family:var(--f-mono);font-size:11px;color:var(--muted);width:20px}\n.nav .lock{margin-left:auto;opacity:.55}\n.nav .tick{margin-left:auto;color:var(--good)}\n.main{margin-left:var(--rail);min-height:100vh;padding-bottom:48px}\n.topbar{display:none}\n.dock{display:none}\n.wrap{max-width:1120px;margin:0 auto;padding-left:max(28px,env(safe-area-inset-left,0px));padding-right:max(28px,env(safe-area-inset-right,0px));padding-block:32px}\n@media (max-width:900px){\n  .rail{display:none}\n  .main{margin-left:0;padding-bottom:calc(var(--dock) + 24px + env(safe-area-inset-bottom,0px))}\n  .topbar{display:flex;position:sticky;top:env(safe-area-inset-top,0px);z-index:25;align-items:center;gap:10px;background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid var(--line);padding-block:10px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}\n  .topbar .brand{padding:0}\n  .topbar .icon-btn{margin-left:auto}\n  .dock{display:flex;position:fixed;left:0;right:0;bottom:0;z-index:30;background:var(--surface);border-top:1px solid var(--line);padding-bottom:env(safe-area-inset-bottom,0px);padding-left:env(safe-area-inset-left,0px);padding-right:env(safe-area-inset-right,0px)}\n  .dock a{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;padding:9px 0 8px;text-decoration:none;font-size:11px;color:var(--muted);position:relative}\n  .dock a.on{color:var(--accent)}\n  .dock a.on::after{content:\"\";position:absolute;top:0;left:30%;right:30%;height:2px;background:var(--accent);border-radius:0 0 2px 2px;animation:grow .3s ease-out}\n  .wrap{padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));padding-block:20px}\n}\n.icon-btn{border:1px solid var(--line);background:var(--surface);border-radius:10px;width:40px;height:40px;display:grid;place-items:center;cursor:pointer}\n\n/* page enter animation */\n.page{animation:enter .42s cubic-bezier(.2,.7,.2,1) both}\n.stagger>*{animation:enter .5s cubic-bezier(.2,.7,.2,1) both;animation-delay:calc(min(var(--i,0),8) * 55ms)}\n@keyframes enter{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}\n@keyframes grow{from{transform:scaleX(0)}to{transform:scaleX(1)}}\n@keyframes flowdash{to{background-position:0 16px}}\n@keyframes pop{0%{transform:scale(.96)}60%{transform:scale(1.02)}100%{transform:scale(1)}}\n@keyframes shake{0%,100%{transform:none}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(3px)}}\n@keyframes pulse{0%{box-shadow:0 0 0 0 var(--accent-soft)}100%{box-shadow:0 0 0 12px transparent}}\n\n/* home */\n.hero{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,1fr);gap:28px;align-items:center;margin-bottom:28px}\n.hero h1{font-size:clamp(34px,5.6vw,60px);line-height:.98;font-weight:800;font-stretch:118%}\n.hero h1 em{font-style:normal;color:var(--accent)}\n.hero p{color:var(--muted);max-width:52ch;margin:14px 0 0}\n.hero-art{background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:10px;box-shadow:var(--shadow);min-width:0}\n.hero-art svg{width:100%;height:auto;display:block}\n@media (max-width:900px){.hero{grid-template-columns:1fr}}\n.grid{display:grid;gap:16px}\n.g3{grid-template-columns:repeat(3,minmax(0,1fr))}\n.g2{grid-template-columns:repeat(2,minmax(0,1fr))}\n@media (max-width:760px){.g3,.g2{grid-template-columns:1fr}}\n.panel{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:18px;min-width:0}\n.panel h3{font-size:18px;font-weight:700;font-stretch:108%}\n.countdown{font-family:var(--f-mono);font-variant-numeric:tabular-nums;font-size:clamp(26px,4vw,34px);font-weight:500;letter-spacing:-.02em;margin:6px 0 2px}\n.muted{color:var(--muted)}\n.small{font-size:14px}\n.stat-row{display:flex;gap:20px;flex-wrap:wrap;margin-top:6px}\n.stat b{display:block;font-family:var(--f-display);font-stretch:112%;font-size:28px;font-weight:700;font-variant-numeric:tabular-nums;line-height:1.1}\n.stat span{font-size:12px;color:var(--muted)}\n.meter{height:6px;background:var(--surface-2);border-radius:6px;overflow:hidden;margin-top:12px}\n.meter i{display:block;height:100%;background:var(--accent);border-radius:6px;transform-origin:left;animation:grow .9s cubic-bezier(.2,.7,.2,1) both}\n.sched{list-style:none;margin:10px 0 0;padding:0;display:grid;gap:8px}\n.sched li{display:grid;grid-template-columns:70px minmax(0,1fr) auto;gap:10px;align-items:center;padding:10px 12px;border-radius:10px;background:var(--bg);border:1px solid var(--line)}\n.sched .t{font-family:var(--f-mono);font-size:13px;font-variant-numeric:tabular-nums}\n.pill{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:600;padding:3px 9px;border-radius:999px;white-space:nowrap}\n.pill.live{background:var(--good-soft);color:var(--good)}\n.pill.wait{background:var(--surface-2);color:var(--muted)}\n.pill.next{background:var(--accent-soft);color:var(--accent)}\n.pill.done{background:var(--good-soft);color:var(--good)}\n.sec-head{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin:34px 0 14px;flex-wrap:wrap}\n.sec-head h2{font-size:24px;font-weight:750;font-stretch:112%}\n.sec-head a{font-size:14px;color:var(--accent);text-decoration:none;font-weight:600}\n\n/* roadmap */\n.road{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px}\n@media (max-width:1100px){.road{grid-template-columns:repeat(3,minmax(0,1fr))}}\n@media (max-width:620px){.road{grid-template-columns:repeat(2,minmax(0,1fr))}}\n.stop{position:relative;display:flex;flex-direction:column;gap:6px;padding:14px;border-radius:12px;border:1px solid var(--line);background:var(--surface);text-decoration:none;min-height:126px;transition:transform .2s,border-color .2s,box-shadow .2s;min-width:0}\na.stop:hover{transform:translateY(-3px);border-color:var(--accent);box-shadow:var(--shadow)}\n.stop .n{font-family:var(--f-mono);font-size:12px;color:var(--muted)}\n.stop b{font-family:var(--f-display);font-stretch:108%;font-size:16px;line-height:1.2}\n.stop .d{font-size:12px;color:var(--muted);margin-top:auto}\n.stop.locked{background:transparent;border-style:dashed}\n.stop.locked b{color:var(--muted)}\n.stop.next{border-color:var(--accent);animation:pulse 2.2s ease-out infinite}\n.stop .st{position:absolute;top:12px;right:12px}\n.tags{display:flex;flex-wrap:wrap;gap:5px}\n.tag{font-size:11px;font-family:var(--f-mono);padding:2px 7px;border-radius:5px;background:var(--surface-2);color:var(--muted)}\n\n/* cards list */\n.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px}\n.card{display:flex;flex-direction:column;gap:6px;padding:16px;border-radius:12px;border:1px solid var(--line);background:var(--surface);text-decoration:none;transition:transform .2s,border-color .2s,box-shadow .2s;min-width:0}\n.card:hover{transform:translateY(-3px);border-color:var(--accent);box-shadow:var(--shadow)}\n.card b{font-family:var(--f-display);font-stretch:106%;font-size:17px;line-height:1.25}\n.card p{margin:0;font-size:14px;color:var(--muted);line-height:1.5}\n.card .row{display:flex;justify-content:space-between;align-items:center;gap:8px}\n.cat-h{font-family:var(--f-mono);font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin:26px 0 10px;display:flex;align-items:center;gap:10px}\n.cat-h::after{content:\"\";flex:1;height:1px;background:var(--line)}\n\n/* article */\n.art{display:grid;grid-template-columns:minmax(0,1fr) 210px;gap:40px}\n@media (max-width:1100px){.art{grid-template-columns:minmax(0,1fr)}.toc{display:none}}\n.art-head{margin-bottom:8px}\n.art-head h1{font-size:clamp(30px,4.6vw,46px);line-height:1.02;font-weight:800;font-stretch:116%;margin:8px 0 12px}\n.art-head p.lede{font-size:18px;color:var(--muted);max-width:62ch;margin:0}\n.crumbs{display:flex;gap:6px;align-items:center;font-size:13px;color:var(--muted);flex-wrap:wrap}\n.crumbs a{text-decoration:none}.crumbs a:hover{color:var(--accent)}\n.chipbar{display:none}\n@media (max-width:1100px){.chipbar{display:flex;gap:6px;overflow-x:auto;position:sticky;top:calc(env(safe-area-inset-top,0px) + 61px);z-index:20;background:var(--bg);padding:10px 0;margin:14px 0 0;scrollbar-width:none;border-bottom:1px solid var(--line)}\n  .chipbar::-webkit-scrollbar{display:none}\n  .chipbar a{flex:none;font-size:13px;padding:5px 11px;border-radius:999px;border:1px solid var(--line);text-decoration:none;color:var(--muted);background:var(--surface)}\n  .chipbar a.on{border-color:var(--accent);color:var(--accent)}}\n@media (min-width:901px) and (max-width:1100px){.chipbar{top:env(safe-area-inset-top,0px)}}\n.toc{position:sticky;top:calc(env(safe-area-inset-top,0px) + 28px);align-self:start;font-size:13px}\n.toc a{display:block;padding:5px 0 5px 12px;border-left:2px solid var(--line);text-decoration:none;color:var(--muted);transition:color .2s,border-color .2s}\n.toc a.on{color:var(--ink);border-color:var(--accent);font-weight:600}\n.toc .done-btn{margin-top:16px;width:100%}\n.sect{padding-top:30px;scroll-margin-top:calc(env(safe-area-inset-top,0px) + 120px)}\n.sect>h2{font-size:24px;font-weight:750;font-stretch:110%;margin-bottom:12px;display:flex;align-items:baseline;gap:10px}\n.sect>h2 .idx{font-family:var(--f-mono);font-size:13px;color:var(--accent);font-weight:500}\n.blk{margin:14px 0;max-width:72ch}\n.blk.wide{max-width:none}\n.blk p{margin:0}\nul.blk,ol.blk{padding-left:1.2em}\nul.blk li,ol.blk li{margin:6px 0}\nul.blk li::marker{color:var(--accent)}\n.tbl{overflow-x:auto;border:1px solid var(--line);border-radius:12px;background:var(--surface)}\n.tbl table{border-collapse:collapse;width:100%;font-size:14px;min-width:480px}\n.tbl th{text-align:left;font-family:var(--f-mono);font-weight:500;font-size:11.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);background:var(--surface-2);padding:10px 12px}\n.tbl td{padding:10px 12px;border-top:1px solid var(--line);vertical-align:top;line-height:1.5}\n.tbl tr:hover td{background:var(--accent-soft)}\n.tbl td:first-child{font-weight:600}\npre.code{background:var(--surface-2);border:1px solid var(--line);border-radius:12px;padding:14px 16px;overflow-x:auto;font-family:var(--f-mono);font-size:13px;line-height:1.6;margin:0;position:relative}\n.code-wrap{position:relative}\n.code-wrap .lang{position:absolute;top:8px;right:10px;font-family:var(--f-mono);font-size:11px;color:var(--muted)}\n.callout{border-radius:12px;padding:14px 16px;border:1px solid var(--line);background:var(--surface);display:grid;gap:4px}\n.callout .ct{font-family:var(--f-mono);font-size:11.5px;letter-spacing:.07em;text-transform:uppercase;font-weight:500}\n.callout.say{background:var(--cobalt-soft);border-color:transparent}.callout.say .ct{color:var(--cobalt)}\n.callout.tip{background:var(--good-soft);border-color:transparent}.callout.tip .ct{color:var(--good)}\n.callout.warn{background:var(--bad-soft);border-color:transparent}.callout.warn .ct{color:var(--bad)}\n.callout.key{background:var(--accent-soft);border-color:transparent}.callout.key .ct{color:var(--accent)}\n.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}\n.stats div{padding:14px;border-radius:12px;background:var(--surface);border:1px solid var(--line)}\n.stats b{display:block;font-family:var(--f-display);font-stretch:112%;font-size:26px;font-variant-numeric:tabular-nums;line-height:1.1}\n.stats span{font-size:12.5px;color:var(--muted)}\n.cmp{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}\n.cmp>div{padding:16px;border-radius:12px;border:1px solid var(--line);background:var(--surface)}\n.cmp h4{margin:0 0 8px;font-family:var(--f-display);font-size:16px;font-stretch:106%}\n.cmp ul{list-style:none;padding:0;margin:0;display:grid;gap:6px;font-size:14px}\n.cmp li{display:flex;gap:8px}\n.cmp .pro::before{content:\"+\";color:var(--good);font-weight:700;font-family:var(--f-mono)}\n.cmp .con::before{content:\"−\";color:var(--bad);font-weight:700;font-family:var(--f-mono)}\n.steps{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;counter-reset:s}\n.steps>div{padding:14px;border-radius:12px;border:1px solid var(--line);background:var(--surface);position:relative}\n.steps>div::before{counter-increment:s;content:counter(s,decimal-leading-zero);font-family:var(--f-mono);font-size:12px;color:var(--accent)}\n.steps b{display:block;margin:4px 0 2px;font-size:15px}\n.steps span{font-size:14px;color:var(--muted)}\n.tl{list-style:none;margin:0;padding:0;position:relative}\n.tl::before{content:\"\";position:absolute;left:43px;top:10px;bottom:10px;width:2px;background:var(--line)}\n.tl li{display:grid;grid-template-columns:88px minmax(0,1fr);gap:14px;padding:8px 0;position:relative}\n.tl .m{font-family:var(--f-mono);font-size:12px;font-variant-numeric:tabular-nums;background:var(--surface);border:1px solid var(--line);border-radius:999px;text-align:center;padding:4px 0;height:fit-content;position:relative;z-index:1;transition:background .2s,color .2s}\n.tl li:hover .m{background:var(--accent);color:#fff;border-color:var(--accent)}\n.tl b{display:block;font-size:15px}\n.tl span{font-size:14px;color:var(--muted)}\ndetails.qa{border:1px solid var(--line);border-radius:12px;background:var(--surface);margin:8px 0;overflow:hidden}\ndetails.qa summary{cursor:pointer;padding:12px 14px;font-weight:600;list-style:none;display:flex;gap:10px}\ndetails.qa summary::before{content:\"+\";font-family:var(--f-mono);color:var(--accent);transition:transform .2s}\ndetails.qa[open] summary::before{transform:rotate(45deg)}\ndetails.qa>div{padding:0 14px 14px 34px;color:var(--muted)}\n\n/* flow diagram */\n.flow{border:1px solid var(--line);border-radius:14px;background:\n  radial-gradient(circle,var(--line) 1px,transparent 1.2px) 0 0/18px 18px,var(--surface);padding:18px 12px 12px;overflow-x:auto}\n.flow-row{display:flex;justify-content:center;gap:10px;flex-wrap:wrap}\n.node{display:flex;flex-direction:column;align-items:flex-start;min-width:120px;max-width:220px;padding:8px 12px 8px 14px;border-radius:10px;background:var(--surface);border:1px solid var(--line);box-shadow:var(--shadow);position:relative;font-size:14px;font-weight:600;line-height:1.25;animation:enter .45s cubic-bezier(.2,.7,.2,1) both;animation-delay:calc(var(--r,0) * 90ms)}\n.node::before{content:\"\";position:absolute;left:0;top:8px;bottom:8px;width:3px;border-radius:0 3px 3px 0;background:var(--kc,var(--k-service))}\n.node small{font-weight:400;font-size:12px;color:var(--muted);margin-top:2px}\n.node .kind{font-family:var(--f-mono);font-weight:500;font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--kc);margin-bottom:2px}\n.link{height:28px;width:2px;margin:3px auto;background:repeating-linear-gradient(to bottom,var(--muted) 0 5px,transparent 5px 8px);animation:flowdash .8s linear infinite;position:relative;opacity:.7}\n.link::after{content:\"\";position:absolute;bottom:-4px;left:-4px;border:5px solid transparent;border-top-color:var(--muted);border-bottom:0}\n.flow-cap{text-align:center;font-size:12.5px;color:var(--muted);margin-top:10px;font-family:var(--f-mono)}\n.legend{display:flex;flex-wrap:wrap;gap:4px 12px;justify-content:center;margin-top:8px;font-size:11px;color:var(--muted)}\n.legend span{display:inline-flex;align-items:center;gap:5px}.legend i{width:8px;height:8px;border-radius:2px;background:var(--kc)}\n\n/* ring */\n.ring{display:grid;grid-template-columns:minmax(0,280px) minmax(0,1fr);gap:18px;align-items:center;padding:16px;border:1px solid var(--line);border-radius:14px;background:var(--surface)}\n@media (max-width:620px){.ring{grid-template-columns:1fr;justify-items:center}}\n.ring svg{width:100%;max-width:280px;height:auto}\n.ring circle.key{transition:fill .5s,r .3s}\n.btn{display:inline-flex;align-items:center;gap:8px;padding:9px 14px;border-radius:10px;border:1px solid var(--line);background:var(--surface);cursor:pointer;font-size:14px;font-weight:600;transition:transform .15s,border-color .15s,background .15s}\n.btn:hover{border-color:var(--accent)}\n.btn:active{transform:scale(.97)}\n.btn.primary{background:var(--accent);border-color:var(--accent);color:#fff}\n.btn.primary:hover{filter:brightness(1.07)}\n.btn.ok{background:var(--good-soft);color:var(--good);border-color:transparent}\n\n/* quiz */\n.quiz{max-width:720px}\n.qbar{height:6px;background:var(--surface-2);border-radius:6px;overflow:hidden;margin:16px 0 22px}\n.qbar i{display:block;height:100%;background:var(--accent);transition:width .45s cubic-bezier(.2,.7,.2,1)}\n.qq{font-family:var(--f-display);font-stretch:104%;font-size:clamp(20px,3vw,25px);font-weight:650;line-height:1.3;margin-bottom:18px}\n.opts{display:grid;gap:10px}\n.opt{display:flex;gap:12px;align-items:flex-start;text-align:left;padding:14px 16px;border-radius:12px;border:1px solid var(--line);background:var(--surface);cursor:pointer;font-size:15px;line-height:1.45;transition:border-color .15s,background .15s,transform .15s}\n.opt:hover:not([disabled]){border-color:var(--accent);transform:translateX(3px)}\n.opt .l{font-family:var(--f-mono);font-size:12px;width:22px;height:22px;flex:none;display:grid;place-items:center;border-radius:6px;background:var(--surface-2);margin-top:1px}\n.opt.right{border-color:var(--good);background:var(--good-soft);animation:pop .35s ease-out}\n.opt.right .l{background:var(--good);color:#fff}\n.opt.wrong{border-color:var(--bad);background:var(--bad-soft);animation:shake .4s ease-out}\n.opt.wrong .l{background:var(--bad);color:#fff}\n.opt[disabled]{cursor:default}\n.why{margin-top:16px;animation:enter .35s ease-out both}\n.score-ring{width:140px;height:140px}\n.score-ring circle{transition:stroke-dashoffset 1.1s cubic-bezier(.2,.7,.2,1)}\n\n/* palette */\n.scrim{position:fixed;inset:0;background:rgba(8,12,18,.45);backdrop-filter:blur(3px);z-index:60;display:flex;justify-content:center;align-items:flex-start;padding:calc(env(safe-area-inset-top,0px) + 10vh) max(16px,env(safe-area-inset-right,0px)) 16px max(16px,env(safe-area-inset-left,0px));animation:fadein .15s ease-out}\n@keyframes fadein{from{opacity:0}}\n.pal{width:100%;max-width:620px;background:var(--surface);border:1px solid var(--line);border-radius:16px;box-shadow:0 30px 80px -20px rgba(0,0,0,.45);overflow:hidden;animation:enter .22s cubic-bezier(.2,.7,.2,1)}\n.pal input{width:100%;border:0;border-bottom:1px solid var(--line);padding:16px 18px;font-size:17px;background:transparent;color:var(--ink);outline:none;font-family:var(--f-body)}\n.pal ul{list-style:none;margin:0;padding:6px;max-height:min(56vh,440px);overflow-y:auto}\n.pal li a{display:flex;gap:10px;align-items:center;padding:10px 12px;border-radius:10px;text-decoration:none}\n.pal li a.on{background:var(--accent-soft)}\n.pal li .k{font-family:var(--f-mono);font-size:10.5px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);width:64px;flex:none}\n.pal li .s{font-size:12.5px;color:var(--muted);margin-left:auto;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:40%}\n.empty{padding:28px;text-align:center;color:var(--muted)}\n.loading{display:grid;place-items:center;min-height:60vh;color:var(--muted);font-family:var(--f-mono);font-size:13px}\n.hero-net .pk{offset-rotate:0deg}\n@media (prefers-reduced-motion: reduce){\n  *,*::before,*::after{animation:none!important;transition:none!important}\n  .pk{display:none}\n}\n\n.back-link{display:block;margin:0 16px 4px;padding:6px 10px;font-size:13px;color:var(--muted);text-decoration:none;border-radius:8px;font-family:var(--f-mono)}\n.back-link:hover{color:var(--accent);background:var(--surface-2)}\n.topbar .back-link{margin:0;padding:6px 8px}\n.atabs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:22px 0 4px;max-width:560px}\n.atabs button{display:grid;grid-template-columns:auto 1fr;column-gap:10px;align-items:center;text-align:left;padding:12px 14px;border-radius:12px;border:1px solid var(--line);background:var(--surface);cursor:pointer;font-weight:600;font-size:15px;color:var(--muted);transition:border-color .2s,background .2s,color .2s}\n.atabs button svg{grid-row:span 2}\n.atabs button small{font-family:var(--f-mono);font-weight:400;font-size:11px;letter-spacing:.04em;color:var(--muted)}\n.atabs button:hover{border-color:var(--accent)}\n.atabs button.on{border-color:var(--accent);background:var(--accent-soft);color:var(--ink)}\n.atabs button.on svg{color:var(--accent)}\n.seq{border:1px solid var(--line);border-radius:14px;background:var(--surface);padding:8px 6px 10px}\n.seq-scroll{overflow-x:auto}.seq svg{width:100%;height:auto;display:block}\n.seq-step{animation:enter .45s cubic-bezier(.2,.7,.2,1) both;animation-delay:calc(var(--d,0) * 70ms)}\n.bits{border:1px solid var(--line);border-radius:14px;background:var(--surface);padding:14px}\n.bits-row{display:flex;gap:4px;overflow-x:auto}\n.bit{flex-basis:0;min-width:70px;padding:10px 10px 10px 12px;border-radius:10px;background:var(--bg);border:1px solid var(--line);position:relative;display:grid;gap:2px}\n.bit::before{content:\"\";position:absolute;left:0;top:8px;bottom:8px;width:3px;border-radius:0 3px 3px 0;background:var(--kc)}\n.bit b{font-size:13.5px}.bit span{font-family:var(--f-mono);font-size:12px;color:var(--kc)}.bit small{font-size:11.5px;color:var(--muted);line-height:1.35}\n";

export default function Atlas(){
  useEffect(() => { document.title = "System Design Atlas"; }, []);
  return html`<${Fragment}><style>${CSS}</style><div className="atlas"><${AtlasApp}/></div><//>`;
}
