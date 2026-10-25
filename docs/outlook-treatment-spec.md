# COR Studio — Treatment scenarios in Outlook (master spec for Kiro)

Status: approved direction, written 2026-10-24. Audience: Kiro (code author). Owner: Bakdaulet.
Repo to change: `Bakdaulet-omeraiuly/cor-heart-studio` (COR Studio). Engine source: `Bakdaulet-omeraiuly/cor-outlook-engine` (public).

> **Fork implementation overrides (approved later on 2026-10-24):** implementation now lives in the private fork
> `Bakdaulet-omeraiuly/cor-outlook-studio`, commits land on that repo's `main`, and production deploys target only the
> Vercel project `cor-outlook-studio` after milestones B and D. The diagnosis engine and chat assistant were restored
> byte-identically from fork baseline `3fd7351`; treatment work must not change their existing behaviour or prompts.
> These overrides supersede §0.5 and §8.2–4 where they require a branch-only/no-production workflow.

Everything below was checked against `origin/main` of both repos on 2026-10-24. File paths are real. Where something
was NOT verified it says **VERIFY**. If reality differs from this document, stop and report; do not improvise.

---------------------------------------------------------------------------------------------------------------------

## 0. Non-negotiables (read twice)

1. **Reuse, do not rebuild.** COR Studio already has the 3D scenes, tissue shader, camera, design system, Outlook screen and
   mapping engine. Build the feature *inside* them. No second 3D pipeline, no new CSS tokens, no new fonts, no new colour palette.
2. **Cohort-level only.** Never an individual forecast, never a diagnosis, never a treatment recommendation. The notice stays on screen.
3. **No number without a citation.** Unverified effects stay excluded and visibly disabled with the reason. Never "fill in" a value.
4. **Honest provenance labels** (CT-derived vs illustrative vs modelled). Accuracy numbers mean fidelity to segmentation, not clinical accuracy.
5. **Push the branch only.** No merge to `main`, no `vercel --prod`. A push to `main` auto-deploys production.
6. **Do not weaken tests to make them pass.** Fix the code. Timeouts may be raised; assertions may not be loosened.
7. **Stay in your lane**: `src/outlook/`, `src/domain/outlook/`, `src/brain/BrainOutlook.tsx`, new `src/domain/interventions/`, `docs/`.
   Do NOT touch `src/domain/diagnosis/`, `src/app/api/assistant/`, `docs/tasks/` (friends work there).
8. **Next.js here is not the Next.js you know** (see `AGENTS.md`): read the relevant guide in `node_modules/next/dist/docs/` before writing Next code.
9. Commits: author "Kiro", committer = the local git user, no `Co-Authored-By` trailers from any other tool, no force-push.

---------------------------------------------------------------------------------------------------------------------

## 1. Purpose

A clinician opens **Outlook**, toggles drug and lifestyle buttons one after another, and sees the **organ in 5 years WITH vs
WITHOUT** the selected interventions, in 3D, with numbers and uncertainty ranges. The final product has a chat assistant (built
by friends elsewhere) that will *suggest* buttons from a diagnosis; this feature only exposes the hook.

User decisions (do not re-litigate):
- Horizon **5 years** (slider 0–5, default 5). Always two scenarios: **untreated** and **with selected interventions**.
- Two 3D views, both available at all times: **side-by-side** and **ghost overlay** (untreated as translucent ghost).
- Design must look **exactly like COR Studio**.
- Scope: **ONE heart and ONE brain only.** Heart: the open-CT heart **s0270** (my call; the user has not confirmed s0270 vs s0338 —
  keep the code record-driven so switching is a one-line change). Brain: Mindboggle **MMRR-21-5**. Do not build anything for other records.
- Buttons are cumulative and order-independent. The combined effect is shown after every click.

Non-goals: chat UI; aortic stenosis treatment buttons (see §6.4); individual prediction; new organs; importing patient data;
changing the existing AS and LVH-arms scenarios (they keep working unchanged).

---------------------------------------------------------------------------------------------------------------------

## 2. What already exists (verified file map)

COR Studio (`cor-heart-studio`, Next.js 16 + React Three Fiber, zustand):
- `src/outlook/outlookStore.ts` — `useOutlook`: `open, years, pace, brainScenario, heartScenario ("as"|"lvh"), lvhArm, lvhOverrides, set()`. MAX_YEARS = 10.
- `src/outlook/HeartOutlook.tsx` — heart Outlook. Layout `OutlookLayout`: left = `CompareCanvas` (2 records) + two cards; right = settings/evidence aside
  with `ScenarioPicker` (Segmented). Hearts are **ordinary records run through the mapping engine** (`entryFromNormalized`, `useLowAssets`, `getHeartAssetSpec`).
- `src/domain/outlook/heart.ts` — `readLvhBaseline`, `withProjectedWalls(p, ivsMm, pwMm, keySuffix, label)` (writes projected septum/posterior wall into a record copy),
  `readAsBaseline`, `withProjectedAorticStenosis`.
- `src/domain/outlook/project.ts`, `evidence.ts` — `projectLvh`, `projectBrain`, `projectAorticStenosis`, `BRAIN_SCENARIOS`, `SOURCES`, `LVMI_UPPER_NORMAL`, `LVH_*`.
- `src/brain/BrainOutlook.tsx` — `OUTLOOK_TARGET_KEYS` (hippocampus, ventricles; cortex handled by `cortexShiftMm`), `brainBaseline`, `useBrainProjection`, `BrainOutlookPanel`.
- `src/scene/`: `CameraRig.tsx`, `SceneEnvironment.tsx`, `HeartCanvas.tsx`, `CompareCanvas.tsx` (side-by-side, `syncCamera`, `sharedScale`), `materials/tissueMaterial.ts`, `materials/deformGlsl.ts` (GLSL deformation mirror of `scene/animation/deform.ts`; keep in sync, tests cover the TS reference).
- `src/components/ui/primitives.tsx` — `PanelHeader`, `Segmented`, `Button`, `InfoTip`, etc. `src/components/ui/Modal.tsx`.
- Assets: `public/models/ct/s0270/heart-{low,high}.glb` (+ ct slices), `public/brain/MMRR-21-5/{brain-low.glb,brain-manifest.json,…}`.
- Docs: `docs/design-system.md`, `docs/outlook.md` (evidence tables and the LVH model), `docs/atlas-heart.md`, `docs/cor-fit.md`, `docs/verification.md`.
- Documented limitation in `docs/outlook.md`: the 3D short-axis **cutaway does not apply in side-by-side views** (clipping isn't supported in `CompareCanvas`).
  Under each heart the **mid-ventricular short axis is drawn to scale** instead. Use that for wall thickness. Do not promise a clipped 3D cutaway.
- Existing LVH scenario has **no untreated arm** ("no verified per-year rate of progression in untreated hypertension was found").

Engine (`cor-outlook-engine`, pure TypeScript, zod only):
- `src/catalog/index.ts` ids: `ace_inhibitor_arb, beta_blocker, statin, sglt2_inhibitor, aerobic_exercise, sodium_reduction, weight_loss, smoking_cessation, bp_control, mediterranean_diet, sleep`.
- `src/effects/{heart,brain}/*.ts` — each effect: distribution (`deltaMean`, `delta95`), citation (authors, year, journal, doi), `evidenceGrade`, `population`, `verified`, `note`.
- `src/organ/{heart,brain}.ts` — parameters with units and bounds (heart: LV mass index, LV wall thickness, LV ejection fraction, left atrial volume index; brain: hippocampal volume, cortical thickness, ventricular volume, …; **read the files for exact ids**).
- `src/combine/*` — order-independent multiplicative combination, interactions, mutual exclusion, seeded Monte Carlo.
- `src/trajectory/trajectory.ts` — `trajectory({organ, baseline, interventions, horizonYears, seed, iterations})` → `TrajectoryResult` with per-parameter `untreated[]`/`treated[]` points `{year,value,low,high,clamped}`, `contributors`, `modelledTimeCourse`, `warnings`, `excludedUnverified`, `citations`.
- `src/trajectory/naturalCourse.ts` — cited natural course: brain hippocampus −1.41 %/y (Barnes 2009), cortical thickness −0.5 %/y (Fjell 2009), lateral ventricles +2 %/y (de Leon 1989); heart = "no-progression".

Currently verified (usable) effects in the engine: ACEi/ARB → LVMI −11 % (Klingbeil 2003); beta-blocker → LVMI −6 % (Klingbeil) and EF gain in HFrEF (MERIT-HF 1999);
SGLT2 → LVMI −13 % and EF (EMPA-TROPISM, JACC 2021); weight loss → LVMI −8 % (MacMahon 1986); aerobic exercise → hippocampal volume +2 % (Erickson 2011, PNAS).
Excluded as unverified (stay disabled): statin→LVMI, sodium→LVMI, exercise→LVMI, smoking→LVMI, ACEi/ARB→wall thickness, BP control→brain structure, Mediterranean diet→cortex, sleep→ventricles, smoking→cortex.

---------------------------------------------------------------------------------------------------------------------

## 3. Architecture

```
 UI (src/outlook/*)                    domain (pure, tested)                              scene (existing)
 ┌──────────────────────┐   ids        ┌────────────────────────────────────────┐
 │ Intervention buttons │────────────▶ │ src/domain/interventions/ (vendored    │
 │ year slider, view    │              │ engine: catalog, effects, organ,       │
 │ switch, Reset        │              │ combine, trajectory, util)             │
 └──────────┬───────────┘              └──────────────┬─────────────────────────┘
            │ useOutlook (zustand)                    │ TrajectoryResult (0..5 y, untreated + treated)
            │                                         ▼
            │                        ┌────────────────────────────────────────┐
            │                        │ src/domain/outlook/treatment.ts (NEW)  │
            │                        │  heart: LVMI(t) → LV mass → walls      │
            │                        │         → withProjectedWalls → record  │
            │                        │  brain: ratios(t) → BrainTarget ratios │
            │                        └──────────────┬─────────────────────────┘
            │                                       │ 2 heart records / brain ratio sets
            ▼                                       ▼
   HeartOutlook / BrainOutlook ────────▶  CompareCanvas (side) | ghost mode  ─▶ mapping engine, tissue shader, deform GLSL
```

Rules:
- Vendor the engine **source** into `src/domain/interventions/` (copy of `catalog, effects, organ, combine, trajectory, util`), with a header file
  `README.md` stating the origin repo and **pinned commit SHA**, MIT, and "do not edit here; change in the engine repo first". Keep its unit tests (port them).
  Skip `cli/` and `contract/` if they would pull in `zod` and `zod` is not already a dependency (check `package.json`; adding a dependency needs a one-line justification in the PR).
- The domain layer is **pure functions**, no React, no three.js. UI and scene only consume its output.
- One source of truth per fact: the **untreated brain arm uses COR Studio's own `evidence.ts` rates** (`BRAIN_SCENARIOS.ageing`, `projectBrain`),
  the engine supplies only the **intervention effect ratios**. Add a test asserting the engine's natural-course rates equal `evidence.ts` for ageing; if they differ, fail and report.

---------------------------------------------------------------------------------------------------------------------

## 4. Algorithms

### 4.1 Time course and combination (engine; fix before consuming)

Treated value at year t for a parameter with natural-course value `U(t)`:

`T(t) = U(t) · Π_i ( 1 + e_i · r_i(t) )` over applied, verified, non-excluded interventions, where
- `e_i` = intervention's relative effect (treated vs control, same direction convention as the parameter),
- `r_i(t) = min(1, t / F_i)` with **`F_i` the follow-up of that effect's own source**, then held.
- Mutual exclusion classes (e.g. two RAAS blockers) count once; duplicates ignored; result is independent of toggle order (sort ids).
- Ranges: seeded Monte Carlo (default seed 1, 2000 iterations) sampling each `e_i` from its published 95 % CI → 2.5/97.5 percentiles as "best/worst". Deterministic.
- Bounds: clamp to physiologic limits in `organ/*`; report `clamped: true`.

**Known weakness to fix (engine repo first, own commits and tests):** the current engine ramps *every* effect to its full value at a single `EFFECT_RAMP_FOLLOWUP_YEARS = 5`.
Real sources have different follow-ups (e.g. Erickson 2011 was a ~1-year trial; LIFE 4.8 years; **VERIFY each from the paper**). Give each effect its own
`followUpYears` (from the source) and `durability: "held" | "unknown"`. After follow-up the effect is *held* — that extrapolation beyond the trial is an assumption and must be
labelled in the UI as "modelled time course (effect held after N y)". Never present it as measured.

**Effect definition check (do not skip):** natural-course arms already contain the decline. An effect reported as a *treated-vs-control difference* must be applied as that difference;
an effect reported as an absolute change in the treated group only (e.g. "+2 %") must **not** be stacked blindly on top of the natural decline.
For each effect, document in the effect file which of the two it is, and add a unit test that fixes the arithmetic. **VERIFY** Erickson 2011 (hippocampus: exercise group +2 %, control −1.4 % over 1 year).

### 4.2 Heart: from engine output to the 3D heart (LVH treatment scenario)

Untreated heart = **today's anatomy unchanged** (no verified untreated progression exists; say so in the UI: "no progression modelled"). Do not invent a rate.
Treated heart at year t:
1. Baseline from the record or the existing `lvhOverrides` (IVSd, PWd, LVIDd in mm, BSA m²). If missing, the documented example LVH values already used by `LvhOutlook` — label them "example".
2. LVMI baseline = LVM0 / BSA, where `LVM (g) = 0.8 · 1.04 · [(IVSd + LVIDd + PWd)³ − LVIDd³] + 0.6` with dimensions in **cm** (Devereux 1986).
3. `LVMI_T(t)` from the engine (§4.1). `LVM_T = LVMI_T · BSA`.
4. Invert the formula for walls: scale IVSd and PWd by **one common factor** `k` with LVIDd held, solving for `k` (monotonic; use bisection, tolerance 0.01 g). **No wall below 6 mm.** If clamped, report it. This mirrors the existing `projectLvh` — **reuse its helpers where they exist; do not duplicate**.
5. `withProjectedWalls(record, ivs, pw, keySuffix, label)` → a second record. Both records go through the existing mapping engine; the 3D heart changes via the existing segment-thickness path in `deformGlsl.ts`. Do not add a new deformation path.
6. EF and LAVI are shown **as numbers** only (table). They are not drawn unless the mapping engine already renders them from the record (it does for EF via contraction amplitude — only if the record field is set; **VERIFY** and do not fake it).

Golden test (must pass): baseline LVMI 135 g/m², interventions `ace_inhibitor_arb + sglt2_inhibitor + beta_blocker`, year 5 → LVMI = 135 · 0.89 · 0.87 · 0.94 = **98.26** (the engine's CLI smoke result). Order of ids shuffled → identical. Only `weight_loss` → 135 · 0.92 = **124.2**.
(These multipliers come from the cited point estimates; if a source check in §4.1 changes an effect, update the golden numbers and say so in the report.)

### 4.3 Brain: from engine output to the 3D brain

Targets and meshes already exist: hippocampus, ventricles (`OUTLOOK_TARGET_KEYS`), cortex (`cortexShiftMm`).
1. Untreated: `projectBrain(brainBaseline(manifest), "ageing", years, pace)` → ratios per target (this is COR Studio's existing, cited path).
2. Treated: `ratio_treated(target) = ratio_untreated(target) · Π(1 + e_i · r_i(years))` using only verified effects for that target (currently only aerobic exercise → hippocampus). Targets with no verified effect keep the untreated ratio — and the UI says so.
3. Feed the two ratio sets to the existing brain deformation (centroid scaling for hippocampi/ventricles; inward shift along normals for cortex). No new deformation code.
4. Brain scenario for this feature is **ageing** (typical ageing), not Alzheimer's (no verified intervention effects for AD progression are in the engine).

### 4.4 Ranges and "pace"
The existing Outlook has a `pace` control (slow/mean/fast) for natural-course spreads. Keep it for the untreated arm as it works today. The treated arm adds the effect's own 95 % CI band. Show both bands in the table, never mix them into one number. Label what each band means (as `evidence.ts` already does via `SPREAD_LABEL`).

---------------------------------------------------------------------------------------------------------------------

## 5. 3D model rules

- Heart: **s0270** open-CT heart via `getHeartAssetSpec`/`useLowAssets` (same loader as the existing Outlook). Provenance badge "CT-derived (TotalSegmentator v1 s0270)" as elsewhere. Brain: MMRR-21-5 via the existing brain loaders.
- **Licences**: assets already in COR Studio are used in place (same repo). If you copy any asset anywhere else, check its licence first; BodyParts3D/Z-Anatomy parts are CC BY-SA — do not copy them out of this repo.
- Views (switch in the panel header, `Segmented`, both always available):
  1. **Side-by-side**: existing `CompareCanvas` with `syncCamera` and `sharedScale`. Left = untreated, right = with interventions. Titles: "Untreated · +5 y" / "With selected interventions · +5 y".
  2. **Ghost overlay**: both records in ONE scene, identical transform; treated solid, untreated at ~25 % opacity (`transparent`, `depthWrite: false`, rendered first). Implement as a `mode` option of `CompareCanvas` (or a sibling component reusing `tissueMaterial` and the same deformation uniforms).
     **VERIFY** `CompareCanvas.tsx` first. If the deformation uniforms are per-material and cannot be shared across two meshes in one scene without large rework, do not fake it: report what blocks it, ship side-by-side, and propose the minimal change.
- Camera: reuse `CameraRig`; both organs must fit with a margin at 1280×720 and 1920×1080. No cropping. Brain focus targets (hippocampus/ventricles) reuse the existing "turn the camera to the structure" behaviour.
- X-ray toggle (`xray` in app store) keeps working in both views.
- Wall thickness evidence: the to-scale short-axis drawing under each heart (existing). Add a 17-segment/short-axis annotation only if it already exists as a component; do not build a new one.
- Loading: `Suspense`/status text exactly like the existing Outlook (`role="status"`). No WebGL → the numbers panel remains fully usable (existing message).

---------------------------------------------------------------------------------------------------------------------

## 6. UI and design (must match COR Studio)

### 6.1 Design system (from `docs/design-system.md`, binding)
Tokens: `--bg #08090b`, panels `#0e1013/#14171b/#1b1f24`, borders `#22262c/#30353d`, text `#e8eaed`, muted `#a2aab5`, faint `#848e9a`, **accent coral `#e8836b` only for the active control**, viewport `#000/#050608`.
Fonts Geist / Geist Mono; sizes 11 (micro, uppercase, tracking-wider) / 12 / 13 / 15; numbers always `.num` (tabular). App bar 44 px; panels have a 36 px header.
Principles: images first; neutral greys, colour only for meaning; **one line on screen, details behind `InfoTip` (ⓘ)**; provenance on every view; dense right-aligned numbers; AA contrast.
**Use the existing primitives** (`PanelHeader`, `Segmented`, `Button`, `InfoTip`) and Tailwind classes already used in `HeartOutlook.tsx`. Do not add a stylesheet with its own colours.

### 6.2 Layout (inside the existing Outlook; heart shown, brain analogous)

```
┌ Outlook · <record>                                   [Side-by-side | Ghost] [X-ray] ┐ 36 px header
│ ┌────────────── 3D (CompareCanvas / ghost) ─────────────┐ ┌ aside (330 px) ────────┐
│ │  Untreated · +5 y          With interventions · +5 y  │ │ Scenario: [AS|LVH arms|Treatment] │
│ │      (heart)                    (heart)               │ │ DRUGS      ⓘ per row              │
│ │                                                       │ │  [ ACEi / ARB  A ]  [ Beta-blocker A ] …
│ └───────────────────────────────────────────────────────┘ │ LIFESTYLE                         │
│ metric strip: LVMI 135 → 135 | 98 (80–111)  EF …          │  [ Weight loss B ] [ Exercise B ] │
│ short-axis wall drawings (to scale)                       │ Year ──●── 5   [Reset]            │
│                                                           │ Evidence list / notice (ⓘ)        │
└───────────────────────────────────────────────────────────┴───────────────────────────────────┘
```
- Buttons: `Button` with `pressed` state (accent only when on), grade chip (A/B/C), ⓘ with citation, population, follow-up, "modelled time course" flag.
  Disabled (unverified) buttons show the one-line reason; details in ⓘ.
- **Opening state shows a difference**: preset ON = `ace_inhibitor_arb` + `sglt2_inhibitor` (heart) / `aerobic_exercise` (brain). **Reset** clears it. (The previous attempt opened empty, with nothing visibly changing.)
- Metric strip under the 3D (existing pattern): each number with its source on the cell; ranges as small faint text.
- Permanent one-liner (existing `OutlookCaveat`): "Cohort-level estimate — not a prediction for an individual patient; clinician decision support only." Details behind ⓘ.
- Aortic stenosis: **no intervention buttons** (no drug is shown to slow progression). The existing AS scenario stays untouched; add an ⓘ line: "No proven medication slows progression; treatment is valve replacement (AVR/TAVI) — ACC/AHA 2020." (Existing citation in `docs/outlook.md`.)
- Hook for the assistant: store field `suggestedInterventionIds: string[]` (also readable from `?suggest=id1,id2`). Suggested buttons get a subtle ring (not the accent colour). No chat code.
- English UI copy, sentence case, no emoji.

### 6.3 Store (extend `useOutlook`, don't fork it)
Add: `interventionIds: string[]`, `viewMode: "side" | "ghost"`, `suggestedInterventionIds: string[]`. Extend `HeartScenario` with `"tx"`; brain uses the existing `brainScenario` plus the intervention list. `years` already exists (clamp 0–5 for this feature).

### 6.4 Copy rules
No "will", no "recommended", no "prognosis". Use "cohort-average outlook", "modelled", "published effect". Excluded effects: "No independently verified effect for <organ> — excluded rather than estimated."

---------------------------------------------------------------------------------------------------------------------

## 7. Tests and acceptance

Unit (Vitest): golden numbers (§4.2); order-independence (shuffle 20×); mutual exclusion; duplicate ids; deterministic seed; ramp with per-effect follow-up; mass-formula inversion round-trip (|ΔLVM| < 0.5 g); wall floor 6 mm; brain ratios equal `projectBrain` for no interventions; engine natural-course == `evidence.ts` ageing; effect-definition arithmetic test (§4.1).
E2E (Playwright, **use installed Chrome via `channel: 'chrome'`; never run `playwright install` — it hung for 50 min last time; wrap network commands with `timeout 120`**):
open Outlook → treatment scenario → default preset shows a different treated LVMI than baseline; toggle a button → numbers change; toggle off → returns; both views render **non-empty canvases**; Brain: exercise changes hippocampus ratio; disabled buttons stay disabled; no-WebGL fallback; `?suggest=` ring.
Screenshots (saved to `docs/screenshots/`) are taken **after** meshes finish loading (wait for the canvas status to leave "Loading…"); the previous set was captured mid-load.
Gates before push: `npm run typecheck && npm run lint && npm test && npm run build && npm run test:e2e`.

Acceptance checklist (all must be true; report each):
- [ ] Looks like COR Studio: same tokens, app bar, panel headers, primitives, InfoTip pattern (side-by-side screenshot vs existing Outlook).
- [ ] Opening state already shows a visible treated-vs-untreated difference in 3D and in numbers.
- [ ] Both organs fit in the camera with margin; no clipping at 1280×720 and 1920×1080.
- [ ] Every number has a source; every unverified effect is disabled with its reason; "modelled time course" labelled.
- [ ] Both views work (or the ghost blocker is reported precisely).
- [ ] Untreated heart is honestly "no progression modelled".
- [ ] No new colours/fonts; no stray CSS file.
- [ ] Existing Outlook scenarios (AS, LVH arms, brain AD/ageing) and all existing tests still pass unchanged.
- [ ] Docs updated: `docs/outlook.md` (new "Treatment scenarios" section with evidence table, formulas, assumptions), vendor README with pinned SHA.

---------------------------------------------------------------------------------------------------------------------

## 8. Process

1. Create the Kiro Spec (`requirements.md`, `design.md`, `tasks.md`) derived from this file; commit this file as `docs/outlook-treatment-spec.md` in the first commit.
2. Branch `outlook-interventions` from `origin/main`. Small commits (engine-side fixes land in the engine repo first and are re-vendored with a new pinned SHA).
3. Tick `tasks.md` boxes as you finish each task.
4. Push the branch. Do **not** merge, do **not** deploy production. Report the preview deployment status and stop.
5. Final report: test results, what changed in the engine, **every modelling assumption**, effects still excluded, any place this document was wrong, screenshots (paths), and anything you could not verify.

---------------------------------------------------------------------------------------------------------------------

## 9. Mistakes from the previous attempt — do not repeat

| What went wrong (standalone demo, cor-outlook-web) | Rule now |
|---|---|
| Only two GLBs were copied; UI, CSS, scene rewritten from scratch → looked unlike COR Studio | Build inside COR Studio, reuse its scene, shader, tokens, primitives |
| Procedural low-poly heart, plain `meshStandardMaterial` | Use the CT heart through the mapping engine and `tissueMaterial` |
| Opened with nothing toggled; table "135 → 135" | Default preset ON; Reset button |
| Camera cropped both hearts | `CameraRig`, `sharedScale`, margin check at two resolutions |
| One global 5-year ramp for every effect | Per-effect follow-up (§4.1) |
| Promised a 3D cutaway that `CompareCanvas` can't clip | Use the to-scale short-axis drawings |
| `playwright install chromium` hung 50 min | `channel: 'chrome'`, `timeout` on network commands |
| Screenshots captured mid-load | Wait for load before capture |
| Tempted to loosen e2e assertions | Never loosen; fix the code |

---------------------------------------------------------------------------------------------------------------------

## 10. Open decisions (my calls, flagged)

- Heart record **s0270** (not s0338) — easy to switch.
- Brain scenario for treatments = typical **ageing** only.
- AS = information line only.
- Preset on open (ACEi/ARB + SGLT2 heart; exercise brain) — chosen so the first screen shows an effect.
- Ghost opacity ~25 %.
Report if any of these turns out to be technically wrong.
