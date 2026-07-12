import assert from "node:assert/strict";
import test from "node:test";
import { parseCsv } from "./csv";

test("parseCsv handles Feishu-style quoted fields and CRLF", () => {
  assert.deepEqual(parseCsv('\uFEFF标题,说明\r\n"直播,复盘","含""引号"""\r\n'), [["\uFEFF标题", "说明"], ["直播,复盘", '含"引号"']]);
});

test("parseCsv rejects unterminated quotes", () => assert.throws(() => parseCsv('标题\n"坏数据'), /未闭合/));
