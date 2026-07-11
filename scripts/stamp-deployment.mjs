#!/usr/bin/env node
// Stamp every deployed HTML page with a commit-derived build number and
// deployment timestamp. The checked-in pages keep stable placeholders;
// GitHub Pages runs this against its artifact copy, never the source tree.
//
// Usage:
//   node scripts/stamp-deployment.mjs --check
//   node scripts/stamp-deployment.mjs --root examples --build 47 --date 2026-07-11T15:00:00Z

import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..");
const CHANGELOG = resolve(REPO_ROOT, "CHANGELOG.md");
const SOURCE_VERSION_RE = /<a\b[^>]*\bdata-inkwell-version\b[^>]*>Inkwell v([^<]+)<\/a>/g;
const DEPLOYED_RE = /<time([^>]*\bdata-inkwell-deployed\b[^>]*)>([^<]*)<\/time>/g;

function arg(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1];
}

function latestVersion() {
  const changelog = readFileSync(CHANGELOG, "utf8");
  const match = changelog.match(/^## \[(?!Unreleased\])([^\]]+)\]/m);
  if (!match) throw new Error("no released version found in CHANGELOG.md");
  return match[1];
}

function htmlFiles(root) {
  const files = [];
  for (const name of readdirSync(root).sort()) {
    const path = resolve(root, name);
    if (statSync(path).isDirectory()) files.push(...htmlFiles(path));
    else if (name.endsWith(".html")) files.push(path);
  }
  return files;
}

function matchCount(text, pattern) {
  return Array.from(text.matchAll(pattern)).length;
}

function formatDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function validateSource(file, html, version) {
  const errors = [];
  const versions = Array.from(html.matchAll(SOURCE_VERSION_RE));
  const deployments = Array.from(html.matchAll(DEPLOYED_RE));
  if (versions.length !== 1) errors.push(`expected one data-inkwell-version marker, found ${versions.length}`);
  else if (versions[0][1] !== version) errors.push(`expected source version ${version}, found ${versions[0][1]}`);
  if (deployments.length !== 1) errors.push(`expected one data-inkwell-deployed marker, found ${deployments.length}`);
  else {
    if (deployments[0][2] !== "Deployment pending") errors.push(`expected deployment placeholder, found "${deployments[0][2]}"`);
    if (!/\bdatetime=""/.test(deployments[0][1])) errors.push("expected an empty source datetime attribute");
  }
  return errors.map((message) => `${file}: ${message}`);
}

function stamp(html, version, build, deployedAt) {
  const visibleVersion = `${version}+build.${build}`;
  const iso = deployedAt.toISOString().replace(/\.000Z$/, "Z");
  const label = `Deployed ${formatDate(deployedAt)}`;

  let next = html.replace(SOURCE_VERSION_RE, (whole, _current) =>
    whole.replace(/>Inkwell v[^<]+<\/a>$/, `>Inkwell v${visibleVersion}</a>`));

  next = next.replace(DEPLOYED_RE, (_whole, attributes) => {
    const stampedAttributes = /\bdatetime="[^"]*"/.test(attributes)
      ? attributes.replace(/\bdatetime="[^"]*"/, `datetime="${iso}"`)
      : `${attributes} datetime="${iso}"`;
    return `<time${stampedAttributes}>${label}</time>`;
  });
  return next;
}

function main() {
  const check = process.argv.includes("--check");
  const root = resolve(arg("--root") ?? resolve(REPO_ROOT, "examples"));
  const files = htmlFiles(root);
  const version = latestVersion();

  if (!files.length) throw new Error(`no HTML files found under ${root}`);

  if (check) {
    const errors = files.flatMap((file) => validateSource(file, readFileSync(file, "utf8"), version));
    if (errors.length) {
      console.error("deployment metadata check failed:");
      for (const error of errors) console.error(`  ${error}`);
      process.exit(1);
    }
    console.log(`deployment metadata placeholders are valid (${files.length} pages, v${version})`);
    return;
  }

  const build = arg("--build");
  const dateArg = arg("--date");
  if (!build || !/^\d+$/.test(build) || Number(build) < 1) throw new Error("--build must be a positive integer");
  if (!dateArg) throw new Error("--date is required");
  const deployedAt = new Date(dateArg);
  if (Number.isNaN(deployedAt.getTime())) throw new Error(`invalid --date value: ${dateArg}`);

  for (const file of files) {
    const html = readFileSync(file, "utf8");
    const errors = validateSource(file, html, version);
    if (errors.length) throw new Error(errors.join("\n"));
    const next = stamp(html, version, build, deployedAt);
    if (matchCount(next, SOURCE_VERSION_RE) !== 1 || matchCount(next, DEPLOYED_RE) !== 1)
      throw new Error(`${file}: deployment stamping did not preserve metadata markers`);
    writeFileSync(file, next);
  }
  console.log(`stamped ${files.length} pages — Inkwell v${version}+build.${build}, deployed ${formatDate(deployedAt)} UTC`);
}

main();
