import { runJsTests } from "./harness-js.js";

self.onmessage = (e) => {
  const { code, spec, tests } = e.data;
  self.postMessage({ type: "ready" });
  runJsTests(code, spec, tests, (r) => self.postMessage({ type: "result", r }));
  self.postMessage({ type: "done" });
};
