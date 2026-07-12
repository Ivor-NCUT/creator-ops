# 私有部署

## 前置条件

- Linux 服务器、Docker Engine 与 Docker Compose v2
- 指向服务器的域名和 HTTPS 反向代理
- 至少每日一次的异机数据库备份

从 `.env.example` 创建 `.env`。`POSTGRES_PASSWORD`、`BETTER_AUTH_SECRET`、`AUTOMATION_SECRET` 必须分别使用独立随机值；不要提交 `.env`。`BETTER_AUTH_URL` 使用最终 HTTPS 地址。

```bash
docker compose up -d --build
docker compose ps
curl --fail http://127.0.0.1:${APP_PORT:-3000}/api/health
```

`postgres` 只在 Compose 内网可见。一次性的 `migrate` 服务负责 `prisma migrate deploy`，避免多个 Web 副本同时迁移。`web` 等迁移成功后启动；`automation` 等健康检查成功后每小时执行一次固定、幂等业务规则。查看日志：

```bash
docker compose logs migrate
docker compose logs -f web automation
```

正式库不要运行 `db:seed`。打开 `/initialize` 创建初始 Owner，此后由 Owner/管理员创建成员。应用健康检查仅表示服务与数据库可用，不替代外部可用性监控。

## 反向代理

代理应终止 TLS、传递 `Host` 与 `X-Forwarded-*` 请求头，并限制请求体大小和超时。只开放 80/443；不要开放 PostgreSQL、Docker socket 或内部自动化入口。自动化密钥只存在服务器环境变量中。

## 容量和附件

当前是单体 Next.js + PostgreSQL，适合单公司部署。附件表只保存元数据，尚未实现二进制上传与对象存储；备份数据库不会备份未来接入的对象存储文件。
