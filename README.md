# SentryCore

**An access control platform built from the dispatcher's side of the glass.**

A mock enterprise access control system (ACS) — credentials, readers, schedules,
access levels, and a live alarm monitoring console — in TypeScript and Node. Inspired
by the enterprise platforms used in commercial physical security, and designed around
a question those platforms rarely ask: *what does the operator actually need at 3am?*

> **Status: early.** Module 0 of 11 is complete. Most of what this README describes is
> designed but not yet built, and every section says which is which. See the
> [Roadmap](#roadmap). Not affiliated with, derived from, or a clone of any commercial product.

---

## For the two-minute read

Most access control portfolio projects are a cardholder CRUD app. This one leads with
the **alarm monitoring and dispatch console**, because that's the part I actually
worked.

My background is physical security triage and dispatch. I spent my shifts inside a
commercial ACS monitoring module — taking forced-door and held-open alarms, pulling
associated cameras, dispatching officers, and handing off open incidents at shift
change. I know what an alarm flood looks like, which alarms operators learn to ignore,
and where the software made a bad night worse.

What I hadn't done was build the other half: the engine that *generates* those events.
So I'm building it, from the decision engine up to the console, and learning software
engineering by doing it.

**This is not how production systems are built, and that's deliberate.** In a real
deployment the grant/deny decision is made by firmware on the door controller, the
head-end is a server application on a relational database, and JavaScript shows up
mostly in integration middleware and newer web clients. I'm using one language so I can
learn the whole chain end to end.
[Layer separation](#layer-separation) maps each package to its production counterpart,
and [What's simulated](#whats-simulated-and-what-production-does-instead) covers the
gaps that matter most.

---

## What exists today

- An npm workspaces monorepo with one package so far, `@acs/core`
- Strict TypeScript, configured once in `tsconfig.base.json` and extended per package
- Vitest wired into `core`, with a first small test file
- GitHub Actions running typecheck and tests on every push and pull request

No access control logic is written yet. That starts in M1.

## What it is designed to demonstrate

| | | Module | Status |
|---|---|---|---|
| **Domain modeling** | Credentials, access levels, schedules, and the join between them | M1 | Next |
| **Pure business logic** | A zero-I/O decision engine with an injected clock | M2 | Planned |
| **Auditability** | An append-only event log with no update or delete path, asserted by test | M3 | Planned |
| **Alarm handling** | An explicit state machine for the alarm lifecycle | M4 | Planned |
| **Real-time delivery** | WebSocket events with reconnect and backfill | M6 | Planned |
| **Operator-first UX** | A monitoring console designed from dispatch experience | M7–M8 | Planned |
| **Integration** | HR-feed provisioning and a mock video bridge | M9 | Planned |

Rows move to "Built" only when the code is merged and its tests pass on `main`.

---

## Architecture

Monorepo, npm workspaces, TypeScript end to end.

```
packages/
  core/          decision engine + alarm rules   — pure, zero I/O      (exists, empty of domain logic)
  server/        Express API, WebSocket hub, SQLite persistence        (planned)
  panel-sim/     simulated door controllers emitting reads and alarms  (planned)
  integrations/  HR feed sync, mock VMS bridge, outbound webhooks      (planned)
  console/       React monitoring console (Vite)  ← the showcase       (planned)
  admin/         cardholder / credential / access level CRUD           (planned)
```

### The one rule

`core` imports nothing and performs no I/O. No database, no network, no `Date.now()`.
Time is injected.

The point of that constraint: every access decision and every alarm transition becomes
a pure function of its inputs. Schedule boundaries, DST transitions, and expiry edge
cases can then be tested without standing up infrastructure or faking a system clock.

### Layer separation

A real access control system is several layers, usually in several languages:

| Layer | Here | In a real system |
|---|---|---|
| Operator workstation | `console` | A client that talks only to the server, never to a panel. Often a desktop application; newer ones are web. |
| Server (head-end) | `core` + `server` | Holds the truth and acts as the switchboard: relays commands down to panels and collects their events. A server application on a relational database such as SQL Server. |
| Door controller (panel) | `panel-sim` | Keeps a local copy of badge records and schedules and makes the door decision, online or not. Embedded firmware, typically C or C++. |
| Interface boards and door hardware | not modeled separately | Boards extend the panel's ports out to readers, sensors, and locks. None of them hold badge records. |
| Integration middleware | `integrations` | Connects access control to HR, video, and other systems. Where JavaScript and Node commonly appear. |

Firmware is written in a low-level language because a controller is a small device with
limited memory that must respond on a predictable schedule and run for years without
attention.

The all-JavaScript stack is a deliberate choice for a learning project, and it would be
the wrong answer for parts of a production system. A design-rationale document covering
those trade-offs is planned for M10.

---

## The access decision

*Planned for M2. This is the design, not a description of working code.*

The heart of the system will be a single pure function:

```ts
decide(credentialId: string, readerId: string, at: Instant): Decision
```

Every decision returns a reason code, because a log that only says "denied" is a log
that generates a support call.

| Code | Meaning |
|---|---|
| `ACCESS_GRANTED` | Valid credential, valid access level, inside schedule |
| `CREDENTIAL_NOT_FOUND` | Card number not enrolled in the system |
| `CREDENTIAL_INACTIVE` | Reported lost, stolen, or manually disabled |
| `CREDENTIAL_EXPIRED` | Past its expiry date |
| `CARDHOLDER_SUSPENDED` | Person record inactive, credential itself still valid |
| `NO_ACCESS_LEVEL` | No access level grants this holder this reader |
| `OUTSIDE_SCHEDULE` | Access level valid, but not at this time |
| `READER_OFFLINE` | Controller not reporting |

`CARDHOLDER_SUSPENDED` and `CREDENTIAL_INACTIVE` are separate states on purpose.
Conflating them is a common modeling shortcut, and it's the reason "I badged in fine
yesterday" tickets take three people to resolve.

**Schedules follow the door, not the server.** Each reader carries a timezone. A
schedule of "weekdays 08:00–18:00" means 08:00–18:00 where the door is, whatever
timezone the server or the cardholder's home site is in.

---

## Alarm lifecycle

*Planned for M4.*

```
   NEW ──ack──> ACKNOWLEDGED ──dispatch──> DISPATCHED ──> CLEARED
    │                 │                                      ▲
    │                 └──────────── clear ───────────────────┘
    └── auto-clear (condition restored, e.g. door closed) ────┘
```

To be enforced as an explicit state machine: illegal transitions throw rather than
silently no-op, and two operators acknowledging the same alarm resolves
deterministically — one wins, the other is told why.

Every transition will write an immutable record with a timestamp and operator ID, so an
incident can be reconstructed end to end after the fact.

---

## Testing

**Today:** `core` has a first Vitest file, run by CI on every push and pull request.

**The plan** puts test weight where failure matters: the decision path, the alarm
engine, and the audit trail. Each line below is a requirement its module must meet
before it counts as done.

- **Decision engine (M2)** — table-driven; every reason code, schedule boundaries at
  exactly open and close, expiry on the expiry date, DST transitions, and a cardholder
  badging at a door in a different timezone
- **Audit log (M3)** — an explicit assertion that audit events cannot be updated or
  deleted
- **Alarm state machine (M4)** — legal transitions succeed, illegal ones throw,
  escalation fires on unacknowledged timeout, concurrent acknowledgment resolves cleanly
- **API contract (M5, Supertest)** — auth on every route, Zod rejection of malformed
  input
- **Realtime (M6)** — a client disconnects mid-flood, reconnects, and receives the
  events it missed
- **Queue ordering (M7)** — priority sort with age as tiebreak; a P1 arriving mid-flood
  surfaces immediately; no filter can hide an unacknowledged critical
- **Integrations (M9)** — HR termination deactivates credentials; re-running the same
  feed is a no-op; a malformed row fails that row, not the batch
- **End to end (M10, Playwright)** — simulator fires a forced-door alarm → console
  receives it → operator acknowledges, dispatches, annotates, clears → the event record
  shows the complete chain
- **Load (M10)** — a sustained event flood; the console stays responsive and no event
  is dropped

**Stretch goals** raise the standard on work already built. Each is optional and starts
only after its module is merged and green.

- **M2** — property-based tests on `decide`: invariants proven across generated inputs
  (a revoked credential never grants), plus a stated and measured cost as data grows
- **M3** — a hash-chained audit log, with a test proving that tampering is detected
- **M6** — a panel offline buffer: events held while the link is down, merged by
  sequence number on reconnect, with out-of-order and duplicate delivery both tested
- **M9** — a binary frame decoder for one panel message type
- **M10** — events per second and latency under flood, with the method used to measure
  them

Coverage will be targeted at `core` and the alarm engine rather than the repo as a
whole. A coverage percentage across UI glue code wouldn't mean anything.

---

## What's simulated, and what production does instead

Stating this plainly because the gap is the interesting part:

- **Door controllers will be simulated.** Real panels are embedded hardware making
  decisions at the door on a tight, predictable time budget. A Node process is a
  stand-in for that, not a substitute.
- **Panels here will depend on the server.** Production access control keeps working
  when the head-end dies: panels cache credentials locally and decide on their own.
  The cost is stale data: a badge revoked at the server still opens that door until
  the panel reconnects.
  The M6 stretch goal covers the event half of that (buffer, then merge on reconnect).
  Deciding from a locally cached credential set is not in the plan.
- **The video bridge will talk to a mock VMS.** Real integrations go through vendor
  SDKs with their own data models, auth, and failure modes.
- **Card formats will be simplified.** Wiegand 26-bit is the modeled format. Card
  numbers are stored as strings, because some long formats exceed JavaScript's safe
  integer range.

---

## Roadmap

- [x] **M0** Repo, workspaces, TypeScript, Vitest, CI
- [ ] **M1** Domain model, schema, seed data; readers carry a timezone
- [ ] **M2** Decision engine and table-driven tests; schedules evaluated in reader-local time
- [ ] *Stretch:* property-based tests and measured cost
- [ ] **M3** Persistence and immutable audit log
- [ ] *Stretch:* hash-chained audit log
- [ ] **M4** Alarm types, priority, state machine
- [ ] **M5** HTTP API, validation, operator roles
- [ ] **M6** WebSocket hub, panel simulator, reconnect and backfill
- [ ] *Stretch:* panel offline buffer
- [ ] **M7** Monitoring console
- [ ] **M8** Operator UX
- [ ] **M9** HR sync, VMS bridge, webhooks
- [ ] *Stretch:* binary frame decoder
- [ ] **M10** Flood test, E2E, documentation
- [ ] *Stretch:* measured throughput and latency

---

## How this is built

This repository is the project for a self-directed course. It moves one small lesson at
a time; each lesson ends in a lab that I implement myself.

- Lessons and code review come from an AI instructor (Claude). The code is mine.
- From M1 onward, every change reaches `main` through a branch, a pull request, and a
  green CI run.
- [`COURSE_LOG.md`](COURSE_LOG.md) records what each lesson built and what it verified.

---

## Running locally

Requires Node 22 or later.

```bash
git clone https://github.com/sebzicodes/ACS-Software-Mock-Application.git
cd ACS-Software-Mock-Application
npm install
npm run typecheck --workspace=packages/core
npm run test --workspace=packages/core
```

Seed, dev-server, and simulator commands will be added here as those modules land.

---

## Documentation

Planned for M10; none of these exist yet.

| Document | Contents |
|---|---|
| `docs/DESIGN-RATIONALE.md` | Every significant decision, the alternative, and the trade-off accepted |
| `docs/OPERATOR-NOTES.md` | Dispatch workflows that informed the console, and what I changed |
| `docs/INTEGRATIONS.md` | Each connector, its protocol, and the failure mode it handles |
| `docs/DATA-MODEL.md` | Entity relationships and schema |

---

## About

I'm moving from physical security operations into software engineering. I'm learning
full-stack development by building the system I used to operate: the decision engine,
the API, the real-time layer, and the console an operator sits in front of.

This project is where I'm building that skill set in the open, including the parts I
get wrong on the first attempt.

**[Gabriel-Sebastian-Davis]** · [gabriel.sebzi.davis@gmail.com] · [www.linkedin.com/in/gabriel-davis-0792423a7]

---

*SentryCore is an independent educational project. It is not affiliated with,
endorsed by, or derived from any commercial access control product, and no proprietary
code, protocols, or documentation were used in its construction.*
