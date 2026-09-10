# SentryCore

**An access control platform built from the dispatcher's side of the glass.**

A working mock of an enterprise access control system (ACS) — credentials, readers,
schedules, access levels, and a live alarm monitoring console — written in TypeScript
and Node. Inspired by the enterprise platforms used in commercial physical security,
and designed around a question those platforms rarely ask: *what does the operator
actually need at 3am?*

> **Status:** in active development. See [Roadmap](#roadmap) for what's built and
> what's next. Not affiliated with, derived from, or a clone of any commercial product.

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
So I built it.

**What this repository demonstrates:**

| | |
|---|---|
| **Domain modeling** | Credentials, access levels, schedules, and the join between them |
| **Pure business logic** | A zero-I/O decision engine with an injected clock, tested exhaustively |
| **Real-time systems** | WebSocket event delivery with reconnect and guaranteed backfill |
| **Systems integration** | HR-feed provisioning and a cross-platform video bridge |
| **Auditability** | An append-only event log that the API physically cannot mutate |
| **Operator-first UX** | A monitoring console designed from lived dispatch experience |

<!-- Add a demo GIF of the simulator + console here once M7 lands -->

---

## Architecture

Monorepo, npm workspaces, TypeScript end to end.

```
packages/
  core/          decision engine + alarm rules   — pure, zero I/O
  server/        Express API, WebSocket hub, SQLite persistence
  panel-sim/     simulated door controllers emitting badge reads and alarms
  integrations/  HR feed sync, mock VMS bridge, outbound webhooks
  console/       React monitoring console (Vite)  ← the showcase
  admin/         cardholder / credential / access level CRUD
```

### The one rule

`core` imports nothing and performs no I/O. No database, no network, no `Date.now()`.
Time is injected.

That constraint is the reason the test suite is worth reading. Every access decision
and every alarm transition is a pure function of its inputs, which means schedule
boundaries, DST transitions, and expiry edge cases are all testable without standing
up infrastructure or faking a system clock.

### Layer separation

| Layer | Lives in | Production reality |
|---|---|---|
| Edge decisioning | `panel-sim` | Embedded firmware on door controller hardware, in C |
| Head-end logic | `core` + `server` | Typically .NET or Java against SQL Server |
| Integration middleware | `integrations` | Where Node genuinely belongs |
| Operator client | `console` | Increasingly web; often still legacy desktop |

I chose an all-JavaScript stack deliberately, and the tradeoffs are documented in
[`docs/DESIGN-RATIONALE.md`](docs/DESIGN-RATIONALE.md) — including where this
architecture would be the wrong answer in production.

---

## The access decision

The heart of the system is a single pure function:

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

---

## Alarm lifecycle

```
   NEW ──ack──> ACKNOWLEDGED ──dispatch──> DISPATCHED ──> CLEARED
    │                 │                                      ▲
    │                 └──────────── clear ───────────────────┘
    └── auto-clear (condition restored, e.g. door closed) ────┘
```

Enforced as an explicit state machine. Illegal transitions throw rather than silently
no-op. Two operators acknowledging the same alarm is a race the system resolves
deterministically — one wins, the other is told why.

Every transition writes an immutable record with a timestamp and operator ID, so any
incident can be reconstructed end to end after the fact.

---

## Testing

Test weight is concentrated where failure actually matters: the decision path, the
alarm engine, and the audit trail.

- **Decision engine** — table-driven; every reason code, schedule boundaries at exactly
  open and close, expiry on the expiry date, DST transitions, and a site in a different
  timezone from the server
- **Alarm state machine** — legal transitions succeed, illegal ones throw, escalation
  fires on unacknowledged timeout, concurrent acknowledgment resolves cleanly
- **Queue ordering** — priority sort with age as tiebreak; a P1 arriving mid-flood
  surfaces immediately; **no filter can hide an unacknowledged critical**
- **API contract** (Supertest) — auth on every route, Zod rejection of malformed input,
  and an explicit assertion that **audit events cannot be updated or deleted**
- **Integrations** — HR termination deactivates credentials; re-running the same feed
  is a no-op; a malformed row fails that row, not the batch
- **Realtime** — client disconnects mid-flood, reconnects, receives full backfill.
  **No alarm is ever silently lost.**
- **End to end** (Playwright) — simulator fires a forced-door alarm → console receives
  it → operator acknowledges, dispatches, annotates, clears → the event record shows
  the complete chain
- **Load** — sustained event flood; console stays responsive, nothing dropped

Coverage is targeted at `core` and the alarm engine rather than the repo as a whole.
A coverage percentage across UI glue code wouldn't mean anything.

---

## What's simulated, and what production does instead

Stating this plainly because the gap is the interesting part:

- **Door controllers are simulated.** Real panels are embedded hardware that must
  decide within a hard millisecond budget. A garbage-collected runtime cannot make
  that guarantee.
- **There is no offline mode yet.** Production access control keeps working when the
  head-end dies — panels cache credentials locally and decide autonomously. That is
  the single biggest architectural difference between this and a real system, and it's
  on the roadmap rather than hand-waved.
- **The video bridge talks to a mock VMS.** Real integrations go through vendor SDKs
  with their own data models, auth, and failure modes.
- **Card formats are simplified.** Wiegand 26-bit is modeled; higher bit formats
  exceed JavaScript's safe integer range and are stored as strings.

---

## Roadmap

- [ ] **M0** Repo, workspaces, TypeScript, CI
- [ ] **M1** Domain model, schema, seed data
- [ ] **M2** Decision engine and test suite
- [ ] **M3** Persistence and immutable audit log
- [ ] **M4** Alarm types, priority, state machine
- [ ] **M5** HTTP API, validation, operator roles
- [ ] **M6** WebSocket hub and panel simulator
- [ ] **M7** Monitoring console
- [ ] **M8** Operator UX enhancements
- [ ] **M9** HR sync, VMS bridge, webhooks
- [ ] **M10** Load testing, E2E, documentation

Build notes and decisions are logged in [`COURSE_LOG.md`](COURSE_LOG.md).

---

## Running locally

```bash
git clone https://github.com/<user>/sentrycore.git
cd sentrycore
npm install
npm run seed      # creates the SQLite database with sample sites and cardholders
npm run dev       # API, WebSocket hub, and console
npm run sim       # panel simulator — generates badge reads and alarms
npm test
```

No external database or services required.

---

## Documentation

| Document | Contents |
|---|---|
| [`docs/DESIGN-RATIONALE.md`](docs/DESIGN-RATIONALE.md) | Every significant decision, the alternative, and the tradeoff accepted |
| [`docs/OPERATOR-NOTES.md`](docs/OPERATOR-NOTES.md) | Dispatch workflows that informed the console, and what I changed |
| [`docs/INTEGRATIONS.md`](docs/INTEGRATIONS.md) | Each connector, its protocol, and the failure mode it handles |
| [`docs/DATA-MODEL.md`](docs/DATA-MODEL.md) | Entity relationships and schema |

---

## About

I'm moving from physical security operations into software, with a focus on the
integration side of security technology — the work of making access control, video,
identity, and HR systems function as one platform.

This project is where I'm building that skill set in the open, including the parts I
got wrong on the first attempt.

**[Name]** · [email] · [LinkedIn]

---

*SentryCore is an independent educational project. It is not affiliated with,
endorsed by, or derived from any commercial access control product, and no proprietary
code, protocols, or documentation were used in its construction.*
