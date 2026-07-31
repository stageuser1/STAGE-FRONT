const { Card, Button, Icon, Badge, IconButton } = window.STAGEDesignSystem_0f9c53;

const ovStyles = {
  page: { padding: "clamp(24px,3vw,40px) clamp(20px,3.4vw,44px) 56px", display: "grid", gap: 18, maxWidth: 1160 },
  h1: { margin: 0, fontFamily: "var(--font-display)", fontWeight: "var(--fw-bold)", fontSize: "var(--fs-h2)", letterSpacing: "var(--ls-heading)", lineHeight: 1.15, color: "var(--blue-950)" },
  continueBar: { display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", border: "1px solid var(--border-accent)", background: "var(--surface-accent-soft)", borderRadius: "var(--radius-lg)", flexWrap: "wrap" },
  contTitle: { fontSize: "var(--fs-sm)", fontWeight: "var(--fw-semibold)", color: "var(--text-strong)" },
  contMeta: { fontSize: "var(--fs-xs)", color: "var(--text-muted)", marginTop: 2 },
  saved: { fontSize: "var(--fs-xs)", color: "var(--text-subtle)", marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 5 },
  retest: { display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", border: "1px solid var(--border-hairline)", borderRadius: "var(--radius-lg)", flexWrap: "wrap" },
  /* gap:1px on a hairline background gives every cell a rule on all sides —
     a wrapped row can never leave an orphaned, dividerless cell. */
  metrics: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(128px,1fr))", gap: 1, background: "var(--border-hairline)", border: "1px solid var(--border-hairline)", borderRadius: "var(--radius-lg)", overflow: "hidden" },
  metric: { padding: "20px 22px", background: "var(--surface-page)", display: "grid", gap: 5 },
  mv: { fontFamily: "var(--font-display)", fontWeight: "var(--fw-bold)", fontSize: "clamp(1.75rem,2.4vw,2.5rem)", letterSpacing: "var(--ls-display)", lineHeight: 1, color: "var(--blue-950)", fontVariantNumeric: "tabular-nums" },
  ml: { fontSize: "var(--fs-xs)", color: "var(--text-muted)" },
  mods: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 14 },
  modName: { fontFamily: "var(--font-display)", fontSize: "var(--fs-h4)", fontWeight: "var(--fw-semibold)", letterSpacing: "var(--ls-heading)", color: "var(--blue-950)" },
  modRow: { display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: "var(--fs-xs)", color: "var(--text-muted)" },
  modMono: { fontFamily: "var(--font-mono)", color: "var(--text-body)", whiteSpace: "nowrap", flex: "none", paddingLeft: 8 },
  track: { height: 5, borderRadius: "var(--radius-pill)", background: "var(--n-100)", overflow: "hidden" },
  fill: { height: "100%", background: "var(--blue-600)", borderRadius: "var(--radius-pill)" },
  onboard: { display: "flex", alignItems: "center", gap: 14, padding: "11px 16px", border: "1px solid var(--border-hairline)", borderRadius: "var(--radius-md)", flexWrap: "wrap" },
  step: { display: "inline-flex", alignItems: "center", gap: 8, fontSize: "var(--fs-xs)", color: "var(--text-body)", whiteSpace: "nowrap" },
  stepN: { width: 18, height: 18, borderRadius: "var(--radius-pill)", background: "var(--surface-accent-soft)", color: "var(--blue-700)", fontFamily: "var(--font-mono)", fontSize: 10, display: "grid", placeItems: "center", flex: "none" },
  stepDesc: { color: "var(--text-subtle)" },
  goalCard: { border: "1px solid var(--border-hairline)", borderRadius: "var(--radius-lg)", padding: "18px 20px", display: "grid", gap: 14 },
  goalHead: { display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" },
  goalTitle: { fontSize: "var(--fs-h4)", fontWeight: "var(--fw-semibold)", letterSpacing: "var(--ls-heading)", color: "var(--text-strong)" },
  goalNote: { fontSize: "var(--fs-xs)", color: "var(--text-subtle)" },
  goalGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(132px,1fr))", gap: 12 },
  goalItem: { display: "grid", gap: 6 },
  goalLabel: { fontSize: "var(--fs-xs)", color: "var(--text-muted)" },
  goalInput: { width: "100%", boxSizing: "border-box", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", padding: "9px 12px", fontFamily: "var(--font-mono)", fontSize: "var(--fs-body)", color: "var(--text-strong)", outline: "none", background: "var(--surface-page)" },
  modSub: { fontSize: "var(--fs-xs)", color: "var(--text-subtle)" },
  facts: { display: "grid", gap: 6, margin: 0, padding: 0, listStyle: "none" },
  fact: { display: "flex", gap: 8, fontSize: "var(--fs-xs)", lineHeight: 1.6, color: "var(--text-body)" },
  secHead: { display: "flex", alignItems: "baseline", gap: 12 },
  secTitle: { fontSize: "var(--fs-h4)", fontWeight: "var(--fw-semibold)", letterSpacing: "var(--ls-heading)", color: "var(--text-strong)" },
  all: { marginLeft: "auto", fontSize: "var(--fs-sm)", fontWeight: "var(--fw-medium)", color: "var(--blue-700)" },
  row: { display: "grid", gridTemplateColumns: "1.6fr auto auto auto auto", gap: 18, alignItems: "center", padding: "14px 18px", borderBottom: "1px solid var(--border-hairline)" },
};

function OverviewScreen({ onRoute, onTypes }) {
  const d = window.LAB_DATA;
  const [guide, setGuide] = React.useState(true);
  const [goals, setGoals] = React.useState(d.goals);
  return (
    <div style={ovStyles.page}>
      <h1 style={ovStyles.h1}>学习总览</h1>

      {guide ? (
        <div style={ovStyles.onboard}>
          {d.onboarding.map((s) => (
            <span key={s.n} style={ovStyles.step}>
              <span style={ovStyles.stepN}>{s.n}</span>
              <span style={{ fontWeight: "var(--fw-medium)" }}>{s.title}</span>
              <span style={ovStyles.stepDesc}>— {s.desc}</span>
            </span>
          ))}
          <span style={{ marginLeft: "auto" }}><IconButton icon="x" label="关闭引导" size="sm" onClick={() => setGuide(false)} /></span>
        </div>
      ) : null}

      {d.continueItem ? (
        <div style={ovStyles.continueBar}>
          <span style={{ display: "grid", color: "var(--blue-700)" }}><Icon name="book-open" size={19} /></span>
          <span style={{ flex: 1, minWidth: 200 }}>
            <span style={ovStyles.contTitle}>继续上次：{d.continueItem.title}</span>
            <span style={{ ...ovStyles.contMeta, display: "block" }}>{d.continueItem.zh} · {d.continueItem.skill} {d.continueItem.part} · 进度 {d.continueItem.progress}</span>
          </span>
          <Button size="sm">继续</Button>
          <span style={ovStyles.saved}><Icon name="check" size={12} strokeWidth={2.5} />已自动保存</span>
        </div>
      ) : null}

      {d.retestDue > 0 ? (
        <div style={ovStyles.retest}>
          <span style={{ display: "grid", color: "var(--text-subtle)" }}><Icon name="rotate-ccw" size={18} /></span>
          <span style={{ flex: 1, fontSize: "var(--fs-sm)", color: "var(--text-body)" }}>有 {d.retestDue} 道错题到了建议重测的时间</span>
          <Button size="sm" variant="secondary" onClick={() => onRoute("queue")}>去重测</Button>
        </div>
      ) : null}

      <div style={ovStyles.metrics}>
        {d.metrics.map((m, i) => (
          <div key={m.label} style={ovStyles.metric}>
            <span style={ovStyles.mv}>{m.value}</span>
            <span style={ovStyles.ml}>{m.label} · {m.note}</span>
          </div>
        ))}
      </div>

      <div style={ovStyles.goalCard}>
        <div style={ovStyles.goalHead}>
          <span style={ovStyles.goalTitle}>我的目标分数</span>
          <span style={ovStyles.goalNote}>目标分数由你自己设定，仅用于个人规划参考。</span>
        </div>
        <div style={ovStyles.goalGrid}>
          {["Reading", "Listening", "Writing", "Speaking"].map((k) => (
            <label key={k} style={ovStyles.goalItem}>
              <span style={ovStyles.goalLabel}>{k}</span>
              <input type="number" min="4" max="9" step="0.5" style={ovStyles.goalInput}
                value={goals[k]} onChange={(e) => setGoals({ ...goals, [k]: e.target.value })} />
            </label>
          ))}
        </div>
      </div>

      <div style={ovStyles.mods}>
        {d.modules.map((m) => (
          <Card key={m.skill} padding={20} style={{ display: "grid", gap: 12, alignContent: "start" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <span style={{ color: "var(--blue-700)", display: "grid" }}><Icon name={m.icon} size={19} /></span>
              <span style={ovStyles.modName}>{m.skill}</span>
              <span style={{ ...ovStyles.modSub, marginLeft: "auto" }}>{m.sub}</span>
            </div>
            <ul style={ovStyles.facts}>
              {m.facts.map((f) => (
                <li key={f} style={ovStyles.fact}>
                  <span style={{ color: "var(--n-400)", display: "grid", paddingTop: 3, flex: "none" }}><Icon name="minus" size={12} /></span>{f}
                </li>
              ))}
            </ul>
            <div style={{ display: "grid", gap: 7 }}>
              <div style={ovStyles.modRow}><span>已练习</span><span style={ovStyles.modMono}>{m.done} / {m.total} {m.unit}</span></div>
              <div style={ovStyles.track}><div style={{ ...ovStyles.fill, width: Math.max(m.done / m.total * 100, 1.5) + "%" }} /></div>
              <div style={ovStyles.modRow}><span>最近一次正确率</span><span style={ovStyles.modMono}>{m.lastAcc}</span></div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Button size="sm" variant="secondary" fullWidth onClick={() => onRoute(m.skill.toLowerCase())}>{m.actions[0]}</Button>
              <Button size="sm" variant="ghost" fullWidth onClick={() => onRoute(m.skill.toLowerCase())}>{m.actions[1]}</Button>
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gap: 0 }}>
        <div style={{ ...ovStyles.secHead, paddingBottom: 12 }}>
          <span style={ovStyles.secTitle}>最近练习</span>
          <a href="#types" style={{ ...ovStyles.all, marginLeft: "auto", color: "var(--text-muted)" }} onClick={(e) => { e.preventDefault(); onTypes(); }}>题型说明</a>
          <a href="#history" style={{ ...ovStyles.all, marginLeft: 0 }} onClick={(e) => { e.preventDefault(); onRoute("history"); }}>全部记录 →</a>
        </div>
        <div style={{ border: "1px solid var(--border-hairline)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          {d.recent.map((r, i) => (
            <div key={r.title} style={{ ...ovStyles.row, borderBottom: i === d.recent.length - 1 ? "none" : ovStyles.row.borderBottom }}>
              <span style={{ display: "grid", minWidth: 0 }}>
                <span style={{ fontSize: "var(--fs-sm)", fontWeight: "var(--fw-medium)", color: "var(--text-strong)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</span>
                <span style={{ fontSize: "var(--fs-2xs)", color: "var(--text-subtle)", marginTop: 2 }}>{r.zh}</span>
              </span>
              <Badge tone="neutral">{r.skill} {r.part}</Badge>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-2xs)", color: "var(--text-subtle)" }}>{r.date}</span>
              <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-body)" }}>
                我的正确率 <span style={{ fontFamily: "var(--font-mono)", fontWeight: "var(--fw-medium)" }}>{r.mine}</span>
                <span style={{ color: "var(--text-subtle)" }}> · 全体平均 <span style={{ fontFamily: "var(--font-mono)" }}>{r.avg}</span></span>
              </span>
              <a href="#review" style={{ fontSize: "var(--fs-xs)", fontWeight: "var(--fw-semibold)", color: "var(--blue-700)", justifySelf: "end" }} onClick={(e) => e.preventDefault()}>回顾</a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
Object.assign(window, { OverviewScreen });
