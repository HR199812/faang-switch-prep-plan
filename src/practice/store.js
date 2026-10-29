import { useSyncExternalStore } from "react";

// Practice progress, saved in this browser under one localStorage key.
// Per problem: { code: { js, py }, lang, status: "attempted" | "solved", attempts, solvedLangs,
//   lastRun: { passed, total, lang, at }, review: { interval, due }, viewedSolution,
//   notes, log: [{ at, kind: "fail" | "pass" | "rate" | "review", text }], reviews: [{ at, lang, text }] }
const KEY = "fp:practice:v1";
const API_KEY = "fp:anthropic-key";

const read = (k, fallback) => { try { const v = localStorage.getItem(k); return v == null ? fallback : JSON.parse(v); } catch { return fallback; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage full or blocked */ } };

let state = read(KEY, {});
const subs = new Set();
const emit = () => subs.forEach((f) => f());
const subscribe = (f) => { subs.add(f); return () => subs.delete(f); };

export const EMPTY = Object.freeze({ code: {}, attempts: 0, solvedLangs: [], log: [], reviews: [], notes: "" });

export function usePractice() {
  return useSyncExternalStore(subscribe, () => state);
}

export function updateProblem(id, fn) {
  const cur = state[id] || EMPTY;
  state = { ...state, [id]: fn({ ...cur }) };
  write(KEY, state);
  emit();
}

export function addLog(rec, entry, max = 40) {
  return [{ at: Date.now(), ...entry }, ...(rec.log || [])].slice(0, max);
}

// ── dates ──
export function todayStr(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export const isDue = (rec) => !!rec?.review && rec.review.due <= todayStr();
export const dueCount = (all) => Object.values(all).filter(isDue).length;

export function relDay(due) {
  const t = todayStr();
  if (due < t) return "overdue";
  if (due === t) return "today";
  if (due === todayStr(1)) return "tomorrow";
  const days = Math.round((new Date(due) - new Date(t)) / 86400000);
  return `in ${days} days`;
}

// ── spaced repetition (a simplified SM-2) ──
export const GRADES = [
  { key: "again", label: "Again", hint: "Needed the solution or many tries" },
  { key: "hard", label: "Hard", hint: "Got there, but it was a struggle" },
  { key: "good", label: "Good", hint: "Solved with some thought" },
  { key: "easy", label: "Easy", hint: "Instant — pattern recognised" },
];
export function nextInterval(prev, grade) {
  const i = prev || 1;
  if (grade === "again") return 1;
  if (grade === "hard") return Math.max(2, Math.round(i * 1.2));
  if (grade === "good") return Math.max(3, Math.round(i * 2.5));
  return Math.max(7, Math.round(i * 4));
}

// ── Claude API key (stays in this browser) ──
let apiKey = read(API_KEY, "");
const keySubs = new Set();
export function useApiKey() {
  return useSyncExternalStore((f) => { keySubs.add(f); return () => keySubs.delete(f); }, () => apiKey);
}
export function setApiKey(k) {
  apiKey = k.trim();
  if (apiKey) write(API_KEY, apiKey);
  else { try { localStorage.removeItem(API_KEY); } catch { /* ignore */ } }
  keySubs.forEach((f) => f());
}

// ── LeetCode checklist: one "solved" mark per problem slug, shared by every list ──
const LC_KEY = "fp:leetcode:v1";
let lc = read(LC_KEY, {});
const lcSubs = new Set();
export function useLeetCode() {
  return useSyncExternalStore((f) => { lcSubs.add(f); return () => lcSubs.delete(f); }, () => lc);
}
export function toggleLeetCode(slug) {
  const next = { ...lc };
  if (next[slug]) delete next[slug];
  else next[slug] = Date.now();
  lc = next;
  write(LC_KEY, lc);
  lcSubs.forEach((f) => f());
}
