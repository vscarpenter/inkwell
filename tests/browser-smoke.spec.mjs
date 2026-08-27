import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { expect, test } = require("playwright/test");

const criticalPages = [
  "/examples/",
  "/examples/preview.html",
  "/examples/components.html",
  "/examples/docs.html",
  "/examples/app-shell.html",
  "/examples/forms.html",
  "/examples/tailwind.html",
  "/examples/variants/compare.html",
];

for (const path of criticalPages) {
  test(`${path} has a clean runtime and page-width layout`, async ({ page }) => {
    const errors = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));

    await page.goto(path);
    await expect(page.locator("main#main-content")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator('a.skip-link[href="#main-content"]')).toHaveCount(1);

    const width = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
    expect(width.scroll, `${path} overflows by ${width.scroll - width.client}px`).toBeLessThanOrEqual(width.client);
    expect(errors).toEqual([]);
  });
}

test("shared interactions maintain keyboard and ARIA state", async ({ page }) => {
  await page.goto("/examples/preview.html");

  const firstTab = page.locator('[role="tab"]').first();
  await firstTab.focus();
  await page.keyboard.press("ArrowRight");
  const secondTab = page.locator('[role="tab"]').nth(1);
  await expect(secondTab).toBeFocused();
  await expect(secondTab).toHaveAttribute("aria-selected", "true");
  const panelId = await secondTab.getAttribute("aria-controls");
  await expect(page.locator(`#${panelId}`)).toBeVisible();

  const carousel = page.locator("[data-carousel]").first();
  await expect(carousel.locator(".carousel-controls")).toBeVisible();
  await expect(carousel.locator(".carousel-dot")).toHaveCount(3);
  await carousel.locator("[data-carousel-next]").click();
  await expect(carousel.locator(".carousel-dot").nth(1)).toHaveAttribute("aria-current", "true");

  await page.locator("#pv-open-dlg").click();
  await expect(page.locator("#pv-dialog")).toHaveJSProperty("open", true);
  await page.keyboard.press("Escape");
  await expect(page.locator("#pv-open-dlg")).toBeFocused();
});

test("theme and palette choices update the document and theme color", async ({ page }) => {
  await page.goto("/examples/components.html");
  await page.locator('[data-theme-choice="dark"]').click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  const before = await page.locator('meta[name="theme-color"]').getAttribute("content");

  await page.locator('[data-palette-choice="azure"]').click();
  await expect(page.locator("#inkwell-palette-css")).toHaveAttribute("href", /azure\.css/);
  await page.waitForFunction((color) => document.querySelector('meta[name="theme-color"]')?.content !== color, before);
});

test("invalid examples expose their error relationship", async ({ page }) => {
  await page.goto("/examples/forms.html");
  const invalid = page.locator(".is-error");
  await expect(invalid).toHaveAttribute("aria-invalid", "true");
  const errorId = await invalid.getAttribute("aria-describedby");
  expect(errorId).toBeTruthy();
  await expect(page.locator(`#${errorId}`)).toBeVisible();
});

test("coarse-pointer controls meet the 44px target floor", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("mobile"), "coarse-pointer assertion");
  await page.goto("/examples/preview.html");
  for (const selector of [".btn-sm", ".input", ".code-block .copy", ".carousel-btn", ".carousel-dot"]) {
    const box = await page.locator(selector).first().boundingBox();
    expect(box, `${selector} must render`).toBeTruthy();
    expect(box.height, `${selector} height`).toBeGreaterThanOrEqual(44);
    expect(box.width, `${selector} width`).toBeGreaterThanOrEqual(44);
  }
});
