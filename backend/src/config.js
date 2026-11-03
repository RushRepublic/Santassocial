import dotenv from "dotenv";
import path from "node:path";
dotenv.config({ path: path.resolve(process.cwd(), ".env"), quiet: true });
export const demo = process.env.APP_MODE !== "live";
export const production = process.env.NODE_ENV === "production";
if (production && demo) throw new Error("Production requires APP_MODE=live.");
function secret(name, fallback) {
  const value = process.env[name];
  if (!demo && (!value || value.length < 32 || value.startsWith("replace-")))
    throw new Error(
      `${name} must be a unique random secret of at least 32 characters.`,
    );
  return value || fallback;
}
export const config = {
  port: Number(process.env.PORT || 4000),
  origin: process.env.FRONTEND_ORIGIN || "http://127.0.0.1:3000",
  sessionSecret: secret(
    "SESSION_SECRET",
    "local-demo-session-secret-change-before-live",
  ),
  ticketSecret: secret(
    "TICKET_SECRET",
    "local-demo-ticket-secret-change-before-live",
  ),
  otpSecret: secret("OTP_SECRET", "local-demo-otp-secret-change-before-live"),
  demoDate: process.env.DEMO_EVENT_DATE || "2026-12-05",
};
if (
  !demo &&
  new Set([config.sessionSecret, config.ticketSecret, config.otpSecret])
    .size !== 3
)
  throw Error("Use separate secrets.");
