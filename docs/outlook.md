# Outlook: published rates of change applied to today's anatomy

The **Outlook** button in the app bar opens and closes this screen in either module. It answers one question for a
clinician: *if this anatomy changed at the published average rate for a condition, what would it look like after N
years?* It is a scenario view built from cohort averages. It is **not** a forecast for an individual, and it is not a
diagnosis or a treatment recommendation. The screen says this next to the numbers.

Code: `src/domain/outlook/` (evidence table, pure projection, heart record copy), `src/outlook/` (UI, store),
`src/brain/BrainOutlook.tsx` (brain panel and the targets the 3D deformation acts on). Tests:
`tests/unit/outlook.test.ts`, `tests/e2e/outlook.spec.ts`.

## Model

* Brain volumes compound a signed annual rate: `V(t) = V0 · (1 + r/100)^t`.
* Aortic stenosis changes linearly, because Otto 1997 reports changes per year: `AVA(t) = AVA0 + ΔA·t`,
  `Vmax(t) = Vmax0 + ΔV·t`. The area never falls below 0.3 cm².
* **Pace** chooses which end of each source's reported spread to use. The spread means different things in different
  sources, and the panel names it for every rate:
  * 95% CI of the cohort mean (Barnes 2009)
  * ±1 SD between patients (Sluimer 2008, Otto 1997)
  * no spread reported (de Leon 1989, Fjell 2009), in which case all three paces are equal

  For aortic stenosis the slower end is clamped at no progression, because mean − 1 SD would mean the valve
  opens up, which does not happen without intervention.

## Evidence (every number copied from the cited abstract)

| Target | Typical ageing | Alzheimer's disease | Source |
|---|---|---|---|
| Hippocampi | −1.41 %/y (95% CI −0.52 to −2.30) | −4.66 %/y (−3.92 to −5.40) | Barnes 2009, meta-analysis, 595 AD / 212 controls, [doi](https://doi.org/10.1016/j.neurobiolaging.2008.01.010) |
| Ventricles (lateral + third) | ≈ +2 %/y | ≈ +9 %/y | de Leon 1989, CT, 50 AD / 45 controls, [doi](https://doi.org/10.2214/ajr.152.6.1257) |
| Cortex | ≈ −0.5 %/y (temporal/prefrontal) | −1.9 ± 0.9 %/y (whole brain) | Fjell 2009, [doi](https://doi.org/10.1523/JNEUROSCI.3252-09.2009); Sluimer 2008, [doi](https://doi.org/10.1212/01.wnl.0000311446.61861.e3) |

| Aortic stenosis | Per year (mean ± SD) | Source |
|---|---|---|
| Valve area | −0.12 ± 0.19 cm² | Otto 1997, 123 adults, [doi](https://doi.org/10.1161/01.cir.95.9.2262) |
| Peak velocity | +0.32 ± 0.34 m/s | 〃 |
| Mean gradient | +7 ± 7 mmHg (shown, not projected) | 〃 |
| Alive without AVR at 2 years | < 3 m/s: 84 ± 16 %; 3–4 m/s: 66 ± 13 %; > 4 m/s: 21 ± 18 % | 〃 |
| Grade | severe: Vmax ≥ 4 m/s or AVA ≤ 1.0 cm²; moderate: 3–3.9 m/s or 1.0–1.5 cm²; mild: 2–2.9 m/s or > 1.5 cm² | ACC/AHA 2020, [doi](https://doi.org/10.1161/CIR.0000000000000923) |

## Known approximations (shown in the UI)

* **Brain anatomy vs cohorts.** The brain is one healthy adult volunteer (Mindboggle MMRR-21-5). The rates come from
  older cohorts (about 60–90 years old; AD mean about 70).
* **Cortex.** Fjell's rate is for temporal and prefrontal cortex, and Sluimer's is for the whole brain. Both are applied
  here to the whole cortex.
* **3D brain deformation.** Hippocampi and ventricles are scaled about their own centroid by the cube root of the volume
  ratio, so their shape is kept. The cortex moves inward along its normals by `2.5 mm × (1 − ratio)`, which assumes the
  volume loss is all thinning. The MRI slices are hidden while the outlook is open, because they show today's scan.
* **Ventricle rate.** It was measured on CT in 1989. A modern MRI rate would replace it once one is verified from a
  primary source.
* **3D heart.** The heart shows the projected grade through the existing stenosis rule
  (`R-VALVE-STEN-01`, an illustrative leaflet opening per grade). The quantitative picture is the orifice disc drawn to
  scale under each heart: disc area ∝ AVA, against a 3.5 cm² normal ring. The *Aortic valve* button freezes both hearts
  at mid-ejection with the outer wall see-through.
* **Individual variation.** For valve area the between-patient SD is larger than the mean. The range shown is the
  cohort spread, not a prediction interval for a person.

## Hypertensive LVH on treatment (heart)

| Quantity | Value | Source |
|---|---|---|
| LVMI change, losartan-based | −21.7 ± 21.8 g/m² (baseline → last study) | LIFE echo substudy, Devereux 2004, RCT 457 / 459, [doi](https://doi.org/10.1161/01.CIR.0000141573.44737.5A) |
| LVMI change, atenolol-based | −17.7 ± 19.6 g/m² | 〃 |
| Time base | 4.8 years of treatment | Gerdts 2009 (same substudy), [doi](https://doi.org/10.1080/08037050903047202) |
| LV mass | `0.8 · 1.04 · [(IVSd + LVIDd + PWd)³ − LVIDd³] + 0.6` g (cm) | Devereux 1986, [doi](https://doi.org/10.1016/0002-9149(86)90771-x) |
| Upper normal LVMI | 115 g/m² men, 95 g/m² women | ASE/EACVI 2015, [doi](https://doi.org/10.1016/j.echo.2014.10.003) |
| Class effects (context only) | ARB −13, CCB −11, ACEi −10, diuretic −8, β-blocker −6 % | Klingbeil 2003, [doi](https://doi.org/10.1016/s0002-9343(03)00158-x) |

* The projected mass is `LVM0 + ΔLVMI · BSA · min(1, t / 4.8)`. Between today and 4.8 years the change is
  **interpolated linearly**. This is an assumption: the abstract reports baseline and the last study only. After 4.8
  years the change is held, because the trial has no data beyond that point.
* The walls come from inverting the mass formula. IVSd and LVPWd are scaled by one common factor with LVIDd held,
  because LIFE attributes the regression mainly to reduced concentricity. No wall is thinned below 6 mm.
* The slow pace (mean + 1 SD) is clamped at no regression. The fast pace is mean − 1 SD.
* BSA comes from the record's height and weight (Mosteller). When the record has neither, an example value of 1.9 m²
  is used, and the field is labelled as an example.
* Under each heart the mid-ventricular short axis is drawn to scale (septum on the left, posterior wall on the right).
  The 3D short-axis cutaway is not offered here because clipping does not apply in the side-by-side views (an existing
  limitation of `CompareCanvas`).
* There is no untreated arm. No verified per-year rate of progression in untreated hypertension was found.

## Next candidates (not built)

* Age-matched normative centiles (Brain Charts for the Human Lifespan, Bethlehem 2022) in place of fixed rates.


## Treatment scenarios

Status in this fork: the heart LVH treatment scenario is implemented side-by-side with the default ACEi/ARB + SGLT2 preset. Brain treatment and the ghost overlay follow in milestones C and D. The versioned master spec is [`docs/outlook-treatment-spec.md`](outlook-treatment-spec.md).

Full supporting material:

- [`interventions-evidence.md`](interventions-evidence.md) — verbatim evidence snapshot from `cor-outlook-engine` commit `9cdad09ac77f027fff185c229b98633d52db586a`: every effect, citation, DOI, grade, excluded/unverified item and the original engine modelling notes.
- [`interventions-attributions.md`](interventions-attributions.md) — only the COR Studio assets used here: TotalSegmentator v1 s0270 and Mindboggle MMRR-21-5.
- `src/domain/interventions/README.md` — vendored-source provenance and pinned SHA.

### Combination and time course

For parameter `p`, intervention effects are relative changes and combine multiplicatively:

`T_p(t) = U_p(t) · Π_i [1 + e_(i,p) · min(1, t / F_(i,p))]`

- `U_p(t)` is the untreated course.
- `e_(i,p)` is the verified published effect for intervention `i` on parameter `p`.
- `F_(i,p)` is that effect's own source follow-up (`followUpYears`), not one global horizon.
- Duplicate ids and mutually exclusive classes count once. Inputs are sorted, so toggle order cannot change the result.
- The effect ramps linearly from zero at today to the published total effect at its source follow-up, then is held. The ramp and post-follow-up hold are modelling assumptions, labelled **modelled time course** in the UI; they are not measured annual effects.
- Likely/best/worst comes from seeded Monte Carlo (`seed = 1`, 2000 iterations), sampling each effect's 95% CI and reporting the 2.5th/97.5th percentiles. Physiological bounds are applied by the engine and reported when clamped.

The copied engine evidence snapshot still contains its earlier global-five-year-ramp paragraph. The vendored code at the pinned commit and this section are authoritative for this integration: each contribution now uses its own `followUpYears` (Erickson exercise 1 year; EMPA-TROPISM 0.5 year; currently modelled ACEi/ARB, beta-blocker and weight-loss effects 1 year), with `durability: "held"` explicitly marking extrapolation beyond follow-up.

### Heart: LVMI to the existing 3D mapping path

Untreated hypertensive LVH is held at today's anatomy: **no progression modelled**. No verified, general per-year structural progression rate was found, so none is estimated.

1. Baseline LV mass uses the existing ASE/Devereux formula (dimensions in cm):
   `LVM = 0.8 · 1.04 · [(IVSd + LVIDd + PWd)^3 − LVIDd^3] + 0.6 g`.
2. `LVMI_0 = LVM_0 / BSA`; the intervention engine supplies `LVMI_T(t)`.
3. `LVM_T(t) = LVMI_T(t) · BSA`.
4. Existing `wallsForMass()` scales IVSd and LVPWd by one common factor with LVIDd held; neither wall may fall below 6 mm.
5. `withProjectedWalls()` writes the two states to ordinary record copies. Both pass through the existing mapping engine and `CompareCanvas`; there is no second heart-deformation path. The short-axis drawings under the hearts remain the quantitative to-scale wall view.

Golden point estimates at year 5 (full published effects reached and held):

| Selection | LVMI multiplier | Example from 135 g/m² |
|---|---:|---:|
| ACEi/ARB + SGLT2 inhibitor + beta-blocker | `0.89 · 0.87 · 0.94` | 98.26 g/m² |
| Weight loss | `0.92` | 124.2 g/m² |

### Brain: existing ageing path plus intervention difference

The untreated arm stays on COR Studio's existing typical-ageing path: `projectBrain(baseline, "aging", years, pace)`. A parity test fails if the vendored engine's natural-course means differ from `BRAIN_SCENARIOS.aging` (hippocampus −1.41%/year, cortex −0.5%/year, ventricles +2%/year).

For each target, the treated ratio is `untreated ratio · intervention multiplier`. Currently only aerobic exercise → hippocampal volume is verified (+2% at the Erickson 2011 one-year follow-up). Cortex and ventricles remain equal to untreated when no verified effect contributes. The existing brain centroid scaling and cortex-normal displacement consume the two ratio sets; no new deformation algorithm is introduced.

### Intervention evidence used

| Organ | Intervention → parameter | Published effect | Grade / follow-up | Source |
|---|---|---:|---|---|
| Heart | ACE inhibitor / ARB → LVMI | −11% (modelled pooled class value; CI −8% to −15%) | A / 1 y modelled follow-up | Klingbeil 2003, DOI `10.1016/S0002-9343(03)00158-X` |
| Heart | Beta-blocker → LVMI | −6% | A / 1 y modelled follow-up | Klingbeil 2003, same DOI |
| Heart | Beta-blocker → EF (number only) | +17% relative (HFrEF-specific) | A / 1 y | MERIT-HF 1999, DOI `10.1016/S0140-6736(99)04440-2` |
| Heart | SGLT2 inhibitor → LVMI | −13% | A / 0.5 y | EMPA-TROPISM 2021, DOI `10.1016/j.jacc.2020.11.008` |
| Heart | SGLT2 inhibitor → EF (number only) | +8% relative (HFrEF-specific) | A / 0.5 y | EMPA-TROPISM 2021, same DOI |
| Heart | Weight loss → LVMI | −8% | B / 1 y modelled follow-up | MacMahon 1986, DOI `10.1056/NEJM198602063140602` |
| Brain | Aerobic exercise → hippocampal volume | +2% vs untreated course | B / 1 y | Erickson 2011, DOI `10.1073/pnas.1015950108` |

### Excluded rather than estimated

These catalog buttons have no verified structural effect for the selected organ and remain disabled: ACEi/ARB → wall thickness (LVMI is used instead); statin → LVMI; sodium reduction → LVMI; aerobic exercise → heart LVMI; smoking cessation → heart LVMI; BP control → modelled brain structure; Mediterranean diet → cortical thickness; sleep → ventricular volume; smoking cessation → cortical thickness. Their source context and the reason for exclusion remain visible behind each InfoTip.

### Aortic stenosis

The existing untreated aortic-stenosis scenario is unchanged. It has no intervention buttons. The treatment panel states: “No proven medication slows progression; treatment is valve replacement (AVR/TAVI) — ACC/AHA 2020,” DOI `10.1161/CIR.0000000000000923`.

### Safety and provenance

All outputs are cohort averages, not individual forecasts, diagnoses, treatment recommendations, or medical-device output. The treatment heart uses the existing s0270 CT-derived scene (TotalSegmentator v1, CC BY 4.0); the brain uses MMRR-21-5 (Mindboggle-101, CC BY 4.0). Accuracy values describe fidelity to source segmentations, never clinical accuracy.
