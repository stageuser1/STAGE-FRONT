import { CredibilitySection } from "@/components/marketing/sections/CredibilitySection";
import { CtaSection } from "@/components/marketing/sections/CtaSection";
import { FaqSection } from "@/components/marketing/sections/FaqSection";
import { FeatureSection } from "@/components/marketing/sections/FeatureSection";
import { HeroSection } from "@/components/marketing/sections/HeroSection";
import { HowItWorksSection } from "@/components/marketing/sections/HowItWorksSection";
import { PricingPreviewSection } from "@/components/marketing/sections/PricingPreviewSection";
import { features } from "@/content/landing";

/**
 * STAGE Landing Homepage (doc 03) — the 11 sections in order (navbar + footer
 * come from the (marketing) layout). Page metadata is inherited from the root
 * layout's landing defaults. Sections are server components; motion lives in
 * components/motion/*.
 */
export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <CredibilitySection />
      {features.map((feature, index) => (
        <FeatureSection key={feature.id} feature={feature} index={index} />
      ))}
      <HowItWorksSection />
      <PricingPreviewSection />
      <FaqSection />
      <CtaSection />
    </>
  );
}
