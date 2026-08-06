/**
 * 分享卡的字体供给。
 *
 * satori(`next/og` 内部的排版引擎)没有系统字体可用,必须显式喂进字体
 * 二进制;而卡面的主体是中文校名,缺字就是整张图报废。所以这里按**当前
 * 这张图实际要画的字符**去 Google Fonts 取 Noto Sans SC 的子集
 * (`css2?...&text=` 会返回只含这些字形的 TrueType,通常几 KB)。
 *
 * 为什么是网络取字体、而不是把字体文件放进仓库:
 * - 全量 Noto Sans SC 约 8–10MB/字重,进 git 不合适;
 * - 预先切一个「常用 3500 字」子集则会在遇到生僻校名时静默出豆腐块,
 *   而校名是这张图的视觉主体,静默失败是最糟的失败方式;
 * - 这个仓库的构建**本来就已经**依赖 fonts.googleapis.com
 *   (`app/layout.tsx` 用 `next/font/google` 引 Noto Sans SC),
 *   所以这里没有引入一条新的外部依赖,只是复用了同一条。
 *
 * 图片路由是构建期静态生成(见路由文件的 `dynamic`/`generateStaticParams`),
 * 所以这次取字体发生在构建时,不是每个用户请求一次。
 *
 * 失败时抛错、不降级:没有中文字体的分享卡不是「差一点」,是不能出。
 */

const CSS_ENDPOINT = "https://fonts.googleapis.com/css2";
const FAMILY = "Noto Sans SC";

/** T3 卡片用 `font-semibold`/`font-medium` 两档;这里落到 Google 提供的
 * 400 / 700 两个字重上。 */
export const SHARE_CARD_FONT_WEIGHTS = [400, 700] as const;

export interface ShareCardFont {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 700;
  style: "normal";
}

/** 进程内缓存:同一批字符只取一次(一次构建里九张卡有大量重复汉字)。 */
const cache = new Map<string, Promise<ArrayBuffer>>();

/** 去重 + 排序,让「同一批字符」有稳定的缓存键,也让 URL 尽量短。 */
export function subsetKey(text: string): string {
  return Array.from(new Set(Array.from(text))).sort().join("");
}

async function fetchSubset(chars: string, weight: number): Promise<ArrayBuffer> {
  const url = `${CSS_ENDPOINT}?family=${encodeURIComponent(FAMILY)}:wght@${weight}&text=${encodeURIComponent(chars)}`;
  const cssResponse = await fetch(url);
  if (!cssResponse.ok) {
    throw new Error(
      `Share card font: Google Fonts CSS 请求失败 (${cssResponse.status}) for weight ${weight}`,
    );
  }
  const css = await cssResponse.text();
  // `text=` 子集对非 woff2 UA 返回 truetype —— satori 只吃 ttf/otf/woff,
  // 不吃 woff2,所以这里显式要求 truetype,格式变了就报错而不是喂进去炸。
  const match = /src:\s*url\((.+?)\)\s*format\('truetype'\)/.exec(css);
  if (!match) {
    throw new Error(
      `Share card font: 未能从 Google Fonts CSS 中解析出 truetype 子集 URL(weight ${weight})`,
    );
  }
  const fontResponse = await fetch(match[1]);
  if (!fontResponse.ok) {
    throw new Error(
      `Share card font: 字体文件下载失败 (${fontResponse.status}) for weight ${weight}`,
    );
  }
  return fontResponse.arrayBuffer();
}

/**
 * 取回渲染 `text` 所需的两个字重的字体子集。
 *
 * `text` 应当是这张图上**全部**可见文字的拼接 —— 少拼一段,那段就会变成
 * 豆腐块。`buildShareCardImageText()`(share-card-template.tsx)负责从元素树
 * 里把它收集齐,不靠调用方手抄。
 */
export async function loadShareCardFonts(
  text: string,
): Promise<ShareCardFont[]> {
  const chars = subsetKey(text);
  return Promise.all(
    SHARE_CARD_FONT_WEIGHTS.map(async (weight) => {
      const key = `${weight}:${chars}`;
      let pending = cache.get(key);
      if (!pending) {
        pending = fetchSubset(chars, weight);
        cache.set(key, pending);
      }
      return {
        name: FAMILY,
        data: await pending,
        weight,
        style: "normal" as const,
      };
    }),
  );
}
