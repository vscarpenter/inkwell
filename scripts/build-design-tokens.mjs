#!/usr/bin/env node
// Optional DTCG 2025.10 export. CSS remains the source of truth.
// node scripts/build-design-tokens.mjs [--check]

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { stripComments, parseDeclarations, extractBlock, parseSource, valueFor } from "./build-tokens-json.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TARGET = resolve(ROOT, "inkwell.tokens.json");
const PALETTES = ["indigo", "clay", "sage", "burgundy", "azure"];
const EXTENSION = "dev.vinny.inkwell";

function dimension(value) {
  if (value === "0") return { value: 0, unit: "px" };
  const match = value.match(/^(-?[\d.]+)(px|rem)$/);
  if (!match) throw new Error(`Invalid dimension: ${value}`);
  return { value: Number(match[1]), unit: match[2] };
}

function color(value) {
  const hex = value.match(/^#([a-f\d]{6})$/i);
  if (hex) return { colorSpace: "srgb", components: [0, 2, 4].map((i) => parseInt(hex[1].slice(i, i + 2), 16) / 255), alpha: 1 };
  const rgba = value.match(/^rgba\(\s*([\d.]+),\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)\s*\)$/);
  if (!rgba) throw new Error(`Invalid color: ${value}`);
  return { colorSpace: "srgb", components: rgba.slice(1, 4).map((n) => Number(n) / 255), alpha: Number(rgba[4]) };
}

function alias(value) { return value.match(/^var\((--[a-z\d-]+)\)$/)?.[1]; }

function typeFor(name, vars, mode, seen = new Set()) {
  if (seen.has(name)) throw new Error(`Cyclic CSS alias: ${name}`);
  const value = valueFor(vars, name, mode);
  const target = alias(value);
  if (target) return typeFor(target, vars, mode, new Set([...seen, name]));
  if (/^(?:#[a-f\d]{6}|rgba\(.+\))$/i.test(value)) return "color";
  if (["--serif", "--sans", "--mono"].includes(name)) return "fontFamily";
  if (/^-?[\d.]+(?:px|rem)$/.test(value)) return "dimension";
  if (/^[\d.]+ms$/.test(value)) return "duration";
  if (/^cubic-bezier\(/.test(value)) return "cubicBezier";
  if (/^-?\d+$/.test(value)) return "number";
  if (/^[\d.]+px solid var\(/.test(value)) return "border";
  if (/^(?:0|[\d.]+px)\s+(?:0|[\d.]+px)\s+[\d.]+px\s+rgba\(/.test(value)) return "shadow";
  throw new Error(`Unsupported token ${name}: ${value}`);
}

export function buildDtcg() {
  const { vars: canonical, version } = parseSource();
  const foundations = new Set([...canonical].filter(([name, value]) =>
    !/var\(|light-dark\(/.test(value) && ["dimension", "duration", "fontFamily", "cubicBezier", "number"].includes(typeFor(name, canonical, "light"))
  ).map(([name]) => name));
  const key = (name) => name.slice(2);
  const reference = (name, palette, mode) => `{${foundations.has(name) ? "foundation" : `palettes.${palette}.${mode}`}.${key(name)}}`;

  function token(name, vars, palette, mode) {
    const value = valueFor(vars, name, mode);
    const type = typeFor(name, vars, mode);
    const target = alias(value);
    let encoded;
    if (target) encoded = reference(target, palette, mode);
    else if (type === "color") encoded = color(value);
    else if (type === "dimension") encoded = dimension(value);
    else if (type === "number") encoded = Number(value);
    else if (type === "duration") encoded = { value: parseFloat(value), unit: "ms" };
    else if (type === "fontFamily") encoded = value.split(",").map((family) => family.trim().replace(/^"|"$/g, ""));
    else if (type === "cubicBezier") encoded = value.slice(13, -1).split(",").map(Number);
    else if (type === "border") {
      const match = value.match(/^([\d.]+px) solid var\((--[a-z\d-]+)\)$/);
      if (!match) throw new Error(`Unsupported border: ${value}`);
      encoded = { color: reference(match[2], palette, mode), width: dimension(match[1]), style: "solid" };
    } else if (type === "shadow") {
      const match = value.match(/^(0|[\d.]+px)\s+(0|[\d.]+px)\s+([\d.]+px)\s+(rgba\(.+\))$/);
      if (!match) throw new Error(`Unsupported shadow: ${value}`);
      encoded = { color: color(match[4]), offsetX: dimension(match[1]), offsetY: dimension(match[2]), blur: dimension(match[3]), spread: dimension("0") };
    }
    return { $type: type, $value: encoded, $extensions: { [EXTENSION]: { cssVariable: name } } };
  }

  const document = {
    $description: "Inkwell design tokens, generated from canonical CSS and palette overrides. DTCG Format/Color 2025.10. Palette and mode names are ordinary groups, not a custom mode syntax.",
    $extensions: { [EXTENSION]: { version, source: "inkwell-tokens.css", specification: "https://www.designtokens.org/TR/2025.10/format/" } },
    foundation: {},
    palettes: {},
  };
  for (const name of foundations) document.foundation[key(name)] = token(name, canonical, "indigo", "light");
  for (const palette of PALETTES) {
    const vars = new Map(canonical);
    if (palette !== "indigo") {
      const source = stripComments(readFileSync(resolve(ROOT, `variants/${palette}.css`), "utf8"));
      for (const [name, value] of parseDeclarations(extractBlock(source, ":root"))) vars.set(name, value);
    }
    document.palettes[palette] = {};
    for (const mode of ["light", "dark"]) {
      const group = document.palettes[palette][mode] = {};
      for (const name of vars.keys()) if (!foundations.has(name)) group[key(name)] = token(name, vars, palette, mode);
    }
  }
  return document;
}

function main() {
  const output = JSON.stringify(buildDtcg(), null, 2) + "\n";
  if (process.argv.includes("--check")) {
    if (!existsSync(TARGET) || readFileSync(TARGET, "utf8") !== output) {
      console.error("inkwell.tokens.json is stale — run node scripts/build-design-tokens.mjs");
      process.exitCode = 1;
    } else console.log("DTCG export is current (five palettes, both modes)");
    return;
  }
  writeFileSync(TARGET, output);
  console.log(`wrote inkwell.tokens.json (${output.length} bytes)`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
