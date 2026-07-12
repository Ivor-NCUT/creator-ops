# 飞书 Base CSV 导入

不要把真实飞书导出文件复制进仓库。工具读取仓库外的 CSV，默认只校验并输出 dry-run 报告，不上传文件、不保存原始行。

```bash
pnpm import:feishu -- --file /secure/export/projects.csv --type projects
```

支持四种规范化模板：

| type | 必填列 | 可选列 |
| --- | --- | --- |
| `projects` | 名称、负责人邮箱 | 说明 |
| `content` | 标题、类型、负责人邮箱 | 摘要；类型为视频/文章/图书 |
| `parties` | 名称、类型 | 联系人、邮箱；类型为客户/供应商/服务商/顾问 |
| `products` | 名称、SKU | 价格 |

先在飞书中将字段重命名/映射为模板列。dry-run 会校验 UTF-8 CSV、引号、列数、重复表头、必填值和批次内唯一键。仓库的 `examples/feishu/projects-fictional.csv` 仅为虚构格式示例。

确认报告后才写入：

```bash
ALLOW_IMPORT_WRITE=true pnpm import:feishu -- \
  --file /secure/export/projects.csv --type projects --organization default --apply
```

写入在单个数据库事务中进行，任一行失败则整批回滚。导入前先备份；工具不会覆盖已有记录，数据库唯一约束冲突会中止。导入完成后从服务器删除原始 CSV。
