import harness from "./harness.py?raw";

// Pyodide (CPython compiled to WebAssembly) is fetched from the CDN on first Python run
// and cached by the browser afterwards.
const PYODIDE = "https://cdn.jsdelivr.net/pyodide/v0.27.2/full/";
let pyPromise = null;

function boot() {
  if (!pyPromise) {
    pyPromise = (async () => {
      const { loadPyodide } = await import(/* @vite-ignore */ PYODIDE + "pyodide.mjs");
      const py = await loadPyodide({ indexURL: PYODIDE });
      py.runPython(harness);
      return py;
    })();
  }
  return pyPromise;
}

self.onmessage = async (e) => {
  const { code, spec, tests } = e.data;
  let py;
  try {
    self.postMessage({ type: "status", text: "Loading Python runtime…" });
    py = await boot();
  } catch (err) {
    pyPromise = null;
    self.postMessage({ type: "fatal", error: `Couldn't load Python (Pyodide) from the CDN: ${err.message || err}` });
    return;
  }
  self.postMessage({ type: "ready" });
  const setup = JSON.parse(py.globals.get("__setup")(code, JSON.stringify(spec)));
  if (setup.error) {
    tests.forEach((_, i) => self.postMessage({ type: "result", r: { i, ...setup, compile: true, logs: [] } }));
    self.postMessage({ type: "done" });
    return;
  }
  const runOne = py.globals.get("__run_one");
  tests.forEach((t, i) => {
    const r = JSON.parse(runOne(JSON.stringify(t)));
    self.postMessage({ type: "result", r: { i, ...r } });
  });
  self.postMessage({ type: "done" });
};
