const { Button, Icon, Badge, Tag } = window.STAGEDesignSystem_0f9c53;

const evStyles = {
  page: { display: "grid", gridTemplateRows: "auto 1fr auto", height: "100vh", minWidth: 0 },
  head: { display: "flex", alignItems: "center", gap: 14, padding: "16px clamp(20px,3vw,32px)", borderBottom: "1px solid var(--border-hairline)", flexWrap: "wrap" },
  back: { display: "inline-flex", alignItems: "center", gap: 6, fontSize: "var(--fs-sm)", fontWeight: "var(--fw-medium)", color: "var(--text-muted)", cursor: "pointer", border: "none", background: "transparent", fontFamily: "var(--font-text)", padding: 0 },
  title: { fontSize: "var(--fs-body)", fontWeight: "var(--fw-semibold)", color: "var(--text-strong)" },
  cols: { display: "grid", gridTemplateColumns: "minmax(0,1.1fr) minmax(0,1fr)", minHeight: 0 },
  left: { overflowY: "auto", padding: "22px clamp(20px,3vw,32px)", borderRight: "1px solid var(--border-hairline)" },
  right: { overflowY: "auto", padding: "22px clamp(20px,3vw,32px)", display: "grid", gap: 14, alignContent: "start" },
  line: (hl) => ({ display: "grid", gridTemplateColumns: "auto 1fr", gap: 12, padding: "8px 10px", borderRadius: "var(--radius-sm)", background: hl ? "var(--gold-50)" : "transparent", transition: "background var(--dur-base) var(--ease-standard)", alignItems: "baseline" }),
  t: { fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-subtle)", minWidth: 40 },
  chip: { display: "inline-flex", alignItems: "center", gap: 4, marginLeft: 8, padding: "1px 8px", borderRadius: "var(--radius-pill)", background: "var(--gold-200)", color: "var(--blue-950)", fontFamily: "var(--font-mono)", fontSize: 10, verticalAlign: "middle" },
  text: (hl) => ({ fontSize: "var(--fs-sm)", lineHeight: 1.8, color: "var(--text-body)", background: hl ? "var(--gold-200)" : "transparent", borderRadius: 3 }),
  qCard: (wrong) => ({ border: "1px solid var(--border-hairline)", borderRadius: "var(--radius-md)", padding: 16, display: "grid", gap: 10 }),
  qHead: { display: "flex", gap: 10, alignItems: "center" },
  ans: { display: "grid", gap: 4, fontSize: "var(--fs-sm)" },
  cue: { display: "inline-flex", alignItems: "center", gap: 5, fontSize: "var(--fs-xs)", fontWeight: "var(--fw-semibold)", color: "var(--blue-700)", cursor: "pointer", border: "none", background: "transparent", fontFamily: "var(--font-text)", padding: 0, justifySelf: "start" },
  causes: { display: "flex", gap: 6, flexWrap: "wrap", paddingTop: 4, borderTop: "1px dashed var(--border-hairline)" },
  foot: { display: "flex", gap: 10, alignItems: "center", padding: "14px clamp(20px,3vw,32px)", borderTop: "1px solid var(--border-hairline)", background: "var(--surface-page)" },
};

function EvidenceReview({ mode, onBack, onQueued }) {
  const data = window.LAB_REVIEW[mode];
  const hasTime = mode === "listening";
  const [hl, setHl] = React.useState(null);
  const [tags, setTags] = React.useState({});
  const leftRef = React.useRef(null);
  const lineRefs = React.useRef({});
  const showCue = (idx) => {
    setHl(idx);
    const el = lineRefs.current[idx];
    if (el && leftRef.current) leftRef.current.scrollTo({ top: el.offsetTop - 80, behavior: "smooth" });
  };
  const toggleTag = (q, c) => setTags((p) => {
    const cur = p[q] || [];
    return { ...p, [q]: cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c] };
  });
  return (
    <div style={evStyles.page}>
      <div style={evStyles.head}>
        <button type="button" style={evStyles.back} onClick={onBack}><Icon name="arrow-left" size={15} />返回题库</button>
        <span style={{ color: "var(--n-300)" }}>|</span>
        <span style={evStyles.title}>{data.title}</span>
        <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-subtle)" }}>{data.zh} · {data.skill} {data.part}</span>
        <span style={{ marginLeft: "auto", fontSize: "var(--fs-xs)", color: "var(--text-subtle)", display: "inline-flex", gap: 5, alignItems: "center" }}><Icon name="check" size={12} strokeWidth={2.5} />已自动保存</span>
      </div>
      <div style={evStyles.cols}>
        <div ref={leftRef} style={evStyles.left}>
          <span style={{ fontSize: "var(--fs-2xs)", letterSpacing: "var(--ls-eyebrow)", textTransform: "uppercase", color: "var(--text-subtle)", fontWeight: "var(--fw-semibold)", display: "block", paddingBottom: 12 }}>{hasTime ? "原文 Transcript" : "阅读原文"}</span>
          <div style={{ display: "grid", gap: 2 }}>
            {data.transcript.map((l, i) => (
              <div key={i} ref={(el) => { lineRefs.current[i] = el; }} style={evStyles.line(hl === i)}>
                {hasTime ? <span style={evStyles.t}>{l.t}</span> : <span style={evStyles.t}>{String(i + 1).padStart(2, "0")}</span>}
                <span style={evStyles.text(false)}>
                  <span style={evStyles.text(hl === i)}>{l.text}</span>
                  {hl === i && hasTime ? <span style={evStyles.chip}><Icon name="clock" size={10} />{l.t}</span> : null}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div style={evStyles.right}>
          <span style={{ fontSize: "var(--fs-2xs)", letterSpacing: "var(--ls-eyebrow)", textTransform: "uppercase", color: "var(--text-subtle)", fontWeight: "var(--fw-semibold)" }}>题目与我的作答</span>
          {data.questions.map((qu) => (
            <div key={qu.q} style={evStyles.qCard(qu.wrong)}>
              <div style={evStyles.qHead}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-xs)", fontWeight: "var(--fw-medium)", color: "var(--text-strong)" }}>{qu.q}</span>
                <span style={{ fontSize: "var(--fs-sm)", color: "var(--text-body)", flex: 1 }}>{qu.stem}</span>
                <Badge tone={qu.wrong ? "neutral" : "verified"}>{qu.wrong ? "答错" : "答对"}</Badge>
              </div>
              <div style={evStyles.ans}>
                <span style={{ color: qu.wrong ? "var(--red-600)" : "var(--text-body)" }}>我的作答：<span style={{ fontFamily: "var(--font-mono)" }}>{qu.my}</span></span>
                {qu.wrong ? <span style={{ color: "var(--green-700)" }}>正确答案：<span style={{ fontFamily: "var(--font-mono)" }}>{qu.correct}</span></span> : null}
              </div>
              {qu.wrong ? (
                <>
                  <button type="button" style={evStyles.cue} onClick={() => showCue(qu.cue)}>
                    <Icon name="link" size={13} />查看证据{hasTime ? ` · ${data.transcript[qu.cue].t}` : " · 原文定位"}
                  </button>
                  <div style={evStyles.causes}>
                    <span style={{ fontSize: "var(--fs-2xs)", color: "var(--text-subtle)", alignSelf: "center" }}>错因标注：</span>
                    {window.LAB_CAUSES.map((c) => (
                      <Tag key={c} selected={(tags[qu.q] || []).includes(c)} onClick={() => toggleTag(qu.q, c)} style={{ height: 28, fontSize: "var(--fs-2xs)", padding: "0 10px" }}>{c}</Tag>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          ))}
        </div>
      </div>
      <div style={evStyles.foot}>
        <Button onClick={onQueued}>加入复盘队列</Button>
        <Button variant="secondary" onClick={onBack}>完成复盘</Button>
        <span style={{ marginLeft: "auto", fontSize: "var(--fs-xs)", color: "var(--text-subtle)" }}>标注的错因会计入弱点档案</span>
      </div>
    </div>
  );
}
Object.assign(window, { EvidenceReview });
