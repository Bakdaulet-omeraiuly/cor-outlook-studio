> Source adapted from `Bakdaulet-omeraiuly/cor-outlook-engine` commit `9cdad09ac77f027fff185c229b98633d52db586a`.

# Attributions — treatment-scenario assets

COR Outlook Studio uses the meshes already bundled with COR Studio. It does **not** use or claim the standalone engine demo's procedural-heart asset.

## Heart — open CT s0270

- **Files:** `public/models/ct/s0270/heart-{low,high}.glb` and the associated cropped slice data.
- **Dataset:** TotalSegmentator dataset v1.0. Wasserthal J, Meyer M, Breit HC, Cyriac J, Yang S, Segeroth M. “TotalSegmentator: Robust Segmentation of 104 Anatomic Structures in CT Images.” *Radiology: Artificial Intelligence.* 2023. Dataset: https://zenodo.org/records/6802614.
- **Licence:** **CC BY 4.0**.
- **Changes:** source labels were converted to meshes, measurements, and COR Studio's attribute contract by `pipeline/`. The published slice volume is cropped to the heart and rescaled to 8-bit HU −300…700 for display.
- **Provenance shown in-app:** “CT-derived (TotalSegmentator v1 s0270).” This describes fidelity to the source segmentation, not clinical accuracy.

## Brain — Mindboggle MMRR-21-5

- **Files:** `public/brain/MMRR-21-5/brain-low.glb`, manifest, and cropped display volumes.
- **Dataset:** Mindboggle-101 release 3. Klein A, Tourville J. “101 labeled brain images and a consistent human cortical labeling protocol.” *Frontiers in Neuroscience.* 2012;6:171. DOI: 10.3389/fnins.2012.00171. https://osf.io/nhtur/
- **Underlying scan:** MMRR-21, Multi-Modal MRI Reproducibility Resource. Landman BA, et al. *NeuroImage.* 2011.
- **Licence:** **CC BY 4.0**, as listed on OSF.
- **Changes:** labels were converted to meshes and measurements; the skull-stripped T1 was cropped and rescaled to 8-bit for display.

## Exclusions

- No real patient DICOM is included or deployed.
- No engine-demo procedural heart is used by this fork.
- BodyParts3D / Z-Anatomy assets are not copied from the engine demo. Existing COR Studio atlas assets retain their original in-repo attribution and ShareAlike terms where applicable.
