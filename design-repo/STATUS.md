# design-repo status: INCOMPLETE (work in progress)

This folder is a partial build and has **not** been validated. Present: `tokens/` (foundation, semantic, component, layout, themes, llm), `primitives/`, `components/`, `sections/` (41), `templates/`, `compatibility/`, and part of `schema/`.

Still missing: the full `pagespec.schema.json` + example, `semantic_validate.py`, adversarial tests, `extraction/` (measured values + `verify_all.py`), `registry.manifest.json`, README/CHANGELOG, and the packaged zip. None of the four verification steps (schema validation, adversarial suite, self-containment, zip cleanliness) has been run, so do not treat the contracts here as checked.

The authoritative route and section map for the clone is `../ia.json` (306 routes, 11 templates, 44 sections), which passes `node validate.mjs`.
