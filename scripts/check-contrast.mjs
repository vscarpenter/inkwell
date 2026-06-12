#!/usr/bin/env node
// WCAG contrast gate for Inkwell tokens.
//
// Usage:  node scripts/check-contrast.mjs
// Exit 0: every pair passes. Exit 1: prints a failure table.
//
// Parses the REAL CSS (canonical + variants) so checked values can never
// drift from shipped values. Zero dependencies, Node 18+.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");

// ---------- CSS parsing (same approach as build-tokens-json.mjs) ----------
function stripComments(css) { return css.replace(/\/\*[\s\S]*?\*\//g, ""); }
function parseDeclarations(block) {
  const out = new Map();
  const re = /(--[a-z0-9-]+)\s*:\s*([^;]+?)\s*;/gi;
  let m;
  while ((m = re.exec(block)) !== null) out.set(m[1], m[2].replace(/\s+/g, " ").trim());
  return out;
}
function extractBlock(css, opener) {
  const start = css.indexOf(opener);
  if (start === -1) return null;
  const openBrace = css.indexOf("{", start + opener.length);
  let depth = 1, i = openBrace + 1;
  while (i < css.length && depth > 0) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}") depth--;
    i++;
  }
  return css.slice(openBrace + 1, i - 1);
}
function lightAndDark(file) {
  const css = stripComments(readFileSync(resolve(ROOT, file), "utf8"));
  const light = parseDeclarations(extractBlock(css, ":root") ?? "");
  const darkBody = extractBlock(css, ':root[data-theme="dark"]');
  const dark = parseDeclarations(darkBody ?? "");
  return { light, dark };
}

// ---------- color math ----------
function lin(c) { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }
function srgb(hex) {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function lum([r, g, b]) { return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b); }
function ratio(fg, bg) {
  const [l1, l2] = [lum(fg), lum(bg)].sort((a, b) => b - a);
  return (l1 + 0.05) / (l2 + 0.05);
}
// Composite an rgba() value over an opaque background.
function composite(rgba, bg) {
  const m = rgba.match(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/);
  if (!m) throw new Error(`not rgba(): ${rgba}`);
  const a = Number(m[4]);
  return [1, 2, 3].map((i) => Math.round(Number(m[i]) * a + bg[i - 1] * (1 - a)));
}

// ---------- token resolution ----------
// Resolve a token to an opaque RGB triple in a given palette+mode.
// `vars` maps token -> raw value; var() refs resolve recursively;
// rgba() values composite over the resolved --paper of that context.
function resolveColor(name, vars, depth = 0) {
  if (depth > 8) throw new Error(`var() loop at ${name}`);
  const raw = vars.get(name);
  if (raw === undefined) throw new Error(`undefined token: ${name}`);
  const ref = raw.match(/^var\((--[a-z0-9-]+)\)$/i);
  if (ref) return resolveColor(ref[1], vars, depth + 1);
  if (raw.startsWith("#")) return srgb(raw);
  if (raw.startsWith("rgba(")) return composite(raw, resolveColor("--paper", vars, depth + 1));
  throw new Error(`unparseable color for ${name}: ${raw}`);
}

// Build the effective var map for palette+mode: canonical light, overlaid by
// canonical dark (if dark), overlaid by variant light, overlaid by variant dark.
const canonical = lightAndDark("inkwell-tokens.css");
const variantFiles = { clay: "variants/clay.css", sage: "variants/sage.css", burgundy: "variants/burgundy.css" };
function varsFor(palette, mode) {
  const out = new Map(canonical.light);
  if (mode === "dark") for (const [k, v] of canonical.dark) out.set(k, v);
  if (palette !== "indigo") {
    const v = lightAndDark(variantFiles[palette]);
    for (const [k, val] of v.light) out.set(k, val);
    if (mode === "dark") for (const [k, val] of v.dark) out.set(k, val);
  }
  return out;
}

// ---------- the check table ----------
// [label, fg token, bg token, threshold]. Run for every palette x mode.
const CHECKS = [
  ["body text (slate on ivory)",            "--slate",        "--ivory",        4.5],
  ["secondary text (gray-700 on paper)",    "--gray-700",     "--paper",        4.5],
  ["muted text (gray-500 on paper)",        "--gray-500",     "--paper",        4.5],
  ["muted text (gray-500 on ivory)",        "--gray-500",     "--ivory",        4.5],
  ["link text (accent-ink on ivory)",       "--accent-ink",   "--ivory",        4.5],
  ["link text (accent-ink on paper)",       "--accent-ink",   "--paper",        4.5],
  ["btn-primary label (on-accent on accent)", "--on-accent",  "--accent",       4.5],
  ["btn-primary hover (on-accent on accent-d)", "--on-accent", "--accent-d",    4.5],
  ["btn-danger label (paper on rust)",      "--paper",        "--rust",         4.5],
  ["btn-danger hover (paper on rust-d)",    "--paper",        "--rust-d",       4.5],
  ["badge-accent (accent-ink on tint)",     "--accent-ink",   "--accent-tint",  4.5],
  ["badge-success (olive-dark on tint)",    "--olive-dark",   "--olive-tint",   4.5],
  ["badge-warning (warning-dark on tint)",  "--warning-dark", "--warning-tint", 4.5],
  ["badge-danger (paper on rust)",          "--paper",        "--rust",         4.5],
  ["stat-delta up (olive-dark on paper)",   "--olive-dark",   "--paper",        4.5],
  ["stat-delta down (rust on paper)",       "--rust",         "--paper",        4.5],
  ["pill resolved (paper on olive-dark)",   "--paper",        "--olive-dark",   4.5],
  ["pill sev (on-accent on accent)",        "--on-accent",    "--accent",       4.5],
  ["field-error (rust on ivory)",           "--rust",         "--ivory",        4.5],
  ["table header (gray-700 on gray-100)",   "--gray-700",     "--gray-100",     4.5],
  ["focus outline vs ivory (non-text)",     "--accent-ink",   "--ivory",        3.0],
  ["focus outline vs paper (non-text)",     "--accent-ink",   "--paper",        3.0],
  ["control border vs paper (non-text)",    "--gray-400",     "--paper",        3.0],
  ["control border vs ivory (non-text)",    "--gray-400",     "--ivory",        3.0],
];

const palettes = ["indigo", "clay", "sage", "burgundy"];
const failures = [];
let count = 0;
for (const palette of palettes) {
  for (const mode of ["light", "dark"]) {
    const vars = varsFor(palette, mode);
    for (const [label, fg, bg, need] of CHECKS) {
      count++;
      let r;
      try {
        r = ratio(resolveColor(fg, vars), resolveColor(bg, vars));
      } catch (e) {
        failures.push({ palette, mode, label, ratio: `error: ${e.message}`, need });
        continue;
      }
      if (r < need) failures.push({ palette, mode, label, ratio: r.toFixed(2), need });
    }
  }
}

if (failures.length) {
  console.error(`contrast check: ${failures.length}/${count} pairs FAIL\n`);
  for (const f of failures) {
    console.error(`  [${f.palette}/${f.mode}] ${f.label}: ${f.ratio} < ${f.need}`);
  }
  process.exit(1);
}
console.log(`contrast check: all ${count} pairs pass`);
