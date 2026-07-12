# Creator Ops

Creator Ops 是一套面向内容公司的开源运营管理系统，可在客户自己的服务器上私有化部署。

它把散落在多维表格中的项目、内容生产、直播电商、人事、客户和经营数据变成有明确数据模型、权限边界、自动提醒与部署方式的软件。

## 计划覆盖

- 项目与任务、AI 提效需求
- 短视频选题、拍摄、剪辑、审核、发布和效果数据
- 视频号直播排期、复盘与直播商品经营数据
- 公众号与图书排期
- 部门、员工、考勤、薪资绩效与重大错误
- 客户、服务商、顾问、合同与收付款
- 部门看板与老板经营看板
- 直播提醒、合同到期、差评和内容超时等固定自动化

## 架构

项目采用一个 Next.js 全栈应用和 PostgreSQL。详细设计见 [系统设计](docs/superpowers/specs/2026-07-12-creator-ops-design.md)。

已实现的模块文档：

- [Core 身份与权限](docs/architecture/core.md)
- [工作与内容生产](docs/architecture/work-content.md)

## 本地启动

```bash
cp .env.example .env
# 把 BETTER_AUTH_SECRET 替换为 `openssl rand -base64 32` 生成的随机值
pnpm install
docker compose up -d postgres
pnpm db:dev --name init
pnpm dev
```

应用地址为 `http://localhost:3000`，健康检查为 `http://localhost:3000/api/health`。
空库首次打开会进入 `/initialize`，用于创建唯一的初始 Owner。后续账号由 Owner 或管理员在“成员设置”中创建，系统不开放公开注册。

常用验证命令：

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## 状态

正在开发首个可部署版本。当前仓库不包含原始飞书数据，后续只提供虚构示例数据和迁移工具。

## License

[MIT](LICENSE)
