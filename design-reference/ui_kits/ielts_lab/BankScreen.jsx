const { Input, Tag, Icon, Card, Badge, Button, IconButton } = window.STAGEDesignSystem_0f9c53;

const bankStyles = {
  page: { padding: "clamp(24px,3vw,40px) clamp(20px,3.4vw,44px) 56px", display: "grid", gap: 18, maxWidth: 1160, alignContent: "start" },
  h1: { margin: 0, fontFamily: "var(--font-display)", fontWeight: "var(--fw-bold)", fontSize: "var(--fs-h2)", letterSpacing: "var(--ls-heading)", lineHeight: 1.15, color: "var(--blue-950)" },
  facets: { display: "grid", gap: 12 },
  facetRow: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },
  facetLabel: { fontSize: "var(--fs-xs)", color: "var(--text-subtle)", width: 44, flex: "none" },
  list: { border: "1px solid var(--border-hairline)", borderRadius: "var(--radius-lg)", overflow: "hidden" },
  row: { display: "grid", gridTemplateColumns: "minmax(0,1.7fr) auto auto 150px 110px auto auto auto", gap: 14, alignItems: "center", padding: "14px 18px", borderBottom: "1px solid var(--border-hairline)", cursor: "pointer", background: "var(--surface-page)", transition: "background var(--dur-fast) var(--ease-standard)" },
  title: { fontSize: "var(--fs-sm)", fontWeight: "var(--fw-medium)", color: "var(--text-strong)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  zh: { fontSize: "var(--fs-2xs)", color: "var(--text-subtle)", marginTop: 2 },
  mono: { fontFamily: "var(--font-mono)", fontSize: "var(--fs-xs)" },
  dot: (c) => ({ width: 8, height: 8, borderRadius: "var(--radius-pill)", background: c, display: "inline-block", flex: "none" }),
  groups: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 12 },
  secH: { fontSize: "var(--fs-h4)", fontWeight: "var(--fw-semibold)", letterSpacing: "var(--ls-heading)", color: "var(--text-strong)" },
};

/* 状态点三色：已练习=核实绿 · 待重测=品牌蓝 · 未练习=中性（不用警示色） */
const statusDot = { "已练习": "var(--green-500)", "待重测": "var(--blue-500)", "未练习": "var(--n-300)" };
const freqs = ["高频", "次高频", "非高频"];

function Facet({ label, options, value, onChange, counts }) {
  return (
    <div style={bankStyles.facetRow}>
      <span style={bankStyles.facetLabel}>{label}</span>
      <Tag selected={value === null} onClick={() => onChange(null)}>全部</Tag>
      {options.map((o) => (
        <Tag key={o} selected={value === o} onClick={() => onChange(value === o ? null : o)}>
          {o}{counts ? <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, opacity: 0.75, marginLeft: 2 }}>{counts[o] || 0}</span> : null}
        </Tag>
      ))}
    </div>
  );
}

function BankRow({ it, onOpen, onPractice }) {
  const [hover, setHover] = React.useState(false);
  return (
    <div style={{ ...bankStyles.row, background: hover ? "var(--surface-sunken)" : "var(--surface-page)" }}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onClick={() => onOpen && onOpen(it)}>
      <span style={{ minWidth: 0 }}>
        <span style={{ ...bankStyles.title, display: "block" }}>{it.title}</span>
        <span style={{ ...bankStyles.zh, display: "block" }}>{it.zh}</span>
      </span>
      <Badge tone="neutral">{it.part}</Badge>
      <Badge tone="neutral">{it.type}</Badge>
      <span style={{ ...bankStyles.mono, color: it.mine ? "var(--text-body)" : "var(--text-subtle)" }}>我的 {it.mine || "—"}</span>
      <span style={{ ...bankStyles.mono, color: "var(--text-subtle)" }}>平均 {it.avg}</span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "var(--fs-2xs)", color: "var(--text-subtle)" }}>
        <span style={bankStyles.dot(statusDot[it.status])} />{it.status}
      </span>
      <span onClick={(e) => { e.stopPropagation(); onPractice && onPractice(it); }}>
        <Button size="sm" variant="secondary">开始练习</Button>
      </span>
      <span style={{ color: "var(--n-400)", display: "grid" }}><Icon name="chevron-right" size={16} /></span>
    </div>
  );
}

function BankScreen({ skill, onOpenReview, onPractice, onSets, onTypes }) {
  const bank = window.LAB_BANK[skill];
  const [q, setQ] = React.useState("");
  const [freq, setFreq] = React.useState(null);
  const [part, setPart] = React.useState(null);
  const [type, setType] = React.useState(null);
  const [status, setStatus] = React.useState(null);
  const freqCounts = {};
  bank.items.forEach((it) => { freqCounts[it.freq] = (freqCounts[it.freq] || 0) + 1; });
  const isWriting = skill === "Writing";
  const filter = (it) =>
    (!freq || it.freq === freq) && (!part || it.part === part) && (!type || it.type === type) &&
    (!status || it.status === status) &&
    (!q || (it.title + it.zh).toLowerCase().includes(q.toLowerCase()));
  const rows = bank.items.filter(filter);
  const task2 = isWriting ? rows.filter((it) => it.part === "Task 2") : rows;
  return (
    <div style={bankStyles.page}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <h1 style={{ ...bankStyles.h1, flex: 1 }}>{skill} 题库</h1>
        {skill === "Listening" ? <Button variant="secondary" icon="layers" onClick={onSets}>套题匹配</Button> : null}
      </div>
      <Input icon="search" placeholder="搜索题目" value={q} onChange={(e) => setQ(e.target.value)} />
      <div style={bankStyles.facets}>
        <Facet label="频次" options={freqs} value={freq} onChange={setFreq} counts={freqCounts} />
        {!isWriting ? <Facet label="Part" options={bank.parts} value={part} onChange={setPart} /> : null}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <Facet label="题型" options={bank.types} value={type} onChange={setType} />
          <span title="题型说明" onClick={onTypes} style={{ cursor: "pointer" }}>
            <IconButton icon="circle-help" label="题型说明" size="sm" onClick={onTypes} />
          </span>
        </div>
        <Facet label="状态" options={["未练习", "已练习", "待重测"]} value={status} onChange={setStatus} />
      </div>

      {isWriting ? (
        <>
          <span style={bankStyles.secH}>小作文 Task 1 · 按图型浏览</span>
          <div style={bankStyles.groups}>
            {bank.task1Groups.map((g) => (
              <Card key={g.name} interactive padding={18} style={{ display: "grid", gap: 10, justifyItems: "start" }}>
                <span style={{ width: 44, height: 44, borderRadius: "var(--radius-sm)", background: "var(--surface-accent-soft)", border: "1px solid var(--border-accent)", display: "grid", placeItems: "center", color: "var(--blue-700)" }}>
                  <Icon name={g.icon} size={21} />
                </span>
                <span style={{ fontSize: "var(--fs-body)", fontWeight: "var(--fw-semibold)", color: "var(--text-strong)" }}>{g.name}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-xs)", color: "var(--text-subtle)", whiteSpace: "nowrap" }}>{g.count} 题</span>
              </Card>
            ))}
          </div>
          <span style={bankStyles.secH}>大作文 Task 2</span>
        </>
      ) : null}

      <div style={bankStyles.list}>
        {task2.length === 0 ? (
          <div style={{ padding: "28px 18px", fontSize: "var(--fs-sm)", color: "var(--text-subtle)", textAlign: "center" }}>没有匹配的题目——调整筛选条件再试。</div>
        ) : task2.map((it, i) => (
          <div key={it.id} style={{ borderBottom: i === task2.length - 1 ? "none" : undefined }}>
            <BankRow it={it} onOpen={onOpenReview} onPractice={onPractice} />
          </div>
        ))}
      </div>
    </div>
  );
}
Object.assign(window, { BankScreen });
