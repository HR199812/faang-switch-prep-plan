# Runs a user's Python against a problem's tests. Loaded into Pyodide by pyWorker.js and
# into CPython by scripts/check-problems.mjs. Keep it Python 3.9 compatible.
# Protocol: __setup(code, spec_json) -> json (error or ok); __run_one(test_json) -> json result.
import json, sys, io, time, traceback, contextlib

# Pyodide's WebAssembly stack is smaller than CPython's; only raise the limit natively.
if sys.platform != "emscripten":
    sys.setrecursionlimit(4000)


class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

    def __repr__(self):
        return "ListNode(%r)" % (self.val,)


class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

    def __repr__(self):
        return "TreeNode(%r)" % (self.val,)


def _to_list(arr):
    dummy = ListNode()
    cur = dummy
    for v in arr or []:
        cur.next = ListNode(v)
        cur = cur.next
    return dummy.next


def _from_list(node):
    out = []
    guard = 0
    while node is not None:
        guard += 1
        if guard > 100000:
            raise ValueError("Returned list has a cycle (or is longer than 100000 nodes)")
        out.append(node.val)
        node = node.next
    return out


def _to_tree(arr):
    if not arr or arr[0] is None:
        return None
    root = TreeNode(arr[0])
    q = [root]
    i = 1
    h = 0
    while h < len(q) and i < len(arr):
        node = q[h]
        h += 1
        if i < len(arr) and arr[i] is not None:
            node.left = TreeNode(arr[i])
            q.append(node.left)
        i += 1
        if i < len(arr) and arr[i] is not None:
            node.right = TreeNode(arr[i])
            q.append(node.right)
        i += 1
    return root


def _from_tree(root):
    out = []
    q = [root]
    h = 0
    while h < len(q):
        n = q[h]
        h += 1
        if n is None:
            out.append(None)
        else:
            out.append(n.val)
            q.append(n.left)
            q.append(n.right)
    while out and out[-1] is None:
        out.pop()
    return out


def _convert_in(v, t):
    if t == "list":
        return _to_list(v)
    if t == "tree":
        return _to_tree(v)
    return v


def _plain(v):
    if isinstance(v, ListNode):
        return _from_list(v)
    if isinstance(v, TreeNode):
        return _from_tree(v)
    if isinstance(v, (list, tuple)):
        return [_plain(x) for x in v]
    if isinstance(v, (set, frozenset)):
        return [_plain(x) for x in v]
    if isinstance(v, dict):
        return {str(k): _plain(x) for k, x in v.items()}
    if isinstance(v, float) and v.is_integer() and abs(v) < 2 ** 53:
        return v
    return v


def _convert_out(v, t):
    if t == "list":
        return _from_list(v)
    if t == "tree":
        return _from_tree(v)
    return _plain(v)


PRELUDE = """
from typing import *
import collections, heapq, math, bisect, functools, itertools, re, string
from collections import defaultdict, deque, Counter, OrderedDict
from heapq import heappush, heappop, heapify, heappushpop, nlargest, nsmallest
from functools import lru_cache, cache, reduce
from math import inf
"""

_state = {}


def _err(e):
    line = None
    if isinstance(e, SyntaxError) and e.filename == "solution.py":
        line = e.lineno
        return {"error": "SyntaxError: %s" % e.msg, "line": line}
    for fr in traceback.extract_tb(e.__traceback__):
        if fr.filename == "solution.py":
            line = fr.lineno
    msg = str(e)
    name = type(e).__name__
    if isinstance(e, RecursionError):
        msg = "maximum recursion depth exceeded (infinite recursion, or recursion too deep)"
    return {"error": "%s: %s" % (name, msg) if msg else name, "line": line}


def __setup(code, spec_json):
    spec = json.loads(spec_json)
    g = {"__name__": "__solution__", "ListNode": ListNode, "TreeNode": TreeNode}
    exec(PRELUDE, g)
    _state.clear()
    _state["spec"] = spec
    try:
        exec(compile(code, "solution.py", "exec"), g)
    except BaseException as e:  # noqa: BLE001 - report anything, incl. SystemExit
        return json.dumps(_err(e))
    name = spec["cls"] if spec.get("kind") == "design" else spec["fn"]
    target = g.get(name)
    if target is None and "Solution" in g and hasattr(g["Solution"], name):
        target = getattr(g["Solution"](), name)
    if target is None or not callable(target):
        kind = "a class" if spec.get("kind") == "design" else "a function"
        return json.dumps({"error": "Define %s named `%s`." % (kind, name), "line": None})
    _state["target"] = target
    return json.dumps({"ok": True})


def __run_one(test_json):
    t = json.loads(test_json)
    spec = _state["spec"]
    target = _state["target"]
    buf = io.StringIO()
    t0 = time.perf_counter()
    try:
        with contextlib.redirect_stdout(buf):
            if spec.get("kind") == "design":
                obj = target(*t["args"][0])
                got = [None]
                for op, a in zip(t["ops"][1:], t["args"][1:]):
                    fn = getattr(obj, op, None)
                    if fn is None:
                        raise AttributeError("Method `%s` is not defined on %s" % (op, spec["cls"]))
                    got.append(_plain(fn(*a)))
            else:
                types = spec.get("argTypes") or []
                args = [_convert_in(a, types[k] if k < len(types) else None) for k, a in enumerate(t["args"])]
                got = _convert_out(target(*args), spec.get("returnType"))
        res = {"got": got}
    except BaseException as e:  # noqa: BLE001
        res = _err(e)
    res["ms"] = (time.perf_counter() - t0) * 1000
    logs = buf.getvalue().splitlines()[:50]
    res["logs"] = logs
    try:
        return json.dumps(res)
    except (TypeError, ValueError):
        res["got"] = repr(res.get("got"))
        return json.dumps(res)
