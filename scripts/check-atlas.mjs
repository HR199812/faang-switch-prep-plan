// Validates System Design Atlas content (src/atlas/content): block types and shapes, flow node
// kinds, sequence-diagram actors, study ↔ block links, roadmap ↔ study files, deep-dive coverage.
// Usage: npm run check:atlas
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../src/atlas/content");
const read = (p) => JSON.parse(readFileSync(path.join(dir, p), "utf8"));
const KINDS = new Set(["client", "edge", "service", "cache", "db", "queue", "store", "ext"]);
const TONES = new Set(["say", "tip", "warn", "key"]);
let problems = 0;
const fail = (where, msg) => { problems++; console.log(`✗ ${where}: ${msg}`); };

function checkBlock(where, b) {
  const need = (k, test = (v) => v !== undefined) => { if (!test(b[k])) fail(where, `${b.t} block missing/invalid "${k}"`); };
  const isArr = Array.isArray;
  switch (b.t) {
    case "p": need("text", (v) => typeof v === "string"); break;
    case "list": need("items", isArr); break;
    case "table": need("head", isArr); need("rows", isArr);
      (b.rows || []).forEach((r, i) => { if (!isArr(r) || r.length !== b.head.length) fail(where, `table row ${i} has ${isArr(r) ? r.length : "?"} cells, header has ${b.head.length}`); }); break;
    case "flow": need("rows", isArr);
      (b.rows || []).flat().forEach((n) => { if (!n.label) fail(where, "flow node without label"); if (n.kind && !KINDS.has(n.kind)) fail(where, `flow node kind "${n.kind}"`); }); break;
    case "callout": need("text"); if (b.tone && !TONES.has(b.tone)) fail(where, `callout tone "${b.tone}"`); break;
    case "code": need("text", (v) => typeof v === "string"); break;
    case "stats": need("items", isArr); (b.items || []).forEach((s) => { if (!s.label || s.value === undefined) fail(where, "stats item needs label + value"); }); break;
    case "compare": need("cols", isArr); (b.cols || []).forEach((c) => { if (!c.title) fail(where, "compare col needs title"); }); break;
    case "steps": case "timeline": need("items", isArr); break;
    case "qa": need("items", isArr); (b.items || []).forEach((x) => { if (!x.q || !x.a) fail(where, "qa item needs q + a"); }); break;
    case "ring": break;
    case "seq": need("actors", isArr); need("steps", isArr);
      (b.steps || []).forEach((s, i) => { for (const k of ["from", "to"]) if (!b.actors.includes(s[k])) fail(where, `seq step ${i}: unknown actor "${s[k]}"`); }); break;
    case "bits": need("fields", isArr); (b.fields || []).forEach((f) => { if (!f.label || !(f.bits > 0)) fail(where, "bits field needs label + bits > 0"); }); break;
    default: fail(where, `unknown block type "${b.t}"`);
  }
}
function checkSections(where, sections) {
  if (!Array.isArray(sections) || !sections.length) return fail(where, "no sections");
  const ids = new Set();
  for (const s of sections) {
    if (!s.id || !s.title) fail(where, "section needs id + title");
    if (ids.has(s.id)) fail(where, `duplicate section id "${s.id}"`);
    ids.add(s.id);
    (s.blocks || []).forEach((b) => checkBlock(`${where} › ${s.id}`, b));
  }
}

const blocks = read("blocks.json").topics;
const blockIds = new Set();
for (const t of blocks) {
  if (blockIds.has(t.id)) fail("blocks.json", `duplicate block id ${t.id}`);
  blockIds.add(t.id);
  for (const k of ["id", "title", "category", "summary"]) if (!t[k]) fail(`block ${t.id}`, `missing ${k}`);
  checkSections(`block ${t.id}`, t.sections);
}

const studies = {};
for (const f of readdirSync(path.join(dir, "studies")).filter((f) => f.endsWith(".json"))) {
  const s = read(`studies/${f}`);
  studies[s.id] = s;
  checkSections(`study ${s.id}`, s.sections);
  (s.related || []).forEach((r) => { if (!blockIds.has(r)) fail(`study ${s.id}`, `related block "${r}" doesn't exist`); });
  if (!f.startsWith(String(s.num).padStart(2, "0") + "-")) fail(`study ${s.id}`, `file name ${f} doesn't match num ${s.num}`);
}
const roadmap = read("roadmap.json").studies;
const nums = new Set();
for (const r of roadmap) {
  if (!studies[r.id]) fail("roadmap.json", `no study file for "${r.id}"`);
  if (nums.has(r.num)) fail("roadmap.json", `duplicate num ${r.num}`);
  nums.add(r.num);
}
for (const id of Object.keys(studies)) if (!roadmap.find((r) => r.id === id)) fail("roadmap.json", `study "${id}" is missing from the roadmap`);

let deepCount = 0;
for (const f of readdirSync(path.join(dir, "deep")).filter((f) => f.endsWith(".json"))) {
  const name = f.replace(/\.json$/, "");
  const [, kind, id] = name.match(/^(block|study)-(.+)$/) || [];
  if (!kind) { fail(`deep/${f}`, "name must be block-<id>.json or study-<id>.json"); continue; }
  if (kind === "block" && !blockIds.has(id)) fail(`deep/${f}`, `no block "${id}"`);
  if (kind === "study" && !studies[id]) fail(`deep/${f}`, `no study "${id}"`);
  checkSections(`deep ${name}`, read(`deep/${f}`).sections);
  deepCount++;
}
const missingDeep = [...blockIds].filter((id) => !readdirSync(path.join(dir, "deep")).includes(`block-${id}.json`));
if (missingDeep.length) fail("deep", `building blocks without a deep dive: ${missingDeep.join(", ")}`);

console.log(problems
  ? `\n${problems} problem(s).`
  : `✓ Atlas content OK: ${blocks.length} building blocks, ${Object.keys(studies).length} case studies, ${deepCount} deep dives.`);
process.exit(problems ? 1 : 0);
