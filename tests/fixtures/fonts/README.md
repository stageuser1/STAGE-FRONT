# 测试用字体子集

由 `scripts/build-share-card-test-font.mjs` 生成,只供
`tests/dom/share-card-render.dom.test.tsx` 的真实渲染断言使用,
**不参与生产出图**(生产走构建期联网取子集,见 `lib/program-v3/share-card-font.ts`)。

字体:Noto Sans SC,SIL Open Font License 1.1(https://openfontlicense.org/open-font-license-official-text/)。
子集只含 `charset.txt` 里列出的字形。

字符数:144

测试字符串新增了 charset 之外的字符时重跑生成脚本;测试会先断言
「要渲染的每个字符都在 charset.txt 里」,漏字是显式失败而不是静默豆腐块。
