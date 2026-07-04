import Link from "next/link";
import type { School } from "@/data/types";
import { MissingDataNote } from "./MissingDataNote";

interface SchoolCardProps {
  school: School;
  programCount: number;
}

export function SchoolCard({ school, programCount }: SchoolCardProps) {
  return (
    <Link
      className="block rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow"
      href={`/schools/${school.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[17px] font-semibold leading-snug text-gray-900">
            {school.name}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {school.country} · {school.city}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
          {programCount} 个项目
        </span>
      </div>
      <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm">
        <div className="flex items-start justify-between gap-3">
          <span className="text-gray-600">官方网站</span>
          <span className="max-w-44 truncate text-right font-medium text-blue-700">
            {school.website_url ?? <MissingDataNote />}
          </span>
        </div>
      </div>
      <p className="mt-3 text-right text-xs font-semibold text-blue-700">
        查看学校
      </p>
    </Link>
  );
}
