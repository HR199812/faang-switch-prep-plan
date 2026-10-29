// All practice problems, bundled from ./problems/*.js. Dropping a new file (or a new entry in
// an existing file) there is enough for it to appear. Run `npm run check:problems` after editing.
const mods = import.meta.glob("./problems/*.js", { eager: true });

const DIFF = { Easy: 0, Medium: 1, Hard: 2 };
export const PROBLEMS = Object.keys(mods).sort().flatMap((k) => mods[k].default)
  .sort((a, b) => a.weeks[0] - b.weeks[0] || DIFF[a.difficulty] - DIFF[b.difficulty]);

export const byId = Object.fromEntries(PROBLEMS.map((p) => [p.id, p]));
export const forWeek = (n) => PROBLEMS.filter((p) => p.weeks.includes(n));
