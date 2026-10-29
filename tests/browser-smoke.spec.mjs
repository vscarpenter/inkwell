import { createRequire } from "node:module";
import { readdirSync } from "node:fs";

const require = createRequire(import.meta.url);
const { expect, test } = require("playwright/test");

const referencePages = [
  ...readdirSync(new URL("../examples/", import.meta.url)).filter((name) => name.endsWith(".html")).map((name) => `/examples/${name}`),
  ...readdirSync(new URL("../examples/variants/", import.meta.url)).filter((name) => name.endsWith(".html")).map((name) => `/examples/variants/${name}`),
].sort();

for (const path of referencePages) {
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

    const tooltipTrigger = page.locator('.tooltip:is(button, a[href]), .tooltip :is(button, a[href])').first();
    if (await tooltipTrigger.count()) {
      await tooltipTrigger.focus();
      const hintOpacity = () => tooltipTrigger.evaluate((el) => getComputedStyle(el.closest(".tooltip"), "::after").opacity);
      await expect.poll(hintOpacity).toBe("1");
      const visibleWidth = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
      expect(visibleWidth.scroll, `${path} overflows with a visible hint`).toBeLessThanOrEqual(visibleWidth.client);
      await page.keyboard.press("Escape");
      await expect.poll(hintOpacity).toBe("0");
    }

    for (const mode of ["light", "dark", "auto"]) {
      await test.step(`${mode} mode`, async () => {
        await page.evaluate((theme) => {
          if (theme === "auto") document.documentElement.removeAttribute("data-theme");
          else document.documentElement.setAttribute("data-theme", theme);
        }, mode);
        const width = await page.evaluate(() => ({
          scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth,
          outside: Array.from(document.querySelectorAll("main *")).filter((el) => el.getBoundingClientRect().right > document.documentElement.clientWidth).slice(0, 5).map((el) => ({ tag: el.tagName, class: el.className, right: el.getBoundingClientRect().right })),
        }));
        expect(width.scroll, `${path} overflows in ${mode}: ${JSON.stringify(width)}`).toBeLessThanOrEqual(width.client);
      });
    }
    expect(errors).toEqual([]);
  });
}

test("all reference pages reflow at 200% and 400% layout-equivalent widths", async ({ page }) => {
  test.setTimeout(120_000);
  const failures = [];
  // A 1280px desktop at 200%/400% browser zoom exposes 640/320 CSS pixels.
  // This tests layout equivalence; native browser zoom is reviewed separately.
  for (const width of [640, 320]) {
    await page.setViewportSize({ width, height: 812 });
    for (const path of referencePages) {
      await test.step(`${path} at ${width}px`, async () => {
        await page.goto(path);
        const size = await page.evaluate(() => ({
          scroll: document.documentElement.scrollWidth,
          client: document.documentElement.clientWidth,
          outside: Array.from(document.querySelectorAll("main *")).filter((el) => {
            if (el.getBoundingClientRect().right <= document.documentElement.clientWidth) return false;
            for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
              if (["auto", "hidden", "scroll", "clip"].includes(getComputedStyle(p).overflowX)) return false;
            }
            return true;
          }).slice(0, 6).map((el) => `${el.tagName}.${el.className}`),
        }));
        if (size.scroll > size.client) failures.push({ path, width, ...size });
      });
    }
  }
  expect(failures, "All reference routes must reflow").toEqual([]);
});

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

test("Tailwind semantic utilities render the shared surface and content tokens", async ({ page }) => {
  await page.goto("/examples/tailwind.html");
  const panel = page.locator("[data-semantic-token-demo]");
  const expected = await page.evaluate(() => {
    const probe = document.createElement("span");
    probe.style.cssText = "background: var(--surface-panel); color: var(--text-primary)";
    document.body.appendChild(probe);
    const result = { background: getComputedStyle(probe).backgroundColor, color: getComputedStyle(probe).color };
    probe.remove();
    return result;
  });
  await expect(panel).toHaveCSS("background-color", expected.background);
  await expect(panel).toHaveCSS("color", expected.color);
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
