import { openDatabase, migrate } from "./db.js";
import { seed } from "./setup.js";
import { createApp } from "./app.js";
import { config, demo } from "./config.js";
import { dispatchNotifications, reconcilePayments } from "./providers.js";
import { expire, lockEvent } from "./services.js";
const db = await openDatabase();
if (demo) {
  await migrate(db);
  await seed(db);
}
const server = createApp(db).listen(config.port, "127.0.0.1", () =>
  console.log(
    `Santa Social API http://127.0.0.1:${config.port} (${demo ? "DEMO — simulated OTP and payments" : "LIVE"})`,
  ),
);
let working = false;
const timer = setInterval(async () => {
  if (working) return;
  working = true;
  try {
    await db.transaction(async (tx) => {
      await lockEvent(tx);
      await expire(tx);
    });
    await dispatchNotifications(db);
    await reconcilePayments(db);
  } catch {
    console.error("Background maintenance failed; will retry.");
  } finally {
    working = false;
  }
}, 15000);
async function shutdown() {
  clearInterval(timer);
  server.close(async () => {
    await db.close();
    process.exit(0);
  });
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
