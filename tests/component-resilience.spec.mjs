import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { expect, test } = require("playwright/test");

async function render(page, markup) {
  await page.goto("/inkwell.css");
  await page.setContent(`<!doctype html><html lang="en"><head>
    <link rel="stylesheet" href="/inkwell.css">
    <style>body { padding: 24px; } main { max-width: 640px; }</style>
    </head><body><main>${markup}</main></body></html>`);
  await page.addScriptTag({ url: "/inkwell-interactions.js" });
  await page.evaluate(() => window.InkwellInteractions.init());
}

test("text controls use functional borders and expose ARIA invalid styling", async ({ page }) => {
  await render(page, `<label class="checkbox"><input type="checkbox">Reference</label>
    <label>Email <input class="input" type="email"></label>
    <label>Notes <textarea class="textarea"></textarea></label>
    <label>Choice <select class="select"><option>One</option></select></label>
    <input class="input is-error" aria-label="Legacy error">
    <input class="input" aria-label="ARIA error" aria-invalid="true" aria-describedby="error">
    <p id="error" class="field-error">Enter a valid value.</p>`);
  const border = await page.locator(".checkbox input").evaluate((el) => getComputedStyle(el).borderColor);
  for (const selector of ["input[type=email]", ".textarea", ".select"]) {
    await expect(page.locator(selector)).toHaveCSS("border-color", border);
  }
  const errorBorder = await page.locator(".is-error").evaluate((el) => getComputedStyle(el).borderColor);
  await expect(page.getByLabel("ARIA error")).toHaveCSS("border-color", errorBorder);
});

test("forced colors preserve native selection controls and select affordance", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Forced-colors emulation is checked in Chromium.");
  await page.emulateMedia({ forcedColors: "active" });
  await render(page, `<label class="checkbox"><input type="checkbox" checked>Updates</label>
    <label class="radio"><input type="radio" checked>Weekly</label>
    <label class="switch"><input type="checkbox" role="switch" checked>Enabled</label>
    <label>Choice <select class="select"><option>One</option></select></label>`);
  for (const selector of [".checkbox input", ".radio input", ".switch input", ".select"]) {
    await expect(page.locator(selector)).toHaveCSS("appearance", "auto");
  }
  await expect(page.locator(".select")).toHaveCSS("background-image", "none");
  const checkbox = page.getByRole("checkbox", { name: "Updates" });
  await checkbox.focus();
  await page.keyboard.press("Space");
  await expect(checkbox).not.toBeChecked();
  await expect(checkbox).toHaveCSS("outline-style", "solid");
});

test("a card grid fits a container narrower than its usual column minimum", async ({ page }) => {
  await render(page, `<div style="width: 240px"><div class="card-grid">
    <article class="card"><h2>Account</h2><p>One compact card.</p></article>
    <article class="card"><h2>Activity</h2><p>Another card.</p></article>
    </div></div>`);
  const sizes = await page.locator(".card-grid").evaluate((el) => ({
    width: el.clientWidth, scroll: el.scrollWidth,
  }));
  expect(sizes.scroll).toBeLessThanOrEqual(sizes.width);
});

test("buttons and segmented labels grow with enlarged and spaced text", async ({ page }) => {
  await render(page, `<div style="width: 220px">
    <button class="btn btn-secondary" style="width: 100%">Review account settings</button>
    <div class="segmented" style="width: 100%"><button>Review settings</button></div></div>`);
  await page.addStyleTag({ content: ".btn, .segmented > button { font-size: 28px; line-height: 1.5; letter-spacing: .12em; word-spacing: .16em; }" });
  for (const selector of [".btn", ".segmented > button"]) {
    const sizes = await page.locator(selector).evaluate((el) => {
      const range = document.createRange();
      range.selectNodeContents(el);
      return { control: el.getBoundingClientRect().height, text: range.getBoundingClientRect().height };
    });
    expect(sizes.control, `${selector} must contain its text`).toBeGreaterThan(sizes.text);
  }
});

function tabsMarkup(attributes = "") {
  return `<div class="tabs" role="tablist" aria-label="Views" data-tabs ${attributes}>
    <button class="tab" role="tab" id="one" aria-controls="panel-one" aria-selected="true">One</button>
    <button class="tab" role="tab" id="two" aria-controls="panel-two" aria-disabled="true">Two</button>
    <button class="tab" role="tab" id="three" aria-controls="panel-three">Three</button>
    </div>
    <div id="panel-one" class="tab-panel" role="tabpanel" aria-labelledby="one">One content</div>
    <div id="panel-two" class="tab-panel" role="tabpanel" aria-labelledby="two" hidden>Two content</div>
    <div id="panel-three" class="tab-panel" role="tabpanel" aria-labelledby="three" hidden>Three content</div>`;
}

test("horizontal RTL tabs skip unavailable options and make text panels reachable", async ({ page }) => {
  await render(page, tabsMarkup('dir="rtl"'));
  await page.locator("#one").focus();
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator("#three")).toBeFocused();
  await expect(page.locator("#three")).toHaveAttribute("aria-selected", "true");
  await page.locator("#two").dispatchEvent("click");
  await expect(page.locator("#three")).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("Tab");
  await expect(page.locator("#panel-three")).toBeFocused();
});

test("vertical tabs reserve Up and Down for navigation", async ({ page }) => {
  await render(page, tabsMarkup('aria-orientation="vertical"'));
  await page.locator("#one").focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.locator("#three")).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator("#three")).toBeFocused();
  await page.keyboard.press("Home");
  await expect(page.locator("#one")).toBeFocused();
  await expect(page.locator(".tabs")).toHaveCSS("flex-direction", "column");
});

test("nested tablists keep their own selection and preserve explicit panel tabindex", async ({ page }) => {
  await render(page, `<div class="tabs" role="tablist" aria-label="Outer" data-tabs>
    <button class="tab" role="tab" id="outer" aria-selected="true" aria-controls="outer-panel">Outer</button>
    ${tabsMarkup()}
    </div><div role="tabpanel" id="outer-panel" aria-labelledby="outer" tabindex="-1">Outer content</div>`);
  await page.locator("#outer").focus();
  await page.keyboard.press("End");
  await expect(page.locator("#outer")).toBeFocused();
  await expect(page.locator("#one")).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#outer-panel")).toHaveAttribute("tabindex", "-1");
  await page.evaluate(() => window.InkwellInteractions.init());
  await expect(page.locator("#one")).toHaveAttribute("aria-selected", "true");
});

test("tooltips support contained focus and Escape dismissal without moving focus", async ({ page }) => {
  await render(page, `<span class="tooltip" data-tooltip="Save your current draft">
    <button class="btn" aria-describedby="hint">Save</button></span>
    <span id="hint" class="sr-only">Save your current draft</span>`);
  const tooltip = page.locator(".tooltip");
  const opacity = () => tooltip.evaluate((el) => getComputedStyle(el, "::after").opacity);
  await page.getByRole("button", { name: "Save" }).focus();
  await expect.poll(opacity).toBe("1");
  await page.keyboard.press("Escape");
  await expect.poll(opacity).toBe("0");
  await expect(page.getByRole("button", { name: "Save" })).toBeFocused();
  await page.getByRole("button", { name: "Save" }).blur();
  await page.getByRole("button", { name: "Save" }).focus();
  await expect.poll(opacity).toBe("1");
});

test("pointer users can move onto a tooltip and dismiss it with Escape", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.startsWith("mobile"), "mouse behavior");
  await render(page, `<button class="btn tooltip" style="margin: 80px" data-tooltip="Save draft">Save</button>`);
  const tooltip = page.locator(".tooltip");
  await tooltip.hover();
  const box = await tooltip.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y - 10, { steps: 10 });
  await expect.poll(() => tooltip.evaluate((el) => getComputedStyle(el, "::after").opacity)).toBe("1");
  await page.keyboard.press("Escape");
  await expect.poll(() => tooltip.evaluate((el) => getComputedStyle(el, "::after").opacity)).toBe("0");
});
