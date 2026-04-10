# AccessPilot MVP 要求核对（基于 TASKS）

> 更新时间：2026-04-10
> 说明：仅核对“上线必做”任务的当前达成状态。

## P0 项目基础

- [x] `T001` 初始化代码仓库（Next.js + TS + Tailwind + Prisma 已落地）
- [x] `T002` 代码规范（ESLint + Prettier + husky + lint-staged；pre-commit 已执行 lint/typecheck）
- [x] `T003` 环境变量模板（.env.example 含 DB/Auth/Redis/Stripe/邮件/Sentry）
- [x] `T004` Prisma + PostgreSQL 连接模型
- [ ] `T005` shadcn/ui（当前为自定义基础 UI 组件，未正式接入 shadcn）
- [ ] `T006` 日志与错误上报（未接入 Sentry SDK / 结构化日志）

## P1 账户与组织

- [ ] `T007` 注册登录（未接入 Clerk/NextAuth）
- [x] `T008` 组织模型（Organization/Member 已建模）
- [ ] `T009` 首登初始化流程（缺少真实登录后自动引导）
- [~] `T010` 权限校验（已做组织作用域基础限制，未完成真实鉴权闭环）

## P2 站点接入

- [x] `T011` sites 数据表
- [x] `T012` 添加站点 API（含 URL 校验、冲突检测、限流）
- [x] `T013` 添加站点页面
- [~] `T014` 站点列表页（有列表；暂无最近扫描时间/问题总数）
- [x] `T015` 站点详情页骨架（概览/扫描历史/问题/设置占位）
- [ ] `T016` 站点状态切换

## P3 扫描任务系统

- [x] `T017` scans/scan_pages/scan_jobs 表
- [ ] `T018` 异步任务队列（BullMQ/Trigger.dev 未接）
- [x] `T019` 手动触发扫描 API
- [ ] `T020` 前端状态轮询
- [ ] `T021` 自动重试
- [ ] `T022` 扫描日志查看

## 关键风险（当前阻塞上线）

1. 缺少真实鉴权与组织权限闭环（`T007/T009/T010/T079`）。
2. 缺少真实扫描执行链路（`T018`, `T023-T038`）。
3. 缺少支付、通知、报告导出（`T056+`, `T061+`, `T067+`）。

## 下一步（严格按 Sprint 1）

1. 接入 NextAuth（或 Clerk）并完成组织中间件。
2. 接入 BullMQ，打通 scan_job 入队 + worker 回写状态。
3. 站点列表补齐最近扫描时间、问题总数字段展示。
