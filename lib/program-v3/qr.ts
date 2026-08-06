import QRCode from "qrcode";
import { SHARE_CARD_COLORS } from "./share-card-tokens.ts";

/**
 * 分享卡右下角的二维码。
 *
 * satori 不能画任意 SVG 元素树,但能画 `<img src="data:image/svg+xml;...">`,
 * 所以二维码先渲成独立 SVG、再以 data URI 贴进去。
 *
 * 纠错等级 M(约 15% 冗余):微信群里图片会被二次压缩,L 在压缩后容易扫不出;
 * H 会显著加密模块、同尺寸下更难扫。M 是这个用途的常规选择。
 *
 * 颜色沿用 T3 的 `ink-900`/白底(与卡面同一套灰阶),不用纯黑 —— 对比度
 * 仍在 15:1 以上,扫码不受影响。
 */
export const QR_ERROR_CORRECTION_LEVEL = "M";

export async function qrSvg(url: string): Promise<string> {
  return QRCode.toString(url, {
    type: "svg",
    errorCorrectionLevel: QR_ERROR_CORRECTION_LEVEL,
    // 留白由卡片版式给,SVG 自身不再带 quiet zone 之外的边距。
    margin: 1,
    color: {
      dark: SHARE_CARD_COLORS.ink900,
      light: SHARE_CARD_COLORS.surface,
    },
  });
}

export async function qrDataUri(url: string): Promise<string> {
  const svg = await qrSvg(url);
  return `data:image/svg+xml;base64,${Buffer.from(svg, "utf8").toString("base64")}`;
}
