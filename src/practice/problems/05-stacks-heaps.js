import { define, code } from "../define.js";

export default [
  define({
    id: "top-k-frequent-elements",
    title: "Top K Frequent Elements",
    difficulty: "Medium",
    track: "dsa",
    pattern: "Heap / bucket sort",
    weeks: [6],
    link: "https://leetcode.com/problems/top-k-frequent-elements/",
    statement: "Given an integer array `nums` and an integer `k`, return the `k` most frequent elements, in any order. The answer is guaranteed to be unique. Aim for better than O(n log n).",
    params: ["nums", "k"],
    fn: { js: "topKFrequent", py: "top_k_frequent" },
    compare: "unordered",
    tests: [
      { args: [[1, 1, 1, 2, 2, 3], 2], expected: [1, 2] },
      { args: [[1], 1], expected: [1] },
      { args: [[4, 4, -1, -1, -1, 2], 2], expected: [-1, 4] },
      { args: [[5, 3, 5, 3, 5, 7, 7, 7, 7], 2], expected: [7, 5] },
      { args: [[1, 2, 3], 3], expected: [1, 2, 3] },
    ],
    constraints: ["1 ≤ nums.length ≤ 10⁵", "k is in [1, number of distinct elements]"],
    hints: [
      "Count frequencies first.",
      "A min-heap of size k gives O(n log k).",
      "Bucket sort by frequency (index = count, at most n) gives O(n).",
    ],
    approach: "Count with a hash map. Then bucket values by frequency: `buckets[f]` lists values that occur f times. Walk buckets from n down to 1, collecting values until you have k. (Heap alternative: keep a size-k min-heap keyed by count.)",
    complexity: { time: "O(n) bucket sort / O(n log k) heap", space: "O(n)" },
    pitfalls: [
      "Sorting all distinct values by count — O(n log n), which the question explicitly asks you to beat.",
      "Returning counts instead of values.",
      "JS object keys become strings — map them back to numbers (or use a Map).",
    ],
    solution: {
      js: code`
function topKFrequent(nums, k) {
  const count = new Map();
  for (const x of nums) count.set(x, (count.get(x) || 0) + 1);
  const buckets = Array.from({ length: nums.length + 1 }, () => []);
  for (const [val, f] of count) buckets[f].push(val);
  const out = [];
  for (let f = nums.length; f > 0 && out.length < k; f--) {
    for (const v of buckets[f]) {
      out.push(v);
      if (out.length === k) break;
    }
  }
  return out;
}`,
      py: code`
def top_k_frequent(nums, k):
    count = Counter(nums)
    return heapq.nlargest(k, count.keys(), key=count.get)`,
    },
  }),

  define({
    id: "daily-temperatures",
    title: "Daily Temperatures",
    difficulty: "Medium",
    track: "dsa",
    pattern: "Monotonic stack",
    weeks: [6],
    link: "https://leetcode.com/problems/daily-temperatures/",
    statement: "Given daily `temperatures`, return an array where `answer[i]` is the number of days after day i until a **strictly** warmer temperature. Use 0 if no warmer day comes.",
    params: ["temperatures"],
    fn: { js: "dailyTemperatures", py: "daily_temperatures" },
    tests: [
      { args: [[73, 74, 75, 71, 69, 72, 76, 73]], expected: [1, 1, 4, 2, 1, 1, 0, 0] },
      { args: [[30, 40, 50, 60]], expected: [1, 1, 1, 0] },
      { args: [[30, 60, 90]], expected: [1, 1, 0] },
      { args: [[50, 50, 50]], expected: [0, 0, 0], note: "Equal isn't warmer" },
      { args: [[90, 80, 70, 100]], expected: [3, 2, 1, 0] },
      { args: [[55]], expected: [0] },
    ],
    constraints: ["1 ≤ temperatures.length ≤ 10⁵", "30 ≤ temperatures[i] ≤ 100"],
    hints: [
      "Keep a stack of indices of days still waiting for a warmer day.",
      "Their temperatures are non-increasing from bottom to top. A warmer day pops (and answers) everything colder than it.",
    ],
    approach: "Monotonic decreasing stack of indices. For each day i, while the stack top is colder than `t[i]`, pop it and set `ans[top] = i - top`. Push i. Anything left on the stack keeps 0.",
    complexity: { time: "O(n) — each index is pushed and popped once", space: "O(n)" },
    pitfalls: [
      "Popping on >= instead of > (equal temperatures aren't warmer).",
      "Storing temperatures on the stack instead of indices — you can't compute the distance.",
      "Nested scan to the right for each day — O(n²) and times out on 10⁵ elements.",
    ],
    solution: {
      js: code`
function dailyTemperatures(temperatures) {
  const ans = new Array(temperatures.length).fill(0);
  const stack = [];
  temperatures.forEach((t, i) => {
    while (stack.length && temperatures[stack[stack.length - 1]] < t) {
      const j = stack.pop();
      ans[j] = i - j;
    }
    stack.push(i);
  });
  return ans;
}`,
      py: code`
def daily_temperatures(temperatures):
    ans = [0] * len(temperatures)
    stack = []
    for i, t in enumerate(temperatures):
        while stack and temperatures[stack[-1]] < t:
            j = stack.pop()
            ans[j] = i - j
        stack.append(i)
    return ans`,
    },
  }),

  define({
    id: "largest-rectangle-in-histogram",
    title: "Largest Rectangle in Histogram",
    difficulty: "Hard",
    track: "dsa",
    pattern: "Monotonic stack",
    weeks: [6],
    link: "https://leetcode.com/problems/largest-rectangle-in-histogram/",
    statement: "Given bar `heights` of a histogram where each bar has width 1, return the area of the largest rectangle that fits inside the histogram.",
    params: ["heights"],
    fn: { js: "largestRectangleArea", py: "largest_rectangle_area" },
    tests: [
      { args: [[2, 1, 5, 6, 2, 3]], expected: 10 },
      { args: [[2, 4]], expected: 4 },
      { args: [[1]], expected: 1 },
      { args: [[2, 2, 2]], expected: 6 },
      { args: [[6, 2, 5, 4, 5, 1, 6]], expected: 12 },
      { args: [[0, 0]], expected: 0 },
      { args: [[1, 2, 3, 4, 5]], expected: 9, note: "Increasing — everything is resolved at the end" },
    ],
    constraints: ["1 ≤ heights.length ≤ 10⁵", "0 ≤ heights[i] ≤ 10⁴"],
    hints: [
      "For each bar, the widest rectangle using its full height stretches until the first shorter bar on each side.",
      "An increasing stack of indices finds both boundaries: when a shorter bar arrives, it's the right boundary for every taller bar it pops; the new stack top is the left boundary.",
      "Append a sentinel height 0 so every bar gets popped.",
    ],
    approach: "Iterate i over heights plus a trailing 0. Maintain a stack of indices with increasing heights. While `h[i] < h[top]`, pop `top`; its rectangle has height `h[top]` and width `i - stack.top - 1` (or `i` if the stack is empty). Push i.",
    complexity: { time: "O(n)", space: "O(n)" },
    pitfalls: [
      "No sentinel at the end — bars still on the stack are never measured ([1,2,3,4,5] returns 0 or too small).",
      "Width computed from the popped index instead of the new stack top: width is i − newTop − 1.",
      "Brute force over all pairs — O(n²), times out.",
    ],
    solution: {
      js: code`
function largestRectangleArea(heights) {
  const stack = [];
  let best = 0;
  for (let i = 0; i <= heights.length; i++) {
    const h = i === heights.length ? 0 : heights[i];
    while (stack.length && h < heights[stack[stack.length - 1]]) {
      const height = heights[stack.pop()];
      const left = stack.length ? stack[stack.length - 1] : -1;
      best = Math.max(best, height * (i - left - 1));
    }
    stack.push(i);
  }
  return best;
}`,
      py: code`
def largest_rectangle_area(heights):
    stack = []
    best = 0
    for i, h in enumerate(heights + [0]):
        while stack and h < heights[stack[-1]]:
            height = heights[stack.pop()]
            left = stack[-1] if stack else -1
            best = max(best, height * (i - left - 1))
        stack.append(i)
    return best`,
    },
  }),

  define({
    id: "lru-cache",
    title: "LRU Cache",
    difficulty: "Medium",
    track: "dsa",
    pattern: "Design · hash map + linked list",
    weeks: [12],
    link: "https://leetcode.com/problems/lru-cache/",
    statement: "Design a Least-Recently-Used cache class `LRUCache`:\n\n- `constructor(capacity)` / `__init__(self, capacity)` — positive capacity\n- `get(key)` — the value if present (and mark it most recently used), otherwise -1\n- `put(key, value)` — insert or update; if this exceeds capacity, evict the least recently used key\n\nBoth `get` and `put` must run in O(1) average time.\n\nEach test is a sequence of calls: `ops[0]` constructs the cache with `args[0]`, then each later op is a method call. The expected output lists each call's return value (`null` for the constructor and `put`).",
    params: [],
    kind: "design",
    cls: "LRUCache",
    fn: { js: "LRUCache", py: "LRUCache" },
    tests: [
      { ops: ["LRUCache", "put", "put", "get", "put", "get", "put", "get", "get", "get"], args: [[2], [1, 1], [2, 2], [1], [3, 3], [2], [4, 4], [1], [3], [4]], expected: [null, null, null, 1, null, -1, null, -1, 3, 4] },
      { ops: ["LRUCache", "put", "get", "put", "get", "get"], args: [[1], [2, 1], [2], [3, 2], [2], [3]], expected: [null, null, 1, null, -1, 2] },
      { ops: ["LRUCache", "put", "put", "put", "get", "get"], args: [[2], [1, 1], [1, 10], [2, 2], [1], [2]], expected: [null, null, null, null, 10, 2], note: "Updating an existing key must not evict anything" },
      { ops: ["LRUCache", "put", "put", "get", "put", "get", "get"], args: [[2], [1, 1], [2, 2], [1], [3, 3], [1], [2]], expected: [null, null, null, 1, null, 1, -1], note: "get() refreshes recency, so 2 is evicted, not 1" },
      { ops: ["LRUCache", "get", "put", "get"], args: [[1], [7], [7, 0], [7]], expected: [null, -1, null, 0], note: "Value 0 is a real value, not 'missing'" },
    ],
    constraints: ["1 ≤ capacity ≤ 3000", "At most 2·10⁵ calls"],
    hints: [
      "A hash map gives O(1) lookup; you also need O(1) 'move to most-recent' and 'remove least-recent'.",
      "A doubly linked list with sentinel head/tail does both; the map points at list nodes.",
      "Shortcut: JS Map and Python OrderedDict preserve insertion order — delete + re-insert to refresh.",
    ],
    approach: "Keep an ordered map from key to value where order = recency. `get`: if present, delete and re-insert (now most recent) and return it. `put`: delete if present, insert, then if size > capacity evict the first (oldest) key. In an interview, be ready to build the doubly-linked-list + hash-map version from scratch.",
    complexity: { time: "O(1) per operation", space: "O(capacity)" },
    pitfalls: [
      "get() not refreshing recency.",
      "put() on an existing key evicting another key, or not moving it to most-recent.",
      "Treating value 0 as missing (`if (!value)`).",
      "Evicting before inserting so capacity-1 caches lose the new key.",
    ],
    starter: {
      js: code`
class LRUCache {
  constructor(capacity) {
    // Your code here
  }

  get(key) {
    // Your code here
  }

  put(key, value) {
    // Your code here
  }
}`,
      py: code`
class LRUCache:
    def __init__(self, capacity):
        # Your code here
        pass

    def get(self, key):
        # Your code here
        pass

    def put(self, key, value):
        # Your code here
        pass`,
    },
    solution: {
      js: code`
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map(); // insertion order = recency (oldest first)
  }

  get(key) {
    if (!this.map.has(key)) return -1;
    const v = this.map.get(key);
    this.map.delete(key);
    this.map.set(key, v);
    return v;
  }

  put(key, value) {
    this.map.delete(key);
    this.map.set(key, value);
    if (this.map.size > this.capacity) this.map.delete(this.map.keys().next().value);
  }
}`,
      py: code`
class LRUCache:
    def __init__(self, capacity):
        self.capacity = capacity
        self.data = OrderedDict()  # oldest first

    def get(self, key):
        if key not in self.data:
            return -1
        self.data.move_to_end(key)
        return self.data[key]

    def put(self, key, value):
        if key in self.data:
            self.data.move_to_end(key)
        self.data[key] = value
        if len(self.data) > self.capacity:
            self.data.popitem(last=False)`,
    },
  }),
];
