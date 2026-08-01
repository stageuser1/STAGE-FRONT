#!/usr/bin/env node

/**
 * Prepare, upload, and verify the static Listening assets in Alibaba Cloud OSS.
 *
 * The script never receives or stores AccessKey material. Configure ossutil
 * separately (or pass --config-file) and let ossutil handle authentication.
 */
import { createHash } from "node:crypto";
import { access, mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

const DEFAULT_SOURCE = "D:\\STAGE LISTENING DATA";
const DEFAULT_BUCKET = "stage-listening-assets";
const DEFAULT_ENDPOINT = "https://oss-cn-shenzhen.aliyuncs.com";
const EXPECTED_AUDIO_COUNT = 203;
const EXPECTED_IMAGE_COUNT = 34;

function usage() {
  console.log(`Usage:
  node scripts/ielts/listening-oss-assets.mjs manifest [options]
  node scripts/ielts/listening-oss-assets.mjs upload [options]
  node scripts/ielts/listening-oss-assets.mjs verify [options]

Options:
  --source <dir>         Asset source (default: D:\\STAGE LISTENING DATA)
  --bucket <name>        OSS bucket (default: stage-listening-assets)
  --endpoint <url>       OSS endpoint (default: https://oss-cn-shenzhen.aliyuncs.com)
  --prefix <path>        Optional object prefix, without leading/trailing slash
  --manifest <file>      Manifest path (default: <source>/reports/oss-asset-manifest.json)
  --config-file <file>   ossutil config file, if not using its default config
  --ossutil <command>    ossutil executable (default: ossutil)
  --allow-count-drift    Do not require exactly 203 audio and 34 image files
  --dry-run               Print ossutil commands without running them
  --help

Examples:
  node scripts/ielts/listening-oss-assets.mjs manifest
  node scripts/ielts/listening-oss-assets.mjs upload --config-file C:\\Users\\Administrator\\.ossutilconfig
  node scripts/ielts/listening-oss-assets.mjs verify --config-file C:\\Users\\Administrator\\.ossutilconfig
`);
}

function parseArgs(argv) {
  const [command = "manifest", ...rest] = argv;
  const options = {
    command,
    source: process.env.STAGE_LISTENING_DATA_ROOT ?? DEFAULT_SOURCE,
    bucket: process.env.OSS_BUCKET ?? DEFAULT_BUCKET,
    endpoint: process.env.OSS_ENDPOINT ?? DEFAULT_ENDPOINT,
    prefix: process.env.OSS_PREFIX ?? "",
    manifest: undefined,
    configFile: process.env.OSSUTIL_CONFIG_FILE,
    ossutil: process.env.OSSUTIL_BIN ?? "ossutil",
    allowCountDrift: false,
    dryRun: false,
  };

  for (let i = 0; i < rest.length; i += 1) {
    const arg = rest[i];
    if (arg === "--help" || arg === "-h") {
      usage();
      process.exit(0);
    }
    if (arg === "--allow-count-drift") {
      options.allowCountDrift = true;
      continue;
    }
    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }
    const [key, inlineValue] = arg.split("=", 2);
    const names = {
      "--source": "source",
      "--bucket": "bucket",
      "--endpoint": "endpoint",
      "--prefix": "prefix",
      "--manifest": "manifest",
      "--config-file": "configFile",
      "--ossutil": "ossutil",
    };
    const optionName = names[key];
    if (!optionName) throw new Error(`Unknown option: ${arg}`);
    const value = inlineValue ?? rest[++i];
    if (!value) throw new Error(`Missing value for ${key}`);
    options[optionName] = value;
  }

  if (!options.manifest) {
    options.manifest = path.join(options.source, "reports", "oss-asset-manifest.json");
  }
  options.endpoint = options.endpoint.replace(/\/+$/, "");
  options.prefix = options.prefix.replace(/^\/+|\/+$/g, "");
  if (!/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(options.bucket)) {
    throw new Error(`Invalid OSS bucket name: ${options.bucket}`);
  }
  return options;
}

async function ensureDirectory(directory) {
  await mkdir(directory, { recursive: true });
}

async function sha256(filePath) {
  const hash = createHash("sha256");
  const contents = await readFile(filePath);
  hash.update(contents);
  return hash.digest("hex");
}

async function md5(filePath) {
  const hash = createHash("md5");
  const contents = await readFile(filePath);
  hash.update(contents);
  return hash.digest("hex");
}

function contentType(fileName) {
  const extension = path.extname(fileName).toLowerCase();
  if (extension === ".mp3") return "audio/mpeg";
  if (extension === ".m4a") return "audio/mp4";
  if (extension === ".png") return "image/png";
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".webp") return "image/webp";
  return "application/octet-stream";
}

function objectUrl(endpoint, bucket, key) {
  const parsed = new URL(endpoint);
  const host = parsed.hostname === bucket || parsed.hostname.startsWith(`${bucket}.`)
    ? parsed.hostname
    : `${bucket}.${parsed.hostname}`;
  const port = parsed.port ? `:${parsed.port}` : "";
  return `${parsed.protocol}//${host}${port}/${key.split("/").map(encodeURIComponent).join("/")}`;
}

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await filesIn(entryPath)));
    else if (entry.isFile()) files.push(entryPath);
  }
  return files.sort((a, b) => a.localeCompare(b));
}

async function buildManifest(options) {
  const audioDirectory = path.join(options.source, "audio");
  const imageDirectory = path.join(options.source, "images");
  await access(audioDirectory);
  await access(imageDirectory);

  const rows = [];
  for (const [kind, directory] of [["audio", audioDirectory], ["images", imageDirectory]]) {
    for (const filePath of await filesIn(directory)) {
      const relativeName = path.relative(directory, filePath).split(path.sep).join("/");
      const fileStats = await stat(filePath);
      const keyWithoutPrefix = `${kind}/${relativeName}`;
      const key = options.prefix ? `${options.prefix}/${keyWithoutPrefix}` : keyWithoutPrefix;
      rows.push({
        kind,
        source: relativeName,
        key,
        size: fileStats.size,
        sha256: await sha256(filePath),
        md5: await md5(filePath),
        contentType: contentType(relativeName),
        url: objectUrl(options.endpoint, options.bucket, key),
      });
    }
  }

  const audio = rows.filter((row) => row.kind === "audio");
  const images = rows.filter((row) => row.kind === "images");
  if (!options.allowCountDrift && (audio.length !== EXPECTED_AUDIO_COUNT || images.length !== EXPECTED_IMAGE_COUNT)) {
    throw new Error(
        `Unexpected asset counts: audio=${audio.length} (expected ${EXPECTED_AUDIO_COUNT}), ` +
        `images=${images.length} (expected ${EXPECTED_IMAGE_COUNT})`,
    );
  }

  return {
    manifestVersion: 1,
    generatedAt: new Date().toISOString(),
    bucket: options.bucket,
    endpoint: options.endpoint,
    prefix: options.prefix,
    counts: { audio: audio.length, images: images.length, total: rows.length },
    totalBytes: rows.reduce((sum, row) => sum + row.size, 0),
    assets: rows,
  };
}

async function saveManifest(options, manifest) {
  await ensureDirectory(path.dirname(options.manifest));
  await writeFile(options.manifest, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(`Manifest written: ${options.manifest}`);
}

function ossArgs(options, args) {
  return [...args, "--endpoint", options.endpoint, ...(options.configFile ? ["--config-file", options.configFile] : [])];
}

function run(command, args, options) {
  const printable = [command, ...args].map((part) => JSON.stringify(part)).join(" ");
  console.log(`$ ${printable}`);
  if (options.dryRun) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", windowsHide: true });
    child.once("error", (error) => reject(new Error(`Could not start ${command}: ${error.message}`)));
    child.once("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with code ${code}`));
    });
  });
}

function runCapture(command, args, options) {
  const printable = [command, ...args].map((part) => JSON.stringify(part)).join(" ");
  console.log(`$ ${printable}`);
  if (options.dryRun) return Promise.resolve("");
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { windowsHide: true });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.once("error", (error) => reject(new Error(`Could not start ${command}: ${error.message}`)));
    child.once("exit", (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(`${command} exited with code ${code}: ${stderr.trim()}`));
    });
  });
}

function extractJson(output) {
  const start = output.search(/[\[{]/);
  if (start < 0) throw new Error("ossutil did not return JSON output");
  const candidate = output.slice(start).trim();
  for (let end = candidate.length; end > 0; end -= 1) {
    try { return JSON.parse(candidate.slice(0, end)); } catch { /* trailing CLI timing text */ }
  }
  throw new Error("Could not parse ossutil JSON output");
}

function remoteRows(value, rows = []) {
  if (Array.isArray(value)) {
    for (const item of value) remoteRows(item, rows);
  } else if (value && typeof value === "object") {
    const objectName = value.ObjectName ?? value.Key ?? value.key;
    const size = value.Size ?? value.size;
    const etag = value.ETag ?? value.etag;
    if (typeof objectName === "string" && Number.isFinite(Number(size))) {
      rows.push({ objectName, size: Number(size), etag: String(etag ?? "").replace(/^"|"$/g, "").toLowerCase() });
    }
    for (const child of Object.values(value)) remoteRows(child, rows);
  }
  return rows;
}

async function readManifest(options) {
  return JSON.parse(await readFile(options.manifest, "utf8"));
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!["manifest", "upload", "verify"].includes(options.command)) {
    usage();
    throw new Error(`Unknown command: ${options.command}`);
  }

  if (options.command === "manifest") {
    await saveManifest(options, await buildManifest(options));
    return;
  }

  const manifest = await readManifest(options);
  if (manifest.bucket !== options.bucket || manifest.endpoint !== options.endpoint || manifest.prefix !== options.prefix) {
    throw new Error("Manifest target does not match the requested bucket, endpoint, or prefix");
  }

  if (options.command === "upload") {
    const audioDirectory = path.join(options.source, "audio");
    const imageDirectory = path.join(options.source, "images");
    const prefix = options.prefix ? `${options.prefix}/` : "";
    await run(options.ossutil, ossArgs(options, ["cp", audioDirectory, `oss://${options.bucket}/${prefix}audio/`, "--recursive", "--update", "--include", "*.mp3", "--content-type", "audio/mpeg"]), options);
    await run(options.ossutil, ossArgs(options, ["cp", audioDirectory, `oss://${options.bucket}/${prefix}audio/`, "--recursive", "--update", "--include", "*.m4a", "--content-type", "audio/mp4"]), options);
    await run(options.ossutil, ossArgs(options, ["cp", imageDirectory, `oss://${options.bucket}/${prefix}images/`, "--recursive", "--update", "--content-type", "image/png"]), options);
    console.log(`Uploaded ${manifest.counts.audio} audio and ${manifest.counts.images} image objects.`);
    return;
  }

  const prefix = options.prefix ? `${options.prefix}/` : "";
  const output = await runCapture(options.ossutil, ossArgs(options, ["ls", `oss://${options.bucket}/${prefix}`, "--recursive", "--output-format", "json"]), options);
  if (options.dryRun) return;
  const remote = remoteRows(extractJson(output));
  const expectedByKey = new Map(manifest.assets.map((asset) => [asset.key, asset]));
  const actualByKey = new Map(remote.map((row) => [row.objectName.replace(/^oss:\/\/[^/]+\//, ""), row]));
  const missing = [];
  const mismatched = [];
  for (const asset of manifest.assets) {
    const row = actualByKey.get(asset.key);
    if (!row) missing.push(asset.key);
    else if (row.size !== asset.size || (row.etag && row.etag !== asset.md5)) {
      mismatched.push(`${asset.key} (expected size=${asset.size}, md5=${asset.md5}; got size=${row.size}, etag=${row.etag || "n/a"})`);
    }
  }
  const extras = [...actualByKey.keys()].filter((key) => !expectedByKey.has(key));
  if (missing.length || mismatched.length || extras.length || remote.length !== manifest.counts.total) {
    if (missing.length) console.error(`Missing objects (${missing.length}): ${missing.slice(0, 10).join(", ")}`);
    if (mismatched.length) console.error(`Mismatched objects (${mismatched.length}): ${mismatched.slice(0, 10).join("; ")}`);
    if (extras.length) console.error(`Unexpected objects (${extras.length}): ${extras.slice(0, 10).join(", ")}`);
    throw new Error(`Remote verification failed: found ${remote.length} objects; expected ${manifest.counts.total}`);
  }
  console.log(`Remote verification passed: ${manifest.counts.audio} audio + ${manifest.counts.images} images, ${manifest.totalBytes} bytes.`);
}

main().catch((error) => {
  console.error(`ERROR: ${error.message}`);
  process.exitCode = 1;
});
