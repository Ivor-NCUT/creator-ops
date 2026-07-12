# 工作与内容生产

`Project`、`Task` 与 `AiRequest` 组成工作域；`ContentItem` 是视频、公众号文章和图书的唯一内容主记录，类型专属字段分别放在 `VideoDetail` 和 `EditorialDetail`。IP/栏目、发布账号和生产人员都引用当前组织的记录，不使用真实名称枚举。

内容状态只通过 `src/lib/work-content/service.ts` 流转。服务在同一事务中按旧状态更新 `ContentItem`，并追加 `ContentStatusHistory` 与 `WorkEvent`；非法或并发过期的流转会失败。发布效果使用 `PublicationMetricSnapshot` 按采集时间追加，历史快照不会被后续导入覆盖。

工作量查询直接聚合已完成任务的 `points` 与内容生产 `WorkEvent`，不保存第二张人工汇总表。所有 Server Actions 先取得当前成员，并对关联记录执行 `organizationId` 归属校验；Owner、Admin、Manager 可管理整个工作/内容域，普通成员只能变更自己负责或参与的记录。

页面入口：

- `/work`：项目列表/新建、AI 提效需求和状态流转。
- `/work/projects/[id]`：项目详情、任务新建和状态流转。
- `/content`：统一生产排期、新建内容、组织内 IP/栏目和账号记录、月度工作量。
- `/content/[id]`：内容详情、状态历史、发布记录和指标快照。
