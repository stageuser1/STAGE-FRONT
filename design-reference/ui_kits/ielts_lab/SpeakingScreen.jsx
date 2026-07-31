const { Button, Icon, Badge, Tag, Card, IconButton, Checkbox, Tabs } = window.STAGEDesignSystem_0f9c53;

const spSt = {
  page: { padding: "clamp(20px,2.6vw,32px) clamp(20px,3.4vw,44px) 56px", display: "grid", gap: 18, maxWidth: 1160, alignContent: "start" },
  headRow: { display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" },
  h1: { margin: 0, fontFamily: "var(--font-display)", fontWeight: "var(--fw-bold)", fontSize: "var(--fs-h2)", letterSpacing: "var(--ls-heading)", lineHeight: 1.15, color: "var(--blue-950)", flex: 1 },
  io: { display: "inline-flex", gap: 2, alignItems: "center" },
  steps: { display: "flex", alignItems: "center", gap: 0, borderBottom: "1px solid var(--border-hairline)", overflowX: "auto", scrollbarWidth: "none", msOverflowStyle: "none" },
  step: (on, done, clickable) => ({
    display: "inline-flex", alignItems: "center", gap: 7, padding: "0 clamp(7px,1vw,16px) 13px", marginBottom: -1,
    border: "none", background: "transparent", fontFamily: "var(--font-text)", whiteSpace: "nowrap",
    borderBottom: "2px solid " + (on ? "var(--action-primary)" : "transparent"),
    color: on ? "var(--text-strong)" : done ? "var(--blue-700)" : "var(--text-subtle)",
    fontSize: "var(--fs-xs)", fontWeight: on ? "var(--fw-semibold)" : "var(--fw-medium)",
    cursor: clickable ? "pointer" : "default",
  }),
  stepN: (on, done) => ({
    width: 18, height: 18, borderRadius: "var(--radius-pill)", display: "grid", placeItems: "center",
    fontFamily: "var(--font-mono)", fontSize: 10, flex: "none",
    background: done ? "var(--green-500)" : on ? "var(--action-primary)" : "var(--n-100)",
    color: done || on ? "#fff" : "var(--text-subtle)",
  }),
  arrow: { color: "var(--n-300)", padding: "0 0 13px", flex: "none", display: "grid" },
  dimGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 12 },
  dimHead: { display: "flex", alignItems: "center", gap: 8 },
  dimEn: { fontFamily: "var(--font-mono)", fontSize: "var(--fs-xs)", fontWeight: "var(--fw-medium)", color: "var(--blue-700)" },
  dimZh: { fontSize: "var(--fs-sm)", fontWeight: "var(--fw-semibold)", color: "var(--text-strong)" },
  ta: { width: "100%", boxSizing: "border-box", minHeight: 64, resize: "vertical", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", padding: "10px 12px", fontFamily: "var(--font-text)", fontSize: "var(--fs-sm)", lineHeight: 1.6, color: "var(--text-strong)", outline: "none", background: "var(--surface-page)" },
  cols: { display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.1fr)", gap: 16, alignItems: "start" },
  frag: (used) => ({ display: "flex", gap: 8, alignItems: "baseline", padding: "9px 12px", borderRadius: "var(--radius-sm)", border: "1px solid " + (used ? "var(--border-hairline)" : "var(--border-default)"), background: used ? "var(--surface-sunken)" : "var(--surface-page)", cursor: used ? "default" : "pointer", opacity: used ? 0.55 : 1, fontSize: "var(--fs-sm)", lineHeight: 1.5 }),
  draftItem: { display: "flex", gap: 8, alignItems: "baseline", padding: "8px 10px", borderRadius: "var(--radius-sm)", background: "var(--surface-accent-soft)", border: "1px solid var(--border-accent)", fontSize: "var(--fs-sm)", lineHeight: 1.5 },
  connItem: { display: "flex", gap: 8, alignItems: "center", padding: "4px 10px", borderRadius: "var(--radius-pill)", background: "var(--gold-50)", border: "1px solid var(--gold-200)", fontFamily: "var(--font-mono)", fontSize: "var(--fs-xs)", color: "var(--gold-700)", justifySelf: "start" },
  foot: { display: "flex", gap: 10, alignItems: "center", paddingTop: 6 },
  skel: { fontSize: "var(--fs-h4)", lineHeight: 2, color: "var(--text-strong)", fontWeight: "var(--fw-regular)" },
};

const spSteps = ["题目", "个人想法", "答案构建", "记忆巩固", "独立表达"];
const keyWordCount = 2;

function SpeakingScreen({ onDone }) {
  const dims = window.SP_DIMS;
  const [step, setStep] = React.useState(0);
  const [part, setPart] = React.useState("Part 2");
  const [topic, setTopic] = React.useState(null);
  const [ideas, setIdeas] = React.useState(window.SP_SEED.ideas);
  const [draft, setDraft] = React.useState([]); // {kind:'frag',dim,text} | {kind:'conn',text}
  const [hideLevel, setHideLevel] = React.useState("淡化");
  const [hints, setHints] = React.useState(true);
  const [checks, setChecks] = React.useState({});
  const fileRef = React.useRef(null);

  const filled = dims.filter(([en]) => (ideas[en] || "").trim());
  const usedFrag = (en) => draft.some((d) => d.kind === "frag" && d.dim === en);
  const maxStep = topic ? (draft.length ? 4 : 2) : 0;

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ topic, ideas, draft }, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "ielts-lab-speaking.json"; a.click();
  };
  const importJson = (e) => {
    const f = e.target.files[0]; if (!f) return;
    f.text().then((t) => { try { const j = JSON.parse(t); if (j.ideas) setIdeas(j.ideas); if (j.draft) setDraft(j.draft); if (j.topic) setTopic(j.topic); } catch (err) {} });
  };

  const topicObj = topic ? Object.values(window.SP_TOPICS).flat().find((t) => t.id === topic) : null;

  const Skeleton = () => (
    <p style={spSt.skel}>
      {draft.map((d, i) => {
        if (d.kind === "conn") return <span key={i} style={{ color: "var(--gold-700)", fontFamily: "var(--font-mono)", fontSize: "var(--fs-body)", padding: "0 6px" }}>{d.text}</span>;
        const words = d.text.split(" ");
        const head = words.slice(0, keyWordCount).join(" ");
        const rest = words.slice(keyWordCount).join(" ");
        return (
          <span key={i} style={{ paddingRight: 8 }}>
            <span style={{ fontWeight: "var(--fw-semibold)" }}>{head}</span>{" "}
            {hideLevel === "淡化" ? <span style={{ color: "var(--n-300)" }}>{rest}</span>
              : hideLevel === "隐藏" ? <span style={{ color: "transparent", borderBottom: "1px dashed var(--n-300)" }}>{rest}</span>
              : null}
          </span>
        );
      })}
    </p>
  );

  return (
    <div style={spSt.page}>
      <div style={spSt.headRow}>
        <h1 style={spSt.h1}>Speaking</h1>
        <span style={spSt.io}>
          <IconButton icon="download" label="导出数据（JSON）" size="sm" onClick={exportJson} />
          <IconButton icon="upload" label="导入数据（JSON）" size="sm" onClick={() => fileRef.current && fileRef.current.click()} />
          <input ref={fileRef} type="file" accept=".json" onChange={importJson} style={{ display: "none" }} />
        </span>
      </div>
      <div style={spSt.steps}>
        {spSteps.map((s, i) => (
          <React.Fragment key={s}>
            {i ? <span style={spSt.arrow}><Icon name="chevron-right" size={14} /></span> : null}
            <button type="button" style={spSt.step(step === i, i < step, i <= maxStep)} onClick={() => i <= maxStep && setStep(i)}>
              <span style={spSt.stepN(step === i, i < step)}>{i < step ? "✓" : i + 1}</span>{s}
            </button>
          </React.Fragment>
        ))}
      </div>

      {step === 0 ? (
        <>
          <span style={{ width: 260 }}><Tabs variant="pill" items={Object.keys(window.SP_TOPICS)} value={part} onChange={setPart} /></span>
          <div style={spSt.dimGrid}>
            {window.SP_TOPICS[part].map((t) => (
              <Card key={t.id} interactive padding={18} onClick={() => { setTopic(t.id); setStep(1); }} style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: "var(--fs-sm)", fontWeight: "var(--fw-semibold)", color: "var(--text-strong)", lineHeight: 1.5 }}>{t.en}</span>
                <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-subtle)" }}>{t.zh}</span>
                <span style={{ fontSize: "var(--fs-xs)", fontWeight: "var(--fw-semibold)", color: "var(--blue-700)", marginTop: 4 }}>选择此题 →</span>
              </Card>
            ))}
          </div>
        </>
      ) : null}

      {step >= 1 && topicObj ? (
        <div style={{ display: "flex", gap: 10, alignItems: "baseline", flexWrap: "wrap" }}>
          <Badge tone="brand">{Object.keys(window.SP_TOPICS).find((p) => window.SP_TOPICS[p].some((t) => t.id === topic))}</Badge>
          <span style={{ fontSize: "var(--fs-body)", fontWeight: "var(--fw-semibold)", color: "var(--text-strong)" }}>{topicObj.en}</span>
          <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-subtle)" }}>{topicObj.zh}</span>
          <span style={{ marginLeft: "auto", fontSize: "var(--fs-xs)", color: "var(--text-subtle)", display: "inline-flex", gap: 5, alignItems: "center" }}><Icon name="check" size={12} strokeWidth={2.5} />已自动保存</span>
        </div>
      ) : null}

      {step === 1 ? (
        <>
          <div style={spSt.dimGrid}>
            {dims.map(([en, zh]) => {
              const done = (ideas[en] || "").trim();
              return (
                <Card key={en} padding={16} style={{ display: "grid", gap: 10 }}>
                  <div style={spSt.dimHead}>
                    <span style={spSt.dimEn}>{en}</span>
                    <span style={spSt.dimZh}>{zh}</span>
                    {done ? <span style={{ marginLeft: "auto", color: "var(--green-600)", display: "grid" }}><Icon name="check" size={15} strokeWidth={2.5} /></span> : null}
                  </div>
                  <textarea style={spSt.ta} placeholder="写下你自己的想法片段…" value={ideas[en] || ""} onChange={(e) => setIdeas({ ...ideas, [en]: e.target.value })} />
                </Card>
              );
            })}
          </div>
          <div style={spSt.foot}>
            <Button onClick={() => setStep(2)} disabled={filled.length === 0}>进入答案构建</Button>
            <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-subtle)" }}>已填 {filled.length} / 9 个维度</span>
          </div>
        </>
      ) : null}

      {step === 2 ? (
        <>
          <div style={spSt.cols}>
            <div style={{ display: "grid", gap: 10, alignContent: "start" }}>
              <span style={{ fontSize: "var(--fs-2xs)", letterSpacing: "var(--ls-eyebrow)", textTransform: "uppercase", color: "var(--text-subtle)", fontWeight: "var(--fw-semibold)" }}>我的想法片段 · 点击加入右栏</span>
              {filled.map(([en, zh]) => (
                <div key={en} style={spSt.frag(usedFrag(en))} draggable={!usedFrag(en)}
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", en)}
                  onClick={() => !usedFrag(en) && setDraft([...draft, { kind: "frag", dim: en, text: ideas[en] }])}>
                  <span style={{ ...spSt.dimEn, flex: "none" }}>{en}</span>
                  <span style={{ color: "var(--text-body)" }}>{ideas[en]}</span>
                  {!usedFrag(en) ? <span style={{ marginLeft: "auto", color: "var(--blue-700)", display: "grid", alignSelf: "center" }}><Icon name="plus" size={14} /></span> : null}
                </div>
              ))}
              <span style={{ fontSize: "var(--fs-2xs)", letterSpacing: "var(--ls-eyebrow)", textTransform: "uppercase", color: "var(--text-subtle)", fontWeight: "var(--fw-semibold)", marginTop: 8 }}>连接词</span>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {window.SP_CONNECTORS.map((c) => <Tag key={c} onClick={() => setDraft([...draft, { kind: "conn", text: c }])} style={{ height: 28, fontSize: "var(--fs-2xs)", padding: "0 10px", fontFamily: "var(--font-mono)" }}>{c}</Tag>)}
              </div>
            </div>
            <Card padding={16} style={{ display: "grid", gap: 8, alignContent: "start", minHeight: 280 }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const en = e.dataTransfer.getData("text/plain"); if (en && ideas[en] && !usedFrag(en)) setDraft([...draft, { kind: "frag", dim: en, text: ideas[en] }]); }}>
              <span style={{ fontSize: "var(--fs-2xs)", letterSpacing: "var(--ls-eyebrow)", textTransform: "uppercase", color: "var(--text-subtle)", fontWeight: "var(--fw-semibold)" }}>答案草稿 · 只能由左栏片段组织而成</span>
              {draft.length === 0 ? <span style={{ fontSize: "var(--fs-sm)", color: "var(--text-subtle)", padding: "24px 0", textAlign: "center" }}>从左栏点选或拖入片段与连接词，按你要说的顺序拼装。</span> :
                draft.map((d, i) => (
                  <div key={i} style={d.kind === "conn" ? spSt.connItem : spSt.draftItem}>
                    {d.kind === "frag" ? <span style={{ ...spSt.dimEn, flex: "none" }}>{d.dim}</span> : null}
                    <span style={{ flex: 1 }}>{d.text}</span>
                    <span style={{ cursor: "pointer", color: "var(--text-subtle)", display: "grid", alignSelf: "center" }} onClick={() => setDraft(draft.filter((_, j) => j !== i))}><Icon name="x" size={13} /></span>
                  </div>
                ))}
            </Card>
          </div>
          <div style={spSt.foot}>
            <Button onClick={() => setStep(3)} disabled={draft.filter((d) => d.kind === "frag").length === 0}>进入记忆巩固</Button>
            <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-subtle)" }}>没有 AI 生成——答案只来自你自己的片段。</span>
          </div>
        </>
      ) : null}

      {step === 3 ? (
        <>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-subtle)" }}>隐藏程度：</span>
            {["全文", "淡化", "隐藏", "仅连接词"].map((l) => <Tag key={l} selected={hideLevel === l} onClick={() => setHideLevel(l)} style={{ height: 30, whiteSpace: "nowrap" }}>{l}</Tag>)}
          </div>
          <Card padding={26}>
            {hideLevel === "仅连接词" ? (
              <p style={spSt.skel}>{draft.map((d, i) => d.kind === "conn" ? <span key={i} style={{ color: "var(--gold-700)", fontFamily: "var(--font-mono)", padding: "0 6px" }}>{d.text}</span> : <span key={i} style={{ color: "transparent", borderBottom: "1px dashed var(--n-300)", marginRight: 8 }}>{d.text}</span>)}</p>
            ) : hideLevel === "全文" ? (
              <p style={spSt.skel}>{draft.map((d, i) => <span key={i} style={{ paddingRight: 8, color: d.kind === "conn" ? "var(--gold-700)" : "var(--text-strong)", fontFamily: d.kind === "conn" ? "var(--font-mono)" : "inherit" }}>{d.text}</span>)}</p>
            ) : <Skeleton />}
          </Card>
          <div style={spSt.foot}>
            <Button onClick={() => setStep(4)}>进入独立表达</Button>
            <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-subtle)" }}>连接词与你的核心词保留，其余逐级隐去。</span>
          </div>
        </>
      ) : null}

      {step === 4 ? (
        <>
          {hints ? (
            <Card padding={16} style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <span style={{ fontSize: "var(--fs-sm)", color: "var(--text-body)", flex: 1 }}>
                {draft.filter((d) => d.kind === "frag").map((d) => d.text.split(" ").slice(0, keyWordCount).join(" ")).join(" · ")}
              </span>
              <IconButton icon="x" label="关闭提示" size="sm" onClick={() => setHints(false)} />
            </Card>
          ) : null}
          <Card padding={20} style={{ display: "grid", gap: 12 }}>
            <span style={{ fontSize: "var(--fs-sm)", fontWeight: "var(--fw-semibold)", color: "var(--text-strong)" }}>自查清单 · 我的表达覆盖了哪些维度</span>
            {filled.map(([en, zh]) => (
              <Checkbox key={en} label={en + " " + zh} checked={!!checks[en]} onChange={(v) => setChecks({ ...checks, [en]: v })} />
            ))}
          </Card>
          <div style={spSt.foot}>
            <Button onClick={() => onDone(topicObj)}>完成独立表达</Button>
            <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-subtle)" }}>无录音、无计分——完成后记录一次「独立表达」事件。</span>
          </div>
        </>
      ) : null}
    </div>
  );
}
Object.assign(window, { SpeakingScreen });
