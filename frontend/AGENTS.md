<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project language

This project uses JavaScript. Write React components and App Router pages/layouts as `.jsx`, and non-React logic/utilities as `.js`. Keep `jsconfig.json` and its `@/*` alias. Next.js configuration is `next.config.mjs`. Do not reintroduce TypeScript source, annotations, type-only imports, declarations, `tsconfig.json`, or TypeScript tooling. Validate with `npm run check`, the existing tests, and the Next.js build. Follow the root `AGENTS.md` for backend and shared requirements.
