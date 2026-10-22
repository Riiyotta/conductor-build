# Changelog

## 0.2.0 - 2026-10-22 (design-review-pending)

Review revision: whole-page wrapper sections decomposed, utility retrieval flag, provenance/taxonomy split, quality gate.

counts: tokens=213 primitives=11 components=18 sectionContracts=42 iaSections=46 templates=11 routes=306 graphRules=13 assetRoles=12 adversarialMutations=95 adversarialControls=15

- Split `changelog.post-entry` and `changelog.entry-list` into `changelog.entry-header` (variants `index`, `post`) + `changelog.entry-body`; split `content.legal-prose` into `content.legal-header` + `content.legal-body`. Templates, `ia.json`, `IA.md`, `matrix.csv`, compatibility graph (MUST_FOLLOW text, NO_ADJACENT exception for legal), allowlist, schema and examples updated together; template ids and the 306-route mapping (207 post, 21 index, 69 docs, 2 legal) are unchanged. The template matcher no longer reports a required repeatable node as missing once it was matched (needed for the repeating header/body pairs on the index).
- `content.prose-article` kept as one body with the justification and measured numbers in its contract and in `measured-values.json` (`prose-article-enterprise-wrapper-height`).
- `retrievalEligible` (closed boolean, false for the four overlay/dialog sections): contracts, schema (const per section, optional node property), allowlist `retrievalIneligibleSections`, code pin `RETRIEVAL_INELIGIBLE`, `retrieval-eligibility` check.
- Contracts now carry separate closed `semantic` {semanticId, category, iaSections} and `source` {sourceId, implementedBy, measuredFrom} objects (`schema/section-contract.schema.json`, `validate_contract`, `contract-shape` check, ia.json category/implementing-file parity). Feature-shell and HubSpot-form contracts now also cite the per-feature and form component files that `ia.json` names.
- Whole-page-wrapper gate (`wrapper-gate`): section heights for all 306 routes measured at 1440px (`extraction/measure_sections.mjs`, ledger in `measured-values.json`), HERO >1800px warn / >3000px fail, any section >50% of its page warn / >60% fail, reviewed prose-by-nature whitelist with caps and stale detection.
- Three new example PageSpecs (legal, changelog-post, changelog-index); adversarial suite 95 mutations (decomposition, contract shape, retrieval pins) and 15 controls; `prove_drift.py` 49 cases including the gate (hero 3500px, original post-wrapper bug, whitelist removed/stale/over cap, dropped node or route, loosened thresholds, warn cases).
- Not done: the visual-parity gate cannot be measured here (no live-site capture available).

## 0.1.0 - 2026-10-22 (design-review-pending)

Initial build from the local clone snapshot. At this version: 41 section contracts, 44 IA sections, 51 adversarial mutations, 12 controls (later counts are in the entry above).

- Tokens: foundation (colour, typography, radius, spacing, breakpoint, elevation, icon size, motion), semantic, component, layout, light theme, and the LLM layer (catalog, policy, allowlist, motion patterns).
- 11 primitives, 18 components, 41 section contracts covering all 44 IA sections (feature shells grouped as one type with four variants).
- 11 templates, 306 routes mapped 1:1 to `ia.json`; 404 documented as an out-of-IA special route.
- 13 graph rules with severities and named exceptions, each checked against the real node sequences when written.
- Draft-07 schema generated from the contracts (closed enums, `additionalProperties:false`, closed motion object with const-locked `reducedMotionFallback`, closed `assetRole`).
- Semantic validator cross-referencing the declared template's real node list by (section, variant), plus maxWords, route restrictions, graph rules by severity, asset-role pins.
- Adversarial suite and `verify_all.py` drift checks: allowlist parity, allowlistVersion, schema regeneration, token catalog/alias/theme recompute, motion parity, graph-vs-validator parity, asset-role pins, manifest and README/CHANGELOG counts, citation range AND quoted content, ia.json and route parity, stack re-diff, no absolute paths. `prove_drift.py` proves each fails on injected drift.
- Spec corrections recorded in `extraction/measured-values.json`.
