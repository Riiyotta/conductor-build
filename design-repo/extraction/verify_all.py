#!/usr/bin/env python3
"""One-command verification of the whole design-repo.

  python3 extraction/verify_all.py

Output lines are `PASS|FAIL|WARN [check-id] message`; exit code 1 if any FAIL.

Always-on (self-contained) checks: JSON parse, allowlist parity, allowlistVersion parity, schema regeneration
diff + draft-07 validity, example validation, token catalog / alias / theme recompute, motion-pattern parity,
graph-rule vs validator parity, asset-role closure AND compliance pins (pinned values, not just enum membership),
template integrity, section-contract shape (provenance `source` kept separate from taxonomy `semantic`), retrieval
eligibility pins (utilities/overlays are not retrievable design compositions), the whole-page-wrapper quality gate
(HERO >1800px warn, >3000px fail; any section >50% of a page warn, >60% fail; only reviewed prose-by-nature whitelist
entries suppress it) run against the measured-heights ledger in measured-values.json, manifest counts recomputed from
files, entryPoints inside the repo, README/CHANGELOG counts, no absolute local paths.

Generation context (PageSpec `mode` reference | generated): schema requires the closed `mode` enum; asset-role `availability`
(reference-only / generation-safe / blocked-for-generation) is PINNED in this file (PINNED_AVAILABILITY, independent of both the
registry and semantic_validate.py) and every reference-only or blocked role names generation-safe substitutes; every media or
endpoint field lists generation-safe `generatedRoles` (derived `generatedAssetRoles` per section); the sourceBrand.patterns
registry is pinned (ids and must-match strings in this file), every pattern carries src/ evidence and re-matches its own real
literals, never matches its benign list; every generation-safe example PageSpec validates in mode `generated`; the adversarial
suite (which proves the validator rejects leakage) is re-run and must pass.

Sibling-dependent checks (citations, ia.json parity, route enumeration, stack re-diff) run when the project tree
that contains this design-repo/ folder is present and DEGRADE TO WARNINGS when it is not.
"""
import glob
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT = os.path.dirname(ROOT)
sys.path.insert(0, os.path.join(ROOT, "schema"))
sys.path.insert(0, os.path.join(ROOT, "schema", "tests"))
import build_schema  # noqa: E402
import semantic_validate as sv  # noqa: E402

FORBIDDEN_PATH = "/Us" + "ers/"

# Asset-role availability by PageSpec mode. Pinned HERE (an independent copy of semantic_validate.PINNED_AVAILABILITY): flipping a
# role to a different-but-valid availability in the registry (the source's logo -> generation-safe) is a drift, not an edit.
PINNED_AVAILABILITY = {
    "brand-mark": "reference-only", "product-screenshot": "reference-only", "demo-video": "reference-only",
    "decorative-background": "reference-only", "ui-animation": "reference-only",
    "customer-logo": "blocked-for-generation", "vendor-mark": "blocked-for-generation", "person-avatar": "blocked-for-generation",
    "team-photo": "blocked-for-generation", "form-endpoint": "blocked-for-generation", "download-endpoint": "blocked-for-generation",
    "icon": "generation-safe", "brand-placeholder": "generation-safe", "customer-logo-placeholder": "generation-safe",
    "avatar-placeholder": "generation-safe", "screenshot-placeholder": "generation-safe", "video-placeholder": "generation-safe",
    "background-generated": "generation-safe", "animation-generated": "generation-safe", "endpoint-placeholder": "generation-safe",
    "fictional-brand": "generation-safe", "original-copy": "generation-safe", "placeholder-url": "generation-safe",
}
AVAILABILITY_VALUES = ["blocked-for-generation", "generation-safe", "reference-only"]
# sourceBrand.patterns pinned in code: the ids that must exist, and real source strings the registry must still match.
PINNED_PATTERN_IDS = {
    "brand": {"brand-conductor", "brand-melty", "brand-bundle-id"},
    "cta": {"cta-verb-brand", "cta-download-for-mac", "cta-download-intel", "cta-waitlist", "cta-brand-assets"},
    "copy": {"copy-hero-headline", "copy-hero-quote", "copy-cta-heading", "copy-feature-cloud", "copy-feature-anywhere", "copy-feature-byok",
             "copy-feature-multiplayer", "copy-testimonial-quotes", "copy-testimonial-authors", "copy-team-names", "copy-pricing", "copy-join-us",
             "copy-brandkit-description", "copy-slack-page", "copy-changelog-entries", "copy-docs", "copy-legal"},
    "url": {"url-conductor-hosts", "url-download-cdn", "url-forms", "url-community", "url-testimonial-posts", "url-source-uploads"},
    "asset": {"asset-source-paths", "asset-named-files", "asset-testimonial-photos"},
}
PINNED_MUST_MATCH = {
    "brand": ["Conductor", "conductor.build", "@conductor_build", "CONDUCTOR_PORT", "Melty Labs", "Melty, Inc.", "meltylabs", "melty.sh"],
    "cta": ["Get Conductor", "Try Conductor.", "Download Conductor", "Join Conductor", "Download for Mac", "Download for Intel-based Macs", "Join Windows/Linux waitlist"],
    "copy": ["Run a team of coding agents", "feels like going from typing with two fingers to having eight arms", "Be like this guy.", "A cloud sandbox for every agent.",
             "Conduct from anywhere.", "Bring your own subscriptions and keys.", "Garry Tan", "Charlie Holtz", "A (mostly) boring update"],
    "url": ["https://conductor.build/docs", "https://app.conductor.build/pro", "https://cdn.crabnebula.app/download/melty/conductor/latest/platform/dmg-aarch64",
            "https://js-na2.hsforms.net/forms/embed/246368856.js", "https://docs.google.com/forms/d/1jPQsC8oLNIyjHW3WOsUxK2XNm0Z-BAzdooZuMs9cbFM/edit",
            "https://discord.gg/RSrYmstWzy", "mailto:humans@conductor.build", "https://x.com/conductor_build"],
    "asset": ["/assets/img/homepage-hero-background.webp", "/assets/video/cmdn.mp4", "conductor-brandkit.zip"],
}
RESULTS = []


def rec(status, check, msg):
    RESULTS.append((status, check, msg))
    print(f"{status:4s} [{check}] {msg}")


def ok(check, msg):
    rec("PASS", check, msg)


def fail(check, msg):
    rec("FAIL", check, msg)


def warn(check, msg):
    rec("WARN", check, msg)


def J(rel):
    with open(os.path.join(ROOT, rel), encoding="utf-8") as fh:
        return json.load(fh)


def files(pattern):
    return sorted(glob.glob(os.path.join(ROOT, pattern), recursive=True))


def ids_in(folder):
    return sorted(os.path.basename(p)[:-5] for p in files(f"{folder}/*.json"))


# ---------------------------------------------------------------- 1. JSON parse
def check_json():
    bad = []
    n = 0
    for p in files("**/*.json"):
        n += 1
        try:
            json.load(open(p, encoding="utf-8"))
        except Exception as e:  # noqa: BLE001
            bad.append(f"{os.path.relpath(p, ROOT)}: {e}")
    (fail if bad else ok)("json-parse", f"{n} JSON files parse" if not bad else "; ".join(bad))


# ---------------------------------------------------------------- 2. allowlist parity
def check_allowlist():
    al = J("tokens/llm/component-allowlist.json")
    problems = []
    for key, folder in (("primitives", "primitives"), ("components", "components"), ("sections", "sections")):
        listed, real = sorted(al[key]), ids_in(folder)
        for phantom in sorted(set(listed) - set(real)):
            problems.append(f"phantom allowlist {key} id with no contract file: {phantom}")
        for orphan in sorted(set(real) - set(listed)):
            problems.append(f"contract file with no allowlist entry ({key}): {orphan}")
        for i in real:
            d = J(f"{folder}/{i}.json")
            if d.get("id") != i:
                problems.append(f"{folder}/{i}.json has id {d.get('id')!r}")
    secs = {i: J(f"sections/{i}.json") for i in ids_in("sections")}
    if al["sectionVariants"] != {k: sorted(v["variants"]) for k, v in sorted(secs.items())}:
        problems.append("sectionVariants does not match section contracts")
    schema = J("schema/pagespec.schema.json")
    node_props = sorted(schema["definitions"]["node"]["properties"])
    if sorted(al["nodeSettableProperties"]) != node_props:
        problems.append(f"nodeSettableProperties {sorted(al['nodeSettableProperties'])} != schema node properties {node_props}")
    if sorted(al["motionSettableProperties"]) != sorted(schema["definitions"]["motion"]["properties"]):
        problems.append("motionSettableProperties != schema motion properties")
    if sorted(al["pageSpecTopLevelProperties"]) != sorted(schema["properties"]):
        problems.append("pageSpecTopLevelProperties != schema top-level properties")
    if sorted(al["assetRoles"]) != sorted(J("assets/asset-roles.json")["roles"]):
        problems.append("allowlist assetRoles != asset-roles.json roles")
    (fail if problems else ok)("allowlist-parity", "; ".join(problems) if problems else
                               f"{len(al['primitives'])} primitives + {len(al['components'])} components + {len(al['sections'])} sections match files 1:1; settable properties match the schema")


def check_allowlist_version():
    man, al = J("registry.manifest.json"), J("tokens/llm/component-allowlist.json")
    same = man.get("allowlistVersion") == al.get("allowlistVersion")
    (ok if same else fail)("allowlistVersion-parity", f"manifest {man.get('allowlistVersion')!r} vs allowlist {al.get('allowlistVersion')!r}")


# ---------------------------------------------------------------- 3. schema
def check_schema():
    import jsonschema

    committed = open(os.path.join(ROOT, "schema/pagespec.schema.json"), encoding="utf-8").read()
    fresh = build_schema.dumps(build_schema.build())
    (ok if committed == fresh else fail)("schema-regeneration", "committed pagespec.schema.json equals build_schema.build()" if committed == fresh else "pagespec.schema.json has DRIFTED from the section contracts (rerun schema/build_schema.py)")
    try:
        jsonschema.Draft7Validator.check_schema(json.loads(committed))
        ok("schema-draft7", "schema is a valid draft-07 schema")
    except Exception as e:  # noqa: BLE001
        fail("schema-draft7", str(e)[:200])
    bad_ex, names = [], []
    for ep in files("schema/example*.pagespec.json"):
        errs, warns = sv.validate(json.load(open(ep, encoding="utf-8")), root=ROOT)
        names.append(os.path.basename(ep))
        if errs or warns:
            bad_ex.append(f"{os.path.basename(ep)}: {len(errs)} errors {errs[:2]}, {len(warns)} warnings {warns[:2]}")
    (ok if not bad_ex and len(names) >= 4 else fail)("example-valid", f"{len(names)} example PageSpecs ({', '.join(names)}): 0 errors, 0 warnings" if not bad_ex and len(names) >= 4 else f"{bad_ex or 'fewer than 4 example PageSpecs'}")
    # closed motion + additionalProperties:false everywhere in the schema
    open_objs = []

    def walk(node, path):
        if isinstance(node, dict):
            if node.get("type") == "object" and "properties" in node and node.get("additionalProperties") is not False:
                if path and not path.endswith("/content"):
                    open_objs.append(path)
            for k, v in node.items():
                walk(v, f"{path}/{k}")
        elif isinstance(node, list):
            for i, v in enumerate(node):
                walk(v, f"{path}/{i}")

    walk(schema_obj := json.loads(committed), "")
    contract_schema = J("schema/section-contract.schema.json")
    try:
        jsonschema.Draft7Validator.check_schema(contract_schema)
    except Exception as e:  # noqa: BLE001
        open_objs.append(f"section-contract.schema.json invalid: {str(e)[:100]}")
    walk(contract_schema, "/contract")
    (ok if not open_objs else fail)("schema-closed", "every object with properties is additionalProperties:false (pagespec and section-contract schemas)" if not open_objs else f"open objects: {open_objs[:5]}")
    return schema_obj


# ---------------------------------------------------------------- 4. tokens
def merged_tree():
    tree = {}
    for p in files("tokens/*/*.json"):
        rel = os.path.relpath(p, ROOT)
        if "/llm/" in rel or "/themes/" in rel:
            continue
        for k, v in json.load(open(p, encoding="utf-8")).items():
            if not k.startswith("$"):
                tree[k] = v
    return tree


def leaves(node, prefix):
    out = []
    if isinstance(node, dict):
        if "$value" in node:
            return [prefix]
        for k, v in node.items():
            if k in ("measuredFrom", "note") or k.startswith("$"):
                continue
            out += leaves(v, prefix + [k])
    return out


def get_path(tree, dotted):
    node = tree
    for part in dotted.split("."):
        if not isinstance(node, dict) or part not in node:
            return None
        node = node[part]
    return node


def check_tokens():
    tree = merged_tree()
    cat = {}
    for top, node in tree.items():
        if top == "typography":
            for sub, n in node.items():
                cat[sub] = sorted(".".join(p) for p in leaves(n, ["typography", sub]))
        elif top == "motion":
            for sub, n in node.items():
                cat["motion." + sub] = sorted(".".join(p) for p in leaves(n, ["motion", sub]))
        else:
            cat[top] = sorted(".".join(p) for p in leaves(node, [top]))
    committed = J("tokens/llm/token-catalog.json")["categories"]
    (ok if committed == cat else fail)("token-catalog", f"token-catalog.json equals recompute ({len(cat)} categories, {sum(map(len, cat.values()))} tokens)" if committed == cat else "token-catalog.json drifted from tokens/*")
    pol = J("tokens/llm/token-policy.json")
    missing = [k for k in pol["rawValueRestrictions"] if k not in cat]
    (ok if not missing else fail)("token-policy-keys", "policy categories all resolve to real catalog keys" if not missing else f"policy keys with no catalog category: {missing}")
    # alias resolution
    unresolved = []
    for rel in ("tokens/10-semantic/semantic.json", "tokens/20-component/component.json"):
        def scan(node, where):
            if isinstance(node, dict):
                for k, v in node.items():
                    if k in ("measuredFrom", "note") or k.startswith("$description"):
                        continue
                    scan(v, f"{where}.{k}")
            elif isinstance(node, list):
                for v in node:
                    scan(v, where)
            elif isinstance(node, str):
                for ref in re.findall(r"\{([A-Za-z0-9_.-]+)\}", node):
                    if get_path(tree, ref) is None:
                        unresolved.append(f"{rel}:{where} -> {{{ref}}}")
        scan(json.load(open(os.path.join(ROOT, rel), encoding="utf-8")), "")
    (ok if not unresolved else fail)("token-alias-resolution", "every {alias} in semantic/component tokens resolves" if not unresolved else f"unresolved: {unresolved[:5]}")
    # theme recompute
    resolved = {}
    for grp, toks in tree["semantic"].items():
        for name, t in toks.items():
            tgt = get_path(tree, t["$value"][1:-1])
            resolved[f"semantic.{grp}.{name}"] = tgt["$value"] if tgt else None
    th = J("tokens/themes/light.json")["resolved"]
    (ok if th == resolved else fail)("theme-resolution", f"themes/light.json resolves all {len(resolved)} semantic tokens to foundation values" if th == resolved else "themes/light.json drifted from semantic -> foundation resolution")
    return tree, cat


def count_tokens(tree):
    return sum(len(leaves(node, [k])) for k, node in tree.items())


# ---------------------------------------------------------------- 5. motion / graph / assets / templates
def check_motion():
    mp = J("tokens/llm/motion-patterns.json")
    used, fbs = set(), set()
    for i in ids_in("sections"):
        m = J(f"sections/{i}.json")["motion"]
        used |= set(m["allowedPatterns"]) | set(m["defaultPatterns"])
        for v in m.get("variantPatterns", {}).values():
            used |= set(v)
        fbs.add(m["reducedMotionFallback"])
        if not m.get("reducedMotionFallback"):
            fail("motion-fallback", f"{i} lacks reducedMotionFallback")
    schema = J("schema/pagespec.schema.json")["definitions"]["motion"]["properties"]
    p_ok = used == set(mp["patterns"]) == set(schema["patterns"]["items"]["enum"])
    f_ok = fbs == set(mp["reducedMotionFallbacks"]) == set(schema["reducedMotionFallback"]["enum"])
    (ok if p_ok and f_ok else fail)("motion-parity", "section patterns/fallbacks == motion-patterns.json == schema enums" if p_ok and f_ok else
                                    f"patterns diff {sorted(used ^ set(mp['patterns']))}; fallback diff {sorted(fbs ^ set(mp['reducedMotionFallbacks']))}")
    bad_cont = set(mp["continuousPatterns"]) - set(mp["patterns"])
    (ok if not bad_cont else fail)("motion-continuous", "continuousPatterns subset of patterns" if not bad_cont else str(bad_cont))
    bud = next(r for r in J("compatibility/graph.json")["rules"] if r["id"] == "MOTION_BUDGET")
    (ok if bud["params"]["continuousPatterns"] == mp["continuousPatterns"] else fail)("motion-budget-params", "graph MOTION_BUDGET.continuousPatterns == motion-patterns.json")


def check_graph():
    g = J("compatibility/graph.json")["rules"]
    ids = [r["id"] for r in g]
    impl = set(sv.RULE_IMPLS)
    probs = []
    if set(ids) != impl:
        probs.append(f"rules without implementation {sorted(set(ids) - impl)}; implementations without rule {sorted(impl - set(ids))}")
    if len(ids) != len(set(ids)):
        probs.append("duplicate rule ids")
    for r in g:
        if r.get("severity") not in ("error", "warn"):
            probs.append(f"{r['id']} severity {r.get('severity')!r}")
    templates = J("templates/templates.json")["templates"]
    secs = {i: J(f"sections/{i}.json") for i in ids_in("sections")}
    for r in g:
        for tid in r.get("exceptions", []) if r["id"] == "REQUIRES_HERO" else []:
            if tid not in templates:
                probs.append(f"{r['id']} exception names unknown template {tid}")
    # REQUIRES_HERO exceptions must be exactly the hero-less templates (graph prose == data == validator behaviour)
    req = next(r for r in g if r["id"] == "REQUIRES_HERO")
    heroless = sorted(t for t, d in templates.items() if not any(sv.category_of(secs[n["section"]]) == "HERO" for n in d["nodes"]))
    if sorted(req["exceptions"]) != heroless:
        probs.append(f"REQUIRES_HERO exceptions {sorted(req['exceptions'])} != actual hero-less templates {heroless}")
    for t, d in templates.items():
        if sum(sv.category_of(secs[n["section"]]) == "HERO" for n in d["nodes"]) > 1:
            probs.append(f"{t} has more than one hero (ONE_HERO would reject its own template)")
    (fail if probs else ok)("graph-parity", "; ".join(probs) if probs else f"{len(ids)} graph rules == RULE_IMPLS; REQUIRES_HERO exceptions == real hero-less templates")


def check_assets():
    doc = J("assets/asset-roles.json")
    roles, pols = doc["roles"], doc["policies"]
    probs = []
    for r, d in roles.items():
        if d["generationPolicy"] not in pols:
            probs.append(f"{r}: policy {d['generationPolicy']!r} not in the closed policy set")
        for k in ("licensing", "guidance", "kind") + (("usageSites",) if d.get("origin") == "source" else ()):
            if not d.get(k):
                probs.append(f"{r}: missing {k}")
        if d.get("origin") not in ("source", "generation-safe-addition"):
            probs.append(f"{r}: origin must be 'source' or 'generation-safe-addition'")
    # PINNED values, not just membership
    for r, want in sv.COMPLIANCE_PINS.items():
        got = roles.get(r, {}).get("generationPolicy")
        if got != want:
            probs.append(f"PIN {r}: asset-roles.json has {got!r}, pinned value is {want!r}")
    for pol, allowed in sv.PINNED_POLICY_ALLOWED.items():
        for k, v in allowed.items():
            if pols.get(pol, {}).get(k) != v:
                probs.append(f"PIN policy {pol}.{k}: asset-roles.json has {pols.get(pol, {}).get(k)!r}, pinned {v!r}")
    if doc.get("compliancePinsDocumented") != {r: d["generationPolicy"] for r, d in roles.items() if d["generationPolicy"] in ("must-not-reproduce", "must-not-reuse-live-endpoint")}:
        probs.append("compliancePinsDocumented does not match roles")
    # sections only use known roles; schema role enums agree with contracts
    schema = J("schema/pagespec.schema.json")
    for i in ids_in("sections"):
        s = J(f"sections/{i}.json")

        def roles_of(fields, acc):
            for f in fields.values():
                if f["type"] in ("media", "endpoint"):
                    acc |= set(f["roles"])
                elif f["type"] == "object":
                    roles_of(f["fields"], acc)
                elif f["type"] == "list":
                    roles_of({"_": f["items"]}, acc)
            return acc

        used = roles_of(s["content"], set())
        if sorted(used) != s.get("assetRoles"):
            probs.append(f"{i}: assetRoles {s.get('assetRoles')} != derived {sorted(used)}")
        for r in used - set(roles):
            probs.append(f"{i}: unknown asset role {r}")
        for r in used:
            kind = roles.get(r, {}).get("kind")
            for f in s["content"].values():
                pass
    schema_roles = set()

    def collect(node):
        if isinstance(node, dict):
            if "assetRole" in node.get("properties", {}):
                schema_roles.update(node["properties"]["assetRole"]["enum"])
            for v in node.values():
                collect(v)
        elif isinstance(node, list):
            for v in node:
                collect(v)

    collect(schema)
    if not schema_roles <= set(roles):
        probs.append(f"schema assetRole enums contain unknown roles {sorted(schema_roles - set(roles))}")
    text = json.dumps(doc).lower()
    for must in ("logo", "photo", "testimonial", "trademark", "changelog", "docs"):
        if must not in text:
            probs.append(f"asset-roles.json no longer mentions {must!r} in its prohibitions")
    (fail if probs else ok)("asset-role-pins", "; ".join(probs[:6]) if probs else
                            f"{len(roles)} roles closed over {len(pols)} policies; {len(sv.COMPLIANCE_PINS)} compliance pins equal their pinned values (live form + download endpoints, logos, people, trademarks, screenshots)")


# ---------------------------------------------------------------- 5c. generation context (mode), availability, source brand
def _fields_with_media(fields, path=""):
    for k, f in fields.items():
        if f["type"] in ("media", "endpoint"):
            yield f"{path}{k}", f
        elif f["type"] == "object":
            yield from _fields_with_media(f["fields"], f"{path}{k}.")
        elif f["type"] == "list":
            yield from _fields_with_media({k + "[]": f["items"]}, path)


def check_mode_schema(schema):
    probs = []
    m = schema["properties"].get("mode", {})
    if "mode" not in schema.get("required", []):
        probs.append("schema does not require `mode`")
    if m.get("enum") != ["reference", "generated"]:
        probs.append(f"schema mode enum must be exactly ['reference', 'generated'], found {m.get('enum')}")
    modes = J("assets/asset-roles.json").get("modes", {})
    if sorted(modes) != ["generated", "reference"]:
        probs.append(f"asset-roles.json `modes` documents {sorted(modes)}, expected ['generated', 'reference']")
    if "mode" not in J("tokens/llm/component-allowlist.json")["pageSpecTopLevelProperties"]:
        probs.append("allowlist pageSpecTopLevelProperties lacks mode")
    if sv.MODES != ("reference", "generated"):
        probs.append(f"semantic_validate.MODES is {sv.MODES}")
    const = schema["properties"]["pageSpecVersion"]["const"]
    if const != build_schema.PAGESPEC_VERSION or not const.startswith("2."):
        probs.append(f"pageSpecVersion const {const!r} must equal build_schema.PAGESPEC_VERSION {build_schema.PAGESPEC_VERSION!r} and be 2.x (mode made it PageSpec-breaking)")
    bad_ref = []
    for ep in files("schema/example*.pagespec.json"):
        d = json.load(open(ep, encoding="utf-8"))
        if d.get("mode") != "reference" or d.get("pageSpecVersion") != const:
            bad_ref.append(os.path.basename(ep))
    if bad_ref:
        probs.append(f"reference examples must declare mode 'reference' and pageSpecVersion {const}: {bad_ref}")
    (fail if probs else ok)("mode-schema", "; ".join(probs) if probs else f"PageSpec `mode` is a required closed enum [reference, generated], documented in asset-roles.json, pageSpecVersion {const}; every reference example declares mode reference")


def check_availability():
    doc = J("assets/asset-roles.json")
    roles = doc["roles"]
    probs = []
    if sorted(doc.get("availabilityValues", {})) != AVAILABILITY_VALUES:
        probs.append(f"availabilityValues documents {sorted(doc.get('availabilityValues', {}))}")
    if PINNED_AVAILABILITY != sv.PINNED_AVAILABILITY:
        diff = sorted(k for k in set(PINNED_AVAILABILITY) | set(sv.PINNED_AVAILABILITY) if PINNED_AVAILABILITY.get(k) != sv.PINNED_AVAILABILITY.get(k))
        probs.append(f"PINNED_AVAILABILITY in verify_all.py and semantic_validate.py disagree on {diff}")
    for r, d in roles.items():
        av = d.get("availability")
        if av not in AVAILABILITY_VALUES:
            probs.append(f"{r}: availability {av!r} is not one of {AVAILABILITY_VALUES}")
        if not d.get("generatedModeGuidance"):
            probs.append(f"{r}: missing generatedModeGuidance")
        if r not in PINNED_AVAILABILITY:
            probs.append(f"{r}: no pinned availability in verify_all.py")
    for r, want in PINNED_AVAILABILITY.items():
        if r not in roles:
            probs.append(f"pinned role {r} is missing from the registry")
        elif roles[r].get("availability") != want:
            probs.append(f"PIN availability {r}: asset-roles.json has {roles[r].get('availability')!r}, pinned value is {want!r}")
    for r, d in roles.items():
        subs = d.get("generationSafeSubstitutes", [])
        if d.get("availability") in ("reference-only", "blocked-for-generation"):
            if not subs:
                probs.append(f"{r} is {d.get('availability')} but names no generationSafeSubstitutes")
            for x in subs:
                if x not in roles or PINNED_AVAILABILITY.get(x) != "generation-safe":
                    probs.append(f"{r}: substitute {x!r} is not a generation-safe role")
        elif subs:
            probs.append(f"{r} is generation-safe but lists substitutes")
    for want in ("fictional-brand", "original-copy", "placeholder-url"):
        if roles.get(want, {}).get("kind") != "content-rule":
            probs.append(f"generation-safe content rule role {want} missing or wrong kind")
    # sections: generatedRoles per media/endpoint field, derived generatedAssetRoles, disjoint, generation-safe, consistent with substitutes
    used_fields = set()
    gen_allowed = set()
    for sid in ids_in("sections"):
        c = J(f"sections/{sid}.json")
        derived = set()
        for name, f in _fields_with_media(c["content"]):
            g = f.get("generatedRoles")
            if not g:
                probs.append(f"sections/{sid}.json {name}: media/endpoint field has no generatedRoles (a generated page could not fill it)")
                continue
            derived |= set(g)
            used_fields |= set(f["roles"])
            if set(g) & set(f["roles"]):
                probs.append(f"sections/{sid}.json {name}: generatedRoles overlaps roles (the reference and generated role sets must be disjoint)")
            for x in g:
                if PINNED_AVAILABILITY.get(x) != "generation-safe" or x not in roles:
                    probs.append(f"sections/{sid}.json {name}: generatedRoles lists {x!r}, which is not a pinned generation-safe role")
                elif roles[x].get("kind") != f["type"]:
                    probs.append(f"sections/{sid}.json {name}: generated role {x!r} is kind {roles[x].get('kind')!r} but the field is {f['type']}")
            allowed_subs = {x for r in f["roles"] for x in roles.get(r, {}).get("generationSafeSubstitutes", [])}
            if not set(g) <= allowed_subs:
                probs.append(f"sections/{sid}.json {name}: generatedRoles {sorted(set(g) - allowed_subs)} are not substitutes of the field's reference roles")
            for r in f["roles"]:
                if not set(roles.get(r, {}).get("generationSafeSubstitutes", [])) & set(g):
                    probs.append(f"sections/{sid}.json {name}: reference role {r} has no generation-safe substitute among the field's generatedRoles")
        have = c.get("generatedAssetRoles")
        if derived and sorted(have or []) != sorted(derived):
            probs.append(f"sections/{sid}.json: generatedAssetRoles {have} != derived {sorted(derived)}")
        if not derived and have is not None:
            probs.append(f"sections/{sid}.json: has generatedAssetRoles but no media/endpoint field")
        gen_allowed |= derived
    for r, d in roles.items():
        if d.get("origin") == "generation-safe-addition" and d.get("kind") in ("media", "endpoint"):
            replaces = [x for x, dd in roles.items() if r in dd.get("generationSafeSubstitutes", [])]
            if any(x in used_fields for x in replaces) and r not in gen_allowed:
                probs.append(f"generation-safe role {r} replaces a role used by a field but no section's generatedRoles allows it (a dead role)")
            if not replaces:
                probs.append(f"generation-safe role {r} is not a substitute of any protected role")
    (fail if probs else ok)("asset-availability", "; ".join(probs[:6]) if probs else
                            f"{len(PINNED_AVAILABILITY)} roles: availability pinned in code (verify_all.py == semantic_validate.py == registry); every reference-only or blocked role has generation-safe substitutes; every media/endpoint field has disjoint generation-safe generatedRoles and every section's generatedAssetRoles is derived")


def _norm(t):
    return re.sub(r"\s+", " ", t)


def check_source_brand():
    doc = J("assets/asset-roles.json")
    sb = doc.get("sourceBrand", {})
    cats = sb.get("patterns", {})
    probs = []
    if sorted(cats) != sorted(PINNED_PATTERN_IDS):
        probs.append(f"sourceBrand.patterns categories {sorted(cats)} != {sorted(PINNED_PATTERN_IDS)}")
    total = 0
    for cat, want_ids in PINNED_PATTERN_IDS.items():
        c = cats.get(cat, {})
        if c.get("code") != sv.SOURCE_CODES[cat]:
            probs.append(f"{cat}: documented code {c.get('code')!r} != validator code {sv.SOURCE_CODES[cat]!r}")
        pats = c.get("patterns", [])
        ids = [p.get("id") for p in pats]
        if len(ids) != len(set(ids)):
            probs.append(f"{cat}: duplicate pattern ids")
        for missing in sorted(want_ids - set(ids)):
            probs.append(f"{cat}: pinned pattern {missing!r} was removed from the registry")
        compiled = []
        for p in pats:
            total += 1
            try:
                rx = re.compile(p["pattern"], re.I)
            except (re.error, KeyError) as e:
                probs.append(f"{cat}/{p.get('id')}: pattern does not compile ({e})")
                continue
            compiled.append(rx)
            if not p.get("evidence") or not p.get("mustMatch") or not p.get("description"):
                probs.append(f"{cat}/{p['id']}: needs description, mustMatch and evidence")
                continue
            quotes = _norm(" ".join(e["quote"] for e in p["evidence"]))
            for lit in p["mustMatch"]:
                if not rx.search(sv.norm_text(lit)):
                    probs.append(f"{cat}/{p['id']}: pattern no longer matches its own real literal {lit!r}")
                if _norm(lit) not in quotes:
                    probs.append(f"{cat}/{p['id']}: literal {lit!r} is not in any of the pattern's evidence quotes")
        if not c.get("mustNotMatch"):
            probs.append(f"{cat}: mustNotMatch list is empty")
        for b in c.get("mustNotMatch", []):
            if any(rx.search(sv.norm_text(b)) for rx in compiled):
                probs.append(f"{cat}: a pattern matches the benign string {b!r} (too broad)")
        for lit in PINNED_MUST_MATCH[cat]:
            if not any(rx.search(sv.norm_text(lit)) for rx in compiled):
                probs.append(f"{cat}: registry no longer matches the pinned real source string {lit!r}")
    brand_rx = [re.compile(p["pattern"], re.I) for p in cats.get("brand", {}).get("patterns", [])]
    for nm in sb.get("names", []):
        if not any(rx.search(nm) for rx in brand_rx):
            probs.append(f"sourceBrand name {nm!r} is not matched by any brand pattern (prose and code disagree)")
    if "UNREVIEWED" not in sb.get("reviewStatus", ""):
        probs.append("sourceBrand.reviewStatus must state that the patterns are UNREVIEWED by a human")
    # the placeholder-host rule itself
    for host, want in (("https://app.fernlake.example/x", True), ("https://x.invalid/", True), ("https://example.com/x", True), ("mailto:a@fernlake.example", True),
                       ("https://example.com.evil.net/x", False), ("https://acme.com/", False), ("mailto:a@acme.com", False)):
        errs = []
        sv.scan_generated(host, "t", {}, errs, is_url=True)
        if bool(errs) == want:
            probs.append(f"placeholder-host rule wrong for {host!r}")
    (fail if probs else ok)("source-brand-patterns", "; ".join(probs[:6]) if probs else
                            f"{total} source patterns in {len(cats)} categories (brand, cta, copy, url, asset): pinned ids present, each compiles, re-matches its real src literals (which sit in its evidence), matches every pinned source string, matches no benign string; placeholder-host rule behaves; reviewStatus says UNREVIEWED")


def check_generated_examples():
    probs, names, tpls = [], [], set()
    for gp in files("schema/examples/generated.*.pagespec.json"):
        d = json.load(open(gp, encoding="utf-8"))
        n = os.path.basename(gp)
        names.append(n)
        tpls.add(d.get("template"))
        if d.get("mode") != "generated":
            probs.append(f"{n}: must declare mode 'generated', found {d.get('mode')!r}")
        if n != f"generated.{d.get('template')}.pagespec.json":
            probs.append(f"{n}: file name does not match its template {d.get('template')}")
        errs, warns = sv.validate(d, root=ROOT)
        if errs or warns:
            probs.append(f"{n}: {len(errs)} errors {errs[:2]}, {len(warns)} warnings {warns[:2]}")
    if "template.home" not in tpls:
        probs.append("no generation-safe example for template.home")
    if not tpls & {"template.legal", "template.docs-page", "template.changelog-post", "template.changelog-index"}:
        probs.append("no generation-safe example for a docs, changelog or legal template")
    (fail if probs else ok)("generated-examples", "; ".join(probs[:5]) if probs else
                            f"{len(names)} generation-safe example PageSpecs ({', '.join(names)}): mode generated, 0 errors, 0 warnings (fictional brand, original copy, placeholder assets and URLs)")


def check_adversarial_suite():
    import subprocess
    p = subprocess.run([sys.executable, os.path.join(ROOT, "schema", "tests", "adversarial_test.py")], capture_output=True, text=True, env=dict(os.environ, PYTHONDONTWRITEBYTECODE="1"))
    tail = [ln for ln in p.stdout.splitlines() if ln.startswith(("mutations rejected", "controls passed", "RESULT"))]
    (ok if p.returncode == 0 else fail)("adversarial-suite", "adversarial suite passes: " + "; ".join(tail) if p.returncode == 0 else "adversarial suite FAILED (the validator is not rejecting something it must): " + "; ".join(tail) + " " + p.stderr[-200:])


def check_templates():
    T = J("templates/templates.json")["templates"]
    secs = {i: J(f"sections/{i}.json") for i in ids_in("sections")}
    probs = []
    for tid, t in T.items():
        for n in t["nodes"]:
            s = secs.get(n["section"])
            if not s:
                probs.append(f"{tid}: unknown section {n['section']}")
                continue
            if n["variant"] not in s["variants"]:
                probs.append(f"{tid}: {n['section']} has no variant {n['variant']}")
            elif s["variants"][n["variant"]]["iaSection"] != n["iaSection"]:
                probs.append(f"{tid}: {n['section']}/{n['variant']} iaSection mismatch")
            if n["slot"] != s["slot"]:
                probs.append(f"{tid}: slot mismatch for {n['section']}")
            if not isinstance(n.get("required"), bool) or not isinstance(n.get("repeatable"), bool):
                probs.append(f"{tid}: node {n['section']} lacks boolean required/repeatable")
            if tid not in s["constraints"].get("allowedTemplates", []):
                probs.append(f"{tid}: not in allowedTemplates of {n['section']}")
        keys = [(n["section"], n["variant"]) for n in t["nodes"]]
        if len(keys) != len(set(keys)):
            probs.append(f"{tid}: duplicate (section, variant) keys")
    for sid, s in secs.items():
        used = sorted(t for t, d in T.items() if any(n["section"] == sid for n in d["nodes"]))
        if used != s["constraints"].get("allowedTemplates"):
            probs.append(f"{sid}: allowedTemplates {s['constraints'].get('allowedTemplates')} != actual {used}")
    (fail if probs else ok)("template-integrity", "; ".join(probs[:6]) if probs else f"{len(T)} templates: nodes are structured objects, keys unique, allowedTemplates match real usage")
    return T



# ---------------------------------------------------------------- 5b. section contracts, retrieval, wrapper gate
def check_contracts():
    """Closed shape of every contract: provenance (`source`) and taxonomy (`semantic`) are separate closed objects."""
    probs = sv.validate_all_contracts(ROOT)
    secs = {i: J(f"sections/{i}.json") for i in ids_in("sections")}
    # provenance and taxonomy must not collapse into each other anywhere: no contract may reuse a source file as a semantic id
    for i, d in secs.items():
        if d.get("semantic", {}).get("semanticId") is not None and d.get("semantic", {}).get("semanticId") == d.get("source", {}).get("sourceId"):
            probs.append(f"{i}: semanticId equals sourceId (taxonomy and provenance collapsed)")
    (fail if probs else ok)("contract-shape", "; ".join(probs[:6]) if probs else
                            f"{len(secs)} section contracts match section-contract.schema.json: closed `semantic` {{semanticId, category, iaSections}} and `source` {{sourceId, implementedBy, measuredFrom}}, semanticId == id, sourceId is a cited implementing file")


def check_retrieval():
    """retrievalEligible=false for dialogs/overlays/utilities. Three independent sources must agree: the code pin
    (semantic_validate.RETRIEVAL_INELIGIBLE), the section contracts, and the allowlist; the schema branches const-lock the node field."""
    secs = {i: J(f"sections/{i}.json") for i in ids_in("sections")}
    al = J("tokens/llm/component-allowlist.json")
    schema = J("schema/pagespec.schema.json")
    probs = []
    pin = set(sv.RETRIEVAL_INELIGIBLE)
    if pin - set(secs):
        probs.append(f"pinned ineligible ids with no contract: {sorted(pin - set(secs))}")
    contract = {i for i, d in secs.items() if d["retrievalEligible"] is False}
    if contract != pin:
        probs.append(f"contracts mark {sorted(contract)} ineligible, code pin is {sorted(pin)}")
    overlay = {i for i, d in secs.items() if d["slot"] == "overlay"}
    if overlay != pin:
        probs.append(f"overlay-slot sections {sorted(overlay)} != pinned ineligible set {sorted(pin)}")
    if sorted(al.get("retrievalIneligibleSections", [])) != sorted(pin):
        probs.append(f"allowlist retrievalIneligibleSections {al.get('retrievalIneligibleSections')} != code pin {sorted(pin)}")
    if "retrievalEligible" not in schema["definitions"]["node"]["properties"] or schema["definitions"]["node"]["properties"]["retrievalEligible"].get("type") != "boolean":
        probs.append("schema node.retrievalEligible is not a closed boolean property")
    consts = {}
    for br in schema["definitions"]["node"]["allOf"]:
        consts[br["if"]["properties"]["section"]["const"]] = br["then"]["properties"].get("retrievalEligible", {}).get("const")
    for i in secs:
        if consts.get(i) is not sv.retrieval_pin(i):
            probs.append(f"schema branch for {i} locks retrievalEligible={consts.get(i)!r}, pinned value is {sv.retrieval_pin(i)!r}")
    (fail if probs else ok)("retrieval-eligibility", "; ".join(probs[:6]) if probs else
                            f"{len(pin)} utilities ({', '.join(sorted(pin))}) are retrievalEligible=false in code pin, contracts, allowlist and schema; the other {len(secs) - len(pin)} sections are true")


# Whole-page-wrapper gate. Thresholds are pinned HERE, not read from JSON, so editing the ledger cannot loosen them.
GATE = {"viewportWidth": 1440, "heroWarnPx": 1800, "heroFailPx": 3000, "shareWarnPct": 50, "shareFailPct": 60}
# Only these sections may be whitelisted for share-of-page (the body of a document is most of a document page by nature).
PROSE_BY_NATURE = frozenset({"changelog.entry-body", "content.legal-body", "docs.prose-body", "content.prose-article", "content.pricing-faq"})
# Sticky viewport-height side columns beside the article (not stacked with it): excluded from the SHARE rule only.
PARALLEL_COLUMNS = frozenset({"docs.sidebar", "docs.toc"})
NOT_RENDERED_AT_1440 = frozenset({"shell.mobile-menu", "shell.docs-subnav"})  # hidden at 1440px, so no height to measure


def check_wrapper_gate(T):
    mv = J("extraction/measured-values.json")
    sh = mv.get("sectionHeights")
    if not isinstance(sh, dict) or not sh.get("routes"):
        fail("wrapper-gate", "extraction/measured-values.json has no sectionHeights ledger (run extraction/measure_sections.mjs --write)")
        return
    secs = {i: J(f"sections/{i}.json") for i in ids_in("sections")}
    probs, warns, used = [], [], set()
    if sh.get("viewport", {}).get("width") != GATE["viewportWidth"]:
        probs.append(f"ledger viewport {sh.get('viewport')} is not {GATE['viewportWidth']}px wide")
    if sh.get("gate") != {k: v for k, v in GATE.items() if k != "viewportWidth"}:
        probs.append(f"ledger gate thresholds {sh.get('gate')} differ from the pinned thresholds {GATE}")
    wl = mv.get("wrapperGate", {}).get("whitelist", []) if isinstance(mv.get("wrapperGate"), dict) else []
    entries = {}
    for e in wl:
        k = (e.get("template"), e.get("section"))
        if k in entries:
            probs.append(f"duplicate whitelist entry {k}")
        entries[k] = e
        if len(e.get("justification", "")) < 60 or not e.get("reviewed") or not isinstance(e.get("maxPx"), int) or not isinstance(e.get("maxSharePct"), (int, float)):
            probs.append(f"whitelist entry {k} needs justification (>=60 chars), reviewed, integer maxPx, numeric maxSharePct")
        if e.get("section", "").split("/")[0] not in PROSE_BY_NATURE and sv.category_of(secs.get(e.get("section", "").split("/")[0], {"semantic": {"category": ""}})) != "HERO":
            probs.append(f"whitelist entry {k}: section is neither prose-by-nature (pinned in verify_all.PROSE_BY_NATURE) nor a HERO section")
    pc = mv.get("wrapperGate", {}).get("parallelColumns", {}) if isinstance(mv.get("wrapperGate"), dict) else {}
    if frozenset(pc.get("sections", [])) != PARALLEL_COLUMNS or len(pc.get("justification", "")) < 60:
        probs.append(f"wrapperGate.parallelColumns {pc.get('sections')} != pinned {sorted(PARALLEL_COLUMNS)} or lacks a justification")
    routes = sh["routes"]
    per_t = {}
    for route, rec in routes.items():
        tid = rec.get("template")
        t = T.get(tid)
        if not t or not sv.route_ok(route, t["routes"]):
            probs.append(f"ledger route {route} does not belong to template {tid}")
            continue
        per_t[tid] = per_t.get(tid, 0) + 1
        page = rec["pageHeight"]
        want = {f"{n['section']}/{n['variant']}" for n in t["nodes"] if n["slot"] != "overlay" and n["section"] not in NOT_RENDERED_AT_1440}
        if set(rec["sections"]) != want:
            probs.append(f"{route}: measured nodes differ from template nodes: missing {sorted(want - set(rec['sections']))[:3]}, extra {sorted(set(rec['sections']) - want)[:3]}")
        for key, val in rec["sections"].items():
            sid = key.split("/")[0]
            if sid not in secs:
                continue
            cat = sv.category_of(secs[sid])
            for h in (val if isinstance(val, list) else [val]):
                share = 0.0 if sid in PARALLEL_COLUMNS else 100.0 * h / page
                e = entries.get((tid, key))
                msgs = []
                if cat == "HERO" and h > GATE["heroFailPx"]:
                    msgs.append(("fail", f"HERO {key} is {h}px (>{GATE['heroFailPx']}px): a whole-page wrapper, split it"))
                elif cat == "HERO" and h > GATE["heroWarnPx"]:
                    msgs.append(("warn", f"HERO {key} is {h}px (>{GATE['heroWarnPx']}px)"))
                if share > GATE["shareFailPct"]:
                    msgs.append(("fail", f"{key} is {share:.0f}% of the page ({h}/{page}px, >{GATE['shareFailPct']}%): whole-page wrapper"))
                elif share > GATE["shareWarnPct"]:
                    msgs.append(("warn", f"{key} is {share:.0f}% of the page ({h}/{page}px, >{GATE['shareWarnPct']}%): single section holds the majority"))
                if not msgs:
                    continue
                if e is not None:
                    used.add((tid, key))
                    if h > e["maxPx"] or share > e["maxSharePct"]:
                        probs.append(f"{route}: {key} {h}px/{share:.0f}% exceeds its whitelist cap ({e['maxPx']}px/{e['maxSharePct']}%)")
                    continue
                for sev, m in msgs:
                    (probs if sev == "fail" else warns).append(f"{route}: {m}")
    for tid, t in T.items():
        if per_t.get(tid, 0) != t["routes"]["count"]:
            probs.append(f"{tid}: ledger covers {per_t.get(tid, 0)} routes, template has {t['routes']['count']}")
    for k in sorted(set(entries) - used):
        probs.append(f"stale whitelist entry {k}: no measured instance needs it (remove it)")
    dedup = lambda xs: sorted(set(re.sub(r"^\S+: ", "", x) for x in xs))  # noqa: E731
    if probs:
        fail("wrapper-gate", f"{len(probs)} problems: {probs[:4]}")
    else:
        ok("wrapper-gate", f"{len(routes)} routes measured at {GATE['viewportWidth']}px: no HERO >{GATE['heroFailPx']}px, no non-whitelisted section >{GATE['shareFailPct']}% of a page; {len(used)} reviewed prose-by-nature whitelist entries all still needed")
    if warns:
        warn("wrapper-gate", f"{len(warns)} warnings, e.g. {dedup(warns)[:3]}")


# ---------------------------------------------------------------- 6. manifest
def computed_counts(tree, T):
    import adversarial_test as adv

    secs = {i: J(f"sections/{i}.json") for i in ids_in("sections")}
    ia_ids = sorted({m["iaSection"] for s in secs.values() for m in s["variants"].values()})
    ac = adv.case_counts()
    return {"tokens": count_tokens(tree), "primitives": len(ids_in("primitives")), "components": len(ids_in("components")),
            "sectionContracts": len(secs), "iaSections": len(ia_ids), "templates": len(T),
            "routes": sum(t["routes"]["count"] for t in T.values()), "graphRules": len(J("compatibility/graph.json")["rules"]),
            "assetRoles": len(J("assets/asset-roles.json")["roles"]), "adversarialMutations": ac["mutations"], "adversarialControls": ac["controls"]}


def check_manifest(tree, T):
    man = J("registry.manifest.json")
    comp = computed_counts(tree, T)
    diff = {k: (man["counts"].get(k), v) for k, v in comp.items() if man["counts"].get(k) != v}
    (fail if diff else ok)("manifest-counts", f"counts differ (manifest, recomputed): {diff}" if diff else "manifest counts equal values recomputed from files: " + ", ".join(f"{k}={v}" for k, v in comp.items()))
    probs = []
    if man.get("status") != "design-review-pending":
        probs.append("status must be design-review-pending")
    if man.get("productionApproved") is not False:
        probs.append("productionApproved must be false")
    if not man.get("versionFieldNote"):
        probs.append("versionFieldNote missing")
    eps = man["entryPoints"]
    flat = []
    for v in eps.values():
        flat += v if isinstance(v, list) else [v]
    for f in flat:
        if f.startswith("..") or os.path.isabs(f) or ".." in f.split("/"):
            probs.append(f"entryPoint escapes the package: {f}")
        elif not os.path.isfile(os.path.join(ROOT, f)):
            probs.append(f"entryPoint does not exist: {f}")
    real = {os.path.relpath(p, ROOT) for p in files("**/*") if os.path.isfile(p) and not p.endswith(".pyc") and "__pycache__" not in p and os.path.basename(p) != ".DS_Store"}
    unlisted = sorted(r for r in real if r not in set(flat) and r not in ("registry.manifest.json", "README.md", "CHANGELOG.md", ".gitignore"))
    if unlisted:
        probs.append(f"files not listed in entryPoints: {unlisted[:5]}")
    for key in ("repositoryId", "repositoryVersion", "pageSpecVersion", "defaultTheme", "schemaValidatedThemes", "allowlistVersion", "sourceStack", "licensing"):
        if key not in man:
            probs.append(f"manifest lacks {key}")
    if man.get("pageSpecVersion") != J("schema/pagespec.schema.json")["properties"]["pageSpecVersion"]["const"]:
        probs.append("manifest pageSpecVersion != schema const")
    (fail if probs else ok)("manifest-integrity", "; ".join(probs[:6]) if probs else f"status/approval flags ok, versionFieldNote present, {len(flat)} entryPoints all inside the package and every file is listed")
    return man, comp


def check_docs_counts(comp):
    probs = []
    for doc in ("README.md", "CHANGELOG.md"):
        txt = open(os.path.join(ROOT, doc), encoding="utf-8").read()
        m = re.search(r"^counts: (.+)$", txt, re.M)
        if not m:
            probs.append(f"{doc}: no 'counts:' line")
            continue
        got = dict(kv.split("=") for kv in m.group(1).split())
        if {k: int(v) for k, v in got.items()} != comp:
            probs.append(f"{doc}: counts line {got} != recomputed {comp}")
    (fail if probs else ok)("docs-counts", "; ".join(probs) if probs else "README.md and CHANGELOG.md 'counts:' lines equal recomputed counts")


def check_no_abs_paths():
    hits = []
    for p in files("**/*"):
        if os.path.isfile(p) and "__pycache__" not in p and not p.endswith(".pyc"):
            try:
                txt = open(p, encoding="utf-8").read()
            except Exception:  # noqa: BLE001
                continue
            if FORBIDDEN_PATH in txt:
                hits.append(os.path.relpath(p, ROOT))
    (fail if hits else ok)("no-absolute-paths", f"found local absolute path marker in {hits}" if hits else "no absolute local machine paths anywhere in the tree")


# ---------------------------------------------------------------- 7. sibling-dependent
_lines = {}


def src_lines(rel):
    if rel not in _lines:
        with open(os.path.join(PROJECT, rel), encoding="utf-8", errors="replace") as fh:
            L = fh.read().split("\n")
        _lines[rel] = L[:-1] if L and L[-1] == "" else L
    return _lines[rel]


def collect_cites():
    cites = []
    for p in files("**/*.json"):
        def walk(node):
            if isinstance(node, dict):
                if isinstance(node.get("ref"), str) and "quote" in node:
                    cites.append((os.path.relpath(p, ROOT), node["ref"], node["quote"]))
                for v in node.values():
                    walk(v)
            elif isinstance(node, list):
                for v in node:
                    walk(v)
        walk(json.load(open(p, encoding="utf-8")))
    return cites


def siblings_present():
    return os.path.isfile(os.path.join(PROJECT, "ia.json")) and os.path.isdir(os.path.join(PROJECT, "src"))


def check_citations():
    cites = collect_cites()
    if not siblings_present():
        warn("citation-range", f"sibling source tree not present; {len(cites)} citations NOT checked (degraded)")
        return
    bad = []
    for where, ref, quote in cites:
        m = re.match(r"^(.+):(\d+)(?:-(\d+))?$", ref)
        if not m:
            bad.append(f"{where}: malformed ref {ref}")
            continue
        path, a, b = m.group(1), int(m.group(2)), int(m.group(3) or m.group(2))
        if not os.path.isfile(os.path.join(PROJECT, path)):
            bad.append(f"{where}: {path} does not exist")
            continue
        L = src_lines(path)
        if a < 1 or b < a or b > len(L):
            bad.append(f"{where}: {ref} outside file length {len(L)}")
            continue
        if quote not in "\n".join(L[a - 1:b]):
            bad.append(f"{where}: {ref} does not contain the quoted text {quote[:50]!r}")
    (fail if bad else ok)("citation-range", f"{len(cites)} citations: file exists, range within file length, quoted text present in the cited lines" if not bad else f"{len(bad)} bad of {len(cites)}: {bad[:4]}")


def check_ia(T):
    p = os.path.join(PROJECT, "ia.json")
    if not os.path.isfile(p):
        warn("ia-parity", "ia.json not present: templates<->ia.json parity and route enumeration NOT checked (degraded)")
        return
    ia = json.load(open(p, encoding="utf-8"))
    probs = []
    iat = {t["id"]: t for t in ia["templates"]}
    if set(iat) != set(T):
        probs.append(f"template ids differ: {sorted(set(iat) ^ set(T))}")
    for tid, t in T.items():
        i = iat.get(tid)
        if not i:
            continue
        if [n["iaSection"] for n in t["nodes"]] != i["sections"]:
            probs.append(f"{tid}: node iaSection sequence != ia.json sections")
        if t["routes"]["count"] != i["routeCount"]:
            probs.append(f"{tid}: route count {t['routes']['count']} != ia {i['routeCount']}")
        if t["chrome"] != i["chrome"]:
            probs.append(f"{tid}: chrome differs")
        if i.get("routesTruncated"):
            if t["routes"].get("pattern") != i["routePattern"]:
                probs.append(f"{tid}: pattern differs")
        elif t["routes"].get("exact") != i["routes"]:
            probs.append(f"{tid}: exact routes differ")
    secs = {i: J(f"sections/{i}.json") for i in ids_in("sections")}
    covered = [m["iaSection"] for s in secs.values() for m in s["variants"].values()]
    if set(covered) != set(ia["sections"]):
        probs.append(f"IA sections not covered by a contract variant: {sorted(set(covered) ^ set(ia['sections']))}")
    owners = {}
    for sid, s in secs.items():
        for m in s["variants"].values():
            owners.setdefault(m["iaSection"], set()).add(sid)
    multi = {k: sorted(v) for k, v in owners.items() if len(v) != 1}
    if multi:
        probs.append(f"IA section claimed by more than one contract: {multi}")
    for sid, sc in secs.items():
        files = {c["ref"].rsplit(":", 1)[0] for c in sc.get("source", {}).get("implementedBy", [])}
        for m in sc["variants"].values():
            isec = ia["sections"].get(m["iaSection"])
            if not isec:
                continue
            if isec["category"] != sc.get("semantic", {}).get("category"):
                probs.append(f"{sid}: semantic.category {sc.get('semantic', {}).get('category')} != ia.json {m['iaSection']} category {isec['category']}")
            if re.split(r" [>(]", isec["implementedBy"])[0] not in files:
                probs.append(f"{sid}: ia.json {m['iaSection']} implementedBy {isec['implementedBy']!r} is not among the contract's source files {sorted(files)}")
    if sum(t["routes"]["count"] for t in T.values()) != ia["meta"]["totalRoutes"]:
        probs.append("total routes != ia.meta.totalRoutes")
    if len(T) != ia["meta"]["totalTemplates"]:
        probs.append("template count != ia.meta.totalTemplates")
    for sid, s in ia["sections"].items():
        impl = re.split(r" [>(]", s["implementedBy"])[0]
        if not os.path.isfile(os.path.join(PROJECT, impl)):
            probs.append(f"ia {sid}: implementedBy {impl} missing")
    (fail if probs else ok)("ia-parity", "; ".join(probs[:6]) if probs else f"{len(T)} templates / {len(ia['sections'])} IA sections / {ia['meta']['totalRoutes']} routes identical to ia.json (ids, node order, counts, patterns, chrome); every contract's semantic.category and source file agree with ia.json")
    # real route enumeration, 1:1
    docs = [d["url"] for d in json.load(open(os.path.join(PROJECT, "src/content/docs/_pages.json"), encoding="utf-8"))]
    cl = json.load(open(os.path.join(PROJECT, "src/content/changelog/index.json"), encoding="utf-8"))
    routes = [r for t in T.values() for r in t["routes"].get("exact", [])] + docs + ["/changelog"] + [f"/changelog/page/{n}" for n in range(2, cl["totalPages"] + 1)] + [p["url"] for p in cl["posts"]]
    owner, bad = {}, []
    for r in routes:
        hits = [tid for tid, t in T.items() if sv.route_ok(r, t["routes"])]
        if len(hits) != 1:
            bad.append(f"{r} -> {hits}")
        owner.setdefault(hits[0] if hits else None, []).append(r)
    cnt_bad = {tid: (len(owner.get(tid, [])), t["routes"]["count"]) for tid, t in T.items() if len(owner.get(tid, [])) != t["routes"]["count"]}
    if len(set(routes)) != len(routes):
        bad.append("duplicate routes in enumeration")
    (fail if bad or cnt_bad else ok)("route-coverage", f"{len(routes)} enumerated routes (static + docs + changelog from src/content) each match exactly one template; per-template counts equal" if not (bad or cnt_bad) else f"bad {bad[:4]} counts {cnt_bad}")


def check_stack(man):
    p = os.path.join(PROJECT, "package.json")
    if not os.path.isfile(p):
        warn("stack-rediff", "package.json not present: stated framework versions NOT re-diffed (degraded)")
        return
    pkg = json.load(open(p, encoding="utf-8"))
    deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}
    probs = []
    for name, want in man["sourceStack"].items():
        have = re.sub(r"^[^\d]*", "", deps.get(name, ""))
        if not have.startswith(want):
            probs.append(f"{name}: manifest says {want}, package.json has {deps.get(name)}")
    (fail if probs else ok)("stack-rediff", "; ".join(probs) if probs else "manifest sourceStack majors match current package.json")


def main():
    check_json()
    schema = check_schema()  # noqa: F841
    check_allowlist()
    tree, cat = check_tokens()
    check_motion()
    check_graph()
    check_assets()
    check_mode_schema(schema)
    check_availability()
    check_source_brand()
    check_generated_examples()
    T = check_templates()
    check_contracts()
    check_retrieval()
    check_wrapper_gate(T)
    man, comp = check_manifest(tree, T)
    check_allowlist_version()
    check_docs_counts(comp)
    check_no_abs_paths()
    check_citations()
    check_ia(T)
    check_stack(man)
    check_adversarial_suite()
    f = sum(1 for r in RESULTS if r[0] == "FAIL")
    w = sum(1 for r in RESULTS if r[0] == "WARN")
    print(f"\nSUMMARY: {sum(1 for r in RESULTS if r[0] == 'PASS')} pass, {w} warn, {f} fail")
    return 1 if f else 0


if __name__ == "__main__":
    sys.exit(main())
