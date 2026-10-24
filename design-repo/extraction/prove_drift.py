#!/usr/bin/env python3
"""Proves verify_all.py actually catches drift (a check never seen failing might check nothing).

  python3 extraction/prove_drift.py

For every case: copy this repo to a scratch dir, inject ONE piece of drift, run the scratch copy's own
verify_all.py, and require exit code 1 with `FAIL [<expected-check>]` (or, for warn cases, exit code 0 with
`WARN [<expected-check>]`). Finally confirm the unmodified real repo
still passes. Cases that need the sibling source project (citations, ia.json parity, route enumeration, stack
re-diff) get the project's top-level entries symlinked into the scratch parent; if the sibling tree is absent they
are reported as SKIPPED, not passed.
"""
import json
import os
import shutil
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT = os.path.dirname(ROOT)
HAVE_SIBLINGS = os.path.isfile(os.path.join(PROJECT, "ia.json")) and os.path.isdir(os.path.join(PROJECT, "src"))
FORBIDDEN = "/Us" + "ers/"
ENV = dict(os.environ, PYTHONDONTWRITEBYTECODE="1")


def edit(root, rel, fn):
    p = os.path.join(root, rel)
    d = json.load(open(p, encoding="utf-8"))
    fn(d)
    json.dump(d, open(p, "w", encoding="utf-8"), indent=2, ensure_ascii=False)
    open(p, "a").write("\n")


def first_cite(d):
    """Find the first {ref, quote} object in a loaded JSON document."""
    if isinstance(d, dict):
        if isinstance(d.get("ref"), str) and "quote" in d:
            return d
        for v in d.values():
            r = first_cite(v)
            if r:
                return r
    elif isinstance(d, list):
        for v in d:
            r = first_cite(v)
            if r:
                return r
    return None


def append_text(root, rel, text):
    with open(os.path.join(root, rel), "a", encoding="utf-8") as fh:
        fh.write(text)


def sub_text(root, rel, old, new):
    p = os.path.join(root, rel)
    t = open(p, encoding="utf-8").read()
    assert old in t, (rel, old)
    open(p, "w", encoding="utf-8").write(t.replace(old, new, 1))


def _out_of_range(root):
    def f(d):
        c = first_cite(d)
        c["ref"] = c["ref"].split(":")[0] + ":99999"
    edit(root, "sections/hero.home.json", f)


def _wrong_content(root):
    def f(d):
        c = first_cite(d)
        c["ref"] = c["ref"].split(":")[0] + ":1"  # in range, but the quoted text is not on that line
    edit(root, "tokens/00-foundation/color.json", f)


def _pin(role, value):
    return lambda root: edit(root, "assets/asset-roles.json", lambda d: d["roles"][role].__setitem__("generationPolicy", value))


def _orphan(root):
    d = json.load(open(os.path.join(root, "primitives/badge.json"), encoding="utf-8"))
    d["id"] = "orphan-thing"
    json.dump(d, open(os.path.join(root, "primitives/orphan-thing.json"), "w"))


def _token_removed(root):
    def f(d):
        del d["color"]["fable"]
    edit(root, "tokens/00-foundation/color.json", f)


def _schema_drift(root):
    edit(root, "schema/pagespec.schema.json", lambda d: d["definitions"]["node"]["required"].remove("motion"))


def _graph_phantom(root):
    edit(root, "compatibility/graph.json", lambda d: d["rules"].append({"id": "PHANTOM_RULE", "severity": "error", "description": "x", "exceptions": []}))


def _heroless_exception(root):
    edit(root, "compatibility/graph.json", lambda d: [r["exceptions"].remove("template.legal") for r in d["rules"] if r["id"] == "REQUIRES_HERO"])


def _motion_drift(root):
    edit(root, "tokens/llm/motion-patterns.json", lambda d: d["patterns"].__setitem__("parallax", {"description": "x", "measuredFrom": []}))


def _ia_count(root):
    edit(root, "templates/templates.json", lambda d: d["templates"]["template.legal"]["routes"].__setitem__("exact", ["/privacy"]) or d["templates"]["template.legal"]["routes"].__setitem__("count", 1))


def _ia_order(root):
    def f(d):
        n = d["templates"]["template.pricing"]["nodes"]
        n[3], n[4] = n[4], n[3]
    edit(root, "templates/templates.json", f)


def _route_regex(root):
    edit(root, "templates/templates.json", lambda d: d["templates"]["template.changelog-post"]["routes"].__setitem__("regex", "^/changelog/0\\.9[0-9]\\.[0-9]+-[a-z0-9.-]+$"))


def _readme_counts(root):
    sub_text(root, "README.md", "sectionContracts=42", "sectionContracts=40")


def ledger(root, fn):
    edit(root, "extraction/measured-values.json", fn)


def hs(d, route, key, value):
    d["sectionHeights"]["routes"][route]["sections"][key] = value


def whitelist(d):
    return d["wrapperGate"]["whitelist"]


def _wl_remove(section):
    return lambda root: ledger(root, lambda d: d["wrapperGate"].__setitem__("whitelist", [e for e in whitelist(d) if e["section"] != section]))


def _wl_cap(root):
    def f(d):
        for e in whitelist(d):
            if e["section"] == "content.legal-body/default":
                e["maxPx"] = 1000
    ledger(root, f)


def _wl_stale(root):
    ledger(root, lambda d: whitelist(d).append({"template": "template.brandkit", "section": "content.brandkit-about/default", "maxPx": 5000, "maxSharePct": 99, "reviewed": "2026-10-22", "justification": "A deliberately unneeded entry: nothing measured exceeds any threshold here, so it must be reported as stale."}))


def _wl_wrong_section(root):
    ledger(root, lambda d: whitelist(d).append({"template": "template.enterprise", "section": "conversion.enterprise-contact-form/default", "maxPx": 5000, "maxSharePct": 99, "reviewed": "2026-10-22", "justification": "A contact form is not prose by nature, so this whitelist entry must be refused outright."}))


def _drop_node(root):
    ledger(root, lambda d: d["sectionHeights"]["routes"]["/changelog/0.91.0-a-mostly-boring-update"]["sections"].pop("changelog.entry-body/default"))


def _drop_route(root):
    ledger(root, lambda d: d["sectionHeights"]["routes"].pop("/privacy"))


def _gate_loosened(root):
    ledger(root, lambda d: d["sectionHeights"]["gate"].__setitem__("shareFailPct", 95))


def _retro_post(root):
    """The original bug: one whole-article section on a post page (header node swallowing the article)."""
    ledger(root, lambda d: hs(d, "/changelog/0.91.0-a-mostly-boring-update", "changelog.entry-header/post", 2824))


def _contract(section, fn):
    return lambda root: edit(root, f"sections/{section}.json", fn)


def _example_gap(root):
    edit(root, "schema/example.legal.pagespec.json", lambda d: d["nodes"].pop(2))


CASES = [
    ("phantom allowlist id", "allowlist-parity", lambda r: edit(r, "tokens/llm/component-allowlist.json", lambda d: d["sections"].append("phantom.section")), False),
    ("orphan contract file with no allowlist entry", "allowlist-parity", _orphan, False),
    ("out-of-range citation", "citation-range", _out_of_range, True),
    ("in-range citation describing the wrong code", "citation-range", _wrong_content, True),
    ("wrong sections count in manifest", "manifest-counts", lambda r: edit(r, "registry.manifest.json", lambda d: d["counts"].__setitem__("sectionContracts", 40)), False),
    ("wrong token count in manifest", "manifest-counts", lambda r: edit(r, "registry.manifest.json", lambda d: d["counts"].__setitem__("tokens", 1)), False),
    ("allowlistVersion mismatch", "allowlistVersion-parity", lambda r: edit(r, "registry.manifest.json", lambda d: d.__setitem__("allowlistVersion", "9.9.9")), False),
    ("FLIPPED PIN form-endpoint -> may-generate-new (valid enum value)", "asset-role-pins", _pin("form-endpoint", "may-generate-new"), False),
    ("FLIPPED PIN download-endpoint -> placeholder-only (valid enum value)", "asset-role-pins", _pin("download-endpoint", "placeholder-only"), False),
    ("FLIPPED PIN customer-logo -> may-generate-new", "asset-role-pins", _pin("customer-logo", "may-generate-new"), False),
    ("pinned policy widened (must-not-reproduce allows generated-new)", "asset-role-pins", lambda r: edit(r, "assets/asset-roles.json", lambda d: d["policies"]["must-not-reproduce"]["allowedSources"].append("generated-new")), False),
    ("absolute local path injected", "no-absolute-paths", lambda r: append_text(r, "README.md", "\nsee " + FORBIDDEN + "someone/project\n"), False),
    ("phantom token alias", "token-alias-resolution", lambda r: edit(r, "tokens/20-component/component.json", lambda d: d["component"]["button"]["primary"].__setitem__("background", "{color.does-not-exist}")), False),
    ("token deleted without updating the catalog", "token-catalog", _token_removed, False),
    ("schema drifted from the contracts", "schema-regeneration", _schema_drift, False),
    ("graph rule without an implementation", "graph-parity", _graph_phantom, False),
    ("REQUIRES_HERO exception removed (graph vs real hero-less templates)", "graph-parity", _heroless_exception, False),
    ("motion pattern added to catalog only", "motion-parity", _motion_drift, False),
    ("entryPoint escaping the package", "manifest-integrity", lambda r: edit(r, "registry.manifest.json", lambda d: d["entryPoints"].__setitem__("external", ["../ia.json"])), False),
    ("README counts line stale", "docs-counts", _readme_counts, False),
    ("template route count differs from ia.json", "ia-parity", _ia_count, True),
    ("template node order differs from ia.json", "ia-parity", _ia_order, True),
    ("template route regex no longer covers every real route", "route-coverage", _route_regex, True),
    ("stated framework major differs from package.json", "stack-rediff", lambda r: edit(r, "registry.manifest.json", lambda d: d["sourceStack"].__setitem__("react", "19")), True),
    # ---- contract shape: provenance vs taxonomy
    ("provenance leaked into taxonomy (sourceId inside semantic)", "contract-shape", _contract("hero.home", lambda d: d["semantic"].__setitem__("sourceId", "src/components/Hero.jsx")), False),
    ("taxonomy leaked into provenance (category inside source)", "contract-shape", _contract("hero.home", lambda d: d["source"].__setitem__("category", "HERO")), False),
    ("sourceId points at a file the contract does not cite", "contract-shape", _contract("hero.home", lambda d: d["source"].__setitem__("sourceId", "src/components/Footer.jsx")), False),
    ("source block dropped from a contract", "contract-shape", _contract("shell.header", lambda d: d.pop("source")), False),
    ("semantic block dropped from a contract", "contract-shape", _contract("shell.header", lambda d: d.pop("semantic")), False),
    # ---- retrieval eligibility
    ("download dialog contract flipped to retrievalEligible=true", "retrieval-eligibility", _contract("shell.download-dialog", lambda d: d.__setitem__("retrievalEligible", True)), False),
    ("downloading screen contract flipped to retrievalEligible=true", "retrieval-eligibility", _contract("shell.downloading-screen", lambda d: d.__setitem__("retrievalEligible", True)), False),
    ("a composition (hero.home) flipped to retrievalEligible=false", "retrieval-eligibility", _contract("hero.home", lambda d: d.__setitem__("retrievalEligible", False)), False),
    ("allowlist retrievalIneligibleSections loses the downloading screen", "retrieval-eligibility", lambda r: edit(r, "tokens/llm/component-allowlist.json", lambda d: d["retrievalIneligibleSections"].remove("shell.downloading-screen")), False),
    ("schema branch locks retrievalEligible=true for the download dialog", "retrieval-eligibility", lambda r: edit(r, "schema/pagespec.schema.json", lambda d: [b["then"]["properties"]["retrievalEligible"].__setitem__("const", True) for b in d["definitions"]["node"]["allOf"] if b["if"]["properties"]["section"]["const"] == "shell.download-dialog"]), False),
    # ---- whole-page-wrapper gate
    ("HERO section measured at 3500px (>3000)", "wrapper-gate", lambda r: ledger(r, lambda d: hs(d, "/", "hero.home/default", 3500)), False),
    ("original bug reintroduced: one changelog section swallows the whole post (81% of page)", "wrapper-gate", _retro_post, False),
    ("non-whitelisted section above 60% of its page (brandkit about at 2000/3099)", "wrapper-gate", lambda r: ledger(r, lambda d: hs(d, "/brandkit", "content.brandkit-about/default", 2000)), False),
    ("legal body whitelist entry removed (94% of /privacy)", "wrapper-gate", _wl_remove("content.legal-body/default"), False),
    ("whitelist cap exceeded (legal body grew past its recorded maxPx)", "wrapper-gate", _wl_cap, False),
    ("stale whitelist entry nothing needs", "wrapper-gate", _wl_stale, False),
    ("whitelist entry for a section that is not prose by nature", "wrapper-gate", _wl_wrong_section, False),
    ("measured node dropped from a route to dodge the gate", "wrapper-gate", _drop_node, False),
    ("route missing from the measured ledger", "wrapper-gate", _drop_route, False),
    ("ledger gate thresholds loosened in JSON", "wrapper-gate", _gate_loosened, False),
    ("ledger removed entirely", "wrapper-gate", lambda r: ledger(r, lambda d: d.pop("sectionHeights")), False),
    # ---- decomposition stays wired everywhere
    ("example PageSpec for legal loses its body node", "example-valid", _example_gap, False),
    ("semantic category of a contract differs from ia.json", "ia-parity", _contract("changelog.entry-body", lambda d: d["semantic"].__setitem__("category", "CONTENT")), True),
]

# ---- generation context: mode, availability pins, generatedRoles, sourceBrand.patterns, generation-safe examples
def reg(root, fn):
    edit(root, "assets/asset-roles.json", fn)


def _avail(role, value):
    return lambda root: reg(root, lambda d: d["roles"][role].__setitem__("availability", value))


def _subs(role, value):
    return lambda root: reg(root, lambda d: d["roles"][role].__setitem__("generationSafeSubstitutes", value))


def _gen_example(name, fn):
    def go(root):
        edit(root, f"schema/examples/generated.template.{name}.pagespec.json", fn)
    return go


def _node(d, section, variant=None):
    return next(n for n in d["nodes"] if n["section"] == section and (variant is None or n["variant"] == variant))


def _ref_example(fn, name="example.pagespec.json"):
    return lambda root: edit(root, f"schema/{name}", fn)


def _pat(cat, pid, fn):
    def go(root):
        def f(d):
            for p in d["sourceBrand"]["patterns"][cat]["patterns"]:
                if p["id"] == pid:
                    fn(p)
        reg(root, f)
    return go


def _sub_py(old, new):
    return lambda root: sub_text(root, "schema/semantic_validate.py", old, new)


def _del_pat(cat, pid):
    return lambda root: reg(root, lambda d: d["sourceBrand"]["patterns"][cat].__setitem__("patterns", [p for p in d["sourceBrand"]["patterns"][cat]["patterns"] if p["id"] != pid]))


def _schema_mode_not_required(root):
    edit(root, "schema/pagespec.schema.json", lambda d: d["required"].remove("mode"))


def _schema_mode_enum(root):
    edit(root, "schema/pagespec.schema.json", lambda d: d["properties"]["mode"]["enum"].append("production"))


def _rm_gen_example(root):
    os.remove(os.path.join(root, "schema/examples/generated.template.home.pagespec.json"))


def _drop_generated_roles(root):
    def f(d):
        d["content"]["background"].pop("generatedRoles")
        d["generatedAssetRoles"] = [x for x in d["generatedAssetRoles"] if x != "background-generated"]
    edit(root, "sections/hero.home.json", f)
    edit(root, "sections/conversion.be-like-this-guy.json", lambda d: (d["content"]["background"].pop("generatedRoles"), d.pop("generatedAssetRoles")))


GEN_CASES = [
    ("availability: brand-mark (the source's logo) flipped to generation-safe", "asset-availability", _avail("brand-mark", "generation-safe"), False),
    ("availability: product-screenshot flipped to generation-safe", "asset-availability", _avail("product-screenshot", "generation-safe"), False),
    ("availability: customer-logo (blocked) flipped to generation-safe", "asset-availability", _avail("customer-logo", "generation-safe"), False),
    ("availability: form-endpoint (blocked) flipped to generation-safe", "asset-availability", _avail("form-endpoint", "generation-safe"), False),
    ("availability: person-avatar blocked-for-generation -> reference-only (different valid value)", "asset-availability", _avail("person-avatar", "reference-only"), False),
    ("availability: a generation-safe placeholder role quietly made reference-only", "asset-availability", _avail("brand-placeholder", "reference-only"), False),
    ("availability: value outside the closed set", "asset-availability", _avail("brand-mark", "public"), False),
    ("availability: reference-only role loses its generation-safe substitutes", "asset-availability", _subs("brand-mark", []), False),
    ("availability: substitute points at a blocked role", "asset-availability", _subs("brand-mark", ["customer-logo"]), False),
    ("availability: generation-safe role starts listing substitutes", "asset-availability", lambda r: reg(r, lambda d: d["roles"]["brand-placeholder"].__setitem__("generationSafeSubstitutes", ["avatar-placeholder"])), False),
    ("availability: semantic_validate.PINNED_AVAILABILITY edited (brand-mark -> generation-safe) so code and verify pin disagree", "asset-availability", _sub_py('"brand-mark": "reference-only", "product-screenshot"', '"brand-mark": "generation-safe", "product-screenshot"'), False),
    ("availability: registry role added without a pinned availability", "asset-availability", lambda r: reg(r, lambda d: d["roles"].__setitem__("new-role", dict(d["roles"]["icon"]))), False),
    ("generatedRoles: hero wordmark allows brand-mark (reference role) for generated pages", "asset-availability", lambda r: edit(r, "sections/hero.home.json", lambda d: d["content"]["wordmark"]["generatedRoles"].append("brand-mark")), False),
    ("generatedRoles: hero wordmark has none", "asset-availability", lambda r: edit(r, "sections/hero.home.json", lambda d: d["content"]["wordmark"].pop("generatedRoles")), False),
    ("generatedRoles: section-level generatedAssetRoles no longer derived from the fields", "asset-availability", lambda r: edit(r, "sections/hero.home.json", lambda d: d["generatedAssetRoles"].append("video-placeholder")), False),
    ("generatedRoles: a role of the wrong kind (endpoint-placeholder on a media field)", "asset-availability", lambda r: edit(r, "sections/hero.home.json", lambda d: d["content"]["wordmark"]["generatedRoles"].append("endpoint-placeholder")), False),
    ("generatedRoles: background-generated allowed by no section (dead role)", "asset-availability", _drop_generated_roles, False),
    ("mode: schema no longer requires `mode`", "mode-schema", _schema_mode_not_required, False),
    ("mode: enum widened with 'production'", "mode-schema", _schema_mode_enum, False),
    ("mode: asset-roles.json no longer documents the generated mode", "mode-schema", lambda r: reg(r, lambda d: d["modes"].pop("generated")), False),
    ("mode: reference example loses its mode", "mode-schema", _ref_example(lambda d: d.pop("mode")), False),
    ("mode: reference example claims to be generated", "mode-schema", _ref_example(lambda d: d.__setitem__("mode", "generated")), False),
    ("mode: manifest pageSpecVersion differs from the schema const", "manifest-integrity", lambda r: edit(r, "registry.manifest.json", lambda d: d.__setitem__("pageSpecVersion", "1.0.0")), False),
    ("examples: generated example claims to be reference", "generated-examples", _gen_example("home", lambda d: d.__setitem__("mode", "reference")), False),
    ("examples: generated example carries the source brand (hero heading)", "generated-examples", _gen_example("home", lambda d: _node(d, "hero.home")["content"].__setitem__("headingLead", "Meet Conductor")), False),
    ("examples: generated example carries source CTA text", "generated-examples", _gen_example("home", lambda d: _node(d, "hero.home")["content"]["primaryCta"].__setitem__("label", "Get Conductor")), False),
    ("examples: generated example carries source marketing copy", "generated-examples", _gen_example("home", lambda d: _node(d, "hero.home")["content"].__setitem__("headingLead", "Run a team of coding agents")), False),
    ("examples: generated example links to a source URL", "generated-examples", _gen_example("home", lambda d: _node(d, "hero.home")["content"]["primaryCta"].__setitem__("href", "https://app.conductor.build/pro")), False),
    ("examples: generated example uses a non-reserved host", "generated-examples", _gen_example("home", lambda d: _node(d, "hero.home")["content"]["primaryCta"].__setitem__("href", "https://acme.com/")), False),
    ("examples: generated example reuses the source's brand-mark role", "generated-examples", _gen_example("home", lambda d: _node(d, "hero.home")["content"]["wordmark"].__setitem__("assetRole", "brand-mark")), False),
    ("examples: generated example reuses the live download endpoint role", "generated-examples", _gen_example("home", lambda d: _node(d, "shell.download-dialog")["content"]["primaryAction"]["endpoint"].__setitem__("assetRole", "download-endpoint")), False),
    ("examples: generated docs example leaks a source docs sentence", "generated-examples", _gen_example("docs-page", lambda d: _node(d, "docs.prose-body")["content"]["blocks"][0].__setitem__("text", "Import a repository, configure it, and start agent work.")), False),
    ("examples: no generation-safe example for template.home", "generated-examples", _rm_gen_example, False),
    ("patterns: the CTA category is emptied", "source-brand-patterns", lambda r: reg(r, lambda d: d["sourceBrand"]["patterns"]["cta"].__setitem__("patterns", [])), False),
    ("patterns: a pinned pattern (cta-verb-brand) is removed", "source-brand-patterns", _del_pat("cta", "cta-verb-brand"), False),
    ("patterns: a pinned URL pattern (url-download-cdn) is removed", "source-brand-patterns", _del_pat("url", "url-download-cdn"), False),
    ("patterns: the brand pattern is changed to something that no longer matches Conductor", "source-brand-patterns", _pat("brand", "brand-conductor", lambda p: p.__setitem__("pattern", "xqzvconduct0r")), False),
    ("patterns: the CTA verb pattern loses 'get' (Get Conductor passes)", "source-brand-patterns", _pat("cta", "cta-verb-brand", lambda p: p.__setitem__("pattern", r"\b(?:try|download|join)\s+conductor\b")), False),
    ("patterns: the hero-headline pattern is narrowed so the real heading passes", "source-brand-patterns", _pat("copy", "copy-hero-headline", lambda p: p.__setitem__("pattern", "run a team of coding agents in space")), False),
    ("patterns: an asset pattern widened to match everything", "source-brand-patterns", _pat("asset", "asset-source-paths", lambda p: p.__setitem__("pattern", ".*")), False),
    ("patterns: a real literal no longer appears in the pattern's evidence", "source-brand-patterns", _pat("cta", "cta-waitlist", lambda p: p.__setitem__("evidence", [{"ref": "src/components/DownloadDialog.jsx:183", "quote": "waitlist"}])), False),
    ("patterns: reviewStatus no longer says UNREVIEWED", "source-brand-patterns", lambda r: reg(r, lambda d: d["sourceBrand"].__setitem__("reviewStatus", "Reviewed and approved.")), False),
    ("patterns: validator code documented differently from the validator", "source-brand-patterns", lambda r: reg(r, lambda d: d["sourceBrand"]["patterns"]["cta"].__setitem__("code", "GENERATED_MODE_SOURCE_BRAND")), False),
    ("patterns: placeholder-host rule loosened to accept any host", "source-brand-patterns", _sub_py('RESERVED_HOST = re.compile(r"(?:^|\\.)(?:example|invalid)$|(?:^|\\.)example\\.(?:com|org|net)$", re.I)', 'RESERVED_HOST = re.compile(r".*", re.I)'), False),
    ("patterns: evidence citation points at the wrong lines", "citation-range", _pat("cta", "cta-waitlist", lambda p: p["evidence"][0].__setitem__("ref", "src/components/DownloadDialog.jsx:1")), True),
    ("validator stops enforcing generated mode (only the adversarial suite can see it)", "adversarial-suite", _sub_py('mode = spec.get("mode") if spec.get("mode") in MODES else None', 'mode = None'), False),
    ("validator stops scanning generated-mode strings", "adversarial-suite", _sub_py('gen = mode == "generated" and pats is not None', 'gen = False'), False),
    ("validator stops rejecting reference-only roles in generated mode", "adversarial-suite", _sub_py('if av in ("reference-only", "blocked-for-generation"):', 'if False:'), False),
]


# warn-severity cases: exit 0, and the check must report WARN
WARN_CASES = [
    ("HERO section measured at 2000px (>1800, <3000)", "wrapper-gate", lambda r: ledger(r, lambda d: hs(d, "/", "hero.home/default", 2000)), False),
    ("section holding 55% of its page, not whitelisted (brandkit about 1700/3099)", "wrapper-gate", lambda r: ledger(r, lambda d: hs(d, "/brandkit", "content.brandkit-about/default", 1700)), False),
]


def scratch():
    tmp = tempfile.mkdtemp(prefix="drift-")
    dst = os.path.join(tmp, "design-repo")
    shutil.copytree(ROOT, dst, ignore=shutil.ignore_patterns("__pycache__", ".DS_Store"))
    if HAVE_SIBLINGS:
        for name in os.listdir(PROJECT):
            if name in ("design-repo", "node_modules", "dist", ".git") or name.startswith("design-repo"):
                continue
            os.symlink(os.path.join(PROJECT, name), os.path.join(tmp, name))
    return tmp, dst


def run_verify(dst):
    p = subprocess.run([sys.executable, os.path.join(dst, "extraction", "verify_all.py")], capture_output=True, text=True, env=ENV)
    return p.returncode, p.stdout


def main():
    bad = skipped = proved = 0
    for name, check, fn, needs in WARN_CASES:
        tmp, dst = scratch()
        try:
            fn(dst)
            rc, out = run_verify(dst)
            hit = rc == 0 and f"WARN [{check}]" in out
            print(f"{'CAUGHT ' if hit else 'MISSED '}  {name}  -> expected WARN [{check}] and exit 0")
            proved += hit
            bad += not hit
        finally:
            shutil.rmtree(tmp, ignore_errors=True)
    for name, check, fn, needs in CASES + GEN_CASES:
        if needs and not HAVE_SIBLINGS:
            print(f"SKIPPED  {name} (needs sibling source project)")
            skipped += 1
            continue
        tmp, dst = scratch()
        try:
            fn(dst)
            rc, out = run_verify(dst)
            hit = rc == 1 and f"FAIL [{check}]" in out
            print(f"{'CAUGHT ' if hit else 'MISSED '}  {name}  -> expected FAIL [{check}]")
            if hit:
                proved += 1
            else:
                bad += 1
                print("\n".join(l for l in out.splitlines() if l.startswith("FAIL"))[:600])
        finally:
            shutil.rmtree(tmp, ignore_errors=True)
    tmp, dst = scratch()
    try:
        rc, out = run_verify(dst)
        summary = out.strip().splitlines()[-1]
        print(f"CONTROL  unmodified scratch copy -> exit {rc}: {summary}")
        if rc != 0:
            bad += 1
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    print(f"\ndrift cases caught: {proved}/{len(CASES) + len(GEN_CASES) + len(WARN_CASES) - skipped}  (skipped {skipped}); failures: {bad}")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
