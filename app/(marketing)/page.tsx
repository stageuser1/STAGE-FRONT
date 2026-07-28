import type { Metadata } from "next";
import { ConversionSection } from "@/components/marketing/sections/ConversionSection";
import { HeroSection } from "@/components/marketing/sections/HeroSection";
import { LabSection } from "@/components/marketing/sections/LabSection";
import { MomentSection } from "@/components/marketing/sections/MomentSection";
import { PersonaSection } from "@/components/marketing/sections/PersonaSection";
import { StatsSection } from "@/components/marketing/sections/StatsSection";
import { VerificationSection } from "@/components/marketing/sections/VerificationSection";

/**
 * STAGE marketing homepage — the eight blocks of `homepage-spec.md` §二, in
 * order (the navbar and footer come from the (marketing) layout). Every section
 * is a server component; the only client JS on the page is the navbar's mobile
 * menu.
 *
 * The stats strip reads the live catalog, so the route is revalidated on the
 * same 15-minute cadence as /schools rather than being frozen at build time.
 *
 * The page states its own metadata: the root layout's default description
 * advertises an AI exam-prep product, which spec §五.1 forbids. That default
 * is outside this stage's surface and is recorded as a finding instead.
 */
export const metadata: Metadata = {
  title: "STAGE — 找到适合你的学校，也准备好你的 IELTS",
  description:
    "STAGE 收录全球音乐院校的招生与申请要求，每一条都可追溯至官方信息源；IELTS Lab 提供有据可循的练习复盘，不做评分、不预测分数。",
};

export const revalidate = 900;

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <MomentSection />
      <StatsSection />
      <VerificationSection />
      <LabSection />
      <PersonaSection />
      <ConversionSection />
    </>
  );
}
