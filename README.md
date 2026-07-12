# Creator Ops

Creator Ops 是面向内容公司的开源运营管理系统：一个公司一次私有化部署，在同一套权限与数据模型中管理项目、AI 提效、内容生产、直播电商、人事薪酬、客户合同、经营看板与固定提醒。

仓库不含任何原始业务记录。内置的“灯塔内容实验室”及人员、金额、账号、商品和事件均为专门创作的虚构仿真数据，用来快速展示从内容种草到直播转化、售后复盘和回款跟踪的完整业务故事。

## 五分钟体验

需要 Node.js 22、pnpm 10 和 Docker。

```bash
cp .env.example .env
# 把 .env 中三份密码/密钥改成安全随机值；本地数据库地址使用 localhost:5433
pnpm install
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres
pnpm db:migrate
pnpm db:seed
pnpm db:verify-demo
pnpm dev
```

打开 `http://localhost:3000/login`，使用：

- Owner：`owner@demo.creator-ops.example.com`
- 内容经理：`manager@demo.creator-ops.example.com`
- 剪辑：`editor@demo.creator-ops.example.com`
- 主播：`host@demo.creator-ops.example.com`
- HR：`hr@demo.creator-ops.example.com`
- 财务：`finance@demo.creator-ops.example.com`
- 默认演示密码：`CreatorOpsDemo!2026`（可用 `DEMO_PASSWORD` 覆盖）

演示账号由 Better Auth 正常创建，`pnpm db:verify-demo` 会真实登录 Owner，并验证跨模块关系、看板时间范围和异常提醒场景。首次正式使用请勿 seed；空库打开 `/initialize` 创建唯一 Owner。

## 已覆盖模块

- 项目任务、AI 提效需求
- 短视频、公众号文章、图书选题、发布账号与效果快照
- 直播排期、人员、预热内容、商品经营、差评与投诉
- 员工档案、考勤审批、月度薪资与重大失误
- 客户、供应商、服务商、合同、应收应付与到账记录
- 老板/部门看板，直播提醒、合同到期、差评、视频 SLA 与经营异常自动化

## 生产私有部署

在一台安装 Docker Compose 的服务器上克隆仓库，配置 `.env` 后运行：

```bash
docker compose up -d --build
curl --fail http://127.0.0.1:3000/api/health
```

Compose 中 PostgreSQL 不暴露宿主机端口；独立 `migrate` 任务先完成迁移，`web` 再启动，`automation` 每小时调用幂等调度入口。公网部署必须在前方配置 HTTPS 反向代理，并将 `BETTER_AUTH_URL` 设为最终 HTTPS 地址。完整说明见 [部署与运维](docs/operations/deployment.md)。

## 数据与迁移

- 备份恢复：[备份与恢复](docs/operations/backup-restore.md)
- 版本升级：[升级指南](docs/operations/upgrade.md)
- 安全边界：[安全说明](docs/operations/security.md)
- 飞书 Base CSV：[导入指南](docs/import/feishu-base.md)
- 安全重建演示库：`ALLOW_DEMO_RESET=true pnpm db:demo:reset`。命令仅接受数据库中唯一的 `demo-lighthouse` 组织，生产环境永远拒绝。

附件当前只保存 `FileMetadata` 元数据，不包含文件二进制存储；正式接入对象存储前，示例 URL 仅作界面说明。

## 开发验证

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

架构文档位于 [`docs/architecture`](docs/architecture)，系统总体设计见 [`docs/superpowers/specs/2026-07-12-creator-ops-design.md`](docs/superpowers/specs/2026-07-12-creator-ops-design.md)。

## License

[MIT](LICENSE)
