# PoliDove

Type a professor or course, get the room — instantly, styled as an airport
boarding pass. A small, dependency-light front end over the [PoliAule](https://api.poliaule.com)
API for real-time classroom occupancy at Politecnico di Milano.

Try it: search "Rossi" or "Basi di Dati", pick a lesson, get a boarding pass
with campus, building, room, and time — plus a QR code to share it.

## Features

- **Fuzzy search** by professor, course name, or course code, accent-insensitive
  (`peru` matches `Perù`), ranked whole-word > prefix > substring.
- **Boarding-pass ticket** with a live status badge (`BOARDING` → `IN FLIGHT` →
  `LANDED`) that updates itself every 30s, plus a countdown once a lesson is
  about to start.
- **"Find the next lesson"** fallback when today has no match — walks forward
  through the next available dates.
- **Shareable links** (`?d=<date>&r=<id>`) with an on-ticket QR code, so a
  ticket can be reopened directly by anyone with the link.
- **Editable "passenger" name** and **it/en language toggle**, both persisted
  to `localStorage`.
- Manual refresh button to re-pull occupancy data for whatever dates are
  currently loaded.

## Tech stack

Vanilla TypeScript + the DOM API — no UI framework. [Vite](https://vitejs.dev)
for dev/build, one runtime dependency ([`qrcode-generator`](https://www.npmjs.com/package/qrcode-generator)
for the share QR code), [ESLint](https://eslint.org) + [Prettier](https://prettier.io)
for linting/formatting.

## Getting started

```sh
npm install
npm run dev       # start the Vite dev server
```

## Scripts

| Command          | Does                                                  |
| ---------------- | ------------------------------------------------------ |
| `npm run dev`     | Start the Vite dev server with HMR                     |
| `npm run build`   | Type-check (`tsc`) then produce a production build     |
| `npm run preview` | Preview the production build locally                   |
| `npm run test`    | Run all `*.selfcheck.ts` files under `src/` via Node's built-in TS support |
| `npm run lint`    | ESLint + Prettier check                                 |
| `npm run format`  | Prettier write                                          |

Tests are plain `node:assert` scripts, no test framework — run individually
with `node src/<name>.selfcheck.ts` if you just want one.

## Project structure

```
src/
  api.ts               PoliAule HTTP client + in-memory response cache
  lessons.ts           Flattens the API's campus/building/classroom tree into Lesson[]
  search.ts            Tokenized fuzzy search + match-highlight range math
  status.ts            Lesson timing -> boarding/flying/landed + countdown
  ticket.ts            Builds the boarding-pass DOM (ticket, QR stub, owner row)
  share.ts             Encodes/decodes the ?d=&r= shareable-link params
  qr.ts                Text -> QR module grid (via qrcode-generator)
  i18n.ts               it/en dictionary + language state
  passenger.ts          "Passenger" (viewer) name persisted to localStorage
  main.ts               Entry point: wires up search input, results list, ticket view
  style.css              All styling (single stylesheet, CSS custom properties)
  *.selfcheck.ts         Self-contained assert-based tests, one per module with real logic
```

Data flow: `main.ts` fetches available dates and today's occupancy via `api.ts`,
flattens it with `lessons.ts`, and lets `search.ts` filter it as the user
types. Selecting a result hands the `Lesson` to `ticket.ts` to render, which
pulls in `status.ts` for the live badge and `share.ts`/`qr.ts` for the share
link and its QR code.

## Notes

- All lesson times are treated as local wall-clock time at the campus (no
  timezone conversion) — see `status.ts`'s `parseLocal`.
- The response cache in `api.ts` is unbounded for the lifetime of the page;
  fine at the scale of "a few dates per session" (see the `ponytail:` comment
  there for the upgrade path if that ever changes).
