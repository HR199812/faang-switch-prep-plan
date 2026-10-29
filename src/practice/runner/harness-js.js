// Runs a user's JavaScript against a problem's tests. Pure: used inside the Web Worker
// (jsWorker.js) and by scripts/check-problems.mjs under Node.
//
// spec: { kind: "fn" | "design", fn, argTypes?: string[], returnType?: string }
//   argTypes / returnType: "list" (ListNode from array), "tree" (TreeNode from level-order
//   array with nulls), anything else is passed through as JSON.
// fn tests:     { args: [...], expected }
// design tests: { ops: ["LRUCache", "put", ...], args: [[2], [1, 1], ...], expected: [null, ...] }

export class ListNode { constructor(val = 0, next = null) { this.val = val; this.next = next; } }
export class TreeNode { constructor(val = 0, left = null, right = null) { this.val = val; this.left = left; this.right = right; } }

export function toList(arr) {
  const dummy = new ListNode();
  let cur = dummy;
  for (const v of arr || []) { cur.next = new ListNode(v); cur = cur.next; }
  return dummy.next;
}
export function fromList(node) {
  const out = [];
  let guard = 0;
  while (node) {
    if (++guard > 100000) throw new Error("Returned list has a cycle (or is longer than 100000 nodes)");
    out.push(node.val);
    node = node.next;
  }
  return out;
}
export function toTree(arr) {
  if (!arr || !arr.length || arr[0] === null) return null;
  const root = new TreeNode(arr[0]);
  const q = [root];
  let i = 1;
  for (let h = 0; h < q.length && i < arr.length; h++) {
    const node = q[h];
    if (i < arr.length && arr[i] !== null) { node.left = new TreeNode(arr[i]); q.push(node.left); }
    i++;
    if (i < arr.length && arr[i] !== null) { node.right = new TreeNode(arr[i]); q.push(node.right); }
    i++;
  }
  return root;
}
export function fromTree(root) {
  const out = [];
  const q = [root];
  for (let h = 0; h < q.length; h++) {
    const n = q[h];
    if (n) { out.push(n.val); q.push(n.left, n.right); } else out.push(null);
  }
  while (out.length && out[out.length - 1] === null) out.pop();
  return out;
}

const clone = (v) => (v === undefined ? v : JSON.parse(JSON.stringify(v)));
const convertIn = (v, t) => (t === "list" ? toList(v) : t === "tree" ? toTree(v) : clone(v));
function convertOut(v, t) {
  if (t === "list" || v instanceof ListNode) return fromList(v);
  if (t === "tree" || v instanceof TreeNode) return fromTree(v);
  if (v instanceof Set) return [...v];
  if (v instanceof Map) return Object.fromEntries(v);
  return v === undefined ? undefined : clone(v);
}

function show(x) {
  if (typeof x === "string") return x;
  try { return JSON.stringify(x); } catch { return String(x); }
}

// new Function() puts two header lines before the body.
const LINE_OFFSET = 2;
function errorInfo(e) {
  const stack = String((e && e.stack) || "");
  const m = stack.match(/(?:<anonymous>|Function|eval):(\d+):(\d+)/);
  const line = m ? Number(m[1]) - LINE_OFFSET : null;
  return { error: `${(e && e.name) || "Error"}: ${(e && e.message) || String(e)}`, line: line && line > 0 ? line : null };
}

// Compile once; returns { target } or { error, line }.
export function compileJs(code, spec, consoleObj) {
  const name = spec.kind === "design" ? spec.cls : spec.fn;
  try {
    const factory = new Function("ListNode", "TreeNode", "console",
      `${code}\n;return (typeof ${name} !== "undefined") ? ${name} : undefined;`);
    const target = factory(ListNode, TreeNode, consoleObj);
    if (typeof target !== "function") {
      return { error: `Define ${spec.kind === "design" ? "a class" : "a function"} named \`${name}\`.`, line: null };
    }
    return { target };
  } catch (e) {
    return errorInfo(e);
  }
}

export function runJsTests(code, spec, tests, onResult = () => {}) {
  const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());
  let logs = [];
  const push = (...a) => { if (logs.length < 50) logs.push(a.map(show).join(" ")); };
  const consoleObj = { log: push, info: push, warn: push, error: push, debug: push, table: push };

  const compiled = compileJs(code, spec, consoleObj);
  if (compiled.error) {
    const res = tests.map((_, i) => ({ i, ...compiled, compile: true, logs: [] }));
    res.forEach(onResult);
    return res;
  }
  const { target } = compiled;
  const results = [];
  tests.forEach((t, i) => {
    logs = [];
    const t0 = now();
    let r;
    try {
      let got;
      if (spec.kind === "design") {
        const obj = new target(...clone(t.args[0]));
        got = [null];
        for (let k = 1; k < t.ops.length; k++) {
          const fn = obj[t.ops[k]];
          if (typeof fn !== "function") throw new TypeError(`Method \`${t.ops[k]}\` is not defined on ${spec.cls}`);
          const v = fn.apply(obj, clone(t.args[k]));
          got.push(v === undefined ? null : convertOut(v));
        }
      } else {
        const types = spec.argTypes || [];
        const args = t.args.map((a, k) => convertIn(a, types[k]));
        got = convertOut(target(...args), spec.returnType);
      }
      r = { i, got, ms: now() - t0, logs };
    } catch (e) {
      r = { i, ...errorInfo(e), ms: now() - t0, logs };
    }
    results.push(r);
    onResult(r);
  });
  return results;
}
