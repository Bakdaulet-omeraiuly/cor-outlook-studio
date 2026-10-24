# Vendored: cor-outlook-engine

This directory is a **vendored copy** of the intervention engine source from

- **Origin:** https://github.com/Bakdaulet-omeraiuly/cor-outlook-engine
- **Pinned commit:** `9cdad09ac77f027fff185c229b98633d52db586a` (branch `main`)
- **Licence:** MIT (same as this repo and the engine).

It is a pure-TypeScript, cohort-level engine: `catalog` (intervention registry),
`effects/{heart,brain}` (cited effect distributions per intervention), `organ`
(parameters, units, bounds), `combine` (order-independent multiplicative
combination, mutual exclusion, interactions, seeded Monte Carlo), `trajectory`
(0–N year untreated vs treated series with per-effect follow-up ramp and cited
natural-course rates), `util` (seeded RNG), and `contract` (zod schema).

## Do not edit here

Change the engine in its own repo first, run its tests, then **re-vendor** and
update the pinned SHA above. Editing files here directly makes the copy drift
from the source of truth. The only local change applied on vendoring is
mechanical: relative import specifiers have their `.js` extension removed so
they resolve under this project's `moduleResolution: "bundler"`.

## What is NOT vendored

- `cli/` — a Node command-line entry point, not needed in the browser app.

## Consuming it

Import from the barrel: `@/domain/interventions` (re-exports `trajectory`,
`listInterventions`, `getInterventionEffects`, `getOrganModel`, types, etc.).
The outlook domain layer (`src/domain/outlook/treatment.ts`) is the only place
that turns engine output into COR Studio records/ratios.
