# AccessPilot MVP

电商网站无障碍合规扫描 + 报告生成 SaaS 的 MVP 起步工程（Monorepo）。

## 当前已落地范围
- `T001`：Next.js + TypeScript + Tailwind + Prisma 项目骨架。
- `T002`：ESLint / Prettier / husky / lint-staged 配置。
- `T003`：`.env.example` 模板（数据库、鉴权、Redis、Stripe、邮件、Sentry）。
- `T004`：PostgreSQL Prisma 模型初始化（用户、组织、站点、扫描、问题、订阅）。
- `T005`：基础 UI 框架（后台布局、导航、按钮、卡片、列表页/详情页骨架）。
- `T011/T012/T013/T014/T015/T017/T019/T020`：站点接入与手动触发扫描最小闭环（API + 页面）。
- 安全加固：基础速率限制、组织作用域、重复任务拦截、私网 IP 拒绝。

## 一键启动（本地）

```bash
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

访问 `http://localhost:3000`。

## 目录

- `apps/web`: Next.js 后台应用
- `packages/shared`: 共享类型与工具
- `packages/scanner`: 扫描结果结构化逻辑（初版）
- `prisma`: 数据模型与 seed

## 当前限制

- 当前使用 `DEFAULT_ORG_ID` 作为开发阶段组织隔离，尚未接入完整鉴权（T007-T010）。
- 扫描 API 仅创建任务记录，尚未接入真实队列 Worker 执行 Playwright + axe（T018, T023+）。

## 下一步建议

1. 接入真实鉴权（Clerk 或 NextAuth）并完成组织权限中间件（T007-T010, T079）。
2. 接入队列（BullMQ/Trigger.dev）执行真实 Playwright + axe 扫描（T018, T023-T038）。
3. 完成报告页、支付、通知和部署链路（T046+）。
