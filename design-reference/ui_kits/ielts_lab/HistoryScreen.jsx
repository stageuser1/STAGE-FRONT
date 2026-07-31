const { Icon, Tabs, Card } = window.STAGEDesignSystem_0f9c53;

const hiStyles = {
  page: { padding: "clamp(24px,3vw,40px) clamp(20px,3.4vw,44px) 56px", display: "grid", gap: 18, maxWidth: 1160, alignContent: "start" },
  h1: { margin: 0, fontFamily: "var(--font-display)", fontWeight: "var(--fw-bold)", fontSize: "var(--fs-h2)", letterSpacing: "var(--ls-heading)", lineHeight: 1.15, color: "var(--blue-950)" },
  sum: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(128px,1fr))", gap: 1, background: "var(--border-hairline)", border: "1px solid var(--border-hairline)", borderRadius: "var(--radius-lg)", overflow: "hidden" },
  cell: { padding: "20px 22px", background: "var(--surface-page)", display: "grid", gap: 5 },
  v: { fontFamily: "var(--font-display)", fontWeight: "var(--fw-bold)", fontSize: "clamp(1.75rem,2.4vw,2.5rem)", letterSpacing: "var(--ls-display)", lineHeight: 1, color: "var(--blue-950)", fontVariantNumeric: "tabular-nums" },
  chartHead: { display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" },
  chartTitle: { fontSize: "var(--fs-h4)", fontWeight: "var(--fw-semibold)", letterSpacing: "var(--ls-heading)", color: "var(--text-strong)", flex: 1 },
  day: { display: "grid", gap: 0 },
  dayLabel: { fontFamily: "var(--font-mono)", fontSize: "var(--fs-xs)", color: "var(--text-subtle)", padding: "16px 0 10px" },
  event: { display: "flex", gap: 14, padding: "12px 0", borderBottom: "1px solid var(--border-hairline)", alignItems: "flex-start" },
  evIcon: (kind) => ({ width: 32, height: 32, flex: "none", borderRadius: "var(--radius-pill)", display: "grid", placeItems: "center", background: kind === "重测" || kind === "独立表达" ? "var(--surface-accent-soft)" : kind === "复盘" ? "var(--gold-50)" : "var(--surface-sunken)", color: kind === "重测" || kind === "独立表达" ? "var(--blue-700)" : kind === "复盘" ? "var(--gold-700)" : "var(--text-muted)", border: "1px solid var(--border-hairline)" }),
  evKind: { fontSize: "var(--fs-2xs)", letterSpacing: "var(--ls-eyebrow)", color: "var(--text-subtle)", fontWeight: "var(--fw-semibold)" },
  evTitle: { fontSize: "var(--fs-sm)", fontWeight: "var(--fw-medium)", color: "var(--text-strong)", marginTop: 2 },
  evMeta: { fontSize: "var(--fs-xs)", color: "var(--text-muted)", marginTop: 2 },
};

function AccuracyChart({ series, labels }) {
  const w = 640, h = 200, padL = 42, padB = 26, padT = 12, padR = 12;
  const min = 0, max = 100;
  const x = (i) => padL + i * (w - padL - padR) / (labels.length - 1);
  const y = (v) => padT + (1 - (v - min) / (max - min)) * (h - padT - padB);
  const pts = series.map((v, i) => x(i) + "," + y(v)).join(" ");
  return (
    <svg viewBox={"0 0 " + w + " " + h} preserveAspectRatio="xMidYMid meet" style={{ width: "100%", maxWidth: w, height: "auto", display: "block" }}>
      {[0, 25, 50, 75, 100].map((g) => (
        <g key={g}>
          <line x1={padL} x2={w - padR} y1={y(g)} y2={y(g)} stroke="var(--n-100)" strokeWidth="1" />
          <text x={padL - 8} y={y(g) + 4} textAnchor="end" fontSize="11" fill="var(--n-500)" fontFamily="IBM Plex Mono,monospace">{g}%</text>
        </g>
      ))}
      {/* 同上：首尾锚定 start/end */}
      {labels.map((l, i) => (
        <text key={l} x={x(i)} y={h - 8}
          textAnchor={i === 0 ? "start" : i === labels.length - 1 ? "end" : "middle"}
          fontSize="11" fill="var(--n-500)" fontFamily="IBM Plex Mono,monospace">{l}</text>
      ))}
      <polyline points={pts} fill="none" stroke="var(--blue-600)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {series.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r="3" fill="var(--blue-600)" />)}
    </svg>
  );
}

function HistoryScreen() {
  const d = window.LAB_HISTORY;
  const skills = Object.keys(d.series);
  const [skill, setSkill] = React.useState("全部");
  return (
    <div style={hiStyles.page}>
      <h1 style={hiStyles.h1}>学习记录</h1>
      <div style={hiStyles.sum}>
        {d.summary.map((m, i) => (
          <div key={m.label} style={hiStyles.cell}>
            <span style={hiStyles.v}>{m.value}</span>
            <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>{m.label} · {m.note}</span>
          </div>
        ))}
      </div>
      <Card padding={22} style={{ display: "grid", gap: 16 }}>
        <div style={hiStyles.chartHead}>
          <span style={hiStyles.chartTitle}>正确率随时间</span>
          <span style={{ flex: "none" }}><Tabs variant="pill" items={skills} value={skill} onChange={setSkill} style={{ overflowX: "visible" }} /></span>
        </div>
        <AccuracyChart series={d.series[skill]} labels={d.seriesLabels} />
        <span style={{ fontSize: "var(--fs-2xs)", color: "var(--text-subtle)" }}>纵轴为正确率百分比 — 不换算为任何分数刻度。</span>
      </Card>
      <div>
        {d.days.map((day) => (
          <div key={day.date} style={hiStyles.day}>
            <span style={hiStyles.dayLabel}>{day.date}</span>
            {day.events.map((e, i) => (
              <div key={i} style={hiStyles.event}>
                <span style={hiStyles.evIcon(e.kind)}><Icon name={e.icon} size={15} /></span>
                <span>
                  <span style={{ ...hiStyles.evKind, display: "block" }}>{e.kind}</span>
                  <span style={{ ...hiStyles.evTitle, display: "block" }}>{e.title}</span>
                  <span style={{ ...hiStyles.evMeta, display: "block" }}>{e.meta}</span>
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
Object.assign(window, { HistoryScreen });
