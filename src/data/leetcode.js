// LeetCode problems for each week of the plan, grouped by the topics in WEEKS (weeks.js).
// Each item is [number, title, difficulty: "E" | "M" | "H"]. Slugs (leetcode.com/problems/<slug>/)
// are derived from titles by slugify(), which matches LeetCode's own rule.
// Free problems only. Revision weeks (17–24) deliberately repeat earlier problems.
// Validated by `npm run check:problems`.

export const slugify = (title) =>
  title.toLowerCase().replace(/[^a-z0-9 -]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-");

export const lcSlug = (item) => slugify(item[1]);
export const lcUrl = (item) => `https://leetcode.com/problems/${lcSlug(item)}/`;

export const LEETCODE = {
  1: [
    { topic: "Arrays & hashing — timed mediums", items: [
      [1, "Two Sum", "E"], [49, "Group Anagrams", "M"], [347, "Top K Frequent Elements", "M"],
      [238, "Product of Array Except Self", "M"], [36, "Valid Sudoku", "M"], [128, "Longest Consecutive Sequence", "M"],
      [53, "Maximum Subarray", "M"], [56, "Merge Intervals", "M"],
    ] },
    { topic: "Strings", items: [[15, "3Sum", "M"], [5, "Longest Palindromic Substring", "M"]] },
    { topic: "Trees & graphs", items: [
      [102, "Binary Tree Level Order Traversal", "M"], [199, "Binary Tree Right Side View", "M"],
      [200, "Number of Islands", "M"], [133, "Clone Graph", "M"],
    ] },
    { topic: "DP cold attempts — no peeking", items: [
      [322, "Coin Change", "M"], [300, "Longest Increasing Subsequence", "M"], [1143, "Longest Common Subsequence", "M"],
      [139, "Word Break", "M"], [152, "Maximum Product Subarray", "M"],
    ] },
  ],
  2: [
    { topic: "NeetCode baseline — would you pass these cold?", items: [
      [217, "Contains Duplicate", "E"], [242, "Valid Anagram", "E"], [125, "Valid Palindrome", "E"],
      [20, "Valid Parentheses", "E"], [121, "Best Time to Buy and Sell Stock", "E"], [206, "Reverse Linked List", "E"],
      [21, "Merge Two Sorted Lists", "E"], [104, "Maximum Depth of Binary Tree", "E"], [226, "Invert Binary Tree", "E"],
      [100, "Same Tree", "E"],
    ] },
  ],
  3: [
    { topic: "Sliding window", items: [
      [643, "Maximum Average Subarray I", "E"], [3, "Longest Substring Without Repeating Characters", "M"],
      [209, "Minimum Size Subarray Sum", "M"], [424, "Longest Repeating Character Replacement", "M"],
      [567, "Permutation in String", "M"], [438, "Find All Anagrams in a String", "M"],
      [76, "Minimum Window Substring", "H"], [239, "Sliding Window Maximum", "H"],
    ] },
    { topic: "Two pointers", items: [
      [680, "Valid Palindrome II", "E"], [167, "Two Sum II - Input Array Is Sorted", "M"],
      [11, "Container With Most Water", "M"], [42, "Trapping Rain Water", "H"],
    ] },
    { topic: "Two pointers on linked lists", items: [
      [141, "Linked List Cycle", "E"], [876, "Middle of the Linked List", "E"], [234, "Palindrome Linked List", "E"],
      [19, "Remove Nth Node From End of List", "M"],
    ] },
    { topic: "1D DP — Fibonacci family", items: [
      [509, "Fibonacci Number", "E"], [1137, "N-th Tribonacci Number", "E"], [70, "Climbing Stairs", "E"],
      [746, "Min Cost Climbing Stairs", "E"], [198, "House Robber", "M"], [213, "House Robber II", "M"],
    ] },
  ],
  4: [
    { topic: "Binary search", items: [
      [704, "Binary Search", "E"], [35, "Search Insert Position", "E"], [74, "Search a 2D Matrix", "M"],
      [34, "Find First and Last Position of Element in Sorted Array", "M"], [33, "Search in Rotated Sorted Array", "M"],
      [153, "Find Minimum in Rotated Sorted Array", "M"], [981, "Time Based Key-Value Store", "M"],
    ] },
    { topic: "Binary search on the answer", items: [
      [875, "Koko Eating Bananas", "M"], [1011, "Capacity To Ship Packages Within D Days", "M"],
      [410, "Split Array Largest Sum", "H"], [4, "Median of Two Sorted Arrays", "H"],
    ] },
    { topic: "Prefix sums & difference arrays", items: [
      [303, "Range Sum Query - Immutable", "E"], [560, "Subarray Sum Equals K", "M"], [974, "Subarray Sums Divisible by K", "M"],
      [525, "Contiguous Array", "M"], [1094, "Car Pooling", "M"], [1109, "Corporate Flight Bookings", "M"],
    ] },
    { topic: "Unbounded knapsack & 1D DP", items: [
      [322, "Coin Change", "M"], [518, "Coin Change II", "M"], [377, "Combination Sum IV", "M"],
      [91, "Decode Ways", "M"], [279, "Perfect Squares", "M"], [64, "Minimum Path Sum", "M"],
    ] },
  ],
  5: [
    { topic: "Binary tree DFS / BFS", items: [
      [94, "Binary Tree Inorder Traversal", "E"], [543, "Diameter of Binary Tree", "E"], [110, "Balanced Binary Tree", "E"],
      [572, "Subtree of Another Tree", "E"], [112, "Path Sum", "E"], [113, "Path Sum II", "M"], [437, "Path Sum III", "M"],
      [103, "Binary Tree Zigzag Level Order Traversal", "M"], [236, "Lowest Common Ancestor of a Binary Tree", "M"],
      [105, "Construct Binary Tree from Preorder and Inorder Traversal", "M"],
    ] },
    { topic: "BST", items: [
      [235, "Lowest Common Ancestor of a Binary Search Tree", "M"], [98, "Validate Binary Search Tree", "M"],
      [230, "Kth Smallest Element in a BST", "M"], [701, "Insert into a Binary Search Tree", "M"], [450, "Delete Node in a BST", "M"],
    ] },
    { topic: "N-ary trees & serialization", items: [
      [589, "N-ary Tree Preorder Traversal", "E"], [429, "N-ary Tree Level Order Traversal", "M"],
      [297, "Serialize and Deserialize Binary Tree", "H"],
    ] },
    { topic: "Grid & string DP", items: [
      [62, "Unique Paths", "M"], [63, "Unique Paths II", "M"], [72, "Edit Distance", "M"],
      [1143, "Longest Common Subsequence", "M"], [516, "Longest Palindromic Subsequence", "M"],
      [647, "Palindromic Substrings", "M"], [115, "Distinct Subsequences", "H"],
    ] },
  ],
  6: [
    { topic: "Heaps & top-K", items: [
      [703, "Kth Largest Element in a Stream", "E"], [1046, "Last Stone Weight", "E"], [215, "Kth Largest Element in an Array", "M"],
      [973, "K Closest Points to Origin", "M"], [621, "Task Scheduler", "M"], [23, "Merge k Sorted Lists", "H"],
      [295, "Find Median from Data Stream", "H"],
    ] },
    { topic: "Stacks & monotonic stack", items: [
      [496, "Next Greater Element I", "E"], [155, "Min Stack", "M"], [150, "Evaluate Reverse Polish Notation", "M"],
      [503, "Next Greater Element II", "M"], [739, "Daily Temperatures", "M"], [84, "Largest Rectangle in Histogram", "H"],
      [85, "Maximal Rectangle", "H"],
    ] },
    { topic: "Segment tree / Fenwick tree", items: [
      [307, "Range Sum Query - Mutable", "M"], [315, "Count of Smaller Numbers After Self", "H"],
    ] },
    { topic: "LIS & interval DP", items: [
      [300, "Longest Increasing Subsequence", "M"], [673, "Number of Longest Increasing Subsequence", "M"],
      [354, "Russian Doll Envelopes", "H"], [312, "Burst Balloons", "H"], [664, "Strange Printer", "H"], [546, "Remove Boxes", "H"],
      [1696, "Jump Game VI", "M"],
    ] },
  ],
  7: [
    { topic: "Tries", items: [
      [14, "Longest Common Prefix", "E"], [208, "Implement Trie (Prefix Tree)", "M"], [648, "Replace Words", "M"],
      [211, "Design Add and Search Words Data Structure", "M"], [212, "Word Search II", "H"],
    ] },
    { topic: "Backtracking", items: [
      [78, "Subsets", "M"], [90, "Subsets II", "M"], [46, "Permutations", "M"], [47, "Permutations II", "M"],
      [77, "Combinations", "M"], [39, "Combination Sum", "M"], [40, "Combination Sum II", "M"],
      [17, "Letter Combinations of a Phone Number", "M"], [22, "Generate Parentheses", "M"], [79, "Word Search", "M"],
      [131, "Palindrome Partitioning", "M"], [51, "N-Queens", "H"], [37, "Sudoku Solver", "H"],
    ] },
    { topic: "Partition / MCM DP & DP on trees", items: [
      [1039, "Minimum Score Triangulation of Polygon", "M"], [132, "Palindrome Partitioning II", "H"],
      [1547, "Minimum Cost to Cut a Stick", "H"], [337, "House Robber III", "M"], [124, "Binary Tree Maximum Path Sum", "H"],
    ] },
  ],
  8: [
    { topic: "Graph traversal & flood fill", items: [
      [733, "Flood Fill", "E"], [200, "Number of Islands", "M"], [695, "Max Area of Island", "M"], [133, "Clone Graph", "M"],
      [417, "Pacific Atlantic Water Flow", "M"], [130, "Surrounded Regions", "M"],
    ] },
    { topic: "Cycles & bipartite graphs", items: [
      [802, "Find Eventual Safe States", "M"], [785, "Is Graph Bipartite?", "M"], [886, "Possible Bipartition", "M"],
    ] },
    { topic: "Multi-source & 0-1 BFS", items: [
      [994, "Rotting Oranges", "M"], [542, "01 Matrix", "M"], [1091, "Shortest Path in Binary Matrix", "M"],
      [1368, "Minimum Cost to Make at Least One Valid Path in a Grid", "H"], [2290, "Minimum Obstacle Removal to Reach Corner", "H"],
    ] },
    { topic: "0/1 knapsack", items: [
      [416, "Partition Equal Subset Sum", "M"], [1049, "Last Stone Weight II", "M"], [494, "Target Sum", "M"],
      [474, "Ones and Zeroes", "M"],
    ] },
  ],
  9: [
    { topic: "Shortest paths", items: [
      [743, "Network Delay Time", "M"], [787, "Cheapest Flights Within K Stops", "M"], [1514, "Path with Maximum Probability", "M"],
      [1631, "Path With Minimum Effort", "M"], [1334, "Find the City With the Smallest Number of Neighbors at a Threshold Distance", "M"],
      [778, "Swim in Rising Water", "H"], [127, "Word Ladder", "H"],
    ] },
    { topic: "Topological sort", items: [
      [207, "Course Schedule", "M"], [210, "Course Schedule II", "M"], [329, "Longest Increasing Path in a Matrix", "H"],
    ] },
    { topic: "Bridges & articulation points", items: [[1192, "Critical Connections in a Network", "H"]] },
    { topic: "DP on graphs & string matching", items: [
      [1976, "Number of Ways to Arrive at Destination", "M"], [44, "Wildcard Matching", "H"], [10, "Regular Expression Matching", "H"],
    ] },
  ],
  10: [
    { topic: "Union-Find", items: [
      [1971, "Find if Path Exists in Graph", "E"], [547, "Number of Provinces", "M"], [684, "Redundant Connection", "M"],
      [721, "Accounts Merge", "M"], [990, "Satisfiability of Equality Equations", "M"],
      [1579, "Remove Max Number of Edges to Keep Graph Fully Traversable", "H"],
    ] },
    { topic: "Minimum spanning tree", items: [
      [1584, "Min Cost to Connect All Points", "M"], [1489, "Find Critical and Pseudo-Critical Edges in Minimum Spanning Tree", "H"],
    ] },
    { topic: "State machine DP — stock problems", items: [
      [121, "Best Time to Buy and Sell Stock", "E"], [122, "Best Time to Buy and Sell Stock II", "M"],
      [123, "Best Time to Buy and Sell Stock III", "H"], [188, "Best Time to Buy and Sell Stock IV", "H"],
      [309, "Best Time to Buy and Sell Stock with Cooldown", "M"], [714, "Best Time to Buy and Sell Stock with Transaction Fee", "M"],
    ] },
    { topic: "Bitmask DP intro", items: [
      [698, "Partition to K Equal Sum Subsets", "M"], [847, "Shortest Path Visiting All Nodes", "H"],
    ] },
  ],
  11: [
    { topic: "Bit manipulation", items: [
      [136, "Single Number", "E"], [191, "Number of 1 Bits", "E"], [338, "Counting Bits", "E"], [231, "Power of Two", "E"],
      [190, "Reverse Bits", "E"], [268, "Missing Number", "E"], [137, "Single Number II", "M"], [260, "Single Number III", "M"],
      [371, "Sum of Two Integers", "M"], [201, "Bitwise AND of Numbers Range", "M"],
    ] },
    { topic: "Math", items: [
      [1979, "Find Greatest Common Divisor of Array", "E"], [204, "Count Primes", "M"], [50, "Pow(x, n)", "M"], [372, "Super Pow", "M"],
    ] },
    { topic: "Bitmask & digit DP", items: [
      [1125, "Smallest Sufficient Team", "H"], [1879, "Minimum XOR Sum of Two Arrays", "H"], [857, "Minimum Cost to Hire K Workers", "H"],
      [357, "Count Numbers with Unique Digits", "M"], [902, "Numbers At Most N Given Digit Set", "H"], [233, "Number of Digit One", "H"],
      [600, "Non-negative Integers without Consecutive Ones", "H"],
    ] },
  ],
  12: [
    { topic: "Design (coding round)", items: [
      [146, "LRU Cache", "M"], [380, "Insert Delete GetRandom O(1)", "M"], [355, "Design Twitter", "M"], [460, "LFU Cache", "H"],
      [432, "All O`one Data Structure", "H"], [381, "Insert Delete GetRandom O(1) - Duplicates allowed", "H"],
      [1206, "Design Skiplist", "H"], [295, "Find Median from Data Stream", "H"],
    ] },
    { topic: "One hard a day", items: [[41, "First Missing Positive", "H"], [239, "Sliding Window Maximum", "H"], [76, "Minimum Window Substring", "H"]] },
    { topic: "3D-state DP & D&C optimisation", items: [
      [741, "Cherry Pickup", "H"], [1463, "Cherry Pickup II", "H"], [1289, "Minimum Falling Path Sum II", "H"],
      [1473, "Paint House III", "H"], [1478, "Allocate Mailboxes", "H"],
    ] },
  ],
  13: [
    { topic: "Segment tree with lazy propagation", items: [
      [699, "Falling Squares", "H"], [715, "Range Module", "H"], [327, "Count of Range Sum", "H"], [493, "Reverse Pairs", "H"],
    ] },
    { topic: "Cycles, SCC & matching", items: [[2360, "Longest Cycle in a Graph", "H"], [1947, "Maximum Compatibility Score Sum", "M"]] },
  ],
  14: [
    { topic: "Gap-fill: linked lists & matrices", items: [
      [2, "Add Two Numbers", "M"], [138, "Copy List with Random Pointer", "M"], [143, "Reorder List", "M"],
      [25, "Reverse Nodes in k-Group", "H"], [48, "Rotate Image", "M"], [54, "Spiral Matrix", "M"], [73, "Set Matrix Zeroes", "M"],
    ] },
    { topic: "Gap-fill: greedy & intervals", items: [
      [31, "Next Permutation", "M"], [55, "Jump Game", "M"], [45, "Jump Game II", "M"], [134, "Gas Station", "M"],
      [763, "Partition Labels", "M"], [57, "Insert Interval", "M"], [435, "Non-overlapping Intervals", "M"],
    ] },
  ],
  15: [
    { topic: "Meta-tagged", items: [
      [938, "Range Sum of BST", "E"], [1249, "Minimum Remove to Make Valid Parentheses", "M"], [528, "Random Pick with Weight", "M"],
      [227, "Basic Calculator II", "M"], [71, "Simplify Path", "M"], [987, "Vertical Order Traversal of a Binary Tree", "H"],
    ] },
    { topic: "Google-tagged", items: [
      [2034, "Stock Price Fluctuation", "M"], [843, "Guess the Word", "H"], [1293, "Shortest Path in a Grid with Obstacles Elimination", "H"],
      [818, "Race Car", "H"],
    ] },
    { topic: "Amazon-tagged", items: [
      [12, "Integer to Roman", "M"], [937, "Reorder Data in Log Files", "M"], [472, "Concatenated Words", "H"],
    ] },
    { topic: "Microsoft / Apple-tagged", items: [
      [8, "String to Integer (atoi)", "M"], [151, "Reverse Words in a String", "M"], [445, "Add Two Numbers II", "M"],
    ] },
  ],
  16: [
    { topic: "Graph algorithms final pass", items: [
      [1162, "As Far from Land as Possible", "M"], [1319, "Number of Operations to Make Network Connected", "M"],
      [399, "Evaluate Division", "M"], [2492, "Minimum Score of a Path Between Two Cities", "M"], [332, "Reconstruct Itinerary", "H"],
      [2050, "Parallel Courses III", "H"], [1857, "Largest Color Value in a Directed Graph", "H"],
      [1203, "Sort Items by Groups Respecting Dependencies", "H"],
    ] },
  ],
  17: [
    { topic: "Loop simulation — two per mock", items: [
      [146, "LRU Cache", "M"], [128, "Longest Consecutive Sequence", "M"], [207, "Course Schedule", "M"], [322, "Coin Change", "M"],
      [72, "Edit Distance", "M"], [297, "Serialize and Deserialize Binary Tree", "H"], [23, "Merge k Sorted Lists", "H"],
      [42, "Trapping Rain Water", "H"], [76, "Minimum Window Substring", "H"], [124, "Binary Tree Maximum Path Sum", "H"],
    ] },
  ],
  18: [
    { topic: "Green-zone patterns only", items: [
      [1, "Two Sum", "E"], [206, "Reverse Linked List", "E"], [3, "Longest Substring Without Repeating Characters", "M"],
      [15, "3Sum", "M"], [56, "Merge Intervals", "M"], [102, "Binary Tree Level Order Traversal", "M"], [200, "Number of Islands", "M"],
      [198, "House Robber", "M"], [300, "Longest Increasing Subsequence", "M"], [739, "Daily Temperatures", "M"],
    ] },
  ],
  19: [
    { topic: "Daily warm-ups (easy / medium)", items: [
      [1, "Two Sum", "E"], [20, "Valid Parentheses", "E"], [121, "Best Time to Buy and Sell Stock", "E"], [125, "Valid Palindrome", "E"],
      [21, "Merge Two Sorted Lists", "E"], [226, "Invert Binary Tree", "E"], [704, "Binary Search", "E"], [70, "Climbing Stairs", "E"],
      [347, "Top K Frequent Elements", "M"], [238, "Product of Array Except Self", "M"],
    ] },
  ],
  20: [
    { topic: "Maintenance — one a day", items: [
      [217, "Contains Duplicate", "E"], [242, "Valid Anagram", "E"], [11, "Container With Most Water", "M"],
      [153, "Find Minimum in Rotated Sorted Array", "M"], [98, "Validate Binary Search Tree", "M"], [79, "Word Search", "M"],
      [62, "Unique Paths", "M"],
    ] },
  ],
  21: [
    { topic: "One medium + one hard a day", items: [
      [33, "Search in Rotated Sorted Array", "M"], [236, "Lowest Common Ancestor of a Binary Tree", "M"], [621, "Task Scheduler", "M"],
      [684, "Redundant Connection", "M"], [295, "Find Median from Data Stream", "H"], [212, "Word Search II", "H"],
      [127, "Word Ladder", "H"], [10, "Regular Expression Matching", "H"], [312, "Burst Balloons", "H"], [85, "Maximal Rectangle", "H"],
    ] },
  ],
  22: [
    { topic: "Company-specific re-solves", items: [
      [1249, "Minimum Remove to Make Valid Parentheses", "M"], [227, "Basic Calculator II", "M"], [528, "Random Pick with Weight", "M"],
      [937, "Reorder Data in Log Files", "M"], [8, "String to Integer (atoi)", "M"], [151, "Reverse Words in a String", "M"],
      [987, "Vertical Order Traversal of a Binary Tree", "H"], [843, "Guess the Word", "H"],
      [1293, "Shortest Path in a Grid with Obstacles Elimination", "H"],
    ] },
  ],
  23: [
    { topic: "Graphs + DP — most re-tested onsite", items: [
      [743, "Network Delay Time", "M"], [787, "Cheapest Flights Within K Stops", "M"], [1631, "Path With Minimum Effort", "M"],
      [210, "Course Schedule II", "M"], [721, "Accounts Merge", "M"], [1584, "Min Cost to Connect All Points", "M"],
      [416, "Partition Equal Subset Sum", "M"], [494, "Target Sum", "M"], [1143, "Longest Common Subsequence", "M"],
      [115, "Distinct Subsequences", "H"],
    ] },
  ],
  24: [
    { topic: "Maintenance — one a day", items: [
      [53, "Maximum Subarray", "M"], [56, "Merge Intervals", "M"], [3, "Longest Substring Without Repeating Characters", "M"],
      [200, "Number of Islands", "M"], [322, "Coin Change", "M"], [146, "LRU Cache", "M"], [15, "3Sum", "M"],
    ] },
  ],
  25: [],
  26: [],
};
