import { createRequire } from "node:module";
import { readdirSync } from "node:fs";

const require = createRequire(import.meta.url);
const { expect, test } = require("playwright/test");
const home = "/examples/index.html";
const routes = [
  ...readdirSync(new URL("../examples/", import.meta.url)).filter(name => name.endsWith(".html")),
  ...readdirSync(new URL("../examples/variants/", import.meta.url)).filter(name => name.endsWith(".html")).map(name => "variants/" + name),
].sort();

test("homepage leads to adoption and keeps the complete example directory", async ({ page }) => {
  await page.goto(home);
  await expect(page).toHaveTitle("Inkwell — Build interfaces with character");
  await expect(page.getByRole("heading", {level:1})).toHaveText("Build interfaces with character.");
  expect(await page.evaluate(() => {
    const intro=document.querySelector('.home-intro').getBoundingClientRect(), specimen=document.querySelector('.home-stage').getBoundingClientRect();
    return intro.bottom<=specimen.top+1 && specimen.width>=intro.width*.95;
  })).toBe(true);
  await page.getByRole("link", {name:"Start building",exact:true}).first().click();
  await expect(page).toHaveURL(/#get-started$/);
  await expect(page.getByRole("heading", {name:"Three files. Your next interface.",exact:true})).toBeInViewport();
  const linked = await page.locator("#example-directory a[href]").evaluateAll(links => links.map(a => new URL(a.href).pathname.replace("/examples/", "")));
  expect([...new Set(linked)].sort()).toEqual(routes);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href","https://inkwell.vinny.dev/");
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content","https://inkwell.vinny.dev/");
  await expect(page.locator("#components")).toHaveCount(1);
});

test("live specimen previews changes and resets through the keyboard menu", async ({ page }) => {
  await page.goto(home);
  await page.getByLabel("Project name",{exact:true}).fill("   ");
  await page.getByRole("button",{name:"Preview changes",exact:true}).click();
  expect(await page.getByLabel("Project name",{exact:true}).evaluate(el=>el.validity.valid)).toBe(false);
  await expect(page.getByLabel("Project name",{exact:true})).toBeFocused();
  await page.getByLabel("Project name",{exact:true}).fill("A project with مساحة للكتابة");
  await page.getByLabel("Send updates",{exact:true}).uncheck();
  await page.getByRole("button",{name:"Preview changes",exact:true}).click();
  await expect(page.locator("#home-preview-status")).toContainText("A project with مساحة للكتابة");
  await expect(page.locator("#home-preview-status")).toContainText("Notifications off");
  const trigger=page.getByRole("button",{name:"Specimen actions",exact:true});
  await trigger.press("ArrowDown");
  const reset=page.getByRole("menuitem",{name:"Reset example",exact:true});
  await expect(reset).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Project name",{exact:true})).toHaveValue("Thoughtful interfaces");
  await expect(page.getByLabel("Send updates",{exact:true})).toBeChecked();
  await expect(page.locator("#home-preview-status")).toHaveText("Example reset.");
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute("aria-expanded","false");
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
  expect(await page.evaluate(() => window.copied[1])).toContain("/v3.9.0/agent-instructions.md");
  await page.evaluate(() => { window.denyCopy=true; });
  await html.click();
  await expect(page.locator("#html-copy-status")).toContainText("Select the snippet and copy it manually");
  await expect(html).toBeFocused();
});

test("adoption and example links remain usable without JavaScript or clipboard support", async ({ browser, page }) => {
  const context=await browser.newContext({javaScriptEnabled:false});
  const baseline=await context.newPage();
  try {
    await baseline.goto('http://127.0.0.1:4173'+home);
    await expect(baseline.locator("#html-install")).toBeVisible();
    await expect(baseline.locator("#agent-prompt")).toBeVisible();
    await expect(baseline.getByRole("button",{name:"Copy HTML",exact:true})).toHaveCount(0);
    await expect(baseline.getByRole("button",{name:"Preview changes",exact:true})).toHaveCount(0);
    await expect(baseline.getByRole("link",{name:"View input markup",exact:true})).toBeVisible();
    await expect(baseline.locator("#example-directory a")).toHaveCount(20);
    await baseline.getByRole("link",{name:"Start building",exact:true}).first().click();
    await expect(baseline).toHaveURL(/#get-started$/);
  } finally { await context.close(); }
  await page.addInitScript(() => { Object.defineProperty(navigator,"clipboard",{configurable:true,value:undefined}); });
  await page.goto(home);
  await expect(page.getByRole("button",{name:"Copy HTML",exact:true})).toHaveCount(0);
  await expect(page.locator("#html-install")).toBeVisible();
});

test("homepage fits enlarged type, RTL, and narrow screens with reachable controls", async ({ page, isMobile, browserName }) => {
  await page.setViewportSize({width:320,height:812});
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto(home);
  for (const dir of ["ltr","rtl"]) {
    await page.evaluate(dir => { document.documentElement.dir=dir; document.documentElement.style.fontSize="32px"; },dir);
    await expect(page.locator("html")).toHaveCSS("font-size","32px");
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);
    await page.getByLabel("Project name",{exact:true}).fill("Long project name with العربية and averylongunbreakableidentifier");
    await page.getByRole("button",{name:"Preview changes",exact:true}).click();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);
    await expect(page.locator("#html-install")).toHaveCSS("direction","ltr");
    const trigger=page.getByRole("button",{name:"Specimen actions",exact:true});
    await trigger.scrollIntoViewIfNeeded();
    await expect(trigger).toBeInViewport();
    await trigger.press("ArrowDown");
    await expect(page.getByRole("menuitem",{name:"Reset example",exact:true})).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
  }
  if (isMobile) {
    for (const selector of ['[data-palette-choice="clay"]','[data-theme-choice="dark"]']) {
      expect(await page.locator(selector).evaluate(el=>el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
    }
  }
  if (browserName==="chromium") {
    await page.emulateMedia({forcedColors:"active"});
    await expect(page.getByLabel("Send updates",{exact:true})).toHaveCSS("appearance","auto");
    await page.getByRole("button",{name:"Preview changes",exact:true}).focus();
    await expect(page.getByRole("button",{name:"Preview changes",exact:true})).toHaveCSS("outline-style","solid");
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
          const colors=await page.locator('.theme-toggle .is-active, .palette-toggle .is-active').evaluateAll(es=>es.map(e=>({fg:getComputedStyle(e).color,bg:getComputedStyle(e).backgroundColor})));
          return colors.length===2 && colors.every(c=>contrast(c.fg,c.bg)>=4.5);
        },{message:path+'/'+palette+'/'+choice+'/'+os}).toBe(true);
      }
    }
  }
});
