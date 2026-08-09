import test from "node:test";
import assert from "node:assert/strict";

import {
  describeOssError,
  isMissingObjectError,
} from "../lib/oss/errors.ts";

/**
 * 2026-08-09 生产事故的回归护栏。
 *
 * 事故:bucket 在深圳、函数在 hkg1,跨境连不通,OSS 抛
 * `RequestError: connect ETIMEDOUT`。当时的判据只看 `status === 404 ||
 * code === "NoSuchKey"`,连接失败因此原样抛出 → 500(行为正确)。
 *
 * 这组测试要钉死的是**反方向的诱惑**:以后有人为了"让页面别 500"把
 * catch 放宽成"任何错误都当不存在",那会让已发布的院校在网络抖动时显示
 * 「学校未找到」—— 静默的数据丢失,比 500 危险得多。
 */

test("只有 404 / NoSuchKey 算「对象不存在」", () => {
  assert.equal(isMissingObjectError({ status: 404 }), true);
  assert.equal(isMissingObjectError({ code: "NoSuchKey" }), true);
  assert.equal(
    isMissingObjectError({ status: 404, code: "NoSuchKey", name: "NoSuchKeyError" }),
    true,
  );
});

test("连接失败绝不被当成「对象不存在」(事故原型)", () => {
  const etimedout = {
    name: "RequestError",
    code: "ETIMEDOUT",
    message: "connect ETIMEDOUT 112.74.1.117:443",
  };
  assert.equal(isMissingObjectError(etimedout), false);
});

test("鉴权失败、限流、其他 5xx 都不是「不存在」", () => {
  for (const error of [
    { status: 403, code: "AccessDenied" },
    { status: 503, code: "ServiceUnavailable" },
    { status: 500 },
    { code: "RequestTimeoutError" },
    { name: "ConnectionTimeoutError", code: "ConnectionTimeoutError" },
  ]) {
    assert.equal(
      isMissingObjectError(error),
      false,
      `${JSON.stringify(error)} 被误判为不存在 —— 这会让已发布院校静默消失`,
    );
  }
});

test("非对象输入不会误判,也不会抛", () => {
  for (const value of [null, undefined, "NoSuchKey", 404]) {
    assert.equal(isMissingObjectError(value), false);
  }
});

test("describeOssError 给出可诊断的一行摘要", () => {
  const line = describeOssError({
    name: "RequestError",
    code: "ETIMEDOUT",
    status: -1,
    message: "connect ETIMEDOUT 112.74.1.117:443",
  });
  assert.match(line, /RequestError/);
  assert.match(line, /ETIMEDOUT/);
  assert.match(line, /112\.74\.1\.117/);
});
