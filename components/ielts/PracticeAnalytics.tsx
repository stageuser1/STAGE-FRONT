"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { buildQuestionTypeStats, buildTrend, weakestType } from "@/lib/ielts/analytics";
import { UNCLASSIFIED } from "@/lib/ielts/question-types";
import type { PracticeRecord, QuestionTypeStat, TrendPoint } from "@/lib/ielts/types";
import { Badge, Card, EmptyNote } from "./ui";

/** Chart colours come from the design tokens, not from Recharts' defaults. */
const PRIMARY = "var(--stage-primary)";
const SUBTLE = "var(--stage-fg-subtle)";
const BORDER = "var(--stage-border)";
const WARNING = "var(--stage-warning)";
const SUCCESS = "var(--stage-success)";
const DANGER = "var(--stage-danger)";

const AXIS = {
  stroke: SUBTLE,
  fontSize: 11,
  tickLine: false,
} as const;

/** Accuracy bands: danger below 50, amber to 75, green above. */
function accuracyColor(accuracy: number): string {
  if (accuracy >= 75) return SUCCESS;
  if (accuracy >= 50) return WARNING;
  return DANGER;
}

function TooltipShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-stage-sm border border-stage-border bg-stage-bg px-3 py-2 text-stage-2xs shadow-stage-sm">
      {children}
    </div>
  );
}

function TrendTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: TrendPoint }>;
}) {
  const point = active ? payload?.[0]?.payload : undefined;
  if (!point) return null;

  return (
    <TooltipShell>
      <p className="max-w-[220px] truncate font-medium text-stage-fg">
        {point.title}
      </p>
      <p className="mt-1 text-stage-fg-muted">
        {point.date} · {point.category || "—"}
      </p>
      <p className="mt-1 font-semibold text-stage-fg">
        正确率 {point.accuracy}%
      </p>
      <p className="text-stage-fg-muted">
        答对 {point.score} / {point.totalQuestions} 题
      </p>
    </TooltipShell>
  );
}

function TypeTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: QuestionTypeStat }>;
}) {
  const stat = active ? payload?.[0]?.payload : undefined;
  if (!stat) return null;

  return (
    <TooltipShell>
      <p className="font-medium text-stage-fg">{stat.label}</p>
      <p className="mt-1 text-stage-fg-muted">
        答对 {stat.correct} / {stat.attempted} 题
      </p>
      <p className="mt-1 font-semibold text-stage-fg">正确率 {stat.accuracy}%</p>
    </TooltipShell>
  );
}

/**
 * Progress tracking (master-spec 批次二 学习记录页).
 *
 * The Y axis is accuracy in percent and nothing else. A second chart used to
 * plot the raw number of correct answers per attempt under the heading
 * "分数趋势"; it was removed rather than restyled, because passages carry
 * different question counts, so that line moved with the passage rather than
 * with the learner — and the vocabulary invited exactly the score reading the
 * rulings forbid.
 */
export function PracticeAnalytics({ records }: { records: PracticeRecord[] }) {
  const trend = buildTrend(records);
  const typeStats = buildQuestionTypeStats(records);
  const weakest = weakestType(typeStats);

  // A single attempt is a point, not a trend. Charting it invites the learner
  // to read a slope that does not exist.
  const hasTrend = trend.length >= 2;
  const classified = typeStats.filter((stat) => stat.type !== UNCLASSIFIED);

  return (
    <div className="space-y-4">
      {weakest ? (
        <Card>
          <p className="text-stage-xs text-stage-fg-body">
            最需要加强的题型是{" "}
            <span className="font-semibold text-stage-primary">
              {weakest.label}
            </span>
            ，正确率 {weakest.accuracy}%（{weakest.correct}/{weakest.attempted}{" "}
            题）。
          </p>
        </Card>
      ) : null}

      <Card
        title="正确率趋势"
        subtitle={
          hasTrend
            ? `最近 ${trend.length} 次练习，由旧到新 · 纵轴为正确率百分比`
            : undefined
        }
      >
        {hasTrend ? (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={trend}
                margin={{ top: 8, right: 8, bottom: 4, left: -20 }}
              >
                <CartesianGrid stroke={BORDER} vertical={false} />
                <XAxis dataKey="date" {...AXIS} />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  unit="%"
                  {...AXIS}
                />
                <Tooltip
                  content={<TrendTooltip />}
                  cursor={{ stroke: BORDER }}
                />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  stroke={PRIMARY}
                  strokeWidth={2}
                  dot={{ r: 3, fill: PRIMARY, strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyNote>再完成一次练习即可看到趋势。</EmptyNote>
        )}
      </Card>

      <Card
        title="题型表现"
        subtitle="按正确率排序，最弱的在最上方"
        aside={
          typeStats.length > classified.length ? (
            <Badge tone="warning">含未分类题目</Badge>
          ) : null
        }
      >
        {classified.length === 0 ? (
          <EmptyNote>完成练习后，这里会按题型显示正确率。</EmptyNote>
        ) : (
          <div style={{ height: classified.length * 34 + 28 }} className="w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={classified}
                layout="vertical"
                margin={{ top: 0, right: 44, bottom: 0, left: 0 }}
                barCategoryGap={6}
              >
                <CartesianGrid stroke={BORDER} horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  ticks={[0, 50, 100]}
                  unit="%"
                  {...AXIS}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={104}
                  {...AXIS}
                  axisLine={false}
                />
                <Tooltip
                  content={<TypeTooltip />}
                  cursor={{ fill: "var(--stage-bg-soft)" }}
                />
                <Bar dataKey="accuracy" radius={[0, 4, 4, 0]} isAnimationActive={false}>
                  {classified.map((stat) => (
                    <Cell key={stat.type} fill={accuracyColor(stat.accuracy)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  );
}
