# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Samsung SmartThings SmartApp example that uses the SmartThings Rules API to build a practical automation ruleset (daylight/nightlight/idle/transition lighting rules driven by motion sensors), plus a React web dashboard for viewing locations, devices, scenes, and managing the generated rules. It is a monorepo with two independent npm projects, `server/` (Node/Express + the two SmartApp definitions) and `client/` (React/TypeScript SPA), orchestrated from the root `package.json` via `concurrently`.

Local development requires an ngrok tunnel (OAuth callbacks from Samsung Cloud must reach the local server) and a running Redis instance for rule-state storage. See `README.md` for full one-time setup (SmartApp registration is documented in `doc/APPSETUP.md` / `doc/APPVERIFY.md`) and `server/.env.local` for required environment variables.

## Commands

Run from the repo root unless noted. Root scripts fan out to both `client/` and `server/` via `concurrently`.

- `npm run inst` — install root, client, and server dependencies (run this instead of a plain `npm install` after cloning or pulling dependency changes)
- `npm run start` — run the full dev environment (server ngrok tunnel + server dev + client dev) in one terminal
- `npm run build` — build both server (`tsc`) and client (`node tool/bundle.ts`, esbuild-based) for production
- `npm run lint` — lint both client and server (each runs `tsc --noEmit` + eslint in parallel)
- `npm run kill-node-win` / `kill-node-linux` — force-kill stray node processes if a previous run didn't shut down cleanly

Per-package (run inside `server/` or `client/`):
- `npm run lint:tsc` — typecheck only (`tsc --noEmit`)
- `npm run lint:eslint` — eslint only (add `-- --cache` for incremental)
- `npm run lint-fix` — eslint with `--fix`
- `npm run build:watch` — incremental rebuild on file change (uses `npm-watch`)
- `server`: `npm run tunnel` (ngrok only), `npm run prod` (run built `build/server.js` directly)
- `client`: `npm test` (react-app-rewired/CRA test runner, Jest+RTL) — pass a file path or `-t <name>` to scope to one test, e.g. `npm test -- App.test.tsx`

There is no single-test runner in `server/` — it currently has no test suite.

## Architecture

### Two cooperating SmartApps, one server

`server/server.ts` is a single Express app exposing two SmartThings webhook endpoints plus a REST API consumed by the client:
- `POST /smartapp/control` → `server/provider/smartAppControl.ts` — the "control" SmartApp. Installed by the end user against a location; subscribes to switch/lock/motionSensor capability events and republishes them over SSE (`/events`) so the dashboard updates live.
- `POST /smartapp/rule` → `server/provider/smartAppRule.ts` — the "rule" SmartApp. Its config pages (day/night control switches, motion sensors, time offsets, per-rule enable/disable toggles) drive the actual Rules API automations. On config submit it reads the config (`operations/readConfigFromContext.ts`), builds rule payloads (`operations/create*RuleFromConfigOperation.ts`, `factories/ruleFactory.ts`), submits them to the Rules API (`operations/submitRulesForSmartAppOperation.ts`), and persists the resulting `RuleSummary` (`operations/storeRulesAndNotifyOperation.ts` → `provider/ruleStore.ts`, backed by Redis).
- The remaining REST routes (`/app`, `/locations`, `/location/:id`, device/scene execution, rule create/delete, and the enable/disable-with-optional-re-enable-delay route at `PUT /location/:locationId/rule/:installedAppId/:ruleComponent/:enabled`) are plain SmartThings API pass-throughs used by the client dashboard, guarded by `middlewares.ts#localOnlyMiddleware` (an IP allowlist — the only access control in front of the API; see README caveats).
- `provider/smartAppContextStore.ts` persists SmartApp installation tokens/config (per-installedApp) separately from `ruleStore.ts`, which persists the last-generated `RuleSummary` per installed app (used to map Rules API rule IDs back to the owning app, detect no-op rule regeneration, and support enable/disable/re-enable operations).

A rule "component" is one of `daylight | nightlight | transition | idle` (`types/sharedContracts.d.ts#IRuleComponentType`); each maps to one of the `create*RuleFromConfigOperation.ts` files. Rules are collapsed to at most ~2 SmartThings rules per installed app (see README) because of platform per-user/per-ISA rule limits.

### Shared contracts

`server/types/sharedContracts.d.ts` and `client/src/types` define the same request/response shapes (`IRuleSummary`, `IResponseLocation`, `ISseEvent`, etc.) independently in both packages — there is no shared package, so **when changing one side's contract, manually mirror the change in the other package's copy** (see the comment at the top of the server file).

### Client

CRA-style React 17 + TypeScript SPA built with a custom esbuild pipeline (`client/tool/bundle.ts`, invoked by `npm run build`/`dev`) rather than `react-scripts`. Key structure under `client/src/`:
- `components/` — route/page-level and reusable UI (Dashboard*, Room, Device, Rule, NavMenu, etc.), styled with `styled-components`
- `providers/` — React context providers for global style/theme and styled-components setup
- `store/` — device/location context stores (zustand-based state shared across components)
- `operations/` — thin fetch wrappers calling the server REST API (mirrors server route shapes)
- `factories/` — drag-and-drop (`react-dnd`) setup, rule display factories, style factories
- `templates/` — rule example/template definitions surfaced in the UI for quickly creating common rules
- SSE (`react-sse-hooks`) is used to receive live device/rule state pushed from the server's `/events` endpoint instead of polling; `swr` is used for the request/response API calls

### Environment & config

Both `client/` and `server/` load `.env` (server prefers `.env.local` over `.env` if present, see `server.ts`). Server settings are centralized and validated at startup in `server/provider/settings.ts` (throws immediately if required SmartThings/Redis env vars are missing). Do not add new required server env vars without updating both `settings.ts` and the `README.md` env var table.

## Linting conventions

Both packages share an ESLint flat config built on `eslint-config-techsmith`, with 2-space indentation, strict import ordering/alphabetization (`import/order`), and `@typescript-eslint/consistent-type-imports` enforced (`import type {...}` required for type-only imports). Run `npm run lint` before considering a change complete — it's stricter than the TypeScript compiler alone.
