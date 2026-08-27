#!/usr/bin/env node
// Repository-wide adoption contract for Inkwell.
// Zero dependencies; run with Node 18+.

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const VERSION = "3.5.0";
const failures = [];

function fail(scope, message) {
  failures.push(`${scope}: ${message}`);
}

function read(relativePath) {
  const absolutePath = resolve(ROOT, relativePath);
  if (!existsSync(absolutePath)) {
    fail(relativePath, "missing file");
    return "";
  }
  return readFileSync(absolutePath, "utf8");
}

function count(source, pattern) {
  return [...source.matchAll(pattern)].length;
}

function attr(tag, name) {
  const match = tag.match(new RegExp(`\\s${name}=(?:"([^"]*)"|'([^']*)')`, "i"));
  return match ? match[1] ?? match[2] : null;
}

// Release identity and distributable mirror parity.
for (const file of ["inkwell.css", "tokens.css", "inkwell-tokens.css", "inkwell-components.css", "inkwell-theme.css", "inkwell-interactions.js"]) {
  const source = read(file);
  if (source && !source.includes(`Version: ${VERSION}`)) fail(file, `header must identify Version: ${VERSION}`);
  const mirror = read(`examples/${file}`);
  if (source && mirror && source !== mirror) fail(`examples/${file}`, `must be byte-identical to ${file}`);
}

const changelog = read("CHANGELOG.md");
if (!changelog.includes(`## [${VERSION}] — 2026-08-27`)) fail("CHANGELOG.md", `missing ${VERSION} release section`);

const agentInstructions = read("agent-instructions.md");
if (!agentInstructions.includes(`/inkwell/v${VERSION}/inkwell.css`)) fail("agent-instructions.md", `raw install URL must pin v${VERSION}`);
if (/\/inkwell\/v3\.0\.1\//.test(agentInstructions)) fail("agent-instructions.md", "still pins v3.0.1");

// Machine-readable component catalog and CSS/JS coverage.
const manifestSource = read("component-manifest.json");
if (manifestSource) {
  try {
    const manifest = JSON.parse(manifestSource);
    if (manifest.version !== VERSION) fail("component-manifest.json", `version must be ${VERSION}`);
    if (!Array.isArray(manifest.components) || manifest.components.length < 30) {
      fail("component-manifest.json", "must catalog at least 30 public component families");
    } else {
      const publicSource = `${read("inkwell-components.css")}\n${read("inkwell-interactions.js")}`;
      const ids = new Set();
      for (const component of manifest.components) {
        if (!component.id || ids.has(component.id)) fail("component-manifest.json", `duplicate or missing component id: ${component.id ?? "(missing)"}`);
        ids.add(component.id);
        for (const field of ["name", "since", "anatomy", "accessibility", "javascript", "markup"]) {
          if (!component[field] || (Array.isArray(component[field]) && !component[field].length)) {
            fail(`component-manifest.json#${component.id}`, `missing ${field}`);
          }
        }
        if (!Array.isArray(component.selectors) || !component.selectors.length) {
          fail(`component-manifest.json#${component.id}`, "missing selectors");
        } else {
          for (const selector of component.selectors) {
            if (!publicSource.includes(selector)) fail(`component-manifest.json#${component.id}`, `selector not found in public source: ${selector}`);
          }
        }
      }
    }
  } catch (error) {
    fail("component-manifest.json", `invalid JSON: ${error.message}`);
  }
}

const generatedReference = read("examples/components.html");
if (generatedReference && !generatedReference.includes("BEGIN GENERATED COMPONENT REFERENCE")) {
  fail("examples/components.html", "missing generated reference marker");
}

// Every Pages document is a usable reference page.
const htmlFiles = existsSync(resolve(ROOT, "examples"))
  ? [
      ...readdirSync(resolve(ROOT, "examples"))
        .filter((name) => extname(name) === ".html")
        .map((name) => `examples/${name}`),
      ...readdirSync(resolve(ROOT, "examples/variants"))
        .filter((name) => extname(name) === ".html")
        .map((name) => `examples/variants/${name}`),
    ].sort()
  : [];

for (const file of htmlFiles) {
  const html = read(file);
  const route = relative(resolve(ROOT, "examples"), resolve(ROOT, file)).replaceAll("\\", "/");
  const canonical = route === "index.html" ? "https://inkwell.vinny.dev/" : `https://inkwell.vinny.dev/${route}`;

  if (count(html, /<main\b/gi) !== 1) fail(file, "must contain exactly one main landmark");
  if (!/<main\b[^>]*\bid=["']main-content["']/i.test(html)) fail(file, "main landmark must use id=\"main-content\"");
  if (count(html, /<h1\b/gi) !== 1) fail(file, "must contain exactly one h1");
  if (!/<a\b[^>]*class=["'][^"']*\bskip-link\b[^"']*["'][^>]*href=["']#main-content["']/i.test(html)
      && !/<a\b[^>]*href=["']#main-content["'][^>]*class=["'][^"']*\bskip-link\b/i.test(html)) {
    fail(file, "must provide a skip link to #main-content");
  }
  if (!/<meta\b[^>]*name=["']theme-color["'][^>]*content=["'][^"']+["']/i.test(html)) fail(file, "missing theme-color metadata");
  if (!html.includes(`<link rel="canonical" href="${canonical}">`)) fail(file, `canonical URL must be ${canonical}`);
  if (count(html, /data-inkwell-version/g) !== 1) fail(file, "must contain one data-inkwell-version marker");
  if (count(html, /data-inkwell-deployed/g) !== 1) fail(file, "must contain one data-inkwell-deployed marker");
  if (!new RegExp(`data-inkwell-version[^>]*>Inkwell v${VERSION.replaceAll(".", "\\.")}<`).test(html)) {
    fail(file, `footer must identify Inkwell v${VERSION}`);
  }

  const idValues = new Set([...html.matchAll(/\bid=["']([^"']+)["']/gi)].map((match) => match[1]));
  for (const match of html.matchAll(/<(?:input|textarea|select)\b[^>]*class=["'][^"']*\bis-error\b[^"']*["'][^>]*>/gi)) {
    const control = match[0];
    if (attr(control, "aria-invalid") !== "true") fail(file, `.is-error control must set aria-invalid="true": ${control.slice(0, 100)}`);
    const describedBy = attr(control, "aria-describedby");
    if (!describedBy) fail(file, ".is-error control must reference error copy with aria-describedby");
    else for (const id of describedBy.split(/\s+/)) if (!idValues.has(id)) fail(file, `aria-describedby references missing id: ${id}`);
  }

  // Validate actual local asset/navigation targets. Ignore fragments, schemes,
  // generated code examples, and remote canonical/social links.
  const markupOnly = html.replace(/<pre\b[\s\S]*?<\/pre>/gi, "");
  for (const match of markupOnly.matchAll(/<(?:a|link|script|img|iframe)\b[^>]*(?:href|src)=["']([^"']+)["'][^>]*>/gi)) {
    const target = match[1];
    if (!target || /^(?:#|[a-z]+:|\/\/)/i.test(target)) continue;
    const cleanTarget = target.split(/[?#]/)[0];
    if (!cleanTarget) continue;
    const resolvedTarget = resolve(ROOT, dirname(file), cleanTarget);
    if (!existsSync(resolvedTarget)) fail(file, `local target does not exist: ${target}`);
  }
}

const docsDemo = read("examples/docs.html");
for (const stale of ["Version 1.1", "same two CSS files", "None of them require JavaScript except", "tokens.css</code> (the spec)"]) {
  if (docsDemo.includes(stale)) fail("examples/docs.html", `stale claim remains: ${stale}`);
}

const tailwind = read("inkwell-theme.css");
if (!tailwind.includes("@utility border-inkwell")) fail("inkwell-theme.css", "missing preferred border-inkwell utility");
if (!tailwind.includes("@utility border-hair")) fail("inkwell-theme.css", "legacy border-hair alias must remain through 3.x");
for (const token of ["--content-narrow", "--content-default", "--content-wide"]) {
  if (!tailwind.includes(`var(${token})`)) fail("inkwell-theme.css", `container aliases must reference ${token}`);
}

if (failures.length) {
  console.error(`system contract: ${failures.length} failure${failures.length === 1 ? "" : "s"}\n`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(`system contract: ${htmlFiles.length} pages, manifest, mirrors, metadata, and release v${VERSION} pass`);
