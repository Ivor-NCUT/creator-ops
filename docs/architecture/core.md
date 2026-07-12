# Core 身份与权限

Better Auth 负责邮箱密码认证、scrypt 散列和数据库会话；Creator Ops 的 `Member` 负责单公司成员状态、部门与系统角色。两层不混用：会话只证明身份，每个服务端读写入口还必须通过 `requireMember` 或 `requirePermission`。

- `/initialize` 只在组织不存在时可用，PostgreSQL advisory transaction lock 保证并发请求中只有一个 Owner。
- `/api/auth/sign-up/email` 对外返回 404；后续成员只能由有 `members:manage` 权限的会话在服务端创建。
- API 通过 Prisma `select` 构造最小响应，不返回 Account、Session 或其他认证字段。
- 成员、部门和登录状态的重要变更写入 `AuditEvent`；审计查询限定在当前公司。
