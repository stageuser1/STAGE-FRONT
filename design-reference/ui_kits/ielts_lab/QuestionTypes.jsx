const { Icon, Badge, Card } = window.STAGEDesignSystem_0f9c53;

const qtSt = {
  page: { padding: "clamp(24px,3vw,40px) clamp(20px,3.4vw,44px) 56px", display: "grid", gap: 18, maxWidth: 1000, alignContent: "start" },
  h1: { margin: 0, fontFamily: "var(--font-display)", fontWeight: "var(--fw-bold)", fontSize: "var(--fs-h2)", letterSpacing: "var(--ls-heading)", lineHeight: 1.15, color: "var(--blue-950)" },
  sub: { fontSize: "var(--fs-sm)", color: "var(--text-muted)", maxWidth: "54ch", lineHeight: 1.7 },
  cols: { display: "grid", gridTemplateColumns: "168px minmax(0,1fr)", gap: 20, alignItems: "start" },
  side: { display: "grid", gap: 3, alignContent: "start" },
  item: (on) => ({ display: "flex", alignItems: "center", gap: 9, padding: "10px 12px", borderRadius: "var(--radius-sm)", cursor: "pointer", border: "none", width: "100%", textAlign: "left", fontFamily: "var(--font-text)", fontSize: "var(--fs-sm)", fontWeight: on ? "var(--fw-semibold)" : "var(--fw-medium)", background: on ? "var(--surface-accent-soft)" : "transparent", color: on ? "var(--blue-800)" : "var(--text-muted)", whiteSpace: "nowrap" }),
  list: { display: "grid", gap: 12 },
  head: { display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" },
  zh: { fontSize: "var(--fs-body)", fontWeight: "var(--fw-semibold)", color: "var(--text-strong)", letterSpacing: "var(--ls-heading)" },
  en: { fontSize: "var(--fs-xs)", color: "var(--text-subtle)", fontFamily: "var(--font-mono)" },
  count: { marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: "var(--fs-xs)", color: "var(--text-subtle)", whiteSpace: "nowrap" },
  desc: { fontSize: "var(--fs-sm)", lineHeight: 1.8, color: "var(--text-body)", margin: 0 },
};

const qtIcons = { Reading: "book-open", Listening: "headphones", Writing: "pen-line", Speaking: "messages-square" };

function QuestionTypes({ initial }) {
  const data = window.QUESTION_TYPES;
  const skills = Object.keys(data);
  const [skill, setSkill] = React.useState(skills.includes(initial) ? initial : skills[0]);
  return (
    <div style={qtSt.page}>
      <h1 style={qtSt.h1}>题型说明</h1>
      <p style={qtSt.sub}>每种题型要求你做什么，用大白话讲一遍。这里只讲方法，不放任何真题内容或标准答案。</p>
      <div style={qtSt.cols}>
        <nav style={qtSt.side}>
          {skills.map((s) => (
            <button key={s} type="button" style={qtSt.item(s === skill)} onClick={() => setSkill(s)}>
              <span style={{ display: "grid", color: s === skill ? "var(--blue-700)" : "var(--n-400)" }}><Icon name={qtIcons[s]} size={16} /></span>
              {s}
              <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: "var(--fs-2xs)", opacity: .7 }}>{data[s].length}</span>
            </button>
          ))}
        </nav>
        <div style={qtSt.list}>
          {data[skill].map((t) => (
            <Card key={t.en} padding={18} style={{ display: "grid", gap: 9 }}>
              <div style={qtSt.head}>
                <span style={qtSt.zh}>{t.zh}</span>
                <span style={qtSt.en}>{t.en}</span>
                <span style={qtSt.count}>题库 {t.count} 题</span>
              </div>
              <p style={qtSt.desc}>{t.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
Object.assign(window, { QuestionTypes });
