const QRCode = require("qrcode");
const { chromium } = require("@playwright/test");
const { existsSync, readFileSync } = require("node:fs");
const { mkdir, writeFile } = require("node:fs/promises");
const { resolve } = require("node:path");
const { isIP } = require("node:net");
const { lookup } = require("node:dns/promises");
const { createHash } = require("node:crypto");
const dotenv = require("dotenv");

const root = resolve(__dirname, "..");
function configuredUrl() {
  const file = resolve(root, "config/public-registration.json");
  const configured = JSON.parse(readFileSync(file, "utf8")).bookingUrl;
  const backendEnv = resolve(root, "backend/.env");
  const env = existsSync(backendEnv)
    ? dotenv.parse(readFileSync(backendEnv))
    : {};
  return configured || process.env.FRONTEND_ORIGIN || env.FRONTEND_ORIGIN;
}
function isPublicAddress(address) {
  if (isIP(address) === 4) {
    const [a, b, c] = address.split(".").map(Number);
    return !(
      a === 0 ||
      a === 10 ||
      a === 127 ||
      a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && (b === 168 || b === 0 || (b === 88 && c === 99))) ||
      (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
      (a === 203 && b === 0 && c === 113)
    );
  }
  // Restrict IPv6 to global unicast; reject documentation and mapped/private ranges.
  return (
    /^[23][a-f0-9]{0,3}:/i.test(address) &&
    !/^2001:(?:db8|0|10|20):/i.test(address)
  );
}
async function publicBookingUrl(value) {
  if (!value)
    throw new Error(
      "Public deployment URL unavailable. Set the actual HTTPS booking URL in config/public-registration.json before generating the final QR.",
    );
  const url = new URL(value);
  const hostname = url.hostname.toLowerCase();
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/" ||
    !hostname.includes(".") ||
    isIP(hostname) ||
    /[\[\]]/.test(hostname) ||
    /(^|\.)(localhost|local|internal|invalid|test|example|lan|home|arpa)$/.test(
      hostname,
    ) ||
    /(^|\.)example\.(com|net|org)$/.test(hostname) ||
    /your[-_]?domain|placeholder/.test(hostname)
  )
    throw new Error(
      "Use the actual public HTTPS root booking URL, without credentials, query parameters or fragments. Local/private/placeholder destinations are forbidden.",
    );
  const addresses = await lookup(hostname, { all: true });
  if (
    !addresses.length ||
    addresses.some(({ address }) => !isPublicAddress(address))
  )
    throw new Error(
      "The configured hostname does not resolve exclusively to public addresses.",
    );
  const response = await fetch(url.href, {
    redirect: "manual",
    signal: AbortSignal.timeout(15000),
  });
  const html = await response.text();
  if (
    response.status !== 200 ||
    !html.includes("booking-page") ||
    !html.includes("Checkout")
  )
    throw new Error(
      "The configured HTTPS URL must serve the deployed Book Tickets form directly with HTTP 200. Deploy the landing-page change before generating the final QR.",
    );
  return url.href;
}
async function decodeImages(png, svg) {
  const executablePath =
    process.env.PLAYWRIGHT_EXECUTABLE ||
    "C:/Users/aaa/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe";
  const browser = await chromium.launch({
    headless: true,
    ...(existsSync(executablePath) ? { executablePath } : {}),
  });
  try {
    const page = await browser.newPage();
    await page.addScriptTag({
      path: require.resolve("qr-scanner/qr-scanner.umd.min.js"),
    });
    const workerModule =
      "data:text/javascript;base64," +
      readFileSync(
        require.resolve("qr-scanner/qr-scanner-worker.min.js"),
      ).toString("base64");
    return await page.evaluate(
      async ({ png, svg, workerModule }) => {
        const { createWorker } = await import(workerModule);
        const engine = createWorker();
        try {
          const decoded = [];
          for (const data of [png, svg]) {
            const result = await QrScanner.scanImage(data, {
              qrEngine: engine,
              returnDetailedScanResult: true,
            });
            decoded.push(result.data);
          }
          return decoded;
        } finally {
          engine.terminate();
        }
      },
      {
        png: `data:image/png;base64,${png.toString("base64")}`,
        svg: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`,
        workerModule,
      },
    );
  } finally {
    await browser.close();
  }
}
async function main() {
  const bookingUrl = await publicBookingUrl(configuredUrl());
  const options = {
    width: 2400,
    margin: 4,
    errorCorrectionLevel: "H",
    color: { dark: "#000000FF", light: "#FFFFFFFF" },
  };
  const png = await QRCode.toBuffer(bookingUrl, { ...options, type: "png" });
  const svg = await QRCode.toString(bookingUrl, { ...options, type: "svg" });
  const decoded = await decodeImages(png, svg);
  if (decoded.some((value) => value !== bookingUrl))
    throw new Error("QR verification failed. No final assets were written.");
  const directory = resolve(root, "artifacts/public-registration-qr");
  await mkdir(directory, { recursive: true });
  const pngName = "santa-social-public-registration.png";
  const svgName = "santa-social-public-registration.svg";
  await writeFile(resolve(directory, pngName), png);
  await writeFile(resolve(directory, svgName), svg);
  const sha256 = (data) => createHash("sha256").update(data).digest("hex");
  await writeFile(
    resolve(directory, "verification.json"),
    JSON.stringify(
      {
        bookingUrl,
        decodedPng: decoded[0],
        decodedSvg: decoded[1],
        pngPixels: 2400,
        quietZoneModules: 4,
        background: "white",
        errorCorrectionLevel: "H",
        admissionTicket: false,
        sha256: { [pngName]: sha256(png), [svgName]: sha256(svg) },
      },
      null,
      2,
    ) + "\n",
  );
  await writeFile(
    resolve(directory, "README.md"),
    `# Public registration QR\n\nVerified booking URL: ${bookingUrl}\n\n- PNG: ${pngName} (2400 × 2400 pixels).\n- SVG: ${svgName} (scalable vector).\n- Black modules, white background, four-module quiet zone, high error correction.\n- Both rendered outputs decoded to the booking URL before saving; see verification.json for checksums.\n\nEveryone uses the same public QR to open the booking form. This is not an admission ticket; unique per-booking admission QR credentials are separate.\n\nTo regenerate after an approved deployment URL change, update config/public-registration.json and run npm run qr:registration.\n`,
  );
  console.log(
    `Verified public booking URL: ${bookingUrl}\nPNG and SVG saved in ${directory}`,
  );
}
if (require.main === module)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
