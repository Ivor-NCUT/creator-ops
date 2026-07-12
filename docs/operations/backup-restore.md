# 备份与恢复

脚本需要 PostgreSQL 17 客户端工具。备份使用自校验的 custom format，权限默认为仅当前用户可读。

```bash
DATABASE_URL='postgresql://...' scripts/backup.sh
DATABASE_URL='postgresql://...' scripts/backup.sh /secure/offsite/creator-ops.dump
```

至少每日运行一次，并将文件加密复制到另一台机器或对象存储。定期在隔离环境演练恢复。恢复脚本只接受完全空的目标数据库；检测到任何用户表都会拒绝，避免覆盖现有业务数据。

```bash
createdb creator_ops_restore_test
DATABASE_URL='postgresql://.../creator_ops_restore_test' scripts/restore.sh /secure/offsite/creator-ops.dump
```

恢复后用对应版本代码启动应用，访问健康检查并抽查成员、内容、合同和看板。数据库备份包含附件元数据，不包含外部对象存储二进制文件。
