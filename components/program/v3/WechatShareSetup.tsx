"use client";

import { useEffect } from "react";
import type { WechatShareConfig } from "@/lib/wechat/share-config";

/**
 * 微信内分享配置的前端接入(T5 第四项)。
 *
 * ## 后端依赖(需要人类安排,本轮不自建)
 *
 * `wx.config()` 必须传入服务端用 `jsapi_ticket` 算出的签名四元组
 * (`appId` / `timestamp` / `nonceStr` / `signature`),而 `jsapi_ticket` 依赖
 * 微信公众号的 `appId` + `appSecret`,**secret 不能进前端**。所以签名接口
 * 只能在服务端,属于本 ticket 明确划出去的范围。
 *
 * 这个组件因此做成「有签名接口就接、没有就完全不动」:
 *
 * - 环境变量 `NEXT_PUBLIC_WECHAT_JSSDK_SIGNATURE_ENDPOINT` 未配置 → 直接
 *   什么都不做(既不加载 JS-SDK,也不发请求)。当前仓库正是这个状态。
 * - 配置之后,该接口需要:接受 `?url=<当前页完整 URL,不含 #hash>`,返回
 *   `{ appId, timestamp, nonceStr, signature }`。签名必须对**这个 url** 计算,
 *   微信对此校验极严(多一个查询参数、少一个斜杠都会 invalid signature)。
 *
 * 非微信环境(浏览器、开发机)不加载任何脚本:JS-SDK 在微信外没有意义,
 * 而无条件插一个第三方 <script> 会让每个页面都多一次外部请求。
 */

const SIGNATURE_ENDPOINT =
  process.env.NEXT_PUBLIC_WECHAT_JSSDK_SIGNATURE_ENDPOINT;

const JSSDK_SRC = "https://res.wx.qq.com/open/js/jweixin-1.6.0.js";
const JSSDK_SCRIPT_ID = "wechat-jssdk";

/** JS-SDK 里本组件实际用到的那一小块表面,不引第三方类型包。 */
interface WxSdk {
  config: (options: {
    debug: boolean;
    appId: string;
    timestamp: number;
    nonceStr: string;
    signature: string;
    jsApiList: string[];
  }) => void;
  ready: (callback: () => void) => void;
  error: (callback: (error: unknown) => void) => void;
  updateAppMessageShareData?: (options: WechatShareConfig) => void;
  updateTimelineShareData?: (options: Omit<WechatShareConfig, "desc">) => void;
}

const JS_API_LIST = ["updateAppMessageShareData", "updateTimelineShareData"];

function isWechatBrowser(): boolean {
  return /micromessenger/i.test(navigator.userAgent);
}

function loadJssdk(): Promise<WxSdk> {
  const existing = (window as unknown as { wx?: WxSdk }).wx;
  if (existing) return Promise.resolve(existing);
  return new Promise((resolve, reject) => {
    const done = () => {
      const wx = (window as unknown as { wx?: WxSdk }).wx;
      if (wx) resolve(wx);
      else reject(new Error("微信 JS-SDK 已加载但未挂载 window.wx"));
    };
    const prior = document.getElementById(JSSDK_SCRIPT_ID);
    if (prior) {
      prior.addEventListener("load", done, { once: true });
      prior.addEventListener("error", () => reject(new Error("微信 JS-SDK 加载失败")), {
        once: true,
      });
      return;
    }
    const script = document.createElement("script");
    script.id = JSSDK_SCRIPT_ID;
    script.src = JSSDK_SRC;
    script.async = true;
    script.addEventListener("load", done, { once: true });
    script.addEventListener("error", () => reject(new Error("微信 JS-SDK 加载失败")), {
      once: true,
    });
    document.head.appendChild(script);
  });
}

export function WechatShareSetup({ config }: { config: WechatShareConfig }) {
  const { title, desc, link, imgUrl } = config;
  useEffect(() => {
    const shareData: WechatShareConfig = { title, desc, link, imgUrl };
    if (!SIGNATURE_ENDPOINT) return;
    if (!isWechatBrowser()) return;

    let cancelled = false;
    const pageUrl = window.location.href.split("#")[0];

    (async () => {
      const response = await fetch(
        `${SIGNATURE_ENDPOINT}?url=${encodeURIComponent(pageUrl)}`,
      );
      if (!response.ok) {
        throw new Error(`微信签名接口返回 ${response.status}`);
      }
      const ticket = (await response.json()) as {
        appId: string;
        timestamp: number;
        nonceStr: string;
        signature: string;
      };
      if (cancelled) return;
      const wx = await loadJssdk();
      if (cancelled) return;

      wx.config({ debug: false, ...ticket, jsApiList: JS_API_LIST });
      wx.ready(() => {
        // 「分享给朋友 / 群」:标题 + 描述 + 缩略图。
        wx.updateAppMessageShareData?.(shareData);
        // 「分享到朋友圈」只显示标题,没有描述位 —— 传 desc 是无效字段,
        // 所以这里按 SDK 的实际形状去掉它,而不是塞一份用不到的文案。
        wx.updateTimelineShareData?.({ title, link, imgUrl });
      });
      wx.error((error) => {
        // 签名失败在微信里是静默的(分享退回默认页面标题),不打日志的话
        // 排查会非常痛苦。
        console.error("[wechat-share] wx.config 失败", error);
      });
    })().catch((error: unknown) => {
      console.error("[wechat-share] 分享配置未生效", error);
    });

    return () => {
      cancelled = true;
    };
    // 依赖四个字符串而不是 config 对象:对象每次渲染都是新引用,会让这段
    // 副作用无谓重跑(并重新打一次签名接口)。
  }, [title, desc, link, imgUrl]);

  return null;
}
