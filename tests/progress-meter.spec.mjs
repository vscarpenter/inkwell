import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { expect, test } = require("playwright/test");

async function render(page, { dir = "ltr", palette = "indigo", theme = "light", root = 16 } = {}) {
  await page.goto("/inkwell.css");
  await page.setContent(`<!doctype html><html lang="en" dir="${dir}" data-theme="${theme}">
    <head><link rel="stylesheet" href="/inkwell.css">
    ${palette === "indigo" ? "" : `<link rel="stylesheet" href="/variants/${palette}.css">`}
    <style>html { font-size: ${root}px; } body { padding: 16px; } main { inline-size: 240px; max-inline-size: 100%; } .field + .field { margin-block-start: 24px; }</style></head>
    <body><main>
      <button type="button" id="before">Before</button>
      <div class="field"><label class="field-label" for="upload">Upload</label>
        <progress class="progress" id="upload" max="100" value="25" aria-describedby="upload-value"></progress>
        <span class="field-help" id="upload-value">25%</span></div>
      <div class="field"><label class="field-label" for="preparing">Preparing upload</label>
        <progress class="progress" id="preparing" aria-describedby="preparing-value"></progress>
        <span class="field-help" id="preparing-value">Discovering files…</span></div>
      <div class="field"><label class="field-label" for="storage">Storage</label>
        <meter class="meter" id="storage" min="0" max="100" low="60" high="85" optimum="20" value="40" aria-describedby="storage-value"></meter>
        <span class="field-help" id="storage-value">40 GB of 100 GB · Within capacity</span></div>
      <button type="button" id="after">After</button>
    </main></body></html>`);
  await expect(page.locator(".progress").first()).toHaveCSS("display", "block");
}

// Sample rendered pixels, not just computed vendor pseudo-element styles:
// Chromium can report styled meter fills even when its inner element is hidden.
async function pixel(page, locator, fraction) {
  const box = await locator.boundingBox();
  return page.screenshot({ clip: { x: Math.floor(box.x + box.width * fraction), y: Math.floor(box.y + box.height / 2), width: 1, height: 1 } });
}

test("native labels, ranges, and value updates work without JavaScript enhancement", async ({ page }) => {
  await render(page);
  const upload = page.getByRole("progressbar", { name: "Upload", exact: true });
  await expect(upload).toHaveAccessibleDescription("25%");
  await expect(upload).toHaveJSProperty("position", 0.25);
  await expect(page.getByRole("progressbar", { name: "Preparing upload" })).toHaveJSProperty("position", -1);
  const meter = page.getByRole("meter", { name: "Storage" });
  await expect(meter).toHaveJSProperty("min", 0);
  await expect(meter).toHaveJSProperty("max", 100);
  for (const value of [0, 60, 85, 100]) {
    await upload.evaluate((el, value) => { el.value = value; }, value);
    await expect(upload).toHaveJSProperty("position", value / 100);
  }
  await upload.evaluate((el) => el.removeAttribute("value"));
  await expect(upload).toHaveJSProperty("position", -1);
  await upload.evaluate((el) => { el.value = 0; });
  await expect(upload).toHaveJSProperty("position", 0);
  await page.locator("#before").focus();
  await page.keyboard.press("Tab");
  await expect(page.locator("#after")).toBeFocused();
});

for (const dir of ["ltr", "rtl"]) {
  test(`native fills paint from inline start in ${dir}`, async ({ page }) => {
    await render(page, { dir });
    for (const selector of ["#upload", "#storage"]) {
      const control = page.locator(selector);
      await control.evaluate((el) => { el.value = 0; });
      const empty = await pixel(page, control, 0.25);
      await control.evaluate((el) => { el.value = 100; });
      const full = await pixel(page, control, 0.25);
      expect(full.equals(empty), `${selector} must paint its fill`).toBe(false);
      await control.evaluate((el) => { el.value = 50; });
      const start = await pixel(page, control, dir === "ltr" ? 0.25 : 0.75);
      const end = await pixel(page, control, dir === "ltr" ? 0.75 : 0.25);
      expect(start.equals(end), `${selector} must distinguish used from remaining`).toBe(false);
      // Meter changes its range color as well as its value; compare with the
      // same range at 50 rather than the 100 (least-good) reference.
      expect(end.equals(empty), `${selector} remaining track`).toBe(true);
    }
  });
}

test("meter thresholds paint distinct native states and update from attributes", async ({ page }) => {
  await render(page);
  const meter = page.locator("#storage");
  const colors = [];
  for (const value of [40, 70, 95]) {
    await meter.evaluate((el, value) => { el.value = value; }, value);
    colors.push((await pixel(page, meter, 0.1)).toString("base64"));
  }
  expect(new Set(colors).size).toBe(3);
  // The optimal end can be high (e.g. battery); native threshold selection
  // must change without requiring an author-maintained CSS state class.
  await meter.evaluate((el) => { el.optimum = 95; });
  expect((await pixel(page, meter, 0.1)).toString("base64")).toBe(colors[0]);
});

test("all palettes and modes fit narrow containers with enlarged text", async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 320, height: 812 });
  for (const palette of ["indigo", "clay", "sage", "burgundy", "azure"]) {
    for (const theme of ["light", "dark"]) {
      await render(page, { palette, theme, root: 32, dir: "rtl" });
      const sizes = await page.locator("main").evaluate((el) => ({ width: el.clientWidth, scroll: el.scrollWidth }));
      expect(sizes.scroll, `${palette}/${theme}`).toBeLessThanOrEqual(sizes.width);
      for (const selector of ["#upload", "#storage"]) {
        const control = page.locator(selector);
        await expect(control).toHaveCSS("height", "24px");
        expect((await pixel(page, control, 0.95)).equals(await pixel(page, control, 0.05))).toBe(false);
      }
    }
  }
});

test("indeterminate progress retains a visible stationary segment under reduced motion and print", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await render(page);
  const progress = page.locator("#preparing");
  const frame = await progress.screenshot();
  // Yield two browser frames; no fixed sleeps or timing-sensitive animation snapshot.
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  expect((await progress.screenshot()).equals(frame)).toBe(true);
  expect((await pixel(page, progress, 0.5)).equals(await pixel(page, progress, 0.05))).toBe(false);
  await page.emulateMedia({ media: "print", reducedMotion: "no-preference" });
  expect((await pixel(page, progress, 0.5)).equals(await pixel(page, progress, 0.05))).toBe(false);
});

test("forced colors restores native progress and meter rendering", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Forced-colors emulation is checked in Chromium.");
  await page.emulateMedia({ forcedColors: "active" });
  await render(page);
  for (const selector of ["#upload", "#storage"]) {
    const control = page.locator(selector);
    await expect(control).toHaveCSS("appearance", "auto");
    await control.evaluate((el) => { el.value = 0; });
    const empty = await control.screenshot();
    await control.evaluate((el) => { el.value = 100; });
    expect((await control.screenshot()).equals(empty)).toBe(false);
  }
});
