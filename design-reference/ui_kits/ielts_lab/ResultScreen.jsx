const { Button, Icon, Card, Badge } = window.STAGEDesignSystem_0f9c53;

const rsSt = {
  page: { padding: "clamp(24px,3vw,40px) clamp(20px,3.4vw,44px) 56px", display: "grid", gap: 18, maxWidth: 900, alignContent: "start" },
  h1: { margin: 0, fontFamily: "var(--font-display)", fontWeight: "var(--fw-bold)", fontSize: "var(--fs-h2)", letterSpacing: "var(--ls-heading)", lineHeight: 1.15, color: "var(--blue-950)" },
  sub: { fontSize: "var(--fs-sm)", color: "var(--text-muted)" },
  top: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(128px,1fr))", gap: 1, background: "var(--border-hairline)", border: "1px solid var(--border-hairline)", borderRadius: "var(--radius-lg)", overflow: "hidden" },
  cell: { padding: "20px 22px", background: "var(--surface-page)", display: "grid", gap: 5 },
  v: { fontFamily: "var(--font-display)", fontWeight: "var(--fw-bold)", fontSize: "clamp(1.75rem,2.4vw,2.5rem)", letterSpacing: "var(--ls-display)", lineHeight: 1, color: "var(--blue-950)", fontVariantNumeric: "tabular-nums" },
  l: { fontSize: "var(--fs-xs)", color: "var(--text-muted)" },
  list: { border: "1px solid var(--border-hairline)", borderRadius: "var(--radius-lg)", overflow: "hidden" },
  row: { display: "grid", gridTemplateColumns: "34px auto minmax(0,1fr) minmax(190px,auto)", gap: 14, alignItems: "center", padding: "13px 18px", borderBottom: "1px solid var(--border-hairline)" },
  n: { fontFamily: "var(--font-mono)", fontSize: "var(--fs-xs)", color: "var(--text-subtle)" },
  stem: { fontSize: "var(--fs-sm)", color: "var(--text-body)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  ans: { fontFamily: "var(--font-mono)", fontSize: "var(--fs-xs)", display: "flex", gap: 8, alignItems: "center", justifyContent: "flex-end", flexWrap: "wrap" },
  foot: { display: "flex", gap: 12, paddingTop: 8, flexWrap: "wrap" },
};

function ResultScreen({ id, bank, result, onBank, onReview }) {
  const p = (bank === "LISTENING" ? window.LISTENING : window.PRACTICE)[id];
  const { answers, secs } = result;
  const norm = (v) => (Array.isArray(v) ? v.slice().sort().join(" · ") : String(v || "").trim()).toLowerCase();
  const rows = p.questions.map((q) => ({ ...q, mine: Array.isArray(answers[q.n]) ? answers[q.n].join(" · ") : answers[q.n], ok: norm(answers[q.n]) === norm(q.answer) }));
  const correct = rows.filter((r) => r.ok).length;
  const wrong = rows.length - correct;
  const acc = Math.round(correct / rows.length * 100);
  const mm = Math.floor(secs / 60), ss = secs % 60;
  return (
    <div style={rsSt.page}>
      <h1 style={rsSt.h1}>练习结果</h1>
      <span style={rsSt.sub}>{p.title} · {p.zh}</span>
      <div style={rsSt.top}>
        <div style={rsSt.cell}><span style={rsSt.v}>{acc}%</span><span style={rsSt.l}>本次正确率 · {correct}/{rows.length} 题</span></div>
        <div style={rsSt.cell}><span style={rsSt.v}>{mm}<span style={{ fontSize: "0.5em", fontWeight: "var(--fw-medium)" }}> 分 </span>{ss}<span style={{ fontSize: "0.5em", fontWeight: "var(--fw-medium)" }}> 秒</span></span><span style={rsSt.l}>用时 {mm} 分 {ss} 秒</span></div>
        <div style={rsSt.cell}><span style={rsSt.v}>{wrong}</span><span style={rsSt.l}>错题 · 可加入复盘队列</span></div>
      </div>
      <div style={rsSt.list}>
        {rows.map((r, i) => (
          <div key={r.n} style={{ ...rsSt.row, borderBottom: i === rows.length - 1 ? "none" : rsSt.row.borderBottom }}>
            <span style={rsSt.n}>{r.n}</span>
            <span style={{ color: r.ok ? "var(--green-600)" : "var(--red-600)", display: "grid" }}><Icon name={r.ok ? "check" : "x"} size={16} strokeWidth={2.5} /></span>
            <span style={rsSt.stem}>{r.stem}</span>
            <span style={rsSt.ans}>
              <span style={{ color: r.ok ? "var(--text-body)" : "var(--red-600)" }}>我的 {r.mine ? r.mine : "未作答"}</span>
              {r.ok ? null : <><Icon name="arrow-right" size={12} style={{ color: "var(--n-400)" }} /><span style={{ color: "var(--green-700)" }}>{Array.isArray(r.answer) ? r.answer.join(" · ") : r.answer}</span></>}
            </span>
          </div>
        ))}
      </div>
      <div style={rsSt.foot}>
        <Button variant="secondary" onClick={onBank}>返回题库</Button>
        <Button size={wrong ? "lg" : "md"} onClick={onReview} iconRight="arrow-right">查看复盘</Button>
      </div>
    </div>
  );
}
Object.assign(window, { ResultScreen });
