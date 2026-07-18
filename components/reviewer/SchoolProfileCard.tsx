"use client";

import type { School } from "@/data/types";
import { Icon } from "@/components/ui/Icon";
import { WorkflowStatusBadge } from "@/components/ui/StatusBadge";
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
              <h1 className="text-xl font-semibold leading-7 text-ink-900 md:text-2xl">
                {values.school_name || school.name}
              </h1>
              <p className="mt-1.5 flex items-center gap-1.5 text-sm text-ink-500">
                <Icon className="text-ink-400" name="location" size={16} />
                {values.country || school.country} ·{" "}
                {values.city || school.city}
              </p>
            </div>
            <WorkflowStatusBadge status={school.status} />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-brand-50 px-3 text-xs font-semibold text-brand-700">
              <Icon name="school" size={14} />
              {programCount} 个招生项目
            </span>
            {values.official_website ? (
              <a
                className="inline-flex h-7 items-center gap-1.5 rounded-full border border-line bg-white px-3 text-xs font-medium text-ink-700 transition hover:border-brand-300 hover:text-brand-600"
                href={values.official_website}
                rel="noopener noreferrer"
                target="_blank"
              >
                <Icon name="globe" size={14} />
                官方网站
                <Icon className="text-ink-400" name="external" size={12} />
              </a>
            ) : null}
          </div>
        </>
      )}
    />
  );
}
