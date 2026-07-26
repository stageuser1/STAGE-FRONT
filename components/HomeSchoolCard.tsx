import Link from "next/link";
import type { ExploreSchool } from "@/lib/explore/types";
import { countryShort } from "@/lib/format";
import { ConfidenceBadge } from "./ui/ConfidenceBadge";
import { Icon } from "./ui/Icon";

interface HomeSchoolCardProps {
  school: ExploreSchool;
  /** How many of this school's programs survive the active filters. */
  matchedProgramCount?: number;
}

const schoolNamesZh: Record<string, string> = {
  "The Juilliard School": "茱莉亚音乐学院",
  "Juilliard School": "茱莉亚音乐学院",
  "Manhattan School of Music": "曼哈顿音乐学院",
  "Curtis Institute of Music": "柯蒂斯音乐学院",
  "Eastman School of Music": "伊斯曼音乐学院",
  "New England Conservatory": "新英格兰音乐学院",
  "New England Conservatory of Music": "新英格兰音乐学院",
  "Colburn School": "科尔本音乐学院",
  "Berklee College of Music": "伯克利音乐学院",
  "Cleveland Institute of Music": "克利夫兰音乐学院",
  "Oberlin Conservatory of Music": "欧柏林音乐学院",
  "Jacobs School of Music": "雅各布斯音乐学院",
  "USC Thornton School of Music": "南加州大学桑顿音乐学院",
  "Bienen School of Music": "比嫩音乐学院",
  "Northwestern Bienen School of Music": "西北大学比嫩音乐学院",
  "Shepherd School of Music": "谢泼德音乐学院",
  "Rice Shepherd School of Music": "莱斯大学谢泼德音乐学院",
  "Yale School of Music": "耶鲁音乐学院",
  "Peabody Institute": "皮博迪音乐学院",
  "Royal College of Music": "英国皇家音乐学院",
  "Royal Academy of Music": "英国皇家音乐学院",
  "Royal Northern College of Music": "皇家北方音乐学院",
  "Royal Conservatoire of Scotland": "苏格兰皇家音乐学院",
  "Guildhall School of Music and Drama": "市政厅音乐及戏剧学院",
  "Guildhall School of Music & Drama": "市政厅音乐及戏剧学院",
};

function shortDate(value: string | null): string {
  if (!value) return "待更新";
  return value.slice(0, 10).replaceAll("-", ".");
}

function tuitionRange(school: ExploreSchool): string {
  if (school.tuitionMin === null) return "待公布";
  const compact = (value: number) =>
    value >= 1000 ? `${Math.round(value / 1000)}k` : String(value);
  const range =
    school.tuitionMin === school.tuitionMax
      ? compact(school.tuitionMin)
      : `${compact(school.tuitionMin)}-${compact(school.tuitionMax ?? school.tuitionMin)}`;
  return `${school.tuitionCurrency ?? ""} ${range}`.trim();
}

/** Explore feed card; every value is derived on the server from real records. */
export function HomeSchoolCard({
  school,
  matchedProgramCount,
}: HomeSchoolCardProps) {
  const nameZh = schoolNamesZh[school.name] ?? "中文名称待补充";

  return (
    <article className="group relative overflow-hidden rounded-[18px] border border-[#e7e7e7] bg-white shadow-[0_1px_4px_rgba(15,23,42,0.10)] transition hover:border-brand-300 hover:shadow-raised">
      <Link className="block" href={`/schools/${school.id}`}>
        <div
          aria-hidden="true"
          className="m-[5px] h-[99px] rounded-[14px] border border-[#eeeeee] bg-[#fcfcfc]"
        />

        <div className="flex h-[61px] items-center gap-3 px-2.5">
          <div
            aria-label="学校图片占位"
            className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded bg-[#dedede] text-[#b8b8b8]"
          />
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center justify-between gap-3">
              <h3 className="truncate text-[13px] font-semibold leading-5 text-[#171717]">
                {school.name}
              </h3>
              <p className="shrink-0 text-[12px] font-semibold leading-5 text-[#171717]">
                {nameZh}
              </p>
            </div>
            <p className="mt-0.5 flex items-center gap-1 truncate text-[9px] leading-3 text-[#8b8b8b]">
              <Icon className="shrink-0 text-[#b2b2b2]" name="location" size={11} />
              {countryShort(school.country)} · {school.city}
            </p>
          </div>
        </div>

        <div className="grid h-[44px] grid-cols-4 border-y border-[#eeeeee] px-1">
          <Metric
            icon="school"
            label="专业数量"
            value={`${school.majorCount || school.programCount} 个`}
          />
          <Metric
            icon="calendar"
            label="最新更新"
            value={shortDate(school.lastCheckedAt)}
          />
          <Metric icon="tuition" label="学费范围" value={tuitionRange(school)} />
          <Metric
            icon="clock"
            label="申请截止"
            value={shortDate(school.nearestDeadline)}
          />
        </div>

        {/* min-w-0 + flex-wrap: without them this row's min-content width sets
            the card's, and a long freshness sentence widens every card in the
            grid until the page itself scrolls sideways. */}
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-2 gap-y-0.5 px-2.5 py-1.5">
          <ConfidenceBadge
            status={school.status}
            lastCheckedAt={school.lastCheckedAt}
            className="min-w-0 text-[9px]"
          />
          {/* Only shown while filters are active, so the card can say how much
              of this school actually matched rather than implying all of it. */}
          {matchedProgramCount !== undefined ? (
            <span className="shrink-0 text-[9px] text-brand-600">
              {matchedProgramCount} / {school.programCount} 个项目匹配
            </span>
          ) : null}
        </div>

        <div className="flex h-[27px] items-center justify-center gap-2 border-t border-[#eeeeee] text-[10px] font-medium text-brand-600">
          查看院校
          <Icon
            className="transition group-hover:translate-x-0.5"
            name="chevron-right"
            size={13}
          />
        </div>
      </Link>

      <button
        aria-label={`收藏 ${school.name}`}
        className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-sm border border-[#eeeeee] bg-white/85 text-[#b8b8b8]"
        type="button"
      >
        <Icon name="bookmark" size={15} />
      </button>
    </article>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: "school" | "calendar" | "tuition" | "clock";
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center justify-center gap-1">
      <Icon className="shrink-0 text-[#a6a6a6]" name={icon} size={12} />
      <span className="min-w-0 text-[8px] leading-[11px] text-[#242424]">
        <span className="block whitespace-nowrap">{label}</span>
        <span className="block max-w-[62px] truncate text-[7px] text-[#989898]">
          {value}
        </span>
      </span>
    </div>
  );
}
