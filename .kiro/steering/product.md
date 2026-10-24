---
inclusion: always
---
# Product: COR Outlook Studio

- **What it is:** a 3D heart and brain viewer driven by a patient record. Each visual change traces back to the record
  value, the rule and the evidence class behind it.
- **Focus of this fork:** the **Outlook** screen — cohort-level, evidence-based treatment scenarios. A clinician toggles
  drug / lifestyle interventions and sees the organ in 5 years **with vs without** treatment, with numbers and
  uncertainty ranges. The intervention engine is vendored under `src/domain/interventions/`.
- **Boundary:** a demo on synthetic and open data. It is **not a medical device, gives no diagnosis, and makes no
  individual forecast or treatment recommendation.** Everything shown is a cohort average from cited papers.
- **Core rule:** code computes every number; no number appears without a citation; unverified effects stay excluded and
  visibly disabled with the reason. Honest provenance labels (CT-derived vs illustrative vs modelled).

## Scope notes

- This repository is a fork of COR Studio with the diagnosis engine and chat assistant removed; it keeps the heart,
  brain, Outlook, mapping engine, scene and design system.
- Stay inside `src/outlook/`, `src/domain/outlook/`, `src/domain/interventions/`, `src/brain/`, `src/scene/`, `docs/`.
- Specs live in `.kiro/specs/outlook-interventions/`. The master spec is `docs/outlook-treatment-spec.md`.
