// NeetCode 150, grouped by NeetCode's categories. Blind 75 is a subset of it: items flagged "B".
// Item: [number, title, difficulty "E" | "M" | "H", flags?] where flags may contain
//   "B" — also in Blind 75, "P" — LeetCode Premium.
// Validated by `npm run check:problems` (counts, and consistency with leetcode.js).

export const NEETCODE_150 = [
  { topic: "Arrays & Hashing", items: [
    [217, "Contains Duplicate", "E", "B"], [242, "Valid Anagram", "E", "B"], [1, "Two Sum", "E", "B"],
    [49, "Group Anagrams", "M", "B"], [347, "Top K Frequent Elements", "M", "B"], [271, "Encode and Decode Strings", "M", "BP"],
    [238, "Product of Array Except Self", "M", "B"], [36, "Valid Sudoku", "M"], [128, "Longest Consecutive Sequence", "M", "B"],
  ] },
  { topic: "Two Pointers", items: [
    [125, "Valid Palindrome", "E", "B"], [167, "Two Sum II - Input Array Is Sorted", "M"], [15, "3Sum", "M", "B"],
    [11, "Container With Most Water", "M", "B"], [42, "Trapping Rain Water", "H"],
  ] },
  { topic: "Sliding Window", items: [
    [121, "Best Time to Buy and Sell Stock", "E", "B"], [3, "Longest Substring Without Repeating Characters", "M", "B"],
    [424, "Longest Repeating Character Replacement", "M", "B"], [567, "Permutation in String", "M"],
    [76, "Minimum Window Substring", "H", "B"], [239, "Sliding Window Maximum", "H"],
  ] },
  { topic: "Stack", items: [
    [20, "Valid Parentheses", "E", "B"], [155, "Min Stack", "M"], [150, "Evaluate Reverse Polish Notation", "M"],
    [22, "Generate Parentheses", "M"], [739, "Daily Temperatures", "M"], [853, "Car Fleet", "M"],
    [84, "Largest Rectangle in Histogram", "H"],
  ] },
  { topic: "Binary Search", items: [
    [704, "Binary Search", "E"], [74, "Search a 2D Matrix", "M"], [875, "Koko Eating Bananas", "M"],
    [153, "Find Minimum in Rotated Sorted Array", "M", "B"], [33, "Search in Rotated Sorted Array", "M", "B"],
    [981, "Time Based Key-Value Store", "M"], [4, "Median of Two Sorted Arrays", "H"],
  ] },
  { topic: "Linked List", items: [
    [206, "Reverse Linked List", "E", "B"], [21, "Merge Two Sorted Lists", "E", "B"], [141, "Linked List Cycle", "E", "B"],
    [143, "Reorder List", "M", "B"], [19, "Remove Nth Node From End of List", "M", "B"], [138, "Copy List with Random Pointer", "M"],
    [2, "Add Two Numbers", "M"], [287, "Find the Duplicate Number", "M"], [146, "LRU Cache", "M"],
    [23, "Merge k Sorted Lists", "H", "B"], [25, "Reverse Nodes in k-Group", "H"],
  ] },
  { topic: "Trees", items: [
    [226, "Invert Binary Tree", "E", "B"], [104, "Maximum Depth of Binary Tree", "E", "B"], [543, "Diameter of Binary Tree", "E"],
    [110, "Balanced Binary Tree", "E"], [100, "Same Tree", "E", "B"], [572, "Subtree of Another Tree", "E", "B"],
    [235, "Lowest Common Ancestor of a Binary Search Tree", "M", "B"], [102, "Binary Tree Level Order Traversal", "M", "B"],
    [199, "Binary Tree Right Side View", "M"], [1448, "Count Good Nodes in Binary Tree", "M"],
    [98, "Validate Binary Search Tree", "M", "B"], [230, "Kth Smallest Element in a BST", "M", "B"],
    [105, "Construct Binary Tree from Preorder and Inorder Traversal", "M", "B"], [124, "Binary Tree Maximum Path Sum", "H", "B"],
    [297, "Serialize and Deserialize Binary Tree", "H", "B"],
  ] },
  { topic: "Tries", items: [
    [208, "Implement Trie (Prefix Tree)", "M", "B"], [211, "Design Add and Search Words Data Structure", "M", "B"],
    [212, "Word Search II", "H", "B"],
  ] },
  { topic: "Heap / Priority Queue", items: [
    [703, "Kth Largest Element in a Stream", "E"], [1046, "Last Stone Weight", "E"], [973, "K Closest Points to Origin", "M"],
    [215, "Kth Largest Element in an Array", "M"], [621, "Task Scheduler", "M"], [355, "Design Twitter", "M"],
    [295, "Find Median from Data Stream", "H", "B"],
  ] },
  { topic: "Backtracking", items: [
    [78, "Subsets", "M"], [39, "Combination Sum", "M", "B"], [40, "Combination Sum II", "M"], [46, "Permutations", "M"],
    [90, "Subsets II", "M"], [79, "Word Search", "M", "B"], [131, "Palindrome Partitioning", "M"],
    [17, "Letter Combinations of a Phone Number", "M"], [51, "N-Queens", "H"],
  ] },
  { topic: "Graphs", items: [
    [200, "Number of Islands", "M", "B"], [695, "Max Area of Island", "M"], [133, "Clone Graph", "M", "B"],
    [286, "Walls and Gates", "M", "P"], [994, "Rotting Oranges", "M"], [417, "Pacific Atlantic Water Flow", "M", "B"],
    [130, "Surrounded Regions", "M"], [207, "Course Schedule", "M", "B"], [210, "Course Schedule II", "M"],
    [261, "Graph Valid Tree", "M", "BP"], [323, "Number of Connected Components in an Undirected Graph", "M", "BP"],
    [684, "Redundant Connection", "M"], [127, "Word Ladder", "H"],
  ] },
  { topic: "Advanced Graphs", items: [
    [743, "Network Delay Time", "M"], [1584, "Min Cost to Connect All Points", "M"], [787, "Cheapest Flights Within K Stops", "M"],
    [332, "Reconstruct Itinerary", "H"], [778, "Swim in Rising Water", "H"], [269, "Alien Dictionary", "H", "BP"],
  ] },
  { topic: "1-D Dynamic Programming", items: [
    [70, "Climbing Stairs", "E", "B"], [746, "Min Cost Climbing Stairs", "E"], [198, "House Robber", "M", "B"],
    [213, "House Robber II", "M", "B"], [5, "Longest Palindromic Substring", "M", "B"], [647, "Palindromic Substrings", "M", "B"],
    [91, "Decode Ways", "M", "B"], [322, "Coin Change", "M", "B"], [152, "Maximum Product Subarray", "M", "B"],
    [139, "Word Break", "M", "B"], [300, "Longest Increasing Subsequence", "M", "B"], [416, "Partition Equal Subset Sum", "M"],
  ] },
  { topic: "2-D Dynamic Programming", items: [
    [62, "Unique Paths", "M", "B"], [1143, "Longest Common Subsequence", "M", "B"],
    [309, "Best Time to Buy and Sell Stock with Cooldown", "M"], [518, "Coin Change II", "M"], [494, "Target Sum", "M"],
    [97, "Interleaving String", "M"], [72, "Edit Distance", "M"], [329, "Longest Increasing Path in a Matrix", "H"],
    [115, "Distinct Subsequences", "H"], [312, "Burst Balloons", "H"], [10, "Regular Expression Matching", "H"],
  ] },
  { topic: "Greedy", items: [
    [53, "Maximum Subarray", "M", "B"], [55, "Jump Game", "M", "B"], [45, "Jump Game II", "M"], [134, "Gas Station", "M"],
    [846, "Hand of Straights", "M"], [1899, "Merge Triplets to Form Target Triplet", "M"], [763, "Partition Labels", "M"],
    [678, "Valid Parenthesis String", "M"],
  ] },
  { topic: "Intervals", items: [
    [57, "Insert Interval", "M", "B"], [56, "Merge Intervals", "M", "B"], [435, "Non-overlapping Intervals", "M", "B"],
    [252, "Meeting Rooms", "E", "BP"], [253, "Meeting Rooms II", "M", "BP"], [1851, "Minimum Interval to Include Each Query", "H"],
  ] },
  { topic: "Math & Geometry", items: [
    [48, "Rotate Image", "M", "B"], [54, "Spiral Matrix", "M", "B"], [73, "Set Matrix Zeroes", "M", "B"], [202, "Happy Number", "E"],
    [66, "Plus One", "E"], [50, "Pow(x, n)", "M"], [43, "Multiply Strings", "M"], [2013, "Detect Squares", "M"],
  ] },
  { topic: "Bit Manipulation", items: [
    [136, "Single Number", "E"], [191, "Number of 1 Bits", "E", "B"], [338, "Counting Bits", "E", "B"], [190, "Reverse Bits", "E", "B"],
    [268, "Missing Number", "E", "B"], [371, "Sum of Two Integers", "M", "B"], [7, "Reverse Integer", "M"],
  ] },
];

export const BLIND_75 = NEETCODE_150
  .map((g) => ({ topic: g.topic, items: g.items.filter((it) => (it[3] || "").includes("B")) }))
  .filter((g) => g.items.length);
