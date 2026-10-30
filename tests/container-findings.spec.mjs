import { createRequire } from "node:module";
import { readdirSync } from "node:fs";

const require = createRequire(import.meta.url);
const { expect, test } = require("playwright/test");
const routes = [
  ...readdirSync(new URL("../examples/", import.meta.url)).filter(name => name.endsWith(".html")).map(name => `/examples/${name}`),
  ...readdirSync(new URL("../examples/variants/", import.meta.url)).filter(name => name.endsWith(".html")).map(name => `/examples/variants/${name}`),
].sort();

function finding(id, number = "96%") {
  return `<article class="finding" id="${id}"><div class="finding-num">${number}</div>
    <div><p class="finding-text">The same finding remains readable in a narrow column or a full-width report.
    <cite class="finding-src"><a href="https://example.com/research/averylongunbrokensourcereference">Research notes and source</a></cite></p></div></article>`;
}

async function render(page, { root = 16, dir = "ltr", palette = "indigo", theme = "light" } = {}) {
  await page.goto("/inkwell.css");
  await page.setContent(`<!doctype html><html lang="en" dir="${dir}" data-theme="${theme}"><head>
    <meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/inkwell.css">
    ${palette === "indigo" ? "" : `<link rel="stylesheet" href="/variants/${palette}.css">`}
    <style>html { font-size: ${root}px; } body { padding: 16px; } main { min-inline-size: 0; }
      .host { inline-size: var(--host-width); max-inline-size: 100%; } .findings { margin: 0; padding: 0; }
    </style></head><body><main>
      <div class="host" style="--host-width: 820px"><div class="findings">${finding("wide")}</div></div>
      <div class="host" style="--host-width: 280px"><div class="findings">${finding("narrow")}</div></div>
      <div class="host" style="--host-width: 320px">${finding("standalone", "1/3")}</div>
    </main></body></html>`);
  await expect(page.locator("#wide")).toHaveCSS("display", "grid");
}

async function geometry(page, id) {
  return page.locator(`#${id}`).evaluate(el => {
    const [num, text] = el.children;
    const a = num.getBoundingClientRect(), b = text.getBoundingClientRect();
    return { number: { x: a.x, y: a.y, right: a.right, bottom: a.bottom }, text: { x: b.x, y: b.y, right: b.right },
      font: parseFloat(getComputedStyle(num).fontSize), width: el.clientWidth, scroll: el.scrollWidth };
  });
}

test("findings stack in narrow columns on a wide screen, including standalone markup", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await render(page);
  const wide = await geometry(page, "wide");
  expect(wide.number.y).toBeCloseTo(wide.text.y, 0);
  expect(wide.text.x - wide.number.x).toBeCloseTo(174, 0);
  for (const id of ["narrow", "standalone"]) {
    const result = await geometry(page, id);
    expect(result.text.y - result.number.bottom, id).toBeCloseTo(8, 0);
    expect(result.text.x, id).toBeCloseTo(result.number.x, 0);
    expect(result.scroll, id).toBeLessThanOrEqual(result.width);
  }
});

test("finding typography follows container width and remains stable across viewport changes", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await render(page);
  const first = await geometry(page, "standalone");
  expect((await geometry(page, "wide")).font).toBeGreaterThan(first.font);
  await page.setViewportSize({ width: 640, height: 900 });
  expect((await geometry(page, "standalone")).font).toBeCloseTo(first.font, 2);
});

test("nested findings measure themselves and ignore unrelated query containers", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await render(page);
  await page.locator("main").evaluate(el => {
    el.style.containerType = "inline-size";
    el.style.containerName = "unrelated";
    const inner = document.querySelector("#standalone").parentElement;
    document.querySelector("#wide > :last-child").append(inner);
  });
  const nested = await geometry(page, "standalone");
  expect(nested.text.y - nested.number.bottom).toBeCloseTo(8, 0);
  expect((await geometry(page, "wide")).text.y).toBeCloseTo((await geometry(page, "wide")).number.y, 0);
});

test("relative breakpoint, resizing, and RTL keep findings readable with enlarged text", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await render(page, { root: 32, dir: "rtl" });
  const enlarged = await geometry(page, "wide");
  expect(enlarged.text.y - enlarged.number.bottom).toBeCloseTo(8, 0);
  expect(enlarged.font).toBeGreaterThanOrEqual(88);
  await page.evaluate(() => { document.documentElement.style.fontSize = "16px"; });
  const rtlWide = await geometry(page, "wide");
  expect(rtlWide.number.y).toBeCloseTo(rtlWide.text.y, 0);
  expect(rtlWide.number.x).toBeGreaterThan(rtlWide.text.right);
  await page.locator("#wide").locator("..").locator("..").evaluate(el => el.style.inlineSize = "300px");
  const resized = await geometry(page, "wide");
  expect(resized.text.y - resized.number.bottom).toBeCloseTo(8, 0);
});

test("long metrics, source URLs, and all palettes fit narrow containers", async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 320, height: 900 });
  for (const palette of ["indigo", "clay", "sage", "burgundy", "azure"]) {
    for (const theme of ["light", "dark"]) {
      await render(page, { root: 32, dir: "rtl", palette, theme });
      await page.locator("#narrow .finding-num").evaluate(el => { el.textContent = "100,000,000"; });
      await page.locator("#narrow .finding-src a").evaluate(el => { el.textContent = el.href; });
      for (const id of ["wide", "narrow", "standalone"]) {
        const result = await geometry(page, id);
        expect(result.scroll, `${palette}/${theme}/${id}`).toBeLessThanOrEqual(result.width);
      }
    }
  }
});

for (const path of ["/index.html", "/examples/index.html"]) {
  test(`${path} links directly to every published example`, async ({ page }) => {
    await page.goto(path);
    if (path === "/index.html") {
      expect(await page.getByRole("link", { name: "Examples", exact: true }).count()).toBe(1);
      await page.getByRole("link", { name: "Examples", exact: true }).click();
      await page.locator("#examples summary").click();
    }
    const links = await page.locator("main a[href]").evaluateAll(anchors => anchors
      .filter(a => a.getClientRects().length)
      .map(a => new URL(a.href).pathname));
    expect(routes.filter(route => !links.includes(route))).toEqual([]);
  });
}
