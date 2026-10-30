import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { expect, test } = require("playwright/test");

function card(value = "98%", label = "Deploy confidence", delta = "Up 4.2 from last run") {
  return `<article class="stat-card"><div class="stat-num">${value}</div><div class="stat-label">${label}</div><div class="stat-delta up">${delta}</div></article>`;
}

async function render(page, { root = 16, dir = "ltr", palette = "indigo", theme = "light" } = {}) {
  await page.goto("/inkwell.css");
  await page.setContent(`<!doctype html><html lang="en" dir="${dir}" data-theme="${theme}"><head>
    <meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/inkwell.css"><link rel="stylesheet" href="/examples/demo.css">
    ${palette === "indigo" ? "" : `<link rel="stylesheet" href="/variants/${palette}.css">`}
    <style>html { font-size: ${root}px; } body { padding: 16px; } main { min-inline-size: 0; }
      .host { inline-size: var(--host-width); max-inline-size: 100%; margin-block-end: 24px; }
    </style></head><body><main>
      <div class="host" style="--host-width: 900px"><div class="metric-grid" id="wide">${card()}${card("17", "Open checks")}${card("3", "Attention items")}</div></div>
      <div class="host" style="--host-width: 500px"><div class="metric-grid" id="medium">${card()}${card("17", "Open checks")}${card("3", "Attention items")}</div></div>
      <div class="host" style="--host-width: 220px"><div class="metric-grid" id="narrow">${card()}${card("17", "Open checks")}${card("3", "Attention items")}</div></div>
      <div class="host" id="single-host" style="--host-width: 220px">${card("1,248,320", "Processed events", "Up 12,408 since the previous release")}</div>
    </main></body></html>`);
  await expect(page.locator("#wide")).toHaveCSS("display", "grid");
  await expect(page.locator("html")).toHaveCSS("font-size", `${root}px`);
}

async function columns(page, id) {
  return page.locator(`#${id}`).evaluate(el => {
    const cards = [...el.children].map(child => child.getBoundingClientRect());
    return cards.filter(rect => Math.abs(rect.top - cards[0].top) < 1).length;
  });
}

test("metric groups reflow by available width rather than a viewport breakpoint", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await render(page);
  expect(await columns(page, "wide")).toBe(3);
  expect(await columns(page, "medium")).toBe(2);
  expect(await columns(page, "narrow")).toBe(1);
  await page.setViewportSize({ width: 640, height: 900 });
  expect(await columns(page, "medium")).toBe(2);
  expect(await columns(page, "narrow")).toBe(1);
  await page.locator("#narrow").locator("..").evaluate(el => el.style.inlineSize = "500px");
  expect(await columns(page, "narrow")).toBe(2);
});

test("stat numbers follow their own card width and retain tabular figures", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await render(page);
  const font = selector => page.locator(selector).evaluate(el => parseFloat(getComputedStyle(el).fontSize));
  const narrow = await font("#single-host .stat-num");
  expect(await font("#wide .stat-card:first-child .stat-num")).toBeGreaterThan(narrow);
  await page.locator("main").evaluate(el => { el.style.container = "unrelated / inline-size"; });
  expect(await font("#single-host .stat-num")).toBeCloseTo(narrow, 2);
  await page.setViewportSize({ width: 640, height: 900 });
  expect(await font("#single-host .stat-num")).toBeCloseTo(narrow, 2);
  await expect(page.locator("#single-host .stat-num")).toHaveCSS("font-variant-numeric", "tabular-nums");
});

test("font preferences enlarge numbers and reduce the metric group's column count", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await render(page);
  const original = await page.locator("#single-host .stat-num").evaluate(el => parseFloat(getComputedStyle(el).fontSize));
  await page.locator("html").evaluate(el => { el.style.fontSize = "32px"; });
  expect(await columns(page, "wide")).toBe(1);
  expect(await page.locator("#single-host .stat-num").evaluate(el => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThan(original * 1.5);
  await expect(page.locator("#single-host .stat-num")).toHaveText("1,248,320");
});

test("long metrics and localized labels fit narrow hosts across palettes and directions", async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 320, height: 900 });
  const value = "CHF1234567890123456789.00";
  for (const palette of ["indigo", "clay", "sage", "burgundy", "azure"]) {
    for (const theme of ["light", "dark"]) {
      await render(page, { root: 32, palette, theme });
      for (const dir of ["ltr", "rtl"]) {
        await page.locator("html").evaluate((el, dir) => { el.dir = dir; el.lang = dir === "rtl" ? "ar" : "en"; }, dir);
        await page.locator("#single-host .stat-num").evaluate((el, value) => { el.textContent = value; el.dir = "ltr"; }, value);
        await page.locator("#single-host .stat-label").evaluate(el => { el.textContent = "المعاملات التي تمت معالجتها بنجاح"; el.lang = "ar"; });
        await page.locator("#single-host .stat-delta").evaluate(el => { el.textContent = "averylongunbrokencomparisonwiththepreviousreport"; });
        await expect.poll(() => page.locator(".stat-card, .stat-num, .stat-label, .stat-delta").evaluateAll(es => es.every(el => el.scrollWidth <= el.clientWidth + 1)), {message:`${palette}/${theme}/${dir}`}).toBe(true);
        await expect(page.locator("#single-host .stat-num")).toHaveText(value);
        await expect(page.locator("#single-host .stat-card")).toHaveCSS("overflow-x", "visible");
      }
    }
  }
});

test("stat cards grow in grid, flex, nested cards, print, and forced colors", async ({ page, browserName }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await render(page, { root: 32, dir: "rtl" });
  for (const layout of ["grid", "flex"]) {
    await page.locator("#single-host").evaluate((el, layout) => {
      el.style.display = layout;
      if (layout === "grid") el.style.gridTemplateColumns = "minmax(0, 1fr)";
      else el.firstElementChild.style.flex = "1 1 0";
    }, layout);
    expect(await page.locator("#single-host > .stat-card").evaluate(el => Math.round(el.getBoundingClientRect().width))).toBe(220);
  }
  await page.locator("#single-host").evaluate(el => {
    el.style.display = "block";
    const outer = el.firstElementChild;
    outer.append(document.querySelector("#narrow .stat-card"));
  });
  for (const media of ["screen", "print"]) {
    await page.emulateMedia({ media });
    expect(await page.locator("#single-host .stat-card").evaluateAll(es => es.every(el => {
      const bounds = el.getBoundingClientRect();
      return [...el.children].every(child => child.getBoundingClientRect().bottom <= bounds.bottom && child.scrollWidth <= child.clientWidth + 1);
    }))).toBe(true);
  }
  if (browserName === "chromium") {
    await page.emulateMedia({ media: "screen", forcedColors: "active" });
    await expect(page.locator("#single-host > .stat-card")).toHaveCSS("border-style", "solid");
  }
});

test("dashboard demonstrates wide and narrow metric groups and the showcase explains long values", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/examples/dashboard.html");
  expect(await columns(page, "release-metrics")).toBe(3);
  expect(await columns(page, "panel-metrics")).toBe(1);
  await page.goto("/preview.html#stat-cards");
  await expect(page.locator("#stat-card-narrow .stat-num")).toHaveText("1,248,320");
  await expect(page.locator("#stat-card-narrow")).toBeVisible();
});
