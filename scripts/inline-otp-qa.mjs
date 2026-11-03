import { chromium } from "@playwright/test";
import { existsSync } from "node:fs";
const origin = process.env.QA_ORIGIN || "http://127.0.0.1:3000";
const executablePath =
  process.env.PLAYWRIGHT_EXECUTABLE ||
  "C:/Users/aaa/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe";
const browser = await chromium.launch({
  headless: true,
  ...(existsSync(executablePath) ? { executablePath } : {}),
});
try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  const health = await page.request
    .get(`${origin}/api/health`)
    .then((response) => response.json());
  if (health.mode !== "demo")
    throw Error("Inline OTP QA requires an isolated demo server.");
  await page.goto(origin, { waitUntil: "networkidle" });
  await page
    .getByPlaceholder("10-digit mobile number")
    .fill(`96${String(Date.now()).slice(-8)}`);
  await page.getByRole("button", { name: "Verify", exact: true }).click();
  await page.getByLabel("Enter your 6-digit code").waitFor();
  if (!(await page.getByRole("button", { name: /Resend in/ }).isDisabled()))
    throw Error("Resend cooldown is missing.");
  await page.getByText(/Code expires in [45]:/).waitFor();
  await page.screenshot({ path: "docs/inline-otp-mobile.png", fullPage: true });
  await page
    .getByLabel("Enter your 6-digit code")
    .fill(await page.locator(".demo-code b").innerText());
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    if (
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      )
    )
      throw Error(`Inline OTP overflows at ${width}px`);
  }
  await page.evaluate(() => {
    const original = Date.now;
    Date.now = () => original() + 301000;
  });
  await page.getByText(/Code expired\. Request a new code\./).waitFor();
  if (
    !(await page
      .getByRole("button", { name: "Verify OTP", exact: true })
      .isDisabled())
  )
    throw Error("Expired OTP can still be submitted.");
  if (
    !(await page
      .getByRole("button", { name: "Checkout", exact: true })
      .isDisabled())
  )
    throw Error("Expired OTP enabled checkout.");
  console.log(
    "PASS: inline OTP fields, five-minute expiry, resend cooldown, and mobile widths 390/320px.",
  );
  await context.close();
} finally {
  await browser.close();
}
