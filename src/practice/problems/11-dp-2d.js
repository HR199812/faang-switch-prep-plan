import { define, code } from "../define.js";

export default [
  define({
    id: "unique-paths-ii",
    title: "Unique Paths II",
    difficulty: "Medium",
    track: "dp",
    pattern: "Grid DP",
    weeks: [5],
    link: "https://leetcode.com/problems/unique-paths-ii/",
    statement: "A robot starts at the top-left of an m × n grid and moves only right or down to reach the bottom-right. `obstacleGrid[i][j] = 1` marks an obstacle. Return the number of unique paths.",
    params: ["obstacleGrid"],
    fn: { js: "uniquePathsWithObstacles", py: "unique_paths_with_obstacles" },
    tests: [
      { args: [[[0, 0, 0], [0, 1, 0], [0, 0, 0]]], expected: 2 },
      { args: [[[0, 1], [0, 0]]], expected: 1 },
      { args: [[[1]]], expected: 0, note: "Start is blocked" },
      { args: [[[0]]], expected: 1 },
      { args: [[[0, 0], [0, 1]]], expected: 0, note: "End is blocked" },
      { args: [[[0, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 0]]], expected: 4 },
      { args: [[[0, 1, 0, 0]]], expected: 0, note: "A single row with an obstacle in the way" },
    ],
    constraints: ["1 ≤ m, n ≤ 100", "Cells are 0 or 1"],
    hints: [
      "paths(i, j) = paths(i−1, j) + paths(i, j−1), or 0 on an obstacle.",
      "A single 1D row array is enough: row[j] += row[j−1].",
    ],
    approach: "1D DP over columns: `row[0] = 1` if the start is free. For each cell, if it's an obstacle set `row[j] = 0`, else (for j > 0) `row[j] += row[j-1]`. The answer is `row[n-1]`.",
    complexity: { time: "O(m · n)", space: "O(n)" },
    pitfalls: [
      "Initialising the whole first row/column to 1 — cells after an obstacle on the edge are unreachable.",
      "Forgetting that the start or end cell itself may be an obstacle.",
    ],
    solution: {
      js: code`
function uniquePathsWithObstacles(obstacleGrid) {
  const n = obstacleGrid[0].length;
  const row = new Array(n).fill(0);
  row[0] = obstacleGrid[0][0] === 1 ? 0 : 1;
  for (const cells of obstacleGrid) {
    for (let j = 0; j < n; j++) {
      if (cells[j] === 1) row[j] = 0;
      else if (j > 0) row[j] += row[j - 1];
    }
  }
  return row[n - 1];
}`,
      py: code`
def unique_paths_with_obstacles(obstacle_grid):
    n = len(obstacle_grid[0])
    row = [0] * n
    row[0] = 0 if obstacle_grid[0][0] == 1 else 1
    for cells in obstacle_grid:
        for j in range(n):
            if cells[j] == 1:
                row[j] = 0
            elif j > 0:
                row[j] += row[j - 1]
    return row[-1]`,
    },
  }),

  define({
    id: "edit-distance",
    title: "Edit Distance",
    difficulty: "Medium",
    track: "dp",
    pattern: "String DP",
    weeks: [5],
    link: "https://leetcode.com/problems/edit-distance/",
    statement: "Return the minimum number of single-character insertions, deletions or replacements needed to turn `word1` into `word2` (Levenshtein distance).",
    params: ["word1", "word2"],
    fn: { js: "minDistance", py: "min_distance" },
    tests: [
      { args: ["horse", "ros"], expected: 3 },
      { args: ["intention", "execution"], expected: 5 },
      { args: ["", ""], expected: 0 },
      { args: ["a", ""], expected: 1 },
      { args: ["", "abc"], expected: 3 },
      { args: ["abc", "abc"], expected: 0 },
      { args: ["kitten", "sitting"], expected: 3 },
    ],
    constraints: ["0 ≤ word1.length, word2.length ≤ 500", "Lowercase letters"],
    hints: [
      "dp[i][j] = edits to turn the first i chars of word1 into the first j chars of word2.",
      "If the last chars match, dp[i][j] = dp[i−1][j−1]. Otherwise 1 + min(insert dp[i][j−1], delete dp[i−1][j], replace dp[i−1][j−1]).",
      "Base cases: dp[i][0] = i, dp[0][j] = j.",
    ],
    approach: "Classic (m+1) × (n+1) table with base row/column 0..n and 0..m. Fill row by row using the recurrence. Can be reduced to two rows (or one row plus a saved diagonal).",
    complexity: { time: "O(m · n)", space: "O(n) with rolling rows" },
    pitfalls: [
      "Base cases left at 0 — converting to/from the empty string costs its length.",
      "Indexing word1[i] instead of word1[i − 1] with a 1-based table.",
      "Overwriting the diagonal value before using it when compressing to one row.",
    ],
    solution: {
      js: code`
function minDistance(word1, word2) {
  const m = word1.length, n = word2.length;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = word1[i - 1] === word2[j - 1]
        ? prev[j - 1]
        : 1 + Math.min(prev[j], cur[j - 1], prev[j - 1]);
    }
    prev = cur;
  }
  return prev[n];
}`,
      py: code`
def min_distance(word1, word2):
    m, n = len(word1), len(word2)
    prev = list(range(n + 1))
    for i in range(1, m + 1):
        cur = [i] + [0] * n
        for j in range(1, n + 1):
            if word1[i - 1] == word2[j - 1]:
                cur[j] = prev[j - 1]
            else:
                cur[j] = 1 + min(prev[j], cur[j - 1], prev[j - 1])
        prev = cur
    return prev[n]`,
    },
  }),

  define({
    id: "longest-common-subsequence",
    title: "Longest Common Subsequence",
    difficulty: "Medium",
    track: "dp",
    pattern: "String DP",
    weeks: [5],
    link: "https://leetcode.com/problems/longest-common-subsequence/",
    statement: "Return the length of the longest subsequence common to `text1` and `text2` (characters in order, not necessarily contiguous), or 0 if none.",
    params: ["text1", "text2"],
    fn: { js: "longestCommonSubsequence", py: "longest_common_subsequence" },
    tests: [
      { args: ["abcde", "ace"], expected: 3 },
      { args: ["abc", "abc"], expected: 3 },
      { args: ["abc", "def"], expected: 0 },
      { args: ["bsbininm", "jmjkbkjkv"], expected: 1 },
      { args: ["ezupkr", "ubmrapg"], expected: 2 },
      { args: ["oxcpqrsvwf", "shmtulqrypy"], expected: 2 },
    ],
    constraints: ["1 ≤ text1.length, text2.length ≤ 1000", "Lowercase letters"],
    hints: [
      "dp[i][j] = LCS of text1[:i] and text2[:j].",
      "Match: dp[i−1][j−1] + 1. No match: max(dp[i−1][j], dp[i][j−1]).",
    ],
    approach: "2D table (or two rolling rows). On equal characters extend the diagonal; otherwise take the better of dropping a character from either string.",
    complexity: { time: "O(m · n)", space: "O(min(m, n)) with rolling rows" },
    pitfalls: [
      "Confusing subsequence with substring (resetting to 0 on mismatch).",
      "On mismatch using dp[i−1][j−1] instead of max of the two neighbours.",
    ],
    solution: {
      js: code`
function longestCommonSubsequence(text1, text2) {
  const n = text2.length;
  let prev = new Array(n + 1).fill(0);
  for (let i = 1; i <= text1.length; i++) {
    const cur = new Array(n + 1).fill(0);
    for (let j = 1; j <= n; j++) {
      cur[j] = text1[i - 1] === text2[j - 1] ? prev[j - 1] + 1 : Math.max(prev[j], cur[j - 1]);
    }
    prev = cur;
  }
  return prev[n];
}`,
      py: code`
def longest_common_subsequence(text1, text2):
    n = len(text2)
    prev = [0] * (n + 1)
    for a in text1:
        cur = [0] * (n + 1)
        for j in range(1, n + 1):
            cur[j] = prev[j - 1] + 1 if a == text2[j - 1] else max(prev[j], cur[j - 1])
        prev = cur
    return prev[n]`,
    },
  }),

  define({
    id: "partition-equal-subset-sum",
    title: "Partition Equal Subset Sum",
    difficulty: "Medium",
    track: "dp",
    pattern: "0/1 knapsack",
    weeks: [8],
    link: "https://leetcode.com/problems/partition-equal-subset-sum/",
    statement: "Given positive integers `nums`, return whether the array can be split into two subsets with equal sums.",
    params: ["nums"],
    fn: { js: "canPartition", py: "can_partition" },
    tests: [
      { args: [[1, 5, 11, 5]], expected: true },
      { args: [[1, 2, 3, 5]], expected: false },
      { args: [[1, 1]], expected: true },
      { args: [[2]], expected: false },
      { args: [[3, 3, 3, 4, 5]], expected: true },
      { args: [[1, 2, 5]], expected: false, note: "Even total but no subset hits half" },
      { args: [[2, 2, 3, 5]], expected: false, note: "Each number may be used only once" },
    ],
    constraints: ["1 ≤ nums.length ≤ 200", "1 ≤ nums[i] ≤ 100"],
    hints: [
      "If the total is odd, it's impossible. Otherwise: is there a subset summing to total / 2?",
      "0/1 knapsack: can[s] = whether some subset of the numbers seen so far sums to s.",
      "Iterate s downward so each number is used at most once.",
    ],
    approach: "`target = total / 2`. Boolean array `can[0..target]` with `can[0] = true`. For each number x, for s from target down to x: `can[s] ||= can[s - x]`. Answer `can[target]`.",
    complexity: { time: "O(n · target)", space: "O(target)" },
    pitfalls: [
      "Iterating s upward — reuses the same number (becomes unbounded knapsack); [2,2,3,5] wrongly returns true.",
      "Not checking for an odd total first.",
      "Backtracking over all subsets — 2²⁰⁰.",
    ],
    solution: {
      js: code`
function canPartition(nums) {
  const total = nums.reduce((a, b) => a + b, 0);
  if (total % 2) return false;
  const target = total / 2;
  const can = new Array(target + 1).fill(false);
  can[0] = true;
  for (const x of nums) {
    for (let s = target; s >= x; s--) if (can[s - x]) can[s] = true;
  }
  return can[target];
}`,
      py: code`
def can_partition(nums):
    total = sum(nums)
    if total % 2:
        return False
    reachable = 1  # bit s set => some subset sums to s
    for x in nums:
        reachable |= reachable << x
    return bool(reachable >> (total // 2) & 1)`,
    },
  }),

  define({
    id: "target-sum",
    title: "Target Sum",
    difficulty: "Medium",
    track: "dp",
    pattern: "0/1 knapsack (counting)",
    weeks: [8],
    link: "https://leetcode.com/problems/target-sum/",
    statement: "Put a `+` or `-` in front of every number in `nums` and evaluate the expression. Return how many different sign assignments evaluate to `target`.",
    params: ["nums", "target"],
    fn: { js: "findTargetSumWays", py: "find_target_sum_ways" },
    tests: [
      { args: [[1, 1, 1, 1, 1], 3], expected: 5 },
      { args: [[1], 1], expected: 1 },
      { args: [[1], 2], expected: 0 },
      { args: [[0, 0, 0, 0, 0, 0, 0, 0, 1], 1], expected: 256, note: "Each zero doubles the count (+0 and −0)" },
      { args: [[1, 0], 1], expected: 2 },
      { args: [[2, 3, 5], 0], expected: 2 },
      { args: [[1, 2, 7], -100], expected: 0, note: "Unreachable negative target" },
    ],
    constraints: ["1 ≤ nums.length ≤ 20", "0 ≤ nums[i] ≤ 1000", "-1000 ≤ target ≤ 1000"],
    hints: [
      "Let P be the numbers with '+' and N those with '−'. P − N = target and P + N = total.",
      "So P = (total + target) / 2: count subsets summing to that.",
      "If total + target is odd or negative (or |target| > total), the answer is 0.",
    ],
    approach: "Reduce to counting subsets with sum `(total + target) / 2`, using a 1D counting knapsack iterated downward: `ways[s] += ways[s - x]`, with `ways[0] = 1`. Zeros are handled naturally (each doubles the count).",
    complexity: { time: "O(n · total)", space: "O(total)" },
    pitfalls: [
      "Not guarding against odd (total + target) or |target| > total — negative array sizes or wrong counts.",
      "Iterating upward (counts each number multiple times).",
      "Memo key on index only, ignoring the running sum.",
    ],
    solution: {
      js: code`
function findTargetSumWays(nums, target) {
  const total = nums.reduce((a, b) => a + b, 0);
  if (Math.abs(target) > total || (total + target) % 2) return 0;
  const goal = (total + target) / 2;
  const ways = new Array(goal + 1).fill(0);
  ways[0] = 1;
  for (const x of nums) {
    for (let s = goal; s >= x; s--) ways[s] += ways[s - x];
  }
  return ways[goal];
}`,
      py: code`
def find_target_sum_ways(nums, target):
    total = sum(nums)
    if abs(target) > total or (total + target) % 2:
        return 0
    goal = (total + target) // 2
    ways = [1] + [0] * goal
    for x in nums:
        for s in range(goal, x - 1, -1):
            ways[s] += ways[s - x]
    return ways[goal]`,
    },
  }),

  define({
    id: "best-time-to-buy-and-sell-stock-with-cooldown",
    title: "Best Time to Buy and Sell Stock with Cooldown",
    difficulty: "Medium",
    track: "dp",
    pattern: "State machine DP",
    weeks: [10],
    link: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock-with-cooldown/",
    statement: "`prices[i]` is a stock's price on day i. You may complete as many buy/sell transactions as you like, holding at most one share at a time, but after you sell you must wait one day (cooldown) before buying again. Return the maximum profit.",
    params: ["prices"],
    fn: { js: "maxProfit", py: "max_profit" },
    tests: [
      { args: [[1, 2, 3, 0, 2]], expected: 3 },
      { args: [[1]], expected: 0 },
      { args: [[1, 2]], expected: 1 },
      { args: [[2, 1]], expected: 0, note: "Never buying is allowed" },
      { args: [[1, 2, 4]], expected: 3 },
      { args: [[6, 1, 3, 2, 4, 7]], expected: 6 },
      { args: [[1, 4, 2, 7]], expected: 6, note: "The cooldown blocks 1→4, 2→7 (that would be 8)" },
    ],
    constraints: ["1 ≤ prices.length ≤ 5000", "0 ≤ prices[i] ≤ 1000"],
    hints: [
      "Model each day with three states: holding a share, just sold (cooling down), or resting without a share.",
      "hold = max(hold, rest − price); sold = hold + price; rest = max(rest, sold_prev).",
    ],
    approach: "State machine. `hold` = best profit while holding; `sold` = best profit having sold today; `rest` = best profit, not holding, free to buy. Each day: `newHold = max(hold, rest - p)`, `newSold = hold + p`, `newRest = max(rest, sold)`. Answer `max(sold, rest)`.",
    complexity: { time: "O(n)", space: "O(1)" },
    pitfalls: [
      "Buying from the 'sold' state (ignores the cooldown).",
      "Updating states in place so today's buy uses today's sale — compute new values from the previous day's values.",
      "Starting hold at 0 instead of −Infinity (or −prices[0]).",
    ],
    solution: {
      js: code`
function maxProfit(prices) {
  let hold = -Infinity, sold = 0, rest = 0;
  for (const p of prices) {
    [hold, sold, rest] = [Math.max(hold, rest - p), hold + p, Math.max(rest, sold)];
  }
  return Math.max(sold, rest);
}`,
      py: code`
def max_profit(prices):
    hold, sold, rest = -inf, 0, 0
    for p in prices:
        hold, sold, rest = max(hold, rest - p), hold + p, max(rest, sold)
    return max(sold, rest)`,
    },
  }),
];
