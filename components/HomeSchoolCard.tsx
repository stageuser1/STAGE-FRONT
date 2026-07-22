import Link from "next/link";
import type { Program, School } from "@/data/types";
import { countryShort, latestSchoolUpdate } from "@/lib/format";
import { Icon } from "./ui/Icon";

interface HomeSchoolCardProps {
  school: School;
  programs: Program[];
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

function tuitionRange(programs: Program[]): string {
  const values = programs
    .map((program) => program.cost_aid.tuition_amount)
    .filter((value): value is number => value !== null)
    .sort((a, b) => a - b);
  if (values.length === 0) return "待公布";
  const currency = programs.find(
    (program) => program.cost_aid.tuition_amount !== null,
  )?.cost_aid.currency;
  const compact = (value: number) =>
    value >= 1000 ? `${Math.round(value / 1000)}k` : String(value);
  const range =
    values[0] === values.at(-1)
      ? compact(values[0])
      : `${compact(values[0])}-${compact(values.at(-1)!)}`;
  return `${currency ?? ""} ${range}`.trim();
}

function nearestDeadline(programs: Program[]): string {
  const deadlines = programs
    .flatMap((program) => [
      program.deadline.application_deadline,
      program.deadline.prescreening_deadline,
    ])
    .filter((value): value is string => Boolean(value))
    .sort();
  return deadlines[0] ? shortDate(deadlines[0]) : "待公布";
}

/** Explore feed card; all values are derived from the existing school/program data. */
export function HomeSchoolCard({ school, programs }: HomeSchoolCardProps) {
  const updated = latestSchoolUpdate(school, programs);
  const majors = new Set(
    programs.map((program) => program.major_area).filter(Boolean),
  ).size;
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
          <Metric icon="school" label="专业数量" value={`${majors || programs.length} 个`} />
          <Metric icon="calendar" label="最新更新" value={shortDate(updated)} />
          <Metric icon="tuition" label="学费范围" value={tuitionRange(programs)} />
          <Metric icon="clock" label="申请截止" value={nearestDeadline(programs)} />
        </div>

        <div className="flex h-[27px] items-center justify-center gap-2 text-[10px] font-medium text-brand-600">
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
