#!/usr/bin/env node
// Generate the component catalog body in examples/components.html.
// Usage: node scripts/build-components-reference.mjs [--check]

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST = resolve(ROOT, "component-manifest.json");
const OUTPUT = resolve(ROOT, "examples/components.html");
const START = "<!-- BEGIN GENERATED COMPONENT REFERENCE -->";
const END = "<!-- END GENERATED COMPONENT REFERENCE -->";
const check = process.argv.includes("--check");

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function list(items) {
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function render(component, index) {
  const codeId = `component-code-${component.id}`;
  return `      <article class="reference-entry" id="${escapeHtml(component.id)}">
        <header class="reference-head">
          <div>
            <span class="eyebrow">${String(index + 1).padStart(2, "0")} · Since ${escapeHtml(component.since)}</span>
            <h2 class="t-h2">${escapeHtml(component.name)}</h2>
          </div>
          <a class="link t-small" href="#${escapeHtml(component.id)}">#${escapeHtml(component.id)}</a>
        </header>
        <p class="reference-selectors">${component.selectors.map((selector) => `<code>${escapeHtml(selector)}</code>`).join(" ")}</p>
        <div class="reference-contract">
          <section><h3 class="t-h3">Anatomy</h3>${list(component.anatomy)}</section>
          <section><h3 class="t-h3">Modifiers</h3>${list(component.modifiers || ["None."])}</section>
          <section><h3 class="t-h3">States</h3>${list(component.states || ["Default."])}</section>
          <section><h3 class="t-h3">Accessibility</h3>${list(component.accessibility)}</section>
        </div>
        <div class="alert is-info reference-js"><div><p class="alert-title">JavaScript contract</p><p class="alert-body">${escapeHtml(component.javascript)}</p></div></div>
        <div class="code-block">
          <button class="copy" type="button" data-copy-code="${codeId}">Copy markup</button>
          <pre><code id="${codeId}">${escapeHtml(component.markup)}</code></pre>
        </div>
      </article>`;
}

const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
const current = readFileSync(OUTPUT, "utf8");
const startIndex = current.indexOf(START);
const endIndex = current.indexOf(END);
if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
  throw new Error(`Could not find generated markers in ${OUTPUT}`);
}

const generated = `${START}\n${manifest.components.map(render).join("\n\n")}\n      ${END}`;
const next = `${current.slice(0, startIndex)}${generated}${current.slice(endIndex + END.length)}`;

if (check) {
  if (current !== next) {
    console.error("component reference check: examples/components.html is stale; run node scripts/build-components-reference.mjs");
    process.exit(1);
  }
  console.log(`component reference check: ${manifest.components.length} component families are current`);
} else {
  writeFileSync(OUTPUT, next);
  console.log(`component reference: rendered ${manifest.components.length} component families`);
}
