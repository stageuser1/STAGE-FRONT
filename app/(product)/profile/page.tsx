import { Suspense } from "react";
import type { Metadata } from "next";
import { ProfileFlow, type ProfileOptions } from "@/components/profile/ProfileFlow";
import { getFilterOptionPrograms } from "@/lib/data";
import { buildFilterOptions } from "@/lib/search-options";

export const metadata: Metadata = {
  title: "我的档案 · STAGE",
  description:
    "用 5 个问题建立你的申请档案，STAGE 会据此比对每个项目的要求与差距。档案保存在本机浏览器。",
};

export const revalidate = 900;

/**
 * Profile builder (P-04).
 *
 * The option lists come from real records on the server, so the chips a
 * learner picks are the same vocabulary the catalog filters on — a profile can
 * never contain a discipline or degree that matches nothing. The loader reads
 * only the four columns those chips are built from; this page renders no
 * deadlines, requirements or citations and so loads none.
 *
 * The flow itself is entirely client-side and makes no network request.
 */
export default async function ProfilePage() {
  const { countryOptions, majorOptions, degreeOptions } = buildFilterOptions(
    await getFilterOptionPrograms(),
  );

  const options: ProfileOptions = {
    fields: majorOptions,
    countries: countryOptions,
    degrees: degreeOptions,
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 md:py-14">
      <header className="mx-auto mb-6 w-full max-w-xl">
        <h1 className="text-2xl font-semibold">我的档案</h1>
        <p className="mt-1 text-sm text-stage-fg-muted">
          5 个问题，大约 2 分钟。每一步都可以跳过，档案保存在本机浏览器，不会上传。
        </p>
      </header>
      {/* useSearchParams needs a boundary, or the route opts out of static
          rendering and the option lists are re-serialised on every request. */}
      <Suspense
        fallback={
          <div className="mx-auto h-64 w-full max-w-xl animate-pulse rounded-stage-md bg-stage-bg-soft" />
        }
      >
        <ProfileFlow options={options} />
      </Suspense>
    </div>
  );
}
