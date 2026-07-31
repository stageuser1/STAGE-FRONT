const { Button, Icon, Card, Badge, Tabs } = window.STAGEDesignSystem_0f9c53;

const wtSt = {
  page: { padding: "clamp(24px,3vw,40px) clamp(20px,3.4vw,44px) 56px", display: "grid", gap: 18, maxWidth: 1100, alignContent: "start" },
  h1: { margin: 0, fontFamily: "var(--font-display)", fontWeight: "var(--fw-bold)", fontSize: "var(--fs-h2)", letterSpacing: "var(--ls-heading)", lineHeight: 1.15, color: "var(--blue-950)" },
  sub: { fontSize: "var(--fs-sm)", color: "var(--text-muted)", maxWidth: "56ch", lineHeight: 1.7 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(288px,1fr))", gap: 14 },
  title: { fontSize: "var(--fs-sm)", fontWeight: "var(--fw-semibold)", color: "var(--text-strong)", lineHeight: 1.55 },
  zh: { fontSize: "var(--fs-xs)", color: "var(--text-subtle)" },
  meta: { display: "flex", gap: 14, fontFamily: "var(--font-mono)", fontSize: "var(--fs-xs)", color: "var(--text-subtle)", flexWrap: "wrap" },
  /* 难度用中性蓝阶，不用红色 */
  diff: (d) => {
    const map = { "入门": ["var(--blue-50)", "var(--blue-700)", "var(--blue-100)"], "进阶": ["var(--n-100)", "var(--text-muted)", "var(--border-hairline)"], "挑战": ["var(--blue-800)", "var(--n-0)", "var(--blue-800)"] }[d];
    return { padding: "3px 10px", borderRadius: "var(--radius-pill)", background: map[0], color: map[1], border: "1px solid " + map[2], fontSize: "var(--fs-2xs)", fontWeight: "var(--fw-medium)", whiteSpace: "nowrap" };
  },
  strat: { display: "flex", gap: 9, padding: "11px 12px", background: "var(--gold-50)", border: "1px solid var(--gold-200)", borderRadius: "var(--radius-sm)", fontSize: "var(--fs-xs)", lineHeight: 1.7, color: "var(--text-body)" },
  pager: { display: "flex", alignItems: "center", gap: 8, justifyContent: "center", paddingTop: 6 },
  pageBtn: (on) => ({ minWidth: 32, height: 32, borderRadius: "var(--radius-xs)", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: "var(--fs-xs)", border: "1px solid " + (on ? "var(--action-primary)" : "var(--border-default)"), background: on ? "var(--surface-accent-soft)" : "var(--surface-page)", color: on ? "var(--blue-800)" : "var(--text-muted)", padding: "0 8px" }),
  total: { fontSize: "var(--fs-xs)", color: "var(--text-subtle)", fontFamily: "var(--font-mono)", marginLeft: 8 },
};

function WritingTasks({ onStart }) {
  const all = window.WRITING_TASKS;
  const [group, setGroup] = React.useState("全部");
  const [page, setPage] = React.useState(0);
  const perPage = 4;
  const rows = group === "全部" ? all : all.filter((t) => t.group === group);
  const pages = Math.max(1, Math.ceil(rows.length / perPage));
  const shown = rows.slice(page * perPage, page * perPage + perPage);
  React.useEffect(() => { setPage(0); }, [group]);
  return (
    <div style={wtSt.page}>
      <h1 style={wtSt.h1}>IELTS Writing Practice</h1>
      <p style={wtSt.sub}>按任务类型练习小作文与大作文。每次练习包含 Task 1 与 Task 2，可在两者之间自由切换，内容互不清空。</p>
      <span style={{ width: 260 }}><Tabs variant="pill" items={["全部", "Task 1", "Task 2"]} value={group} onChange={setGroup} /></span>
      <div style={wtSt.grid}>
        {shown.map((t) => (
          <Card key={t.id} padding={18} style={{ display: "grid", gap: 12, alignContent: "start" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <Badge tone="brand">{t.group}</Badge>
              <Badge tone="neutral">{t.chart}</Badge>
              <span style={{ marginLeft: "auto" }}><span style={wtSt.diff(t.diff)}>{t.diff}</span></span>
            </div>
            <span style={wtSt.title}>{t.title}</span>
            <span style={wtSt.zh}>{t.zh}</span>
            <span style={wtSt.meta}><span>预计 {t.minutes} 分钟</span><span>{t.tasks} tasks</span></span>
            <div style={wtSt.strat}>
              <span style={{ display: "grid", paddingTop: 2, color: "var(--gold-700)", flex: "none" }}><Icon name="lightbulb" size={14} /></span>
              <span><span style={{ fontWeight: "var(--fw-semibold)" }}>策略提示 · </span>{t.strategy}</span>
            </div>
            <Button fullWidth onClick={() => onStart(t)}>开始练习</Button>
          </Card>
        ))}
      </div>
      <div style={wtSt.pager}>
        <Button size="sm" variant="ghost" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button>
        {Array.from({ length: pages }).map((_, i) => (
          <button key={i} type="button" style={wtSt.pageBtn(i === page)} onClick={() => setPage(i)}>{i + 1}</button>
        ))}
        <Button size="sm" variant="ghost" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>Next</Button>
        <span style={wtSt.total}>共 {rows.length} 项</span>
      </div>
    </div>
  );
}
Object.assign(window, { WritingTasks });
