import { Container } from "@/components/marketing/Container";
import { stats } from "@/content/landing";
import { getHomepageStats } from "@/lib/marketing/stats";

/**
 * 数据条 (spec §二.4). Every figure is computed from the catalog at build time
 * by lib/marketing/stats.ts — there is no editorial number on this page. Where
 * the catalog differs from the spec's illustrative figures, the catalog wins
 * (Plan §2.1).
 *
 * A figure that cannot be computed renders as an em dash, never as 0
 * (Plan §6.8, `null ≠ 0`).
 */
export async function StatsSection() {
  const figures = await getHomepageStats(stats.labels);

  return (
    <section
      aria-label={stats.ariaLabel}
      className="border-y border-stage-border bg-stage-bg-soft"
    >
      <Container>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-10 py-stage-section-tight md:grid-cols-4">
          {figures.map((figure) => (
            <div key={figure.key} className="min-w-0 text-center">
              <dd className="font-stage-mono text-stage-h2 font-semibold text-stage-fg">
                {figure.value ?? "—"}
              </dd>
              <dt className="mx-auto mt-2 max-w-[16ch] text-stage-xs text-stage-fg-muted">
                {figure.label}
              </dt>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
