// Drift guard for the homepage press sheet: the three-token diff printed under
// each palette sheet in examples/index.html must match variants/*.css exactly.
// Zero dependencies; run with `node --test tests/home-palettes.test.mjs`.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SHOWN = ["--accent", "--ivory", "--accent-ink"];
const PALETTES = ["clay", "sage", "burgundy", "azure"];

function stripComments(css) { return css.replace(/\/\*[\s\S]*?\*\//g, ""); }
function extractBlock(css, opener) {
  const start = css.indexOf(opener);
  if (start === -1) return "";
  const openBrace = css.indexOf("{", start + opener.length);
  let depth = 1, i = openBrace + 1;
  while (i < css.length && depth > 0) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}") depth--;
    i++;
  }
  return css.slice(openBrace + 1, i - 1);
}
function parseDeclarations(block) {
  const out = new Map();
  const re = /(--[a-z0-9-]+)\s*:\s*([^;]+?)\s*;/gi;
  let m;
  while ((m = re.exec(block)) !== null) out.set(m[1], m[2].replace(/\s+/g, " ").trim());
  return out;
}
function rootVars(file) {
  const css = stripComments(readFileSync(resolve(ROOT, file), "utf8"));
  return parseDeclarations(extractBlock(css, ":root"));
}
// Split light-dark(A, B) into [A, B]; A and B may contain nested commas.
function branches(value) {
  const idx = value.indexOf("light-dark(");
  assert.notEqual(idx, -1, `expected a light-dark() value, got ${value}`);
  let depth = 1, i = idx + 11, comma = -1;
  for (; i < value.length && depth > 0; i++) {
    const ch = value[i];
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    else if (ch === "," && depth === 1 && comma === -1) comma = i;
  }
  return [value.slice(idx + 11, comma).trim(), value.slice(comma + 1, i - 1).trim()];
}
function escape(text) { return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

// The sheet documents live inside srcdoc attributes and carry their own
// <article>; drop them so each match ends at the parent article's close.
const homepage = readFileSync(resolve(ROOT, "examples/index.html"), "utf8").replace(/\ssrcdoc='[^']*'/g, "");
function sheetMarkup(name) {
  const match = homepage.match(new RegExp(`<article[^>]*data-sheet="${name}"[\\s\\S]*?</article>`));
  assert.ok(match, `no article[data-sheet="${name}"] in examples/index.html`);
  return match[0];
}

for (const name of PALETTES) {
  test(`${name} sheet diff matches variants/${name}.css`, () => {
    const vars = rootVars(`variants/${name}.css`);
    const sheet = sheetMarkup(name);
    for (const token of SHOWN) {
      const [light, dark] = branches(vars.get(token));
      assert.match(sheet, new RegExp(`<dt>${escape(token)}</dt>\\s*<dd>${escape(light)} / ${escape(dark)}</dd>`), `${name}: ${token} diff drifted`);
    }
    assert.match(sheet, new RegExp(`\\+${vars.size - SHOWN.length} more in variants/${name}\\.css`), `${name}: override count drifted`);
  });
}

test("indigo sheet is canonical", () => {
  assert.match(sheetMarkup("indigo"), /canonical, 0 overrides/);
});
