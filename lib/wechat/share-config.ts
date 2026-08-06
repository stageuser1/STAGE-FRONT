import type { ProgramV3 } from "@/data/v3/types";
import { SITE_URL } from "../site-config.ts";
import { programDetailHref } from "../program-v3/format.ts";
import {
  buildShareCardPayload,
  SHARE_CARD_BRAND_LINE,
} from "../program-v3/share-card.ts";

/**
 * 微信 JS-SDK 分享内容(标题 / 描述 / 缩略图 / 链接)。
 *
 * 纯函数,不碰 `window`、不发请求 —— 这样它能在 `node --test` 里被断言,
 * 而真正调用 JS-SDK 的那一小段副作用留在
 * `components/program/v3/WechatShareSetup.tsx`。
 *
 * 事实纪律与分享卡完全一致:标题与描述都从 `share_card_payload` 里取,
 * 不另写一套营销文案,也不碰 `editorial_note`。
 */

export interface WechatShareConfig {
  title: string;
  desc: string;
  /** 分享落地页绝对地址。 */
  link: string;
  /** 缩略图绝对地址 —— 竖版分享卡本身(见下面的裁切说明)。 */
  imgUrl: string;
}

/**
 * 缩略图为什么用竖版分享卡而不是 OG 横版:微信把 `imgUrl` 居中裁成小方图。
 * 900×1200 居中裁出的 900×900 仍然包含中文校名与指标(裁掉的是顶部品牌行
 * 与底部二维码);1200×630 居中裁出的 630×630 会把左对齐的校名切掉一截。
 * 两害相权取其轻,并且这条已知裁切行为写进了移交文档 —— 蓝图没有规定
 * 专用方形缩略图,本轮不自行新增第三种尺寸。
 */
export function buildWechatShareConfig(
  program: ProgramV3,
): WechatShareConfig | null {
  const href = programDetailHref(program);
  // slug 缺失 = Mode F 没有为这个项目生成详情页,也就没有可分享的落地页与
  // 图片路由。此时返回 null,由调用方整块跳过 —— 不拿站点首页冒充项目页。
  // (二维码的处理不同:那张图本身已经存在,只是码指向首页,见裁决 T5-R2。)
  if (!href) return null;
  const payload = buildShareCardPayload(program);
  const link = `${SITE_URL}${href}`;

  // 描述 = 分享卡上的同一批指标,同样的措辞。指标为空(数据太少)时退到
  // Mode F 的导语;导语也没有才退到品牌行 —— 三级都不是新造的事实。
  const desc =
    payload.metrics.length > 0
      ? payload.metrics.map((m) => `${m.label} ${m.value}`).join(" · ")
      : (program.publishing.answer_sentence_zh ?? SHARE_CARD_BRAND_LINE);

  return {
    title: `${payload.name_zh} ${payload.program_zh} · ${payload.degree_abbr}`,
    desc,
    link,
    // 图片路由与详情页同源同路径前缀,T3b 迁移路由时两者一起动。
    imgUrl: `${SITE_URL}${href}/share-card`,
  };
}
