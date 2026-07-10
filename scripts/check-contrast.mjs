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
function rootVars(file) {
  const css = stripComments(readFileSync(resolve(ROOT, file), "utf8"));
  return parseDeclarations(extractBlock(css, ":root") ?? "");
}

// Replace every light-dark(A, B) in a value with the branch for `mode`.
// Balanced-paren aware: A/B may contain color-mix(...) with nested commas.
function pickMode(value, mode) {
  let out = value;
  for (;;) {
    const idx = out.indexOf("light-dark(");
    if (idx === -1) return out;
    let depth = 1, i = idx + 11, comma = -1;
    for (; i < out.length && depth > 0; i++) {
      const ch = out[i];
      if (ch === "(") depth++;
      else if (ch === ")") depth--;
      else if (ch === "," && depth === 1 && comma === -1) comma = i;
    }
    const branch = mode === "dark" ? out.slice(comma + 1, i - 1) : out.slice(idx + 11, comma);
    out = out.slice(0, idx) + branch.trim() + out.slice(i);
  }
}

// ---------- color math ----------
function lin(c) { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }
function srgb(hex) {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) throw new Error(`bad hex: ${hex}`);
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
// `vars` maps token -> raw value (single light-dark() declarations);
// pickMode() selects the branch for `mode`, var() refs resolve
// recursively, color-mix(... var(--x) P%, transparent) applies alpha P
// to its base, and translucent values composite over the resolved
// --paper of that context.
function resolveColor(name, vars, mode, depth = 0) {
  if (depth > 8) throw new Error(`var() loop at ${name}`);
  let raw = vars.get(name);
  if (raw === undefined) throw new Error(`undefined token: ${name}`);
  raw = pickMode(raw, mode);
  const ref = raw.match(/^var\((--[a-z0-9-]+)\)$/i);
  if (ref) return resolveColor(ref[1], vars, mode, depth + 1);
  if (raw.startsWith("#")) return srgb(raw);
  if (raw.startsWith("rgba(")) return composite(raw, resolveColor("--paper", vars, mode, depth + 1));
  const mix = raw.match(/^color-mix\(in srgb,\s*var\((--[a-z0-9-]+)\)\s+([\d.]+)%\s*,\s*transparent\)$/i);
  if (mix) {
    const base = resolveColor(mix[1], vars, mode, depth + 1);
    const a = Number(mix[2]) / 100;
    const bg = resolveColor("--paper", vars, mode, depth + 1);
    return [0, 1, 2].map((i) => Math.round(base[i] * a + bg[i] * (1 - a)));
  }
  throw new Error(`unparseable color for ${name}: ${raw}`);
}

// Build the effective var map for a palette: canonical :root overlaid by
// the variant's :root (if any). Mode is resolved per-token via pickMode().
const canonical = rootVars("inkwell-tokens.css");
const variantFiles = { clay: "variants/clay.css", sage: "variants/sage.css", burgundy: "variants/burgundy.css", azure: "variants/azure.css" };
function varsFor(palette) {
  const out = new Map(canonical);
  if (palette !== "indigo")
    for (const [k, v] of rootVars(variantFiles[palette])) out.set(k, v);
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

const palettes = ["indigo", "clay", "sage", "burgundy", "azure"];
const failures = [];
let count = 0;
for (const palette of palettes) {
  const vars = varsFor(palette);
  for (const mode of ["light", "dark"]) {
    for (const [label, fg, bg, need] of CHECKS) {
      count++;
      let r;
      try {
        r = ratio(resolveColor(fg, vars, mode), resolveColor(bg, vars, mode));
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
