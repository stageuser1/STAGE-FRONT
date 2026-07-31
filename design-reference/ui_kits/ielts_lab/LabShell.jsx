const { Icon } = window.STAGEDesignSystem_0f9c53;

const shellStyles = {
  root: { display: "grid", gridTemplateColumns: "236px 1fr", minHeight: "100vh", background: "var(--surface-page)" },
  side: {
    borderRight: "1px solid var(--border-hairline)", background: "var(--surface-page)",
    display: "grid", gridTemplateRows: "auto 1fr auto", position: "sticky", top: 0,
    height: "100vh", padding: "18px 12px 14px",
  },
  brand: { display: "flex", alignItems: "center", gap: 9, padding: "4px 10px 18px" },
  brandBack: { color: "var(--n-400)", display: "grid", flex: "none", marginLeft: -4, marginRight: -2 },
  word: { fontFamily: "var(--font-display)", fontWeight: "var(--fw-bold)", fontSize: 13, letterSpacing: "0.24em", color: "var(--blue-950)" },
  labTag: { fontSize: "var(--fs-2xs)", fontWeight: "var(--fw-semibold)", letterSpacing: ".1em", color: "var(--blue-700)", background: "var(--surface-accent-soft)", border: "1px solid var(--border-accent)", borderRadius: "var(--radius-xs)", padding: "2px 6px", whiteSpace: "nowrap" },
  nav: { display: "grid", gap: 2, alignContent: "start" },
  item: (on) => ({
    display: "flex", alignItems: "center", gap: 11, padding: "10px 12px",
    borderRadius: "var(--radius-sm)", cursor: "pointer", border: "none", width: "100%",
    textAlign: "left", fontFamily: "var(--font-text)",
    fontSize: "var(--fs-sm)", fontWeight: on ? "var(--fw-semibold)" : "var(--fw-medium)",
    background: on ? "var(--surface-accent-soft)" : "transparent",
    color: on ? "var(--blue-800)" : "var(--text-muted)",
    transition: "background var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard)",
  }),
  group: { fontSize: "var(--fs-2xs)", letterSpacing: "var(--ls-eyebrow)", textTransform: "uppercase", color: "var(--n-400)", fontWeight: "var(--fw-semibold)", padding: "16px 12px 6px" },
  backWrap: { borderTop: "1px solid var(--border-hairline)", paddingTop: 12, marginTop: 12 },
  back: (hover) => ({
    display: "flex", alignItems: "center", gap: 10, padding: "11px 12px",
    borderRadius: "var(--radius-sm)", border: "1px solid " + (hover ? "var(--border-default)" : "var(--border-hairline)"),
    background: hover ? "var(--action-quiet-hover)" : "var(--surface-page)",
    fontSize: "var(--fs-sm)", fontWeight: "var(--fw-semibold)",
    color: hover ? "var(--text-strong)" : "var(--text-body)",
    transition: "background var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard)",
  }),
  main: { minWidth: 0, display: "grid", alignContent: "start" },
};

const labNav = [
  { id: "overview", label: "学习总览", icon: "layout-dashboard" },
  { id: "reading", label: "Reading", icon: "book-open" },
  { id: "listening", label: "Listening", icon: "headphones" },
  { id: "writing", label: "Writing", icon: "pen-line" },
  { id: "speaking", label: "Speaking", icon: "messages-square" },
  { id: "queue", label: "复盘队列", icon: "rotate-ccw" },
  { id: "history", label: "学习记录", icon: "history" },
];

function LabShell({ route, onRoute, children }) {
  const [backHover, setBackHover] = React.useState(false);
  return (
    <div style={shellStyles.root}>
      <aside style={shellStyles.side}>
        <div>
          <a href="../marketing/index.html" title="返回 STAGE 官网" style={shellStyles.brand}>
            <span style={shellStyles.brandBack}><Icon name="arrow-left" size={17} strokeWidth={2} /></span>
            <img src={window.__resources.stageMark} alt="STAGE" style={{ height: 20 }} />
            <span style={shellStyles.word}>STAGE</span>
            <span style={shellStyles.labTag}>IELTS Lab</span>
          </a>
          <nav style={shellStyles.nav}>
            {labNav.map((n) => {
              const on = n.id === route;
              return (
                <button key={n.id} type="button" style={shellStyles.item(on)} onClick={() => onRoute(n.id)}>
                  <span style={{ display: "grid", color: on ? "var(--blue-700)" : "var(--n-400)" }}>
                    <Icon name={n.icon} size={17} strokeWidth={on ? 2 : 1.75} />
                  </span>
                  {n.label}
                </button>
              );
            })}
          </nav>
        </div>
        <span />
        <div style={shellStyles.backWrap}>
          <a href="../marketing/index.html" style={shellStyles.back(backHover)}
            onMouseEnter={() => setBackHover(true)} onMouseLeave={() => setBackHover(false)}>
            <Icon name="arrow-left" size={17} strokeWidth={2} />返回 STAGE
          </a>
        </div>
      </aside>
      <main style={shellStyles.main}>{children}</main>
    </div>
  );
}
Object.assign(window, { LabShell });
