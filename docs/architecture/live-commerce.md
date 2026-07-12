# 直播电商与客诉

`LiveSession` 承载排期、人员、基础指标与复盘，通过 `LiveSessionPreview` 关联内容域已有视频。商品只保留直播域必需资料；`CommerceSupplier` 是轻量外部主体，后续 CRM 可扩展它，不再建第二张供应商表。

`LiveProductPerformance` 按“场次 × 商品”唯一存储曝光、点击、订单、买家、GMV、退款、库存和佣金源值。点击率、订单转化率和退款率由 `src/lib/live-commerce/metrics.ts` 用 Prisma Decimal 即时计算，不保存可过期的派生值，分母为零时返回零。

`CustomerFeedback` 统一评价与客诉，保留分类、负责人、状态、解决方案和状态历史。直播和客诉状态只通过服务层流转：同一事务中带旧状态条件更新主记录并追加历史，并发过期操作会失败。所有读写以当前成员的 `organizationId` 隔离，关联 ID 在写入前再次校验组织归属。

页面入口：

- `/live`：直播列表、排期、初始人员和预热视频。
- `/live/[id]`：场次详情、状态历史、商品表现和复盘。
- `/live/products`：商品与轻量供应商资料。
- `/live/feedback`：评价/客诉录入、分派、流转和解决历史。
