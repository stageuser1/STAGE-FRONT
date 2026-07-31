const { Button, Icon, IconButton, Badge, Card } = window.STAGEDesignSystem_0f9c53;

const wsSt = {
  page: { display: "grid", gridTemplateRows: "auto 1fr auto", height: "100vh", minWidth: 0 },
  bar: { display: "flex", alignItems: "center", gap: 16, padding: "12px clamp(16px,2.4vw,28px)", borderBottom: "1px solid var(--border-hairline)", flexWrap: "wrap" },
  back: { display: "inline-flex", alignItems: "center", gap: 7, border: "none", background: "transparent", cursor: "pointer", padding: 0, fontFamily: "var(--font-text)", fontSize: "var(--fs-sm)", fontWeight: "var(--fw-medium)", color: "var(--text-muted)" },
  title: { fontSize: "var(--fs-sm)", fontWeight: "var(--fw-semibold)", color: "var(--text-strong)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 },
  prog: { fontFamily: "var(--font-mono)", fontSize: "var(--fs-xs)", color: "var(--text-muted)", whiteSpace: "nowrap" },
  timer: { fontFamily: "var(--font-mono)", fontSize: "var(--fs-h4)", color: "var(--text-muted)", fontVariantNumeric: "tabular-nums", letterSpacing: ".04em" },
  cols: (hidden) => ({ display: "grid", gridTemplateColumns: hidden ? "1fr" : "minmax(0,1fr) minmax(0,1.05fr)", minHeight: 0 }),
  left: { overflowY: "auto", padding: "20px clamp(18px,2.4vw,30px) 36px", borderRight: "1px solid var(--border-hairline)", display: "grid", gap: 16, alignContent: "start" },
  right: { overflowY: "auto", padding: "20px clamp(18px,2.4vw,30px) 36px", display: "grid", gridTemplateRows: "auto 1fr auto", gap: 12, minHeight: 0 },
  eyebrow: { fontSize: "var(--fs-2xs)", letterSpacing: "var(--ls-eyebrow)", textTransform: "uppercase", color: "var(--text-subtle)", fontWeight: "var(--fw-semibold)" },
  prompt: { fontSize: "var(--fs-sm)", lineHeight: 1.85, color: "var(--text-body)", whiteSpace: "pre-line" },
  req: { fontSize: "var(--fs-sm)", fontWeight: "var(--fw-semibold)", color: "var(--text-strong)" },
  ta: { width: "100%", height: "100%", minHeight: 240, boxSizing: "border-box", resize: "none", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", padding: "16px 18px", fontFamily: "var(--font-text)", fontSize: "var(--fs-sm)", lineHeight: 1.9, color: "var(--text-strong)", outline: "none" },
  count: { display: "flex", alignItems: "center", gap: 14, fontSize: "var(--fs-xs)", color: "var(--text-muted)", flexWrap: "wrap" },
  saved: { display: "inline-flex", alignItems: "center", gap: 5, fontSize: "var(--fs-xs)", color: "var(--text-subtle)", marginLeft: "auto" },
  foot: { display: "flex", alignItems: "center", gap: 12, padding: "12px clamp(16px,2.4vw,28px)", borderTop: "1px solid var(--border-hairline)", flexWrap: "wrap" },
  tab: (on) => ({ padding: "8px 18px", borderRadius: "var(--radius-sm)", cursor: "pointer", border: "1px solid " + (on ? "var(--action-primary)" : "var(--border-default)"), background: on ? "var(--surface-accent-soft)" : "var(--surface-page)", color: on ? "var(--blue-800)" : "var(--text-muted)", fontFamily: "var(--font-text)", fontSize: "var(--fs-sm)", fontWeight: on ? "var(--fw-semibold)" : "var(--fw-medium)", whiteSpace: "nowrap", flex: "none" }),
  model: { display: "grid", gap: 10, padding: "16px 18px", background: "var(--surface-sunken)", borderRadius: "var(--radius-md)", marginTop: 4 },
  modelText: { fontSize: "var(--fs-xs)", lineHeight: 1.9, color: "var(--text-body)", whiteSpace: "pre-line" },
};

const pad2 = (n) => String(n).padStart(2, "0");
const clock = (s) => pad2(Math.floor(s / 3600)) + ":" + pad2(Math.floor(s / 60) % 60) + ":" + pad2(s % 60);
const countWords = (t) => (t.trim() ? t.trim().split(/\s+/).length : 0);

function ChartFigure({ task }) {
  if (!task.series) {
    return (
      <div style={{ display: "grid", placeItems: "center", height: 168, border: "1px dashed var(--border-default)", borderRadius: "var(--radius-md)", color: "var(--text-subtle)", fontSize: "var(--fs-xs)", gap: 8 }}>
        <Icon name="file-text" size={20} />本题为文字题干，无图表
      </div>
    );
  }
  /* viewBox 与实际渲染宽度接近 1:1，轴标签才不会被缩到 5px */
  const w = 252, h = 150, padL = 30, padB = 20, padT = 8, padR = 6;
  const x = (i) => padL + i * (w - padL - padR) / (task.xLabels.length - 1);
  const y = (v) => padT + (1 - v / 60) * (h - padT - padB);
  return (
    <div style={{ border: "1px solid var(--border-hairline)", borderRadius: "var(--radius-md)", padding: 14, display: "grid", gap: 10 }}>
      <svg viewBox={"0 0 " + w + " " + h} preserveAspectRatio="xMidYMid meet" style={{ width: "100%", maxWidth: w, height: "auto", display: "block", margin: "0 auto" }}>
        {[0, 20, 40, 60].map((g) => (
          <g key={g}>
            <line x1={padL} x2={w - padR} y1={y(g)} y2={y(g)} stroke="var(--n-100)" strokeWidth="1" />
            <text x={padL - 6} y={y(g) + 4} textAnchor="end" fontSize="10" fill="var(--n-500)" fontFamily="IBM Plex Mono,monospace">{g}%</text>
          </g>
        ))}
        {/* 首尾标签锚定 start/end，边缘标签不依赖左右留白，任意宽度与数量都不会溢出 */}
        {task.xLabels.map((l, i) => (
          <text key={l} x={x(i)} y={h - 6}
            textAnchor={i === 0 ? "start" : i === task.xLabels.length - 1 ? "end" : "middle"}
            fontSize="10" fill="var(--n-500)" fontFamily="IBM Plex Mono,monospace">{l}</text>
        ))}
        {task.series.map((s) => (
          <g key={s.name}>
            <polyline points={s.points.map((v, i) => x(i) + "," + y(v)).join(" ")} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" />
            {s.points.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r="2.5" fill={s.color} />)}
          </g>
        ))}
      </svg>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: "var(--fs-2xs)", color: "var(--text-muted)" }}>
        {task.series.map((s) => (
          <span key={s.name} style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
            <span style={{ width: 12, height: 3, background: s.color, borderRadius: 2 }} />{s.name}
          </span>
        ))}
      </div>
    </div>
  );
}

function WritingScreen({ taskId, onBack, onFinish }) {
  const meta = window.WRITING_TASKS.find((t) => t.id === taskId) || window.WRITING_TASKS[0];
  const session = window.WRITING_SESSION[taskId] || window.WRITING_SESSION.wt1;
  const [tab, setTab] = React.useState(0);
  const [drafts, setDrafts] = React.useState({ 0: "", 1: "" });
  const [secs, setSecs] = React.useState(0);
  const [hidden, setHidden] = React.useState(false);
  /* 「先尝试、后解锁」：finished 为 true 前，范文在界面上完全不存在 */
  const [finished, setFinished] = React.useState(false);
  React.useEffect(() => { const t = setInterval(() => setSecs((s) => s + 1), 1000); return () => clearInterval(t); }, []);
  const task = session.tasks[tab];
  const words = countWords(drafts[tab] || "");
  const doneTasks = session.tasks.filter((_, i) => countWords(drafts[i] || "") > 0).length;
  const canFinish = doneTasks > 0;

  return (
    <div style={wsSt.page}>
      <div style={wsSt.bar}>
        <button type="button" style={wsSt.back} onClick={onBack}><Icon name="arrow-left" size={16} strokeWidth={2} />返回任务列表</button>
        <span style={wsSt.title}>{meta.title}</span>
        <span style={wsSt.prog}>{doneTasks}/{session.tasks.length} tasks</span>
        <span style={wsSt.timer}>{clock(secs)}</span>
      </div>

      <div style={wsSt.cols(hidden)}>
        {hidden ? null : (
          <div style={wsSt.left}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={wsSt.eyebrow}>{task.key} · {task.chartType}</span>
              <span style={{ marginLeft: "auto" }}>
                <Button size="sm" variant="ghost" icon="panel-left-close" onClick={() => setHidden(true)}>Hide Task</Button>
              </span>
            </div>
            <ChartFigure task={task} />
            <p style={{ ...wsSt.prompt, margin: 0 }}>{task.prompt}</p>
            <span style={wsSt.req}>{task.requirement}</span>
            {finished ? (
              <div style={wsSt.model}>
                <span style={wsSt.eyebrow}>参考范文 Model answer</span>
                <span style={wsSt.modelText}>{task.model}</span>
                <span style={{ fontSize: "var(--fs-2xs)", color: "var(--text-subtle)" }}>范文用于对照结构与措辞，不代表唯一写法，也不构成任何评分。</span>
              </div>
            ) : null}
          </div>
        )}

        <div style={wsSt.right}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={wsSt.eyebrow}>写作区 · {task.key}</span>
            {hidden ? <Button size="sm" variant="ghost" icon="panel-left-open" onClick={() => setHidden(false)}>Show Task</Button> : null}
            <span style={wsSt.saved}><Icon name="check" size={12} strokeWidth={2.5} />草稿已自动保存</span>
          </div>
          <textarea style={wsSt.ta} placeholder="在这里输入你的答案…" value={drafts[tab]} onChange={(e) => setDrafts({ ...drafts, [tab]: e.target.value })} />
          <div style={wsSt.count}>
            <span style={{ fontFamily: "var(--font-mono)" }}>{words} / {task.minWords} words</span>
            <span>{words >= task.minWords ? "已达到字数要求" : "还差 " + (task.minWords - words) + " 词达到字数要求"}</span>
          </div>
        </div>
      </div>

      <div style={wsSt.foot}>
        {session.tasks.map((t, i) => (
          <button key={t.key} type="button" style={wsSt.tab(tab === i)} onClick={() => setTab(i)}>
            {t.key}{countWords(drafts[i] || "") > 0 ? <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-2xs)", paddingLeft: 7, opacity: .7 }}>{countWords(drafts[i] || "")}w</span> : null}
          </button>
        ))}
        <span style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {finished ? <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-subtle)" }}>参考范文已解锁</span> : null}
          <Button disabled={!canFinish} title={canFinish ? undefined : "先写下你自己的答案"}
            onClick={() => { setFinished(true); onFinish && onFinish({ taskId, drafts, secs }); }}>完成本次练习</Button>
        </span>
      </div>
    </div>
  );
}
Object.assign(window, { WritingScreen });
