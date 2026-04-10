# AccessPilot MVP

电商网站无障碍合规扫描 + 报告生成 SaaS 的 MVP 起步工程（Monorepo）。

## 当前已落地范围

- `T001`：Next.js + TypeScript + Tailwind + Prisma 项目骨架。
- `T002`：ESLint / Prettier / husky / lint-staged 配置。
- `T003`：`.env.example` 模板（数据库、鉴权、Redis、Stripe、邮件、Sentry）。
- `T004`：PostgreSQL Prisma 模型初始化（用户、组织、站点、扫描、问题、订阅）。
- `T005`：基础 UI 框架（后台布局、导航、按钮、卡片、列表页/详情页骨架）。
- `T011/T012/T013/T014/T015/T017/T019/T020`：站点接入与手动触发扫描最小闭环（API + 页面）。
- 安全加固：基础速率限制、组织作用域、重复任务拦截、私网 IP 拒绝、Turnstile 人机验证。

## 一键启动（本地）

```bash
cp .env.example .env
# 必填（仅本地开发）
# ALLOW_DEV_SEED=true
# DEV_SEED_PASSWORD=your_local_password
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

访问 `http://localhost:3000`。

## 登录（开发环境）

- 登录地址：`/login`
- 默认账号：`owner@accesspilot.dev`
- 密码：`DEV_SEED_PASSWORD` 的值（由 `prisma/seed.ts` 生成哈希）

## 目录

- `apps/web`: Next.js 后台应用
- `packages/shared`: 共享类型与工具
- `packages/scanner`: 扫描结果结构化逻辑（初版）
- `prisma`: 数据模型与 seed

## 当前限制

- 已接入 NextAuth 基础登录与路由保护，但注册流程、首登自动建组织、细粒度角色权限仍未完成（T007-T010）。
- 扫描 API 仅创建任务记录，尚未接入真实队列 Worker 执行 Playwright + axe（T018, T023+）。
- 当前限流为进程内内存桶，生产建议迁移 Redis/边缘限流。

## 下一步建议

1. 接入队列（BullMQ/Trigger.dev）执行真实 Playwright + axe 扫描（T018, T023-T038）。
2. 完成报告页、支付、通知和部署链路（T046+）。
3. 接入 Sentry + 分布式限流 + API 集成测试，补齐生产保障。
