// Validates practice content: every reference solution must pass all of its tests in both
// JavaScript (Node) and Python (python3), and every starter must at least compile.
// Usage: npm run check:problems [-- <problem-id> ...]
import { readdirSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import { runJsTests } from "../src/practice/runner/harness-js.js";
import { isEqual, fmt } from "../src/practice/runner/compare.js";
import { specFor } from "../src/practice/runner/runner.js";

const root = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(root, "../src/practice/problems");
const harnessPy = readFileSync(path.join(root, "../src/practice/runner/harness.py"), "utf8");
const only = process.argv.slice(2);

const problems = [];
for (const f of readdirSync(dir).filter((f) => f.endsWith(".js")).sort()) {
  const mod = await import(pathToFileURL(path.join(dir, f)).href);
  problems.push(...mod.default.map((p) => ({ ...p, file: f })));
}

const DRIVER = `
import json, sys
_job = json.loads(sys.stdin.read())
_out = []
for _c in _job:
    _s = json.loads(__setup(_c["code"], json.dumps(_c["spec"])))
    if "error" in _s:
        _out.append({"setup": _s})
        continue
    _out.append({"results": [json.loads(__run_one(json.dumps(t))) for t in _c["tests"]]})
print(json.dumps(_out))
`;

function runPy(cases) {
  const r = spawnSync("python3", ["-c", harnessPy + "\n" + DRIVER], { input: JSON.stringify(cases), encoding: "utf8", maxBuffer: 64 << 20 });
  if (r.status !== 0) throw new Error(r.stderr);
  return JSON.parse(r.stdout);
}

let failures = 0;
const ids = new Set();
const fail = (p, msg) => { failures++; console.log(`✗ ${p.id} (${p.file}): ${msg}`); };
const REQUIRED = ["id", "title", "difficulty", "track", "pattern", "weeks", "statement", "fn", "tests", "starter", "solution", "approach", "complexity", "pitfalls", "hints"];

const selected = problems.filter((p) => !only.length || only.includes(p.id));
const pyCases = [];
for (const p of selected) {
  if (ids.has(p.id)) fail(p, "duplicate id");
  ids.add(p.id);
  for (const k of REQUIRED) if (p[k] === undefined) fail(p, `missing field ${k}`);
  if (p.kind === "design" && !p.cls) fail(p, "design problem needs cls");

  // JS reference
  const jsRes = runJsTests(p.solution.js, specFor(p, "js"), p.tests);
  jsRes.forEach((r, i) => {
    if (r.error) fail(p, `JS solution test ${i}: ${r.error}`);
    else if (!isEqual(r.got, p.tests[i].expected, p.compare)) fail(p, `JS solution test ${i}: expected ${fmt(p.tests[i].expected)}, got ${fmt(r.got)}`);
  });
  const jsStarter = runJsTests(p.starter.js, specFor(p, "js"), p.tests.slice(0, 1));
  if (jsStarter[0]?.compile) fail(p, `JS starter doesn't compile: ${jsStarter[0].error}`);

  pyCases.push({ p, kind: "solution", code: p.solution.py, spec: specFor(p, "py"), tests: p.tests });
  pyCases.push({ p, kind: "starter", code: p.starter.py, spec: specFor(p, "py"), tests: p.tests.slice(0, 1) });
}

const pyOut = runPy(pyCases.map(({ code, spec, tests }) => ({ code, spec, tests })));
pyOut.forEach((o, k) => {
  const { p, kind, tests } = pyCases[k];
  if (o.setup) return fail(p, `Python ${kind} doesn't compile: ${o.setup.error} (line ${o.setup.line})`);
  if (kind === "starter") return;
  o.results.forEach((r, i) => {
    if (r.error) fail(p, `Python solution test ${i}: ${r.error} (line ${r.line})`);
    else if (!isEqual(r.got, tests[i].expected, p.compare)) fail(p, `Python solution test ${i}: expected ${fmt(tests[i].expected)}, got ${fmt(r.got)}`);
  });
});

// ── LeetCode lists (src/data/leetcode.js, src/data/lists.js) ──
const { LEETCODE, lcSlug } = await import("../src/data/leetcode.js");
const { NEETCODE_150, BLIND_75 } = await import("../src/data/lists.js");
const seen = new Map(); // number -> "title|difficulty" (every list must agree)
const lcFail = (msg) => { failures++; console.log(`✗ LeetCode lists: ${msg}`); };
const checkItems = (where, groups) => {
  const inList = new Set();
  for (const g of groups) for (const it of g.items) {
    const [n, title, d, flags = ""] = it;
    if (!Number.isInteger(n) || n < 1) lcFail(`${where}: bad number ${n}`);
    if (!"EMH".includes(d) || d.length !== 1) lcFail(`${where}: #${n} bad difficulty ${d}`);
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(lcSlug(it))) lcFail(`${where}: #${n} slug "${lcSlug(it)}"`);
    if (/[^BP]/.test(flags)) lcFail(`${where}: #${n} unknown flags ${flags}`);
    if (inList.has(n)) lcFail(`${where}: #${n} listed twice`);
    inList.add(n);
    const sig = `${title}|${d}`;
    if (seen.has(n) && seen.get(n) !== sig) lcFail(`#${n} disagrees between lists: "${seen.get(n)}" vs "${sig}" (${where})`);
    seen.set(n, sig);
  }
  return inList.size;
};
for (const [w, groups] of Object.entries(LEETCODE)) checkItems(`week ${w}`, groups);
const nc = checkItems("NeetCode 150", NEETCODE_150);
const bl = BLIND_75.reduce((s, g) => s + g.items.length, 0);
if (nc !== 150) lcFail(`NeetCode 150 has ${nc} problems`);
if (bl !== 75) lcFail(`Blind 75 has ${bl} problems`);
const titles = new Map();
for (const [n, sig] of seen) { const t = sig.split("|")[0]; if (titles.has(t)) lcFail(`"${t}" used for #${titles.get(t)} and #${n}`); titles.set(t, n); }
console.log(`LeetCode lists: ${seen.size} distinct problems, NeetCode 150 = ${nc}, Blind 75 = ${bl}.`);
const { DAILY } = await import("../src/data/daily.js");
let dailyNew = 0, dailyRepeat = 0;
const introduced = new Set();
for (const [w, plan] of Object.entries(DAILY)) {
  if (plan.days.length !== 7) lcFail(`daily week ${w}: needs 7 days, has ${plan.days.length}`);
  plan.days.forEach((d, i) => {
    if (!d) return;
    if (!d.topic) lcFail(`daily week ${w} day ${i + 1}: missing topic`);
    if (d.items.length < 1 || d.items.length > 2) lcFail(`daily week ${w} day ${i + 1}: ${d.items.length} problems (keep it to 1–2)`);
    checkItems(`daily week ${w} day ${i + 1}`, [{ items: d.items }]);
    for (const it of d.items) {
      if (d.repeat) { dailyRepeat++; if (!introduced.has(it[0])) lcFail(`daily week ${w} day ${i + 1}: re-solve of #${it[0]} before it was introduced`); }
      else { dailyNew++; if (introduced.has(it[0])) lcFail(`daily week ${w}: #${it[0]} introduced twice`); introduced.add(it[0]); }
    }
  });
}
console.log(`Daily track: ${dailyNew} new problems + ${dailyRepeat} re-solves across ${Object.keys(DAILY).length} weeks.`);

console.log(failures ? `\n${failures} problem(s) found across ${selected.length} problems.` : `✓ ${selected.length} problems: all reference solutions pass in JS and Python.`);
process.exit(failures ? 1 : 0);
