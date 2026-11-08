# SpeedMath Coach — GPCG-001 Android release gate

The signed-AAB GitHub Actions workflow now records the SHA-256 of the **same AAB bytes** verified by jarsigner, the immutable workflow source SHA, and byte size. It attaches `gpcg-001-build-identity.json` beside the AAB.

**This is a build-identity check, not Google Play compliance or publishing approval.** No Play upload is performed by this workflow. The existing artifact name is preserved for consumers (despite a historic version-looking name). The bundle's target SDK 36 is currently source configuration, not an independent signed-AAB observation. Release minification is currently disabled; Play bundle-explorer DEX size determines whether February 2027 threshold enforcement applies.

The shared GPCG-001 evidence owner is the private `cserranno85-jpg/caivra-tech-caivra-optimization-framework` repository, initial review PR #2. Because this application repository is PUBLIC, it uses only a public-safe pinned build-fingerprint implementation and stores **no private account evidence**. Align changes to the central gate through a reviewed PR; do not silently fork policy rules.

## Mandatory manual prepublication decision
1. Download the exact signed AAB and `gpcg-001-build-identity.json` from the same workflow run; confirm the SHA-256 matches local bytes and original source SHA.
2. If uploading to Play draft/internal track, record the corresponding exact bundle reference, package, versionCode, compiled manifest, target SDK, DEX and signing details. Do not infer them from source.
3. Securely retain the current Play Console policy status/warnings, app content/Data safety, billing/payment and Japan PSA/ISA determination, crash/ANR/memory vitals. Reconcile effective requirements with official Google policy.
4. Evaluate a **private** SpeedMath evidence JSON against the exact AAB using the shared GPCG-001 `assess` script pinned to its reviewed immutable revision. Missing evidence means HOLD; eligibility is review-only.
5. An independent reviewer and app release owner must approve the **exact artifact**. Never put private Play screenshots, payment information, signed keys or access tokens in this public repository.

Owner-confirmed completed: trader declaration and consolidated application Terms submission at https://caivra.com/legal/app-terms/. These are not outstanding tasks unless contradicted by new evidence.

A manual Play Console upload is not blocked by GitHub CI. Do not describe GPCG-001 as an enforced Google Play publication guard until actual store-publication authority and branch protections are separately established.
