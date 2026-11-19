# Copilot and AI contributor guidance — SpeedMath Coach

- Inspect current `README.md`, `package.json`, relevant `docs/GPCG-001-android-release.md`, existing Android/ios/CI workflows, tests, and exact Git commit before changing source.
- Treat the Android signed-AAB identity gate, `gpcg-001-build-identity.json`, private compliance evidence and actual Google Play Console state as **different sources**. No GitHub CI or AI proposal can authorize app store publication.
- Preserve app identity, bundle/versionCode monotonicity, native backup/privacy exclusions, signing provenance, generated asset signatures, and accurate platform copy.
- Use small, reviewable (or intentionally stacked) PRs; test against the exact candidate SHA; note negative regressions, privacy, rollback, store-review readiness and owner approval.
- Keep private console reports, review accounts, secret keys, passwords and signing artifacts out of this **public repository**, issue artifacts, PR comments and AI prompts.
- Existing build and CI workflows are expensive; do not add new scheduled build jobs or rerun release builds simply to test documentation. Public standard-runner CI does not draw the private Actions compute allowance.
- Dependabot GitHub Actions updates, when enabled, propose at most one monthly action update PR; updates are **not** merged automatically. Verify all changed `uses` references and rerun existing CI before approving.
- Do not enable Copilot cloud agents, AI review loops, credentials, EAS publishing, Android/Apple uploads, billing or deploy workflows without their independent scope/cost/release authorization.
- GitHub cost reference: https://github.com/caivra-tech/caivra-platform-ops/blob/main/docs/GITHUB_2026_USAGE_AND_COST_GUARD.md
