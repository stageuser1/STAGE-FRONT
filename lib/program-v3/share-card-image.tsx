import { ImageResponse } from "next/og";
import type { ProgramV3 } from "@/data/v3/types";
import { qrDataUri } from "./qr.ts";
import { buildShareCardPayload } from "./share-card.ts";
import { loadShareCardFonts } from "./share-card-font.ts";
import {
  SHARE_CARD_OG,
  SHARE_CARD_PORTRAIT,
} from "./share-card-tokens.ts";
import {
  collectElementText,
  ShareCardOg,
  ShareCardPortrait,
  shareCardDeadlineChip,
} from "./share-card-template.tsx";

/**
 * §2.3 的「同一图片服务」:竖版分享卡与横版 OG 图从同一份 payload、同一套
 * 视觉 token、同一棵模板出发,只有尺寸与精简程度不同。
 *
 * 两个函数都返回 `ImageResponse`(即一个 PNG 响应),调用方是路由文件。
 * 字体在这里按图上实际文字取子集(见 `share-card-font.ts`)。
 */

export async function renderShareCardPortrait(
  program: ProgramV3,
  { now = new Date() }: { now?: Date } = {},
): Promise<ImageResponse> {
  const payload = buildShareCardPayload(program);
  const chip = shareCardDeadlineChip(program, now);
  const qr = await qrDataUri(payload.qr_url);
  const element = (
    <ShareCardPortrait chip={chip} payload={payload} qrDataUri={qr} />
  );
  const fonts = await loadShareCardFonts(collectElementText(element));
  return new ImageResponse(element, { ...SHARE_CARD_PORTRAIT, fonts });
}

export async function renderShareCardOg(
  program: ProgramV3,
  { now = new Date() }: { now?: Date } = {},
): Promise<ImageResponse> {
  const payload = buildShareCardPayload(program);
  const chip = shareCardDeadlineChip(program, now);
  const element = <ShareCardOg chip={chip} payload={payload} />;
  const fonts = await loadShareCardFonts(collectElementText(element));
  return new ImageResponse(element, { ...SHARE_CARD_OG, fonts });
}
