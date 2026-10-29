import { define, code } from "../define.js";

export default [
  define({
    id: "number-of-islands",
    title: "Number of Islands",
    difficulty: "Medium",
    track: "dsa",
    pattern: "Grid DFS / BFS",
    weeks: [8],
    link: "https://leetcode.com/problems/number-of-islands/",
    statement: "Given an m × n grid of `\"1\"` (land) and `\"0\"` (water) strings, return the number of islands. An island is land connected horizontally or vertically (not diagonally).",
    params: ["grid"],
    fn: { js: "numIslands", py: "num_islands" },
    tests: [
      { args: [[["1", "1", "1", "1", "0"], ["1", "1", "0", "1", "0"], ["1", "1", "0", "0", "0"], ["0", "0", "0", "0", "0"]]], expected: 1 },
      { args: [[["1", "1", "0", "0", "0"], ["1", "1", "0", "0", "0"], ["0", "0", "1", "0", "0"], ["0", "0", "0", "1", "1"]]], expected: 3 },
      { args: [[["1"]]], expected: 1 },
      { args: [[["0"]]], expected: 0 },
      { args: [[["1", "0", "1"], ["0", "1", "0"], ["1", "0", "1"]]], expected: 5, note: "Diagonals don't connect" },
      { args: [[["1", "1", "1"], ["0", "1", "0"], ["1", "1", "1"]]], expected: 1 },
    ],
    constraints: ["1 ≤ m, n ≤ 300", "Cells are the strings \"0\" or \"1\""],
    hints: [
      "Scan every cell. Each time you find unvisited land, that's a new island.",
      "Flood-fill (DFS or BFS) from it, marking every connected land cell visited so it isn't counted again.",
    ],
    approach: "For each cell that is `\"1\"`, increment the count and flood-fill its island, overwriting cells with `\"0\"` (or tracking a visited set). Flood-fill visits the 4 neighbours within bounds. Use an explicit stack to avoid recursion-depth issues on 300×300 grids.",
    complexity: { time: "O(m · n)", space: "O(m · n) worst-case stack" },
    pitfalls: [
      "Comparing with the number 1 instead of the string \"1\".",
      "Marking cells visited when popped instead of when pushed — the same cell gets pushed many times.",
      "Including diagonal neighbours.",
      "Deep recursion on a large all-land grid overflowing the stack.",
    ],
    solution: {
      js: code`
function numIslands(grid) {
  const m = grid.length, n = grid[0].length;
  let count = 0;
  for (let r = 0; r < m; r++) {
    for (let c = 0; c < n; c++) {
      if (grid[r][c] !== "1") continue;
      count++;
      grid[r][c] = "0";
      const stack = [[r, c]];
      while (stack.length) {
        const [i, j] = stack.pop();
        for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const a = i + di, b = j + dj;
          if (a >= 0 && a < m && b >= 0 && b < n && grid[a][b] === "1") {
            grid[a][b] = "0";
            stack.push([a, b]);
          }
        }
      }
    }
  }
  return count;
}`,
      py: code`
def num_islands(grid):
    m, n = len(grid), len(grid[0])
    count = 0
    for r in range(m):
        for c in range(n):
            if grid[r][c] != "1":
                continue
            count += 1
            grid[r][c] = "0"
            stack = [(r, c)]
            while stack:
                i, j = stack.pop()
                for a, b in ((i + 1, j), (i - 1, j), (i, j + 1), (i, j - 1)):
                    if 0 <= a < m and 0 <= b < n and grid[a][b] == "1":
                        grid[a][b] = "0"
                        stack.append((a, b))
    return count`,
    },
  }),

  define({
    id: "course-schedule",
    title: "Course Schedule",
    difficulty: "Medium",
    track: "dsa",
    pattern: "Topological sort",
    weeks: [9],
    link: "https://leetcode.com/problems/course-schedule/",
    statement: "There are `numCourses` courses labelled 0..numCourses−1. `prerequisites[i] = [a, b]` means you must take b before a. Return whether it's possible to finish all courses.",
    params: ["numCourses", "prerequisites"],
    fn: { js: "canFinish", py: "can_finish" },
    tests: [
      { args: [2, [[1, 0]]], expected: true },
      { args: [2, [[1, 0], [0, 1]]], expected: false },
      { args: [1, []], expected: true },
      { args: [3, [[1, 0], [2, 1], [0, 2]]], expected: false, note: "A 3-cycle" },
      { args: [4, [[1, 0], [2, 0], [3, 1], [3, 2]]], expected: true, note: "Diamond — shared prerequisite isn't a cycle" },
      { args: [3, [[0, 0]]], expected: false, note: "Self-dependency" },
      { args: [5, [[1, 4], [2, 4], [3, 1], [3, 2]]], expected: true },
    ],
    constraints: ["1 ≤ numCourses ≤ 2000", "0 ≤ prerequisites.length ≤ 5000"],
    hints: [
      "Courses and prerequisites form a directed graph. You can finish everything iff it has no cycle.",
      "Kahn's algorithm: repeatedly take courses with in-degree 0; if you can't take all of them, there's a cycle.",
    ],
    approach: "Build adjacency `b → a` and in-degrees. Queue every course with in-degree 0. Pop, count it as taken, and decrement each neighbour's in-degree, enqueuing those that hit 0. Return `taken === numCourses`. (DFS alternative: three colours — white/grey/black — and a grey→grey edge means a cycle.)",
    complexity: { time: "O(V + E)", space: "O(V + E)" },
    pitfalls: [
      "Edge direction reversed — harmless for cycle detection here, but wrong if you need the actual order (Course Schedule II).",
      "DFS with a single visited set: a node reached twice via a diamond is misreported as a cycle. You need an 'in current path' state.",
      "Forgetting isolated courses with no edges.",
    ],
    solution: {
      js: code`
function canFinish(numCourses, prerequisites) {
  const adj = Array.from({ length: numCourses }, () => []);
  const indeg = new Array(numCourses).fill(0);
  for (const [a, b] of prerequisites) { adj[b].push(a); indeg[a]++; }
  const queue = [];
  for (let i = 0; i < numCourses; i++) if (indeg[i] === 0) queue.push(i);
  let taken = 0;
  for (let h = 0; h < queue.length; h++) {
    taken++;
    for (const next of adj[queue[h]]) if (--indeg[next] === 0) queue.push(next);
  }
  return taken === numCourses;
}`,
      py: code`
def can_finish(num_courses, prerequisites):
    adj = [[] for _ in range(num_courses)]
    indeg = [0] * num_courses
    for a, b in prerequisites:
        adj[b].append(a)
        indeg[a] += 1
    q = deque(i for i in range(num_courses) if indeg[i] == 0)
    taken = 0
    while q:
        node = q.popleft()
        taken += 1
        for nxt in adj[node]:
            indeg[nxt] -= 1
            if indeg[nxt] == 0:
                q.append(nxt)
    return taken == num_courses`,
    },
  }),

  define({
    id: "network-delay-time",
    title: "Network Delay Time",
    difficulty: "Medium",
    track: "dsa",
    pattern: "Dijkstra",
    weeks: [9],
    link: "https://leetcode.com/problems/network-delay-time/",
    statement: "A network has `n` nodes labelled 1..n. `times[i] = [u, v, w]` is a directed edge from u to v taking w time. A signal is sent from node `k`. Return the time for all nodes to receive it, or -1 if some node never does.",
    params: ["times", "n", "k"],
    fn: { js: "networkDelayTime", py: "network_delay_time" },
    tests: [
      { args: [[[2, 1, 1], [2, 3, 1], [3, 4, 1]], 4, 2], expected: 2 },
      { args: [[[1, 2, 1]], 2, 1], expected: 1 },
      { args: [[[1, 2, 1]], 2, 2], expected: -1, note: "Edges are directed" },
      { args: [[[1, 2, 1], [2, 3, 2], [1, 3, 4]], 3, 1], expected: 3, note: "The direct edge isn't the shortest path" },
      { args: [[[1, 2, 1], [2, 1, 3]], 2, 2], expected: 3 },
      { args: [[], 1, 1], expected: 0, note: "Single node" },
    ],
    constraints: ["1 ≤ k ≤ n ≤ 100", "1 ≤ times.length ≤ 6000", "0 ≤ w ≤ 100"],
    hints: [
      "You need the shortest path from k to every node; the answer is the largest of those.",
      "Non-negative weights → Dijkstra.",
    ],
    approach: "Dijkstra from k with a min-heap of (distance, node). Pop the closest unsettled node, relax its outgoing edges, push improvements. After the loop, if any node is unreachable return -1, else the max distance. (With n ≤ 100, an O(V²) array-scan Dijkstra is also fine.)",
    complexity: { time: "O(E log V) with a heap", space: "O(V + E)" },
    pitfalls: [
      "Plain BFS — ignores weights.",
      "Treating edges as undirected.",
      "Nodes are 1-indexed: arrays of size n leave node n out.",
      "Not skipping stale heap entries (popped distance > best known).",
    ],
    solution: {
      js: code`
function networkDelayTime(times, n, k) {
  const adj = Array.from({ length: n + 1 }, () => []);
  for (const [u, v, w] of times) adj[u].push([v, w]);
  const dist = new Array(n + 1).fill(Infinity);
  const done = new Array(n + 1).fill(false);
  dist[k] = 0;
  // O(V^2) Dijkstra: fine for n <= 100. Use a binary heap for large graphs.
  for (let iter = 0; iter < n; iter++) {
    let u = -1;
    for (let i = 1; i <= n; i++) if (!done[i] && (u === -1 || dist[i] < dist[u])) u = i;
    if (dist[u] === Infinity) break;
    done[u] = true;
    for (const [v, w] of adj[u]) if (dist[u] + w < dist[v]) dist[v] = dist[u] + w;
  }
  let best = 0;
  for (let i = 1; i <= n; i++) best = Math.max(best, dist[i]);
  return best === Infinity ? -1 : best;
}`,
      py: code`
def network_delay_time(times, n, k):
    adj = defaultdict(list)
    for u, v, w in times:
        adj[u].append((v, w))
    dist = {}
    heap = [(0, k)]
    while heap:
        d, u = heappop(heap)
        if u in dist:
            continue
        dist[u] = d
        for v, w in adj[u]:
            if v not in dist:
                heappush(heap, (d + w, v))
    return max(dist.values()) if len(dist) == n else -1`,
    },
  }),

  define({
    id: "redundant-connection",
    title: "Redundant Connection",
    difficulty: "Medium",
    track: "dsa",
    pattern: "Union-Find",
    weeks: [10],
    link: "https://leetcode.com/problems/redundant-connection/",
    statement: "A tree of n nodes (labelled 1..n) had one extra edge added, so `edges` (length n) now contains exactly one cycle. Return an edge that can be removed to make it a tree again. If several answers exist, return the one that appears **last** in `edges`.",
    params: ["edges"],
    fn: { js: "findRedundantConnection", py: "find_redundant_connection" },
    tests: [
      { args: [[[1, 2], [1, 3], [2, 3]]], expected: [2, 3] },
      { args: [[[1, 2], [2, 3], [3, 4], [1, 4], [1, 5]]], expected: [1, 4] },
      { args: [[[1, 4], [3, 4], [1, 3], [1, 2], [4, 5]]], expected: [1, 3] },
      { args: [[[2, 3], [1, 2], [1, 3]]], expected: [1, 3] },
      { args: [[[3, 4], [1, 2], [2, 4], [3, 5], [2, 5]]], expected: [2, 5] },
    ],
    constraints: ["3 ≤ n ≤ 1000", "No repeated edges", "The graph is connected"],
    hints: [
      "Add edges one at a time. The first edge whose endpoints are already connected closes the cycle.",
      "Union-Find answers 'already connected?' in near-O(1).",
    ],
    approach: "Union-Find with path compression (and union by rank/size). For each edge [u, v], if `find(u) === find(v)` return it; otherwise union them. Processing in order makes the first cycle-closing edge the last one on the cycle in input order.",
    complexity: { time: "O(n · α(n))", space: "O(n)" },
    pitfalls: [
      "Unioning u and v directly (parent[u] = v) instead of their roots.",
      "Parent array of size n when nodes are 1-indexed.",
      "Recursive find without compression degrading to O(n) per call on chain-shaped inputs.",
    ],
    solution: {
      js: code`
function findRedundantConnection(edges) {
  const parent = Array.from({ length: edges.length + 1 }, (_, i) => i);
  const find = (x) => {
    while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
    return x;
  };
  for (const [u, v] of edges) {
    const ru = find(u), rv = find(v);
    if (ru === rv) return [u, v];
    parent[ru] = rv;
  }
  return [];
}`,
      py: code`
def find_redundant_connection(edges):
    parent = list(range(len(edges) + 1))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    for u, v in edges:
        ru, rv = find(u), find(v)
        if ru == rv:
            return [u, v]
        parent[ru] = rv
    return []`,
    },
  }),
];
