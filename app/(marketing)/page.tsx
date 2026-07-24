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
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
        STAGE
      </p>
      <h1 className="text-2xl font-semibold text-slate-900">落地页建设中</h1>
      <p className="text-base text-slate-600">
        新版首页正在开发中。前往{" "}
        <a className="font-medium text-blue-600 underline" href="/schools">
          院校数据库
        </a>{" "}
        浏览全部音乐院校。
      </p>
    </main>
  );
}
