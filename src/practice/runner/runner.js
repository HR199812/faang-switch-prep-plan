import { isEqual } from "./compare.js";

// One long-lived worker per language so Pyodide stays warm between runs. A run that blows
// the time limit (usually an infinite loop) gets its worker terminated and recreated.
const LIMIT_MS = { js: 4000, py: 8000 };
const workers = {};

function getWorker(lang) {
  if (!workers[lang]) {
    workers[lang] = lang === "py"
      ? new Worker(new URL("./pyWorker.js", import.meta.url), { type: "module" })
      : new Worker(new URL("./jsWorker.js", import.meta.url), { type: "module" });
  }
  return workers[lang];
}

export function specFor(problem, lang) {
  return {
    kind: problem.kind || "fn",
    fn: problem.fn?.[lang],
    cls: problem.cls,
    argTypes: problem.argTypes,
    returnType: problem.returnType,
  };
}

// Resolves to { results: [{ i, pass, got, error, line, logs, ms, timeout?, skipped? }], fatal? }
export function runTests({ lang, code, problem, onStatus = () => {}, onResult = () => {} }) {
  const tests = problem.tests;
  const spec = specFor(problem, lang);
  return new Promise((resolve) => {
    const w = getWorker(lang);
    const results = [];
    let timer = null;

    const finish = (extra = {}) => {
      clearTimeout(timer);
      w.onmessage = null;
      w.onerror = null;
      resolve({ results, ...extra });
    };

    w.onmessage = (e) => {
      const m = e.data;
      if (m.type === "status") onStatus(m.text);
      else if (m.type === "ready") {
        onStatus("Running tests…");
        timer = setTimeout(() => {
          w.terminate();
          delete workers[lang];
          for (let i = results.length; i < tests.length; i++) {
            const r = i === results.length
              ? { i, pass: false, timeout: true, error: `Time limit exceeded (${LIMIT_MS[lang] / 1000}s) — likely an infinite loop or an algorithm that's far too slow.`, logs: [] }
              : { i, pass: false, skipped: true, logs: [] };
            results.push(r);
            onResult(r);
          }
          finish({ timedOut: true });
        }, LIMIT_MS[lang]);
      } else if (m.type === "result") {
        const r = m.r;
        r.pass = !r.error && isEqual(r.got, tests[r.i].expected, problem.compare);
        results.push(r);
        onResult(r);
      } else if (m.type === "done") finish();
      else if (m.type === "fatal") { delete workers[lang]; finish({ fatal: m.error }); }
    };
    w.onerror = (e) => {
      w.terminate();
      delete workers[lang];
      finish({ fatal: e.message || "The code runner crashed." });
    };
    w.postMessage({ code, spec, tests });
  });
}
