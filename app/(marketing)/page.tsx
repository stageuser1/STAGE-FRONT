/**
 * Landing Homepage — Phase 1A placeholder.
 *
 * Minimal by design: it exists so "/" renders successfully after the route
 * migration (the former homepage feed now lives at /schools). The Hero,
 * IeltsSimPreview, and all marketing sections are built in EP2 (see doc 03).
 * No Hero, sections, animations, or marketing components here yet. Styling
 * below uses stock utilities only and is fully replaced in EP2.
 */
export default function LandingPage() {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-4 px-6 py-20 text-center">
      <p className="text-caption font-medium uppercase text-stage-primary">
        STAGE
      </p>
      <h1 className="text-h2-sm font-bold text-stage-fg">落地页建设中</h1>
      <p className="text-body-lg text-stage-fg-muted">
        新版首页正在开发中。前往{" "}
        <a className="font-medium text-stage-primary underline" href="/schools">
          院校数据库
        </a>{" "}
        浏览全部音乐院校。
      </p>
    </section>
  );
}
