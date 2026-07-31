const { Button, Icon, IconButton, Badge, Dialog, Select } = window.STAGEDesignSystem_0f9c53;

const lpSt = {
  page: { display: "grid", gridTemplateRows: "auto auto 1fr auto", height: "100vh", minWidth: 0 },
  bar: { display: "flex", alignItems: "center", gap: 18, padding: "12px clamp(16px,2.4vw,28px)", borderBottom: "1px solid var(--border-hairline)", flexWrap: "wrap" },
  title: { fontSize: "var(--fs-body)", fontWeight: "var(--fw-semibold)", color: "var(--text-strong)", lineHeight: 1.35 },
  meta: { fontSize: "var(--fs-xs)", color: "var(--text-subtle)", marginTop: 3 },
  setNote: { display: "flex", alignItems: "center", gap: 8, padding: "9px clamp(16px,2.4vw,28px)", background: "var(--surface-accent-soft)", borderBottom: "1px solid var(--border-accent)", fontSize: "var(--fs-xs)", color: "var(--blue-800)" },
  player: { display: "flex", alignItems: "center", gap: 18, padding: "16px clamp(16px,2.4vw,28px)", borderBottom: "1px solid var(--border-hairline)", flexWrap: "wrap" },
  play: { width: 52, height: 52, borderRadius: "var(--radius-pill)", border: "none", cursor: "pointer", background: "var(--action-primary)", color: "var(--n-0)", display: "grid", placeItems: "center", flex: "none" },
  track: { flex: 1, minWidth: 200, display: "grid", gap: 7 },
  rail: { height: 6, borderRadius: "var(--radius-pill)", background: "var(--n-100)", cursor: "pointer", position: "relative", overflow: "hidden" },
  railFill: { height: "100%", background: "var(--blue-600)", borderRadius: "var(--radius-pill)" },
  time: { fontFamily: "var(--font-mono)", fontSize: "var(--fs-xs)", color: "var(--text-muted)", display: "flex", justifyContent: "space-between" },
  body: { overflowY: "auto", padding: "22px clamp(18px,3vw,40px) 40px" },
  wrap: { maxWidth: 760, margin: "0 auto", display: "grid", gap: 18 },
  formCard: { border: "1px solid var(--border-hairline)", borderRadius: "var(--radius-md)", overflow: "hidden" },
  formHead: { padding: "14px 18px", borderBottom: "1px solid var(--border-hairline)", background: "var(--surface-sunken)", display: "grid", gap: 4 },
  formTitle: { fontSize: "var(--fs-body)", fontWeight: "var(--fw-bold)", color: "var(--text-strong)", letterSpacing: "var(--ls-heading)", textAlign: "center" },
  formNote: { fontSize: "var(--fs-xs)", fontStyle: "italic", color: "var(--text-muted)", textAlign: "center" },
  formRow: { display: "grid", gridTemplateColumns: "150px 1fr", gap: 16, alignItems: "center", padding: "12px 18px", borderBottom: "1px solid var(--border-hairline)" },
  formLabel: { fontSize: "var(--fs-sm)", color: "var(--text-muted)" },
  inline: { display: "flex", alignItems: "center", gap: 8, fontSize: "var(--fs-sm)", color: "var(--text-body)", flexWrap: "wrap" },
  blank: (on) => ({ width: 128, border: "none", borderBottom: "1.5px solid " + (on ? "var(--action-primary)" : "var(--border-strong)"), padding: "3px 4px", fontFamily: "var(--font-mono)", fontSize: "var(--fs-sm)", color: "var(--text-strong)", outline: "none", background: "transparent" }),
  qn: { fontFamily: "var(--font-mono)", fontSize: "var(--fs-2xs)", color: "var(--n-0)", background: "var(--n-400)", borderRadius: "var(--radius-xs)", padding: "1px 6px", flex: "none" },
  qCard: (cur) => ({ border: "1px solid " + (cur ? "var(--border-accent)" : "var(--border-hairline)"), borderRadius: "var(--radius-md)", padding: 16, display: "grid", gap: 11, scrollMarginTop: 12 }),
  qHead: { display: "flex", gap: 10, alignItems: "flex-start" },
  dot: (a) => ({ width: 11, height: 11, borderRadius: "var(--radius-pill)", flex: "none", marginTop: 5, background: a ? "var(--blue-600)" : "transparent", border: a ? "none" : "1px solid var(--n-400)" }),
  stem: { fontSize: "var(--fs-sm)", lineHeight: 1.65, color: "var(--text-body)", flex: 1 },
  opt: (on) => ({ display: "flex", alignItems: "center", gap: 9, padding: "9px 12px", borderRadius: "var(--radius-sm)", cursor: "pointer", fontSize: "var(--fs-sm)", border: "1px solid " + (on ? "var(--action-primary)" : "var(--border-hairline)"), background: on ? "var(--surface-accent-soft)" : "var(--surface-page)", color: on ? "var(--blue-800)" : "var(--text-body)" }),
  mapBox: { display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8 },
  mapCell: (on) => ({ display: "grid", placeItems: "center", height: 44, borderRadius: "var(--radius-sm)", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: "var(--fs-sm)", border: "1px solid " + (on ? "var(--action-primary)" : "var(--border-default)"), background: on ? "var(--surface-accent-soft)" : "var(--surface-page)", color: on ? "var(--blue-800)" : "var(--text-muted)" }),
  foot: { display: "flex", alignItems: "center", gap: 14, padding: "12px clamp(16px,2.4vw,28px)", borderTop: "1px solid var(--border-hairline)", flexWrap: "wrap" },
  nums: { display: "flex", gap: 6, flexWrap: "wrap", minWidth: 160 },
  num: (s) => ({ width: 32, height: 32, borderRadius: "var(--radius-xs)", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: "var(--fs-xs)", display: "grid", placeItems: "center", background: s.answered ? "var(--blue-100)" : "var(--surface-page)", color: s.answered ? "var(--blue-800)" : "var(--text-muted)", border: s.current ? "2px solid var(--action-primary)" : "1px solid var(--border-default)", fontWeight: s.current ? "var(--fw-semibold)" : "var(--fw-regular)" }),
  timer: { fontFamily: "var(--font-mono)", fontSize: "var(--fs-h4)", color: "var(--text-muted)", fontVariantNumeric: "tabular-nums", letterSpacing: ".04em" },
  exp: { display: "grid", gap: 8, padding: "13px 14px", marginTop: 10, background: "var(--surface-sunken)", borderRadius: "var(--radius-sm)" },
  expK: { fontSize: "var(--fs-2xs)", letterSpacing: "var(--ls-eyebrow)", textTransform: "uppercase", color: "var(--text-subtle)", fontWeight: "var(--fw-semibold)" },
  expV: { fontSize: "var(--fs-xs)", lineHeight: 1.8, color: "var(--text-body)" },
};

function Explain({ q }) {
  if (!q) return null;
  return (
    <div style={lpSt.exp}>
      <span style={lpSt.expK}>题目翻译</span>
      <span style={lpSt.expV}>{q.zh}</span>
      <span style={lpSt.expK}>正确答案</span>
      <span style={{ ...lpSt.expV, fontFamily: "var(--font-mono)", color: "var(--green-700)", fontWeight: "var(--fw-medium)" }}>{Array.isArray(q.answer) ? q.answer.join(" · ") : q.answer}</span>
      <span style={lpSt.expK}>解析</span>
      <span style={lpSt.expV}>{q.explain}</span>
      {q.cue ? <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: "var(--fs-xs)", fontWeight: "var(--fw-semibold)", color: "var(--blue-700)" }}><Icon name="clock" size={13} />音频定位 {q.cue}</span> : null}
    </div>
  );
}

const pad2 = (n) => String(n).padStart(2, "0");
const clock = (s) => pad2(Math.floor(s / 3600)) + ":" + pad2(Math.floor(s / 60) % 60) + ":" + pad2(s % 60);
const mmss = (s) => Math.floor(s / 60) + ":" + pad2(Math.round(s) % 60);

function ListeningPractice({ id, setMode, onBank, onSubmit }) {
  const p = window.LISTENING[id];
  const [answers, setAnswers] = React.useState({});
  const [cur, setCur] = React.useState(1);
  const [secs, setSecs] = React.useState(0);
  const [pos, setPos] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);
  const [rate, setRate] = React.useState("1.0x");
  const [confirm, setConfirm] = React.useState(false);
  const [review, setReview] = React.useState(false);
  const qRefs = React.useRef({});
  const bodyRef = React.useRef(null);

  React.useEffect(() => { const t = setInterval(() => setSecs((s) => s + 1), 1000); return () => clearInterval(t); }, []);
  React.useEffect(() => {
    if (!playing) return;
    const mult = parseFloat(rate);
    const t = setInterval(() => setPos((v) => Math.min(v + mult, p.duration)), 1000);
    return () => clearInterval(t);
  }, [playing, rate, p.duration]);

  const answered = (n) => { const v = answers[n]; return Array.isArray(v) ? v.length > 0 : v !== undefined && String(v).trim() !== ""; };
  const doneCount = p.questions.filter((q) => answered(q.n)).length;
  const unanswered = p.questions.length - doneCount;
  /* 回顾模式仅在整套题全部作答后可用；它不解锁讲解，红线仍是「已作答」。 */
  const reviewAllowed = unanswered === 0;
  React.useEffect(() => { if (!reviewAllowed && review) setReview(false); }, [reviewAllowed, review]);
  const set = (n, v) => setAnswers((a) => ({ ...a, [n]: v }));
  /* 多选：数组语义，最多选 q.multi 项 */
  const toggleMulti = (q, o) => setAnswers((a) => {
    const cur = Array.isArray(a[q.n]) ? a[q.n] : [];
    if (cur.includes(o)) return { ...a, [q.n]: cur.filter((x) => x !== o) };
    if (cur.length >= q.multi) return a;
    return { ...a, [q.n]: [...cur, o] };
  });
  const jump = (n) => {
    setCur(n);
    const el = qRefs.current[n];
    if (el && bodyRef.current) bodyRef.current.scrollTo({ top: el.offsetTop - 12, behavior: "smooth" });
  };
  const formQs = p.form ? p.form.rows.map((r) => r.n) : [];
  const restQs = p.questions.filter((q) => !formQs.includes(q.n));

  return (
    <div style={lpSt.page}>
      <div style={lpSt.bar}>
        <span style={{ minWidth: 220, flex: 1 }}>
          <span style={{ ...lpSt.title, display: "block" }}>{p.code}. {p.title}</span>
          <span style={{ ...lpSt.meta, display: "block" }}>Part {p.part} · {p.questions.length}题 · {p.freq}</span>
        </span>
        <Button size="sm" variant="secondary" onClick={onBank}>返回题库</Button>
      </div>
      {setMode ? (
        <div style={lpSt.setNote}><Icon name="layers" size={14} />套题作答中，音频会连续播放。</div>
      ) : <div />}

      <div style={lpSt.player}>
        <button type="button" style={lpSt.play} onClick={() => setPlaying(!playing)} aria-label={playing ? "暂停" : "播放"}>
          <Icon name={playing ? "pause" : "play"} size={22} strokeWidth={2} />
        </button>
        <span style={lpSt.track}>
          <span style={lpSt.rail} onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); setPos(Math.round((e.clientX - r.left) / r.width * p.duration)); }}>
            <span style={{ ...lpSt.railFill, width: (pos / p.duration * 100) + "%" }} />
          </span>
          <span style={lpSt.time}><span>{mmss(pos)}</span><span>{mmss(p.duration)}</span></span>
        </span>
        <span style={{ width: 108, flex: "none" }}>
          <Select value={rate} onChange={(e) => setRate(e.target.value)} size="sm" options={["0.75x", "1.0x", "1.25x", "1.5x"]} />
        </span>
      </div>

      <div ref={bodyRef} style={lpSt.body}>
        <div style={lpSt.wrap}>
          {p.form ? (
            <div style={lpSt.formCard}>
              <div style={lpSt.formHead}>
                <span style={lpSt.formTitle}>{p.form.heading}</span>
                <span style={lpSt.formNote}>{p.form.note}</span>
              </div>
              {p.form.rows.map((r, i) => (
                <div key={r.n} ref={(el) => { qRefs.current[r.n] = el; }} style={{ ...lpSt.formRow, borderBottom: i === p.form.rows.length - 1 ? "none" : lpSt.formRow.borderBottom, background: cur === r.n ? "var(--blue-25)" : "transparent" }} onClick={() => setCur(r.n)}>
                  <span style={lpSt.formLabel}>{r.label}</span>
                  <span style={lpSt.inline}>
                    <span style={lpSt.dot(answered(r.n))} />
                    <span style={lpSt.qn}>{r.n}</span>
                    {r.value.split("____").map((part, k, arr) => (
                      <React.Fragment key={k}>
                        <span>{part}</span>
                        {k < arr.length - 1 ? <input style={lpSt.blank(cur === r.n)} value={answers[r.n] || ""} onChange={(e) => set(r.n, e.target.value)} /> : null}
                      </React.Fragment>
                    ))}
                  </span>
                  {answered(r.n) ? <span style={{ gridColumn: "1 / -1" }}><Explain q={p.questions.find((q) => q.n === r.n)} /></span> : null}
                </div>
              ))}
            </div>
          ) : null}

          {restQs.map((q) => (
            <div key={q.n} ref={(el) => { qRefs.current[q.n] = el; }} style={lpSt.qCard(cur === q.n)} onClick={() => setCur(q.n)}>
              <div style={lpSt.qHead}>
                <span style={lpSt.dot(answered(q.n))} />
                <span style={{ ...lpSt.qn, background: "var(--n-400)" }}>{q.n}</span>
                <span style={lpSt.stem}>{q.stem}</span>
                <Badge tone="neutral">{q.type}</Badge>
              </div>
              {q.type === "地图标注" ? (
                <div style={lpSt.mapBox}>
                  {q.options.map((o) => <div key={o} style={lpSt.mapCell(answers[q.n] === o)} onClick={() => set(q.n, o)}>{o}</div>)}
                </div>
              ) : q.multi ? (
                <div style={{ display: "grid", gap: 7 }}>
                  <span style={{ fontSize: "var(--fs-2xs)", color: "var(--text-subtle)" }}>选择 {q.multi} 项 · 已选 {(answers[q.n] || []).length}/{q.multi}</span>
                  {q.options.map((o) => {
                    const on = (answers[q.n] || []).includes(o);
                    return (
                      <div key={o} style={lpSt.opt(on)} onClick={() => toggleMulti(q, o)}>
                        <span style={{ width: 15, height: 15, borderRadius: "var(--radius-xs)", flex: "none", border: "1px solid " + (on ? "var(--action-primary)" : "var(--border-default)"), background: on ? "var(--action-primary)" : "transparent", color: "var(--n-0)", display: "grid", placeItems: "center" }}>
                          {on ? <Icon name="check" size={11} strokeWidth={3} /> : null}
                        </span>{o}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ display: "grid", gap: 7 }}>
                  {q.options.map((o) => (
                    <div key={o} style={lpSt.opt(answers[q.n] === o)} onClick={() => set(q.n, o)}>
                      <span style={{ width: 15, height: 15, borderRadius: "var(--radius-pill)", flex: "none", border: "1px solid " + (answers[q.n] === o ? "var(--action-primary)" : "var(--border-default)"), display: "grid", placeItems: "center" }}>
                        {answers[q.n] === o ? <span style={{ width: 7, height: 7, borderRadius: "var(--radius-pill)", background: "var(--action-primary)" }} /> : null}
                      </span>{o}
                    </div>
                  ))}
                </div>
              )}
              {/* 红线：讲解卡片以「已作答」为唯一展开条件，回顾模式不得绕过 */}
              {answered(q.n) ? <Explain q={q} /> : null}
            </div>
          ))}
        </div>
      </div>

      <div style={lpSt.foot}>
        <div style={lpSt.nums}>
          {p.questions.map((q) => <button key={q.n} type="button" style={lpSt.num({ answered: answered(q.n), current: cur === q.n })} onClick={() => jump(q.n)}>{q.n}</button>)}
        </div>
        <span style={{ ...lpSt.timer, marginLeft: "auto" }}>{clock(secs)}</span>
        <span style={{ display: "flex", gap: 8, alignItems: "center", marginLeft: "auto", flexWrap: "wrap" }}>
          <Button size="sm" variant="ghost" onClick={() => jump(Math.max(1, cur - 1))}>Previous</Button>
          <Button size="sm" variant="ghost" onClick={() => jump(Math.min(p.questions.length, cur + 1))}>Next</Button>
          <Button size="sm" variant="ghost" onClick={() => set(cur, "")}>Clear</Button>
          <Button onClick={() => unanswered > 0 ? setConfirm(true) : onSubmit({ answers, secs })}>交卷</Button>
          <Button size="sm" variant={review ? "primary" : "ghost"} icon="eye" disabled={!reviewAllowed}
            title={reviewAllowed ? "逐题浏览整套题" : "全部作答后可用"}
            onClick={() => { const on = !review; setReview(on); if (on) jump(1); }}>回顾模式</Button>
        </span>
      </div>

      <Dialog open={confirm} title={"还有 " + unanswered + " 题未作答，确定交卷？"} onClose={() => setConfirm(false)}
        footer={<>
          <Button variant="secondary" onClick={() => setConfirm(false)}>继续作答</Button>
          <Button onClick={() => { setConfirm(false); onSubmit({ answers, secs }); }}>确认交卷</Button>
        </>} />
    </div>
  );
}
Object.assign(window, { ListeningPractice });
