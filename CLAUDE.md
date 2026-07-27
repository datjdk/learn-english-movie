# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A Next.js frontend web app for studying English by watching movies/videos.

## Commands

This project uses `nvm` for Node version management (scaffolded and built with Node 24 — run `nvm use 24` first) and npm as the package manager.

- `npm run dev` — start the dev server (Turbopack)
- `npm run build` — production build (Turbopack)
- `npm run start` — run the production build
- `npm run lint` — run ESLint (flat config in `eslint.config.mjs`)

There is no test runner configured yet.

## Architecture

- Next.js **16** (App Router, Turbopack) with React 19 and TypeScript.
- Styling via **Tailwind CSS v4** (configured through `@tailwindcss/postcss` in `postcss.config.mjs` — there is no separate `tailwind.config.*` file; theme customization happens via CSS in `src/app/globals.css`).
- App source lives under `src/app` (the `src/` directory layout is enabled). Routes/pages/layouts go here following standard App Router conventions (`page.tsx`, `layout.tsx`, route subfolders).
- Import alias `@/*` maps to `src/*` (see `tsconfig.json`).
- Static assets live in `public/`.

## Workflow

Do not run tests or verification steps (starting the dev server, running `npm run build`/`npm run lint`, driving the app in a browser) after making a change unless the user explicitly asks for it. Just make the requested change.

## Working with this version of Next.js

This project pins **Next.js 16**, which postdates most model training data and has breaking changes vs. earlier versions. Before writing App Router code (routing, data fetching, layouts, config), check the bundled docs in `node_modules/next/dist/docs/` rather than relying on prior knowledge of Next.js conventions.
