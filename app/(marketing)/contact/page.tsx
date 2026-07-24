import type { Metadata } from "next";
import { Container } from "@/components/marketing/Container";
import { teasers } from "@/content/landing";

export const metadata: Metadata = {
  title: "联系我们 · STAGE",
  description: "与 STAGE 取得联系。对院校数据、合作或产品有任何疑问，欢迎通过邮件联系我们。",
};

/**
 * /contact (doc 01 §3, doc 03) — minimal: heading + email. No form in Phase 1.
 */
export default function ContactPage() {
  const c = teasers.contact;
  return (
    <section aria-label={c.eyebrow} className="bg-stage-bg">
      <Container>
        <div className="mx-auto max-w-2xl py-20 text-center md:py-28">
          <span className="text-caption font-medium uppercase text-stage-primary">
            {c.eyebrow}
          </span>
          <h1 className="mt-4 text-balance text-h2-sm font-bold text-stage-fg md:text-h2">
            {c.title}
          </h1>
          <p className="mt-4 text-body-lg text-stage-fg-muted">{c.body}</p>
          <a
            href={`mailto:${c.email}`}
            className="mt-8 inline-flex items-center justify-center rounded-stage-md bg-stage-primary px-6 py-3 text-body font-medium text-stage-fg-on-dark transition hover:bg-stage-primary-hover"
          >
            {c.email}
          </a>
        </div>
      </Container>
    </section>
  );
}
