#!/usr/bin/env python3
"""Proves every rule rejects a bad instance, and that every real template still passes.

  python3 schema/tests/adversarial_test.py

* MUTATIONS: each takes the (valid) example, breaks exactly one thing, and must be rejected with the expected
  error code. Layers: schema, structural (template cross-reference / graph), runtime (maxWords, asset pins,
  motion), warn-severity (must land in warnings, NOT errors) and repo-level (a scratch copy of the repo is
  edited, e.g. a compliance pin flipped to a different-but-valid value).
* CONTROLS: the example plus one minimal instance per template, generated generically from
  templates/templates.json and the section contracts (adding a template needs no new control code). Each must
  produce zero errors.
* GENERATED MODE (PageSpec `mode: "generated"`, a new page for another brand): mutations of the generation-safe example
  PageSpecs for brand-name, source-CTA, source-copy, source-URL and protected-asset leakage, mode-field schema cases and
  repo-level edits (registry availability flipped, pattern registry emptied, generation-safe roles removed from a contract).
  Controls: every generated example passes, every reference example still passes (reference mode keeps validating the
  source's real content), and a generated plus a reference control are synthesised per template from the contracts.
Exit code 0 only if every mutation was rejected and every control passed.
"""
import copy
import glob
import json
import os
import re
import shutil
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(ROOT, "schema"))
import semantic_validate as sv  # noqa: E402


def load(rel, root=ROOT):
    with open(os.path.join(root, rel), encoding="utf-8") as fh:
        return json.load(fh)


EXAMPLE = load("schema/example.pagespec.json")
EX_LEGAL = load("schema/example.legal.pagespec.json")
EX_POST = load("schema/example.changelog-post.pagespec.json")
EX_INDEX = load("schema/example.changelog-index.pagespec.json")
BASES = {"home": EXAMPLE, "legal": EX_LEGAL, "post": EX_POST, "index": EX_INDEX}
GEN_BASES = {
    "home": load("schema/examples/generated.template.home.pagespec.json"),
    "legal": load("schema/examples/generated.template.legal.pagespec.json"),
    "post": load("schema/examples/generated.template.changelog-post.pagespec.json"),
    "docs": load("schema/examples/generated.template.docs-page.pagespec.json"),
}


def N(spec, section, variant=None):
    for n in spec["nodes"]:
        if n["section"] == section and (variant is None or n["variant"] == variant):
            return n
    raise KeyError(section)


def idx(spec, section, variant=None):
    return spec["nodes"].index(N(spec, section, variant))


def move(spec, section, new_index_fn):
    n = spec["nodes"].pop(idx(spec, section))
    spec["nodes"].insert(new_index_fn(spec), n)


def set_(spec, section, path, value, variant=None):
    d = N(spec, section, variant)
    for p in path[:-1]:
        d = d[p]
    d[path[-1]] = value


def drop(spec, section, path, variant=None):
    d = N(spec, section, variant)
    for p in path[:-1]:
        d = d[p]
    del d[path[-1]]


# --------------------------------------------------------------------------- spec mutations (code, mutate_fn)
def _dup_hero(s):
    s["nodes"].insert(3, copy.deepcopy(N(s, "hero.home")))


def _swap_footer_cta(s):
    a, b = idx(s, "conversion.be-like-this-guy"), idx(s, "shell.footer-sans")
    s["nodes"][a], s["nodes"][b] = s["nodes"][b], s["nodes"][a]


def _wrong_template(s):
    s["template"], s["route"] = "template.pricing", "/pricing"


def _dup_variant(s):
    s["nodes"].insert(idx(s, "features.feature-shell", "multiplayer") + 1, copy.deepcopy(N(s, "features.feature-shell", "multiplayer")))


def _fifth_shell(s):
    extra = copy.deepcopy(N(s, "features.feature-shell", "anywhere"))
    extra["variant"] = "byok"
    extra["motion"] = {"patterns": ["demo-loop-on-view"], "reducedMotionFallback": "final-state-no-motion"}
    s["nodes"].insert(idx(s, "features.feature-shell", "anywhere") + 1, extra)
    s["nodes"].insert(idx(s, "features.feature-shell", "anywhere") + 1, copy.deepcopy(N(s, "features.feature-shell", "cloud-sandbox")))


def _legal(s):
    s["template"], s["route"] = "template.legal", "/privacy"


def _form_on_home(s):
    n = copy.deepcopy(N(s, "shell.footer-sans"))
    n["section"], n["variant"], n["content"] = "conversion.enterprise-contact-form", "default", {}
    n["motion"] = {"patterns": ["none"], "reducedMotionFallback": "static-no-motion-needed"}
    s["nodes"].insert(idx(s, "shell.footer-sans"), n)


def _second_hero(s):
    n = copy.deepcopy(N(s, "hero.home"))
    n["section"], n["variant"] = "hero.pricing-title", "default"
    s["nodes"].insert(3, n)


def _after_footer(s):
    s["nodes"].insert(idx(s, "shell.footer-sans") + 1, copy.deepcopy(N(s, "content.changelog-preview")))


def _words(n):
    return " ".join(["word"] * n)


SPEC_MUTATIONS = [
    # ---- schema layer
    ("schema", "template not in closed enum", "SCHEMA", lambda s: s.__setitem__("template", "template.nope")),
    ("schema", "node missing motion", "SCHEMA", lambda s: N(s, "hero.home").pop("motion")),
    ("schema", "invented section alias hero.main", "SCHEMA", lambda s: N(s, "hero.home").__setitem__("section", "hero.main")),
    ("schema", "motion missing reducedMotionFallback", "SCHEMA", lambda s: N(s, "hero.home")["motion"].pop("reducedMotionFallback")),
    ("schema", "invented motion field inventedAnimation", "SCHEMA", lambda s: N(s, "hero.home")["motion"].__setitem__("inventedAnimation", "spin")),
    ("schema", "invented node property style", "SCHEMA", lambda s: N(s, "hero.home").__setitem__("style", {"color": "#ff0000"})),
    ("schema", "invented assetRole logo-hero", "SCHEMA", lambda s: set_(s, "hero.home", ["content", "wordmark", "assetRole"], "logo-hero")),
    ("schema", "extra content field on hero", "SCHEMA", lambda s: set_(s, "hero.home", ["content", "tagline"], "x")),
    ("schema", "unknown variant for feature shell", "SCHEMA", lambda s: N(s, "features.feature-shell", "multiplayer").__setitem__("variant", "nope")),
    ("schema", "hero fallback differs from const-locked value", "SCHEMA", lambda s: set_(s, "hero.home", ["motion", "reducedMotionFallback"], "static-no-motion-needed")),
    ("schema", "motion pattern outside closed enum (parallax)", "SCHEMA", lambda s: set_(s, "hero.home", ["motion", "patterns"], ["parallax"])),
    ("schema", "wrong pageSpecVersion", "SCHEMA", lambda s: s.__setitem__("pageSpecVersion", "9.9.9")),
    ("schema", "missing required content field", "SCHEMA", lambda s: drop(s, "hero.home", ["content", "headingLead"])),
    ("schema", "endpoint target is a raw live URL", "SCHEMA", lambda s: set_(s, "shell.download-dialog", ["content", "primaryAction", "endpoint", "target"], "https://cdn.example.invalid/app.dmg")),
    ("schema", "node type outside enum", "SCHEMA", lambda s: N(s, "hero.home").__setitem__("type", "widget")),
    ("schema", "top-level token-override smuggle", "SCHEMA", lambda s: s.__setitem__("tokens", {"color.foreground": "#ff0000"})),
    ("schema", "count suffix violates pattern", "SCHEMA", lambda s: set_(s, "proof.trusted-logo-strip", ["content", "count", "suffix"], "kkkkk")),
    ("schema", "media role not allowed for that field (customer-logo as wordmark)", "SCHEMA", lambda s: set_(s, "hero.home", ["content", "wordmark", "assetRole"], "customer-logo")),
    ("schema", "form-endpoint role in a download-endpoint-only field", "SCHEMA", lambda s: set_(s, "shell.download-dialog", ["content", "primaryAction", "endpoint", "assetRole"], "form-endpoint")),
    # ---- structural (template cross-reference + graph)
    ("structural", "duplicate one-per-page hero", "ONE_PER_PAGE", _dup_hero),
    ("structural", "removed mandatory footer", "TEMPLATE_MISSING", lambda s: s["nodes"].pop(idx(s, "shell.footer-sans"))),
    ("structural", "reordered footer and CTA", "TEMPLATE_ORDER", _swap_footer_cta),
    ("structural", "declared template pricing but home node list", "TEMPLATE_EXTRA", _wrong_template),
    ("structural", "route from another template", "ROUTE_MATCHES_TEMPLATE", lambda s: s.__setitem__("route", "/pricing")),
    ("structural", "route inside docs regex family on home template", "ROUTE_MATCHES_TEMPLATE", lambda s: s.__setitem__("route", "/docs/installation")),
    ("structural", "(section,variant) repeated: duplicate multiplayer shell", "MAX_PER_PAGE_UNIQUE_VARIANT", _dup_variant),
    ("structural", "more than maxPerPage (4) feature shells", "MAX_PER_PAGE_UNIQUE_VARIANT", _fifth_shell),
    ("structural", "header not first", "HEADER_FIRST", lambda s: move(s, "shell.header", lambda x: 5)),
    ("structural", "mobile menu detached from header", "MUST_FOLLOW", lambda s: move(s, "shell.mobile-menu", lambda x: 6)),
    ("structural", "home sections used under template.legal", "SECTION_ALLOWED_IN_TEMPLATE", _legal),
    ("structural", "hero after a content section (mustFollowNav)", "MUST_FOLLOW_NAV", lambda s: move(s, "hero.home", lambda x: idx(x, "proof.trusted-logo-strip") + 1)),
    ("structural", "CTA after the footer (mustPrecedeFooter)", "MUST_PRECEDE_FOOTER", lambda s: move(s, "conversion.be-like-this-guy", lambda x: idx(x, "shell.footer-sans") + 1)),
    ("structural", "enterprise form on the homepage (route restriction)", "SECTION_ALLOWED_IN_TEMPLATE", _form_on_home),
    ("structural", "two heroes (pricing title added to home)", "ONE_HERO", _second_hero),
    ("structural", "flow content after the footer", "FOOTER_LAST_IN_FLOW", _after_footer),
    # ---- runtime
    ("runtime", "maxWords overflow on hero heading", "MAXWORDS", lambda s: set_(s, "hero.home", ["content", "headingLead"], _words(30))),
    ("runtime", "maxWords overflow in a nested list field", "MAXWORDS", lambda s: set_(s, "proof.testimonials", ["content", "items", 0, "quote"], _words(60))),
    ("runtime", "customer-logo generated-new (valid enum, pinned role)", "ASSET_PIN", lambda s: set_(s, "proof.trusted-logo-strip", ["content", "logos", 0, "source"], "generated-new")),
    ("runtime", "person-avatar generated-new", "ASSET_PIN", lambda s: set_(s, "hero.home", ["content", "quote", "avatar", "source"], "generated-new")),
    ("runtime", "brand-mark open-license-reuse", "ASSET_PIN", lambda s: set_(s, "hero.home", ["content", "wordmark", "source"], "open-license-reuse")),
    ("runtime", "product-screenshot generated-new", "ASSET_PIN", lambda s: set_(s, "hero.home", ["content", "screenshot", "source"], "generated-new")),
    ("runtime", "motion pattern allowed globally but not for this variant", "MOTION", lambda s: set_(s, "features.feature-shell", ["motion", "patterns"], ["demo-loop-on-view"], variant="anywhere")),
    # ---- retrieval eligibility (closed boolean, const-locked per section, pinned independently in code)
    ("schema", "download dialog node claims retrievalEligible=true (contract and pin say false)", "SCHEMA", lambda s: N(s, "shell.download-dialog").__setitem__("retrievalEligible", True)),
    ("schema", "downloading screen node claims retrievalEligible=true", "SCHEMA", lambda s: N(s, "shell.downloading-screen").__setitem__("retrievalEligible", True)),
    ("schema", "hero node claims retrievalEligible=false (contract and pin say true)", "SCHEMA", lambda s: N(s, "hero.home").__setitem__("retrievalEligible", False)),
    ("schema", "retrievalEligible as a string instead of a boolean", "SCHEMA", lambda s: N(s, "hero.home").__setitem__("retrievalEligible", "true")),
    ("runtime", "semantic layer rejects a retrievalEligible that contradicts the code pin even beyond the schema", "RETRIEVAL_PIN", lambda s: N(s, "shell.download-dialog").__setitem__("retrievalEligible", True)),
    # ---- generation context `mode` on a reference page
    ("schema", "mode missing (required, no default)", "SCHEMA", lambda s: s.pop("mode")),
    ("schema", "mode outside the closed enum (production)", "SCHEMA", lambda s: s.__setitem__("mode", "production")),
    ("schema", "mode wrong case (Reference)", "SCHEMA", lambda s: s.__setitem__("mode", "Reference")),
    ("schema", "mode as null", "SCHEMA", lambda s: s.__setitem__("mode", None)),
    ("schema", "mode as a list", "SCHEMA", lambda s: s.__setitem__("mode", ["generated"])),
    ("schema", "pageSpecVersion still 1.0.0 (mode made 2.0.0 the version)", "SCHEMA", lambda s: s.__setitem__("pageSpecVersion", "1.0.0")),
    ("runtime", "reference page using a generation-safe-only role (brand-placeholder as the wordmark)", "ASSET_ROLE", lambda s: set_(s, "hero.home", ["content", "wordmark", "assetRole"], "brand-placeholder")),
    ("runtime", "reference page using a generation-safe endpoint role (endpoint-placeholder)", "ASSET_ROLE", lambda s: set_(s, "shell.download-dialog", ["content", "primaryAction", "endpoint", "assetRole"], "endpoint-placeholder")),
    ("runtime", "reference page: placeholder-only generation-safe role on an avatar", "ASSET_ROLE", lambda s: set_(s, "hero.home", ["content", "quote", "avatar", "assetRole"], "avatar-placeholder")),
]

# Decomposition: legal header/body and changelog entry header/body replaced the three whole-page sections.
# (base example, layer, name, expected code, mutate)
def _swap_nodes(a, b):
    def f(s):
        i, j = idx(s, a[0], a[1]), idx(s, b[0], b[1])
        s["nodes"][i], s["nodes"][j] = s["nodes"][j], s["nodes"][i]
    return f


def _dup_node(sec, var):
    return lambda s: s["nodes"].insert(idx(s, sec, var) + 1, copy.deepcopy(N(s, sec, var)))


def _rename(sec, var, new_sec, new_var=None):
    def f(s):
        n = N(s, sec, var)
        n["section"] = new_sec
        if new_var:
            n["variant"] = new_var
    return f


DECOMP_MUTATIONS = [
    ("legal", "structural", "legal body before legal header", "MUST_FOLLOW", _swap_nodes(("content.legal-header", "default"), ("content.legal-body", "default"))),
    ("legal", "structural", "legal header removed (body alone)", "TEMPLATE_MISSING", lambda s: s["nodes"].pop(idx(s, "content.legal-header"))),
    ("legal", "structural", "legal body removed (header alone)", "TEMPLATE_MISSING", lambda s: s["nodes"].pop(idx(s, "content.legal-body"))),
    ("legal", "structural", "second legal header (onePerPage)", "ONE_PER_PAGE", _dup_node("content.legal-header", "default")),
    ("legal", "schema", "retired whole-page id content.legal-prose is not a section", "SCHEMA", _rename("content.legal-header", "default", "content.legal-prose")),
    ("legal", "schema", "legal header uses the retired effectiveDate field name", "SCHEMA", lambda s: set_(s, "content.legal-header", ["content", "effectiveDate"], "x")),
    ("legal", "runtime", "legal header date line over its word budget", "MAXWORDS", lambda s: set_(s, "content.legal-header", ["content", "dateLine"], _words(12))),
    ("legal", "structural", "legal sections on the post template", "SECTION_ALLOWED_IN_TEMPLATE", lambda s: (s.__setitem__("template", "template.changelog-post"), s.__setitem__("route", "/changelog/0.91.0-a-mostly-boring-update"))),
    ("post", "schema", "retired whole-page id changelog.post-entry is not a section", "SCHEMA", _rename("changelog.entry-header", "post", "changelog.post-entry", "default")),
    ("post", "structural", "second entry header on a post (template node is non-repeatable)", "TEMPLATE_ORDER", _dup_node("changelog.entry-header", "post")),
    ("post", "structural", "post entry body removed", "TEMPLATE_MISSING", lambda s: s["nodes"].pop(idx(s, "changelog.entry-body"))),
    ("post", "structural", "index-variant header on a post template", "TEMPLATE_EXTRA", lambda s: N(s, "changelog.entry-header").__setitem__("variant", "index")),
    ("post", "structural", "post body ahead of its header", "MUST_FOLLOW", _swap_nodes(("changelog.entry-header", "post"), ("changelog.entry-body", "default"))),
    ("post", "runtime", "entry body paragraph over its word budget", "MAXWORDS", lambda s: set_(s, "changelog.entry-body", ["content", "blocks", 0, "text"], _words(120))),
    ("post", "runtime", "changelog screenshot generated-new (pinned role)", "ASSET_PIN", lambda s: set_(s, "changelog.entry-body", ["content", "blocks", 4, "media", "source"], "generated-new")),
    ("post", "runtime", "index-only hover-color on a post header (variantPatterns)", "MOTION", lambda s: set_(s, "changelog.entry-header", ["motion", "patterns"], ["hover-color"], variant="post")),
    ("index", "structural", "pagination ahead of the last entry body", "MUST_FOLLOW", _swap_nodes(("changelog.pagination", "default"), ("changelog.entry-body", "default"))),
    ("index", "structural", "index entry body before its header", "MUST_FOLLOW", lambda s: s["nodes"].insert(idx(s, "changelog.entry-header") , s["nodes"].pop(idx(s, "changelog.entry-body")))),
    ("index", "structural", "post-variant header on the index template", "TEMPLATE_EXTRA", lambda s: N(s, "changelog.entry-header").__setitem__("variant", "post")),
    ("index", "structural", "pagination removed", "TEMPLATE_MISSING", lambda s: s["nodes"].pop(idx(s, "changelog.pagination"))),
]

# Contract-level: take a REAL contract, break one thing, require validate_contract to reject it with the code.
def _c(section):
    return copy.deepcopy(load(f"sections/{section}.json"))


def _cm(section, fn):
    d = _c(section)
    fn(d)
    return d


CONTRACT_MUTATIONS = [
    ("provenance leaks into taxonomy: sourceId inside semantic", "CONTRACT_SCHEMA", lambda: _cm("hero.home", lambda d: d["semantic"].__setitem__("sourceId", "src/components/Hero.jsx"))),
    ("taxonomy leaks into provenance: category inside source", "CONTRACT_SCHEMA", lambda: _cm("hero.home", lambda d: d["source"].__setitem__("category", "HERO"))),
    ("taxonomy leaks into provenance: semanticId inside source", "CONTRACT_SCHEMA", lambda: _cm("hero.home", lambda d: d["source"].__setitem__("semanticId", "hero.home"))),
    ("source block missing", "CONTRACT_SCHEMA", lambda: _cm("hero.home", lambda d: d.pop("source"))),
    ("semantic block missing", "CONTRACT_SCHEMA", lambda: _cm("hero.home", lambda d: d.pop("semantic"))),
    ("legacy top-level category re-added beside semantic", "CONTRACT_SCHEMA", lambda: _cm("hero.home", lambda d: d.__setitem__("category", "HERO"))),
    ("category outside the closed set", "CONTRACT_SCHEMA", lambda: _cm("hero.home", lambda d: d["semantic"].__setitem__("category", "LEGAL"))),
    ("sourceId is not a path (a taxonomy-style id)", "CONTRACT_SCHEMA", lambda: _cm("hero.home", lambda d: d["source"].__setitem__("sourceId", "hero.home"))),
    ("sourceId names a file that is not cited in implementedBy", "SOURCE_ID", lambda: _cm("hero.home", lambda d: d["source"].__setitem__("sourceId", "src/components/Footer.jsx"))),
    ("semanticId differs from the contract id", "SEMANTIC_ID", lambda: _cm("hero.home", lambda d: d["semantic"].__setitem__("semanticId", "hero.main"))),
    ("semantic.iaSections differs from the variants' iaSections", "SEMANTIC_IA", lambda: _cm("hero.home", lambda d: d["semantic"].__setitem__("iaSections", ["hero.other"]))),
    ("citation without a quote", "CONTRACT_SCHEMA", lambda: _cm("hero.home", lambda d: d["source"]["implementedBy"][0].pop("quote"))),
    ("retrievalEligible missing", "CONTRACT_SCHEMA", lambda: _cm("shell.download-dialog", lambda d: d.pop("retrievalEligible"))),
    ("retrievalEligible is a string", "CONTRACT_SCHEMA", lambda: _cm("shell.download-dialog", lambda d: d.__setitem__("retrievalEligible", "false"))),
    ("download dialog flipped to retrievalEligible=true (pinned false)", "RETRIEVAL_PIN", lambda: _cm("shell.download-dialog", lambda d: d.__setitem__("retrievalEligible", True))),
    ("downloading screen flipped to retrievalEligible=true (pinned false)", "RETRIEVAL_PIN", lambda: _cm("shell.downloading-screen", lambda d: d.__setitem__("retrievalEligible", True))),
    ("docs search dialog flipped to retrievalEligible=true (pinned false)", "RETRIEVAL_PIN", lambda: _cm("docs.search-dialog", lambda d: d.__setitem__("retrievalEligible", True))),
    ("a design composition (hero.home) flipped to retrievalEligible=false", "RETRIEVAL_PIN", lambda: _cm("hero.home", lambda d: d.__setitem__("retrievalEligible", False))),
    ("a new overlay-slot section not in the pinned ineligible set", "RETRIEVAL_PIN", lambda: _cm("hero.home", lambda d: d.__setitem__("slot", "overlay"))),
]


# --------------------------------------------------------------------------- generated mode
# (base generated example, layer, name, expected code, mutate). All start from a generation-safe example that has 0 errors.
def _zw(txt):
    return txt[:3] + "​" + txt[3:]


def G(base, section, path, value, variant=None):
    return lambda s: set_(s, section, path, value, variant)


H = "hero.home"
GEN_MUTATIONS = [
    # ---- source brand name (every spelling found in src/)
    ("home", "brand", "hero heading names Conductor", "GENERATED_MODE_SOURCE_BRAND", G("home", H, ["content", "headingLead"], "Meet Conductor")),
    ("home", "brand", "lowercase 'conductor' inside a feature body", "GENERATED_MODE_SOURCE_BRAND", G("home", "features.feature-shell", ["content", "body"], "The conductor of your day.", "multiplayer")),
    ("home", "brand", "UPPERCASE CONDUCTOR in a feature title", "GENERATED_MODE_SOURCE_BRAND", G("home", "features.feature-shell", ["content", "title"], "CONDUCTOR CLOUD", "byok")),
    ("home", "brand", "domain conductor.build written in body text", "GENERATED_MODE_SOURCE_BRAND", G("home", "features.feature-shell", ["content", "body"], "Read more at conductor.build today.", "byok")),
    ("home", "brand", "social handle @conductor_build in body text", "GENERATED_MODE_SOURCE_BRAND", G("home", "features.feature-shell", ["content", "body"], "Follow @conductor_build for news.", "anywhere")),
    ("home", "brand", "company name Melty Labs in a testimonial subtitle", "GENERATED_MODE_SOURCE_BRAND", G("home", "proof.testimonials", ["content", "items", 0, "subtitle"], "Founder, Melty Labs")),
    ("home", "brand", "brand with a zero-width character inside (Con​ductor)", "GENERATED_MODE_SOURCE_BRAND", G("home", H, ["content", "headingLead"], _zw("Conductor"))),
    ("home", "brand", "brand in the footer copyright", "GENERATED_MODE_SOURCE_BRAND", G("home", "shell.footer-sans", ["content", "copyright"], "(c) Conductor")),
    ("home", "brand", "GitHub org meltylabs in a footer link href", "GENERATED_MODE_SOURCE_BRAND", G("home", "shell.footer-sans", ["content", "columns", 3, "links", 0, "href"], "https://github.com/meltylabs")),
    ("legal", "brand", "legal entity 'Melty, Inc.' in a legal paragraph", "GENERATED_MODE_SOURCE_BRAND", G("legal", "content.legal-body", ["content", "sections", 0, "paragraphs", 0], "This notice explains how Melty, Inc. handles data.")),
    ("docs", "brand", "environment variable CONDUCTOR_PORT in docs prose", "GENERATED_MODE_SOURCE_BRAND", G("docs", "docs.prose-body", ["content", "blocks", 0, "text"], "Use CONDUCTOR_PORT to pick a port.")),
    ("docs", "brand", "brand in image alt text", "GENERATED_MODE_SOURCE_BRAND", G("docs", "docs.prose-body", ["content", "blocks", 3, "media", "alt"], "Conductor board screenshot")),
    ("docs", "brand", "brand in the docs route (/docs/conductor-json)", "GENERATED_MODE_SOURCE_BRAND", lambda s: s.__setitem__("route", "/docs/conductor-json")),
    ("post", "brand", "brand in the changelog route slug", "GENERATED_MODE_SOURCE_BRAND", lambda s: s.__setitem__("route", "/changelog/0.90.0-conductor-for-ios")),
    ("docs", "brand", "brand in a breadcrumb item", "GENERATED_MODE_SOURCE_BRAND", G("docs", "docs.breadcrumb", ["content", "items", 0], "Conductor Docs")),
    # ---- source CTA text
    ("home", "cta", "hero CTA 'Get Conductor'", "GENERATED_MODE_SOURCE_CTA", G("home", H, ["content", "primaryCta", "label"], "Get Conductor")),
    ("home", "cta", "closing CTA 'Try Conductor.'", "GENERATED_MODE_SOURCE_CTA", G("home", "conversion.be-like-this-guy", ["content", "headingLines", 0], "Try Conductor.")),
    ("home", "cta", "dialog title 'Download Conductor'", "GENERATED_MODE_SOURCE_CTA", G("home", "shell.download-dialog", ["content", "title"], "Download Conductor")),
    ("home", "cta", "nav label 'Join Conductor'", "GENERATED_MODE_SOURCE_CTA", G("home", "shell.header", ["content", "navLinks", 4, "label"], "Join Conductor")),
    ("home", "cta", "primary download label 'Download for Mac'", "GENERATED_MODE_SOURCE_CTA", G("home", "shell.download-dialog", ["content", "primaryAction", "label"], "Download for Mac")),
    ("home", "cta", "fallback link 'Download for Intel-based Macs'", "GENERATED_MODE_SOURCE_CTA", G("home", "shell.download-dialog", ["content", "fallbackAction", "label"], "Download for Intel-based Macs")),
    ("home", "cta", "waitlist button 'Join Windows/Linux waitlist'", "GENERATED_MODE_SOURCE_CTA", G("home", "shell.download-dialog", ["content", "waitlistAction", "label"], "Join Windows/Linux waitlist")),
    ("home", "cta", "CTA with odd case and extra whitespace (GET   CONDUCTOR)", "GENERATED_MODE_SOURCE_CTA", G("home", H, ["content", "primaryCta", "label"], "GET   CONDUCTOR")),
    ("home", "cta", "CTA with a newline between the words (Try\\nConductor)", "GENERATED_MODE_SOURCE_CTA", G("home", "conversion.be-like-this-guy", ["content", "buttonLabel"], "Try\nConductor")),
    # ---- source marketing / testimonial / changelog / docs / legal copy
    ("home", "copy", "hero heading copied verbatim", "GENERATED_MODE_SOURCE_COPY", G("home", H, ["content", "headingLead"], "Run a team of coding agents")),
    ("home", "copy", "hero heading copied with other case and spacing", "GENERATED_MODE_SOURCE_COPY", G("home", H, ["content", "headingLead"], "RUN  A TEAM OF   coding agents")),
    ("home", "copy", "hero customer quote copied verbatim", "GENERATED_MODE_SOURCE_COPY", G("home", H, ["content", "quote", "text"], "feels like going from typing with two fingers to having eight arms")),
    ("home", "copy", "closing heading 'Be like this guy.'", "GENERATED_MODE_SOURCE_COPY", G("home", "conversion.be-like-this-guy", ["content", "headingLines", 0], "Be like this guy.")),
    ("home", "copy", "feature title 'A cloud sandbox for every agent.'", "GENERATED_MODE_SOURCE_COPY", G("home", "features.feature-shell", ["content", "title"], "A cloud sandbox for every agent.", "cloud-sandbox")),
    ("home", "copy", "feature title 'Conduct from anywhere.'", "GENERATED_MODE_SOURCE_COPY", G("home", "features.feature-shell", ["content", "title"], "Conduct from anywhere.", "anywhere")),
    ("home", "copy", "real testimonial quote reused", "GENERATED_MODE_SOURCE_COPY", G("home", "proof.testimonials", ["content", "items", 0, "quote"], "Is arguably as big of a productivity boost as Anthropic is.")),
    ("home", "copy", "real testimonial quote with a curly apostrophe", "GENERATED_MODE_SOURCE_COPY", G("home", "proof.testimonials", ["content", "items", 0, "quote"], "so much more productive and I don’t have to keep my Macbook")),
    ("home", "copy", "real person quoted as testimonial author", "GENERATED_MODE_SOURCE_COPY", G("home", "proof.testimonials", ["content", "items", 0, "name"], "Garry Tan")),
    ("home", "copy", "real team member name as a testimonial author", "GENERATED_MODE_SOURCE_COPY", G("home", "proof.testimonials", ["content", "items", 1, "name"], "Charlie Holtz")),
    ("home", "copy", "real third-party quote on the changelog preview", "GENERATED_MODE_SOURCE_COPY", G("home", "content.changelog-preview", ["content", "quote", "text"], "The speed and fury with which the team ships is magnificent")),
    ("home", "copy", "real changelog release title on the preview", "GENERATED_MODE_SOURCE_COPY", G("home", "content.changelog-preview", ["content", "cards", 0, "title"], "A (mostly) boring update")),
    ("home", "copy", "copy embedded inside a longer sentence", "GENERATED_MODE_SOURCE_COPY", G("home", "features.feature-shell", ["content", "body"], "Our promise: sandboxes spin up in seconds, every time.", "cloud-sandbox")),
    ("post", "copy", "real changelog summary sentence", "GENERATED_MODE_SOURCE_COPY", G("post", "changelog.entry-body", ["content", "blocks", 0, "text"], "You can now right click to copy a link to a workspace or chat.")),
    ("post", "copy", "real changelog release title as an entry title", "GENERATED_MODE_SOURCE_COPY", G("post", "changelog.entry-header", ["content", "title"], "A (mostly) boring update", "post")),
    ("docs", "copy", "real docs description sentence", "GENERATED_MODE_SOURCE_COPY", G("docs", "docs.prose-body", ["content", "blocks", 0, "text"], "Import a repository, configure it, and start agent work in a workspace.")),
    ("legal", "copy", "real privacy-notice sentence", "GENERATED_MODE_SOURCE_COPY", G("legal", "content.legal-body", ["content", "sections", 0, "paragraphs", 0], "We act as a processor on behalf of our customers for all data processed here.")),
    ("legal", "copy", "real Join Us prose in a legal paragraph", "GENERATED_MODE_SOURCE_COPY", G("legal", "content.legal-body", ["content", "sections", 0, "paragraphs", 1], "Conductor feels like an elite sports team.")),
    # ---- source URLs and endpoints
    ("home", "url", "link to conductor.build", "GENERATED_MODE_SOURCE_URL", G("home", "shell.header", ["content", "navLinks", 1, "href"], "https://conductor.build/docs")),
    ("home", "url", "link to app.conductor.build", "GENERATED_MODE_SOURCE_URL", G("home", H, ["content", "primaryCta", "href"], "https://app.conductor.build/pro")),
    ("home", "url", "vendor download CDN link (crabnebula)", "GENERATED_MODE_SOURCE_URL", G("home", "shell.footer-sans", ["content", "complianceLink", "href"], "https://cdn.crabnebula.app/download/melty/conductor/latest/platform/dmg-aarch64")),
    ("home", "url", "HubSpot embed script and portal id", "GENERATED_MODE_SOURCE_URL", G("home", "shell.footer-sans", ["content", "complianceLink", "href"], "https://js-na2.hsforms.net/forms/embed/246368856.js")),
    ("home", "url", "the live Google Form for the waitlist", "GENERATED_MODE_SOURCE_URL", G("home", "shell.footer-sans", ["content", "complianceLink", "href"], "https://docs.google.com/forms/d/1jPQsC8oLNIyjHW3WOsUxK2XNm0Z-BAzdooZuMs9cbFM/edit")),
    ("home", "url", "Discord invite of the source", "GENERATED_MODE_SOURCE_URL", G("home", "shell.footer-sans", ["content", "columns", 3, "links", 1, "href"], "https://discord.gg/RSrYmstWzy")),
    ("home", "url", "X account of the source", "GENERATED_MODE_SOURCE_URL", G("home", "shell.footer-sans", ["content", "columns", 3, "links", 0, "href"], "https://x.com/conductor_build")),
    ("home", "url", "real person's post URL on a testimonial", "GENERATED_MODE_SOURCE_URL", G("home", "proof.testimonials", ["content", "items", 0, "href"], "https://x.com/garrytan/status/2092062231488061584")),
    ("home", "url", "mailto address of the source (humans@conductor.build)", "GENERATED_MODE_SOURCE_URL", G("home", "shell.footer-sans", ["content", "complianceLink", "href"], "mailto:humans@conductor.build")),
    ("home", "url", "source media bucket (tigrisfiles) link", "GENERATED_MODE_SOURCE_URL", G("home", "shell.footer-sans", ["content", "complianceLink", "href"], "https://conductor-marketing.t3.tigrisfiles.io/uploads/a.png")),
    ("home", "url", "source GitHub upload link", "GENERATED_MODE_SOURCE_URL", G("home", "shell.footer-sans", ["content", "complianceLink", "href"], "https://github.com/user-attachments/assets/632ab731-231f-42f0-b0a2-1")),
    ("home", "url", "URL written inside a text field", "GENERATED_MODE_SOURCE_URL", G("home", "features.feature-shell", ["content", "body"], "See https://api.conductor.build/v0 for details.", "byok")),
    ("home", "url", "absolute URL on a real non-reserved host (acme.com)", "GENERATED_MODE_URL_HOST", G("home", H, ["content", "primaryCta", "href"], "https://acme.com/start")),
    ("home", "url", "absolute URL on example.com lookalike (example.com.evil.net)", "GENERATED_MODE_URL_HOST", G("home", H, ["content", "primaryCta", "href"], "https://example.com.evil.net/start")),
    ("home", "url", "mailto on a non-reserved host", "GENERATED_MODE_URL_HOST", G("home", "shell.footer-sans", ["content", "complianceLink", "href"], "mailto:hello@acme.com")),
    # ---- protected assets: files and roles
    ("home", "asset", "source hero image path as a link (/assets/img/...)", "GENERATED_MODE_PROTECTED_ASSET", G("home", H, ["content", "primaryCta", "href"], "/assets/img/homepage-hero-background.webp")),
    ("home", "asset", "source demo video path as a link", "GENERATED_MODE_PROTECTED_ASSET", G("home", "shell.footer-sans", ["content", "complianceLink", "href"], "/assets/video/cmdn.mp4")),
    ("home", "asset", "source brand-kit archive named in a link", "GENERATED_MODE_PROTECTED_ASSET", G("home", "shell.footer-sans", ["content", "complianceLink", "href"], "/press/conductor-brandkit.zip")),
    ("home", "asset", "source file name in alt text (homepage-hero-background)", "GENERATED_MODE_PROTECTED_ASSET", G("home", H, ["content", "screenshot", "alt"], "homepage-hero-background")),
    ("home", "role", "brand-mark (the source's logo) as the wordmark", "GENERATED_MODE_REFERENCE_ASSET", G("home", H, ["content", "wordmark", "assetRole"], "brand-mark")),
    ("home", "role", "brand-mark on the downloading screen", "GENERATED_MODE_REFERENCE_ASSET", G("home", "shell.downloading-screen", ["content", "brandMark", "assetRole"], "brand-mark")),
    ("home", "role", "customer-logo (real third-party marks) in the logo strip", "GENERATED_MODE_REFERENCE_ASSET", G("home", "proof.trusted-logo-strip", ["content", "logos", 0, "assetRole"], "customer-logo")),
    ("home", "role", "person-avatar (real people) on the hero quote", "GENERATED_MODE_REFERENCE_ASSET", G("home", H, ["content", "quote", "avatar", "assetRole"], "person-avatar")),
    ("home", "role", "person-avatar on a testimonial", "GENERATED_MODE_REFERENCE_ASSET", G("home", "proof.testimonials", ["content", "items", 0, "avatar", "assetRole"], "person-avatar")),
    ("home", "role", "product-screenshot (source UI) in the hero", "GENERATED_MODE_REFERENCE_ASSET", G("home", H, ["content", "screenshot", "assetRole"], "product-screenshot")),
    ("home", "role", "demo-video (source footage) in a feature demo", "GENERATED_MODE_REFERENCE_ASSET", lambda s: (set_(s, "features.feature-shell", ["content", "demo", "kind"], "static-image", "anywhere"), set_(s, "features.feature-shell", ["content", "demo", "media", "assetRole"], "demo-video", "anywhere"))),
    ("home", "role", "decorative-background (source artwork) in the hero", "GENERATED_MODE_REFERENCE_ASSET", G("home", H, ["content", "background", "assetRole"], "decorative-background")),
    ("home", "role", "decorative-background in the closing CTA", "GENERATED_MODE_REFERENCE_ASSET", G("home", "conversion.be-like-this-guy", ["content", "background", "assetRole"], "decorative-background")),
    ("home", "role", "form-endpoint (the live waitlist form) in the dialog", "GENERATED_MODE_REFERENCE_ASSET", G("home", "shell.download-dialog", ["content", "waitlistAction", "endpoint", "assetRole"], "form-endpoint")),
    ("home", "role", "download-endpoint (the vendor CDN) in the dialog", "GENERATED_MODE_REFERENCE_ASSET", G("home", "shell.download-dialog", ["content", "primaryAction", "endpoint", "assetRole"], "download-endpoint")),
    ("docs", "role", "product-screenshot in a docs image block", "GENERATED_MODE_REFERENCE_ASSET", G("docs", "docs.prose-body", ["content", "blocks", 3, "media", "assetRole"], "product-screenshot")),
    ("post", "role", "product-screenshot in a changelog image block", "GENERATED_MODE_REFERENCE_ASSET", G("post", "changelog.entry-body", ["content", "blocks", 4, "media", "assetRole"], "product-screenshot")),
    ("post", "role", "brand-mark on the changelog post's downloading screen", "GENERATED_MODE_REFERENCE_ASSET", G("post", "shell.downloading-screen", ["content", "brandMark", "assetRole"], "brand-mark")),
    ("home", "role", "a generation-safe role from another field (customer-logo-placeholder as the wordmark)", "SCHEMA", G("home", H, ["content", "wordmark", "assetRole"], "customer-logo-placeholder")),
    ("home", "role", "invented role on a generated page (logo-hero)", "SCHEMA", G("home", H, ["content", "wordmark", "assetRole"], "logo-hero")),
    ("home", "role", "placeholder-only role generated-new (avatar-placeholder)", "ASSET_PIN", G("home", H, ["content", "quote", "avatar", "source"], "generated-new")),
    ("home", "role", "customer-logo-placeholder with open-license-reuse", "ASSET_PIN", G("home", "proof.trusted-logo-strip", ["content", "logos", 0, "source"], "open-license-reuse")),
    ("home", "role", "endpoint-placeholder pointing at a raw URL", "SCHEMA", G("home", "shell.download-dialog", ["content", "primaryAction", "endpoint", "target"], "https://downloads.fernlake.example/app.dmg")),
    # ---- mode field on a generated page
    ("home", "mode", "mode missing from a generated example", "SCHEMA", lambda s: s.pop("mode")),
    ("home", "mode", "mode wrong case (Generated)", "SCHEMA", lambda s: s.__setitem__("mode", "Generated")),
    ("home", "mode", "mode 'gen' (outside the closed enum)", "SCHEMA", lambda s: s.__setitem__("mode", "gen")),
    ("home", "mode", "generated example flipped to reference (generation-safe roles are not reference roles)", "ASSET_ROLE", lambda s: s.__setitem__("mode", "reference")),
    ("docs", "mode", "generated docs example flipped to reference", "ASSET_ROLE", lambda s: s.__setitem__("mode", "reference")),
    ("home", "mode", "generated example with pageSpecVersion 1.0.0", "SCHEMA", lambda s: s.__setitem__("pageSpecVersion", "1.0.0")),
    # ---- the other validation layers still run in generated mode
    ("home", "layers", "generated page with two heroes", "ONE_PER_PAGE", lambda s: s["nodes"].insert(3, copy.deepcopy(N(s, H)))),
    ("home", "layers", "generated page with a hero heading over its word budget", "MAXWORDS", G("home", H, ["content", "headingLead"], _words(30))),
    ("home", "layers", "generated page missing its footer", "TEMPLATE_MISSING", lambda s: s["nodes"].pop(idx(s, "shell.footer-sans"))),
    ("legal", "layers", "generated legal page on a route from another template", "ROUTE_MATCHES_TEMPLATE", lambda s: s.__setitem__("route", "/pricing")),
]

# Reference examples flipped to `generated`: each carries the source's roles and/or copy, so each must be rejected.
FLIP_MUTATIONS = [
    ("home", "reference home example flipped to generated", "GENERATED_MODE_SOURCE_BRAND"),
    ("home", "reference home example flipped to generated (source CTA text)", "GENERATED_MODE_SOURCE_CTA"),
    ("home", "reference home example flipped to generated (source copy)", "GENERATED_MODE_SOURCE_COPY"),
    ("home", "reference home example flipped to generated (source asset roles)", "GENERATED_MODE_REFERENCE_ASSET"),
    ("legal", "reference legal example flipped to generated", "GENERATED_MODE_REFERENCE_ASSET"),
    ("post", "reference changelog-post example flipped to generated", "GENERATED_MODE_REFERENCE_ASSET"),
    ("index", "reference changelog-index example flipped to generated", "GENERATED_MODE_SOURCE_BRAND"),
]


def _reg(root, fn):
    _edit(root, "assets/asset-roles.json", fn)


def _brand_mark_safe(root, spec):
    _reg(root, lambda d: d["roles"]["brand-mark"].__setitem__("availability", "generation-safe"))
    set_(spec, H, ["content", "wordmark", "assetRole"], "brand-mark")


def _avail_flip(role, field_path, section):
    def f(root, spec):
        _reg(root, lambda d: d["roles"][role].__setitem__("availability", "generation-safe"))
        set_(spec, section, field_path, role)
    return f


def _cat_empty(cat):
    def f(root, spec):
        _reg(root, lambda d: d["sourceBrand"]["patterns"][cat].__setitem__("patterns", []))
    return f


def _no_sourcebrand(root, spec):
    _reg(root, lambda d: d.pop("sourceBrand"))


def _contract_drop_gen_roles(root, spec):
    def f(d):
        d["content"]["wordmark"].pop("generatedRoles")
    _edit(root, "sections/hero.home.json", f)


GEN_REPO_MUTATIONS = [
    ("repo", "registry flips brand-mark to generation-safe (pinned in code: drift reported, role still blocked)", "ASSET_AVAILABILITY_DRIFT", _brand_mark_safe, "error"),
    ("repo", "registry flips brand-mark to generation-safe: the role stays rejected in generated mode", "GENERATED_MODE_REFERENCE_ASSET", _brand_mark_safe, "error"),
    ("repo", "registry flips customer-logo to generation-safe", "ASSET_AVAILABILITY_DRIFT", _avail_flip("customer-logo", ["content", "logos", 0, "assetRole"], "proof.trusted-logo-strip"), "error"),
    ("repo", "registry flips product-screenshot to generation-safe", "ASSET_AVAILABILITY_DRIFT", _avail_flip("product-screenshot", ["content", "screenshot", "assetRole"], H), "error"),
    ("repo", "registry flips form-endpoint to generation-safe", "ASSET_AVAILABILITY_DRIFT", _avail_flip("form-endpoint", ["content", "waitlistAction", "endpoint", "assetRole"], "shell.download-dialog"), "error"),
    ("repo", "sourceBrand.patterns.brand emptied: validator fails closed", "GENERATED_MODE_PATTERNS_MISSING", _cat_empty("brand"), "error"),
    ("repo", "sourceBrand.patterns.cta emptied: validator fails closed", "GENERATED_MODE_PATTERNS_MISSING", _cat_empty("cta"), "error"),
    ("repo", "sourceBrand.patterns.copy emptied: validator fails closed", "GENERATED_MODE_PATTERNS_MISSING", _cat_empty("copy"), "error"),
    ("repo", "sourceBrand.patterns.url emptied: validator fails closed", "GENERATED_MODE_PATTERNS_MISSING", _cat_empty("url"), "error"),
    ("repo", "sourceBrand removed from the registry: validator fails closed", "GENERATED_MODE_PATTERNS_MISSING", _no_sourcebrand, "error"),
    ("repo", "generatedRoles removed from the wordmark field of the contract", "GENERATED_MODE_ROLE", _contract_drop_gen_roles, "error"),
]

# --------------------------------------------------------------------------- warn-severity (must be a WARNING, never an error)
WARN_MUTATIONS = [
    ("warn", "hero removed -> REQUIRES_HERO is warn-severity", "REQUIRES_HERO", lambda s: s["nodes"].pop(idx(s, "hero.home"))),
    ("warn", "two PROOF sections adjacent -> NO_ADJACENT_SAME_CATEGORY is warn-severity", "NO_ADJACENT_SAME_CATEGORY", lambda s: move(s, "proof.testimonials", lambda x: idx(x, "proof.trusted-logo-strip") + 1)),
]


# --------------------------------------------------------------------------- repo-level (scratch copy edited)
def _edit(root, rel, fn):
    p = os.path.join(root, rel)
    d = json.load(open(p, encoding="utf-8"))
    fn(d)
    json.dump(d, open(p, "w", encoding="utf-8"), indent=2)


def _pin(role, value):
    return lambda root, spec: _edit(root, "assets/asset-roles.json", lambda d: d["roles"][role].__setitem__("generationPolicy", value))


def _widen(root, spec):
    _edit(root, "assets/asset-roles.json", lambda d: d["policies"]["must-not-reproduce"]["allowedSources"].append("generated-new"))
    set_(spec, "proof.trusted-logo-strip", ["content", "logos", 0, "source"], "generated-new")


def _drop_template_node(root, spec):
    _edit(root, "templates/templates.json", lambda d: d["templates"]["template.home"].__setitem__(
        "nodes", [n for n in d["templates"]["template.home"]["nodes"] if n["section"] != "shell.mobile-menu"]))


def _tighten_budget(root, spec):
    def f(d):
        for r in d["rules"]:
            if r["id"] == "MOTION_BUDGET":
                r["params"]["max"] = 3
    _edit(root, "compatibility/graph.json", f)


REPO_MUTATIONS = [
    ("repo", "PIN FLIP: form-endpoint -> may-generate-new (different but valid policy)", "ASSET_PIN_DRIFT", _pin("form-endpoint", "may-generate-new"), "error"),
    ("repo", "PIN FLIP: download-endpoint -> placeholder-only (different but valid policy)", "ASSET_PIN_DRIFT", _pin("download-endpoint", "placeholder-only"), "error"),
    ("repo", "PIN FLIP: customer-logo -> may-generate-new", "ASSET_PIN_DRIFT", _pin("customer-logo", "may-generate-new"), "error"),
    ("repo", "PIN FLIP: person-avatar -> may-reuse-open-license", "ASSET_PIN_DRIFT", _pin("person-avatar", "may-reuse-open-license"), "error"),
    ("repo", "policy allowedSources widened in JSON cannot relax a pinned role", "ASSET_PIN", _widen, "error"),
    ("repo", "template node list edited: validator cross-references the REAL template", "TEMPLATE_EXTRA", _drop_template_node, "error"),
    ("repo", "graph param tightened -> MOTION_BUDGET reported as warn only", "MOTION_BUDGET", _tighten_budget, "warn"),
]


# --------------------------------------------------------------------------- generic per-template controls
PATTERN_CANDIDATES = ["0.0.1", "k+", "a.svg", "a"]


def minimal(f, roles_doc, mode="reference"):
    t = f["type"]
    if t == "text":
        return "word"
    if t == "url":
        return "/"
    if t == "pattern":
        for c in PATTERN_CANDIDATES:
            if re.match(f["pattern"], c):
                return c
        raise ValueError(f["pattern"])
    if t == "integer":
        return f["minimum"]
    if t == "boolean":
        return True
    if t == "enum":
        return f["values"][0]
    if t == "media":
        return {"assetRole": (f["generatedRoles"][0] if mode == "generated" else sorted(f["roles"])[0]), "source": "placeholder"}
    if t == "endpoint":
        return {"assetRole": (f["generatedRoles"][0] if mode == "generated" else sorted(f["roles"])[0]), "target": "local-only-no-submit"}
    if t == "list":
        return [minimal(f["items"], roles_doc, mode) for _ in range(f["minItems"])]
    if t == "object":
        return {k: minimal(v, roles_doc, mode) for k, v in f["fields"].items() if v.get("required", True)}
    raise ValueError(t)


def control_for(tid, root=ROOT, mode="reference"):
    t = load("templates/templates.json", root)["templates"][tid]
    roles_doc = load("assets/asset-roles.json", root)
    nodes = []
    for tn in t["nodes"]:
        s = load(f"sections/{tn['section']}.json", root)
        m = s["motion"]
        nodes.append({"type": "section", "section": tn["section"], "variant": tn["variant"],
                      "content": {k: minimal(v, roles_doc, mode) for k, v in s["content"].items() if v.get("required", True)},
                      "motion": {"patterns": m.get("variantPatterns", {}).get(tn["variant"], m["defaultPatterns"]), "reducedMotionFallback": m["reducedMotionFallback"]}})
    r = t["routes"]
    route = r["exact"][0] if "exact" in r else r["sample"][0]
    return {"pageSpecVersion": "2.0.0", "mode": mode, "template": tid, "route": route, "nodes": nodes}


def case_counts():
    n_t = len(load("templates/templates.json")["templates"])
    return {"mutations": len(SPEC_MUTATIONS) + len(DECOMP_MUTATIONS) + len(CONTRACT_MUTATIONS) + len(WARN_MUTATIONS) + len(REPO_MUTATIONS)
            + len(GEN_MUTATIONS) + len(FLIP_MUTATIONS) + len(GEN_REPO_MUTATIONS),
            "controls": len(BASES) + len(GEN_BASES) + 2 * n_t}


def _has(items, code):
    return any(i.startswith(code) for i in items)


def run():
    bad, rejected = [], 0
    e0, w0 = sv.validate(copy.deepcopy(EXAMPLE))
    print(f"baseline example: {len(e0)} errors, {len(w0)} warnings")
    if e0:
        bad.append("example baseline has errors")
    print("\n-- MUTATIONS (each must be rejected with the expected code)")
    for layer, name, code, fn in SPEC_MUTATIONS:
        s = copy.deepcopy(EXAMPLE)
        fn(s)
        errs, _ = sv.validate(s)
        ok = _has(errs, code)
        rejected += ok
        print(f"  [{'REJECTED' if ok else 'MISSED  '}] {layer:10s} {name}  (expect {code}; got {sorted({e.split()[0] for e in errs})})")
        if not ok:
            bad.append(name)
    for base, layer, name, code, fn in DECOMP_MUTATIONS:
        s = copy.deepcopy(BASES[base])
        fn(s)
        errs, _ = sv.validate(s)
        ok = _has(errs, code)
        rejected += ok
        print(f"  [{'REJECTED' if ok else 'MISSED  '}] {layer:10s} [{base}] {name}  (expect {code}; got {sorted({e.split()[0] for e in errs})})")
        if not ok:
            bad.append(name)
    for name, code, make in CONTRACT_MUTATIONS:
        errs = sv.validate_contract(make())
        ok = _has(errs, code)
        rejected += ok
        print(f"  [{'REJECTED' if ok else 'MISSED  '}] contract   {name}  (expect {code}; got {sorted({e.split()[0] for e in errs})})")
        if not ok:
            bad.append(name)
    for layer, name, code, fn in WARN_MUTATIONS:
        s = copy.deepcopy(EXAMPLE)
        fn(s)
        errs, warns = sv.validate(s)
        ok = _has(warns, code) and not _has(errs, code)
        rejected += ok
        print(f"  [{'WARNED  ' if ok else 'MISSED  '}] {layer:10s} {name}  (expect warning {code}, not error)")
        if not ok:
            bad.append(name)
    for layer, name, code, fn, sev in REPO_MUTATIONS:
        tmp = tempfile.mkdtemp(prefix="adv-")
        try:
            scratch = os.path.join(tmp, "design-repo")
            shutil.copytree(ROOT, scratch, ignore=shutil.ignore_patterns("__pycache__", ".DS_Store"))
            s = copy.deepcopy(EXAMPLE)
            fn(scratch, s)
            sv.reset()
            errs, warns = sv.validate(s, root=scratch)
            ok = _has(errs if sev == "error" else warns, code) and (sev == "warn" and not _has(errs, code) or sev == "error")
            rejected += ok
            print(f"  [{'REJECTED' if ok else 'MISSED  '}] {layer:10s} {name}  (expect {sev} {code})")
            if not ok:
                bad.append(name)
        finally:
            shutil.rmtree(tmp, ignore_errors=True)
            sv.reset()
    for base, layer, name, code, fn in GEN_MUTATIONS:
        s = copy.deepcopy(GEN_BASES[base])
        fn(s)
        errs, _ = sv.validate(s)
        ok = _has(errs, code)
        rejected += ok
        print(f"  [{'REJECTED' if ok else 'MISSED  '}] gen/{layer:6s} [{base}] {name}  (expect {code}; got {sorted({e.split()[0] for e in errs})})")
        if not ok:
            bad.append("generated: " + name)
    for base, name, code in FLIP_MUTATIONS:
        s = copy.deepcopy(BASES[base])
        s["mode"] = "generated"
        errs, _ = sv.validate(s)
        ok = _has(errs, code)
        rejected += ok
        print(f"  [{'REJECTED' if ok else 'MISSED  '}] gen/flip   [{base}] {name}  (expect {code}; got {sorted({e.split()[0] for e in errs})})")
        if not ok:
            bad.append("flip: " + name)
    for layer, name, code, fn, sev in GEN_REPO_MUTATIONS:
        tmp = tempfile.mkdtemp(prefix="adv-")
        try:
            scratch = os.path.join(tmp, "design-repo")
            shutil.copytree(ROOT, scratch, ignore=shutil.ignore_patterns("__pycache__", ".DS_Store"))
            s = copy.deepcopy(GEN_BASES["home"])
            fn(scratch, s)
            sv.reset()
            errs, warns = sv.validate(s, root=scratch)
            ok = _has(errs, code)
            rejected += ok
            print(f"  [{'REJECTED' if ok else 'MISSED  '}] gen/{layer:6s} {name}  (expect {sev} {code}; got {sorted({e.split()[0] for e in errs})})")
            if not ok:
                bad.append("generated repo: " + name)
        finally:
            shutil.rmtree(tmp, ignore_errors=True)
            sv.reset()
    total = case_counts()["mutations"]
    print(f"\nmutations rejected: {rejected}/{total}")

    print("\n-- CONTROLS (must produce zero errors)")
    passed = 0
    hero_exc = load("compatibility/graph.json")["rules"]
    hero_exc = next(r for r in hero_exc if r["id"] == "REQUIRES_HERO")["exceptions"]
    controls = [(f"reference example PageSpec [{k}] (real source content still validates)", copy.deepcopy(v)) for k, v in BASES.items()]
    controls += [(f"generated example PageSpec [{k}] (fictional brand, original copy, placeholder assets and URLs)", copy.deepcopy(v)) for k, v in GEN_BASES.items()]
    for tid in load("templates/templates.json")["templates"]:
        controls.append((f"reference control {tid}", control_for(tid)))
        controls.append((f"generated-mode control {tid}", control_for(tid, mode="generated")))
    for name, spec in controls:
        errs, warns = sv.validate(spec)
        ok = not errs
        # both directions: hero-less exception templates must not warn; all others have a hero and must not warn either
        if spec["template"] and _has(warns, "REQUIRES_HERO"):
            ok = False
        passed += ok
        print(f"  [{'PASS' if ok else 'FAIL'}] {name}: {len(errs)} errors, {len(warns)} warnings {errs[:2]}")
        if not ok:
            bad.append("control " + name)
    print(f"\ncontrols passed: {passed}/{case_counts()['controls']}")
    print("\nRESULT:", "ALL OK" if not bad else f"FAILURES: {bad}")
    return 0 if not bad else 1


if __name__ == "__main__":
    sys.exit(run())
