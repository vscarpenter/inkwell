import { createRequire } from "node:module";
import { readdirSync } from "node:fs";

const require = createRequire(import.meta.url);
const { expect, test } = require("playwright/test");
const home = "/examples/index.html";
const routes = [
  ...readdirSync(new URL("../examples/", import.meta.url)).filter(name => name.endsWith(".html")),
  ...readdirSync(new URL("../examples/variants/", import.meta.url)).filter(name => name.endsWith(".html")).map(name => "variants/" + name),
].sort();

test("homepage leads with the press sheet and keeps the complete example directory", async ({ page }) => {
  await page.goto(home);
  await expect(page).toHaveTitle("Inkwell: one system, five inks");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("One system. Five inks.");
  await expect(page.locator("h1 em.accent")).toHaveText("Five inks.");
  for (const name of ["Docs", "Reference", "Showcase", "Examples", "GitHub"]) {
    await expect(page.locator(".home-nav").getByRole("link", { name, exact: true })).toHaveCount(1);
  }
  await expect(page.locator(".home-nav").getByRole("link", { name: "Examples", exact: true })).toHaveAttribute("href", "#components");
  await expect(page.getByRole("heading", { name: "The 1.5px is on purpose.", exact: true })).toHaveCount(1);
  await page.getByRole("link", { name: "Start building", exact: true }).click();
  await expect(page).toHaveURL(/#get-started$/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://inkwell.vinny.dev/");
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", "https://inkwell.vinny.dev/");
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", "Inkwell: one system, five inks");
  const linked = await page.locator("#example-directory a[href]").evaluateAll(links => links.map(a => new URL(a.href).pathname.replace("/examples/", "")));
  expect([...new Set(linked)].sort()).toEqual(routes);
  await expect(page.locator("#example-directory .home-addr")).toHaveCount(20);
  await expect(page.locator("#example-directory .home-addr").first()).toHaveText("01");
  await expect(page.locator("#example-directory .home-addr").last()).toHaveText("20");
  await expect(page.locator('#example-directory a[aria-current="page"]')).toHaveAttribute("href", "index.html");
  await expect(page.locator("#components")).toHaveCount(1);
  expect(await page.locator("html").innerHTML()).not.toMatch(/[–—]/);
});

test("sheets keep their own palettes and a pick re-inks the page", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(home + "?palette=clay");
  await expect(page.locator("#inkwell-palette-css")).toHaveAttribute("href", "variants/clay.css");
  await expect(page.locator('[data-palette-choice="clay"]')).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("iframe.home-sheet-frame")).toHaveCount(5);
  await expect(page.locator(".home-strip-picks")).toBeInViewport();
  const fills = [];
  const names = { indigo: "Indigo & Cloud", clay: "Clay", sage: "Sage & Stone", burgundy: "Burgundy & Bone", azure: "Azure & Ink" };
  for (const name of Object.keys(names)) {
    const frame = page.frameLocator(`[data-sheet="${name}"] iframe`);
    await expect(frame.locator(".ink")).toHaveText(names[name]);
    await expect(frame.locator("table.tbl")).toBeVisible();
    expect(await frame.locator("thead th").last().evaluate(el => { const range = document.createRange(); range.selectNodeContents(el); return range.getClientRects().length; }), `${name} header wraps`).toBe(1);
    expect(await frame.locator("tbody td").first().evaluate(el => { const range = document.createRange(); range.selectNodeContents(el); return range.getClientRects().length; }), `${name} row label wraps`).toBe(1);
    fills.push(await frame.locator(".btn-primary").evaluate(el => getComputedStyle(el).backgroundColor));
  }
  expect(new Set(fills).size).toBe(5);
  await expect(page.frameLocator('[data-sheet="indigo"] iframe').locator('link[href^="variants/"]')).toHaveCount(0);
  await page.locator('[data-palette-choice="sage"]').click();
  await expect(page.locator("#inkwell-palette-css")).toHaveAttribute("href", "variants/sage.css");
  await expect(page.locator("#home-palette-status")).toHaveText("Palette: Sage & Stone. It follows you across the gallery.");
  await expect(page.locator('.home-sheet-pick[data-palette-choice="sage"]')).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator('.home-sheet-pick[data-palette-choice="clay"]')).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator('[data-sheet="sage"]')).toHaveCSS("outline-style", "solid");
  await expect(page.locator('[data-sheet="clay"]')).toHaveCSS("outline-style", "none");
});

test("theme and direction propagate into the sheets", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto(home);
  await page.locator('[data-theme-choice="light"]').click();
  for (const name of ["indigo", "azure"]) {
    await expect(page.frameLocator(`[data-sheet="${name}"] iframe`).locator("html")).toHaveAttribute("data-theme", "light");
  }
  await page.evaluate(() => { document.documentElement.dir = "rtl"; });
  await expect(page.frameLocator('[data-sheet="clay"] iframe').locator("html")).toHaveAttribute("dir", "rtl");
  await page.locator('[data-theme-choice="auto"]').click();
  await expect.poll(() => page.frameLocator('[data-sheet="clay"] iframe').locator("html").evaluate(h => h.hasAttribute("data-theme"))).toBe(false);
});

test("seams switch shows and hides every callout", async ({ page }) => {
  await page.goto(home);
  const seams = page.locator(".seam");
  await expect(seams).toHaveCount(12);
  await expect(seams.first()).toBeVisible();
  await expect(page.locator(".home-plate > :last-child .eyebrow")).toHaveCount(1);
  expect(await page.locator(".seam").evaluateAll(es => es.map(e => e.textContent).filter(t => /never|review/i.test(t)).length)).toBe(0);
  const toggle = page.getByRole("button", { name: "Seams", exact: true });
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await expect(seams.first()).toBeHidden();
  expect(await seams.evaluateAll(es => es.every(e => getComputedStyle(e).display === "none"))).toBe(true);
  await toggle.click();
  await expect(seams.first()).toBeVisible();
});

test("live specimen reports a blank name inline and resets through the keyboard menu", async ({ page }) => {
  await page.goto(home);
  const name = page.getByLabel("Project name", { exact: true });
  await name.fill("   ");
  await page.getByRole("button", { name: "Preview changes", exact: true }).click();
  await expect(page.locator("#home-preview-status")).toHaveText("Enter a project name.");
  await expect(name).toHaveAttribute("aria-invalid", "true");
  await expect(name).toBeFocused();
  await name.fill("A project with مساحة للكتابة");
  expect(await name.evaluate(el => el.hasAttribute("aria-invalid"))).toBe(false);
  await page.getByRole("button", { name: "Preview changes", exact: true }).click();
  await expect(page.locator("#home-preview-status")).toHaveText('Preview ready for "A project with مساحة للكتابة".');
  const trigger = page.getByRole("button", { name: "Specimen actions", exact: true });
  await trigger.press("ArrowDown");
  const reset = page.getByRole("menuitem", { name: "Reset example", exact: true });
  await expect(reset).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(name).toHaveValue("Thoughtful interfaces");
  await expect(page.locator("#home-preview-status")).toHaveText("Example reset.");
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
});

test("copy actions report success and rejection without losing focus", async ({ page }) => {
  await page.addInitScript(() => {
    window.copied=[];
    Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText:async text => { if (window.denyCopy) throw new DOMException("Denied","NotAllowedError"); window.copied.push(text); }}});
  });
  await page.goto(home);
  const html=page.getByRole("button",{name:"Copy HTML",exact:true});
  await html.click();
  await expect(page.locator("#html-copy-status")).toHaveText("HTML copied.");
  expect(await page.evaluate(() => window.copied[0])).toBe('<link rel="stylesheet" href="inkwell.css">');
  await page.getByRole("button",{name:"Copy agent prompt",exact:true}).click();
  await expect(page.locator("#agent-copy-status")).toHaveText("Agent prompt copied.");
  expect(await page.evaluate(() => window.copied[1])).toContain("/v3.11.0/agent-instructions.md");
  await page.evaluate(() => { window.denyCopy=true; });
  await html.click();
  await expect(page.locator("#html-copy-status")).toContainText("Select the snippet and copy it manually");
  await expect(html).toBeFocused();
});

test("sheets, callouts, and adoption links remain usable without JavaScript or clipboard support", async ({ browser, page }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const baseline = await context.newPage();
  try {
    await baseline.goto("http://127.0.0.1:4173" + home);
    await expect(baseline.locator("iframe.home-sheet-frame")).toHaveCount(5);
    await expect(baseline.frameLocator('[data-sheet="clay"] iframe').locator('link[href="variants/clay.css"]')).toHaveCount(1);
    await expect(baseline.locator(".seam").first()).toBeVisible();
    await expect(baseline.getByRole("button", { name: "Seams", exact: true })).toHaveCount(0);
    await expect(baseline.getByRole("button", { name: "Copy HTML", exact: true })).toHaveCount(0);
    await expect(baseline.getByRole("button", { name: "Preview changes", exact: true })).toHaveCount(0);
    await expect(baseline.getByRole("link", { name: "View input markup", exact: true })).toBeVisible();
    await expect(baseline.locator("#html-install")).toBeVisible();
    await expect(baseline.locator("#agent-prompt")).toBeVisible();
    await expect(baseline.locator("#example-directory a")).toHaveCount(20);
    await baseline.getByRole("link", { name: "Start building", exact: true }).click();
    await expect(baseline).toHaveURL(/#get-started$/);
  } finally { await context.close(); }
  await page.addInitScript(() => { Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined }); });
  await page.goto(home);
  await expect(page.getByRole("button", { name: "Copy HTML", exact: true })).toHaveCount(0);
  await expect(page.locator("#html-install")).toBeVisible();
});

test("homepage fits enlarged type, RTL, and narrow screens with reachable controls", async ({ page, isMobile, browserName }) => {
  await page.setViewportSize({ width: 320, height: 812 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(home);
  for (const dir of ["ltr", "rtl"]) {
    await page.evaluate(dir => { document.documentElement.dir = dir; document.documentElement.style.fontSize = "32px"; }, dir);
    await expect(page.locator("html")).toHaveCSS("font-size", "32px");
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    expect(await page.locator(".home-strip").evaluate(el => el.scrollWidth > el.clientWidth)).toBe(true);
    await page.getByLabel("Project name", { exact: true }).fill("Long project name with العربية and averylongunbreakableidentifier");
    await page.getByRole("button", { name: "Preview changes", exact: true }).click();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await expect(page.locator("#html-install")).toHaveCSS("direction", "ltr");
    const trigger = page.getByRole("button", { name: "Specimen actions", exact: true });
    await trigger.scrollIntoViewIfNeeded();
    await expect(trigger).toBeInViewport();
    await trigger.press("ArrowDown");
    await expect(page.getByRole("menuitem", { name: "Reset example", exact: true })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
  }
  if (isMobile) {
    for (const selector of ['[data-palette-choice="clay"]', '[data-theme-choice="dark"]', ".home-file-list a", ".home-deep-links a", ".home-footer nav a", "#home-seams"]) {
      expect(await page.locator(selector).first().evaluate(el => el.getBoundingClientRect().height), selector).toBeGreaterThanOrEqual(44);
    }
  }
  if (browserName === "chromium") {
    await page.emulateMedia({ forcedColors: "active" });
    await page.getByRole("button", { name: "Preview changes", exact: true }).focus();
    await expect(page.getByRole("button", { name: "Preview changes", exact: true })).toHaveCSS("outline-style", "solid");
    await expect(page.locator(".home-sheet-pick.is-active")).toHaveCSS("outline-style", "solid");
  }
});

function contrast(a,b) {
  function luminance(color) {
    const c=color.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});
    return c[0]*.2126+c[1]*.7152+c[2]*.0722;
  }
  const [hi,lo]=[luminance(a),luminance(b)].sort((a,b)=>b-a);
  return (hi+.05)/(lo+.05);
}

test("shared appearance controls have readable labels in every palette and mode", async ({ page }) => {
  test.setTimeout(120_000);
  await page.emulateMedia({reducedMotion:"reduce"});
  for (const path of [home,"/examples/dashboard.html"]) {
    for (const palette of ["indigo","clay","sage","burgundy","azure"]) {
      await page.goto(path+'?palette='+palette);
      if (palette!=="indigo") await expect(page.locator("#inkwell-palette-css")).toHaveAttribute("href",'variants/'+palette+'.css');
      for (const [choice,os] of [["light","dark"],["dark","light"],["auto","dark"],["auto","light"]]) {
        await page.emulateMedia({colorScheme:os});
        await page.locator('[data-theme-choice="'+choice+'"]').click();
        await expect.poll(async () => {
          const colors=await page.locator('.theme-toggle .is-active, .palette-toggle .is-active, .home-sheet-pick.is-active').evaluateAll(es=>es.map(e=>({fg:getComputedStyle(e).color,bg:getComputedStyle(e).backgroundColor})));
          return colors.length===2 && colors.every(c=>contrast(c.fg,c.bg)>=4.5);
        },{message:path+'/'+palette+'/'+choice+'/'+os}).toBe(true);
      }
    }
  }
});
