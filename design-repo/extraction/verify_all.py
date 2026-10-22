#!/usr/bin/env python3
"""One-command verification of the whole design-repo.

  python3 extraction/verify_all.py

Output lines are `PASS|FAIL|WARN [check-id] message`; exit code 1 if any FAIL.

Always-on (self-contained) checks: JSON parse, allowlist parity, allowlistVersion parity, schema regeneration
diff + draft-07 validity, example validation, token catalog / alias / theme recompute, motion-pattern parity,
graph-rule vs validator parity, asset-role closure AND compliance pins (pinned values, not just enum membership),
template integrity, manifest counts recomputed from files, entryPoints inside the repo, README/CHANGELOG counts,
no absolute local paths.

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
    ex = J("schema/example.pagespec.json")
    errs, warns = sv.validate(ex, root=ROOT)
    (ok if not errs else fail)("example-valid", f"example.pagespec.json: {len(errs)} errors, {len(warns)} warnings {errs[:3]}")
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
    (ok if not open_objs else fail)("schema-closed", "every object with properties is additionalProperties:false" if not open_objs else f"open objects: {open_objs[:5]}")
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
    heroless = sorted(t for t, d in templates.items() if not any(secs[n["section"]]["category"] == "HERO" for n in d["nodes"]))
    if sorted(req["exceptions"]) != heroless:
        probs.append(f"REQUIRES_HERO exceptions {sorted(req['exceptions'])} != actual hero-less templates {heroless}")
    for t, d in templates.items():
        if sum(secs[n["section"]]["category"] == "HERO" for n in d["nodes"]) > 1:
            probs.append(f"{t} has more than one hero (ONE_HERO would reject its own template)")
    (fail if probs else ok)("graph-parity", "; ".join(probs) if probs else f"{len(ids)} graph rules == RULE_IMPLS; REQUIRES_HERO exceptions == real hero-less templates")


def check_assets():
    doc = J("assets/asset-roles.json")
    roles, pols = doc["roles"], doc["policies"]
    probs = []
    for r, d in roles.items():
        if d["generationPolicy"] not in pols:
            probs.append(f"{r}: policy {d['generationPolicy']!r} not in the closed policy set")
        for k in ("licensing", "guidance", "usageSites", "kind"):
            if not d.get(k):
                probs.append(f"{r}: missing {k}")
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
    if sum(t["routes"]["count"] for t in T.values()) != ia["meta"]["totalRoutes"]:
        probs.append("total routes != ia.meta.totalRoutes")
    if len(T) != ia["meta"]["totalTemplates"]:
        probs.append("template count != ia.meta.totalTemplates")
    for sid, s in ia["sections"].items():
        impl = re.split(r" [>(]", s["implementedBy"])[0]
        if not os.path.isfile(os.path.join(PROJECT, impl)):
            probs.append(f"ia {sid}: implementedBy {impl} missing")
    (fail if probs else ok)("ia-parity", "; ".join(probs[:6]) if probs else f"{len(T)} templates / {len(ia['sections'])} IA sections / {ia['meta']['totalRoutes']} routes identical to ia.json (ids, node order, counts, patterns, chrome)")
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
    T = check_templates()
    man, comp = check_manifest(tree, T)
    check_allowlist_version()
    check_docs_counts(comp)
    check_no_abs_paths()
    check_citations()
    check_ia(T)
    check_stack(man)
    f = sum(1 for r in RESULTS if r[0] == "FAIL")
    w = sum(1 for r in RESULTS if r[0] == "WARN")
    print(f"\nSUMMARY: {sum(1 for r in RESULTS if r[0] == 'PASS')} pass, {w} warn, {f} fail")
    return 1 if f else 0


if __name__ == "__main__":
    sys.exit(main())
