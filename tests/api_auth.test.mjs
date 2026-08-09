import test from "node:test";
import assert from "node:assert/strict";

import { isAuthorized } from "../lib/api/auth.ts";

const TOKEN = "s3cret-write-token-abcdefghijklmnop";

test("正确的 Bearer token 通过", () => {
  assert.equal(isAuthorized(`Bearer ${TOKEN}`, TOKEN), true);
  assert.equal(isAuthorized(`  Bearer ${TOKEN}  `, TOKEN), true);
});

test("缺失 / 畸形 / 错误的凭据一律拒绝", () => {
  for (const header of [
    null,
    undefined,
    "",
    "Bearer",
    "Bearer ",
    TOKEN, // 少了 Bearer 前缀
    `Basic ${TOKEN}`,
    `Bearer ${TOKEN}x`,
    `Bearer ${TOKEN.slice(0, -1)}`,
    "Bearer wrong",
  ]) {
    assert.equal(isAuthorized(header, TOKEN), false, `应拒绝:${String(header)}`);
  }
});

test("expected 未配置时失败关闭 —— 连正确格式也拒绝", () => {
  // 环境变量漏配的后果必须是「谁都写不进去」,不能是「谁都能写」。
  for (const expected of [undefined, ""]) {
    assert.equal(isAuthorized(`Bearer ${TOKEN}`, expected), false);
    assert.equal(isAuthorized("Bearer anything", expected), false);
  }
});

test("长度不同的 token 不抛错(sha256 后定长比较,也不泄露长度)", () => {
  assert.doesNotThrow(() => isAuthorized("Bearer a", TOKEN));
  assert.equal(isAuthorized("Bearer a", TOKEN), false);
  assert.equal(isAuthorized(`Bearer ${"x".repeat(500)}`, TOKEN), false);
});
