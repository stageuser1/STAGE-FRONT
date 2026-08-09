/**
 * bucket 跨区迁移(2026-08-09:深圳 → 香港)。
 *
 *   node scripts/oss/migrate-bucket.mjs --to-bucket <新bucket名> [--to-region oss-cn-hongkong] [--apply]
 *
 * 默认是**演练**:只列出会搬哪些对象、逐个核对源端能否读到,不写任何东西。
 * 加 `--apply` 才真的写入目标 bucket,并在写完后逐个回读比对字节数。
 *
 * 源端参数从 `.env.local` 读(`OSS_*`);目标端复用同一对凭据 —— RAM 子账号
 * 的策略需要先把资源改成新 bucket 名(见 OSS_MIGRATION_PROMPTS.md 第 7.2 节),
 * 否则这里会拿到 AccessDenied,那正是"策略没跟着改"的信号,不要绕过它。
 *
 * OSS 不支持改 bucket 的地域,所以只能新建 + 复制。库里只有索引与院校包,
 * 数量是两位数,顺序复制即可,不做并发。
 */
import { readFileSync } from "node:fs";
import OSS from "ali-oss";

for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2];
}

function arg(name, fallback = null) {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : process.argv[i + 1];
}

const toBucket = arg("to-bucket");
const toRegion = arg("to-region", "oss-cn-hongkong");
const apply = process.argv.includes("--apply");

if (!toBucket) {
  console.error(
    "usage: node scripts/oss/migrate-bucket.mjs --to-bucket <name> [--to-region oss-cn-hongkong] [--apply]",
  );
  process.exit(2);
}

const creds = {
  accessKeyId: process.env.OSS_ACCESS_KEY_ID,
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
  secure: true,
  timeout: 30_000,
};

const source = new OSS({
  ...creds,
  region: process.env.OSS_REGION,
  bucket: process.env.OSS_BUCKET,
});
const target = new OSS({ ...creds, region: toRegion, bucket: toBucket });

console.log(
  `源: ${process.env.OSS_BUCKET} @ ${process.env.OSS_REGION}\n` +
    `目标: ${toBucket} @ ${toRegion}\n` +
    `模式: ${apply ? "APPLY(会写入目标)" : "DRY RUN(只读不写)"}\n`,
);

// 只搬本项目自己的两类对象,不整桶镜像 —— 桶里若有别的东西,那是别的事。
const prefixes = ["index/", "schools/"];
const keys = [];
for (const prefix of prefixes) {
  let marker;
  do {
    const listed = await source.list({ prefix, "max-keys": 1000, marker });
    for (const obj of listed.objects ?? []) keys.push(obj.name);
    marker = listed.nextMarker;
  } while (marker);
}

if (keys.length === 0) {
  console.error("源 bucket 里没有 index/ 或 schools/ 下的对象 —— 请先确认源参数");
  process.exit(1);
}
console.log(`待迁移 ${keys.length} 个对象:`);
for (const k of keys) console.log(`  ${k}`);
console.log();

let ok = 0;
for (const key of keys) {
  const got = await source.get(key);
  const body = got.content;
  if (!apply) {
    console.log(`DRY  ${key}  (源端可读,${body.length} bytes)`);
    ok += 1;
    continue;
  }
  await target.put(key, body, {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
  const back = await target.get(key);
  const same = back.content.length === body.length;
  console.log(
    `${same ? "OK  " : "DIFF"} ${key}  ${body.length} → ${back.content.length} bytes`,
  );
  if (!same) process.exitCode = 1;
  ok += same ? 1 : 0;
}

console.log(`\n${ok}/${keys.length} ${apply ? "已迁移并回读一致" : "源端可读(演练)"}`);
if (!apply) console.log("确认无误后加 --apply 实际执行。");
