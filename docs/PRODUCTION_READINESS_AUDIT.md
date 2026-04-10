# AccessPilot 生产可用性审计（2026-04-10）

## 1) 未完成任务检查（基于 TASKS）

当前仍未完成或仅部分完成的关键项：

- 鉴权与组织：`T007/T009/T010`（已有登录与组织作用域，注册和首登自动建组织未完成）
- 扫描执行：`T018-T038`（仍缺异步队列、Playwright 抓取、axe 扫描、去重与评分完整链路）
- 报告展示：`T046-T055`（只有骨架，缺完整问题筛选/趋势/历史）
- 商业化：`T056-T071`（PDF、支付、通知未完成）
- 稳定性：`T079-T088`（自动化测试/E2E/部署链路缺失）

## 2) 不适合大规模生产的架构/代码

- `rateLimit` 当前是**进程内内存桶**，多实例部署下会失效；应迁移到 Redis 限流（如 Upstash/Cloudflare KV/Redis）。
- 扫描任务仍是“写记录”模式，未接 worker 队列；高并发场景缺隔离与重试队列保障。
- 目前未接入集中错误上报（Sentry）和可观测性指标（Tracing/Metrics）。

## 3) 重大漏洞与暴露面检查

已修复/加固：

- 私有接口要求登录（middleware）并按组织作用域过滤。
- 添加站点 API 增加 URL 安全校验（协议限制、私网 IP/解析结果拦截、重复站点冲突检测）。
- 登录与添加站点引入 Cloudflare Turnstile 人机验证。
- 扫描创建流程改为事务 + advisory lock，避免同站点并发重复入队。

说明：

- “F12 能看到前端请求地址/接口路径”是 Web 应用的正常现象，不等于漏洞。
- 真正需要保护的是：
  - 服务端鉴权
  - 权限校验
  - 限流
  - 服务端密钥不暴露

## 4) 本次新增/修复项

- 登录页：提交前必须通过 Turnstile。
- 添加站点：API 需要携带并验证 Turnstile token。
- 站点表增加 `(organizationId, baseUrl)` 唯一约束。
- seed 默认密码风险移除：需显式 `ALLOW_DEV_SEED=true` 且提供 `DEV_SEED_PASSWORD`。

## 5) 可运行性检查

通过：

- `npm install`
- `npm run prisma:generate`
- `npm run lint`
- `npm run typecheck`
- `npm run build`

备注：构建存在 NextAuth/jose 的 edge runtime warning（非阻塞），后续建议根据部署策略优化 middleware 方案。
