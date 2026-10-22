#!/usr/bin/env python3
"""Proves verify_all.py actually catches drift (a check never seen failing might check nothing).

  python3 extraction/prove_drift.py

For every case: copy this repo to a scratch dir, inject ONE piece of drift, run the scratch copy's own
verify_all.py, and require exit code 1 with `FAIL [<expected-check>]`. Finally confirm the unmodified real repo
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
    sub_text(root, "README.md", "sectionContracts=41", "sectionContracts=40")


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
    for name, check, fn, needs in CASES:
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
    print(f"\ndrift cases caught: {proved}/{len(CASES) - skipped}  (skipped {skipped}); failures: {bad}")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
