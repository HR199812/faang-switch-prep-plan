import { define, code } from "../define.js";

const TREE_NOTE = "Trees are given in level order with `null` for missing children (e.g. `[3,9,20,null,null,15,7]`) and converted to `TreeNode { val, left, right }` for you — the class is predefined in both languages.";

export default [
  define({
    id: "diameter-of-binary-tree",
    title: "Diameter of Binary Tree",
    difficulty: "Easy",
    track: "dsa",
    pattern: "Tree DFS",
    weeks: [5],
    link: "https://leetcode.com/problems/diameter-of-binary-tree/",
    statement: "Return the length (in **edges**) of the longest path between any two nodes of a binary tree. The path may or may not pass through the root.\n\n" + TREE_NOTE,
    params: ["root"],
    fn: { js: "diameterOfBinaryTree", py: "diameter_of_binary_tree" },
    argTypes: ["tree"],
    tests: [
      { args: [[1, 2, 3, 4, 5]], expected: 3 },
      { args: [[1, 2]], expected: 1 },
      { args: [[1]], expected: 0 },
      { args: [[1, 2, null, 3, 4, 5, null, null, 6, 7, null, null, 8]], expected: 6, note: "Longest path doesn't go through the root" },
      { args: [[1, null, 2, null, 3, null, 4]], expected: 3, note: "A straight line" },
    ],
    constraints: ["1 ≤ number of nodes ≤ 10⁴", "-100 ≤ Node.val ≤ 100"],
    hints: [
      "The longest path through a node = height(left) + height(right).",
      "Compute heights bottom-up with DFS and update a global best at every node.",
    ],
    approach: "Post-order DFS returning each subtree's height (in nodes; null → 0). At every node, `left + right` is the longest path whose highest point is that node — track the max. Return `1 + max(left, right)` upward.",
    complexity: { time: "O(n)", space: "O(h) recursion" },
    pitfalls: [
      "Returning the root's left + right height only — misses paths that don't touch the root.",
      "Counting nodes instead of edges (off by one).",
      "Recomputing heights for every node — O(n²).",
    ],
    solution: {
      js: code`
function diameterOfBinaryTree(root) {
  let best = 0;
  const height = (node) => {
    if (!node) return 0;
    const l = height(node.left), r = height(node.right);
    best = Math.max(best, l + r);
    return 1 + Math.max(l, r);
  };
  height(root);
  return best;
}`,
      py: code`
def diameter_of_binary_tree(root):
    best = 0

    def height(node):
        nonlocal best
        if not node:
            return 0
        l, r = height(node.left), height(node.right)
        best = max(best, l + r)
        return 1 + max(l, r)

    height(root)
    return best`,
    },
  }),

  define({
    id: "validate-bst",
    title: "Validate Binary Search Tree",
    difficulty: "Medium",
    track: "dsa",
    pattern: "Tree DFS",
    weeks: [5],
    link: "https://leetcode.com/problems/validate-binary-search-tree/",
    statement: "Return whether a binary tree is a valid BST: every node's left subtree holds only values **strictly less** than the node, its right subtree only values **strictly greater**, and both subtrees are BSTs.\n\n" + TREE_NOTE,
    params: ["root"],
    fn: { js: "isValidBST", py: "is_valid_bst" },
    argTypes: ["tree"],
    tests: [
      { args: [[2, 1, 3]], expected: true },
      { args: [[5, 1, 4, null, null, 3, 6]], expected: false },
      { args: [[5, 4, 6, null, null, 3, 7]], expected: false, note: "3 is a right-subtree descendant of 5 — checking only parent/child misses this" },
      { args: [[1, 1]], expected: false, note: "Duplicates aren't allowed" },
      { args: [[2147483647]], expected: true, note: "Don't use INT_MAX as a sentinel" },
      { args: [[0, -1]], expected: true },
      { args: [[10, 5, 15, 2, 8, 12, 20, 1, null, 6, 9]], expected: true },
    ],
    constraints: ["1 ≤ number of nodes ≤ 10⁴", "-2³¹ ≤ Node.val ≤ 2³¹ − 1"],
    hints: [
      "Comparing a node only with its children isn't enough.",
      "Pass down the open interval (low, high) every node in this subtree must fall within.",
      "Alternatively: an in-order traversal of a BST is strictly increasing.",
    ],
    approach: "DFS with bounds. `valid(node, low, high)`: null is valid; otherwise require `low < node.val < high`, then recurse left with `(low, node.val)` and right with `(node.val, high)`. Start with ±Infinity (or null sentinels).",
    complexity: { time: "O(n)", space: "O(h)" },
    pitfalls: [
      "Only checking node.left.val < node.val < node.right.val.",
      "Using <= instead of < (duplicates must fail).",
      "Using 2³¹−1 / −2³¹ as sentinels, which wrongly rejects trees containing those values.",
    ],
    solution: {
      js: code`
function isValidBST(root) {
  const valid = (node, low, high) => {
    if (!node) return true;
    if (node.val <= low || node.val >= high) return false;
    return valid(node.left, low, node.val) && valid(node.right, node.val, high);
  };
  return valid(root, -Infinity, Infinity);
}`,
      py: code`
def is_valid_bst(root):
    def valid(node, low, high):
        if not node:
            return True
        if not (low < node.val < high):
            return False
        return valid(node.left, low, node.val) and valid(node.right, node.val, high)

    return valid(root, -inf, inf)`,
    },
  }),

  define({
    id: "binary-tree-level-order-traversal",
    title: "Binary Tree Level Order Traversal",
    difficulty: "Medium",
    track: "dsa",
    pattern: "Tree BFS",
    weeks: [5],
    link: "https://leetcode.com/problems/binary-tree-level-order-traversal/",
    statement: "Return the values of a binary tree level by level, left to right — an array of arrays, one per depth.\n\n" + TREE_NOTE,
    params: ["root"],
    fn: { js: "levelOrder", py: "level_order" },
    argTypes: ["tree"],
    tests: [
      { args: [[3, 9, 20, null, null, 15, 7]], expected: [[3], [9, 20], [15, 7]] },
      { args: [[1]], expected: [[1]] },
      { args: [[]], expected: [], note: "Empty tree" },
      { args: [[1, 2, 3, 4, null, null, 5]], expected: [[1], [2, 3], [4, 5]] },
      { args: [[1, 2, null, 3, null, 4]], expected: [[1], [2], [3], [4]] },
    ],
    constraints: ["0 ≤ number of nodes ≤ 2000"],
    hints: ["BFS with a queue.", "Process the queue one level at a time: snapshot its length before draining that many nodes."],
    approach: "BFS. While the queue is non-empty, record `size = queue.length`, pop exactly `size` nodes into the current level's array, pushing their non-null children. Append the level.",
    complexity: { time: "O(n)", space: "O(width)" },
    pitfalls: [
      "Not separating levels — reading queue.length inside the loop as it grows.",
      "Pushing null children, then crashing on .val.",
      "JS: queue.shift() is O(n); use a head index for large trees.",
    ],
    solution: {
      js: code`
function levelOrder(root) {
  if (!root) return [];
  const out = [];
  let level = [root];
  while (level.length) {
    out.push(level.map((n) => n.val));
    const next = [];
    for (const n of level) {
      if (n.left) next.push(n.left);
      if (n.right) next.push(n.right);
    }
    level = next;
  }
  return out;
}`,
      py: code`
def level_order(root):
    if not root:
        return []
    out, q = [], deque([root])
    while q:
        level = []
        for _ in range(len(q)):
            node = q.popleft()
            level.append(node.val)
            if node.left:
                q.append(node.left)
            if node.right:
                q.append(node.right)
        out.append(level)
    return out`,
    },
  }),
];
