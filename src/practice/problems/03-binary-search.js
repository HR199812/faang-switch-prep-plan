import { define, code } from "../define.js";

export default [
  define({
    id: "binary-search",
    title: "Binary Search",
    difficulty: "Easy",
    track: "dsa",
    pattern: "Binary search",
    weeks: [4],
    link: "https://leetcode.com/problems/binary-search/",
    statement: "Given a sorted (ascending) array of distinct integers `nums` and a `target`, return the index of `target`, or -1 if it isn't present. Must run in O(log n).",
    params: ["nums", "target"],
    fn: { js: "search", py: "search" },
    tests: [
      { args: [[-1, 0, 3, 5, 9, 12], 9], expected: 4 },
      { args: [[-1, 0, 3, 5, 9, 12], 2], expected: -1 },
      { args: [[5], 5], expected: 0 },
      { args: [[5], -5], expected: -1 },
      { args: [[1, 3], 3], expected: 1, note: "Target at the last index" },
      { args: [[1, 3, 5, 7, 9, 11, 13], 1], expected: 0 },
      { args: [[1, 3, 5, 7, 9, 11, 13], 14], expected: -1, note: "Larger than everything" },
    ],
    constraints: ["1 ≤ nums.length ≤ 10⁴", "All values distinct, sorted ascending"],
    hints: ["Keep an inclusive range [lo, hi] and loop while lo ≤ hi.", "Each step, discard the half that can't contain target."],
    approach: "Inclusive bounds `lo = 0`, `hi = n - 1`. While `lo <= hi`: `mid = lo + ((hi - lo) >> 1)`; return mid on a hit, otherwise move `lo = mid + 1` or `hi = mid - 1`.",
    complexity: { time: "O(log n)", space: "O(1)" },
    pitfalls: [
      "Mixing conventions: `while (lo < hi)` with `hi = mid - 1` skips the last candidate.",
      "Setting lo = mid (instead of mid + 1) — infinite loop when lo + 1 == hi.",
      "JS: `(lo + hi) / 2` without flooring gives a fractional index.",
    ],
    solution: {
      js: code`
function search(nums, target) {
  let lo = 0, hi = nums.length - 1;
  while (lo <= hi) {
    const mid = lo + ((hi - lo) >> 1);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}`,
      py: code`
def search(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        if nums[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1`,
    },
  }),

  define({
    id: "search-rotated-sorted-array",
    title: "Search in Rotated Sorted Array",
    difficulty: "Medium",
    track: "dsa",
    pattern: "Binary search",
    weeks: [4],
    link: "https://leetcode.com/problems/search-in-rotated-sorted-array/",
    statement: "An ascending array of distinct integers was rotated at an unknown pivot (e.g. `[0,1,2,4,5,6,7]` → `[4,5,6,7,0,1,2]`). Given the rotated array `nums` and `target`, return the index of `target` or -1, in O(log n).",
    params: ["nums", "target"],
    fn: { js: "searchRotated", py: "search_rotated" },
    tests: [
      { args: [[4, 5, 6, 7, 0, 1, 2], 0], expected: 4 },
      { args: [[4, 5, 6, 7, 0, 1, 2], 3], expected: -1 },
      { args: [[1], 0], expected: -1 },
      { args: [[1], 1], expected: 0 },
      { args: [[3, 1], 1], expected: 1 },
      { args: [[5, 1, 3], 5], expected: 0 },
      { args: [[1, 2, 3, 4, 5], 4], expected: 3, note: "Not rotated at all" },
      { args: [[6, 7, 8, 1, 2, 3, 4, 5], 8], expected: 2 },
    ],
    constraints: ["1 ≤ nums.length ≤ 5000", "Values are distinct"],
    hints: [
      "At any mid, at least one of the halves [lo, mid] or [mid, hi] is sorted.",
      "Check whether target lies inside the sorted half's range; if so search there, otherwise search the other half.",
    ],
    approach: "Standard binary search, but decide direction by finding the sorted half. If `nums[lo] <= nums[mid]`, the left half is sorted: go left when `nums[lo] <= target < nums[mid]`, else right. Otherwise the right half is sorted: go right when `nums[mid] < target <= nums[hi]`, else left.",
    complexity: { time: "O(log n)", space: "O(1)" },
    pitfalls: [
      "Using `<` instead of `<=` in nums[lo] <= nums[mid] — breaks when lo == mid (2-element windows like [3,1]).",
      "Strict vs inclusive bounds on the target range check: target can equal nums[lo] or nums[hi].",
      "Finding the pivot first and then searching works, but is easy to get off by one — be deliberate.",
    ],
    solution: {
      js: code`
function searchRotated(nums, target) {
  let lo = 0, hi = nums.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (nums[mid] === target) return mid;
    if (nums[lo] <= nums[mid]) {
      if (nums[lo] <= target && target < nums[mid]) hi = mid - 1;
      else lo = mid + 1;
    } else {
      if (nums[mid] < target && target <= nums[hi]) lo = mid + 1;
      else hi = mid - 1;
    }
  }
  return -1;
}`,
      py: code`
def search_rotated(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        if nums[lo] <= nums[mid]:
            if nums[lo] <= target < nums[mid]:
                hi = mid - 1
            else:
                lo = mid + 1
        else:
            if nums[mid] < target <= nums[hi]:
                lo = mid + 1
            else:
                hi = mid - 1
    return -1`,
    },
  }),

  define({
    id: "ship-packages-within-d-days",
    title: "Capacity To Ship Packages Within D Days",
    difficulty: "Medium",
    track: "dsa",
    pattern: "Binary search on answer",
    weeks: [4],
    link: "https://leetcode.com/problems/capacity-to-ship-packages-within-d-days/",
    statement: "Packages with `weights` must be shipped **in order** within `days` days. Each day you load consecutive packages onto a ship without exceeding its capacity. Return the least ship capacity that ships everything within `days` days.",
    params: ["weights", "days"],
    fn: { js: "shipWithinDays", py: "ship_within_days" },
    tests: [
      { args: [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 5], expected: 15 },
      { args: [[3, 2, 2, 4, 1, 4], 3], expected: 6 },
      { args: [[1, 2, 3, 1, 1], 4], expected: 3 },
      { args: [[10], 1], expected: 10 },
      { args: [[5, 5, 5, 5], 4], expected: 5, note: "One package per day — answer is the max weight" },
      { args: [[1, 2, 3, 4], 1], expected: 10, note: "One day — answer is the total" },
    ],
    constraints: ["1 ≤ days ≤ weights.length ≤ 5·10⁴", "1 ≤ weights[i] ≤ 500"],
    hints: [
      "If capacity C works, every capacity above C works too — feasibility is monotonic.",
      "The answer lies between max(weights) and sum(weights).",
      "Binary search the smallest capacity whose greedy day-count is ≤ days.",
    ],
    approach: "Binary search on the answer in `[max(weights), sum(weights)]`. A greedy check counts days needed for a capacity: fill the ship until the next package won't fit, then start a new day. Find the lowest capacity with `daysNeeded <= days` using `lo < hi`, `hi = mid` on success, `lo = mid + 1` on failure.",
    complexity: { time: "O(n log(sum))", space: "O(1)" },
    pitfalls: [
      "Lower bound of 1 instead of max(weights): a capacity below the heaviest package makes the greedy loop count wrong (or loop forever).",
      "Starting the day counter at 0 instead of 1.",
      "Using `lo <= hi` with `hi = mid` — infinite loop.",
    ],
    solution: {
      js: code`
function shipWithinDays(weights, days) {
  let lo = Math.max(...weights), hi = weights.reduce((a, b) => a + b, 0);
  const daysNeeded = (cap) => {
    let d = 1, load = 0;
    for (const w of weights) {
      if (load + w > cap) { d++; load = 0; }
      load += w;
    }
    return d;
  };
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (daysNeeded(mid) <= days) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}`,
      py: code`
def ship_within_days(weights, days):
    def days_needed(cap):
        d, load = 1, 0
        for w in weights:
            if load + w > cap:
                d += 1
                load = 0
            load += w
        return d

    lo, hi = max(weights), sum(weights)
    while lo < hi:
        mid = (lo + hi) // 2
        if days_needed(mid) <= days:
            hi = mid
        else:
            lo = mid + 1
    return lo`,
    },
  }),

  define({
    id: "subarray-sum-equals-k",
    title: "Subarray Sum Equals K",
    difficulty: "Medium",
    track: "dsa",
    pattern: "Prefix sums",
    weeks: [4],
    link: "https://leetcode.com/problems/subarray-sum-equals-k/",
    statement: "Given an integer array `nums` (values may be negative) and an integer `k`, return the number of contiguous subarrays whose sum equals `k`.",
    params: ["nums", "k"],
    fn: { js: "subarraySum", py: "subarray_sum" },
    tests: [
      { args: [[1, 1, 1], 2], expected: 2 },
      { args: [[1, 2, 3], 3], expected: 2 },
      { args: [[1, -1, 0], 0], expected: 3, note: "Negatives and zeros — a sliding window fails here" },
      { args: [[0, 0, 0], 0], expected: 6 },
      { args: [[5], 5], expected: 1 },
      { args: [[3, 4, 7, 2, -3, 1, 4, 2], 7], expected: 4 },
      { args: [[1, 2, 1, 2, 1], 3], expected: 4 },
    ],
    constraints: ["1 ≤ nums.length ≤ 2·10⁴", "-1000 ≤ nums[i] ≤ 1000", "-10⁷ ≤ k ≤ 10⁷"],
    hints: [
      "sum(i..j) = prefix[j+1] − prefix[i]. You want pairs of prefixes that differ by k.",
      "As you scan, count how many earlier prefixes equal current − k.",
      "Seed the counts with prefix 0 seen once (the empty prefix).",
    ],
    approach: "Running prefix sum with a hash map of how many times each prefix value has occurred, seeded with `{0: 1}`. For each element, add it to `sum`, add `count[sum - k]` to the answer, then increment `count[sum]`.",
    complexity: { time: "O(n)", space: "O(n)" },
    pitfalls: [
      "Using a sliding window — invalid with negative numbers.",
      "Forgetting to seed {0: 1}, which misses subarrays starting at index 0.",
      "Incrementing count[sum] before reading count[sum - k] — over-counts when k = 0.",
    ],
    solution: {
      js: code`
function subarraySum(nums, k) {
  const count = new Map([[0, 1]]);
  let sum = 0, ans = 0;
  for (const x of nums) {
    sum += x;
    ans += count.get(sum - k) || 0;
    count.set(sum, (count.get(sum) || 0) + 1);
  }
  return ans;
}`,
      py: code`
def subarray_sum(nums, k):
    count = Counter({0: 1})
    total = ans = 0
    for x in nums:
        total += x
        ans += count[total - k]
        count[total] += 1
    return ans`,
    },
  }),
];
