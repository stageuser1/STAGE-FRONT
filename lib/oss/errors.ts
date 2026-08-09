/**
 * OSS 错误分类。**没有 `server-only`**,也不 import ali-oss —— 纯函数,
 * 这样 `tests/oss_errors.test.mjs` 能离线喂合成错误对象来钉住分类规则,
 * 不需要网络、不需要凭据。分类规则出错的代价在生产上是"院校静默消失",
 * 值得被单测钉着。
 */

interface OssLikeError {
  status?: number;
  code?: string;
  name?: string;
  message?: string;
}

/**
 * 只有"对象确实不存在"才算 missing。
 *
 * 判据刻意收窄到 OSS 自己给出的语义(HTTP 404 / `NoSuchKey`):连接超时
 * (`ETIMEDOUT`/`RequestError`)、鉴权失败(403 / `AccessDenied`)、限流
 * (503)统统**不是** missing —— 把它们当 missing 会让已发布的院校在网络
 * 抖动时变成"学校未找到",那是静默的数据丢失(2026-08-09 生产事故裁决)。
 */
export function isMissingObjectError(error: unknown): boolean {
  if (error === null || typeof error !== "object") return false;
  const { status, code } = error as OssLikeError;
  return status === 404 || code === "NoSuchKey";
}

/** 供日志用的一行摘要:出问题时不必翻 Vercel 日志才知道是哪一类失败。 */
export function describeOssError(error: unknown): string {
  if (error === null || typeof error !== "object") return String(error);
  const { name, code, status, message } = error as OssLikeError;
  const parts = [
    name && name !== "Error" ? name : null,
    code ?? null,
    typeof status === "number" ? `status=${status}` : null,
    message ?? null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "unknown error";
}
