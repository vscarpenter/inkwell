#!/usr/bin/env node
// Regenerate the releases section of examples/changelog.html from CHANGELOG.md.
//
// Usage:
//   node scripts/build-changelog-html.mjs           # rewrite the generated region
//   node scripts/build-changelog-html.mjs --check   # exit 1 if the page is stale (CI guardrail)
//
// The page's chrome (head pre-paint snippet, navbar, footer) stays hand-authored
// and shared with the other example pages; this script owns ONLY the region
// between the BEGIN/END markers below. Zero dependencies — Node 18+ built-ins.

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const CHANGELOG = resolve(ROOT, "CHANGELOG.md");
const PAGE = resolve(ROOT, "examples/changelog.html");

const BEGIN = "<!-- BEGIN GENERATED: releases — edit CHANGELOG.md and run scripts/build-changelog-html.mjs -->";
const END = "<!-- END GENERATED: releases -->";
const REPO_BLOB = "https://github.com/vscarpenter/inkwell/blob/main/";

// ---------------------------------------------------------------------------
// 1. Parse CHANGELOG.md into releases → sections → blocks.
//    Blocks are { type: "list", items } | { type: "para", text } | { type: "table", rows }.
//    Bullets in this changelog are single-line by convention.
// ---------------------------------------------------------------------------

function parseChangelog(md) {
  const releases = [];
  let release = null;
  let blocks = null; // current block target: release.intro or section.blocks
  let block = null;  // open block within `blocks`

  const closeBlock = () => { block = null; };

  for (const line of md.split("\n")) {
    const rel = line.match(/^## \[([^\]]+)\](?:\s*—\s*(\S+))?\s*$/);
    if (rel) {
      release = { version: rel[1], date: rel[2] ?? "", intro: [], sections: [] };
      releases.push(release);
      blocks = release.intro;
      closeBlock();
      continue;
    }
    if (!release) continue; // file preamble
    if (/^---\s*$/.test(line)) { release = null; blocks = null; closeBlock(); continue; } // footer rule

    const sec = line.match(/^### (.+)$/);
    if (sec) {
      const section = { label: sec[1].trim(), blocks: [] };
      release.sections.push(section);
      blocks = section.blocks;
      closeBlock();
      continue;
    }
    if (/^\s*$/.test(line)) { closeBlock(); continue; }

    if (line.startsWith("- ")) {
      if (!block || block.type !== "list") { block = { type: "list", items: [] }; blocks.push(block); }
      block.items.push(line.slice(2).trim());
    } else if (line.startsWith("|")) {
      if (!block || block.type !== "table") { block = { type: "table", rows: [] }; blocks.push(block); }
      if (!/^\|[\s-|]+\|$/.test(line)) { // skip the |---|---| separator row
        block.rows.push(line.replace(/^\||\|$/g, "").split("|").map((c) => c.trim()));
      }
    } else {
      if (!block || block.type !== "para") { block = { type: "para", text: "" }; blocks.push(block); }
      block.text = (block.text ? block.text + " " : "") + line.trim();
    }
  }
  return releases;
}

// ---------------------------------------------------------------------------
// 2. Inline markdown → HTML. Code spans are tokenized first so bold/italic/link
//    conversion can't reach inside them (e.g. `*:focus-visible`).
// ---------------------------------------------------------------------------

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function resolveHref(href) {
  if (/^(https?:)?\/\//.test(href) || href.startsWith("#")) return href;
  if (href.startsWith("examples/")) return href.slice("examples/".length); // page lives in examples/
  return REPO_BLOB + href; // repo-relative docs/CSS → GitHub blob view
}

function inline(md) {
  const codes = [];
  let s = md.replace(/`([^`]+)`/g, (_, c) => { codes.push(c); return `\u0000${codes.length - 1}\u0000`; });
  s = escapeHtml(s);
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, href) => `<a class="link" href="${resolveHref(href)}">${text}</a>`);
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  s = s.replace(/_\(([^_]+)\)_/g, "<em>($1)</em>");
  s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${escapeHtml(codes[+i])}</code>`);
  return s;
}

// ---------------------------------------------------------------------------
// 3. Render releases in the page's existing visual vocabulary
//    (.release / .ver / .change-block / .change-list / .tbl).
// ---------------------------------------------------------------------------

function renderBlocks(blocks, pad) {
  const out = [];
  for (const b of blocks) {
    if (b.type === "list") {
      out.push(`${pad}<ul class="change-list">`);
      for (const item of b.items) out.push(`${pad}  <li>${inline(item)}</li>`);
      out.push(`${pad}</ul>`);
    } else if (b.type === "para") {
      out.push(`${pad}<p class="change-note">${inline(b.text)}</p>`);
    } else if (b.type === "table") {
      const [head, ...body] = b.rows;
      out.push(`${pad}<div class="tbl-scroll">`);
      out.push(`${pad}  <table class="tbl">`);
      out.push(`${pad}    <thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead>`);
      out.push(`${pad}    <tbody>`);
      for (const row of body) out.push(`${pad}      <tr>${row.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`);
      out.push(`${pad}    </tbody>`);
      out.push(`${pad}  </table>`);
      out.push(`${pad}</div>`);
    }
  }
  return out;
}

function renderRelease(rel, isLatest) {
  const out = [];
  out.push(`      <article class="release">`);
  out.push(`        <div class="release-head">`);
  out.push(`          <span class="ver">${rel.version === "Unreleased" ? "Unreleased" : `v${escapeHtml(rel.version)}`}</span>`);
  if (rel.date) out.push(`          <span class="release-date">${escapeHtml(rel.date)}</span>`);
  if (isLatest) out.push(`          <span class="badge badge-accent">Latest</span>`);
  if (rel.version === "1.0.0") out.push(`          <span class="pill resolved">Initial release</span>`);
  out.push(`        </div>`);
  out.push(...renderBlocks(rel.intro, "        "));
  for (const section of rel.sections) {
    out.push(`        <div class="change-block">`);
    out.push(`          <div class="change-label">${escapeHtml(section.label)}</div>`);
    out.push(...renderBlocks(section.blocks, "          "));
    out.push(`        </div>`);
  }
  out.push(`      </article>`);
  return out.join("\n");
}

// ---------------------------------------------------------------------------
// 4. Footer version stamps. Every example-page footer carries
//    `<a … data-inkwell-version>Inkwell vX.Y.Z</a>`; this keeps the text in
//    sync with the latest released version in CHANGELOG.md.
// ---------------------------------------------------------------------------

const STAMP_RE = /(<a [^>]*data-inkwell-version[^>]*>)[^<]*(<\/a>)/;

function stampVersion(html, version) {
  return html.replace(STAMP_RE, `$1Inkwell v${version}$2`);
}

function latestVersion(releases) {
  const released = releases.find((r) => r.version !== "Unreleased");
  if (!released) throw new Error("no released version found in CHANGELOG.md");
  return released.version;
}

// ---------------------------------------------------------------------------
// 5. Splice the releases between the markers and stamp footers.
//    --check diffs instead of writing.
// ---------------------------------------------------------------------------

function main() {
  const check = process.argv.includes("--check");
  const releases = parseChangelog(readFileSync(CHANGELOG, "utf8"))
    .filter((r) => r.intro.length || r.sections.length); // drop an empty [Unreleased]
  const version = latestVersion(releases);

  const stale = [];
  const writes = [];

  // The changelog page gets the releases region + its own footer stamp.
  const page = readFileSync(PAGE, "utf8");
  const begin = page.indexOf(BEGIN);
  const end = page.indexOf(END);
  if (begin === -1 || end === -1 || end < begin) {
    throw new Error(`marker comments not found in examples/changelog.html — expected "${BEGIN}" … "${END}"`);
  }
  const releasesHtml = releases.map((r, i) => renderRelease(r, i === 0)).join("\n\n");
  const nextPage = stampVersion(
    page.slice(0, begin + BEGIN.length) + "\n" + releasesHtml + "\n      " + page.slice(end),
    version);
  if (nextPage !== page) (check ? stale : writes).push([PAGE, nextPage]);

  // Every other example page only gets the footer stamp.
  for (const name of readdirSync(resolve(ROOT, "examples")).filter((f) => f.endsWith(".html")).sort()) {
    const file = resolve(ROOT, "examples", name);
    if (file === PAGE) continue;
    const html = readFileSync(file, "utf8");
    if (!STAMP_RE.test(html)) continue;
    const next = stampVersion(html, version);
    if (next !== html) (check ? stale : writes).push([file, next]);
  }

  if (check) {
    if (!stale.length) { console.log(`examples changelog + version stamps are up to date (v${version})`); return; }
    console.error("stale generated content — run `node scripts/build-changelog-html.mjs` and commit the result:");
    for (const [file] of stale) console.error(`  ${file}`);
    process.exit(1);
  }
  for (const [file, content] of writes) writeFileSync(file, content);
  const count = (nextPage.match(/<article class="release">/g) || []).length;
  console.log(`wrote ${writes.length} file(s) — ${count} releases, version stamp v${version}`);
}

main();
