const lfSt = {
  root: { borderTop: "1px solid var(--border-hairline)", padding: "22px clamp(20px,3.4vw,44px) 28px", display: "grid", gap: 14, maxWidth: 1160 },
  disc: { fontSize: "var(--fs-2xs)", lineHeight: 1.85, color: "var(--text-subtle)", maxWidth: "88ch", margin: 0 },
};

/* 逐字免责声明。法务口径待核实替换。 */
const IELTS_DISCLAIMER = "IELTS® 是英国文化教育协会（British Council）、IDP IELTS Australia 与剑桥大学英语考评部（Cambridge Assessment English）的注册商标。STAGE 与上述机构不存在任何关联、认可或合作关系。";
function LabFooter() {
  return (
    <footer style={lfSt.root}>
      <p style={lfSt.disc}>{IELTS_DISCLAIMER}</p>
    </footer>
  );
}
Object.assign(window, { LabFooter, IELTS_DISCLAIMER });
