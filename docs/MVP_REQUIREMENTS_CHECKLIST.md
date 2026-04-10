# AccessPilot MVP 要求核对（基于 TASKS）

> 更新时间：2026-04-10
> 说明：仅核对“上线必做”任务的当前达成状态。

## P0 项目基础

- [x] `T001` 初始化代码仓库（Next.js + TS + Tailwind + Prisma 已落地）
- [x] `T002` 代码规范（ESLint + Prettier + husky + lint-staged；pre-commit 已执行 lint/typecheck）
- [x] `T003` 环境变量模板（.env.example 含 DB/Auth/Redis/Stripe/邮件/Sentry/Turnstile）
- [x] `T004` Prisma + PostgreSQL 连接模型
- [ ] `T005` shadcn/ui（当前为自定义基础 UI 组件，未正式接入 shadcn）
- [~] `T006` 日志与错误上报（已接入结构化日志；Sentry SDK 仍未接）

## P1 账户与组织

- [~] `T007` 注册登录（已接入 NextAuth Credentials 登录；注册流程待补）
- [x] `T008` 组织模型（Organization/Member 已建模）
- [ ] `T009` 首登初始化流程（自动建组织与引导待补）
- [~] `T010` 权限校验（已接入登录拦截和组织作用域；细粒度角色权限待补）

## P2 站点接入

- [x] `T011` sites 数据表
- [x] `T012` 添加站点 API（含 URL 校验、冲突检测、限流、turnstile）
- [x] `T013` 添加站点页面
- [~] `T014` 站点列表页（有列表；暂无最近扫描时间/问题总数）
- [x] `T015` 站点详情页骨架（概览/扫描历史/问题/设置占位）
- [ ] `T016` 站点状态切换

## P3 扫描任务系统

- [x] `T017` scans/scan_pages/scan_jobs 表
- [ ] `T018` 异步任务队列（BullMQ/Trigger.dev 未接）
- [x] `T019` 手动触发扫描 API（事务化服务层）
- [ ] `T020` 前端状态轮询
- [ ] `T021` 自动重试
- [ ] `T022` 扫描日志查看

## 安全补充

- [~] `T080` 接口限流（已覆盖关键写接口，待迁移 Redis/边缘级限流）
- [x] Cloudflare Turnstile（已接入登录与添加站点）
- [x] 站点唯一约束（`organizationId + baseUrl`）
- [x] 扫描触发并发保护（事务 + advisory lock）
- [x] SSRF 基础补强（localhost/私网解析拦截）

## 关键风险（当前阻塞上线）

1. 缺少真实扫描执行链路（`T018`, `T023-T038`）。
2. 缺少支付、通知、报告导出（`T056+`, `T061+`, `T067+`）。
3. 缺少自动化测试与部署验收（`T082+`）。
