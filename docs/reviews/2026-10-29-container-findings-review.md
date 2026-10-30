# Container-aware findings and example navigation

Implemented on `codex/container-aware-findings`, with no publication or version bump requested. The current release remains 3.7.0; the new behavior and navigation are recorded under Unreleased. The implementation tested below is `c6754af`.

## Result

- Each `.finding` measures its own inline size and queries its direct children. Up to 35rem, they stack with an 8px gap; above that, the existing 150px statistic column and 24px column gap remain. The statistic uses bounded container-relative type. Existing paragraph and explanation-wrapper markup, standalone usage, nested findings, and both reading directions work without JavaScript.
- Containment is local to findings. Long metrics and source URLs wrap, and the query threshold grows with the root font preference. Normal block, stretched flex, and defined grid hosts supply width; shrink-to-fit/intrinsic hosts need an explicit available width. This standard containment constraint is documented in the public contract.
- The published gallery already linked all current routes. It retains that coverage, adds a direct finding-demo link, and points to the starter source instead of a deployment-time self link. Root `index.html` now has an Examples navigation link and a native disclosure containing direct links to all 20 published pages.
- Static and browser checks compare both indexes with the filesystem route inventory. The root summary count is checked too. No additional published page, root token, font, dependency, or install step was introduced.

## Verification

Before production CSS changes, browser cases failed for narrow findings on a wide screen and viewport-dependent statistic sizing. The root starter's missing directory was established by source inspection. The final regression cases verify behavior and real geometry rather than only checking that container CSS exists.

| Check | Result |
|---|---|
| Full Linux browser matrix | **349 passed, 11 expected skips**, all four projects, matching official Playwright 1.62.1 image, read-only archive of `c6754af`. |
| Full macOS browser matrix | **262 passed, 8 expected skips**, Chromium, WebKit, and mobile Chromium. Firefox coverage uses the working Linux runtime. |
| Finding regressions | Narrow/wide and standalone geometry, exact 35rem boundary, local typography stable across viewport changes, unrelated/nested containers, resize, RTL, enlarged text, long metrics/source URLs, all five palettes in both modes, grid/flex hosts, and print content growth. |
| Navigation regressions | Both indexes expose every published page; the root disclosure opens normally. Both indexes fit 320px with a 32px root in LTR and RTL. The existing full-suite route/type/direction inventory remains intact. |
| Static gates | All **280 contrast pairs**, five token-export tests, token/reference/changelog generation checks, deployment placeholders, repository contract, mirror parity, and whitespace checks pass. |
| Visual review | Root example directory opened and inspected. Wide and narrow findings reviewed in light/dark/auto; auto restored. Screenshots are outside tracked sources in `.claude/screenshots/container-findings-{light,dark,index}.jpg`. No viewport override was applied. |

Expected skips remain platform/input-specific exclusions, including forced-colors emulation outside Chromium. VoiceOver and native Windows testing remain skipped at the user's request. Automated WebKit checks are not a native Safari or assistive-technology certification.

Modern Web Guidance's `size-aware-styling` guide informed the local inline-size query context and stacked fallback. [MDN's container-type reference](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/container-type) describes descendant queries and the intrinsic-width containment constraint. No style queries or newer container capabilities outside the existing browser floor are required.
