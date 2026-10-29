import Anthropic from "@anthropic-ai/sdk";
import { fmt } from "./runner/compare.js";

// "Review my code with Claude" (Practice.jsx imports this lazily and mirrors REVIEW_MODEL): sends the problem, the user's code and their test results to
// the Claude API straight from the browser using the user's own key.
export const REVIEW_MODEL = "claude-opus-5-5";

const SYSTEM = `You are a senior engineer coaching a candidate who is practising for FAANG coding interviews. You will receive a problem, the candidate's code, and the results of running it against test cases.

Your job is to help them understand what they coded wrong so they can fix it themselves. Be specific and concrete: refer to their code by line number, explain why each bug produces the failing output you were shown, and suggest the smallest change that fixes it (show only the changed lines, not a full rewrite). If all tests pass, focus on complexity, edge cases the tests may not cover, and how the code would come across in an interview.

Use this markdown structure, skipping a section only when it has nothing useful:
## Verdict
One or two sentences: correct or not, and how it compares with the optimal approach.
## What's wrong
One bullet per bug, most important first.
## Edge cases
## Complexity
Their time and space complexity versus the optimal.
## Interview polish
Brief notes on naming, structure, or what to say out loud.

Keep it tight — a candidate should be able to read it in under two minutes. A reference approach is provided for your judgement; don't hand over a full solution.`;

function numbered(code) {
  return code.split("\n").map((l, i) => `${String(i + 1).padStart(3)} | ${l}`).join("\n");
}

function describeTest(problem, t, r) {
  if (problem.kind === "design") {
    const calls = t.ops.map((op, k) => `${op}(${t.args[k].map(fmt).join(", ")})`).join(", ");
    return `calls: ${calls}\nexpected: ${fmt(t.expected)}\n${r.error ? `error: ${r.error}${r.line ? ` (line ${r.line})` : ""}` : `got: ${fmt(r.got)}`}`;
  }
  const input = (problem.params || []).map((p, k) => `${p} = ${fmt(t.args[k])}`).join(", ");
  const outcome = r.timeout ? "time limit exceeded" : r.error ? `error: ${r.error}${r.line ? ` (line ${r.line})` : ""}` : `got: ${fmt(r.got)}`;
  const logs = r.logs?.length ? `\nstdout:\n${r.logs.slice(0, 8).join("\n")}` : "";
  return `input: ${input}\nexpected: ${fmt(t.expected)}\n${outcome}${logs}`;
}

export function buildPrompt({ problem, lang, code, run }) {
  const langName = lang === "py" ? "Python" : "JavaScript";
  let results = "The code has not been run against the tests yet.";
  if (run?.results?.length) {
    const passed = run.results.filter((r) => r.pass).length;
    const failing = run.results.filter((r) => !r.pass && !r.skipped).slice(0, 6);
    results = `Passed ${passed} of ${problem.tests.length} tests.`;
    if (run.results[0]?.compile) results += `\nThe code didn't compile / load: ${run.results[0].error}`;
    else if (failing.length) results += "\n\nFailing tests:\n" + failing.map((r) => `- test ${r.i + 1}\n${describeTest(problem, problem.tests[r.i], r)}`).join("\n\n");
  }
  return `<problem title="${problem.title}" difficulty="${problem.difficulty}" pattern="${problem.pattern}">
${problem.statement}
${problem.constraints.length ? "\nConstraints:\n" + problem.constraints.map((c) => "- " + c).join("\n") : ""}
</problem>

<candidate_code language="${langName}" entry_point="${problem.kind === "design" ? problem.cls : problem.fn[lang]}">
${numbered(code)}
</candidate_code>

<test_results>
${results}
</test_results>

<reference_approach complexity_time="${problem.complexity.time}" complexity_space="${problem.complexity.space}">
${problem.approach}
Common mistakes on this problem:
${problem.pitfalls.map((p) => "- " + p).join("\n")}
</reference_approach>

Review the candidate's ${langName} code.`;
}

// Streams the review text. onReset is called if the stream switches to a fallback model mid-way,
// so the UI can discard the partial text from the first model.
export async function streamReview({ apiKey, problem, lang, code, run, onText, onReset, signal }) {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  const stream = client.beta.messages.stream(
    {
      model: REVIEW_MODEL,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "high" },
      system: SYSTEM,
      messages: [{ role: "user", content: buildPrompt({ problem, lang, code, run }) }],
    },
    { signal },
  );
  for await (const event of stream) {
    if (event.type === "content_block_start" && event.content_block.type === "fallback") onReset?.();
    else if (event.type === "content_block_delta" && event.delta.type === "text_delta") onText(event.delta.text);
  }
  const message = await stream.finalMessage();
  if (message.stop_reason === "refusal") throw new Error("Claude declined to review this code.");
  if (message.stop_reason === "max_tokens") onText("\n\n_(Review was cut off.)_");
  return message;
}

export function describeError(e) {
  if (e instanceof Anthropic.AuthenticationError) return "That API key was rejected. Check it in Practice → Claude review settings.";
  if (e instanceof Anthropic.PermissionDeniedError) return "This API key doesn't have access to the model.";
  if (e instanceof Anthropic.RateLimitError) return "Rate limited by the API — wait a moment and try again.";
  if (e instanceof Anthropic.APIUserAbortError) return "Review stopped.";
  if (e instanceof Anthropic.APIConnectionError) return "Couldn't reach the Claude API. Check your connection.";
  if (e instanceof Anthropic.APIError) return `API error ${e.status ?? ""}: ${e.message}`;
  return e?.message || String(e);
}
