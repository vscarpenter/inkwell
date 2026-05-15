#!/usr/bin/env node
// Regenerate tokens.json from inkwell-tokens.css.
//
// Usage:
//   node scripts/build-tokens-json.mjs           # write tokens.json
//   node scripts/build-tokens-json.mjs --check   # exit 1 if tokens.json is stale (CI guardrail)
//
// Zero dependencies — Node 18+ built-ins only. All paths resolve relative to
// the script's own location, so it can be run from any working directory.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const SOURCE_CSS = resolve(ROOT, "inkwell-tokens.css");
const TARGET_JSON = resolve(ROOT, "tokens.json");

// ---------------------------------------------------------------------------
// 1. Parse inkwell-tokens.css into three maps:
//      lightVars   — :root { ... }
//      darkVarsA   — @media (prefers-color-scheme: dark) :root:not([data-theme="light"]) { ... }
//      darkVarsB   — :root[data-theme="dark"] { ... }
//    Then assert darkVarsA == darkVarsB (they're byte-identical by design).
// ---------------------------------------------------------------------------

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

function parseDeclarations(block) {
  // Extract `--name: value;` pairs from a CSS block body (already comment-stripped).
  const out = new Map();
  const re = /(--[a-z0-9-]+)\s*:\s*([^;]+?)\s*;/gi;
  let m;
  while ((m = re.exec(block)) !== null) {
    out.set(m[1], m[2].replace(/\s+/g, " ").trim());
  }
  return out;
}

function extractBlock(css, opener) {
  // Find the first occurrence of `opener` followed by `{`, then return the
  // balanced-brace body. `opener` is a literal string match against the
  // comment-stripped source.
  const start = css.indexOf(opener);
  if (start === -1) throw new Error(`could not find block: ${opener}`);
  const openBrace = css.indexOf("{", start + opener.length);
  if (openBrace === -1) throw new Error(`no opening brace after: ${opener}`);
  let depth = 1;
  let i = openBrace + 1;
  while (i < css.length && depth > 0) {
    const ch = css[i];
    if (ch === "{") depth++;
    else if (ch === "}") depth--;
    i++;
  }
  if (depth !== 0) throw new Error(`unbalanced braces in: ${opener}`);
  return css.slice(openBrace + 1, i - 1);
}

function parseSource() {
  const raw = readFileSync(SOURCE_CSS, "utf8");
  const css = stripComments(raw);

  const lightBody = extractBlock(css, ":root");
  const lightVars = parseDeclarations(lightBody);

  // Both dark blocks live deeper in the file. extractBlock returns the FIRST
  // match, so slice past the light block before searching for each dark block.
  const afterLight = css.slice(css.indexOf(lightBody) + lightBody.length);
  const mediaBody = extractBlock(afterLight, "@media (prefers-color-scheme: dark)");
  const darkABody = extractBlock(mediaBody, ":root:not([data-theme=\"light\"])");
  const darkVarsA = parseDeclarations(darkABody);

  const afterMedia = afterLight.slice(afterLight.indexOf(mediaBody) + mediaBody.length);
  const darkBBody = extractBlock(afterMedia, ":root[data-theme=\"dark\"]");
  const darkVarsB = parseDeclarations(darkBBody);

  // Parity check: the two dark blocks must declare the exact same variables
  // with the exact same values. They're byte-identical by design; a divergence
  // here is a maintenance bug we want to catch loudly.
  assertMapsEqual(darkVarsA, darkVarsB,
    "dark blocks diverged: @media (prefers-color-scheme: dark) vs [data-theme=\"dark\"]");

  // Version is embedded in the file header as `Version: X.Y.Z`.
  const versionMatch = raw.match(/Version:\s*([\d.]+)/);
  if (!versionMatch) throw new Error("could not find `Version: X.Y.Z` in inkwell-tokens.css header");

  return { lightVars, darkVars: darkVarsA, version: versionMatch[1] };
}

function assertMapsEqual(a, b, label) {
  const keys = new Set([...a.keys(), ...b.keys()]);
  const diffs = [];
  for (const k of keys) {
    if (a.get(k) !== b.get(k)) diffs.push(`  ${k}: ${a.get(k) ?? "<missing>"} vs ${b.get(k) ?? "<missing>"}`);
  }
  if (diffs.length) throw new Error(`${label}\n${diffs.join("\n")}`);
}

// ---------------------------------------------------------------------------
// 2. Build the JSON. Each color/shadow entry uses helpers that look up the
//    variable in both maps; flat sections (spacing, radius, etc.) look up
//    light only. If a referenced --var is missing from either map, the helper
//    throws — so adding a token to the schema without defining it in CSS
//    fails the build, not silently emits null.
// ---------------------------------------------------------------------------

function buildJson({ lightVars, darkVars, version }) {
  // Track which vars the schema consumed so we can warn about orphans
  // (CSS vars defined but not surfaced in tokens.json).
  const consumedLight = new Set();
  const consumedDark = new Set();

  const light = (cssVar) => {
    if (!lightVars.has(cssVar)) throw new Error(`missing in :root: ${cssVar}`);
    consumedLight.add(cssVar);
    return lightVars.get(cssVar);
  };
  const dark = (cssVar) => {
    if (!darkVars.has(cssVar)) throw new Error(`missing in dark cascade: ${cssVar}`);
    consumedDark.add(cssVar);
    return darkVars.get(cssVar);
  };
  const lightDark = (cssVar, role) => {
    const entry = { light: light(cssVar), dark: dark(cssVar) };
    if (role) entry.role = role;
    return entry;
  };
  const lightDarkNoRole = (cssVar) => ({ light: light(cssVar), dark: dark(cssVar) });

  const json = {
    _meta: {
      name: "Inkwell",
      palette: "Indigo & Cloud",
      version,
      canonical_source: "inkwell-tokens.css",
      note: "Generated by scripts/build-tokens-json.mjs from inkwell-tokens.css. Do not edit by hand — re-run the script when CSS tokens change. Hex values mirror :root and :root[data-theme=\"dark\"] blocks.",
    },
    color: {
      surface: {
        ivory: lightDark("--ivory", "Page background"),
        paper: lightDark("--paper", "Card / panel surface"),
        slate: lightDark("--slate", "Primary text"),
        oat:   lightDark("--oat",   "Tertiary surface, hover thumbnails"),
      },
      accent: {
        accent:               lightDark("--accent",               "Links, focus, active state"),
        accent_d:             lightDark("--accent-d",             "Hover/pressed accent"),
        accent_tint:          lightDark("--accent-tint",          "Badge background"),
        accent_focus_ring:    lightDark("--accent-focus-ring",    "Input focus halo"),
        accent_strong_border: lightDark("--accent-strong-border", "Tinted chip border"),
      },
      semantic: {
        olive:                 lightDark("--olive",                 "Success, additions"),
        olive_tint:            lightDark("--olive-tint",            "Success badge background"),
        olive_strong_border:   lightDark("--olive-strong-border",   "Tinted success border (chip-dot.safe, alert.is-success)"),
        rust:                  lightDark("--rust",                  "Danger, deletions, errors"),
        rust_d:                lightDark("--rust-d",                "Rust hover/pressed state"),
        rust_tint:             lightDark("--rust-tint",             "Danger alert background"),
        rust_tint_border:      lightDark("--rust-tint-border",      "Danger alert border"),
        rust_focus_ring:       lightDark("--rust-focus-ring",       "Danger input focus halo (is-error)"),
        warning:               lightDark("--warning",               "Amber warning"),
        warning_dark:          lightDark("--warning-dark",          "Warning text (darker for contrast)"),
        warning_tint:          lightDark("--warning-tint",          "Warning badge background"),
        warning_strong_border: lightDark("--warning-strong-border", "Tinted warning border (alert.is-warning)"),
        info:                  lightDark("--info",                  "Informational"),
        sky:                   lightDark("--sky",                   "Alt info / second data-viz hue"),
      },
      neutral: {
        gray_100: lightDark("--gray-100", "Subtle row stripe, code-chip bg"),
        gray_200: lightDark("--gray-200", "Divider on white"),
        gray_300: lightDark("--gray-300", "Default 1.5px border"),
        gray_500: lightDark("--gray-500", "Muted text, captions (WCAG AA)"),
        gray_700: lightDark("--gray-700", "Secondary body text"),
      },
    },
    typography: {
      family: {
        serif: light("--serif"),
        sans:  light("--sans"),
        mono:  light("--mono"),
      },
      size: {
        display: { px: pxOf(light("--t-display")), role: "Hero numerals & largest serif headlines" },
        h1:      { px: pxOf(light("--t-h1")),      role: "Page-level serif heading" },
        h2:      { px: pxOf(light("--t-h2")),      role: "Section serif heading" },
        h3:      { px: pxOf(light("--t-h3")),      role: "Card / sub-section serif heading" },
        lede:    { px: pxOf(light("--t-lede")),    role: "Deck/intro paragraph — serif italic, magazine archetype" },
        body:    { px: pxOf(light("--t-body")),    role: "Default body sans" },
        small:   { px: pxOf(light("--t-small")),   role: "Secondary copy / captions" },
        caption: { px: pxOf(light("--t-caption")), role: "Caption sans" },
        eyebrow: { px: pxOf(light("--t-eyebrow")), role: "Uppercase mono lead-in" },
      },
    },
    spacing: {
      sp_1: light("--sp-1"),
      sp_2: light("--sp-2"),
      sp_3: light("--sp-3"),
      sp_4: light("--sp-4"),
      sp_5: light("--sp-5"),
      sp_6: light("--sp-6"),
      sp_7: light("--sp-7"),
      sp_8: light("--sp-8"),
      _note: "8px base with 4px micro step. Card padding 18-24px; section gaps 48-72px.",
    },
    radius: {
      xs:   light("--r-xs"),
      sm:   light("--r-sm"),
      md:   light("--r-md"),
      lg:   light("--r-lg"),
      xl:   light("--r-xl"),
      pill: light("--r-pill"),
    },
    border: {
      default: light("--border"),
      strong:  light("--border-strong"),
      hair:    light("--border-hair"),
      rule:    light("--border-rule"),
      _note:   "1.5px is the system signature — do not substitute 1px or 2px on outer panels.",
    },
    shadow: {
      sm:         lightDarkNoRole("--shadow-sm"),
      md:         lightDarkNoRole("--shadow-md"),
      lg:         lightDarkNoRole("--shadow-lg"),
      card_hover: lightDarkNoRole("--shadow-card-hover"),
    },
    backdrop: {
      default: lightDark("--backdrop", "dialog::backdrop, modal scrims"),
    },
    tldr_code_tint: {
      default: lightDark("--tldr-code-tint", ".tldr code-chip overlay — inverts with the .tldr surface"),
    },
    motion: {
      fast:     light("--t-fast"),
      base:     light("--t-base"),
      slow:     light("--t-slow"),
      ease_out: light("--ease-out"),
      ease_pop: light("--ease-pop"),
    },
    layout: {
      content_narrow:  light("--content-narrow"),
      content_default: light("--content-default"),
      content_wide:    light("--content-wide"),
      page_pad_x:      light("--page-pad-x"),
    },
    z_index: {
      base:    Number(light("--z-base")),
      raised:  Number(light("--z-raised")),
      sticky:  Number(light("--z-sticky")),
      overlay: Number(light("--z-overlay")),
      modal:   Number(light("--z-modal")),
    },
  };

  // Orphan check: every CSS var that exists in :root should appear in the JSON.
  // If not, either the schema needs a new entry or the CSS has dead tokens.
  const allLightKeys = [...lightVars.keys()];
  const orphans = allLightKeys.filter((k) => !consumedLight.has(k));
  if (orphans.length) {
    console.warn(`warning: CSS vars defined in :root but not surfaced in tokens.json:\n  ${orphans.join("\n  ")}`);
  }
  const darkOnly = [...darkVars.keys()].filter((k) => !lightVars.has(k));
  if (darkOnly.length) {
    throw new Error(`dark cascade defines vars not in :root (likely typo): ${darkOnly.join(", ")}`);
  }

  return json;
}

function pxOf(cssValue) {
  // "16px" → 16. The type scale is always px in this system.
  const m = cssValue.match(/^(\d+)px$/);
  if (!m) throw new Error(`expected Npx, got: ${cssValue}`);
  return Number(m[1]);
}

// ---------------------------------------------------------------------------
// 3. Format. Standard JSON.stringify expands every object to multi-line,
//    which makes the file 4x longer. Inline small leaf objects to keep the
//    diff legible for humans reviewing token changes.
// ---------------------------------------------------------------------------

function formatJson(value, level = 0) {
  const pad = "  ".repeat(level);
  const padInner = "  ".repeat(level + 1);

  if (value === null || typeof value !== "object") return JSON.stringify(value);

  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    return "[\n" + value.map((v) => padInner + formatJson(v, level + 1)).join(",\n") + "\n" + pad + "]";
  }

  const keys = Object.keys(value);
  if (keys.length === 0) return "{}";

  const allPrimitive = keys.every((k) => value[k] === null || typeof value[k] !== "object");
  if (allPrimitive) {
    const inline = "{ " + keys.map((k) => JSON.stringify(k) + ": " + JSON.stringify(value[k])).join(", ") + " }";
    if (inline.length <= 120) return inline;
  }

  return "{\n" + keys.map((k) => padInner + JSON.stringify(k) + ": " + formatJson(value[k], level + 1)).join(",\n") + "\n" + pad + "}";
}

// ---------------------------------------------------------------------------
// 4. Entry point. --check prints a diff and exits 1 on drift.
// ---------------------------------------------------------------------------

function main() {
  const args = new Set(process.argv.slice(2));
  const check = args.has("--check");

  const parsed = parseSource();
  const json = buildJson(parsed);
  const out = formatJson(json) + "\n";

  if (check) {
    const onDisk = readFileSync(TARGET_JSON, "utf8");
    if (onDisk === out) {
      console.log("tokens.json is up to date");
      return;
    }
    console.error("tokens.json is stale — run `node scripts/build-tokens-json.mjs` and commit the result.");
    console.error("");
    console.error("First divergence:");
    const a = onDisk.split("\n");
    const b = out.split("\n");
    const n = Math.max(a.length, b.length);
    for (let i = 0; i < n; i++) {
      if (a[i] !== b[i]) {
        console.error(`  line ${i + 1}:`);
        console.error(`    on disk:   ${JSON.stringify(a[i] ?? "<eof>")}`);
        console.error(`    generated: ${JSON.stringify(b[i] ?? "<eof>")}`);
        break;
      }
    }
    process.exit(1);
  }

  writeFileSync(TARGET_JSON, out);
  console.log(`wrote tokens.json (${out.length} bytes, version ${parsed.version})`);
}

main();
