/* Listening 做题示例数据。原生题型：表单填空 / 多选 / 地图标注 / 匹配。
   transcript 属于交卷后的证据复盘内容，做题界面不得读取。 */
window.LISTENING = {
  l1: {
    id: "l1", code: "L-2401", part: 1, freq: "高频", duration: 355,
    title: "Museum Membership Enquiry",
    zh: "博物馆会员咨询",
    /* 表单填空：还原真实试卷的表单结构，不抽象成通用问答样式 */
    form: {
      heading: "Museum Membership Application Form",
      note: "Complete the form below. Write ONE WORD AND/OR A NUMBER for each answer.",
      rows: [
        { label: "Name", value: "Helena ____", n: 1, answer: "Whitlock" },
        { label: "Address", value: "____ Bridgeworth Road", n: 2, answer: "48" },
        { label: "Postcode", value: "BS____", n: 3, answer: "7QN" },
        { label: "Membership type", value: "____ membership", n: 4, answer: "family" },
        { label: "Annual fee", value: "£____", n: 5, answer: "72" },
      ],
    },
    questions: [
      { n: 1, type: "表单填空", stem: "Name: Helena ____", answer: "Whitlock", zh: "姓名：Helena ____", cue: "01:12", explain: "录音中拼读 W-H-I-T-L-O-C-K，逐字母记录即可。" },
      { n: 2, type: "表单填空", stem: "Address: ____ Bridgeworth Road", answer: "48", zh: "地址：____ Bridgeworth Road", cue: "01:31", explain: "录音说 forty-eight，先写数字再核对。" },
      { n: 3, type: "表单填空", stem: "Postcode: BS____", answer: "7QN", zh: "邮编：BS____", cue: "01:44", explain: "邮编按字母数字混合记录，注意 Q 与 U 的读音区分。" },
      { n: 4, type: "表单填空", stem: "Membership type: ____ membership", answer: "family", zh: "会员类型：____ 会员", cue: "02:08", explain: "录音先提到 individual 后被否定，最终确定 family。" },
      { n: 5, type: "表单填空", stem: "Annual fee: £____", answer: "72", zh: "年费：£____", cue: "02:26", explain: "录音说 seventy-two pounds，注意与 £27 的混淆。" },
      { n: 6, type: "多选", stem: "Which TWO facilities are free for members?", options: ["A the rooftop café", "B the audio guide", "C the members' lounge", "D evening lectures", "E the car park"], answer: ["B the audio guide", "C the members' lounge"], multi: 2, zh: "哪两项设施对会员免费？", cue: "03:05", explain: "录音明确 audio guide 与 members' lounge 免费；café 打折但非免费。" },
      { n: 7, type: "地图标注", stem: "Where is the members' entrance? (choose A–E on the map)", options: ["A", "B", "C", "D", "E"], answer: "C", zh: "会员入口位于地图上的哪个位置？", cue: "03:52", explain: "录音以 opposite the ticket desk, just past the staircase 定位到 C。" },
      { n: 8, type: "匹配", stem: "Match the exhibition to its floor: Glassmaking →", options: ["Ground floor", "First floor", "Second floor"], answer: "Second floor", zh: "将展览与楼层匹配：玻璃制造 →", cue: "04:30", explain: "录音说 right at the top, on the second floor。" },
    ],
  },
};

/* 套题模式：随机组成 P1–P4，优先安排没做过的题。 */
window.LISTENING_SETS = {
  current: {
    id: "set-0729", started: "2026-07-29 20:14",
    parts: [
      { part: 1, freq: "高频", title: "Museum Membership Enquiry", id: "l1", done: 5, total: 8 },
      { part: 2, freq: "次高频", title: "Campus Orientation Tour", id: "l3", done: 0, total: 10 },
      { part: 3, freq: "高频", title: "Group Project on Renewable Energy", id: "l4", done: 0, total: 10 },
      { part: 4, freq: "高频", title: "Chamber Music History Lecture", id: "l2", done: 0, total: 10 },
    ],
  },
  history: [
    { id: "s3", when: "2026-07-29 20:14", state: "进行中", count: 5,
      parts: [{ part: 1, done: 5, total: 8 }, { part: 2, done: 0, total: 10, pending: true }, { part: 3, done: 0, total: 10 }, { part: 4, done: 0, total: 10 }] },
    { id: "s2", when: "2026-07-26 09:38", state: "已完成", count: 38,
      parts: [{ part: 1, done: 8, total: 8 }, { part: 2, done: 10, total: 10 }, { part: 3, done: 10, total: 10 }, { part: 4, done: 10, total: 10 }] },
    { id: "s1", when: "2026-07-21 21:02", state: "已完成", count: 36,
      parts: [{ part: 1, done: 8, total: 8 }, { part: 2, done: 9, total: 10 }, { part: 3, done: 10, total: 10 }, { part: 4, done: 9, total: 10 }] },
  ],
};
