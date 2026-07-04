import type { DataQuality } from "@/data/types";

interface DataStatusBannerProps {
  dataQuality: DataQuality;
}

const statusLabel = {
  draft: "草稿",
  extracted_awaiting_review: "待核验",
  human_reviewed: "已核验",
  published: "已发布",
};

const confidenceLabel = {
  high: "高可信",
  medium: "中等可信",
  low: "低可信",
};

function formatFieldName(field: string) {
  return field.replaceAll("_", " ");
}

export function DataStatusBanner({ dataQuality }: DataStatusBannerProps) {
  const verified =
    dataQuality.status === "published" ||
    dataQuality.status === "human_reviewed";
  const draft = dataQuality.status === "draft";
  const tone = verified
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : draft
      ? "border-gray-200 bg-gray-50 text-gray-600"
      : "border-amber-200 bg-amber-50 text-amber-700";
  const missing = dataQuality.missing_fields.slice(0, 4);

  return (
    <section className={`rounded-2xl border px-4 py-3 ${tone}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{statusLabel[dataQuality.status]}</p>
          <p className="mt-1 text-xs">
            可信度: {confidenceLabel[dataQuality.confidence]}
          </p>
        </div>
        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold">
          {verified ? "已核验" : draft ? "草稿" : "待核验"}
        </span>
      </div>
      {missing.length > 0 ? (
        <p className="mt-2 text-xs leading-5">
          待补充: {missing.map(formatFieldName).join(", ")}
          {dataQuality.missing_fields.length > missing.length ? "..." : ""}
        </p>
      ) : null}
    </section>
  );
}
