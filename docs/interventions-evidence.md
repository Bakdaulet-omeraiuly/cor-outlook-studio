> Source: `Bakdaulet-omeraiuly/cor-outlook-engine` commit `9cdad09ac77f027fff185c229b98633d52db586a`.

# Evidence Table

**Cohort-level evidence only. Not a prediction for any individual patient.
For clinician decision support.** Every numeric effect used in computation is
listed with its source and evidence grade. Effects that could not be sourced to
a usable published effect size are marked **unverified** and are **excluded
from computation** (they never contribute an invented number); they are listed
in the "Unsourced / excluded" section and surfaced in each run's `warnings` and
`provenance.excludedUnverified`.

Effects are expressed as a **relative multiplicative change** on a parameter:
`value_new = value_old * (1 + delta)`. A delta of `-0.11` means an 11%
reduction. The 95% CI is on that delta and drives the Monte Carlo range.

Evidence grades: **A** = meta-analysis / multiple RCTs, **B** = single RCT or
consistent data, **C** = mechanistic / observational / indirect.

## Verified effects (used in computation)

| Organ | Intervention | Parameter | Δ mean | 95% CI | Grade | Source |
|-------|--------------|-----------|--------|--------|-------|--------|
| Heart | ACE inhibitor / ARB | LV mass index | −0.11 | −0.08 … −0.15 | A | Klingbeil AU, et al. *Am J Med.* 2003;115(1):41–46. DOI: 10.1016/S0002-9343(03)00158-X. ARB −13% (8–18%), ACEi −10% (8–12%); pooled here. |
| Heart | Beta-blocker | LV mass index | −0.06 | −0.02 … −0.10 | A | Klingbeil AU, et al. *Am J Med.* 2003;115(1):41–46. Beta-blockers weakest LV-mass reducer in that meta-analysis (~6%). |
| Heart | Beta-blocker | Ejection fraction | +0.17 | +0.10 … +0.24 | A | MERIT-HF Study Group. *Lancet.* 1999;353(9169):2001–2007. DOI: 10.1016/S0140-6736(99)04440-2. HFrEF-specific; ~+6 absolute EF points on ~35% baseline. |
| Heart | SGLT2 inhibitor | LV mass index | −0.13 | −0.04 … −0.22 | A | Santos-Gallego CG, et al. (EMPA-TROPISM) *J Am Coll Cardiol.* 2021;77(3):243–255. DOI: 10.1016/j.jacc.2020.11.008. CMR LV mass −17.8±31.9 g vs +4.1 g placebo (~−13% net). |
| Heart | SGLT2 inhibitor | Ejection fraction | +0.08 | +0.03 … +0.13 | A | Santos-Gallego CG, et al. (EMPA-TROPISM) *JACC.* 2021. HFrEF-specific LVEF improvement. |
| Heart | Weight loss | LV mass index | −0.08 | −0.03 … −0.14 | B | MacMahon SW, et al. *N Engl J Med.* 1986;314(6):334–339. DOI: 10.1056/NEJM198602063140602. Corroborated by Cuspidi C, et al. *Am J Hypertens.* 2014 (bariatric meta-analysis, SMD −0.46). Non-surgical modeled conservatively. |
| Brain | Aerobic exercise | Hippocampal volume | +0.02 | +0.01 … +0.034 | B | Erickson KI, et al. *Proc Natl Acad Sci USA.* 2011;108(7):3017–3022. DOI: 10.1073/pnas.1015950108. RCT; +2% (left +2.12%, right +1.97%) vs ~−1.4% control. |

## Unsourced / excluded effects (NOT used in computation)

These are intentionally `verified: false`. No number is invented for them; they
are excluded and reported in warnings. Each has a `TODO` note in its source
file.

| Organ | Intervention | Parameter | Why excluded |
|-------|--------------|-----------|--------------|
| Heart | ACE inhibitor / ARB | LV wall thickness | Wall-thickness-specific regression not sourced to a numeric meta-analysis (mass is sourced, wall thickness is not). |
| Heart | Statin | LV mass index | Strong outcome evidence (CTT Collaboration, *Lancet* 2010, DOI: 10.1016/S0140-6736(10)61350-5) but no established quantified LV-mass regression. |
| Heart | Sodium reduction | LV mass index | Lowers BP (He FJ, et al. *BMJ* 2013;346:f1325) but an LV-mass regression independent of BP is not quantified. |
| Heart | Aerobic exercise | LV mass index | BP benefit known (Cornelissen VA, Smart NA. *J Am Heart Assoc.* 2013;2:e004473) but pathological-LVMI regression is confounded by physiological athlete remodeling. |
| Heart | Smoking cessation | LV mass index | No quantified LV structural regression effect size. |
| Brain | Intensive BP control | Ventricular volume | SPRINT MIND (*JAMA* 2019;322(6):524–534, DOI: 10.1001/jama.2019.10551) measured **white-matter-lesion volume** (not modeled in v0.1) and total brain volume, not lateral ventricular volume. Cognitive benefit: Williamson JD, et al. *JAMA* 2019;321(6):553–561. |
| Brain | Mediterranean diet | Cortical thickness | Observational association only (Luciano M, et al. *Neurology* 2017;88(5):449–455); no randomized structural effect size. Flagged illustrative. |
| Brain | Sleep optimization | Ventricular volume | Observational association only (Sexton CE, et al. *Neurology* 2014;83(11):967–973); no randomized structural effect size. Flagged illustrative. |
| Brain | Smoking cessation | Cortical thickness | Observational recovery of cortical thinning (Karama S, et al. *Mol Psychiatry* 2015;20(6):778–785); no randomized structural effect size. Flagged illustrative. |

## Interaction terms

v0.1 ships **no** pairwise interaction terms. In the absence of a cited source,
the engine assumes independence (effects compose multiplicatively, giving
diminishing returns, but with no extra synergy/antagonism term). Add entries to
`src/combine/interactions.ts` only with a published source.

## Important caveats

- **Population mismatch.** Several effects are population-specific (e.g.
  beta-blocker and SGLT2 EF gains are HFrEF-specific; LV-mass reductions are
  from hypertensive/obese cohorts). Applying them to a baseline from a
  different population is an extrapolation. The engine does not auto-detect
  this; it is the caller's responsibility, and each effect's `population` and
  `note` document the context.
- **Relative-change modeling.** Converting absolute trial changes (e.g. grams,
  EF points) to relative deltas assumes a representative baseline. This is a
  cohort-level approximation, not individualized.
- **Combination model.** Multiplicative composition is a modeling choice
  (diminishing returns, order independence). It is not itself a trial-derived
  interaction and should be read as a structured aggregation, not a measured
  combined-therapy effect size.

## Time dimension (0–5 year trajectory)

The 3D viewer compares an **untreated** (natural-course) trajectory with a
**treated** one over 0–5 years. Two kinds of number feed this, both cohort-level.

### Natural-course (untreated) rates — cited

Applied as a relative change per year: `value(t) = value0 · (1 + r)^t`.

| Organ | Parameter | r (per year) | Range (per year) | Source |
|-------|-----------|--------------|------------------|--------|
| Brain | Hippocampal volume | −1.41% | −0.52% … −2.3% (95% CI of mean) | Barnes J, et al. *Neurobiol Aging.* 2009;30:1711–1723. DOI: 10.1016/j.neurobiolaging.2008.01.010 (control arm = typical ageing). |
| Brain | Mean cortical thickness | −0.5% | (no spread reported) | Fjell AM, et al. *J Neurosci.* 2009;29:15223–15231. DOI: 10.1523/JNEUROSCI.3252-09.2009 (temporal/prefrontal; applied to mean cortex). |
| Brain | Lateral ventricular volume | +2.0% | (no spread reported) | de Leon MJ, et al. *AJR Am J Roentgenol.* 1989;152:1257–1262. DOI: 10.2214/ajr.152.6.1257 (CT, normal ageing). |
| Heart | LVMI, LV wall thickness, EF, LAVI | **0% — no progression modelled** | — | No single defensible cohort rate for untreated structural progression over 0–5 y; held flat rather than invented. |

### Treated trajectory — modelling assumption (ramp)

Intervention effects in `src/effects` are reported as a single treated-vs-control
value at trial follow-up; the trials do not give a per-year course. The engine
therefore applies each effect with a **documented linear ramp**: the relative
effect grows linearly from 0 at year 0 to its full published value at the
follow-up time (`EFFECT_RAMP_FOLLOWUP_YEARS = 5`), then is held. Every treated
trajectory that uses this is flagged `modelledTimeCourse: true` and labelled
**"modelled time course"** in the UI. No measured time course is invented.

The treated multiplier at year *t* is the natural-course multiplier × the
product of each verified intervention's ramped `(1 + delta·rampFraction(t))`,
combined multiplicatively (diminishing returns), capped at |relative change| ≤
0.6, then clamped to physiological bounds. The likely value is from the means;
the best/worst band is a seeded Monte Carlo over the effect CIs and the
natural-course spread (deterministic, order-independent).

### Unverified effects — excluded (unchanged from the one-shot model)

The same effects remain `verified: false` and are excluded from the trajectory:
statin→LVMI, sodium reduction→LVMI, aerobic exercise→LVMI (heart), smoking
cessation→LVMI (heart), ACEi/ARB→LV wall thickness; and for the brain:
BP control→structural parameter, Mediterranean diet→cortical thickness,
sleep→ventricular volume, smoking cessation→cortical thickness. See the table
above and each `src/effects/**` file for the per-effect rationale.

### Aortic stenosis

No intervention toggles. The viewer shows an info card: no proven medication
slows AS progression; treatment is AVR/TAVI. Otto CM, Nishimura RA, Bonow RO,
et al. 2020 ACC/AHA Guideline. *Circulation.* 2021;143:e72–e227. DOI:
10.1161/CIR.0000000000000923.
