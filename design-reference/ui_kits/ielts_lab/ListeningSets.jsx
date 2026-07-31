const { Button, Icon, Card, Badge, IconButton, Dialog } = window.STAGEDesignSystem_0f9c53;

const lsSt = {
  page: { padding: "clamp(24px,3vw,40px) clamp(20px,3.4vw,44px) 56px", display: "grid", gap: 18, maxWidth: 1100, alignContent: "start" },
  h1: { margin: 0, fontFamily: "var(--font-display)", fontWeight: "var(--fw-bold)", fontSize: "var(--fs-h2)", letterSpacing: "var(--ls-heading)", lineHeight: 1.15, color: "var(--blue-950)" },
  note: { fontSize: "var(--fs-sm)", lineHeight: 1.75, color: "var(--text-muted)", maxWidth: "58ch" },
  actions: { display: "flex", gap: 10, flexWrap: "wrap" },
  parts: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 12 },
  partN: { fontFamily: "var(--font-mono)", fontSize: "var(--fs-xs)", color: "var(--blue-700)", fontWeight: "var(--fw-medium)" },
  partT: { fontSize: "var(--fs-sm)", fontWeight: "var(--fw-medium)", color: "var(--text-strong)", lineHeight: 1.5 },
  track: { height: 5, borderRadius: "var(--radius-pill)", background: "var(--n-100)", overflow: "hidden" },
  fill: { height: "100%", background: "var(--blue-600)", borderRadius: "var(--radius-pill)" },
  secH: { display: "flex", alignItems: "baseline", gap: 12, paddingTop: 8 },
  secT: { fontSize: "var(--fs-h4)", fontWeight: "var(--fw-semibold)", letterSpacing: "var(--ls-heading)", color: "var(--text-strong)", flex: 1 },
  list: { border: "1px solid var(--border-hairline)", borderRadius: "var(--radius-lg)", overflow: "hidden" },
  row: { display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderBottom: "1px solid var(--border-hairline)", flexWrap: "wrap" },
  when: { fontFamily: "var(--font-mono)", fontSize: "var(--fs-sm)", color: "var(--text-body)", whiteSpace: "nowrap" },
  count: { fontFamily: "var(--font-mono)", fontSize: "var(--fs-xs)", color: "var(--text-subtle)", whiteSpace: "nowrap" },
  detail: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10, padding: "0 18px 16px" },
  dCell: { display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "var(--surface-sunken)", borderRadius: "var(--radius-sm)", fontSize: "var(--fs-xs)", color: "var(--text-body)" },
  pager: { display: "flex", alignItems: "center", gap: 10, justifyContent: "flex-end", fontSize: "var(--fs-xs)", color: "var(--text-subtle)" },
};

function ListeningSets({ onStart, onContinue }) {
  const data = window.LISTENING_SETS;
  const [openId, setOpenId] = React.useState(null);
  const [page, setPage] = React.useState(0);
  const [askAll, setAskAll] = React.useState(false);
  const [history, setHistory] = React.useState(data.history);
  const perPage = 2;
  const pages = Math.max(1, Math.ceil(history.length / perPage));
  const shown = history.slice(page * perPage, page * perPage + perPage);
  React.useEffect(() => { if (page > pages - 1) setPage(Math.max(0, pages - 1)); }, [pages, page]);

  return (
    <div style={lsSt.page}>
      <h1 style={lsSt.h1}>套题练习</h1>
      <p style={lsSt.note}>随机组成 P1–P4 一套题，优先安排没做过的题；某个 Part 没有未做题时，优先安排错得较多的题。</p>
      <div style={lsSt.actions}>
        <Button onClick={onContinue}>继续当前套题</Button>
        <Button variant="secondary" icon="shuffle" onClick={onStart}>随机生成套题</Button>
      </div>
      <div style={lsSt.parts}>
        {data.current.parts.map((p) => (
          <Card key={p.part} padding={18} style={{ display: "grid", gap: 10, alignContent: "start" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={lsSt.partN}>Part {p.part}</span>
              <Badge tone="neutral">{p.freq}</Badge>
            </div>
            <span style={lsSt.partT}>{p.title}</span>
            <span style={lsSt.track}><span style={{ ...lsSt.fill, width: Math.max(p.done / p.total * 100, 0) + "%" }} /></span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-xs)", color: "var(--text-subtle)" }}>{p.done}/{p.total}</span>
          </Card>
        ))}
      </div>

      <div style={lsSt.secH}>
        <span style={lsSt.secT}>会话历史记录</span>
        <button type="button" onClick={() => setAskAll(true)} style={{ border: "none", background: "transparent", cursor: "pointer", fontFamily: "var(--font-text)", fontSize: "var(--fs-sm)", fontWeight: "var(--fw-medium)", color: "var(--text-muted)" }}>删除全部记录</button>
      </div>
      <div style={lsSt.list}>
        {shown.map((h, i) => (
          <div key={h.id} style={{ borderBottom: i === shown.length - 1 ? "none" : "1px solid var(--border-hairline)" }}>
            <div style={{ ...lsSt.row, borderBottom: openId === h.id ? "1px solid var(--border-hairline)" : "none" }}>
              <span style={lsSt.when}>{h.when}</span>
              <Badge tone={h.state === "已完成" ? "verified" : "brand"}>{h.state}</Badge>
              <span style={lsSt.count}>{h.count} 条记录</span>
              <span style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <Button size="sm" variant="secondary" onClick={onContinue}>继续这次</Button>
                <Button size="sm" variant="ghost" onClick={() => setHistory(history.filter((x) => x.id !== h.id))}>删除这次</Button>
                <IconButton icon={openId === h.id ? "chevron-up" : "chevron-down"} label="展开" size="sm" onClick={() => setOpenId(openId === h.id ? null : h.id)} />
              </span>
            </div>
            {openId === h.id ? (
              <div style={lsSt.detail}>
                {h.parts.map((p) => (
                  <span key={p.part} style={lsSt.dCell}>
                    <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-subtle)" }}>P{p.part}</span>
                    {p.done === p.total ? <span style={{ fontFamily: "var(--font-mono)" }}>{p.done}/{p.total}</span>
                      : p.pending ? <span style={{ color: "var(--blue-700)" }}>待继续</span>
                      : p.done > 0 ? <span style={{ fontFamily: "var(--font-mono)" }}>{p.done}/{p.total}</span>
                      : <span style={{ color: "var(--text-subtle)" }}>未完成</span>}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ))}
        {history.length === 0 ? <div style={{ padding: "28px 18px", fontSize: "var(--fs-sm)", color: "var(--text-subtle)", textAlign: "center" }}>还没有套题练习记录。</div> : null}
      </div>
      {pages > 1 ? (
        <div style={lsSt.pager}>
          <Button size="sm" variant="ghost" disabled={page === 0} onClick={() => setPage(page - 1)}>上一条</Button>
          <span style={{ fontFamily: "var(--font-mono)" }}>{page + 1} / {pages}</span>
          <Button size="sm" variant="ghost" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>下一条</Button>
        </div>
      ) : null}

      <Dialog open={askAll} title="删除全部套题记录？" description="删除后无法恢复，题库本身不受影响。" onClose={() => setAskAll(false)}
        footer={<>
          <Button variant="secondary" onClick={() => setAskAll(false)}>取消</Button>
          <Button onClick={() => { setHistory([]); setAskAll(false); }}>删除全部记录</Button>
        </>} />
    </div>
  );
}
Object.assign(window, { ListeningSets });
