const { Button, Icon, Badge, EmptyState } = window.STAGEDesignSystem_0f9c53;

const quStyles = {
  page: { padding: "clamp(24px,3vw,40px) clamp(20px,3.4vw,44px) 56px", display: "grid", gap: 18, maxWidth: 1160, alignContent: "start" },
  h1: { margin: 0, fontFamily: "var(--font-display)", fontWeight: "var(--fw-bold)", fontSize: "var(--fs-h2)", letterSpacing: "var(--ls-heading)", lineHeight: 1.15, color: "var(--blue-950)" },
  sub: { fontSize: "var(--fs-sm)", color: "var(--text-muted)" },
  list: { border: "1px solid var(--border-hairline)", borderRadius: "var(--radius-lg)", overflowX: "auto" },
  row: { display: "grid", gridTemplateColumns: "minmax(210px,1.6fr) auto auto auto minmax(200px,1.1fr) auto auto", gap: 14, alignItems: "center", padding: "15px 18px", borderBottom: "1px solid var(--border-hairline)", minWidth: 900 },
  title: { fontSize: "var(--fs-sm)", fontWeight: "var(--fw-medium)", color: "var(--text-strong)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  zh: { fontSize: "var(--fs-2xs)", color: "var(--text-subtle)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  mono: { fontFamily: "var(--font-mono)", fontSize: "var(--fs-xs)", whiteSpace: "nowrap" },
  causes: { display: "flex", gap: 5, flexWrap: "wrap" },
  cause: { padding: "2px 9px", borderRadius: "var(--radius-pill)", background: "var(--surface-sunken)", border: "1px solid var(--border-hairline)", fontSize: "var(--fs-2xs)", color: "var(--text-muted)", whiteSpace: "nowrap" },
  due: { fontSize: "var(--fs-xs)", color: "var(--text-body)", whiteSpace: "nowrap" },
  compare: { display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--font-mono)", fontSize: "var(--fs-xs)", color: "var(--text-body)", whiteSpace: "nowrap" },
};

function QueueScreen() {
  const [items, setItems] = React.useState(window.LAB_QUEUE.map((q) => ({ ...q })));
  const doRetest = (id) => setItems((p) => p.map((it) => it.id === id ? { ...it, retested: it.retest, due: "已完成" } : it));
  const pending = items.filter((it) => !it.retested);
  const done = items.filter((it) => it.retested);
  const Row = ({ it, last }) => (
    <div style={{ ...quStyles.row, borderBottom: last ? "none" : quStyles.row.borderBottom }}>
      <span style={{ minWidth: 0 }}>
        <span style={{ ...quStyles.title, display: "block" }}>{it.title}</span>
        <span style={{ ...quStyles.zh, display: "block" }}>{it.zh}</span>
      </span>
      <Badge tone="neutral">{it.skill}</Badge>
      <span style={{ ...quStyles.mono, color: "var(--text-subtle)" }}>{it.date}</span>
      <span style={quStyles.mono}>原 {it.mine}</span>
      <span style={quStyles.causes}>{it.causes.map((c) => <span key={c} style={quStyles.cause}>{c}</span>)}</span>
      {it.retested ? (
        <span style={quStyles.compare}>
          上次 {it.mine} <Icon name="arrow-right" size={12} /> 本次 <span style={{ fontWeight: "var(--fw-semibold)", color: "var(--green-700)" }}>{it.retested}</span>
        </span>
      ) : (
        <span style={quStyles.due}><Icon name="clock" size={12} style={{ display: "inline-block", verticalAlign: -1, marginRight: 5, color: "var(--text-subtle)" }} />建议重测 {it.due}</span>
      )}
      {it.retested ? <Badge tone="verified">已完成</Badge> : <Button size="sm" variant="secondary" onClick={() => doRetest(it.id)}>重测</Button>}
    </div>
  );
  return (
    <div style={quStyles.page}>
      <h1 style={quStyles.h1}>复盘队列</h1>
      <span style={quStyles.sub}>按建议重测时间排序。重测只比较你自己的两次正确率，不评级、不打分。</span>
      {pending.length === 0 && done.length === 0 ? (
        <EmptyState icon="rotate-ccw" title="队列是空的" description="队列是空的——去练习里犯点错，再回来消灭它们。" />
      ) : (
        <>
          {pending.length === 0 ? (
            <EmptyState icon="rotate-ccw" title="队列是空的" description="队列是空的——去练习里犯点错，再回来消灭它们。" />
          ) : (
            <div style={quStyles.list}>
              {pending.map((it, i) => <Row key={it.id} it={it} last={i === pending.length - 1} />)}
            </div>
          )}
          {done.length ? (
            <>
              <span style={{ fontSize: "var(--fs-h4)", fontWeight: "var(--fw-semibold)", letterSpacing: "var(--ls-heading)", color: "var(--text-strong)", paddingTop: 6 }}>已完成重测</span>
              <div style={quStyles.list}>
                {done.map((it, i) => <Row key={it.id} it={it} last={i === done.length - 1} />)}
              </div>
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
Object.assign(window, { QueueScreen });
