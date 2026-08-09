import "server-only";
import OSS from "ali-oss";
import { isMissingObjectError, describeOssError } from "./errors";

/**
 * 阿里云 OSS 客户端(数据唯一真相源,bucket 私有读写)。
 * 凭据只在服务端环境变量,严禁 NEXT_PUBLIC_ 前缀、严禁被客户端组件 import
 * (首行 server-only 保证违规 import 直接构建失败)。
 */

/**
 * 请求超时(2026-08-09 生产事故后加固)。
 *
 * 事故经过:bucket 建在 `oss-cn-shenzhen`、Function Region 是 `hkg1`,
 * 跨境连接不通,函数抛 `connect ETIMEDOUT`。**没设超时**时 ali-oss 用默认值,
 * 用户要等 16–31 秒才拿到 500 —— 故障被拖成了"页面卡死"。
 *
 * 读的都是几 KB 的 JSON,同区(hkg1 ↔ oss-cn-hongkong)正常在百毫秒内完成,
 * 5 秒已经是极宽松的上限:超过它一定是网络出了问题,应当立刻暴露。
 */
const OSS_TIMEOUT_MS = 5_000;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

let client: OSS | null = null;

export function ossClient(): OSS {
  if (!client) {
    client = new OSS({
      region: process.env.OSS_REGION ?? "oss-cn-hongkong",
      accessKeyId: requireEnv("OSS_ACCESS_KEY_ID"),
      accessKeySecret: requireEnv("OSS_ACCESS_KEY_SECRET"),
      bucket: requireEnv("OSS_BUCKET"),
      secure: true,
      timeout: OSS_TIMEOUT_MS,
    });
  }
  return client;
}

/**
 * 对象不存在 → `null`;**其他任何失败都抛出,绝不降级成"不存在"**。
 *
 * 这条区分是有代价的、也是刻意的(裁决 2026-08-09):把连接超时、鉴权失败、
 * 限流当成 404 会让**已发布的院校在网络抖动时静默消失**,页面显示"学校未找到"
 * —— 对用户来说那是数据丢失,比一个诚实的 500 危险得多。宁可报错。
 */
export async function getObjectJson(key: string): Promise<unknown | null> {
  try {
    const result = await ossClient().get(key);
    return JSON.parse(result.content.toString("utf8"));
  } catch (error) {
    if (isMissingObjectError(error)) return null;
    throw new Error(`[oss] 读取 ${key} 失败:${describeOssError(error)}`, {
      cause: error,
    });
  }
}
