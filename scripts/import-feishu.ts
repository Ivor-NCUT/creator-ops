import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { parseCsv } from "./lib/csv";
import { db } from "../src/lib/db";

const specs = {
  projects: { required: ["名称", "负责人邮箱"], unique: "名称" },
  content: { required: ["标题", "类型", "负责人邮箱"], unique: "标题" },
  parties: { required: ["名称", "类型"], unique: "名称" },
  products: { required: ["名称", "SKU"], unique: "SKU" },
} as const;
type ImportType = keyof typeof specs;

const { values } = parseArgs({ args: process.argv.slice(2).filter((argument) => argument !== "--"), options: { file: { type: "string" }, type: { type: "string" }, apply: { type: "boolean", default: false }, organization: { type: "string", default: "default" } } });

function normalize(value: string) { return value.replace(/^\uFEFF/, "").trim(); }

async function main() {
  if (!values.file || !values.type || !(values.type in specs)) throw new Error("用法：pnpm import:feishu -- --file /绝对路径/导出.csv --type projects|content|parties|products [--apply]");
  const type = values.type as ImportType;
  const rows = parseCsv(await readFile(resolve(values.file), "utf8"));
  if (rows.length < 2) throw new Error("CSV 没有可导入的数据行");
  const headers = rows[0].map(normalize);
  const duplicateHeaders = headers.filter((header, index) => headers.indexOf(header) !== index);
  if (duplicateHeaders.length) throw new Error(`重复字段：${[...new Set(duplicateHeaders)].join("、")}`);
  const spec = specs[type];
  const missing = spec.required.filter((header) => !headers.includes(header));
  if (missing.length) throw new Error(`缺少必填字段：${missing.join("、")}`);
  const records = rows.slice(1).map((row, index) => {
    if (row.length !== headers.length) throw new Error(`第 ${index + 2} 行列数与表头不一致`);
    return Object.fromEntries(headers.map((header, column) => [header, normalize(row[column])]));
  });
  const emptyRequired = records.flatMap((record, index) => spec.required.filter((header) => !record[header]).map((header) => `第 ${index + 2} 行 ${header}`));
  if (emptyRequired.length) throw new Error(`必填值为空：${emptyRequired.slice(0, 10).join("；")}`);
  const valuesForUnique = records.map((record) => record[spec.unique]);
  const duplicates = [...new Set(valuesForUnique.filter((value, index) => valuesForUnique.indexOf(value) !== index))];
  if (duplicates.length) throw new Error(`${spec.unique} 重复：${duplicates.join("、")}`);
  const report = { mode: values.apply ? "apply" : "dry-run", source: resolve(values.file), type, rows: records.length, headers, warnings: [] as string[] };
  if (!values.apply) { console.log(JSON.stringify(report, null, 2)); return; }
  if (process.env.ALLOW_IMPORT_WRITE !== "true") throw new Error("写入前必须显式设置 ALLOW_IMPORT_WRITE=true；默认只生成 dry-run 报告");
  const organization = await db.organization.findUniqueOrThrow({ where: { slug: values.organization } });
  const members = await db.member.findMany({ where: { organizationId: organization.id }, include: { user: true } });
  const memberByEmail = new Map(members.map((member) => [member.user.email.toLowerCase(), member]));
  await db.$transaction(async (tx) => {
    for (const record of records) {
      if (type === "projects") {
        const owner = memberByEmail.get(record["负责人邮箱"].toLowerCase());
        if (!owner) throw new Error(`找不到负责人账号：${record["负责人邮箱"]}`);
        await tx.project.create({ data: { organizationId: organization.id, name: record["名称"], description: record["说明"] || null, ownerId: owner.id } });
      } else if (type === "content") {
        const owner = memberByEmail.get(record["负责人邮箱"].toLowerCase());
        if (!owner) throw new Error(`找不到负责人账号：${record["负责人邮箱"]}`);
        const contentType = { 视频: "VIDEO", 文章: "ARTICLE", 图书: "BOOK" }[record["类型"]] as "VIDEO" | "ARTICLE" | "BOOK" | undefined;
        if (!contentType) throw new Error(`不支持的内容类型：${record["类型"]}`);
        await tx.contentItem.create({ data: { organizationId: organization.id, ownerId: owner.id, title: record["标题"], summary: record["摘要"] || null, type: contentType, ...(contentType === "VIDEO" ? { video: { create: {} } } : { editorial: { create: {} } }) } });
      } else if (type === "parties") {
        const partyType = { 客户: "CUSTOMER", 供应商: "SUPPLIER", 服务商: "SERVICE_PROVIDER", 顾问: "CONSULTANT" }[record["类型"]] as "CUSTOMER" | "SUPPLIER" | "SERVICE_PROVIDER" | "CONSULTANT" | undefined;
        if (!partyType) throw new Error(`不支持的往来方类型：${record["类型"]}`);
        await tx.externalParty.create({ data: { organizationId: organization.id, name: record["名称"], types: [partyType], contactName: record["联系人"] || null, contactEmail: record["邮箱"] || null } });
      } else {
        await tx.commerceProduct.create({ data: { organizationId: organization.id, name: record["名称"], sku: record["SKU"], listPrice: record["价格"] || null } });
      }
    }
  });
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => db.$disconnect());
