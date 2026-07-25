import type { Metadata } from "next";
import { CtaSection } from "@/components/marketing/sections/CtaSection";
import { FaqSection } from "@/components/marketing/sections/FaqSection";
import { PricingPreviewSection } from "@/components/marketing/sections/PricingPreviewSection";

export const metadata: Metadata = {
  title: "定价 · STAGE",
  description: "STAGE 的方案与定价。浏览院校数据库始终免费，完整备考功能的具体方案即将公布。",
};

/**
 * /pricing (doc 03 §8) — the pricing preview at page scale, reusing the FAQ
 * and CTA sections. No additional bespoke design.
 */
export default function PricingPage() {
  return (
    <>
      <PricingPreviewSection />
      <FaqSection />
      <CtaSection />
    </>
  );
}
