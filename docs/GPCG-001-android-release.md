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

## Reconciliation against November 10 provider inspection (reported; not a signed-build attestation)

The authenticated Play Console review reported the currently published SpeedMath Coach bundle as **versionCode 7 / 1.1.1**, target SDK 36, 16 KB page support, three compiled permissions, and no displayed policy issues. Edge-to-edge and older test-track recommendations remain. Provider-facing app status was observed by the separate Astra inspection and is not cryptographic evidence of this branch's build provenance.

At the November 11 inspection, `main` was `791f0031de7d87889bd78be941d70278c771de4b`. The signed **nonpublishing** workflow subsequently completed successfully at source commit `5239fbc1235700743842bf5ed9c184988e136e30` ([run #43030323948](https://github.com/cserranno85-jpg/SpeedMath-Coach/actions/runs/43030323948)). Its downloaded signed AAB was independently hashed and signature-verified: SHA-256 `d594fd5c372fc909a0a64b2a3398ba10c764dcd7fec57f33b7d182347a1c4321`, exact source identity match, manifest package `com.caivratech.speedmathcoach`, `targetSdk=36`, **compiled versionCode 6**, and `versionName=1.1.1` in Gradle source. It was **not uploaded to Play**. This demonstrates the workflow for that immutable candidate, not the Play release authority.

## November 11 — version-code-only candidate correction

The owner's November 10 authenticated provider report stated that Play production contains **versionCode 7**, newer than the successfully built `versionCode 6`. Google requires a higher version code for an update. This review branch changes the **single application-module Gradle `versionCode` owner from 6 to 8**; package name, `targetSdk`, signing settings, application code and user-facing `versionName 1.1.1` remain unchanged. The old `versionCode 6` AAB must **never** be submitted as a new update.

**Important provider limitation:** VersionCode 8 is a candidate above the *reported production version 7*, not proof that it exceeds every version already uploaded to any Play track. Before a Play release, inspect current App Bundle Explorer and internal/closed/open/production tracks to confirm no conflicting higher or already-used code. This candidate requires a new nonpublishing signed-AAB run at its **new immutable commit**, fingerprint/manifest verification and exact-head CI. Earlier run #43030323948 does not qualify changed Gradle source. The workflow's historical artifact name (containing `v1.1.0-build4`) is not authoritative version evidence.

Release stays **HOLD** pending independently qualified AAB provenance, full current provider/release evidence (including Japan PSA/ISA), device tests, independent review, protected integration, and separate owner Play publication approval. The workflow performs no Play upload; manual publishing remains a bypass outside GPCG-001.
