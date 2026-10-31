# Homepage as specimen: implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `examples/index.html` as the five-up press sheet: a display headline over five live palette sheets, a full-size annotated specimen, the adoption paths, a numbered directory, and a display-size close.

**Architecture:** One page (`examples/index.html`) with scoped layout in `examples/home.css` and page-only enhancement in `examples/home.js`. The five sheets are `srcdoc` iframes that link `inkwell.css` plus one variant file each, so palettes render without JavaScript and no file joins the `examples/` inventory. The shared `demo.js` keeps owning theme and palette persistence; `home.js` adds the seams switch, sheet status, theme and direction propagation into the sheets, and the specimen behaviors.

**Tech Stack:** Static HTML and CSS, vanilla JavaScript, Playwright 1.62.1 browser tests via `scripts/run-browser-smoke.sh`, Node built-in test runner for the drift guard, existing repository check scripts.

**Spec:** `docs/specs/2026-10-30-homepage-as-specimen-design.md`

## Global constraints

- Page copy and metadata contain no em dash, en dash, or double hyphen in prose.
- Exactly one `<h1>`, one `<main id="main-content">`, one skip link, one `data-inkwell-version` anchor reading `Inkwell v3.11.0`, one `data-inkwell-deployed` time, canonical `https://inkwell.vinny.dev/`.
- Anchors `#get-started`, `#components`, and `#example-directory` keep working; `#components` wraps the directory.
- All 20 published routes are linked directly from `examples/index.html`; the root `index.html` is not edited.
- Only existing tokens and components; platform font stacks; no hex literals in `home.css`; all page CSS scoped under `.inkwell-home`.
- Coarse-pointer targets are at least 44px tall for every anchor and button on the page.
- No horizontal document overflow at 320px with a 32px root font in either direction.
- Install and agent links pin `v3.11.0`.
- Branch: `claude/homepage-as-specimen`. One commit per task, Conventional Commits with scope, Claude-Session trailer (see the `creating-git-commits` skill).

## Review focus

1. JavaScript disabled: sheets still show five palettes, enhancement-only buttons stay hidden, callouts render, directory has 20 links (Task 6 test `no JavaScript baseline`).
2. A returning visitor with `inkwell-palette=clay` saved: the page loads in Clay, the Clay control is pressed, the Indigo sheet still shows Indigo (Task 2 test `sheets keep their own palettes`).
3. OS dark with a manual Light choice: sheet documents carry `data-theme="light"`, not the OS scheme (Task 2 test `theme and direction propagate into the sheets`).
4. 320px, 32px root font, RTL: the strip scrolls inside itself and the document does not overflow; sheet controls and footer links stay 44px on coarse pointers (Task 6 test `fits enlarged type`).
5. A blank project name followed by a correction: the error is announced and `aria-invalid` clears on input, with no stale success text (Task 3 test `live specimen`).

---

### Task 1: Page skeleton, metadata, header, opening, close, footer

**Files:**
- Modify: `examples/index.html` (replace `<title>` through `</body>`; keep the KEEP IN SYNC pre-paint snippet, icon links, and stylesheet links)
- Modify: `examples/home.css` (replace; keep the `.inkwell-home` scope and the `[hidden]`, `min-inline-size`, `overflow-wrap`, and `scroll-margin` rules)
- Test: `tests/homepage.spec.mjs` (replace the first test)

**Interfaces:**
- Produces: `body.inkwell-home`; `header.home-header` with `nav.home-nav` links Docs, Reference, Showcase, Examples (`#components`), GitHub; `div.theme-toggle[data-home-appearance] hidden` with `[data-theme-choice]` buttons; `button#home-seams[aria-pressed="true"] hidden`; `section.home-intro` with `h1#home-title`, `p.home-lede`, `div.home-actions` (Start building → `#get-started`, Read the reference → `components.html`); `section.home-closing` with `h2#closing-title`; `footer.home-footer` with the release stamp.
- Metadata: title `Inkwell: one system, five inks`; description `A pure-CSS design system for product and editorial interfaces. Three files, 39 component families, five palettes, light and dark, no build step.`; `og:title` and `twitter:title` equal the title; `og:description` and `twitter:description` equal the description.
- Copy: h1 `One system. <em class="accent">Five inks.</em>`; closing h2 `The 1.5px is on purpose.`; closing line `Made with hairlines and serifs. Three files, one contract.`

- [ ] **Step 1: Write the failing test**

```js
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
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", "Inkwell: one system, five inks");
  await expect(page.locator("#components")).toHaveCount(1);
  expect(await page.locator("html").innerHTML()).not.toMatch(/[–—]/);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx --yes --package=playwright@1.62.1 -- sh scripts/run-browser-smoke.sh tests/homepage.spec.mjs --project=desktop-chromium -g "press sheet"`
Expected: FAIL on the title assertion.

- [ ] **Step 3: Rewrite the head metadata and the page shell in `examples/index.html`**

Keep the pre-paint snippet verbatim. Write the header, opening, closing, and footer sections with the ids and classes in Interfaces. Leave placeholder comments `<!-- strip -->`, `<!-- stage -->`, `<!-- adoption -->`, `<!-- directory -->` between them for later tasks. Footer links: Starter template (GitHub blob of `index.html`), GitHub, Vinny Carpenter, the release anchor, the deployment time.

- [ ] **Step 4: Write the shell styles in `examples/home.css`**

Header as a wrapping flex row with the brand, nav, appearance controls, seams switch. Opening: h1 at `clamp(3rem, 2rem + 3vw, 4.5rem)`, serif 600, `-0.035em`, `text-wrap: balance`; `em.accent` italic in `--accent-ink`; lede at `--t-lede` in `--gray-700`, max 53ch. Closing h2 at the same clamp as the h1 minus one step (`clamp(2.25rem, 1.5rem + 2.5vw, 3.5rem)`), with a `--border-rule` above. Footer as today.

- [ ] **Step 5: Run the test to verify it passes**

Run: the Step 2 command. Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add examples/index.html examples/home.css tests/homepage.spec.mjs
git commit -m "feat(homepage): rebuild the page shell around the press-sheet headline"
```

---

### Task 2: The press sheet strip

**Files:**
- Modify: `examples/index.html` (replace `<!-- strip -->`)
- Modify: `examples/home.css`
- Modify: `examples/home.js` (replace; keep nothing from 3.10.0 except the copy-button block, which Task 4 reuses)
- Modify: `scripts/check-contrast.mjs` (two pairs)
- Create: `tests/home-palettes.test.mjs`
- Test: `tests/homepage.spec.mjs` (two new tests)

**Interfaces:**
- Produces: `section.home-press[aria-labelledby="press-title"]` with `h2#press-title` (visually hidden text `Five palettes, printed together`), `div.home-strip` containing five `article.home-sheet[data-sheet="indigo|clay|sage|burgundy|azure"]`. Each sheet: `iframe.home-sheet-frame[title="<Palette name> sheet"][srcdoc]`, then `button.home-sheet-pick[type="button"][data-palette-choice="<name>"]` whose text is the palette name, then `dl.home-diff` with three `div > dt + dd` pairs for `--accent`, `--ivory`, `--accent-ink`, then `p.home-diff-more` containing `a.link[href="variants/<name>.css"]` reading `+N more in variants/<name>.css`. The Indigo sheet's `dl` is replaced by `p.home-diff-more` reading `canonical, 0 overrides`.
- `p.home-status#home-palette-status[role="status"]` under the strip; `home.js` writes `Palette: <Name>. It follows you across the gallery.` after a sheet pick.
- `home.js` exports nothing; it defines `syncSheets()` which copies `document.documentElement`'s `data-theme` (set or removed) and `dir` onto every `iframe.home-sheet-frame` document root, runs on each iframe `load`, and on a `MutationObserver` over `documentElement` attributes `data-theme` and `dir`.
- The `srcdoc` document: `<!doctype html><html lang="en"><head><meta charset="utf-8"><link rel="stylesheet" href="inkwell.css"><link rel="stylesheet" href="variants/clay.css"><style>body{margin:0;padding:var(--sp-4);background:var(--ivory)}</style></head><body><article class="home-sheet-doc">…</article></body></html>` with the variant link omitted for Indigo. Sheet body: `span.eyebrow` reading `Release brief`, `h2.t-h3` reading `Make room for the work.`, a `table.tbl` with header cells `Item`, `Count` and rows `Files to copy · 3`, `Component families · 39`, `Palettes · 5`, a `span.badge.badge-accent` reading `Draft`, and `button.btn.btn-primary[type="button"]` reading `Approve`. Single-quote the `srcdoc` attribute; the content uses double quotes only and `&amp;amp;` for a literal ampersand.
- Diff values (light / dark, verbatim from `variants/*.css`): clay `--accent #D97757 / #E08B6E`, `--ivory #FAF9F5 / #14130E`, `--accent-ink #A04E2C / #E08B6E`; the other three palettes come from their files, and the drift test is the source of truth.

- [ ] **Step 1: Write the failing drift guard**

```js
// tests/home-palettes.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
// parse :root of variants/<name>.css into a Map of raw declarations (copy stripComments/extractBlock/parseDeclarations from scripts/check-contrast.mjs),
// split light-dark(A, B) into [A, B] with a balanced-paren scan, and read examples/index.html.
for (const name of ["clay", "sage", "burgundy", "azure"]) {
  test(`${name} sheet diff matches variants/${name}.css`, () => {
    const vars = rootVars(`variants/${name}.css`);
    const sheet = sheetMarkup(name); // the article[data-sheet=name] substring of examples/index.html
    for (const token of ["--accent", "--ivory", "--accent-ink"]) {
      const [light, dark] = branches(vars.get(token));
      assert.match(sheet, new RegExp(`<dt>${token}</dt>\\s*<dd>${escape(light)} / ${escape(dark)}</dd>`));
    }
    assert.match(sheet, new RegExp(`\\+${vars.size - 3} more in variants/${name}\\.css`));
  });
}
test("indigo sheet is canonical", () => assert.match(sheetMarkup("indigo"), /canonical, 0 overrides/));
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test tests/home-palettes.test.mjs`
Expected: FAIL, five tests, no `article[data-sheet]` found.

- [ ] **Step 3: Write the failing browser tests**

```js
test("sheets keep their own palettes and a pick re-inks the page", async ({ page }) => {
  await page.goto(home + "?palette=clay");
  await expect(page.locator("#inkwell-palette-css")).toHaveAttribute("href", "variants/clay.css");
  await expect(page.locator('[data-palette-choice="clay"]')).toHaveAttribute("aria-pressed", "true");
  const frames = page.locator("iframe.home-sheet-frame");
  await expect(frames).toHaveCount(5);
  const accents = [];
  for (const name of ["indigo", "clay", "sage", "burgundy", "azure"]) {
    const frame = page.frameLocator(`[data-sheet="${name}"] iframe`);
    await expect(frame.locator("table.tbl")).toBeVisible();
    accents.push(await frame.locator("body").evaluate(b => getComputedStyle(b).getPropertyValue("--accent").trim()));
  }
  expect(new Set(accents).size).toBe(5);
  expect(await page.frameLocator('[data-sheet="indigo"] iframe').locator("html").evaluate(h => h.querySelector('link[href^="variants/"]'))).toBeNull();
  await page.locator('[data-palette-choice="sage"]').click();
  await expect(page.locator("#inkwell-palette-css")).toHaveAttribute("href", "variants/sage.css");
  await expect(page.locator("#home-palette-status")).toHaveText("Palette: Sage & Stone. It follows you across the gallery.");
  await expect(page.locator('[data-sheet="sage"] .home-sheet-pick')).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator('[data-sheet="clay"] .home-sheet-pick')).toHaveAttribute("aria-pressed", "false");
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
  expect(await page.frameLocator('[data-sheet="clay"] iframe').locator("html").evaluate(h => h.hasAttribute("data-theme"))).toBe(false);
});
```

- [ ] **Step 4: Run them to verify they fail**

Run: `npx --yes --package=playwright@1.62.1 -- sh scripts/run-browser-smoke.sh tests/homepage.spec.mjs --project=desktop-chromium -g "sheets|propagate"`
Expected: FAIL, zero iframes.

- [ ] **Step 5: Write the strip markup in `examples/index.html`**

Five `article.home-sheet` blocks per Interfaces. Palette display names: `Indigo & Cloud`, `Clay`, `Sage & Stone`, `Burgundy & Bone`, `Azure & Ink`.

- [ ] **Step 6: Write `examples/home.js`: `syncSheets()`, the palette status, and the appearance reveal**

`syncSheets()` per Interfaces. Reveal `[data-home-appearance]` groups once their buttons carry `aria-pressed` (as 3.10.0 did). Listen for `click` on `[data-palette-choice]` and write the status line after `demo.js` has applied the palette (same event, later listener). Load order at the end of `<body>`: `demo.js`, `inkwell-interactions.js`, `home.js`.

- [ ] **Step 7: Style the strip in `examples/home.css`**

`.home-strip` is a five-column grid (`repeat(5, minmax(0, 1fr))`, gap `--sp-4`) above 64rem; below, `display: flex; overflow-x: auto; scroll-snap-type: x proximity; scrollbar-width: thin` with each sheet `flex: 0 0 min(80vw, 22rem); scroll-snap-align: start`. Iframes: `inline-size: 100%; block-size: 22rem; border: var(--border); border-radius: var(--r-md); background: var(--ivory)`. The active sheet (`.home-sheet:has(.home-sheet-pick.is-active) .home-sheet-frame`) gets `border-color: var(--slate)`. `.home-sheet-pick` is a full-width `btn btn-ghost` that inverts when active: `background: var(--slate); color: var(--ivory)`. `.home-diff` is mono caption text in `--gray-700` with `dt` and `dd` on one line.

- [ ] **Step 8: Add the contrast pairs to `scripts/check-contrast.mjs`**

```js
["seam callout (gray-700 on ivory)",      "--gray-700",     "--ivory",        4.5],
["sheet pick active (ivory on slate)",    "--ivory",        "--slate",        4.5],
```

- [ ] **Step 9: Run the drift guard, the browser tests, and the contrast gate**

Run: `node --test tests/home-palettes.test.mjs && node scripts/check-contrast.mjs && <Step 4 command>`
Expected: all PASS; contrast reports 300 pairs.

- [ ] **Step 10: Commit**

```bash
git add examples/index.html examples/home.css examples/home.js scripts/check-contrast.mjs tests/home-palettes.test.mjs tests/homepage.spec.mjs
git commit -m "feat(homepage): print the five palettes together as live srcdoc sheets"
```

---

### Task 3: The seams stage and the seams switch

**Files:**
- Modify: `examples/index.html` (replace `<!-- stage -->`; add the seams callouts to Task 1's h1, Task 2's strip, and this stage)
- Modify: `examples/home.css`, `examples/home.js`
- Test: `tests/homepage.spec.mjs` (two tests; replace the 3.10.0 specimen test)

**Interfaces:**
- Produces: `section.home-stage#seams[aria-labelledby="seams-title"]` with `h2#seams-title` reading `Under the ink.`; a framed `div.home-plate` holding: `span.eyebrow` `Release brief`, `h3#specimen-title` `Make room for the work.`, `table.tbl` (same rows as the sheets), `div.stat-card` with `.stat-num` `39` and `.stat-label` `Component families`, `span.badge.badge-accent` `Draft`, `div.field` with `label.field-label[for="home-project-name"]` `Project name`, `input.input#home-project-name[aria-describedby="home-preview-status"][value="Thoughtful interfaces"]`, `button#home-preview.btn.btn-secondary hidden` `Preview changes`, the `div.menu[data-menu]` with trigger `#home-menu-trigger` `Specimen actions` and `button.menu-item#home-reset` `Reset example`, and `p.home-status#home-preview-status[role="status"]` reading `Try the field or the menu. Fields reset on reload.`
- Callouts: `<span class="seam" aria-hidden="true">…</span>` placed as the last child of the part it names. Twelve on the page: h1 (`h1 · --serif 600 · -0.035em`), strip (`sheet · <iframe srcdoc> · inkwell.css + variants/<name>.css`), plate frame (`frame · --border · 1.5px solid --gray-300 · --r-lg`), eyebrow (`.eyebrow · --mono · --t-eyebrow`), title (`h3 · --serif · --t-h3`), table (`.tbl · hairlines --gray-100 · header --gray-100`), stat (`.stat-card · .stat-num --serif · container-aware`), badge (`.badge-accent · --accent-tint · --accent-ink`), input (`.input · --control-border · 44px on touch`), menu (`.menu[data-menu] · companion · popover`), button (`.btn-primary · --accent · --on-accent`), close (`h2 · --serif · the 1.5px`).
- Seams switch: `button#home-seams[type="button"][aria-pressed="true"] hidden` in the header reading `Seams`; `home.js` reveals it and toggles `aria-pressed` and `body.inkwell-home[data-seams="off"]`; CSS hides `.seam` under `[data-seams="off"]`.
- Specimen behavior in `home.js`: `preview()` validates; blank writes `Enter a project name.` into `#home-preview-status`, sets `aria-invalid="true"` and class `is-error` on the input, focuses it; `input` clears both; a valid preview writes `Preview ready for "<name>".`; `#home-reset` restores the default value, clears the error, writes `Example reset.`

- [ ] **Step 1: Write the failing tests**

```js
test("seams switch shows and hides every callout", async ({ page }) => {
  await page.goto(home);
  const seams = page.locator(".seam");
  await expect(seams).toHaveCount(12);
  await expect(seams.first()).toBeVisible();
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
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx --yes --package=playwright@1.62.1 -- sh scripts/run-browser-smoke.sh tests/homepage.spec.mjs --project=desktop-chromium -g "seams|specimen"`
Expected: FAIL, zero `.seam`.

- [ ] **Step 3: Write the stage markup and the twelve callouts in `examples/index.html`**

- [ ] **Step 4: Write the stage styles and the seam styles in `examples/home.css`**

`.home-plate`: `background: var(--paper); border: var(--border); border-radius: var(--r-lg); padding: var(--sp-6)`; a two-column grid above 46rem (copy and table left, controls right) that stacks below. `.seam`: `display: block; margin-block-start: var(--sp-2); font: var(--t-caption)/1.5 var(--mono); color: var(--gray-700); letter-spacing: 0.02em`, with a `::before` of `◻ ` in `--gray-500`. `.inkwell-home[data-seams="off"] .seam { display: none; }`. The h1's seam sits below the headline; the strip's seam sits above the strip, aligned start.

- [ ] **Step 5: Write the seams switch and the specimen behavior in `examples/home.js`**

Functions `setSeams(on: boolean): void`, `preview(): void`, `reset(): void`, per Interfaces. Reveal `#home-seams` and `#home-preview` on load.

- [ ] **Step 6: Run the tests to verify they pass**

Run: the Step 2 command. Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add examples/index.html examples/home.css examples/home.js tests/homepage.spec.mjs
git commit -m "feat(homepage): annotate the specimen with its tokens behind a seams switch"
```

---

### Task 4: Adoption paths and the numbered directory

**Files:**
- Modify: `examples/index.html` (replace `<!-- adoption -->` and `<!-- directory -->`)
- Modify: `examples/home.css`, `examples/home.js` (copy buttons)
- Test: `tests/homepage.spec.mjs` (keep the 3.10.0 copy test verbatim; the directory assertions live in Task 1's test, so extend it)

**Interfaces:**
- Adoption: the 3.10.0 `section.home-section#get-started` block, unchanged in markup and ids (`#html-install`, `#agent-prompt`, `[data-home-copy]`, `#html-copy-status`, `#agent-copy-status`).
- Directory: `section.home-section#components[aria-labelledby="example-directory-title"]`, `h2#example-directory-title` reading `Find your starting point.`, `nav.home-directory#example-directory` with the three 3.10.0 groups in the same order; each `li` becomes `<li><span class="home-addr" aria-hidden="true">NN</span><a class="link" href="…">…</a></li>` numbered 01 to 20 in document order; the `index.html` entry carries `aria-current="page"`. The `div.home-deep-links` row stays.

- [ ] **Step 1: Extend Task 1's test with the directory assertions**

```js
  const linked = await page.locator("#example-directory a[href]").evaluateAll(links => links.map(a => new URL(a.href).pathname.replace("/examples/", "")));
  expect([...new Set(linked)].sort()).toEqual(routes);
  await expect(page.locator("#example-directory .home-addr")).toHaveCount(20);
  await expect(page.locator("#example-directory .home-addr").first()).toHaveText("01");
  await expect(page.locator("#example-directory .home-addr").last()).toHaveText("20");
  await expect(page.locator('#example-directory a[aria-current="page"]')).toHaveAttribute("href", "index.html");
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx --yes --package=playwright@1.62.1 -- sh scripts/run-browser-smoke.sh tests/homepage.spec.mjs --project=desktop-chromium -g "press sheet|copy actions"`
Expected: FAIL, zero directory links and zero Copy buttons.

- [ ] **Step 3: Write the adoption and directory markup, port the copy-button block into `examples/home.js`, and style `.home-addr`**

`.home-addr`: mono caption in `--gray-500`, `inline-size: 2ch`, `margin-inline-end: var(--sp-3)`, `font-variant-numeric: tabular-nums`.

- [ ] **Step 4: Run the tests and the contract check**

Run: `<Step 2 command> && node scripts/check-system-contract.mjs`
Expected: PASS; contract prints `20 pages`.

- [ ] **Step 5: Commit**

```bash
git add examples/index.html examples/home.css examples/home.js tests/homepage.spec.mjs
git commit -m "feat(homepage): keep both adoption paths and number the directory"
```

---

### Task 5: Responsive layout, preferences, and the appearance-control contrast test

**Files:**
- Modify: `examples/home.css`
- Test: `tests/homepage.spec.mjs` (replace the 3.10.0 enlarged-type test and update the selector in the contrast test)

**Interfaces:**
- Consumes: everything above.
- Produces: coarse-pointer rule covering `.home-nav a, .home-sheet-pick, .theme-toggle .btn, #home-seams, .home-directory a, .home-file-list a, .home-deep-links a, .home-footer a, .home-diff-more a` at `min-block-size: 44px`; forced-colors rule giving `.home-sheet-pick.is-active` and `.theme-toggle .is-active` `background: Highlight; color: HighlightText; outline: 1px solid ButtonText` and `.home-sheet:has(.is-active) .home-sheet-frame` `outline: 2px solid Highlight`.

- [ ] **Step 1: Write the failing test and update the contrast selector**

```js
test("homepage fits enlarged type, RTL, and narrow screens with reachable controls", async ({ page, isMobile, browserName }) => {
  await page.setViewportSize({ width: 320, height: 812 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(home);
  for (const dir of ["ltr", "rtl"]) {
    await page.evaluate(dir => { document.documentElement.dir = dir; document.documentElement.style.fontSize = "32px"; }, dir);
    await expect(page.locator("html")).toHaveCSS("font-size", "32px");
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    expect(await page.locator(".home-strip").evaluate(el => el.scrollWidth > el.clientWidth)).toBe(true);
    await expect(page.locator("#html-install")).toHaveCSS("direction", "ltr");
    const trigger = page.getByRole("button", { name: "Specimen actions", exact: true });
    await trigger.scrollIntoViewIfNeeded();
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
```

In the contrast test, change the locator to `'.theme-toggle .is-active, .home-sheet-pick.is-active'`.

- [ ] **Step 2: Run on mobile and desktop to verify the failures**

Run: `npx --yes --package=playwright@1.62.1 -- sh scripts/run-browser-smoke.sh tests/homepage.spec.mjs --project=desktop-chromium --project=mobile-chromium -g "enlarged|readable labels"`
Expected: FAIL on the 44px assertions or forced-colors outline.

- [ ] **Step 3: Write the responsive, coarse-pointer, and forced-colors rules in `examples/home.css`**

- [ ] **Step 4: Run to verify they pass**

Run: the Step 2 command. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add examples/home.css tests/homepage.spec.mjs
git commit -m "feat(homepage): reflow the strip on phones and keep every control reachable"
```

---

### Task 6: No-JavaScript baseline, full verification, detector, and review

**Files:**
- Test: `tests/homepage.spec.mjs` (replace the 3.10.0 no-JS test)
- Modify: `.github/workflows/pages.yml` (add `node --test tests/home-palettes.test.mjs` after the token-export test)
- Modify: `CLAUDE.md` (one line under "After editing the source CSS": the homepage diff guard)

- [ ] **Step 1: Write the failing no-JS test**

```js
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
    await expect(baseline.locator("#html-install")).toBeVisible();
    await expect(baseline.locator("#example-directory a")).toHaveCount(20);
    await baseline.getByRole("link", { name: "Start building", exact: true }).click();
    await expect(baseline).toHaveURL(/#get-started$/);
  } finally { await context.close(); }
  await page.addInitScript(() => { Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined }); });
  await page.goto(home);
  await expect(page.getByRole("button", { name: "Copy HTML", exact: true })).toHaveCount(0);
});
```

- [ ] **Step 2: Run it**

Run: `npx --yes --package=playwright@1.62.1 -- sh scripts/run-browser-smoke.sh tests/homepage.spec.mjs --project=desktop-chromium -g "without JavaScript"`
Expected: PASS if Tasks 1 to 5 hid enhancement controls statically; otherwise fix the `hidden` attributes and re-run.

- [ ] **Step 3: Wire the drift guard into CI and document it**

Add the test command to `.github/workflows/pages.yml` and one sentence to `CLAUDE.md`.

- [ ] **Step 4: Run every repository gate**

Run:
```bash
node scripts/build-tokens-json.mjs --check && node scripts/build-design-tokens.mjs --check && node --test tests/token-export.test.mjs tests/home-palettes.test.mjs && node scripts/build-changelog-html.mjs --check && node scripts/build-components-reference.mjs --check && node scripts/stamp-deployment.mjs --check && node scripts/check-contrast.mjs && node scripts/check-system-contract.mjs && git diff --check
```
Expected: every line reports pass.

- [ ] **Step 5: Run the detector on the changed files and fix what is mechanical**

Run: `~/.claude/skills/impeccable/scripts/impeccable detect --json examples/index.html examples/home.css examples/home.js`
Expected: exit 0, or findings that are fixed without adding ignores.

- [ ] **Step 6: Run the full browser suite across all four projects**

Run: `npx --yes --package=playwright@1.62.1 -- sh scripts/run-browser-smoke.sh`
Expected: zero failures. Firefox and WebKit failures that reproduce 3.11.0 behavior on untouched pages are environment issues to report, not to patch.

- [ ] **Step 7: Capture review screenshots**

Desktop 1440 light and dark full page, mobile 390 light, into `.impeccable/review/desktop.png`, `desktop-dark.png`, `mobile.png`, settled with no entrance motion; open each and confirm it shows the page.

- [ ] **Step 8: Commit**

```bash
git add tests/homepage.spec.mjs .github/workflows/pages.yml CLAUDE.md
git commit -m "test(homepage): cover the no-script baseline and guard the palette diffs in CI"
```

---

### Task 7: Finish review, changelog, and docs

**Files:**
- Modify: `CHANGELOG.md` (Unreleased entry), `examples/changelog.html` (regenerated), `README.md` (the homepage paragraph)
- Modify: `docs/plans/2026-10-30-homepage-as-specimen-implementation.md` (verification record)

- [ ] **Step 1: Spawn the impeccable finish reviewer**

Inputs: the original request, the design doc, the surface brief (`.impeccable/surfaces/examples-index-html.md`), the artifact path, the three screenshots, the locked sketch `.impeccable/mocks/decision/press-sheet.html` as the critique reference, the detector output, and the craft-floor reference path. Act on the disposition: fix in one batch and recapture, or ship.

- [ ] **Step 2: Write the changelog entry under Unreleased and regenerate**

Entry heading **A homepage that is its own specimen.** Describe the press sheet, the seams, the numbered directory, the dropped toolbar and progress bar, and the drift guard. Then run `node scripts/build-changelog-html.mjs` and confirm `--check` passes.

- [ ] **Step 3: Update the README homepage paragraph**

Replace the sentence that begins `The 3.10.0 homepage` with one describing the press sheet and the seams switch, in plain voice, no em dash.

- [ ] **Step 4: Spawn the impeccable documenter**

Inputs: project root, artifact path, the surface brief, `PRODUCT.md`, and the write boundary (no DESIGN.md rewrite for an established world; report drift only).

- [ ] **Step 5: Record verification in this plan and commit**

```bash
git add CHANGELOG.md examples/changelog.html README.md docs/plans/2026-10-30-homepage-as-specimen-implementation.md
git commit -m "docs(homepage): record the specimen homepage under Unreleased"
```

No version bump, push, or deployment is part of this plan.

## Verification record

Built on October 30, 2026 on branch `claude/homepage-as-specimen`, one commit per task plus two finish-review fixes. Every task's tests were watched red before green; the ledger in the plan workspace records each run and every ruling.

Repository gates: tokens JSON and DTCG export current, 10 node tests pass (token export and the new palette-diff guard), changelog and version stamps current, component reference current, deployment placeholders valid, contrast gate 310 pairs, system contract 20 pages, whitespace clean. Detector: one advisory on `examples/index.html` (em-dash-overuse) that counts the double hyphens in token names printed by the seams and diffs; the page has no em or en dash, the browser test asserts it, and the advisory is recorded as a scoped ignore in `.impeccable/config.json`.

Browser suite: `tests/homepage.spec.mjs` passes on desktop and mobile Chromium (18 tests). The full local run across four projects gave 392 passed, 9 skipped, 143 failed: 136 desktop Firefox launch timeouts (the macOS Firefox runtime cannot start, as CLAUDE.md documents) and 7 desktop WebKit `toBeFocused` failures (6 in `tests/menu.spec.mjs` on an untouched fixture, 1 in the unchanged copy test) that reproduce identically against the base commit 917df01 in a temporary worktree. Firefox and WebKit were therefore not verified for this change on this machine; the project's Linux container fallback needs the Docker daemon, which was not running. A read-only `git archive` snapshot and the container command are ready in the session scratchpad.

Finish review (impeccable finish reviewer, fresh context): first disposition fix with four material findings; all four applied in one batch (`7fccc5c`) and recaptured; verdict pass scored three resolved and one partial, fixed in `dc26cea` and recaptured again. Two craft notes deferred: directory ordinals resolve to nothing, and the phone header wraps to three rows. Review screenshots live in `.impeccable/review/` (desktop light, desktop dark, mobile).
