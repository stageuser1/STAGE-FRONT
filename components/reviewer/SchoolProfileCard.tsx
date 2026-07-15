"use client";

import type { School } from "@/data/types";
import { MissingDataNote } from "@/components/MissingDataNote";
import { ReviewerEditableCard } from "./ReviewerEditableCard";

const countries = [
  "China",
  "United States",
  "United Kingdom",
  "Germany",
  "Hong Kong(China)",
  "Macao(China)",
  "South Korea",
  "Australia",
].map((value) => ({ label: value, value }));

export function SchoolProfileCard({
  programCount,
  school,
}: {
  programCount: number;
  school: School;
}) {
  const reviewRecord = school.review_record ?? {
    id: school.id,
    review_status: null,
    values: {
      school_name: school.name,
      country: school.country,
      city: school.city,
      official_website: school.website_url,
    },
  };
  return (
    <ReviewerEditableCard
      collection="schools"
      fields={[
        { field: "school_name", kind: "text", label: "学校名称" },
        {
          field: "country",
          kind: "select",
          label: "国家/地区",
          options: countries,
        },
        { field: "city", kind: "text", label: "城市" },
        {
          field: "official_website",
          kind: "text",
          label: "官方网站",
          type: "url",
        },
      ]}
      initialStatus={reviewRecord.review_status}
      initialValues={reviewRecord.values}
      recordId={reviewRecord.id}
      renderView={(values) => (
        <>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-normal text-blue-700">
                学校信息
              </p>
              <h1 className="mt-2 text-xl font-semibold leading-tight text-gray-900">
                {values.school_name || school.name}
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                {values.country || school.country} · {values.city || school.city}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
              {programCount} 个项目
            </span>
          </div>

          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm">
            <div className="flex items-start justify-between gap-3">
              <span className="text-gray-600">官方网站</span>
              <span className="max-w-44 truncate text-right font-semibold">
                {values.official_website ? (
                  <a
                    className="text-blue-700 underline-offset-2 hover:underline"
                    href={values.official_website}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {values.official_website}
                  </a>
                ) : (
                  <MissingDataNote />
                )}
              </span>
            </div>
          </div>
        </>
      )}
    />
  );
}
