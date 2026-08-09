import { createHash, timingSafeEqual } from "node:crypto";

/**
 * 写入 API 的 Bearer 鉴权。**没有 `server-only`** —— 纯函数,由
 * `tests/api_auth.test.mjs` 离线覆盖(裁决 5 的豁免范围内)。
 */

/**
 * 先各自 sha256 再定长比较:`timingSafeEqual` 对不等长输入直接抛错,
 * 若先比长度就等于把 token 长度泄露给攻击者。摘要恒为 32 字节,
 * 比较时间与内容无关,也不泄露长度。
 */
function constantTimeEquals(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a, "utf8").digest();
  const hb = createHash("sha256").update(b, "utf8").digest();
  return timingSafeEqual(ha, hb);
}

/**
 * **失败关闭**:`expected` 未配置(undefined / 空串)时一律拒绝。
 * 环境变量漏配的后果必须是"谁都写不进去",而不是"谁都能写"。
 */
export function isAuthorized(
  authorizationHeader: string | null | undefined,
  expected: string | undefined,
): boolean {
  if (!expected) return false;
  if (!authorizationHeader) return false;
  const match = /^Bearer (.+)$/.exec(authorizationHeader.trim());
  if (!match) return false;
  return constantTimeEquals(match[1], expected);
}
