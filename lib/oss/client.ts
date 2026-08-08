import "server-only";
import OSS from "ali-oss";

/**
 * 阿里云 OSS 客户端(数据唯一真相源,bucket 私有读写)。
 * 凭据只在服务端环境变量,严禁 NEXT_PUBLIC_ 前缀、严禁被客户端组件 import
 * (首行 server-only 保证违规 import 直接构建失败)。
 */

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
    });
  }
  return client;
}

/** 对象不存在(NoSuchKey/404)返回 null;其他错误原样抛出。 */
export async function getObjectJson(key: string): Promise<unknown | null> {
  try {
    const result = await ossClient().get(key);
    return JSON.parse(result.content.toString("utf8"));
  } catch (error) {
    const status = (error as { status?: number }).status;
    const code = (error as { code?: string }).code;
    if (status === 404 || code === "NoSuchKey") return null;
    throw error;
  }
}
