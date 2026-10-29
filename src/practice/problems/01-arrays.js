import { define, code } from "../define.js";

export default [
  define({
    id: "two-sum",
    title: "Two Sum",
    difficulty: "Easy",
    track: "dsa",
    pattern: "Hash map",
    weeks: [1],
    link: "https://leetcode.com/problems/two-sum/",
    statement: "Given an integer array `nums` and an integer `target`, return the indices of the two numbers that add up to `target`.\n\nExactly one valid pair exists, and you may not use the same element twice. Return the two indices in any order.",
    params: ["nums", "target"],
    fn: { js: "twoSum", py: "two_sum" },
    compare: "unordered",
    tests: [
      { args: [[2, 7, 11, 15], 9], expected: [0, 1] },
      { args: [[3, 2, 4], 6], expected: [1, 2] },
      { args: [[3, 3], 6], expected: [0, 1], note: "Duplicate values — don't pair an element with itself" },
      { args: [[-1, -2, -3, -4, -5], -8], expected: [2, 4] },
      { args: [[0, 4, 3, 0], 0], expected: [0, 3] },
      { args: [[1, 5, 1000000000, -999999995], 5], expected: [2, 3] },
    ],
    constraints: ["2 ≤ nums.length ≤ 10⁴", "-10⁹ ≤ nums[i], target ≤ 10⁹", "Exactly one answer exists"],
    hints: [
      "For each number x, the partner you need is target − x.",
      "Can you check whether you've already seen that partner in O(1)?",
      "Store value → index in a hash map as you scan. Check before inserting the current value.",
    ],
    approach: "Scan once, keeping a map from each value seen so far to its index. For `nums[i]`, look up `target - nums[i]`; if it's in the map you have the pair. Insert `nums[i]` **after** the lookup so an element is never paired with itself.",
    complexity: { time: "O(n)", space: "O(n)" },
    pitfalls: [
      "Inserting the current value before looking up its complement — `[3,3]` style inputs then pair index 0 with itself.",
      "Using `if (map[x])` in JS: index 0 is falsy. Use `map.has(x)` or `!== undefined`.",
      "Sorting first loses the original indices.",
    ],
    solution: {
      js: code`
function twoSum(nums, target) {
  const seen = new Map(); // value -> index
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);
  }
  return [];
}`,
      py: code`
def two_sum(nums, target):
    seen = {}  # value -> index
    for i, x in enumerate(nums):
        need = target - x
        if need in seen:
            return [seen[need], i]
        seen[x] = i
    return []`,
    },
  }),

  define({
    id: "group-anagrams",
    title: "Group Anagrams",
    difficulty: "Medium",
    track: "dsa",
    pattern: "Hash map",
    weeks: [1],
    link: "https://leetcode.com/problems/group-anagrams/",
    statement: "Given an array of lowercase strings `strs`, group the strings that are anagrams of each other (same letters, same counts, any order).\n\nReturn the groups in any order; strings within a group may also be in any order.",
    params: ["strs"],
    fn: { js: "groupAnagrams", py: "group_anagrams" },
    compare: "nested-unordered",
    tests: [
      { args: [["eat", "tea", "tan", "ate", "nat", "bat"]], expected: [["bat"], ["nat", "tan"], ["ate", "eat", "tea"]] },
      { args: [[""]], expected: [[""]] },
      { args: [["a"]], expected: [["a"]] },
      { args: [["", "", "b"]], expected: [["", ""], ["b"]], note: "Empty strings are anagrams of each other" },
      { args: [["abc", "bca", "cab", "abcd", "dcba", "x"]], expected: [["abc", "bca", "cab"], ["abcd", "dcba"], ["x"]] },
      { args: [["ab", "ba", "aab", "aba", "abb"]], expected: [["ab", "ba"], ["aab", "aba"], ["abb"]], note: "Same letters, different counts aren't anagrams" },
    ],
    constraints: ["1 ≤ strs.length ≤ 10⁴", "0 ≤ strs[i].length ≤ 100", "Lowercase English letters only"],
    hints: [
      "Two strings are anagrams exactly when they have the same canonical form.",
      "Sorting the letters gives a canonical key. A 26-letter count vector is another.",
    ],
    approach: "Map each string to a canonical key — its sorted letters (O(k log k)) or a 26-slot letter count joined into a string (O(k)) — and bucket strings by key in a hash map. The map's values are the groups.",
    complexity: { time: "O(n · k log k) with sorted keys, O(n · k) with count keys", space: "O(n · k)" },
    pitfalls: [
      "Joining counts without a separator: counts [1,11] and [11,1] both become \"111\". Use a delimiter such as '#'.",
      "In Python, using a list as a dict key — convert to a tuple.",
    ],
    solution: {
      js: code`
function groupAnagrams(strs) {
  const groups = new Map();
  for (const s of strs) {
    const key = s.split("").sort().join("");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(s);
  }
  return [...groups.values()];
}`,
      py: code`
def group_anagrams(strs):
    groups = defaultdict(list)
    for s in strs:
        count = [0] * 26
        for ch in s:
            count[ord(ch) - ord("a")] += 1
        groups[tuple(count)].append(s)
    return list(groups.values())`,
    },
  }),

  define({
    id: "single-number",
    title: "Single Number",
    difficulty: "Easy",
    track: "dsa",
    pattern: "Bit manipulation",
    weeks: [11],
    link: "https://leetcode.com/problems/single-number/",
    statement: "Every element of the non-empty integer array `nums` appears exactly twice, except for one element that appears once. Return that element.\n\nAim for O(n) time and O(1) extra space.",
    params: ["nums"],
    fn: { js: "singleNumber", py: "single_number" },
    tests: [
      { args: [[2, 2, 1]], expected: 1 },
      { args: [[4, 1, 2, 1, 2]], expected: 4 },
      { args: [[1]], expected: 1 },
      { args: [[-3, 7, 7]], expected: -3, note: "Negative numbers" },
      { args: [[0, 5, 5, 9, 9]], expected: 0, note: "The answer can be 0" },
    ],
    constraints: ["1 ≤ nums.length ≤ 3·10⁴", "-3·10⁴ ≤ nums[i] ≤ 3·10⁴"],
    hints: ["x ^ x = 0 and x ^ 0 = x.", "XOR is commutative and associative, so order doesn't matter."],
    approach: "XOR every element together. Pairs cancel to 0, leaving only the single element.",
    complexity: { time: "O(n)", space: "O(1)" },
    pitfalls: ["Reaching for a hash set — correct, but O(n) space when the question asks for O(1).", "Starting the accumulator at something other than 0."],
    solution: {
      js: code`
function singleNumber(nums) {
  let x = 0;
  for (const n of nums) x ^= n;
  return x;
}`,
      py: code`
def single_number(nums):
    x = 0
    for n in nums:
        x ^= n
    return x`,
    },
  }),

  define({
    id: "longest-substring-without-repeating",
    title: "Longest Substring Without Repeating Characters",
    difficulty: "Medium",
    track: "dsa",
    pattern: "Sliding window",
    weeks: [3],
    link: "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
    statement: "Given a string `s`, return the length of the longest substring (contiguous) that contains no repeated character.",
    params: ["s"],
    fn: { js: "lengthOfLongestSubstring", py: "length_of_longest_substring" },
    tests: [
      { args: ["abcabcbb"], expected: 3 },
      { args: ["bbbbb"], expected: 1 },
      { args: ["pwwkew"], expected: 3, note: "\"pwke\" is a subsequence, not a substring" },
      { args: [""], expected: 0 },
      { args: [" "], expected: 1 },
      { args: ["abba"], expected: 2, note: "The left edge must never move backwards" },
      { args: ["dvdf"], expected: 3 },
      { args: ["tmmzuxt"], expected: 5 },
    ],
    constraints: ["0 ≤ s.length ≤ 5·10⁴", "s may contain letters, digits, symbols and spaces"],
    hints: [
      "Keep a window [left, right] with no duplicates and grow right one step at a time.",
      "When s[right] is already in the window, move left just past its previous occurrence.",
      "Store each character's last index. Only jump left if that index is inside the current window.",
    ],
    approach: "Variable-size sliding window. Track the last index of each character. For each `right`, if `s[right]` was last seen at index ≥ `left`, move `left` to that index + 1. Update the best length as `right - left + 1`.",
    complexity: { time: "O(n)", space: "O(min(n, alphabet))" },
    pitfalls: [
      "Setting left = last[c] + 1 without taking the max with the current left — \"abba\" moves the window backwards and returns 3.",
      "Counting the answer before moving left.",
      "Returning the substring instead of its length.",
    ],
    solution: {
      js: code`
function lengthOfLongestSubstring(s) {
  const last = new Map();
  let left = 0, best = 0;
  for (let right = 0; right < s.length; right++) {
    const c = s[right];
    if (last.has(c) && last.get(c) >= left) left = last.get(c) + 1;
    last.set(c, right);
    best = Math.max(best, right - left + 1);
  }
  return best;
}`,
      py: code`
def length_of_longest_substring(s):
    last = {}
    left = best = 0
    for right, c in enumerate(s):
        if c in last and last[c] >= left:
            left = last[c] + 1
        last[c] = right
        best = max(best, right - left + 1)
    return best`,
    },
  }),

  define({
    id: "minimum-size-subarray-sum",
    title: "Minimum Size Subarray Sum",
    difficulty: "Medium",
    track: "dsa",
    pattern: "Sliding window",
    weeks: [3],
    link: "https://leetcode.com/problems/minimum-size-subarray-sum/",
    statement: "Given an array of **positive** integers `nums` and a positive integer `target`, return the minimal length of a contiguous subarray whose sum is at least `target`. If there is none, return 0.",
    params: ["target", "nums"],
    fn: { js: "minSubArrayLen", py: "min_sub_array_len" },
    tests: [
      { args: [7, [2, 3, 1, 2, 4, 3]], expected: 2 },
      { args: [4, [1, 4, 4]], expected: 1 },
      { args: [11, [1, 1, 1, 1, 1, 1, 1, 1]], expected: 0, note: "No valid subarray" },
      { args: [15, [1, 2, 3, 4, 5]], expected: 5, note: "Whole array" },
      { args: [3, [3]], expected: 1 },
      { args: [213, [12, 28, 83, 4, 25, 26, 25, 2, 25, 25, 25, 12]], expected: 8 },
    ],
    constraints: ["1 ≤ target ≤ 10⁹", "1 ≤ nums.length ≤ 10⁵", "1 ≤ nums[i] ≤ 10⁴"],
    hints: [
      "All values are positive, so extending a window only increases its sum and shrinking only decreases it.",
      "Grow the right edge; while the sum is ≥ target, record the length and shrink from the left.",
    ],
    approach: "Two pointers over a window with running sum. Add `nums[right]`; while `sum >= target`, update the best length and subtract `nums[left++]`. Positivity guarantees each element enters and leaves the window once.",
    complexity: { time: "O(n)", space: "O(1)" },
    pitfalls: [
      "Using `if` instead of `while` when shrinking — you miss shorter windows.",
      "Initialising best to 0 and taking min — it stays 0. Start at Infinity and map Infinity → 0 at the end.",
      "Assuming this works with negative numbers — it doesn't (that needs prefix sums + a monotonic deque).",
    ],
    solution: {
      js: code`
function minSubArrayLen(target, nums) {
  let left = 0, sum = 0, best = Infinity;
  for (let right = 0; right < nums.length; right++) {
    sum += nums[right];
    while (sum >= target) {
      best = Math.min(best, right - left + 1);
      sum -= nums[left++];
    }
  }
  return best === Infinity ? 0 : best;
}`,
      py: code`
def min_sub_array_len(target, nums):
    left = total = 0
    best = inf
    for right, x in enumerate(nums):
        total += x
        while total >= target:
            best = min(best, right - left + 1)
            total -= nums[left]
            left += 1
    return 0 if best == inf else best`,
    },
  }),

  define({
    id: "container-with-most-water",
    title: "Container With Most Water",
    difficulty: "Medium",
    track: "dsa",
    pattern: "Two pointers",
    weeks: [3],
    link: "https://leetcode.com/problems/container-with-most-water/",
    statement: "`height[i]` is the height of a vertical line at x = i. Choose two lines that, together with the x-axis, hold the most water. Return that maximum area (width × the shorter height).",
    params: ["height"],
    fn: { js: "maxArea", py: "max_area" },
    tests: [
      { args: [[1, 8, 6, 2, 5, 4, 8, 3, 7]], expected: 49 },
      { args: [[1, 1]], expected: 1 },
      { args: [[4, 3, 2, 1, 4]], expected: 16 },
      { args: [[1, 2, 1]], expected: 2 },
      { args: [[0, 0, 0]], expected: 0 },
      { args: [[2, 3, 10, 5, 7, 8, 9]], expected: 36 },
    ],
    constraints: ["2 ≤ height.length ≤ 10⁵", "0 ≤ height[i] ≤ 10⁴"],
    hints: [
      "Start with the widest container: one pointer at each end.",
      "Moving the taller line inward can never help — the width shrinks and the height is still capped by the shorter line.",
    ],
    approach: "Two pointers at both ends. Compute the area, then move the pointer at the **shorter** line inward, because only a taller replacement for the limiting side can beat the current area.",
    complexity: { time: "O(n)", space: "O(1)" },
    pitfalls: [
      "Moving the taller pointer, or both pointers.",
      "Using the taller height in the area formula.",
      "Width off by one: it's right - left, not right - left + 1.",
    ],
    solution: {
      js: code`
function maxArea(height) {
  let l = 0, r = height.length - 1, best = 0;
  while (l < r) {
    best = Math.max(best, (r - l) * Math.min(height[l], height[r]));
    if (height[l] < height[r]) l++;
    else r--;
  }
  return best;
}`,
      py: code`
def max_area(height):
    l, r, best = 0, len(height) - 1, 0
    while l < r:
        best = max(best, (r - l) * min(height[l], height[r]))
        if height[l] < height[r]:
            l += 1
        else:
            r -= 1
    return best`,
    },
  }),

  define({
    id: "three-sum",
    title: "3Sum",
    difficulty: "Medium",
    track: "dsa",
    pattern: "Two pointers",
    weeks: [3],
    link: "https://leetcode.com/problems/3sum/",
    statement: "Given an integer array `nums`, return all **unique** triplets `[a, b, c]` of values at distinct indices such that a + b + c = 0.\n\nTriplets and the values inside them may be in any order, but the same triplet must not appear twice.",
    params: ["nums"],
    fn: { js: "threeSum", py: "three_sum" },
    compare: "nested-unordered",
    tests: [
      { args: [[-1, 0, 1, 2, -1, -4]], expected: [[-1, -1, 2], [-1, 0, 1]] },
      { args: [[0, 1, 1]], expected: [] },
      { args: [[0, 0, 0]], expected: [[0, 0, 0]] },
      { args: [[0, 0, 0, 0]], expected: [[0, 0, 0]], note: "Skip duplicate triplets" },
      { args: [[-2, 0, 1, 1, 2]], expected: [[-2, 0, 2], [-2, 1, 1]] },
      { args: [[-4, -2, -2, -2, 0, 1, 2, 2, 2, 3, 3, 4, 4, 6, 6]], expected: [[-4, -2, 6], [-4, 0, 4], [-4, 1, 3], [-4, 2, 2], [-2, -2, 4], [-2, 0, 2]] },
    ],
    constraints: ["3 ≤ nums.length ≤ 3000", "-10⁵ ≤ nums[i] ≤ 10⁵"],
    hints: [
      "Sort the array. Fix the first element, then the rest is Two Sum on a sorted array.",
      "Two Sum on sorted input: two pointers moving inward.",
      "To avoid duplicates, skip equal values both for the fixed element and after recording a triplet.",
    ],
    approach: "Sort. For each index i (skipping values equal to the previous i), run two pointers `l = i+1`, `r = n-1`. If the sum is too small move `l` right, too big move `r` left; on a hit, record it and advance both pointers past duplicates. Stop early once `nums[i] > 0`.",
    complexity: { time: "O(n²)", space: "O(1) extra (ignoring sort / output)" },
    pitfalls: [
      "Skipping duplicates of nums[i] by comparing with nums[i+1] instead of nums[i-1] — that drops valid triplets like [-1,-1,2].",
      "Forgetting to skip duplicates after a hit, producing repeated triplets.",
      "Using a set of stringified triplets to dedupe — works but hides the real technique interviewers want.",
    ],
    solution: {
      js: code`
function threeSum(nums) {
  nums.sort((a, b) => a - b);
  const out = [];
  for (let i = 0; i < nums.length - 2; i++) {
    if (nums[i] > 0) break;
    if (i > 0 && nums[i] === nums[i - 1]) continue;
    let l = i + 1, r = nums.length - 1;
    while (l < r) {
      const s = nums[i] + nums[l] + nums[r];
      if (s < 0) l++;
      else if (s > 0) r--;
      else {
        out.push([nums[i], nums[l], nums[r]]);
        while (l < r && nums[l] === nums[l + 1]) l++;
        while (l < r && nums[r] === nums[r - 1]) r--;
        l++; r--;
      }
    }
  }
  return out;
}`,
      py: code`
def three_sum(nums):
    nums.sort()
    out = []
    n = len(nums)
    for i in range(n - 2):
        if nums[i] > 0:
            break
        if i > 0 and nums[i] == nums[i - 1]:
            continue
        l, r = i + 1, n - 1
        while l < r:
            s = nums[i] + nums[l] + nums[r]
            if s < 0:
                l += 1
            elif s > 0:
                r -= 1
            else:
                out.append([nums[i], nums[l], nums[r]])
                while l < r and nums[l] == nums[l + 1]:
                    l += 1
                while l < r and nums[r] == nums[r - 1]:
                    r -= 1
                l += 1
                r -= 1
    return out`,
    },
  }),
];
