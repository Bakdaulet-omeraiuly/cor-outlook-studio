---
inclusion: manual
---
# Adding or checking a clinical threshold

Use this when a task touches a guideline number or a cohort rate (`#clinical-sources`).

1. Find the **primary source** (guideline or paper) and its DOI. Copy the number from the abstract or the table, never
   from memory.
2. Record it where it is used:
   - natural-course and LVH/AS outlook rates → `docs/outlook.md` (evidence tables);
   - intervention effects → the effect file under `src/domain/interventions/effects/**` (each carries authors, year,
     journal, DOI, evidence grade, population, follow-up) and the "Treatment scenarios" section of `docs/outlook.md`.
3. **No number without a citation.** If a value cannot be sourced, leave the effect `verified: false` so the UI keeps it
   excluded and disabled with the reason. Never fill in a value.
4. **Boundaries:** write inequalities exactly as the source does (≥ vs >) and add unit tests on both sides.
