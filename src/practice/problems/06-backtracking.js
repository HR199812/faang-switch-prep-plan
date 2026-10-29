import { define, code } from "../define.js";

export default [
  define({
    id: "subsets",
    title: "Subsets",
    difficulty: "Medium",
    track: "dsa",
    pattern: "Backtracking",
    weeks: [7],
    link: "https://leetcode.com/problems/subsets/",
    statement: "Given an array of **distinct** integers `nums`, return every possible subset (the power set), including the empty set. No duplicate subsets; any order.",
    params: ["nums"],
    fn: { js: "subsets", py: "subsets" },
    compare: "nested-unordered",
    tests: [
      { args: [[1, 2, 3]], expected: [[], [1], [2], [1, 2], [3], [1, 3], [2, 3], [1, 2, 3]] },
      { args: [[0]], expected: [[], [0]] },
      { args: [[5, -1]], expected: [[], [5], [-1], [5, -1]] },
      { args: [[1, 2, 3, 4]], expected: [[], [1], [2], [3], [4], [1, 2], [1, 3], [1, 4], [2, 3], [2, 4], [3, 4], [1, 2, 3], [1, 2, 4], [1, 3, 4], [2, 3, 4], [1, 2, 3, 4]] },
    ],
    constraints: ["1 ≤ nums.length ≤ 10", "All values distinct"],
    hints: [
      "Each element is either in or out — 2ⁿ subsets.",
      "Backtrack: at index i, record the current path, then try extending it with each later element.",
    ],
    approach: "DFS `build(start, path)`: push a **copy** of `path` to the output, then for each `i` from `start` to n−1, push `nums[i]`, recurse with `i + 1`, and pop. (Iterative alternative: start with [[]] and, for each number, append it to a copy of every existing subset.)",
    complexity: { time: "O(n · 2ⁿ)", space: "O(n) recursion (plus output)" },
    pitfalls: [
      "Pushing `path` itself instead of a copy — every saved subset ends up as the same (empty) array.",
      "Looping from 0 instead of start, generating permutations/duplicates.",
      "Forgetting to pop after recursing.",
    ],
    solution: {
      js: code`
function subsets(nums) {
  const out = [];
  const path = [];
  const build = (start) => {
    out.push([...path]);
    for (let i = start; i < nums.length; i++) {
      path.push(nums[i]);
      build(i + 1);
      path.pop();
    }
  };
  build(0);
  return out;
}`,
      py: code`
def subsets(nums):
    out = [[]]
    for x in nums:
        out += [s + [x] for s in out]
    return out`,
    },
  }),

  define({
    id: "combination-sum",
    title: "Combination Sum",
    difficulty: "Medium",
    track: "dsa",
    pattern: "Backtracking",
    weeks: [7],
    link: "https://leetcode.com/problems/combination-sum/",
    statement: "Given distinct positive integers `candidates` and a `target`, return all unique combinations of candidates that sum to `target`. The same number may be used any number of times. Two combinations are the same if they use the same multiset of numbers.",
    params: ["candidates", "target"],
    fn: { js: "combinationSum", py: "combination_sum" },
    compare: "nested-unordered",
    tests: [
      { args: [[2, 3, 6, 7], 7], expected: [[2, 2, 3], [7]] },
      { args: [[2, 3, 5], 8], expected: [[2, 2, 2, 2], [2, 3, 3], [3, 5]] },
      { args: [[2], 1], expected: [] },
      { args: [[1], 2], expected: [[1, 1]] },
      { args: [[7, 3, 2], 18], expected: [[2, 2, 2, 2, 2, 2, 2, 2, 2], [2, 2, 2, 2, 2, 2, 3, 3], [2, 2, 2, 2, 3, 7], [2, 2, 2, 3, 3, 3, 3], [2, 2, 7, 7], [2, 3, 3, 3, 7], [3, 3, 3, 3, 3, 3]], note: "Unsorted candidates" },
    ],
    constraints: ["1 ≤ candidates.length ≤ 30", "2 ≤ candidates[i] ≤ 40, distinct", "1 ≤ target ≤ 40"],
    hints: [
      "To avoid [2,3] and [3,2] both appearing, only ever pick candidates at index ≥ the last one you picked.",
      "Because reuse is allowed, recurse with the same index i (not i + 1) after picking candidates[i].",
      "Sort first and break out of the loop once a candidate exceeds the remaining target.",
    ],
    approach: "Sort. DFS `go(start, remaining, path)`: if remaining is 0 record a copy; else for `i` from `start`, stop if `c[i] > remaining`, otherwise push `c[i]`, recurse with `(i, remaining - c[i])`, pop.",
    complexity: { time: "Exponential — O(n^(T/min)) worst case", space: "O(T/min) recursion depth" },
    pitfalls: [
      "Recursing with i + 1 — forbids reusing a number.",
      "Starting each loop at 0 — produces permutations of the same combination.",
      "Breaking out of the loop early without sorting first — later, smaller candidates get skipped.",
    ],
    solution: {
      js: code`
function combinationSum(candidates, target) {
  const c = [...candidates].sort((a, b) => a - b);
  const out = [];
  const path = [];
  const go = (start, remaining) => {
    if (remaining === 0) { out.push([...path]); return; }
    for (let i = start; i < c.length; i++) {
      if (c[i] > remaining) break;
      path.push(c[i]);
      go(i, remaining - c[i]);
      path.pop();
    }
  };
  go(0, target);
  return out;
}`,
      py: code`
def combination_sum(candidates, target):
    c = sorted(candidates)
    out = []

    def go(start, remaining, path):
        if remaining == 0:
            out.append(path[:])
            return
        for i in range(start, len(c)):
            if c[i] > remaining:
                break
            path.append(c[i])
            go(i, remaining - c[i], path)
            path.pop()

    go(0, target, [])
    return out`,
    },
  }),

  define({
    id: "implement-trie",
    title: "Implement Trie (Prefix Tree)",
    difficulty: "Medium",
    track: "dsa",
    pattern: "Trie",
    weeks: [7],
    link: "https://leetcode.com/problems/implement-trie-prefix-tree/",
    statement: "Implement a class `Trie`:\n\n- `insert(word)` — add a word\n- `search(word)` — true if the exact word was inserted\n- `startsWith(prefix)` — true if any inserted word starts with `prefix`\n\nEach test is a sequence of calls: `ops[0]` constructs the trie, later ops are method calls; the expected output lists each call's return value (`null` for the constructor and `insert`). Method names are the same in both languages.",
    params: [],
    kind: "design",
    cls: "Trie",
    fn: { js: "Trie", py: "Trie" },
    tests: [
      { ops: ["Trie", "insert", "search", "search", "startsWith", "insert", "search"], args: [[], ["apple"], ["apple"], ["app"], ["app"], ["app"], ["app"]], expected: [null, null, true, false, true, null, true] },
      { ops: ["Trie", "search", "startsWith"], args: [[], ["a"], ["a"]], expected: [null, false, false], note: "Empty trie" },
      { ops: ["Trie", "insert", "insert", "search", "search", "startsWith", "startsWith"], args: [[], ["car"], ["card"], ["car"], ["ca"], ["card"], ["cards"]], expected: [null, null, null, true, false, true, false] },
      { ops: ["Trie", "insert", "startsWith", "search"], args: [[], ["a"], ["a"], ["a"]], expected: [null, null, true, true], note: "A word is a prefix of itself" },
    ],
    constraints: ["1 ≤ word.length, prefix.length ≤ 2000", "Lowercase letters", "At most 3·10⁴ calls"],
    hints: [
      "Each node holds a map of child letters and an end-of-word flag.",
      "search and startsWith share the same walk; they differ only in whether the final node must be marked as a word end.",
    ],
    approach: "Root node `{ children: {}, end: false }`. Insert walks/creates a child per character and marks the last node `end`. A helper `walk(s)` returns the node reached by s or null; `search` = node exists and `node.end`, `startsWith` = node exists.",
    complexity: { time: "O(L) per operation", space: "O(total characters inserted)" },
    pitfalls: [
      "search returning true for prefixes because the end flag isn't checked.",
      "Marking end on every node during insert.",
      "Python: returning None instead of False from search/startsWith (the tests expect booleans).",
    ],
    starter: {
      js: code`
class Trie {
  constructor() {
    // Your code here
  }

  insert(word) {
    // Your code here
  }

  search(word) {
    // Your code here
  }

  startsWith(prefix) {
    // Your code here
  }
}`,
      py: code`
class Trie:
    def __init__(self):
        # Your code here
        pass

    def insert(self, word):
        pass

    def search(self, word):
        pass

    def startsWith(self, prefix):
        pass`,
    },
    solution: {
      js: code`
class Trie {
  constructor() {
    this.root = { children: {}, end: false };
  }

  insert(word) {
    let node = this.root;
    for (const ch of word) {
      if (!node.children[ch]) node.children[ch] = { children: {}, end: false };
      node = node.children[ch];
    }
    node.end = true;
  }

  walk(s) {
    let node = this.root;
    for (const ch of s) {
      node = node.children[ch];
      if (!node) return null;
    }
    return node;
  }

  search(word) {
    const node = this.walk(word);
    return !!node && node.end;
  }

  startsWith(prefix) {
    return this.walk(prefix) !== null;
  }
}`,
      py: code`
class Trie:
    def __init__(self):
        self.root = {}

    def insert(self, word):
        node = self.root
        for ch in word:
            node = node.setdefault(ch, {})
        node["$"] = True

    def _walk(self, s):
        node = self.root
        for ch in s:
            if ch not in node:
                return None
            node = node[ch]
        return node

    def search(self, word):
        node = self._walk(word)
        return node is not None and "$" in node

    def startsWith(self, prefix):
        return self._walk(prefix) is not None`,
    },
  }),
];
