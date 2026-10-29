// Helpers for authoring practice problems (src/practice/problems/*.js).
//
// Problem shape:
// {
//   id, title, difficulty: "Easy"|"Medium"|"Hard", track: "dsa"|"dp", pattern, weeks: [n],
//   link?, statement (light markdown: paragraphs, `code`, **bold**, - lists),
//   params: ["nums", "target"]           names, used for examples and generated starters
//   fn: { js: "twoSum", py: "two_sum" }  entry point per language
//   kind?: "fn" | "design"               design = class + ops (see harness-js.js); needs cls
//   argTypes?: [...], returnType?        "list" | "tree" convert to ListNode / TreeNode
//   compare?: "exact" | "unordered" | "nested-unordered" | "float"
//   tests: [{ args, expected, note? }]   the first two are shown as examples
//   constraints: [], hints: [], approach, complexity: { time, space }, pitfalls: []
//   starter?: { js, py }                 generated from params when omitted
//   solution: { js, py }
// }
// Write code with the `code` tag: code`...` keeps backslashes literal and trims the
// leading newline. Don't use backticks or ${ inside it.

export const code = (s, ...v) => String.raw(s, ...v).replace(/^\n/, "").replace(/\s+$/, "") + "\n";

const snake = (s) => s.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();

export function define(p) {
  const params = p.params || [];
  const starter = p.starter || {
    js: `function ${p.fn.js}(${params.join(", ")}) {\n  // Your code here\n}\n`,
    py: `def ${p.fn.py}(${params.map(snake).join(", ")}):\n    # Your code here\n    pass\n`,
  };
  return { compare: "exact", kind: "fn", constraints: [], ...p, starter };
}
