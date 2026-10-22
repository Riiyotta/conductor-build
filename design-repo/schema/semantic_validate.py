#!/usr/bin/env python3
"""Everything pagespec.schema.json cannot express.

  python3 schema/semantic_validate.py spec.json [spec2.json ...]

Layers (all run, errors and warnings are collected together):
  1. Draft-07 schema validation.
  2. Template cross-reference: the nodes[] sequence is matched, by (section, variant) key, against the
     DECLARED template's real node list in templates/templates.json (missing required, extra, out of order,
     non-repeatable repeats), and the route must belong to that template.
  3. Content contracts from sections/*.json: maxWords on every text field, asset-role compliance pins.
  4. Motion: patterns allowed for the (section, variant), reducedMotionFallback equals the contract.
  5. compatibility/graph.json rules, honouring severity ("error" fails, "warn" is reported).
  6. Retrieval eligibility: a node's optional retrievalEligible must equal the code-pinned value for its section.

Also validate_contract()/validate_all_contracts(): the closed shape of every sections/*.json (schema/section-contract.schema.json),
provenance (`source`) kept separate from taxonomy (`semantic`), and the retrieval-eligibility pins.

Repo root is derived from __file__ (never an absolute path).
"""
import glob
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Compliance-critical asset roles. These pins live in CODE on purpose: membership in the policy enum is not
# the rule, a specific value is. verify_all.py fails if assets/asset-roles.json disagrees with this table.
COMPLIANCE_PINS = {
    "brand-mark": "must-not-reproduce",
    "customer-logo": "must-not-reproduce",
    "vendor-mark": "must-not-reproduce",
    "person-avatar": "must-not-reproduce",
    "team-photo": "must-not-reproduce",
    "product-screenshot": "must-not-reproduce",
    "form-endpoint": "must-not-reuse-live-endpoint",
    "download-endpoint": "must-not-reuse-live-endpoint",
}

# The allowed sources/targets of the two pinned policies are also code, so loosening assets/asset-roles.json
# cannot relax them (verify_all.py fails if the JSON disagrees).
PINNED_POLICY_ALLOWED = {
    "must-not-reproduce": {"allowedSources": ["placeholder", "rights-holder-supplied"]},
    "must-not-reuse-live-endpoint": {"allowedTargets": ["local-only-no-submit", "deployer-configured", "opens-download-dialog"]},
}

# Utilities that are not design compositions: dialogs, drawers and full-screen overlays. A retrieval layer must not offer
# them as page-composition examples, so their contracts carry retrievalEligible=false. This set lives in CODE on purpose
# (like COMPLIANCE_PINS): editing a contract or the allowlist cannot flip it silently, verify_all.py checks all three agree.
# Every section whose slot is "overlay" must be in this set, and nothing else may be.
RETRIEVAL_INELIGIBLE = frozenset({"shell.download-dialog", "shell.downloading-screen", "docs.mobile-drawer", "docs.search-dialog"})

CATEGORIES = ("SHELL", "HERO", "PROOF", "FEATURES", "CONTENT", "CONVERSION", "DOCS", "CHANGELOG")

_cache = {}


def reset():
    _cache.clear()


def _load(root, rel):
    key = (root, rel)
    if key not in _cache:
        with open(os.path.join(root, rel), encoding="utf-8") as fh:
            _cache[key] = json.load(fh)
    return _cache[key]


def _sections(root):
    key = (root, "sections/*")
    if key not in _cache:
        out = {}
        for p in sorted(glob.glob(os.path.join(root, "sections", "*.json"))):
            with open(p, encoding="utf-8") as fh:
                d = json.load(fh)
            out[d["id"]] = d
        _cache[key] = out
    return _cache[key]


def category_of(section):
    return section.get("semantic", {}).get("category")  # None if the block is missing; validate_contract reports that


def retrieval_pin(section_id):
    """The pinned retrievalEligible value for a section id (independent of any JSON file)."""
    return section_id not in RETRIEVAL_INELIGIBLE


def validate_contract(doc, root=ROOT):
    """Errors for one section contract (parsed JSON). Codes: CONTRACT_SCHEMA, SEMANTIC_ID, SEMANTIC_IA, SOURCE_ID, RETRIEVAL_PIN."""
    import jsonschema

    errs = []
    schema = _load(root, "schema/section-contract.schema.json")
    for e in sorted(jsonschema.Draft7Validator(schema).iter_errors(doc), key=lambda e: list(map(str, e.absolute_path))):
        errs.append(f"CONTRACT_SCHEMA {'/'.join(map(str, e.absolute_path)) or '<root>'}: {e.message[:160]}")
    if errs or not isinstance(doc, dict):
        return errs
    sid = doc["id"]
    if doc["semantic"]["semanticId"] != sid:
        errs.append(f"SEMANTIC_ID {sid}: semantic.semanticId {doc['semantic']['semanticId']!r} must equal the contract id")
    ia = sorted({v["iaSection"] for v in doc["variants"].values()})
    if sorted(doc["semantic"]["iaSections"]) != ia:
        errs.append(f"SEMANTIC_IA {sid}: semantic.iaSections {sorted(doc['semantic']['iaSections'])} != variant iaSections {ia}")
    files = {c["ref"].rsplit(":", 1)[0] for c in doc["source"]["implementedBy"]}
    if doc["source"]["sourceId"] not in files:
        errs.append(f"SOURCE_ID {sid}: source.sourceId {doc['source']['sourceId']!r} is not a file cited in source.implementedBy {sorted(files)}")
    if doc["retrievalEligible"] != retrieval_pin(sid):
        errs.append(f"RETRIEVAL_PIN {sid}: retrievalEligible is {doc['retrievalEligible']!r}, pinned value is {retrieval_pin(sid)!r}")
    if doc["slot"] == "overlay" and sid not in RETRIEVAL_INELIGIBLE:
        errs.append(f"RETRIEVAL_PIN {sid}: slot is overlay but the id is not in the pinned RETRIEVAL_INELIGIBLE set")
    return errs


def validate_all_contracts(root=ROOT):
    out = []
    for p in sorted(glob.glob(os.path.join(root, "sections", "*.json"))):
        with open(p, encoding="utf-8") as fh:
            doc = json.load(fh)
        out += [f"{os.path.basename(p)}: {e}" for e in validate_contract(doc, root)]
    return out


def words(text):
    return len(text.split())


# ------------------------------------------------------------------ content contracts
def _policy_of(role, roles_doc):
    doc = roles_doc["roles"].get(role)
    return COMPLIANCE_PINS.get(role) or (doc or {}).get("generationPolicy")


def _allowed(pol, key, roles_doc):
    return PINNED_POLICY_ALLOWED.get(pol, roles_doc["policies"].get(pol, {})).get(key, [])


def _pin_drift(role, path, roles_doc, errs):
    if role in COMPLIANCE_PINS and roles_doc["roles"].get(role, {}).get("generationPolicy") != COMPLIANCE_PINS[role]:
        errs.append(f"ASSET_PIN_DRIFT {path}: asset-roles.json says {role}={roles_doc['roles'].get(role, {}).get('generationPolicy')!r}, pin is {COMPLIANCE_PINS[role]!r}")


def walk_content(fields, value, path, roles_doc, errs):
    if not isinstance(value, dict):
        return
    for name, f in fields.items():
        if name not in value:
            continue
        walk_field(f, value[name], f"{path}.{name}", roles_doc, errs)


def walk_field(f, v, path, roles_doc, errs):
    t = f["type"]
    if t == "text" and isinstance(v, str):
        n = words(v)
        if n > f["maxWords"]:
            errs.append(f"MAXWORDS {path}: {n} words > maxWords {f['maxWords']}")
    elif t == "media" and isinstance(v, dict):
        role, src = v.get("assetRole"), v.get("source")
        if role not in f["roles"]:
            errs.append(f"ASSET_ROLE {path}: role {role!r} not allowed here (allowed {f['roles']})")
            return
        pol = _policy_of(role, roles_doc)
        allowed = _allowed(pol, "allowedSources", roles_doc)
        _pin_drift(role, path, roles_doc, errs)
        if src not in allowed:
            errs.append(f"ASSET_PIN {path}: role {role!r} is pinned {pol!r}; source {src!r} not allowed (allowed {allowed})")
    elif t == "endpoint" and isinstance(v, dict):
        role, tgt = v.get("assetRole"), v.get("target")
        if role not in f["roles"]:
            errs.append(f"ASSET_ROLE {path}: role {role!r} not allowed here")
            return
        pol = _policy_of(role, roles_doc)
        allowed = _allowed(pol, "allowedTargets", roles_doc)
        _pin_drift(role, path, roles_doc, errs)
        if tgt not in allowed:
            errs.append(f"ASSET_PIN {path}: endpoint role {role!r} is pinned {pol!r}; target {tgt!r} not allowed (allowed {allowed})")
    elif t == "object":
        walk_content(f["fields"], v, path, roles_doc, errs)
    elif t == "list" and isinstance(v, list):
        for i, item in enumerate(v):
            walk_field(f["items"], item, f"{path}[{i}]", roles_doc, errs)


# ------------------------------------------------------------------ template cross-reference
def match_template(nodes, tnodes):
    """Greedy ordered match on (section, variant). Returns error strings."""
    errs, j, seen = [], 0, set()
    keys = [(n["section"], n["variant"]) for n in tnodes]
    for i, n in enumerate(nodes):
        k = (n.get("section"), n.get("variant"))
        found = None
        for x in range(j, len(keys)):
            if keys[x] == k:
                found = x
                break
        if found is None:
            if k in keys:
                prev = keys.index(k)
                if prev < j and tnodes[prev]["repeatable"]:
                    continue
                errs.append(f"TEMPLATE_ORDER nodes[{i}] {k}: out of order or repeated (non-repeatable) vs template")
            else:
                errs.append(f"TEMPLATE_EXTRA nodes[{i}] {k}: not in the declared template's node list")
            continue
        for skipped in range(j, found):
            # a repeatable node already matched earlier is not "missing" just because the next node follows it
            if tnodes[skipped]["required"] and skipped not in seen:
                errs.append(f"TEMPLATE_MISSING required node {keys[skipped]} missing before nodes[{i}]")
        seen.add(found)
        j = found if tnodes[found]["repeatable"] else found + 1
    for x in range(j, len(keys)):
        if tnodes[x]["required"] and x not in seen:
            errs.append(f"TEMPLATE_MISSING required node {keys[x]} missing")
    return errs


def route_ok(route, troutes):
    if "exact" in troutes:
        return route in troutes["exact"]
    return re.match(troutes["regex"], route) is not None


# ------------------------------------------------------------------ graph rules
class Ctx:
    def __init__(self, spec, template_id, template, sections, root):
        self.spec, self.tid, self.t, self.sections, self.root = spec, template_id, template, sections, root
        self.nodes = [n for n in spec.get("nodes", []) if isinstance(n, dict)]

    def sec(self, n):
        return self.sections.get(n.get("section"))

    def cat(self, n):
        s = self.sec(n)
        return category_of(s) if s else None

    def slot(self, n):
        s = self.sec(n)
        return s["slot"] if s else None

    def flow(self):
        return [n for n in self.nodes if self.slot(n) == "flow"]


def r_one_hero(c, rule):
    k = sum(1 for n in c.nodes if c.cat(n) == "HERO")
    return [f"more than one HERO section ({k})"] if k > 1 else []


def r_requires_hero(c, rule):
    if c.tid in rule.get("exceptions", []):
        return []
    return [] if any(c.cat(n) == "HERO" for n in c.nodes) else ["no HERO section and template is not a named hero-less exception"]


def r_header_first(c, rule):
    return [] if c.nodes and c.nodes[0].get("section") == "shell.header" else ["first node is not shell.header"]


def r_footer_last(c, rule):
    f = c.flow()
    if not f or not str(f[-1].get("section", "")).startswith("shell.footer"):
        return ["last flow node is not the footer"]
    return []


def r_adjacent(c, rule):
    out, f = [], c.flow()
    for a, b in zip(f, f[1:]):
        ca, cb = c.cat(a), c.cat(b)
        if ca == cb and c.tid not in rule.get("exceptionsByCategory", {}).get(ca, []):
            out.append(f"adjacent {ca} sections {a['section']} -> {b['section']}")
    return out


def r_one_per_page(c, rule):
    out, seen = [], {}
    for n in c.nodes:
        seen[n.get("section")] = seen.get(n.get("section"), 0) + 1
    for sid, k in seen.items():
        s = c.sections.get(sid)
        if s and s["constraints"].get("onePerPage") and k > 1:
            out.append(f"{sid} appears {k} times but is onePerPage")
    return out


def r_max_unique(c, rule):
    out, seen = [], {}
    for n in c.nodes:
        s = c.sec(n)
        if s and "maxPerPage" in s["constraints"]:
            seen.setdefault(n["section"], []).append((n["section"], n.get("variant")))
    for sid, keys in seen.items():
        mx = c.sections[sid]["constraints"]["maxPerPage"]
        if len(keys) > mx:
            out.append(f"{sid} appears {len(keys)} times > maxPerPage {mx}")
        if len(set(keys)) != len(keys):
            out.append(f"{sid} repeats a (section, variant) key: {keys}")
    return out


def r_must_follow(c, rule):
    out = []
    for i, n in enumerate(c.nodes):
        s = c.sec(n)
        want = s["constraints"].get("mustFollow") if s else None
        if want and (i == 0 or c.nodes[i - 1].get("section") != want):
            out.append(f"{n['section']} must immediately follow {want}")
    return out


def r_must_follow_nav(c, rule):
    out = []
    for i, n in enumerate(c.nodes):
        s = c.sec(n)
        if s and s["constraints"].get("mustFollowNav") and any(c.slot(p) != "chrome" for p in c.nodes[:i]):
            out.append(f"{n['section']} must only be preceded by chrome (navigation) nodes")
    return out


def r_precede_footer(c, rule):
    out = []
    fi = next((i for i, n in enumerate(c.nodes) if str(n.get("section", "")).startswith("shell.footer")), None)
    for i, n in enumerate(c.nodes):
        s = c.sec(n)
        if s and s["constraints"].get("mustPrecedeFooter") and (fi is None or i > fi):
            out.append(f"{n['section']} must precede the footer")
    return out


def r_allowed_template(c, rule):
    out = []
    for n in c.nodes:
        s = c.sec(n)
        if s and c.tid not in s["constraints"].get("allowedTemplates", []):
            out.append(f"{n['section']} is not allowed on {c.tid} (allowed: {s['constraints'].get('allowedTemplates')})")
    return out


def r_route(c, rule):
    route = c.spec.get("route")
    return [] if isinstance(route, str) and route_ok(route, c.t["routes"]) else [f"route {route!r} does not belong to {c.tid}"]


def r_motion_budget(c, rule):
    cont = set(rule["params"]["continuousPatterns"])
    k = sum(1 for n in c.nodes if isinstance(n.get("motion"), dict) and cont & set(n["motion"].get("patterns", [])))
    return [f"{k} nodes use continuous motion > budget {rule['params']['max']}"] if k > rule["params"]["max"] else []


RULE_IMPLS = {
    "ONE_HERO": r_one_hero, "REQUIRES_HERO": r_requires_hero, "HEADER_FIRST": r_header_first,
    "FOOTER_LAST_IN_FLOW": r_footer_last, "NO_ADJACENT_SAME_CATEGORY": r_adjacent, "ONE_PER_PAGE": r_one_per_page,
    "MAX_PER_PAGE_UNIQUE_VARIANT": r_max_unique, "MUST_FOLLOW": r_must_follow, "MUST_FOLLOW_NAV": r_must_follow_nav,
    "MUST_PRECEDE_FOOTER": r_precede_footer, "SECTION_ALLOWED_IN_TEMPLATE": r_allowed_template,
    "ROUTE_MATCHES_TEMPLATE": r_route, "MOTION_BUDGET": r_motion_budget,
}


# ------------------------------------------------------------------ main entry
def validate(spec, root=ROOT):
    """Returns (errors, warnings)."""
    import jsonschema

    errs, warns = [], []
    schema = _load(root, "schema/pagespec.schema.json")
    for e in sorted(jsonschema.Draft7Validator(schema).iter_errors(spec), key=lambda e: list(map(str, e.absolute_path))):
        loc = "/".join(map(str, e.absolute_path)) or "<root>"
        errs.append(f"SCHEMA {loc}: {e.message[:200]}")
    if not isinstance(spec, dict):
        return errs, warns
    templates = _load(root, "templates/templates.json")["templates"]
    tid = spec.get("template")
    if tid not in templates or not isinstance(spec.get("nodes"), list):
        return errs, warns
    t = templates[tid]
    sections = _sections(root)
    roles_doc = _load(root, "assets/asset-roles.json")
    graph = _load(root, "compatibility/graph.json")
    nodes = [n for n in spec["nodes"] if isinstance(n, dict)]

    errs += match_template(nodes, t["nodes"])

    for i, n in enumerate(nodes):
        s = sections.get(n.get("section"))
        if not s:
            continue
        if "retrievalEligible" in n and n["retrievalEligible"] is not retrieval_pin(n["section"]):
            errs.append(f"RETRIEVAL_PIN nodes[{i}]<{n['section']}>: retrievalEligible {n['retrievalEligible']!r} contradicts the pinned value {retrieval_pin(n['section'])!r}")
        walk_content(s["content"], n.get("content"), f"nodes[{i}]<{n['section']}>.content", roles_doc, errs)
        m = n.get("motion")
        if isinstance(m, dict):
            mc = s["motion"]
            allowed = set(mc.get("variantPatterns", {}).get(n.get("variant"), mc["allowedPatterns"]))
            for p in m.get("patterns", []):
                if p not in allowed:
                    errs.append(f"MOTION nodes[{i}]<{n['section']}/{n.get('variant')}>: pattern {p!r} not allowed (allowed {sorted(allowed)})")
            if m.get("reducedMotionFallback") != mc["reducedMotionFallback"]:
                errs.append(f"MOTION nodes[{i}]<{n['section']}>: reducedMotionFallback must be {mc['reducedMotionFallback']!r}")

    ctx = Ctx(spec, tid, t, sections, root)
    for rule in graph["rules"]:
        impl = RULE_IMPLS.get(rule["id"])
        if impl is None:
            errs.append(f"GRAPH rule {rule['id']} has no implementation in semantic_validate.py")
            continue
        for msg in impl(ctx, rule):
            (errs if rule["severity"] == "error" else warns).append(f"{rule['id']}: {msg}")
    return errs, warns


def main(argv):
    if not argv:
        print(__doc__)
        return 2
    rc = 0
    for path in argv:
        with open(path, encoding="utf-8") as fh:
            spec = json.load(fh)
        errs, warns = validate(spec)
        print(f"{path}: {len(errs)} error(s), {len(warns)} warning(s)")
        for e in errs:
            print("  ERROR", e)
        for w in warns:
            print("  WARN ", w)
        rc = rc or (1 if errs else 0)
    return rc


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
