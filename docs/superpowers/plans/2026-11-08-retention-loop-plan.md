# 留存闭环与星光回响 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为今日卡、双人星图和星光骰子增加本机行动闭环，并加入第一版无账号星光回响。

**Architecture:** 新增独立 `actions` 服务和 `action-followup` 组件，不改变既有卡片数据协议。新增 `pages/echo/echo` 只消费公开双人星图参数，在接收设备生成本地回应卡，不引入云端依赖。

**Tech Stack:** 原生微信小程序、JavaScript、WXML、WXSS、Node.js 回归脚本。

**Spec:** `docs/superpowers/specs/2026-11-08-retention-loop-design.md`

## Global Constraints

- 不新增登录、云端同步、广告或公共社区。
- 行动记录最多保留 60 条，只保存卡片 ID、类型、标题、行动文本、日期、状态和时间戳。
- 不保存昵称、性别、私人问题或完整分享链接。
- 不改变既有卡片、历史、收藏和分享链接格式。
- 继续支持减少动效，按钮触达区域保持现有标准。

## Task 1: 本机行动服务与回归

**Files:**
- Create: `miniprogram/services/actions.js`
- Modify: `miniprogram/app.js`
- Modify: `tests/run.cjs`

- [ ] Add failing tests for saving, completing, postponing, bounding at 60 records, and restart persistence.
- [ ] Run `node tests/run.cjs` and observe the new tests fail.
- [ ] Implement `saveAction(card)`, `getAction(cardId)`, `setActionStatus(cardId,status)`, `getRecentActions()` and `getLatestAction()` with validation and atomic local writes.
- [ ] Run the full suite and verify all action tests pass.
- [ ] Commit `feat: add local action follow-up service`.

## Task 2: 行动跟进组件与三个结果入口

**Files:**
- Create: `miniprogram/components/action-followup/action-followup.wxml`
- Create: `miniprogram/components/action-followup/action-followup.wxss`
- Create: `miniprogram/components/action-followup/action-followup.json`
- Create: `miniprogram/components/action-followup/action-followup.js`
- Modify: `miniprogram/pages/home/home.wxml`
- Modify: `miniprogram/pages/home/home.js`
- Modify: `miniprogram/pages/home/home.json`
- Modify: `miniprogram/pages/dice/dice.wxml`
- Modify: `miniprogram/pages/dice/dice.js`
- Modify: `miniprogram/pages/dice/dice.json`
- Modify: `miniprogram/pages/pair/pair.wxml`
- Modify: `miniprogram/pages/pair/pair.js`
- Modify: `miniprogram/pages/pair/pair.json`
- Modify: `tests/run.cjs`

- [ ] Add failing controller/static tests for action state hydration and status changes on home, dice and pair pages.
- [ ] Run the suite and observe the new UI checks fail.
- [ ] Implement the component with the states saved/done/later and dispatch `statuschange`.
- [ ] Wire the component to the three pages without changing card result generation.
- [ ] Add the home “上次留给自己的小行动” entry when a local action exists.
- [ ] Run the full suite and inspect reduced-motion behavior.
- [ ] Commit `feat: add actionable result follow-up loop`.

## Task 3: 无账号星光回响

**Files:**
- Create: `miniprogram/pages/echo/echo.wxml`
- Create: `miniprogram/pages/echo/echo.wxss`
- Create: `miniprogram/pages/echo/echo.json`
- Create: `miniprogram/pages/echo/echo.js`
- Modify: `miniprogram/app.json`
- Modify: `miniprogram/pages/pair/pair.wxml`
- Modify: `miniprogram/pages/pair/pair.js`
- Modify: `miniprogram/pages/pair/pair.json`
- Modify: `miniprogram/services/connection.js`
- Modify: `miniprogram/app.js`
- Modify: `tests/run.cjs`

- [ ] Add failing tests for valid/invalid echo links, three public response choices, no private fields, and pair result preservation.
- [ ] Run the suite and observe the new route tests fail.
- [ ] Implement `getEchoPath(card)` and public echo resolution using existing pair query fields.
- [ ] Implement the echo page with three response choices and a local response card.
- [ ] Add the pair result “邀请对方留下回应” entry and keep the original share flow unchanged.
- [ ] Run the full suite and test the route with guest, bound and pair contexts.
- [ ] Commit `feat: add stateless star echo interaction`.

## Task 4: 文档、验收与推送

**Files:**
- Create: `docs/V1.1-release.md`
- Modify: `README.md`
- Modify: `tests/run.cjs`

- [ ] Add static checks for route registration and privacy-safe echo fields.
- [ ] Run `node tests/run.cjs` and record the final count.
- [ ] Test 375px/390px layouts and reduced motion in DevTools.
- [ ] Update release documentation.
- [ ] Commit `docs: document retention loop and star echo` and push `main`.

