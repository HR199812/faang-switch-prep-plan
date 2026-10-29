import { CodeView } from "./Editor.jsx";

// Minimal markdown: ## headings, - / 1. lists, ``` fences, `code`, **bold**, _em_, paragraphs.
function inline(text, keyBase = "") {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|(?<!\w)_[^_\s][^_]*_(?!\w))/g);
  return parts.map((s, i) => {
    const k = keyBase + i;
    if (s.startsWith("`") && s.endsWith("`") && s.length > 1) return <code key={k}>{s.slice(1, -1)}</code>;
    if (s.startsWith("**") && s.endsWith("**") && s.length > 4) return <strong key={k}>{s.slice(2, -2)}</strong>;
    if (s.startsWith("_") && s.endsWith("_") && s.length > 2) return <em key={k}>{s.slice(1, -1)}</em>;
    return s;
  });
}

export default function Md({ text, lang = "js" }) {
  const out = [];
  const lines = (text || "").split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const fence = line.match(/^\s*```(\w+)?/);
    if (fence) {
      const body = [];
      i++;
      while (i < lines.length && !/^\s*```/.test(lines[i])) body.push(lines[i++]);
      i++;
      const l = (fence[1] || "").toLowerCase();
      out.push(<CodeView key={out.length} code={body.join("\n")} lang={l.startsWith("py") ? "py" : l ? "js" : lang} />);
      continue;
    }
    const h = line.match(/^(#{1,4})\s+(.*)/);
    if (h) {
      const Tag = h[1].length <= 2 ? "h3" : "h4";
      out.push(<Tag key={out.length}>{inline(h[2])}</Tag>);
      i++;
      continue;
    }
    if (/^\s*([-*]|\d+\.)\s+/.test(line)) {
      const ordered = /^\s*\d+\./.test(line);
      const items = [];
      while (i < lines.length && /^\s*([-*]|\d+\.)\s+/.test(lines[i])) {
        let item = lines[i].replace(/^\s*([-*]|\d+\.)\s+/, "");
        i++;
        while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !/^\s*([-*]|\d+\.)\s+/.test(lines[i])) item += " " + lines[i++].trim();
        items.push(item);
      }
      const Tag = ordered ? "ol" : "ul";
      out.push(<Tag key={out.length}>{items.map((it, k) => <li key={k}>{inline(it, k + "-")}</li>)}</Tag>);
      continue;
    }
    if (!line.trim()) { i++; continue; }
    const para = [line];
    i++;
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|\s*```|\s*([-*]|\d+\.)\s)/.test(lines[i])) para.push(lines[i++]);
    out.push(<p key={out.length}>{inline(para.join(" "))}</p>);
  }
  return <div className="md">{out}</div>;
}
