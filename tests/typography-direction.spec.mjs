import { createRequire } from "node:module";
import { readdirSync } from "node:fs";

const require = createRequire(import.meta.url);
const { expect, test } = require("playwright/test");
const { firefox } = require("playwright");
const fixture = "/tests/fixtures/typography-direction.html";
const baseline = { display: 48, h1: 32, h2: 24, h3: 19, lede: 20, body: 16, small: 14, caption: 12, eyebrow: 11 };

test("default typography retains the original pixel appearance", async ({ page }) => {
  await page.goto(fixture);
  for (const [role, size] of Object.entries(baseline)) {
    await expect(page.locator(`[data-type=${role}]`)).toHaveCSS("font-size", `${size}px`);
  }
  await expect(page.locator(".controls > .btn")).toHaveCSS("font-size", "14px");
});

test("type roles follow enlarged root settings without clipping controls", async ({ page }) => {
  await page.goto(fixture);
  for (const fontSize of [20, 24, 32]) {
    await page.addStyleTag({ content: `html { font-size: ${fontSize}px; }` });
    for (const [role, original] of Object.entries(baseline)) {
      await expect(page.locator(`[data-type=${role}]`)).toHaveCSS("font-size", `${original * fontSize / 16}px`);
    }
    for (const selector of [".controls > .btn", ".badge", "kbd", ".copy", ".carousel-btn"]) {
      const box = await page.locator(selector).first().evaluate((el) => {
        const range = document.createRange(); range.selectNodeContents(el);
        return { control: el.getBoundingClientRect().height, text: range.getBoundingClientRect().height };
      });
      expect(box.control, selector).toBeGreaterThanOrEqual(box.text);
    }
  }
});

test("actual Firefox font preferences scale the root and component text", async ({ browserName, baseURL }) => {
  test.skip(browserName !== "firefox", "Firefox exposes default-font preferences at launch.");
  test.setTimeout(120_000);
  for (const fontSize of [16, 20, 24, 32]) {
    const browser = await firefox.launch({ firefoxUserPrefs: { "font.size.variable.x-western": fontSize } });
    try {
      const page = await browser.newPage({ baseURL });
      await page.goto(fixture);
      await expect(page.locator("html")).toHaveCSS("font-size", `${fontSize}px`);
      await expect(page.locator('[data-type="body"]')).toHaveCSS("font-size", `${fontSize}px`);
      await expect(page.locator(".controls > .btn")).toHaveCSS("font-size", `${14 * fontSize / 16}px`);
    } finally { await browser.close(); }
  }
});

test("reading-start spines, select artwork, and copy controls follow nested direction", async ({ page }) => {
  await page.goto(fixture);
  for (const [id, direction] of [["ltr-sample", "ltr"], ["rtl-sample", "rtl"]]) {
    const layout = await page.locator(`#${id}`).evaluate((el) => {
      const callout = getComputedStyle(el.querySelector(":scope > .callout"));
      const copy = el.querySelector(".copy").getBoundingClientRect();
      const code = el.querySelector(".code-block").getBoundingClientRect();
      return { left: parseFloat(callout.borderLeftWidth), right: parseFloat(callout.borderRightWidth),
        copyLeft: copy.left - code.left, copyRight: code.right - copy.right,
        align: getComputedStyle(el.querySelector("th")).textAlign,
        timeline: getComputedStyle(el.querySelector(".timeline"),"::before").insetInlineStart,
        dot: getComputedStyle(el.querySelector(".tl-entry"),"::before").insetInlineStart,
        background: getComputedStyle(el.querySelector("select")).backgroundPosition };
    });
    if (direction === "rtl") {
      expect(layout.right).toBeGreaterThan(layout.left);
      expect(layout.copyLeft).toBeLessThan(layout.copyRight);
      expect(layout.background).toMatch(/^(12px|left 12px)/);
    } else {
      expect(layout.left).toBeGreaterThan(layout.right);
      expect(layout.copyRight).toBeLessThan(layout.copyLeft);
    }
    expect(layout.align).toBe("start");
    expect(layout.timeline).toBe("16px");
    expect(layout.dot).toBe("-7px");
  }
  const island = await page.locator(".nested-island .callout").evaluate(el => ({left:parseFloat(getComputedStyle(el).borderLeftWidth),right:parseFloat(getComputedStyle(el).borderRightWidth)}));
  expect(island.left).toBeGreaterThan(island.right);
});

test("RTL switch travel and directional icons mirror without reversing text", async ({ page }) => {
  await page.goto(fixture);
  const input = page.locator("#rtl-sample .switch input");
  const left = () => input.evaluate(el => parseFloat(getComputedStyle(el, "::after").left));
  const before = await left();
  await input.check();
  await expect.poll(left).toBeLessThan(before);
  await expect(page.locator("#rtl-sample .icon-directional")).toHaveCSS("scale", "-1 1");
  await expect(page.locator("#rtl-sample input[type=email]")).toHaveCSS("direction", "ltr");
});

test("localized copy controls never cover code at enlarged sizes", async ({ page }) => {
  await page.goto(fixture);
  for (const size of [16,32]) {
    await page.locator("#fixture-size").selectOption(size === 16 ? "" : "32px");
    for (const id of ["ltr-sample","rtl-sample"]) {
      const boxes = await page.locator(`#${id} .code-block`).evaluate(el => ({
        control:el.querySelector(".copy").getBoundingClientRect().bottom,
        code:el.querySelector("pre").getBoundingClientRect().top,
      }));
      expect(boxes.control).toBeLessThanOrEqual(boxes.code);
    }
  }
});

test("RTL hints and dialog actions remain reachable with enlarged mobile text", async ({ page }) => {
  await page.setViewportSize({width:320,height:812});
  await page.goto(fixture);
  await page.locator("#fixture-size").selectOption("32px");
  await page.locator("#fixture-direction").selectOption("rtl");
  for (const name of ["مساعدة البداية","مساعدة النهاية"]) {
    const hint = page.getByRole("button", {name,exact:true});
    await hint.focus();
    await expect.poll(() => hint.evaluate(el => {
      const box = el.getBoundingClientRect(), bubble = getComputedStyle(el,"::after");
      const left = box.left + parseFloat(getComputedStyle(el).borderLeftWidth) + parseFloat(bubble.left);
      return left >= 15 && left + parseFloat(bubble.width) <= 305;
    })).toBe(true);
    await page.keyboard.press("Escape");
    await expect(hint).toHaveAttribute("data-inkwell-tooltip-dismissed", "");
  }
  const trigger = page.getByRole("button", {name:"مراجعة الإعدادات",exact:true});
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const box = await dialog.evaluate(el => ({width:el.clientWidth,scroll:el.scrollWidth}));
  expect(box.scroll).toBeLessThanOrEqual(box.width);
  await page.getByRole("button", {name:"إغلاق",exact:true}).click();
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

async function alignedSlide(page, index) {
  return page.locator(".carousel-track").evaluate((track, index) => {
    const slide = track.children[index].getBoundingClientRect();
    const rect = track.getBoundingClientRect();
    const style = getComputedStyle(track);
    return Math.abs(style.direction === "rtl" ? slide.right - rect.right + parseFloat(style.borderRightWidth) : slide.left - rect.left - parseFloat(style.borderLeftWidth)) < 2;
  }, index);
}

test("RTL carousel buttons, arrows, manual scroll, and resize reach the actual slide", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(fixture);
  const track = page.locator(".carousel-track");
  await page.getByRole("button", { name: "Next slide", exact: true }).click();
  await expect.poll(() => alignedSlide(page, 1)).toBe(true);
  await track.focus();
  await page.keyboard.press("ArrowLeft");
  await expect.poll(() => alignedSlide(page, 2)).toBe(true);
  await page.setViewportSize({width: 320, height: 812});
  await expect.poll(() => alignedSlide(page, 2)).toBe(true);
  await page.keyboard.press("Home");
  await expect.poll(() => alignedSlide(page, 0)).toBe(true);
  await track.dispatchEvent("wheel", {deltaX:-100});
  await track.evaluate(el => el.scrollTo({left: -el.clientWidth, behavior: "instant"}));
  await expect(page.locator(".carousel-dot").nth(1)).toHaveAttribute("aria-current", "true");
  await expect(page.locator(".carousel-dot").first()).toHaveAttribute("aria-label", /انتقل إلى الشريحة/);
  await page.locator(".carousel-dot").last().click();
  await expect.poll(() => alignedSlide(page, 2)).toBe(true);
  await track.focus(); await page.keyboard.press("ArrowRight");
  await expect.poll(() => alignedSlide(page, 1)).toBe(true);
  await page.keyboard.press("End");
  await expect.poll(() => alignedSlide(page, 2)).toBe(true);
});

test("carousel survives a direction change and nested LTR scope without duplicate controls", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(fixture);
  await page.locator(".carousel-dot").nth(1).click();
  await expect.poll(() => alignedSlide(page, 1)).toBe(true);
  await page.evaluate(() => {
    document.documentElement.dir = "rtl";
    const carousel = document.querySelector(".carousel");
    carousel.dir = "ltr"; carousel.lang = "en";
    carousel.dataset.carouselDotLabel = "Chapter {current} of {total}";
    window.InkwellInteractions.init(carousel);
    window.InkwellInteractions.init(carousel);
  });
  await expect(page.locator(".carousel-dot")).toHaveCount(3);
  await expect(page.locator(".carousel-dot").first()).toHaveAttribute("aria-label", "Chapter 1 of 3");
  await expect.poll(() => alignedSlide(page, 1)).toBe(true);
  await page.locator(".carousel-track").focus();
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => alignedSlide(page, 2)).toBe(true);
  await page.keyboard.press("Home");
  await expect.poll(() => alignedSlide(page, 0)).toBe(true);
});

test("smooth carousel navigation settles at the requested RTL chapter", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(fixture);
  await page.locator(".carousel-track").focus();
  await page.keyboard.press("ArrowLeft"); await page.keyboard.press("ArrowLeft");
  await expect.poll(() => alignedSlide(page, 2)).toBe(true);
  await expect(page.locator(".carousel-dot").last()).toHaveAttribute("aria-current", "true");
});

test("Arabic and Hebrew layout supports all palettes and modes at enlarged mobile type", async ({ page }) => {
  await page.setViewportSize({width: 320, height:812});
  for (const palette of ["indigo", "clay", "sage", "burgundy", "azure"]) {
    await page.goto(fixture);
    if (palette !== "indigo") await page.addStyleTag({url:`/variants/${palette}.css`});
    for (const theme of ["light", "dark", "auto"]) {
      for (const dir of ["ltr", "rtl"]) {
        const layout = await page.evaluate(({theme,dir}) => {
          document.documentElement.style.fontSize = "32px";
          document.documentElement.dataset.theme = theme;
          document.documentElement.dir = dir;
          const outside = [...document.querySelectorAll("main *")].filter(el => {
            const box = el.getBoundingClientRect();
            return box.width && (box.left < 0 || box.right > innerWidth) && !el.closest(".carousel-track, .code-block");
          }).map(el => ({tag:el.tagName,class:el.className,text:el.textContent.slice(0,50)}));
          if (document.documentElement.scrollWidth > innerWidth) {
            for (const el of document.querySelectorAll("main *")) {
              if (el.scrollWidth > el.clientWidth + 2) outside.push({tag:el.tagName,class:el.className,text:el.textContent.slice(0,30),scroll:el.scrollWidth,client:el.clientWidth});
            }
          }
          return {scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth,outside};
        }, {theme,dir});
        expect(layout.scroll, `${palette}/${theme}/${dir}: ${JSON.stringify(layout.outside)}`).toBeLessThanOrEqual(layout.client);
        await expect(page.locator("#rtl-sample > h2")).toHaveCSS("letter-spacing", "normal");
        await expect(page.locator("#he-one")).toHaveCSS("letter-spacing", "normal");
      }
    }
  }
});

test("Arabic labels use script-appropriate tracking and Hebrew tabs retain RTL keys", async ({ page }) => {
  await page.goto(fixture);
  await expect(page.locator("#rtl-sample > h2")).toHaveCSS("letter-spacing", "normal");
  const initial = await page.locator("#rtl-sample .dropcap").evaluate(el => ({first:getComputedStyle(el,"::first-letter").fontSize,body:getComputedStyle(el).fontSize,float:getComputedStyle(el,"::first-letter").cssFloat}));
  expect(initial.first).toBe(initial.body);
  expect(initial.float).toBe("none");
  const first = page.locator("#he-one");
  await first.focus(); await page.keyboard.press("ArrowLeft");
  await expect(page.locator("#he-two")).toBeFocused();
  await expect(page.locator("#he-panel-two")).toBeVisible();
});

const referencePages = [
  ...readdirSync(new URL("../examples/", import.meta.url)).filter(n=>n.endsWith(".html")).map(n=>`/examples/${n}`),
  ...readdirSync(new URL("../examples/variants/", import.meta.url)).filter(n=>n.endsWith(".html")).map(n=>`/examples/variants/${n}`),
].sort();

for (const path of referencePages) {
  test(`${path} supports enlarged type and both reading directions`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto(path);
    const failures = [];
    for (const width of [1280, 640, 320]) {
      await page.setViewportSize({width, height:812});
      for (const fontSize of [16, 20, 24, 32]) {
        for (const direction of ["ltr", "rtl"]) {
          const size = await page.evaluate(({fontSize,direction})=>{
            document.documentElement.style.fontSize = `${fontSize}px`;
            document.documentElement.dir = direction;
            return {scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth};
          }, {fontSize,direction});
          if (size.scroll > size.client) {
            failures.push({width,fontSize,direction,...size});

          }
        }
      }
    }
    expect(failures, `${path} must preserve page reflow`).toEqual([]);
    await page.locator(".skip-link").focus();
    const skip = await page.locator(".skip-link").evaluate(el => ({left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right}));
    expect(skip.left).toBeGreaterThanOrEqual(0);
    expect(skip.right).toBeLessThanOrEqual(320);
    for (const code of await page.locator("pre").all()) await expect(code).toHaveCSS("direction", "ltr");
  });
}
