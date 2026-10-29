import { define, code } from "../define.js";

export default [
  define({
    id: "climbing-stairs",
    title: "Climbing Stairs",
    difficulty: "Easy",
    track: "dp",
    pattern: "1D DP · Fibonacci",
    weeks: [3],
    link: "https://leetcode.com/problems/climbing-stairs/",
    statement: "You climb a staircase of `n` steps, taking 1 or 2 steps at a time. In how many distinct ways can you reach the top?",
    params: ["n"],
    fn: { js: "climbStairs", py: "climb_stairs" },
    tests: [
      { args: [2], expected: 2 },
      { args: [3], expected: 3 },
      { args: [1], expected: 1 },
      { args: [5], expected: 8 },
      { args: [10], expected: 89 },
      { args: [45], expected: 1836311903, note: "Plain recursion without memoisation times out here" },
    ],
    constraints: ["1 ≤ n ≤ 45"],
    hints: ["The last move was either 1 step (from n−1) or 2 steps (from n−2).", "ways(n) = ways(n−1) + ways(n−2). You only need the last two values."],
    approach: "State: `ways[i]` = ways to reach step i. Recurrence `ways[i] = ways[i-1] + ways[i-2]`, base `ways[0] = 1, ways[1] = 1`. Keep two rolling variables for O(1) space.",
    complexity: { time: "O(n)", space: "O(1)" },
    pitfalls: ["Naive recursion — O(2ⁿ), n = 45 times out.", "Base cases off by one (returning 0 for n = 1).", "Looping to n − 1 instead of n."],
    solution: {
      js: code`
function climbStairs(n) {
  let a = 1, b = 1; // ways(i - 2), ways(i - 1)
  for (let i = 2; i <= n; i++) [a, b] = [b, a + b];
  return b;
}`,
      py: code`
def climb_stairs(n):
    a, b = 1, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    return b`,
    },
  }),

  define({
    id: "house-robber",
    title: "House Robber",
    difficulty: "Medium",
    track: "dp",
    pattern: "1D DP · take / skip",
    weeks: [3],
    link: "https://leetcode.com/problems/house-robber/",
    statement: "Houses in a row hold `nums[i]` money. You can't rob two adjacent houses. Return the maximum amount you can rob.",
    params: ["nums"],
    fn: { js: "rob", py: "rob" },
    tests: [
      { args: [[1, 2, 3, 1]], expected: 4 },
      { args: [[2, 7, 9, 3, 1]], expected: 12 },
      { args: [[5]], expected: 5 },
      { args: [[2, 1, 1, 2]], expected: 4, note: "Skipping two houses in a row can be optimal" },
      { args: [[0, 0]], expected: 0 },
      { args: [[1, 3, 1]], expected: 3 },
    ],
    constraints: ["1 ≤ nums.length ≤ 100", "0 ≤ nums[i] ≤ 400"],
    hints: ["At house i: either rob it (plus best up to i−2) or skip it (best up to i−1).", "dp[i] = max(dp[i−1], dp[i−2] + nums[i])."],
    approach: "`best(i) = max(best(i-1), best(i-2) + nums[i])`. Roll two variables: `prev2` (best up to i−2) and `prev1` (best up to i−1).",
    complexity: { time: "O(n)", space: "O(1)" },
    pitfalls: [
      "Greedy 'take every other house' (odd vs even indices) — fails on [2,1,1,2].",
      "Index errors for arrays of length 1 or 2 when using dp[i-2] without guards.",
    ],
    solution: {
      js: code`
function rob(nums) {
  let prev2 = 0, prev1 = 0;
  for (const x of nums) [prev2, prev1] = [prev1, Math.max(prev1, prev2 + x)];
  return prev1;
}`,
      py: code`
def rob(nums):
    prev2 = prev1 = 0
    for x in nums:
        prev2, prev1 = prev1, max(prev1, prev2 + x)
    return prev1`,
    },
  }),

  define({
    id: "house-robber-ii",
    title: "House Robber II",
    difficulty: "Medium",
    track: "dp",
    pattern: "1D DP · take / skip",
    weeks: [3],
    link: "https://leetcode.com/problems/house-robber-ii/",
    statement: "Same as House Robber, but the houses are arranged in a **circle**: the first and last houses are adjacent. Return the maximum you can rob.",
    params: ["nums"],
    fn: { js: "robCircle", py: "rob_circle" },
    tests: [
      { args: [[2, 3, 2]], expected: 3 },
      { args: [[1, 2, 3, 1]], expected: 4 },
      { args: [[1, 2, 3]], expected: 3 },
      { args: [[5]], expected: 5, note: "One house — excluding both ends would give 0" },
      { args: [[1, 2]], expected: 2 },
      { args: [[200, 3, 140, 20, 10]], expected: 340 },
    ],
    constraints: ["1 ≤ nums.length ≤ 100", "0 ≤ nums[i] ≤ 1000"],
    hints: ["You can't take both the first and last house.", "So the answer is the better of: rob houses [0..n−2], or rob houses [1..n−1]."],
    approach: "Run the linear House Robber on `nums[0..n-2]` and on `nums[1..n-1]` and take the max. Special-case n = 1.",
    complexity: { time: "O(n)", space: "O(1)" },
    pitfalls: ["Missing the n = 1 case — both slices are empty and you return 0.", "Excluding both ends at once (slice 1..n−2), which misses answers using one end."],
    solution: {
      js: code`
function robCircle(nums) {
  if (nums.length === 1) return nums[0];
  const line = (lo, hi) => {
    let prev2 = 0, prev1 = 0;
    for (let i = lo; i <= hi; i++) [prev2, prev1] = [prev1, Math.max(prev1, prev2 + nums[i])];
    return prev1;
  };
  return Math.max(line(0, nums.length - 2), line(1, nums.length - 1));
}`,
      py: code`
def rob_circle(nums):
    if len(nums) == 1:
        return nums[0]

    def line(arr):
        prev2 = prev1 = 0
        for x in arr:
            prev2, prev1 = prev1, max(prev1, prev2 + x)
        return prev1

    return max(line(nums[:-1]), line(nums[1:]))`,
    },
  }),

  define({
    id: "coin-change",
    title: "Coin Change",
    difficulty: "Medium",
    track: "dp",
    pattern: "Unbounded knapsack",
    weeks: [4],
    link: "https://leetcode.com/problems/coin-change/",
    statement: "Given coin denominations `coins` (unlimited supply of each) and an `amount`, return the fewest coins that sum to `amount`, or -1 if it can't be made.",
    params: ["coins", "amount"],
    fn: { js: "coinChange", py: "coin_change" },
    tests: [
      { args: [[1, 2, 5], 11], expected: 3 },
      { args: [[2], 3], expected: -1 },
      { args: [[1], 0], expected: 0, note: "Zero amount needs zero coins" },
      { args: [[2, 5, 10, 1], 27], expected: 4 },
      { args: [[3, 7], 5], expected: -1 },
      { args: [[1, 3, 4], 6], expected: 2, note: "Greedy (4+1+1) gives 3; optimal is 3+3" },
      { args: [[186, 419, 83, 408], 6249], expected: 20 },
    ],
    constraints: ["1 ≤ coins.length ≤ 12", "1 ≤ coins[i] ≤ 2³¹ − 1", "0 ≤ amount ≤ 10⁴"],
    hints: [
      "Greedy (largest coin first) is wrong for arbitrary denominations.",
      "dp[a] = fewest coins to make a. dp[a] = 1 + min over coins c ≤ a of dp[a − c].",
      "Initialise dp with Infinity (unreachable) and dp[0] = 0.",
    ],
    approach: "Bottom-up over amounts: `dp[0] = 0`, others Infinity. For each `a` from 1 to amount and each coin `c <= a`, `dp[a] = min(dp[a], dp[a - c] + 1)`. Answer `dp[amount]` or -1 if still Infinity.",
    complexity: { time: "O(amount · coins)", space: "O(amount)" },
    pitfalls: [
      "Greedy by largest coin.",
      "Initialising dp with 0 — min() then always returns 0.",
      "Using amount + 1 as 'infinity' but forgetting to convert it to −1.",
      "Recursion without memo — exponential.",
    ],
    solution: {
      js: code`
function coinChange(coins, amount) {
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let a = 1; a <= amount; a++) {
    for (const c of coins) if (c <= a && dp[a - c] + 1 < dp[a]) dp[a] = dp[a - c] + 1;
  }
  return dp[amount] === Infinity ? -1 : dp[amount];
}`,
      py: code`
def coin_change(coins, amount):
    dp = [0] + [inf] * amount
    for a in range(1, amount + 1):
        for c in coins:
            if c <= a and dp[a - c] + 1 < dp[a]:
                dp[a] = dp[a - c] + 1
    return -1 if dp[amount] == inf else dp[amount]`,
    },
  }),

  define({
    id: "decode-ways",
    title: "Decode Ways",
    difficulty: "Medium",
    track: "dp",
    pattern: "1D DP · string",
    weeks: [4],
    link: "https://leetcode.com/problems/decode-ways/",
    statement: "Letters A–Z are encoded as \"1\"–\"26\". Given a digit string `s`, return the number of ways to decode it. A part may not have a leading zero (\"06\" is invalid).",
    params: ["s"],
    fn: { js: "numDecodings", py: "num_decodings" },
    tests: [
      { args: ["12"], expected: 2 },
      { args: ["226"], expected: 3 },
      { args: ["06"], expected: 0, note: "Leading zero" },
      { args: ["0"], expected: 0 },
      { args: ["10"], expected: 1 },
      { args: ["2101"], expected: 1 },
      { args: ["11106"], expected: 2 },
      { args: ["27"], expected: 1, note: "27 > 26" },
      { args: ["1201234"], expected: 3 },
    ],
    constraints: ["1 ≤ s.length ≤ 100", "s contains only digits"],
    hints: [
      "dp[i] = number of ways to decode the first i characters.",
      "The last part is either one digit (valid if it isn't '0') or two digits (valid if 10..26).",
    ],
    approach: "`dp[0] = 1`. For i from 1..n: if `s[i-1] != '0'` add `dp[i-1]`; if i ≥ 2 and `s[i-2..i-1]` is between \"10\" and \"26\" add `dp[i-2]`. Roll two variables for O(1) space.",
    complexity: { time: "O(n)", space: "O(1)" },
    pitfalls: [
      "Accepting two-digit parts starting with 0 (\"06\").",
      "Treating '0' as a valid single digit.",
      "Comparing strings lexicographically ('3' > '26') instead of numerically.",
    ],
    solution: {
      js: code`
function numDecodings(s) {
  let prev2 = 1, prev1 = s[0] === "0" ? 0 : 1; // dp[i-2], dp[i-1]
  for (let i = 2; i <= s.length; i++) {
    let cur = 0;
    if (s[i - 1] !== "0") cur += prev1;
    const two = Number(s.slice(i - 2, i));
    if (two >= 10 && two <= 26) cur += prev2;
    [prev2, prev1] = [prev1, cur];
  }
  return prev1;
}`,
      py: code`
def num_decodings(s):
    prev2, prev1 = 1, (0 if s[0] == "0" else 1)
    for i in range(2, len(s) + 1):
        cur = 0
        if s[i - 1] != "0":
            cur += prev1
        if 10 <= int(s[i - 2:i]) <= 26:
            cur += prev2
        prev2, prev1 = prev1, cur
    return prev1`,
    },
  }),

  define({
    id: "longest-increasing-subsequence",
    title: "Longest Increasing Subsequence",
    difficulty: "Medium",
    track: "dp",
    pattern: "LIS · patience sorting",
    weeks: [6],
    link: "https://leetcode.com/problems/longest-increasing-subsequence/",
    statement: "Return the length of the longest **strictly** increasing subsequence of `nums`. Can you do it in O(n log n)?",
    params: ["nums"],
    fn: { js: "lengthOfLIS", py: "length_of_lis" },
    tests: [
      { args: [[10, 9, 2, 5, 3, 7, 101, 18]], expected: 4 },
      { args: [[0, 1, 0, 3, 2, 3]], expected: 4 },
      { args: [[7, 7, 7, 7]], expected: 1, note: "Strictly increasing — equal values don't extend" },
      { args: [[1]], expected: 1 },
      { args: [[4, 10, 4, 3, 8, 9]], expected: 3 },
      { args: [[1, 3, 6, 7, 9, 4, 10, 5, 6]], expected: 6 },
    ],
    constraints: ["1 ≤ nums.length ≤ 2500", "-10⁴ ≤ nums[i] ≤ 10⁴"],
    hints: [
      "O(n²): dp[i] = 1 + max dp[j] over j < i with nums[j] < nums[i].",
      "O(n log n): keep tails[k] = smallest possible tail of an increasing subsequence of length k + 1.",
      "For each x, binary search the first tail ≥ x and replace it (or append if none).",
    ],
    approach: "Patience sorting. `tails` is sorted; for each x, find the leftmost index with `tails[i] >= x` (lower bound) and set `tails[i] = x`, appending if i equals the length. The length of `tails` is the answer (tails itself is not necessarily a valid subsequence).",
    complexity: { time: "O(n log n)", space: "O(n)" },
    pitfalls: [
      "Upper bound (first tail > x) instead of lower bound — counts equal values, so [7,7,7,7] returns 4.",
      "Returning tails as if it were the actual subsequence.",
      "Initialising every dp[i] to 0 instead of 1 in the O(n²) version.",
    ],
    solution: {
      js: code`
function lengthOfLIS(nums) {
  const tails = [];
  for (const x of nums) {
    let lo = 0, hi = tails.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (tails[mid] < x) lo = mid + 1;
      else hi = mid;
    }
    tails[lo] = x;
  }
  return tails.length;
}`,
      py: code`
def length_of_lis(nums):
    tails = []
    for x in nums:
        i = bisect.bisect_left(tails, x)
        if i == len(tails):
            tails.append(x)
        else:
            tails[i] = x
    return len(tails)`,
    },
  }),
];
