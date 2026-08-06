# Listening OSS deployment

This deployment keeps the Listening contract, UI, and item JSON unchanged. Only
the media base URLs returned by `StaticListeningSource` are configurable.

## 1. Configure ossutil

Install Alibaba Cloud `ossutil` 2.x and configure a RAM identity outside the
repository. The identity needs object upload/list permissions for
`stage-listening-assets` and must use region `cn-shenzhen`.

```powershell
ossutil config
ossutil ls oss://stage-listening-assets --endpoint https://oss-cn-shenzhen.aliyuncs.com
```

Do not put an AccessKey in `.env.local`, the repository, or a command copied to
logs. A separate config file may be passed with `--config-file`.

## 2. Build the manifest

```powershell
node scripts/ielts/listening-oss-assets.mjs manifest
```

The manifest is written to:

```text
D:\STAGE LISTENING DATA\reports\oss-asset-manifest.json
```

It records the OSS key, byte size, MD5/ SHA-256, MIME type, and fixed URL for
every asset. The command fails if the counts are not exactly 203 audio and 34
images.

## 3. Upload and verify

```powershell
node scripts/ielts/listening-oss-assets.mjs upload
node scripts/ielts/listening-oss-assets.mjs verify
```

For a non-default config file:

```powershell
$ossConfig = 'C:\Users\Administrator\.ossutilconfig'
node scripts/ielts/listening-oss-assets.mjs upload --config-file $ossConfig
node scripts/ielts/listening-oss-assets.mjs verify --config-file $ossConfig
```

Verification compares the remote object set, sizes, and ETags against the
manifest. These assets are below ossutil's default multipart threshold, so the
ETag is the uploaded object's MD5. The manifest SHA-256 remains the local
audit checksum.

## 4. Make the bucket readable by the browser

Keep the bucket private during upload and verification. Before switching the
application to direct URLs, set bucket ACL to `public-read` only if public
browser access is intended:

```powershell
ossutil set-acl oss://stage-listening-assets public-read
ossutil ls oss://stage-listening-assets --endpoint https://oss-cn-shenzhen.aliyuncs.com
```

Never use `public-read-write`. If the product later requires private assets,
use signed URLs or an application proxy instead of changing the Listening
contract.

## 5. Switch the runtime URLs

Set these server-side environment variables in the STAGE FRONT deployment:

```text
STAGE_LISTENING_AUDIO_BASE_URL=https://stage-listening-assets.oss-cn-shenzhen.aliyuncs.com/audio
STAGE_LISTENING_IMAGE_BASE_URL=https://stage-listening-assets.oss-cn-shenzhen.aliyuncs.com/images
```

Restart/redeploy the app, then open one MP3, one M4A, and one map URL from the
manifest. The source keeps its local `/ielts/listening/...` defaults when the
variables are absent, so rollback is a simple environment change.
