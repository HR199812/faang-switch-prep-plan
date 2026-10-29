// Answer comparison shared by the browser runner and scripts/check-problems.mjs.
// Modes:
//   exact            deep equality (numbers within 1e-9)
//   unordered        top-level array order doesn't matter
//   nested-unordered order doesn't matter at either level (e.g. subsets, 3Sum)
//   float            deep equality with 1e-5 tolerance

const key = (v) => JSON.stringify(v);
const sortBy = (arr) => [...arr].sort((a, b) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0));

function deepEqual(a, b, eps) {
  if (typeof a === "number" && typeof b === "number") return a === b || Math.abs(a - b) <= eps;
  if (a === null || b === null || typeof a !== "object" || typeof b !== "object") return a === b;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) return a.length === b.length && a.every((x, i) => deepEqual(x, b[i], eps));
  const ka = Object.keys(a), kb = Object.keys(b);
  return ka.length === kb.length && ka.every((k) => deepEqual(a[k], b[k], eps));
}

export function normalize(v, mode) {
  if (!Array.isArray(v)) return v;
  if (mode === "unordered") return sortBy(v);
  if (mode === "nested-unordered") return sortBy(v.map((x) => (Array.isArray(x) ? sortBy(x) : x)));
  return v;
}

export function isEqual(got, expected, mode = "exact") {
  if (got === undefined) return false;
  const eps = mode === "float" ? 1e-5 : 1e-9;
  return deepEqual(normalize(got, mode), normalize(expected, mode), eps);
}

export function fmt(v) {
  if (v === undefined) return "undefined";
  try { return JSON.stringify(v); } catch { return String(v); }
}
