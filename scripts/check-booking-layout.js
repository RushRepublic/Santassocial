const { chromium } = require("@playwright/test");
const { existsSync, readFileSync } = require("node:fs");

async function main() {
  const baseline = process.argv.includes("--baseline");
  const executablePath =
    process.env.PLAYWRIGHT_EXECUTABLE ||
    "C:/Users/aaa/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe";
  const browser = await chromium.launch({
    headless: true,
    ...(existsSync(executablePath) ? { executablePath } : {}),
  });
  try {
    for (const width of [1440, 390]) {
      const context = await browser.newContext({
        viewport: { width, height: 1000 },
      });
      const page = await context.newPage();
      await page.goto(`http://127.0.0.1:3000${baseline ? "/register" : "/"}`, {
        waitUntil: "networkidle",
      });
      await page
        .getByRole("button", { name: "Checkout", exact: true })
        .waitFor();
      await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all(
          [...document.images].map((image) => image.decode().catch(() => {})),
        );
      });
      const file = `docs/booking-landing-${baseline ? "before" : "after"}-${width}.png`;
      const capture = await page
        .locator(".booking-page")
        .screenshot({ path: file, animations: "disabled" });
      if (
        !baseline &&
        !capture.equals(
          readFileSync(`docs/booking-landing-before-${width}.png`),
        )
      )
        throw new Error(
          `Booking form pixels changed at ${width}px; inspect before/after screenshots.`,
        );
      if (!baseline) {
        if (await page.locator(".hero, .home-red").count())
          throw new Error("Promotional homepage is still present.");
        if (
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          )
        )
          throw new Error(`Horizontal overflow at ${width}px.`);
        await page.goto("http://127.0.0.1:3000/register", {
          waitUntil: "networkidle",
        });
        if (new URL(page.url()).pathname !== "/")
          throw new Error(
            "Legacy registration URL did not redirect directly to root.",
          );
      }
      await context.close();
      console.log(
        `${baseline ? "Captured existing form" : "PASS: unchanged booking form and legacy redirect"} at ${width}px.`,
      );
    }
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
