# 视觉系统与核心流程优化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不改变现有牌库、匹配算法和本地数据格式的前提下，统一松绿暖白金色与暗紫强调的视觉系统，收拢首页主线，明确今日卡与今日主签，并把吉运骰子优化为更清晰的星光行动工具。

**Architecture:** 继续使用原生微信小程序的 WXML / WXSS / JavaScript，不新增运行时依赖。先建立全局语义颜色、圆角、间距和动效变量，再按页面消费这些变量；页面层只调整展示结构、文案和动画状态，服务层与分享数据协议保持不变。

**Tech Stack:** 原生微信小程序、JavaScript、WXML、WXSS、Node.js 回归脚本。

**Spec:** `docs/superpowers/specs/2026-11-07-visual-system-and-core-flow-design.md`

## Global Constraints

- 主视觉保留暖白、深松绿、低饱和金色；暗紫只用于启动、星图、骰子和少量状态强调。
- 不新增登录、云端同步、社区、付费系统或真实广告。
- 不改变牌库、答案之书、匹配算法、分享链接、本地收藏和历史数据格式。
- 保持原生小程序、无新增运行时依赖，并继续支持 `reduced motion`。
- 功能型箭头和图标不得依赖平台 Emoji 渲染。
- 375rpx、390rpx 窄屏不能横向溢出，触控区域保持约 88rpx 或更高。

## Review Focus

- 首页按钮“今日主签”必须进入今日主签流程，不得与首页今日星座卡混淆；由 Task 2 的页面控制器回归覆盖。
- 抽卡页四项入口在窄屏上必须可读、可点且不挤压；由 Task 2 的 WXML 静态检查和开发者工具验收覆盖。
- 单人、双人、未绑定星座三种骰子上下文都要保持结果可还原；由 Task 3 复用现有 connection 回归并新增页面文案检查覆盖。
- 减少动效开启后骰子和页面切换不能停留在半透明或滚动中间态；由 Task 3 的控制器回归覆盖。
- iOS 与 Android 不能因为箭头、星点或状态图标字体差异改变信息含义；由 Task 4 的 Unicode / WXML 静态检查和真机验收覆盖。

### Task 1: 建立统一的视觉令牌与功能图标基线

**Files:**
- Modify: `miniprogram/app.wxss`
- Modify: `miniprogram/pages/launch/launch.wxss`
- Modify: `miniprogram/pages/home/home.wxss`
- Modify: `miniprogram/pages/dice/dice.wxss`
- Modify: `miniprogram/pages/pair/pair.wxss`
- Test: `tests/run.cjs`

**Interfaces:**
- Produces semantic variables for paper, surface, ink, muted, forest, gold, plum, border, radius and motion timing.
- Existing pages continue to use the same class names and data contracts.

- [ ] **Step 1: Write the failing static checks**

  Add a small UI-token check to `tests/run.cjs` that reads the listed WXSS files and asserts the shared semantic variables exist in `app.wxss`, the dark plum token is present, and no page introduces a new saturated purple literal.

- [ ] **Step 2: Run the focused check and verify it fails**

  Run: `node tests/run.cjs`

  Expected: the new token assertions fail before the variables and page overrides are added.

- [ ] **Step 3: Implement the shared token layer**

  Add the approved palette (`#F4F2EC`, `#FCFBF7`, `#233F39`, `#283C33`, `#B5A179`, `#342C46`, `#8A7A9C`, `#D9DCCF`), 12/16/24rpx radius tokens, 8rpx spacing helpers where useful, and fast/standard/ritual timing variables. Replace repeated page-level base colors in the touched pages with semantic variables. Keep decorative star color separate from functional icon color.

- [ ] **Step 4: Run the full regression**

  Run: `node tests/run.cjs`

  Expected: all existing checks plus the new token checks pass.

- [ ] **Step 5: Commit**

  ```powershell
  git add miniprogram/app.wxss miniprogram/pages/launch/launch.wxss miniprogram/pages/home/home.wxss miniprogram/pages/dice/dice.wxss miniprogram/pages/pair/pair.wxss tests/run.cjs
  git commit -m "refactor: centralize constellation card visual tokens"
  ```

### Task 2: 收拢首页与抽卡入口层级

**Files:**
- Modify: `miniprogram/pages/home/home.wxml`
- Modify: `miniprogram/pages/home/home.js`
- Modify: `miniprogram/pages/home/home.wxss`
- Modify: `miniprogram/pages/draw/draw.wxml`
- Modify: `miniprogram/pages/draw/draw.wxss`
- Modify: `tests/run.cjs`

**Interfaces:**
- `home.openDraw()` continues to route to `pages/draw/draw`, but the user-facing copy becomes “抽一张今日主签”.
- `home.openDetail()` remains the route for the visible “今日星座卡”.
- No service or share query format changes.

- [ ] **Step 1: Write the failing navigation/copy checks**

  Extend the home controller test to assert that the primary home action keeps the draw route while the WXML contains “今日主签” and the visible card remains labeled as the daily zodiac card. Add a static check that the draw mode row uses a two-line or grouped layout marker rather than four equal-width labels on one narrow row.

- [ ] **Step 2: Run the focused check and verify it fails**

  Run: `node tests/run.cjs`

  Expected: the copy/layout assertions fail against the current text and single-row mode switch.

- [ ] **Step 3: Implement the information hierarchy**

  Keep the home hero, daily action, pair entry and dice entry. Move the answer book, quiz and theme rows into a visually secondary “再给自己一个角度” region. Change the primary button to “抽一张今日主签” and make the visible card context explicitly “今日星座卡”. In `draw.wxml`, use a compact grouped layout that remains readable at 375rpx without changing the existing mode values or navigation handlers.

- [ ] **Step 4: Run the full regression and inspect narrow layout**

  Run: `node tests/run.cjs`

  In DevTools inspect 375px and 390px widths. Expected: no horizontal overflow, all four draw destinations remain reachable, and the home primary action label matches its destination.

- [ ] **Step 5: Commit**

  ```powershell
  git add miniprogram/pages/home/home.wxml miniprogram/pages/home/home.js miniprogram/pages/home/home.wxss miniprogram/pages/draw/draw.wxml miniprogram/pages/draw/draw.wxss tests/run.cjs
  git commit -m "refactor: clarify home and draw navigation"
  ```

### Task 3: 优化星光骰子的信息表达与动画层级

**Files:**
- Modify: `miniprogram/pages/dice/dice.wxml`
- Modify: `miniprogram/pages/dice/dice.wxss`
- Modify: `miniprogram/pages/dice/dice.js`
- Modify: `miniprogram/components/zodiac-die/zodiac-die.wxml`
- Modify: `miniprogram/components/zodiac-die/zodiac-die.wxss`
- Modify: `miniprogram/components/zodiac-die/zodiac-die.js`
- Modify: `miniprogram/pages/pair/pair.wxml`
- Modify: `miniprogram/pages/pair/pair.wxss`
- Modify: `tests/run.cjs`

**Interfaces:**
- `getApp().rollDice(input)` and `zodiac-die` properties (`value`, `rolling`, `signs`, `reduced`) remain unchanged.
- The dice result still resolves through the existing `dice-d1` card schema and existing share paths.

- [ ] **Step 1: Write the failing result presentation checks**

  Add controller/static assertions that solo and pair dice pages expose a short direction label, the six existing faces remain named 出发/松弛/表达/尝鲜/整理/温暖, and pair context still displays both public signs without private aliases.

- [ ] **Step 2: Run the focused check and verify it fails**

  Run: `node tests/run.cjs`

  Expected: the new direction-label assertions fail against the current result template.

- [ ] **Step 3: Implement the result hierarchy**

  Rename visible page copy toward “星光骰子” and “摇出一个小方向”. Add a compact result lead-in (`你摇到的是：{faceName}`) before the full reading card, then keep the one-action next-step note and existing save/share actions. In pair context, show the public `signA × signB` line and use “小约定” copy.

- [ ] **Step 4: Refine the cube stage without changing the data model**

  Keep the CSS 3D cube, but use the shared plum token only for the stage glow/orbit, reduce redundant orbit contrast, strengthen face frame and face-name readability, and add a landing highlight that remains bounded. Preserve the 1900ms animation fallback and skip control unless the visual check shows it is too slow; reduced motion must show the settled face immediately.

- [ ] **Step 5: Run the full regression and inspect all contexts**

  Run: `node tests/run.cjs`

  In DevTools inspect guest, bound-sign and pair dice flows with reduced motion both on and off. Expected: no blank face, no stuck rolling state, and unchanged share/history behavior.

- [ ] **Step 6: Commit**

  ```powershell
  git add miniprogram/pages/dice/dice.wxml miniprogram/pages/dice/dice.wxss miniprogram/pages/dice/dice.js miniprogram/components/zodiac-die/zodiac-die.wxml miniprogram/components/zodiac-die/zodiac-die.wxss miniprogram/components/zodiac-die/zodiac-die.js miniprogram/pages/pair/pair.wxml miniprogram/pages/pair/pair.wxss tests/run.cjs
  git commit -m "refactor: clarify and polish constellation dice"
  ```

### Task 4: 跨平台图标、版本文档与验收

**Files:**
- Modify: `miniprogram/pages/answer/answer.wxml`
- Modify: `miniprogram/pages/collection/collection.wxml`
- Modify: `miniprogram/pages/detail/detail.wxml`
- Modify: `miniprogram/pages/share-preview/share-preview.wxml`
- Modify: `miniprogram/pages/spread/spread.wxml`
- Modify: `miniprogram/pages/profile/profile.wxml`
- Modify: `miniprogram/pages/about/about.wxml`
- Modify: `README.md`
- Create: `docs/V1.0-release.md`
- Test: `tests/run.cjs`

**Interfaces:**
- Public share paths, card data and page routes remain unchanged.
- Functional arrows use text-presentation characters or local assets consistently across iOS and Android.

- [ ] **Step 1: Write the failing cross-platform static checks**

  Add checks that no touched WXML uses the unqualified `↗` glyph and that visible version text matches the new release number.

- [ ] **Step 2: Run the focused check and verify it fails**

  Run: `node tests/run.cjs`

  Expected: existing unqualified arrow/version strings are reported.

- [ ] **Step 3: Normalize functional icons and release copy**

  Keep decorative stars as decorative content, but make arrows text-presentation or replace them with the project’s local icon assets. Update visible version labels and document the palette, navigation, dice and cross-platform changes in `README.md` and `docs/V1.0-release.md`.

- [ ] **Step 4: Run final verification**

  Run: `node tests/run.cjs`

  Inspect at least 375px, 390px and a larger Android viewport in DevTools, then test one iOS device and one Android device. Expected: all 78+ checks pass, no horizontal overflow, no platform Emoji arrows, and no regression in sharing or local history.

- [ ] **Step 5: Commit and push**

  ```powershell
  git add miniprogram/pages/answer/answer.wxml miniprogram/pages/collection/collection.wxml miniprogram/pages/detail/detail.wxml miniprogram/pages/share-preview/share-preview.wxml miniprogram/pages/spread/spread.wxml miniprogram/pages/profile/profile.wxml miniprogram/pages/about/about.wxml README.md docs/V1.0-release.md tests/run.cjs
  git commit -m "feat: ship refined constellation card visual system"
  git push origin main
  ```

