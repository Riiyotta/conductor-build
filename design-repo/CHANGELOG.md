# Changelog

## 0.1.0 - 2026-10-22 (design-review-pending)

Initial build from the local clone snapshot.

counts: tokens=213 primitives=11 components=18 sectionContracts=41 iaSections=44 templates=11 routes=306 graphRules=13 assetRoles=12 adversarialMutations=51 adversarialControls=12

- Tokens: foundation (colour, typography, radius, spacing, breakpoint, elevation, icon size, motion), semantic, component, layout, light theme, and the LLM layer (catalog, policy, allowlist, motion patterns).
- 11 primitives, 18 components, 41 section contracts covering all 44 IA sections (feature shells grouped as one type with four variants).
- 11 templates, 306 routes mapped 1:1 to `ia.json`; 404 documented as an out-of-IA special route.
- 13 graph rules with severities and named exceptions, each checked against the real node sequences when written.
- Draft-07 schema generated from the contracts (closed enums, `additionalProperties:false`, closed motion object with const-locked `reducedMotionFallback`, closed `assetRole`).
- Semantic validator cross-referencing the declared template's real node list by (section, variant), plus maxWords, route restrictions, graph rules by severity, asset-role pins.
- Adversarial suite: 51 mutations, 12 controls (one generated per template).
- `verify_all.py` drift checks: allowlist parity, allowlistVersion, schema regeneration, token catalog/alias/theme recompute, motion parity, graph-vs-validator parity, asset-role pins, manifest and README/CHANGELOG counts, citation range AND quoted content, ia.json and route parity, stack re-diff, no absolute paths. `prove_drift.py` proves each fails on injected drift.
- Spec corrections recorded in `extraction/measured-values.json`.
