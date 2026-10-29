import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildDtcg } from "../scripts/build-design-tokens.mjs";
import { parseSource, parseDeclarations, extractBlock, stripComments } from "../scripts/build-tokens-json.mjs";

const document = buildDtcg();
const legacy = JSON.parse(readFileSync(new URL("../tokens.json", import.meta.url), "utf8"));
const tokens = new Map();
function collect(group, path = []) {
  for (const [name, entry] of Object.entries(group)) {
    if (name.startsWith("$")) continue;
    const next = [...path, name];
    if (Object.hasOwn(entry, "$value")) tokens.set(next.join("."), entry);
    else collect(entry, next);
  }
}
collect(document);

function resolveValue(value, seen = new Set()) {
  if (typeof value === "string" && /^\{[^{}]+\}$/.test(value)) {
    const path = value.slice(1, -1);
    assert.ok(tokens.has(path), `Missing alias target: ${path}`);
    assert.ok(!seen.has(path), `Cyclic alias: ${path}`);
    return resolveValue(tokens.get(path).$value, new Set([...seen, path]));
  }
  if (Array.isArray(value)) return value.map((v) => resolveValue(v, seen));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolveValue(v, seen)]));
  return value;
}

function dimension(value) {
  assert.ok(Number.isFinite(value.value));
  assert.ok(["px", "rem"].includes(value.unit));
}
function color(value) {
  assert.equal(value.colorSpace, "srgb");
  assert.equal(value.components.length, 3);
  for (const channel of [...value.components, value.alpha]) assert.ok(Number.isFinite(channel) && channel >= 0 && channel <= 1);
}

test("relative typography keeps legacy pixel references and typed rem dimensions", () => {
  const baseline = {display:48,h1:32,h2:24,h3:19,lede:20,body:16,small:14,caption:12,eyebrow:11};
  assert.equal(legacy.typography.reference_root_px, 16);
  for (const [role, px] of Object.entries(baseline)) {
    assert.equal(legacy.typography.size[role].px, px);
    assert.equal(legacy.typography.size[role].css, `${px / 16}rem`);
    assert.deepEqual(document.foundation[`t-${role}`].$value, {value:px / 16,unit:"rem"});
  }
});

test("every CSS token is present for every palette and mode", () => {
  const canonical = parseSource().vars;
  for (const palette of ["indigo", "clay", "sage", "burgundy", "azure"]) {
    const vars = new Map(canonical);
    if (palette !== "indigo") {
      const css = stripComments(readFileSync(new URL(`../variants/${palette}.css`, import.meta.url), "utf8"));
      for (const [name, value] of parseDeclarations(extractBlock(css, ":root"))) vars.set(name, value);
    }
    for (const mode of ["light", "dark"]) {
      for (const name of vars.keys()) {
        const path = Object.hasOwn(document.foundation, name.slice(2)) ? `foundation.${name.slice(2)}` : `palettes.${palette}.${mode}.${name.slice(2)}`;
        assert.ok(tokens.has(path), `Missing CSS token: ${path}`);
        assert.equal(tokens.get(path).$extensions["dev.vinny.inkwell"].cssVariable, name);
      }
    }
  }
});

test("all DTCG aliases resolve without cycles and retain their target type", () => {
  for (const [path, token] of tokens) {
    resolveValue(token.$value);
    if (typeof token.$value === "string" && token.$value.startsWith("{")) {
      assert.equal(tokens.get(token.$value.slice(1, -1)).$type, token.$type, path);
    }
  }
});

test("every generated value obeys its DTCG type", () => {
  for (const [path, token] of tokens) {
    const value = resolveValue(token.$value);
    switch (token.$type) {
      case "color": color(value); break;
      case "dimension": dimension(value); break;
      case "duration": assert.equal(value.unit, "ms"); assert.ok(value.value >= 0); break;
      case "number": assert.ok(Number.isFinite(value)); break;
      case "fontFamily": assert.ok(Array.isArray(value) && value.length > 0); for (const family of value) assert.equal(typeof family, "string"); break;
      case "cubicBezier": assert.equal(value.length, 4); assert.ok(value.every(Number.isFinite)); assert.ok(value[0] >= 0 && value[0] <= 1 && value[2] >= 0 && value[2] <= 1); break;
      case "border": color(value.color); dimension(value.width); assert.equal(value.style, "solid"); break;
      case "shadow": color(value.color); for (const key of ["offsetX", "offsetY", "blur", "spread"]) dimension(value[key]); break;
      default: assert.fail(`Unsupported type at ${path}: ${token.$type}`);
    }
  }
});

test("semantic aliases follow each palette instead of freezing canonical colors", () => {
  for (const palette of Object.keys(document.palettes)) {
    for (const mode of ["light", "dark"]) {
      const prefix = `palettes.${palette}.${mode}`;
      assert.deepEqual(resolveValue(tokens.get(`${prefix}.surface-page`).$value), resolveValue(tokens.get(`${prefix}.ivory`).$value));
      assert.deepEqual(resolveValue(tokens.get(`${prefix}.text-link`).$value), resolveValue(tokens.get(`${prefix}.accent-ink`).$value));
    }
  }
  assert.notDeepEqual(resolveValue(tokens.get("palettes.indigo.light.accent").$value), resolveValue(tokens.get("palettes.azure.light.accent").$value));
});
