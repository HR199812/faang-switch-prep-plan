// Day-by-day LeetCode plan for each week, built from the daily track in daily.js.
// Shape per week: [{ day, theme, sessions: [{ label, repeat, groups: [{ topic, items }] }] }] × 7.
import { DAILY_BLOCKS } from "./weeks.js";
import { DAILY } from "./daily.js";

export const isDpGroup = (topic) => /\bDP\b|knapsack|dynamic/i.test(topic);
export const MINUTES = { E: 20, M: 30, H: 45 }; // rough time-boxes per problem
export const estimate = (items) => items.reduce((t, it) => t + MINUTES[it[2]], 0);

export function weekSchedule(week) {
  const plan = DAILY[week];
  return DAILY_BLOCKS.map((d, i) => {
    const slot = plan?.days[i];
    const day = { day: d.day, theme: d.theme, sessions: [] };
    if (slot && slot.items.length) {
      const n = slot.items.length;
      day.sessions.push({
        label: slot.repeat ? `Re-solve from scratch · ~${estimate(slot.items)} min` : `${n} problem${n === 1 ? "" : "s"} · ~${estimate(slot.items)} min`,
        repeat: !!slot.repeat,
        groups: [{ topic: slot.topic, items: slot.items }],
      });
    }
    return day;
  });
}

export const weekTheme = (week) => DAILY[week]?.theme || "";
export const WEEK_SCHEDULE = Object.fromEntries(Object.keys(DAILY).map((w) => [w, weekSchedule(Number(w))]));
