import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { expect, test } = require("playwright/test");
const palettes = ["indigo", "clay", "sage", "burgundy", "azure"];

async function render(page, palette) {
  await page.goto("/inkwell.css");
  await page.setContent(`<!doctype html><html lang="en"><head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="/inkwell.css">
    ${palette === "indigo" ? "" : `<link rel="stylesheet" href="/variants/${palette}.css">`}
    <style>body { padding: 16px; } .select { max-inline-size: 100%; }</style>
    </head><body><main>
      <label for="region">Region</label>
      <select class="select" id="region" name="region"><option value="north">North</option><option value="south">South</option></select>
      <button class="btn btn-primary">Save settings</button>
      <span id="neutral" hidden style="color: var(--gray-500)"></span>
      <span id="rest" hidden style="color: var(--accent)"></span>
      <span id="label" hidden style="color: var(--on-accent)"></span>
      <span id="hover" hidden style="color: var(--accent-d)"></span>
    </main></body></html>`);
  await expect(page.getByRole("combobox", { name: "Region" })).toHaveCSS("appearance", "none");
}

async function setTheme(page, theme, colorScheme) {
  await page.emulateMedia({ colorScheme });
  await page.evaluate(theme => {
    if (theme === "auto") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.dataset.theme = theme;
  }, theme);
}

function rgb(hex) {
  return `rgb(${[1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)).join(", ")})`;
}

async function chevronMatches(page) {
  const image = await page.locator(".select").evaluate(el => getComputedStyle(el).backgroundImage);
  const stroke = decodeURIComponent(image).match(/stroke=['"](#[0-9a-f]{6})['"]/i)?.[1];
  const neutral = await page.locator("#neutral").evaluate(el => getComputedStyle(el).color);
  return stroke ? rgb(stroke) === neutral : false;
}

function luminance(color) {
  const [r, g, b] = color.match(/[\d.]+/g).slice(0, 3).map(Number).map(channel => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

for (const palette of palettes) {
  test(`${palette} chevrons follow manual themes, OS changes, RTL, and print`, async ({ page }) => {
    await render(page, palette);
    for (const [theme, os] of [["light", "dark"], ["dark", "light"], ["auto", "dark"], ["auto", "light"]]) {
      await setTheme(page, theme, os);
      await expect.poll(() => chevronMatches(page), { message: `${palette}/${theme}/OS ${os}` }).toBe(true);
    }
    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
      document.documentElement.style.fontSize = "32px";
    });
    const select = page.getByRole("combobox", { name: "Region" });
    await expect(select).toHaveCSS("background-position-x", "12px");
    await expect(select).toHaveCSS("mask-image", "none");
    await select.selectOption("south");
    await expect(select).toHaveValue("south");
    expect(await select.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    for (const theme of ["dark", "auto"]) {
      await setTheme(page, theme, "dark");
      await page.emulateMedia({ media: "print" });
      await expect(select).toHaveCSS("background-image", "none");
      await page.emulateMedia({ media: "screen" });
      await expect.poll(() => chevronMatches(page)).toBe(true);
    }
  });
}

test("primary hover and press increase label contrast in every palette and mode", async ({ page }) => {
  test.setTimeout(60_000);
  for (const palette of palettes) {
    await render(page, palette);
    const button = page.getByRole("button", { name: "Save settings" });
    for (const theme of ["light", "dark"]) {
      await setTheme(page, theme, theme);
      await page.mouse.move(0, 0);
      const rest = await page.locator("#rest").evaluate(el => getComputedStyle(el).color);
      const onAccent = await page.locator("#label").evaluate(el => getComputedStyle(el).color);
      await expect(button).toHaveCSS("background-color", rest);
      await expect(button).toHaveCSS("color", onAccent);
      const resting = await button.evaluate(el => ({ background: getComputedStyle(el).backgroundColor, color: getComputedStyle(el).color }));
      const hover = await page.locator("#hover").evaluate(el => getComputedStyle(el).color);
      await button.hover();
      await expect(button).toHaveCSS("background-color", hover);
      const label = await button.evaluate(el => getComputedStyle(el).color);
      expect(contrast(hover, label), `${palette}/${theme} label`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(hover, label), `${palette}/${theme} hover`).toBeGreaterThan(contrast(resting.background, resting.color));
      if (theme === "dark") expect(luminance(hover)).toBeGreaterThan(luminance(resting.background));
      await page.mouse.down();
      await expect(button).toHaveCSS("background-color", hover);
      await page.mouse.up();
    }
  }
});

test("palette overrides preserve the native select in forced colors", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Forced-colors emulation is checked in Chromium.");
  for (const palette of palettes) {
    await render(page, palette);
    for (const theme of ["light", "dark"]) {
      await setTheme(page, theme, theme);
      await page.emulateMedia({ forcedColors: "active" });
      const select = page.getByRole("combobox", { name: "Region" });
      await expect(select).toHaveCSS("appearance", "auto");
      await expect(select).toHaveCSS("background-image", "none");
      await select.selectOption("south");
      await expect(select).toHaveValue("south");
      await page.emulateMedia({ forcedColors: "none" });
    }
  }
});
