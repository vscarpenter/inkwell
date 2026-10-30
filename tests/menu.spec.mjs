import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { expect, test } = require("playwright/test");
const fixture = "/tests/fixtures/menu.html";

async function load(page, backend = "native") {
  await page.emulateMedia({ reducedMotion: "reduce" });
  if (backend === "fallback") await page.addInitScript(() => {
    delete HTMLElement.prototype.popover;
    delete HTMLElement.prototype.showPopover;
    delete HTMLElement.prototype.hidePopover;
  });
  if (backend === "script") await page.addInitScript(() => {
    delete HTMLButtonElement.prototype.commandForElement;
    const supports = CSS.supports.bind(CSS);
    CSS.supports = (property, value) => /anchor|position-area|position-try/.test(property) ? false : supports(property, value);
  });
  await page.goto(fixture);
  await expect(page.locator("#primary-menu")).toHaveAttribute("data-inkwell-menu-ready", "true");
  await expect(page.locator("#actions")).toBeVisible();
}

async function open(page, key = "ArrowDown") {
  await page.locator("#actions").focus();
  await page.keyboard.press(key);
  await expect(page.locator("#actions")).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#action-list")).toBeVisible();
  await expect.poll(() => page.locator("#action-list").evaluate(el => el.contains(document.activeElement))).toBe(true);
}

async function closed(page) {
  await expect(page.locator("#actions")).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("#action-list")).not.toBeVisible();
}

for (const backend of ["native", "fallback", "script"]) {
  test(`${backend}: keyboard entry, wrapping, disabled commands, and focus restoration`, async ({ page }) => {
    await load(page, backend);
    const panel = page.locator("#action-list");
    await expect(panel).toHaveAttribute("role", "menu");
    await expect(panel).toHaveAttribute("aria-labelledby", "actions");
    await expect(page.locator("#actions")).toHaveAttribute("aria-haspopup", "menu");
    await open(page);
    await expect(panel.getByRole("menuitem",{name:"Publish update",exact:true})).toBeDisabled();
    await expect(panel.getByRole("menuitem", { name: "Rename project", exact: true })).toBeFocused();
    await page.keyboard.press("ArrowUp");
    await expect(panel.getByRole("menuitem", { name: "Archive project", exact: true })).toBeFocused();
    await page.keyboard.press("Home");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    const disabled = panel.getByRole("menuitem", { name: "Export report (unavailable)", exact: true });
    await expect(disabled).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("#result")).toHaveText("No action selected.");
    await expect(page.locator("#actions")).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("ArrowDown");
    await expect(panel.getByRole("menuitem", { name: "View documentation", exact: true })).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(panel.getByRole("menuitem", { name: "Review settings…", exact: true })).toBeFocused();
    await page.keyboard.press("End");
    await page.keyboard.press("Escape");
    await closed(page);
    await expect(page.locator("#actions")).toBeFocused();
    await open(page, "ArrowUp");
    await expect(panel.getByRole("menuitem", { name: "Archive project", exact: true })).toBeFocused();
    await page.keyboard.press("Escape");
    for (const key of ["Enter", "Space"]) {
      await open(page, key);
      await expect(panel.getByRole("menuitem", { name: "Rename project", exact: true })).toBeFocused();
      await page.keyboard.press("Escape");
    }
  });

  test(`${backend}: typeahead, native activation, Tab exits, and idempotent initialization`, async ({ page }) => {
    await load(page, backend);
    await page.evaluate(() => {
      for (let i = 0; i < 4; i++) window.InkwellInteractions.init(document.getElementById("primary-menu"));
    });
    await open(page);
    await page.keyboard.type("du");
    await expect(page.getByRole("menuitem", { name: "Duplicate project", exact: true })).toBeFocused();
    await page.keyboard.press("Space");
    await closed(page);
    await expect(page.locator("#result")).toHaveText("Duplicate project");
    expect(await page.evaluate(() => window.menuSelections)).toBe(1);
    await expect(page.locator("#actions")).toBeFocused();
    await open(page);
    await page.keyboard.press("Tab");
    await closed(page);
    await expect(page.locator("#after")).toBeFocused();
    await open(page);
    await page.keyboard.press("Shift+Tab");
    await closed(page);
    await expect(page.locator("#before")).toBeFocused();
    await open(page);
    await page.getByRole("menuitem", { name: "View documentation", exact: true }).click();
    await expect(page).toHaveURL(/#after$/);
    await closed(page);
  });

  test(`${backend}: pointer, outside focus, competing menus, and dialog actions`, async ({ page }) => {
    await load(page, backend);
    await page.locator("#actions").click();
    await expect(page.locator("#actions")).toBeFocused();
    await expect(page.locator("#action-list")).toBeVisible();
    await page.locator("#actions").click();
    await closed(page);
    await open(page);
    await page.locator("#outside").click();
    await closed(page);
    await expect(page.locator("#outside")).toBeFocused();
    // Native toggle is queued; leaving focus before it fires must not reopen or steal focus.
    await page.evaluate(() => {
      document.getElementById("actions").focus();
      document.getElementById("actions").click();
      document.getElementById("outside").focus();
    });
    await closed(page);
    await expect(page.locator("#outside")).toBeFocused();
    await open(page);
    await page.locator("#outside").focus();
    await closed(page);
    await expect(page.locator("#outside")).toBeFocused();
    await open(page);
    await page.getByRole("button", { name: "More actions", exact: true }).click();
    await closed(page);
    await expect(page.getByRole("menu", { name: "More actions", exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    await open(page);
    await page.getByRole("menuitem", { name: "Review settings…", exact: true }).click();
    await closed(page);
    await expect(page.locator("#settings")).toBeVisible();
    await expect(page.locator("#dialog-input")).toBeFocused();
    await page.getByRole("button", {name:"Close settings",exact:true}).click();
    await expect(page.locator("#actions")).toBeFocused();
  });

  test(`${backend}: RTL, enlarged labels, viewport edges, and reinitialization stay contained`, async ({ page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width: 640, height: 640 });
    await load(page, backend);
    for (const dir of ["ltr", "rtl"]) {
      for (const root of [16, 32]) {
        await page.evaluate(({dir,root}) => {
          document.documentElement.dir = dir;
          document.documentElement.style.fontSize = root + "px";
          document.querySelector('#action-list [data-action="rename"]').textContent = "A very long project action label with اضافية and averylongunbreakableidentifier";
          document.getElementById("host").style.cssText = "position:fixed; bottom:20px; inset-inline-end:20px; max-inline-size:calc(100% - 40px)";
          window.InkwellInteractions.init(document.getElementById("primary-menu"));
        }, {dir,root});
        await expect(page.locator("html")).toHaveCSS("font-size", root + "px");
        await open(page);
        await expect.poll(() => page.locator("#action-list").evaluate(el => {
          const r=el.getBoundingClientRect(); return r.left>=7 && r.right<=633 && r.top>=7 && r.bottom<=633;
        })).toBe(true);
        const boxes = await page.locator("#action-list").evaluate(el => {
          const a=el.getBoundingClientRect(), b=document.getElementById("actions").getBoundingClientRect();
          return {left:a.left,right:a.right,top:a.top,bottom:a.bottom,triggerTop:b.top,width:el.clientWidth,scroll:el.scrollWidth};
        });
        expect(boxes.left).toBeGreaterThanOrEqual(7);
        expect(boxes.right).toBeLessThanOrEqual(633);
        expect(boxes.top).toBeGreaterThanOrEqual(7);
        expect(boxes.bottom).toBeLessThanOrEqual(boxes.triggerTop);
        expect(boxes.scroll).toBeLessThanOrEqual(boxes.width);
        await page.keyboard.press("End");
        await expect(page.getByRole("menuitem", { name: "Archive project", exact: true })).toBeInViewport();
        await page.keyboard.press("Escape");
      }
    }
    await page.locator("#host").evaluate(el => { el.style.cssText = "position:fixed;top:50px;left:150px"; });
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "16px";
      document.querySelector('#action-list [data-action="rename"]').textContent = "Rename project";
      const root = document.getElementById("primary-menu"); root.dir = "rtl";
      window.InkwellInteractions.init(root);
    });
    await expect(page.locator("html")).toHaveCSS("font-size", "16px");
    await open(page);
    await expect.poll(() => page.locator("#action-list").evaluate(el => Math.abs(el.getBoundingClientRect().right-document.getElementById("actions").getBoundingClientRect().right))).toBeLessThan(2);
    await page.setViewportSize({ width: 320, height: 640 });
    await expect.poll(() => page.locator("#action-list").evaluate(el => {
      const r=el.getBoundingClientRect();return r.left>=7 && r.right<=313;
    })).toBe(true);
  });

  test(`${backend}: dynamic commands, localized typeahead, and disabled pointer activation`, async ({ page }) => {
    await load(page, backend);
    await page.evaluate(() => {
      const panel=document.getElementById("action-list");
      panel.querySelector('[data-action="rename"]').hidden=true;
      const item=document.createElement("button"); item.type="button"; item.className="menu-item"; item.textContent="Review activity";
      panel.append(item);
      document.querySelector('[aria-disabled="true"]').addEventListener("click", () => { window.disabledActivated=true; });
      window.InkwellInteractions.init(document.getElementById("primary-menu"));
    });
    await open(page);
    await expect(page.locator('[data-action="rename"]')).not.toBeVisible();
    await expect(page.getByRole("menuitem", {name:"Duplicate project",exact:true})).toBeFocused();
    await page.keyboard.press("r");
    await expect(page.getByRole("menuitem", {name:"Review settings…",exact:true})).toBeFocused();
    await page.keyboard.press("r");
    await expect(page.getByRole("menuitem", {name:"Review activity",exact:true})).toBeFocused();
    const unavailable=page.getByRole("menuitem", {name:"Export report (unavailable)",exact:true});
    const box=await unavailable.boundingBox();
    await page.mouse.click(box.x+box.width/2, box.y+box.height/2);
    expect(await page.evaluate(() => window.disabledActivated || false)).toBe(false);
    await expect(page.locator("#actions")).toHaveAttribute("aria-expanded","true");
    await page.keyboard.press("Escape");
    await page.evaluate(() => {
      document.getElementById("primary-menu").lang="ar";
      document.getElementById("primary-menu").dir="rtl";
      document.querySelector('[data-action="duplicate"]').textContent="نسخ المشروع";
      window.InkwellInteractions.init(document.getElementById("primary-menu"));
    });
    await open(page);
    await page.keyboard.press("End");
    await page.getByRole("menuitem", {name:"Review activity",exact:true}).dispatchEvent("keydown",{key:"ن",bubbles:true});
    await expect(page.getByRole("menuitem", {name:"نسخ المشروع",exact:true})).toBeFocused();
    await page.keyboard.press("Escape");
    await page.evaluate(() => {
      document.getElementById("primary-menu").lang="tr";
      document.querySelector('[data-action="duplicate"]').textContent="Işık";
      window.InkwellInteractions.init(document.getElementById("primary-menu"));
    });
    await open(page);
    await page.keyboard.press("End");
    await page.getByRole("menuitem", {name:"Review activity",exact:true}).dispatchEvent("keydown",{key:"ı",bubbles:true});
    await expect(page.getByRole("menuitem", {name:"Işık",exact:true})).toBeFocused();
  });

  test(`${backend}: form defaults and live resizing preserve action and focus`, async ({ page }) => {
    await load(page, backend);
    await page.evaluate(() => {
      const form=document.createElement("form"), menu=document.getElementById("primary-menu");
      menu.before(form); form.append(menu);
      const command=document.querySelector('[data-action="rename"]'); command.type="submit"; command.name="action"; command.value="rename";
      command.addEventListener("click", () => { window.formAssociated=command.form===form; });
      form.addEventListener("submit", event => { event.preventDefault(); window.submitted=event.submitter.value; });
    });
    await open(page);
    await page.keyboard.press("Enter");
    await closed(page);
    expect(await page.evaluate(() => ({associated:window.formAssociated, submitted:window.submitted}))).toEqual({associated:true,submitted:"rename"});
    await open(page);
    await page.evaluate(() => { document.documentElement.style.fontSize="32px"; });
    await expect(page.locator("html")).toHaveCSS("font-size","32px");
    await expect.poll(() => page.locator("#action-list").evaluate(el => {
      const r=el.getBoundingClientRect(); return r.left>=7 && r.right<=innerWidth-7 && r.top>=7 && r.bottom<=innerHeight-7;
    })).toBe(true);
    await expect(page.getByRole("menuitem",{name:"Rename project",exact:true})).toBeFocused();
    await page.keyboard.press("End");
    await expect(page.getByRole("menuitem",{name:"Archive project",exact:true})).toBeInViewport();
    await page.evaluate(() => { document.body.style.minHeight="3000px"; });
    await page.evaluate(() => { window.scrollTo(0,1500); });
    await closed(page);
  });
}

test("native API dismissal synchronizes focus and expanded state", async ({ page }) => {
  await load(page);
  if (!await page.evaluate(() => typeof HTMLElement.prototype.hidePopover === "function")) return;
  await open(page);
  await expect(page.getByRole("menuitem",{name:"Rename project",exact:true})).toBeFocused();
  await page.locator("#action-list").evaluate(el => el.hidePopover());
  await closed(page);
  await expect(page.locator("#actions")).toBeFocused();
});

test("empty menus keep the baseline and refresh after commands are added", async ({ page }) => {
  await load(page);
  await page.evaluate(() => {
    const wrapper=document.createElement("div"); wrapper.className="menu"; wrapper.id="empty-menu"; wrapper.dataset.menu="";
    wrapper.innerHTML='<button data-menu-trigger hidden type="button">New actions</button><div class="menu-panel"></div>';
    document.querySelector("main").append(wrapper); window.InkwellInteractions.init(wrapper);
  });
  await expect(page.locator("#empty-menu button")).not.toBeVisible();
  await expect(page.locator("#empty-menu [role=menu]")).toHaveCount(0);
  await page.evaluate(() => {
    const wrapper=document.getElementById("empty-menu"); wrapper.querySelector(".menu-panel").innerHTML='<button class="menu-item" type="button">New command</button>';
    window.InkwellInteractions.init(wrapper);
  });
  await page.getByRole("button",{name:"New actions",exact:true}).press("ArrowDown");
  await expect(page.getByRole("menuitem",{name:"New command",exact:true})).toBeFocused();
});

test("all palettes and light/dark/auto keep menu colors aligned with tokens", async ({ page }) => {
  await load(page,"fallback");
  for (const palette of ["indigo","clay","sage","burgundy","azure"]) {
    await page.evaluate(async palette => {
      document.getElementById("palette-css")?.remove();
      if (palette!=="indigo") await new Promise((resolve,reject) => {
        const link=document.createElement("link"); link.id="palette-css"; link.rel="stylesheet"; link.href="/variants/"+palette+".css"; link.onload=resolve; link.onerror=reject; document.head.append(link);
      });
    },palette);
    for (const [mode,os] of [["light","dark"],["dark","light"],["auto","light"],["auto","dark"]]) {
      await page.emulateMedia({colorScheme:os});
      await page.evaluate(mode => {
        document.documentElement.removeAttribute("data-theme");
        if (mode!=="auto") document.documentElement.dataset.theme=mode;
      },mode);
      await open(page);
      await expect.poll(() => page.locator("#action-list").evaluate(el => {
        const probe=document.createElement("span"); probe.style.cssText="color:var(--slate);background:var(--paper)"; document.getElementById("primary-menu").append(probe);
        const a=getComputedStyle(probe), b=getComputedStyle(el), c=getComputedStyle(el.querySelector('.menu-item'));
        const match=a.backgroundColor===b.backgroundColor && a.color===c.color; probe.remove(); return match;
      })).toBe(true);
      await page.keyboard.press("Escape");
    }
  }
});

test("fallback escapes clipping and transformed hosts, preserves tokens, and restores its DOM location", async ({ page }) => {
  await load(page, "fallback");
  await page.locator("#host").evaluate(el => { el.style.cssText = "transform:translateX(5px);overflow:hidden;height:50px;--paper:rgb(240, 244, 248);direction:rtl"; });
  await open(page);
  await expect(page.locator("#action-list")).toHaveCSS("background-color", "rgb(240, 244, 248)");
  await expect(page.locator("#action-list")).toHaveCSS("direction", "rtl");
  expect(await page.locator("#action-list").evaluate(el => el.parentElement === document.body)).toBe(true);
  await page.keyboard.press("Escape");
  expect(await page.locator("#action-list").evaluate(el => el.parentElement.id)).toBe("primary-menu");
  await page.locator("#action-list").evaluate(el => { el.style.setProperty("--paper","rgb(230, 235, 240)"); });
  await open(page);
  await expect(page.locator("#action-list")).toHaveCSS("background-color","rgb(230, 235, 240)");
  await page.keyboard.press("Escape");
  expect(await page.locator("#action-list").evaluate(el => el.style.getPropertyValue("--paper"))).toBe("rgb(230, 235, 240)");
  await page.evaluate(() => {
    const dialog=document.getElementById("settings"); dialog.querySelector('.dialog-body').append(document.getElementById("host")); dialog.showModal();
  });
  await open(page);
  expect(await page.locator("#action-list").evaluate(el => el.parentElement.id)).toBe("settings");
  await page.keyboard.press("Escape");
  await expect(page.locator("#settings")).toBeVisible();
  await expect(page.locator("#actions")).toBeFocused();
});

test("no-script markup exposes ordinary actions instead of an unusable menu trigger", async ({ browser }) => {
  const context = await browser.newContext({javaScriptEnabled:false});
  const page = await context.newPage();
  try {
    await page.goto('http://127.0.0.1:4173' + fixture);
    await expect(page.locator("#actions")).not.toBeVisible();
    await expect(page.locator("#action-list")).toBeVisible();
    await expect(page.getByRole("button", { name:"Rename project",exact:true })).toBeVisible();
    await expect(page.getByRole("menu")).toHaveCount(0);
    await page.getByRole("link", { name:"View documentation",exact:true }).click();
    await expect(page).toHaveURL(/#after$/);
  } finally { await context.close(); }
});

test("menus use system colors, touch targets, and omit popup overlays in print", async ({ page, browserName, isMobile }) => {
  await load(page);
  await open(page);
  if (isMobile) {
    const item = page.getByRole("menuitem", {name:"Rename project",exact:true});
    expect(await item.evaluate(el => el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
  }
  if (browserName === "chromium") {
    await page.emulateMedia({forcedColors:"active"});
    await expect(page.locator("#action-list")).toHaveCSS("forced-color-adjust","auto");
    await expect(page.getByRole("menuitem", {name:"Rename project",exact:true})).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("menuitem", {name:"Duplicate project",exact:true})).toBeFocused();
  }
  await page.emulateMedia({media:"print"});
  await expect(page.locator("#action-list")).not.toBeVisible();
  await expect(page.locator("#actions")).not.toBeVisible();
});
