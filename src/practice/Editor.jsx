import { useRef, useMemo } from "react";

// A dependency-free code editor: a transparent <textarea> over a syntax-highlighted <pre>.
// Both sit in one scroll container and share font metrics, so nothing needs scroll-syncing.

const KW = {
  js: "const|let|var|function|return|if|else|for|while|do|break|continue|new|class|extends|super|this|of|in|typeof|instanceof|try|catch|finally|throw|switch|case|default|async|await|yield|static|get|set|delete",
  py: "def|return|if|elif|else|for|while|in|not|and|or|is|class|import|from|as|with|try|except|finally|raise|pass|break|continue|lambda|yield|global|nonlocal|del|assert",
};
const CONST = { js: "null|undefined|true|false|NaN|Infinity", py: "None|True|False|self|inf" };
const BUILTIN = {
  js: "Math|Array|Object|Map|Set|String|Number|JSON|console|Infinity|ListNode|TreeNode|parseInt",
  py: "len|range|print|min|max|sum|sorted|enumerate|zip|map|filter|list|dict|set|tuple|int|str|float|abs|any|all|reversed|deque|defaultdict|Counter|OrderedDict|heapq|heappush|heappop|heapify|bisect|ListNode|TreeNode|isinstance|ord|chr",
};

const cache = {};
function tokenRe(lang) {
  if (cache[lang]) return cache[lang];
  const comment = lang === "py" ? "#[^\\n]*" : "\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/";
  const str = lang === "py"
    ? "\"\"\"[\\s\\S]*?\"\"\"|'''[\\s\\S]*?'''|\"(?:\\\\.|[^\"\\\\\\n])*\"|'(?:\\\\.|[^'\\\\\\n])*'"
    : "\"(?:\\\\.|[^\"\\\\\\n])*\"|'(?:\\\\.|[^'\\\\\\n])*'|`(?:\\\\.|[^`\\\\])*`";
  cache[lang] = new RegExp(
    `(${comment})|(${str})|\\b(${KW[lang]})\\b|\\b(${CONST[lang]})\\b|\\b(${BUILTIN[lang]})\\b|\\b(\\d+(?:\\.\\d+)?)\\b|([A-Za-z_$][\\w$]*)(?=\\s*\\()`,
    "g",
  );
  return cache[lang];
}

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const CLS = [null, "c", "s", "k", "n", "b", "n", "f"];

export function highlight(src, lang) {
  const re = tokenRe(lang);
  re.lastIndex = 0;
  let out = "", last = 0, m;
  while ((m = re.exec(src))) {
    out += esc(src.slice(last, m.index));
    const g = m.findIndex((x, i) => i > 0 && x !== undefined);
    out += `<span class="tk-${CLS[g]}">${esc(m[0])}</span>`;
    last = re.lastIndex;
  }
  return out + esc(src.slice(last));
}

export function CodeView({ code, lang }) {
  return <pre className="code-view"><code dangerouslySetInnerHTML={{ __html: highlight(code, lang) }} /></pre>;
}

function insert(ta, text, selStart, selEnd) {
  ta.focus();
  if (selStart !== undefined) ta.setSelectionRange(selStart, selEnd);
  // execCommand keeps the browser's undo stack intact; fall back to a manual edit.
  if (!document.execCommand || !document.execCommand("insertText", false, text)) {
    const { selectionStart: s, selectionEnd: e, value } = ta;
    ta.value = value.slice(0, s) + text + value.slice(e);
    ta.selectionStart = ta.selectionEnd = s + text.length;
    ta.dispatchEvent(new Event("input", { bubbles: true }));
  }
}

export default function Editor({ value, onChange, lang, onRun, errorLine, label = "Code editor" }) {
  const ta = useRef(null);
  const unit = lang === "py" ? "    " : "  ";
  const lines = value.split("\n").length;
  const html = useMemo(() => highlight(value, lang) + "\n", [value, lang]);

  const onKeyDown = (e) => {
    const t = e.currentTarget;
    const { selectionStart: s, selectionEnd: end, value: v } = t;
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); onRun?.(); return; }
    if (e.key === "Tab") {
      e.preventDefault();
      const lineStart = v.lastIndexOf("\n", s - 1) + 1;
      if (s === end && !e.shiftKey) { insert(t, unit); return; }
      // Indent / dedent every selected line.
      const block = v.slice(lineStart, end);
      const next = block.split("\n").map((l) => (e.shiftKey ? l.replace(new RegExp("^ {1," + unit.length + "}"), "") : unit + l)).join("\n");
      insert(t, next, lineStart, end);
      t.setSelectionRange(lineStart, lineStart + next.length);
      return;
    }
    if (e.key === "Enter" && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      const lineStart = v.lastIndexOf("\n", s - 1) + 1;
      const line = v.slice(lineStart, s);
      const indent = line.match(/^\s*/)[0];
      const opens = /[{[(]\s*$/.test(line) || (lang === "py" && /:\s*$/.test(line));
      const closesNext = /^[}\])]/.test(v.slice(end));
      if (opens && closesNext && lang !== "py") {
        insert(t, "\n" + indent + unit + "\n" + indent);
        const pos = s + 1 + indent.length + unit.length;
        t.setSelectionRange(pos, pos);
      } else insert(t, "\n" + indent + (opens ? unit : ""));
      return;
    }
    if (e.key === "Backspace" && s === end && s > 0) {
      const lineStart = v.lastIndexOf("\n", s - 1) + 1;
      const before = v.slice(lineStart, s);
      if (before.length && /^ +$/.test(before)) {
        e.preventDefault();
        const drop = before.length % unit.length || unit.length;
        insert(t, "", s - drop, s);
      }
    }
  };

  return (
    <div className="ed" onClick={(e) => { if (e.target === e.currentTarget) ta.current?.focus(); }}>
      <div className="ed-gutter" aria-hidden="true">
        {Array.from({ length: lines }, (_, i) => (
          <div key={i} className={errorLine === i + 1 ? "err" : ""}>{i + 1}</div>
        ))}
      </div>
      <div className="ed-body">
        <pre className="ed-hl" aria-hidden="true"><code dangerouslySetInnerHTML={{ __html: html }} /></pre>
        <textarea
          ref={ta}
          className="ed-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          aria-label={label}
        />
      </div>
    </div>
  );
}
