// Run against an isolated demo server only. Does not manufacture paid transactions.
const origin = process.env.LOAD_ORIGIN || "http://127.0.0.1:3000";
const health = await fetch(`${origin}/api/health`).then((r) => r.json());
if (health.mode !== "demo")
  throw Error("Load script is limited to an isolated DEMO server.");
const start = performance.now();
const timings = [];
const results = await Promise.all(
  Array.from({ length: 300 }, async () => {
    const t = performance.now();
    try {
      const r = await fetch(`${origin}/api/events`);
      timings.push(performance.now() - t);
      return r.status;
    } catch {
      return 0;
    }
  }),
);
timings.sort((a, b) => a - b);
console.log(
  JSON.stringify(
    {
      sessions: 300,
      statuses: results.reduce((a, c) => ((a[c] = (a[c] || 0) + 1), a), {}),
      elapsedMs: performance.now() - start,
      p95Ms: timings[Math.floor(timings.length * 0.95)],
      note: "Single-host demo browsing only. Not a production throughput claim.",
    },
    null,
    2,
  ),
);
