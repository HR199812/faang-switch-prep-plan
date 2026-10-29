import { define, code } from "../define.js";

const NODE_NOTE = "Lists are given as arrays in the tests and converted to `ListNode { val, next }` for you (the class is predefined in both languages). Return a `ListNode` (or null / None).";

export default [
  define({
    id: "reverse-linked-list",
    title: "Reverse Linked List",
    difficulty: "Easy",
    track: "dsa",
    pattern: "Linked list",
    weeks: [3],
    link: "https://leetcode.com/problems/reverse-linked-list/",
    statement: "Given the `head` of a singly linked list, reverse the list and return the new head.\n\n" + NODE_NOTE,
    params: ["head"],
    fn: { js: "reverseList", py: "reverse_list" },
    argTypes: ["list"],
    returnType: "list",
    tests: [
      { args: [[1, 2, 3, 4, 5]], expected: [5, 4, 3, 2, 1] },
      { args: [[1, 2]], expected: [2, 1] },
      { args: [[]], expected: [], note: "Empty list" },
      { args: [[7]], expected: [7] },
      { args: [[1, 1, 2, 2]], expected: [2, 2, 1, 1] },
    ],
    constraints: ["0 ≤ number of nodes ≤ 5000", "-5000 ≤ Node.val ≤ 5000"],
    hints: [
      "Walk the list once, flipping each node's next pointer to point backwards.",
      "You need three references: prev, cur, and the saved next before you overwrite cur.next.",
    ],
    approach: "Iterate with `prev = null`, `cur = head`. Each step: save `next = cur.next`, point `cur.next = prev`, then advance `prev = cur`, `cur = next`. When `cur` is null, `prev` is the new head. (Recursive version: reverse the rest, then `head.next.next = head; head.next = null`.)",
    complexity: { time: "O(n)", space: "O(1) iterative, O(n) recursive" },
    pitfalls: [
      "Overwriting cur.next before saving it — you lose the rest of the list.",
      "Returning head (now the tail) instead of prev.",
      "Recursive version forgetting head.next = null, leaving a 2-node cycle (the runner reports cycles).",
    ],
    solution: {
      js: code`
function reverseList(head) {
  let prev = null, cur = head;
  while (cur) {
    const next = cur.next;
    cur.next = prev;
    prev = cur;
    cur = next;
  }
  return prev;
}`,
      py: code`
def reverse_list(head):
    prev, cur = None, head
    while cur:
        nxt = cur.next
        cur.next = prev
        prev, cur = cur, nxt
    return prev`,
    },
  }),

  define({
    id: "merge-two-sorted-lists",
    title: "Merge Two Sorted Lists",
    difficulty: "Easy",
    track: "dsa",
    pattern: "Linked list",
    weeks: [3],
    link: "https://leetcode.com/problems/merge-two-sorted-lists/",
    statement: "Merge two sorted linked lists `list1` and `list2` into one sorted list made by splicing together their nodes, and return its head.\n\n" + NODE_NOTE,
    params: ["list1", "list2"],
    fn: { js: "mergeTwoLists", py: "merge_two_lists" },
    argTypes: ["list", "list"],
    returnType: "list",
    tests: [
      { args: [[1, 2, 4], [1, 3, 4]], expected: [1, 1, 2, 3, 4, 4] },
      { args: [[], []], expected: [] },
      { args: [[], [0]], expected: [0] },
      { args: [[5], [1, 2, 3]], expected: [1, 2, 3, 5] },
      { args: [[-3, 0, 0, 9], [-5, 0, 10]], expected: [-5, -3, 0, 0, 0, 9, 10] },
    ],
    constraints: ["0 ≤ nodes per list ≤ 50", "Both lists are sorted in non-decreasing order"],
    hints: ["A dummy head node removes the special case for the first node.", "When one list runs out, attach the rest of the other in one step."],
    approach: "Create a dummy node and a tail pointer. While both lists are non-empty, attach the smaller head to `tail` and advance that list. Then attach whichever list remains. Return `dummy.next`.",
    complexity: { time: "O(n + m)", space: "O(1)" },
    pitfalls: [
      "Forgetting to attach the leftover list after the loop.",
      "Returning dummy instead of dummy.next.",
      "Not advancing tail, so every node overwrites the same next pointer.",
    ],
    solution: {
      js: code`
function mergeTwoLists(list1, list2) {
  const dummy = new ListNode();
  let tail = dummy;
  while (list1 && list2) {
    if (list1.val <= list2.val) { tail.next = list1; list1 = list1.next; }
    else { tail.next = list2; list2 = list2.next; }
    tail = tail.next;
  }
  tail.next = list1 || list2;
  return dummy.next;
}`,
      py: code`
def merge_two_lists(list1, list2):
    dummy = tail = ListNode()
    while list1 and list2:
        if list1.val <= list2.val:
            tail.next, list1 = list1, list1.next
        else:
            tail.next, list2 = list2, list2.next
        tail = tail.next
    tail.next = list1 or list2
    return dummy.next`,
    },
  }),

  define({
    id: "remove-nth-node-from-end",
    title: "Remove Nth Node From End of List",
    difficulty: "Medium",
    track: "dsa",
    pattern: "Two pointers",
    weeks: [3],
    link: "https://leetcode.com/problems/remove-nth-node-from-end-of-list/",
    statement: "Given the `head` of a linked list, remove the `n`-th node from the end and return the head. Try to do it in one pass.\n\n" + NODE_NOTE,
    params: ["head", "n"],
    fn: { js: "removeNthFromEnd", py: "remove_nth_from_end" },
    argTypes: ["list"],
    returnType: "list",
    tests: [
      { args: [[1, 2, 3, 4, 5], 2], expected: [1, 2, 3, 5] },
      { args: [[1], 1], expected: [] },
      { args: [[1, 2], 1], expected: [1] },
      { args: [[1, 2], 2], expected: [2], note: "Removing the head" },
      { args: [[10, 20, 30, 40], 4], expected: [20, 30, 40] },
      { args: [[1, 2, 3], 3], expected: [2, 3] },
    ],
    constraints: ["1 ≤ list length ≤ 30", "1 ≤ n ≤ list length"],
    hints: [
      "Move a fast pointer n steps ahead, then move fast and slow together until fast reaches the end.",
      "Start both pointers at a dummy node in front of head so removing the head needs no special case.",
    ],
    approach: "Dummy node before head. Advance `fast` n+1 steps from dummy, then move `fast` and `slow` together until `fast` is null. Now `slow.next` is the node to delete: `slow.next = slow.next.next`. Return `dummy.next`.",
    complexity: { time: "O(L)", space: "O(1)" },
    pitfalls: [
      "No dummy node — removing the head (n = length) crashes or returns the wrong list.",
      "Gap off by one: fast must lead slow by n+1 so slow stops before the target.",
      "Returning head instead of dummy.next after the head was removed.",
    ],
    solution: {
      js: code`
function removeNthFromEnd(head, n) {
  const dummy = new ListNode(0, head);
  let fast = dummy, slow = dummy;
  for (let i = 0; i <= n; i++) fast = fast.next;
  while (fast) { fast = fast.next; slow = slow.next; }
  slow.next = slow.next.next;
  return dummy.next;
}`,
      py: code`
def remove_nth_from_end(head, n):
    dummy = ListNode(0, head)
    fast = slow = dummy
    for _ in range(n + 1):
        fast = fast.next
    while fast:
        fast, slow = fast.next, slow.next
    slow.next = slow.next.next
    return dummy.next`,
    },
  }),
];
