# V1.2 本周星光回顾与主题进度 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 增加每周主题和本机周回顾，让用户形成稳定的每周回访理由。

**Architecture:** 新增 `weekly` 服务，从现有本机记录派生周统计；新增 `pages/weekly/weekly` 页面和 `data/weekly.js` 主题库。主页、我的和卡册只增加入口，不改变既有卡片协议。

**Tech Stack:** 原生微信小程序、JavaScript、WXML、WXSS、Node.js 回归脚本。

**Spec:** `docs/superpowers/specs/2026-11-08-weekly-retention-design.md`

## Global Constraints

- 不新增账号、云端同步、广告和订阅消息。
- 周主题按 ISO 周编号本地稳定轮换。
- 统计使用现有行动、收藏、历史和访问记录，不新增身份字段。
- 保持 375rpx / 390rpx 窄屏可用，继续支持减少动效。

## Task 1: 周主题与统计服务

**Files:**
- Create: `miniprogram/data/weekly.js`
- Create: `miniprogram/services/weekly.js`
- Modify: `miniprogram/app.js`
- Modify: `tests/run.cjs`

- [ ] Add failing tests for stable week keys, six themes, week-boundary changes, action counts, favorite counts, and empty data.
- [ ] Run the suite and observe the tests fail.
- [ ] Implement `getWeeklyTheme(date)`, `getWeekRange(date)`, and `getWeeklyReview(date)` using local records only.
- [ ] Run the full suite and verify the weekly service.
- [ ] Commit `feat: add local weekly star review service`.

## Task 2: 本周星光页面

**Files:**
- Create: `miniprogram/pages/weekly/weekly.js`
- Create: `miniprogram/pages/weekly/weekly.json`
- Create: `miniprogram/pages/weekly/weekly.wxml`
- Create: `miniprogram/pages/weekly/weekly.wxss`
- Modify: `miniprogram/app.json`
- Modify: `tests/run.cjs`

- [ ] Add failing route/controller checks for page registration and review rendering.
- [ ] Run the suite and observe the route checks fail.
- [ ] Implement the page with theme card, three stats, recent actions and navigation buttons.
- [ ] Keep empty states encouraging and avoid forced completion language.
- [ ] Run the full suite and inspect reduced-motion/narrow layout.
- [ ] Commit `feat: add weekly star review page`.

## Task 3: 入口和卡册进度

**Files:**
- Modify: `miniprogram/pages/profile/profile.wxml`
- Modify: `miniprogram/pages/profile/profile.js`
- Modify: `miniprogram/pages/profile/profile.wxss`
- Modify: `miniprogram/pages/collection/collection.wxml`
- Modify: `miniprogram/pages/collection/collection.js`
- Modify: `tests/run.cjs`

- [ ] Add failing checks for profile/collection weekly entry and progress values.
- [ ] Run the suite and observe the checks fail.
- [ ] Add “本周星光” entry and a compact progress line without changing existing tabs.
- [ ] Run the full suite.
- [ ] Commit `feat: surface weekly star review in profile and collection`.

## Task 4: 文档、验收与推送

**Files:**
- Create: `docs/V1.2-release.md`
- Modify: `README.md`
- Modify: `tests/run.cjs`

- [ ] Add route/privacy static checks.
- [ ] Run `node tests/run.cjs` and record the final count.
- [ ] Test the weekly page at 375px and 390px in DevTools.
- [ ] Update version labels and release notes.
- [ ] Commit `docs: document weekly star review` and push `main`.

