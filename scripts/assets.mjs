import { mkdir, writeFile, readFile } from "node:fs/promises";
const root = new URL("../frontend/public/brand/", import.meta.url);
await mkdir(root, { recursive: true });
const assets = {
  "fun.webp": "2025/11/2-5-1.webp",
  "food.webp": "2025/11/3-3-1.webp",
  "music.webp": "2025/11/3-2-1.webp",
  "workshops.webp": "2025/11/4-3-1.webp",
  "space.webp": "2025/11/Frame-26-2.webp",
  "brands.webp": "2025/11/2-6-1.webp",
  "moments.webp": "2025/11/3-4-1.webp",
  "rush.webp": "2025/11/Rush.webp",
  ...Object.fromEntries(
    [
      "39",
      "59",
      "42",
      "60",
      "61",
      "35",
      "34",
      "37",
      "40",
      "36-2",
      "38",
      "58",
      "15",
      "41",
    ].map((n) => [`gallery-${n}.webp`, `2025/11/Frame-${n}.webp`]),
  ),
};
await Promise.all(
  Object.entries(assets).map(async ([name, path]) => {
    const r = await fetch(
      "https://santassocial.com/wp-content/uploads/" + path,
    );
    if (!r.ok) throw Error(path);
    await writeFile(new URL(name, root), new Uint8Array(await r.arrayBuffer()));
  }),
);
const fontCSS = await readFile(
  new URL("../docs/fonts.css", import.meta.url),
  "utf8",
);
await Promise.all(
  [...fontCSS.matchAll(/url\((https[^)]+)\)/g)].map(async (m, i) => {
    const r = await fetch(m[1]);
    await writeFile(
      new URL(`roboto-condensed-${[400, 500, 600, 700][i]}.ttf`, root),
      new Uint8Array(await r.arrayBuffer()),
    );
  }),
);
const css = await fetch(
  "https://santassocial.com/wp-content/uploads/elementor/css/post-3049.css",
);
await writeFile(
  new URL("../docs/reference-page.css", import.meta.url),
  await css.text(),
);
console.log("Downloaded official reference imagery and fonts.");
