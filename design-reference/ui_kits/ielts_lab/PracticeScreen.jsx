const { Button, Icon, IconButton, Badge, Dialog, Card } = window.STAGEDesignSystem_0f9c53;

const prSt = {
  page: { display: "grid", gridTemplateRows: "auto 1fr auto", height: "100vh", minWidth: 0 },
  bar: { display: "flex", alignItems: "center", gap: 18, padding: "12px clamp(16px,2.4vw,28px)", borderBottom: "1px solid var(--border-hairline)", flexWrap: "wrap" },
  title: { fontSize: "var(--fs-body)", fontWeight: "var(--fw-semibold)", color: "var(--text-strong)", lineHeight: 1.35 },
  zh: { fontSize: "var(--fs-xs)", color: "var(--text-muted)" },
  meta: { fontSize: "var(--fs-xs)", color: "var(--text-subtle)", marginTop: 3 },
  /* 正计时：中性灰，永不变色、不倒计时、不显示剩余时间 */
  timer: { fontFamily: "var(--font-mono)", fontSize: "var(--fs-h4)", color: "var(--text-muted)", fontVariantNumeric: "tabular-nums", letterSpacing: ".04em" },
  saved: { display: "inline-flex", alignItems: "center", gap: 5, fontSize: "var(--fs-xs)", color: "var(--text-subtle)" },
  cols: { display: "grid", gridTemplateColumns: "minmax(0,1.05fr) minmax(0,1fr)", minHeight: 0 },
  left: { overflowY: "auto", padding: "22px clamp(18px,2.4vw,30px) 40px", borderRight: "1px solid var(--border-hairline)" },
  right: { overflowY: "auto", padding: "22px clamp(18px,2.4vw,30px) 40px", display: "grid", gap: 14, alignContent: "start" },
  pTag: { fontFamily: "var(--font-mono)", fontSize: "var(--fs-xs)", fontWeight: "var(--fw-medium)", color: "var(--blue-700)" },
  para: { fontSize: "var(--fs-sm)", lineHeight: 1.9, color: "var(--text-body)" },
  transBtn: { display: "inline-flex", alignItems: "center", gap: 5, marginTop: 8, border: "none", background: "transparent", padding: 0, cursor: "pointer", fontFamily: "var(--font-text)", fontSize: "var(--fs-xs)", fontWeight: "var(--fw-medium)", color: "var(--blue-700)" },
  trans: { marginTop: 8, padding: "12px 14px", background: "var(--surface-sunken)", borderRadius: "var(--radius-sm)", fontSize: "var(--fs-xs)", lineHeight: 1.85, color: "var(--text-muted)" },
  qCard: (cur) => ({ border: "1px solid " + (cur ? "var(--border-accent)" : "var(--border-hairline)"), borderRadius: "var(--radius-md)", padding: 16, display: "grid", gap: 11, scrollMarginTop: 12 }),
  qHead: { display: "flex", gap: 10, alignItems: "flex-start" },
  dot: (answered) => ({ width: 11, height: 11, borderRadius: "var(--radius-pill)", flex: "none", marginTop: 5, background: answered ? "var(--blue-600)" : "transparent", border: answered ? "none" : "1px solid var(--n-400)" }),
  qn: { fontFamily: "var(--font-mono)", fontSize: "var(--fs-xs)", fontWeight: "var(--fw-medium)", color: "var(--text-strong)", flex: "none" },
  stem: { fontSize: "var(--fs-sm)", lineHeight: 1.65, color: "var(--text-body)", flex: 1 },
  opt: (on) => ({ display: "flex", alignItems: "center", gap: 9, padding: "9px 12px", borderRadius: "var(--radius-sm)", cursor: "pointer", fontSize: "var(--fs-sm)", border: "1px solid " + (on ? "var(--action-primary)" : "var(--border-hairline)"), background: on ? "var(--surface-accent-soft)" : "var(--surface-page)", color: on ? "var(--blue-800)" : "var(--text-body)", fontWeight: on ? "var(--fw-medium)" : "var(--fw-regular)" }),
  input: { border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", padding: "9px 12px", fontFamily: "var(--font-mono)", fontSize: "var(--fs-sm)", color: "var(--text-strong)", outline: "none", width: "100%", boxSizing: "border-box" },
  exp: { display: "grid", gap: 8, padding: "13px 14px", background: "var(--surface-sunken)", borderRadius: "var(--radius-sm)", borderTop: "1px solid var(--border-hairline)" },
  expK: { fontSize: "var(--fs-2xs)", letterSpacing: "var(--ls-eyebrow)", textTransform: "uppercase", color: "var(--text-subtle)", fontWeight: "var(--fw-semibold)" },
  expV: { fontSize: "var(--fs-xs)", lineHeight: 1.8, color: "var(--text-body)" },
  locate: { display: "inline-flex", alignItems: "center", gap: 5, border: "none", background: "transparent", padding: 0, cursor: "pointer", fontFamily: "var(--font-text)", fontSize: "var(--fs-xs)", fontWeight: "var(--fw-semibold)", color: "var(--blue-700)", justifySelf: "start" },
  foot: { display: "flex", alignItems: "center", gap: 16, padding: "12px clamp(16px,2.4vw,28px)", borderTop: "1px solid var(--border-hairline)", background: "var(--surface-page)", flexWrap: "wrap" },
  nums: { display: "flex", gap: 6, flexWrap: "wrap", flex: 1, minWidth: 200 },
  num: (state) => ({
    width: 32, height: 32, borderRadius: "var(--radius-xs)", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: "var(--fs-xs)",
    display: "grid", placeItems: "center", background: state.answered ? "var(--blue-100)" : "var(--surface-page)",
    color: state.answered ? "var(--blue-800)" : "var(--text-muted)",
    border: state.current ? "2px solid var(--action-primary)" : "1px solid var(--border-default)",
    fontWeight: state.current ? "var(--fw-semibold)" : "var(--fw-regular)",
  }),
  progress: { fontSize: "var(--fs-sm)", color: "var(--text-body)", whiteSpace: "nowrap" },
  pdfWrap: { display: "grid", gap: 16, maxWidth: 620, margin: "0 auto", padding: "8px 0 40px" },
  pdfSheet: { background: "var(--surface-page)", border: "1px solid var(--border-default)", boxShadow: "var(--shadow-md)", padding: "44px 46px", display: "grid", gap: 16 },
};

const pad2 = (n) => String(n).padStart(2, "0");
const fmt = (s) => pad2(Math.floor(s / 3600)) + ":" + pad2(Math.floor(s / 60) % 60) + ":" + pad2(s % 60);

function PracticeScreen({ id, onExit, onSubmit }) {
  const p = window.PRACTICE[id];
  const [answers, setAnswers] = React.useState({});
  const [cur, setCur] = React.useState(1);
  const [open, setOpen] = React.useState({});
  const [secs, setSecs] = React.useState(0);
  const [confirm, setConfirm] = React.useState(false);
  const [exitAsk, setExitAsk] = React.useState(false);
  const [pdf, setPdf] = React.useState(false);
  const [review, setReview] = React.useState(false);
  const qRefs = React.useRef({});
  const paraRefs = React.useRef({});
  const leftRef = React.useRef(null);
  const rightRef = React.useRef(null);
  const [hlPara, setHlPara] = React.useState(null);

  React.useEffect(() => { const t = setInterval(() => setSecs((s) => s + 1), 1000); return () => clearInterval(t); }, []);

  const answered = (n) => answers[n] !== undefined && String(answers[n]).trim() !== "";
  const doneCount = p.questions.filter((q) => answered(q.n)).length;
  const unanswered = p.questions.length - doneCount;
  /* 回顾模式只在整套题全部作答后才可用——它不是绕过「已作答才解锁讲解」的开关。 */
  const reviewAllowed = unanswered === 0;
  React.useEffect(() => { if (!reviewAllowed && review) setReview(false); }, [reviewAllowed, review]);

  const jump = (n) => {
    setCur(n);
    const el = qRefs.current[n];
    if (el && rightRef.current) rightRef.current.scrollTo({ top: el.offsetTop - 12, behavior: "smooth" });
  };
  const locate = (tag) => {
    setHlPara(tag);
    const el = paraRefs.current[tag];
    if (el && leftRef.current) leftRef.current.scrollTo({ top: el.offsetTop - 20, behavior: "smooth" });
  };

  return (
    <div style={prSt.page}>
      <div style={prSt.bar}>
        <span style={{ minWidth: 200, flex: 1 }}>
          <span style={{ ...prSt.title, display: "block" }}>{p.title}</span>
          <span style={{ ...prSt.zh, display: "block" }}>{p.zh}</span>
          <span style={{ ...prSt.meta, display: "block" }}>Part {p.part} · {p.questions.length}题 · {p.freq}</span>
        </span>
        <span style={prSt.timer}>{fmt(secs)}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 14, marginLeft: "auto" }}>
          <span style={prSt.saved}><Icon name="check" size={12} strokeWidth={2.5} />已自动保存</span>
          <Button size="sm" variant="secondary" onClick={() => setExitAsk(true)}>Exit</Button>
        </span>
      </div>

      <div style={prSt.cols}>
        <div ref={leftRef} style={prSt.left}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 14, flexWrap: "wrap" }}>
            <span style={{ fontSize: "var(--fs-2xs)", letterSpacing: "var(--ls-eyebrow)", textTransform: "uppercase", color: "var(--text-subtle)", fontWeight: "var(--fw-semibold)" }}>Reading Passage {p.part}</span>
            <Button size="sm" variant={pdf ? "primary" : "ghost"} icon="file-text" onClick={() => setPdf(!pdf)}>查看 PDF</Button>
          </div>
          {pdf ? (
            <div style={prSt.pdfWrap}>
              <div style={prSt.pdfSheet}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-subtle)", letterSpacing: ".1em" }}>READING PASSAGE {p.part}</span>
                <span style={{ fontSize: 19, fontWeight: "var(--fw-bold)", color: "var(--text-strong)", lineHeight: 1.35 }}>{p.title}</span>
                <span style={{ fontSize: 13, fontStyle: "italic", color: "var(--text-muted)", lineHeight: 1.7 }}>{p.instruction}</span>
                {p.paragraphs.map((g) => (
                  <p key={g.tag} style={{ margin: 0, fontSize: 13.5, lineHeight: 1.95, color: "var(--text-body)", textAlign: "justify" }}>
                    <span style={{ fontWeight: "var(--fw-bold)", paddingRight: 8 }}>{g.tag}</span>{g.en}
                  </p>
                ))}
              </div>
            </div>
          ) : (
            <>
              <p style={{ margin: "0 0 20px", fontSize: "var(--fs-xs)", fontStyle: "italic", lineHeight: 1.75, color: "var(--text-muted)" }}>{p.instruction}</p>
              <div style={{ display: "grid", gap: 22 }}>
                {p.paragraphs.map((g) => (
                  <div key={g.tag} ref={(el) => { paraRefs.current[g.tag] = el; }} style={{ background: hlPara === g.tag ? "var(--gold-50)" : "transparent", borderRadius: "var(--radius-sm)", padding: hlPara === g.tag ? "10px 12px" : "0", margin: hlPara === g.tag ? "-10px -12px" : 0, transition: "background var(--dur-slow) var(--ease-standard)" }}>
                    <div style={{ display: "flex", gap: 12 }}>
                      <span style={{ ...prSt.pTag, flex: "none", paddingTop: 3 }}>Paragraph {g.tag}</span>
                    </div>
                    <p style={{ ...prSt.para, margin: "6px 0 0" }}>{g.en}</p>
                    <button type="button" style={prSt.transBtn} onClick={() => setOpen({ ...open, ["p" + g.tag]: !open["p" + g.tag] })}>
                      <Icon name={open["p" + g.tag] ? "chevron-down" : "chevron-right"} size={13} />中文对照
                    </button>
                    {open["p" + g.tag] ? <div style={prSt.trans}>{g.zh}</div> : null}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div ref={rightRef} style={prSt.right}>
          {p.questions.map((q) => {
            const a = answers[q.n];
            const isAnswered = answered(q.n);
            /* 红线：讲解卡片以「已作答」为唯一展开条件。回顾模式不得绕过它。 */
            const canExplain = isAnswered;
            return (
              <div key={q.n} ref={(el) => { qRefs.current[q.n] = el; }} style={prSt.qCard(cur === q.n)} onClick={() => setCur(q.n)}>
                <div style={prSt.qHead}>
                  <span style={prSt.dot(isAnswered)} />
                  <span style={prSt.qn}>{q.n}</span>
                  <span style={prSt.stem}>{q.stem}</span>
                  <Badge tone="neutral">{q.type}</Badge>
                </div>
                {q.options ? (
                  <div style={{ display: "grid", gap: 7 }}>
                    {q.options.map((o) => (
                      <div key={o} style={prSt.opt(a === o)} onClick={() => setAnswers({ ...answers, [q.n]: o })}>
                        <span style={{ width: 15, height: 15, borderRadius: "var(--radius-pill)", flex: "none", border: "1px solid " + (a === o ? "var(--action-primary)" : "var(--border-default)"), display: "grid", placeItems: "center" }}>
                          {a === o ? <span style={{ width: 7, height: 7, borderRadius: "var(--radius-pill)", background: "var(--action-primary)" }} /> : null}
                        </span>
                        {o}
                      </div>
                    ))}
                  </div>
                ) : (
                  <input style={prSt.input} placeholder="填写答案" value={a || ""} onChange={(e) => setAnswers({ ...answers, [q.n]: e.target.value })} />
                )}
                {canExplain ? (
                  <div style={prSt.exp}>
                    <span style={prSt.expK}>题目翻译</span>
                    <span style={prSt.expV}>{q.zh}</span>
                    <span style={prSt.expK}>正确答案</span>
                    <span style={{ ...prSt.expV, fontFamily: "var(--font-mono)", color: "var(--green-700)", fontWeight: "var(--fw-medium)" }}>{q.answer}</span>
                    <span style={prSt.expK}>解析</span>
                    <span style={prSt.expV}>{q.explain}</span>
                    <button type="button" style={prSt.locate} onClick={() => locate(q.ref)}>
                      <Icon name="link" size={13} />定位原文 · Paragraph {q.ref}
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div style={prSt.foot}>
        <div style={prSt.nums}>
          {p.questions.map((q) => (
            <button key={q.n} type="button" style={prSt.num({ answered: answered(q.n), current: cur === q.n })} onClick={() => jump(q.n)}>{q.n}</button>
          ))}
        </div>
        <span style={prSt.progress}>已完成 {doneCount}/{p.questions.length} 题</span>
        <Button onClick={() => unanswered > 0 ? setConfirm(true) : onSubmit({ answers, secs })}>交卷</Button>
        <Button variant={review ? "primary" : "ghost"} icon="eye" disabled={!reviewAllowed}
          title={reviewAllowed ? "逐题浏览整套题" : "全部作答后可用"}
          onClick={() => { const on = !review; setReview(on); if (on) jump(1); }}>回顾模式</Button>
      </div>

      <Dialog open={confirm} title={"还有 " + unanswered + " 题未作答，确定交卷？"} onClose={() => setConfirm(false)}
        footer={<>
          <Button variant="secondary" onClick={() => setConfirm(false)}>继续作答</Button>
          <Button onClick={() => { setConfirm(false); onSubmit({ answers, secs }); }}>确认交卷</Button>
        </>} />
      <Dialog open={exitAsk} title="退出本次练习？" description="当前作答已自动保存，下次可以从这里继续。" onClose={() => setExitAsk(false)}
        footer={<>
          <Button variant="secondary" onClick={() => setExitAsk(false)}>继续作答</Button>
          <Button onClick={onExit}>确认退出</Button>
        </>} />
    </div>
  );
}
Object.assign(window, { PracticeScreen });
