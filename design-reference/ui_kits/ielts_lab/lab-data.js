/* IELTS Lab 示例数据。全部为原生指标：正确率 / 题量 / 覆盖度 / 时长 / 天数 — 永不投射为分数。 */
window.LAB_DATA = {
  continueItem: {
    title: "The Fascinating World of Mycorrhizal Networks", zh: "菌根网络的奇妙世界",
    skill: "Reading", part: "Passage 2", progress: "8 / 13 题",
  },
  retestDue: 6,
  metrics: [
    { label: "已练习题目", value: "412", note: "题" },
    { label: "平均正确率", value: "68%", note: "近 30 天" },
    { label: "学习时长", value: "42h", note: "累计" },
    { label: "连续学习", value: "9", note: "天" },
  ],
  modules: [
    { skill: "Reading", icon: "book-open", sub: "4 大题型", total: 223, unit: "篇", done: 2, lastAcc: "62%",
      facts: ["题库总量 223 篇", "频次分层筛选", "讲解按答题解锁"], actions: ["浏览题库", "随机练习"] },
    { skill: "Listening", icon: "headphones", sub: "P1–P4", total: 186, unit: "段", done: 5, lastAcc: "74%",
      facts: ["题库总量 186 段", "原文证据复盘", "套题模式可选"], actions: ["浏览题库", "随机练习"] },
    { skill: "Writing", icon: "pen-line", sub: "Task 1 & Task 2", total: 148, unit: "题", done: 3, lastAcc: "70%",
      facts: ["小作文按图型分类", "草稿自动保存", "范文按完成解锁"], actions: ["浏览题库", "随机练习"] },
    { skill: "Speaking", icon: "messages-square", sub: "五步流程", total: 96, unit: "话题", done: 4, lastAcc: "80%",
      facts: ["九维度素材库", "个人故事构建", "可导出 / 导入"], actions: ["进入素材库", "继续构建"] },
  ],
  /* 目标分数：用户自行填写的个人意愿记录，不是系统预测或计算结果。 */
  goals: { Reading: 7.0, Listening: 7.5, Writing: 6.5, Speaking: 6.5 },
  onboarding: [
    { n: 1, title: "选科目", desc: "从 Reading、Listening、Writing、Speaking 中选择" },
    { n: 2, title: "去练习", desc: "在真实节奏下完成一次练习" },
    { n: 3, title: "复盘巩固", desc: "查看证据复盘，标记弱点，安排重测" },
  ],
  recent: [
    { title: "Urban Farming in High-Density Cities", zh: "高密度城市中的都市农业", skill: "Reading", part: "Passage 1", date: "2026-07-27", mine: "77%", avg: "63%" },
    { title: "Museum Membership Enquiry", zh: "博物馆会员咨询", skill: "Listening", part: "Section 1", date: "2026-07-26", mine: "90%", avg: "81%" },
    { title: "The History of Glassmaking", zh: "玻璃制造的历史", skill: "Reading", part: "Passage 3", date: "2026-07-25", mine: "54%", avg: "49%" },
    { title: "Describe a Skill You Learned Recently", zh: "描述你最近学会的一项技能", skill: "Speaking", part: "Part 2", date: "2026-07-24", mine: "80%", avg: "72%" },
    { title: "Line Graph: Household Recycling Rates", zh: "折线图：家庭回收率", skill: "Writing", part: "Task 1", date: "2026-07-22", mine: "70%", avg: "66%" },
  ],
};

/* ---------------- 批次二 ---------------- */
window.LAB_BANK = {
  Reading: {
    unit: "篇", parts: ["P1", "P2", "P3"],
    types: ["判断 T/F/NG", "匹配", "单选", "填空", "多选"],
    items: [
      { id: "r1", title: "The Fascinating World of Mycorrhizal Networks", zh: "菌根网络的奇妙世界", part: "P2", type: "判断 T/F/NG", freq: "高频", status: "已练习", mine: "62%", avg: "58%" },
      { id: "r2", title: "Urban Farming in High-Density Cities", zh: "高密度城市中的都市农业", part: "P1", type: "填空", freq: "高频", status: "已练习", mine: "77%", avg: "63%" },
      { id: "r3", title: "The History of Glassmaking", zh: "玻璃制造的历史", part: "P3", type: "匹配", freq: "次高频", status: "待重测", mine: "54%", avg: "49%" },
      { id: "r4", title: "Whale Migration Patterns", zh: "鲸类迁徙模式", part: "P2", type: "单选", freq: "高频", status: "未练习", mine: null, avg: "61%" },
      { id: "r5", title: "The Invention of the Postage Stamp", zh: "邮票的发明", part: "P1", type: "判断 T/F/NG", freq: "非高频", status: "未练习", mine: null, avg: "72%" },
      { id: "r6", title: "Bioluminescence in Deep-Sea Creatures", zh: "深海生物的生物发光", part: "P3", type: "多选", freq: "次高频", status: "未练习", mine: null, avg: "47%" },
      { id: "r7", title: "The Economics of Public Libraries", zh: "公共图书馆的经济学", part: "P2", type: "匹配", freq: "高频", status: "已练习", mine: "69%", avg: "60%" },
      { id: "r8", title: "Ancient Roman Concrete", zh: "古罗马混凝土", part: "P3", type: "填空", freq: "非高频", status: "未练习", mine: null, avg: "55%" },
    ],
  },
  Listening: {
    unit: "段", parts: ["P1", "P2", "P3", "P4"],
    types: ["填空", "单选", "多选", "匹配", "地图标注"],
    items: [
      { id: "l1", title: "Museum Membership Enquiry", zh: "博物馆会员咨询", part: "P1", type: "填空", freq: "高频", status: "已练习", mine: "90%", avg: "81%" },
      { id: "l2", title: "Chamber Music History Lecture", zh: "室内乐历史讲座", part: "P4", type: "填空", freq: "高频", status: "待重测", mine: "60%", avg: "57%" },
      { id: "l3", title: "Campus Orientation Tour", zh: "校园迎新导览", part: "P2", type: "地图标注", freq: "次高频", status: "未练习", mine: null, avg: "66%" },
      { id: "l4", title: "Group Project on Renewable Energy", zh: "可再生能源小组课题", part: "P3", type: "单选", freq: "高频", status: "已练习", mine: "74%", avg: "62%" },
      { id: "l5", title: "Booking a Holiday Cottage", zh: "预订度假小屋", part: "P1", type: "填空", freq: "高频", status: "未练习", mine: null, avg: "78%" },
      { id: "l6", title: "Urban Beekeeping Talk", zh: "城市养蜂讲座", part: "P2", type: "多选", freq: "非高频", status: "未练习", mine: null, avg: "59%" },
      { id: "l7", title: "Dissertation Supervision Meeting", zh: "论文指导会谈", part: "P3", type: "匹配", freq: "次高频", status: "未练习", mine: null, avg: "53%" },
    ],
  },
  Writing: {
    unit: "题",
    task1Groups: [
      { name: "数据图", icon: "chart-line", count: 42 },
      { name: "流程图", icon: "workflow", count: 18 },
      { name: "地图", icon: "map", count: 14 },
      { name: "示意图", icon: "shapes", count: 9 },
    ],
    types: ["观点类", "讨论类", "利弊类", "双问类"],
    items: [
      { id: "w1", title: "Line Graph: Household Recycling Rates", zh: "折线图：家庭回收率", part: "Task 1", type: "数据图", freq: "高频", status: "已练习", mine: "70%", avg: "66%" },
      { id: "w2", title: "Some people think music education should be compulsory…", zh: "音乐教育是否应为必修", part: "Task 2", type: "观点类", freq: "高频", status: "已练习", mine: "65%", avg: "58%" },
      { id: "w3", title: "Advantages and disadvantages of studying abroad at 18", zh: "18 岁出国留学的利与弊", part: "Task 2", type: "利弊类", freq: "高频", status: "未练习", mine: null, avg: "61%" },
      { id: "w4", title: "Discuss both views on funding the arts", zh: "讨论艺术资助的两种观点", part: "Task 2", type: "讨论类", freq: "次高频", status: "待重测", mine: "58%", avg: "54%" },
      { id: "w5", title: "Should governments prioritise vocational training?", zh: "政府是否应优先职业培训", part: "Task 2", type: "双问类", freq: "非高频", status: "未练习", mine: null, avg: "52%" },
    ],
  },
};

window.LAB_CAUSES = ["同义替换未识别", "定位句未找到", "题干限定词漏读", "数字与拼写记录错误", "转折信号词错过"];

window.LAB_REVIEW = {
  listening: {
    title: "Chamber Music History Lecture", zh: "室内乐历史讲座", skill: "Listening", part: "P4 · 填空",
    transcript: [
      { t: "02:20", text: "Good afternoon everyone. Today's lecture traces the development of European chamber music." },
      { t: "02:28", text: "The lecture will begin with the origins of the string quartet," },
      { t: "02:41", text: "which scarcely any of the earlier chamber forms anticipated." },
      { t: "02:47", text: "We will then move on to Haydn's contribution, often called the father of the quartet." },
      { t: "02:55", text: "By the double anniversary year of 1809, the form had spread across the whole continent." },
      { t: "03:04", text: "Publishers in Vienna printed no fewer than forty new quartet sets that decade." },
      { t: "03:12", text: "The final section of today's talk looks at the quartet's decline in the concert hall." },
    ],
    questions: [
      { q: "Q4", stem: "The string quartet developed from ____ earlier chamber forms.", my: "some", correct: "scarcely any", wrong: true, cue: 2 },
      { q: "Q5", stem: "Haydn is often called the ____ of the quartet.", my: "father", correct: "father", wrong: false, cue: 3 },
      { q: "Q6", stem: "By ____, the form had spread across the continent.", my: "1890", correct: "1809", wrong: true, cue: 4 },
      { q: "Q7", stem: "Vienna publishers printed ____ new quartet sets in that decade.", my: "40", correct: "40", wrong: false, cue: 5 },
    ],
  },
  reading: {
    title: "The History of Glassmaking", zh: "玻璃制造的历史", skill: "Reading", part: "P3 · 匹配",
    transcript: [
      { text: "Glassmaking began in Mesopotamia around 3500 BC, where artisans first produced glass beads as by-products of metalworking." },
      { text: "For centuries the recipe remained a closely guarded secret, handed down within a small number of workshop families." },
      { text: "It was the Roman invention of glassblowing, however, that transformed glass from a luxury into an everyday material." },
      { text: "Hardly any workshops outside the empire could match the speed of the new technique." },
      { text: "By the medieval period, Venetian glassmakers on the island of Murano dominated the European trade." },
      { text: "Their monopoly was protected by law: craftsmen who left the island risked severe punishment." },
    ],
    questions: [
      { q: "Q31", stem: "配对：玻璃吹制术的影响 → ", my: "C 使玻璃成为奢侈品", correct: "B 使玻璃成为日常材料", wrong: true, cue: 2 },
      { q: "Q32", stem: "配对：帝国之外的工坊 → ", my: "D 几乎无法匹敌新技术的速度", correct: "D 几乎无法匹敌新技术的速度", wrong: false, cue: 3 },
      { q: "Q33", stem: "配对：穆拉诺工匠 → ", my: "A 受法律保护的垄断", correct: "A 受法律保护的垄断", wrong: false, cue: 5 },
    ],
  },
};

window.LAB_QUEUE = [
  { id: "q1", title: "The History of Glassmaking", zh: "玻璃制造的历史", skill: "Reading", date: "2026-07-25", mine: "54%", causes: ["同义替换未识别", "定位句未找到"], due: "今天", retested: null, retest: "77%" },
  { id: "q2", title: "Chamber Music History Lecture", zh: "室内乐历史讲座", skill: "Listening", date: "2026-07-21", mine: "60%", causes: ["数字与拼写记录错误"], due: "今天", retested: null, retest: "85%" },
  { id: "q3", title: "Discuss both views on funding the arts", zh: "讨论艺术资助的两种观点", skill: "Writing", date: "2026-07-18", mine: "58%", causes: ["题干限定词漏读"], due: "3 天后", retested: null, retest: "71%" },
  { id: "q4", title: "Group Project on Renewable Energy", zh: "可再生能源小组课题", skill: "Listening", date: "2026-07-12", mine: "62%", causes: ["转折信号词错过"], due: "已完成", retested: "81%", retest: "81%" },
];

window.LAB_HISTORY = {
  summary: [
    { label: "总练习量", value: "412", note: "题" },
    { label: "总时长", value: "42h", note: "累计" },
    { label: "连续学习", value: "9", note: "天" },
  ],
  series: {
    "全部": [52, 58, 55, 63, 61, 68, 72],
    Reading: [48, 55, 50, 60, 58, 62, 70],
    Listening: [60, 63, 62, 70, 68, 76, 78],
    Writing: [45, 52, 50, 58, 55, 62, 65],
    Speaking: [55, 60, 58, 64, 62, 70, 74],
  },
  seriesLabels: ["W24", "W25", "W26", "W27", "W28", "W29", "W30"],
  days: [
    { date: "2026-07-27", events: [
      { kind: "练习", icon: "book-open", title: "Urban Farming in High-Density Cities", meta: "Reading P1 · 正确率 77%（全体平均 63%）" },
      { kind: "复盘", icon: "notebook-pen", title: "The History of Glassmaking", meta: "标注错因 2 项：同义替换未识别 · 定位句未找到" },
    ]},
    { date: "2026-07-26", events: [
      { kind: "练习", icon: "book-open", title: "Museum Membership Enquiry", meta: "Listening P1 · 正确率 90%（全体平均 81%）" },
      { kind: "重测", icon: "rotate-ccw", title: "Group Project on Renewable Energy", meta: "Listening P3 · 上次 62% → 本次 81%" },
    ]},
    { date: "2026-07-25", events: [
      { kind: "练习", icon: "book-open", title: "The History of Glassmaking", meta: "Reading P3 · 正确率 54%（全体平均 49%）" },
    ]},
    { date: "2026-07-24", events: [
      { kind: "练习", icon: "book-open", title: "Describe a Skill You Learned Recently", meta: "Speaking Part 2 · 素材自测 80%" },
      { kind: "复盘", icon: "notebook-pen", title: "Chamber Music History Lecture", meta: "标注错因 1 项：数字与拼写记录错误" },
    ]},
  ],
};

/* 题型说明：纯方法论，严禁混入真题内容或标准答案。 */
window.QUESTION_TYPES = {
  Reading: [
    { en: "True / False / Not Given", zh: "判断题", count: 68, desc: "给你一句陈述，判断它与原文说法一致、矛盾，还是原文根本没提。难点在于区分「矛盾」与「没提」——原文没写的推断都算 Not Given。" },
    { en: "Matching Headings", zh: "标题匹配", count: 41, desc: "为每个段落挑一个最能概括它的小标题。要抓段落主旨，而不是段落里出现过的某个细节。" },
    { en: "Multiple Choice", zh: "单选 / 多选", count: 57, desc: "从若干选项里选出符合原文的一项或几项。题干里的限定词（only、mainly、first）往往决定对错。" },
    { en: "Sentence Completion", zh: "句子填空", count: 39, desc: "用原文中的词把句子补完整。注意字数上限，超一个词也算错，通常要照抄原词不做改写。" },
    { en: "Matching Information", zh: "信息匹配", count: 18, desc: "把一条信息定位到它出现在哪一段。信息可能分散在几段里，要找的是完整表达该信息的那一段。" },
  ],
  Listening: [
    { en: "Form / Note Completion", zh: "表单填空", count: 64, desc: "边听边把表单或笔记里的空补上。数字、拼写、单复数是主要失分点，听到 double / triple 要立刻写成两位。" },
    { en: "Multiple Choice", zh: "多选题", count: 33, desc: "从选项中选出录音提到的若干项。录音常先说一个再否定它，最终答案往往在转折词之后。" },
    { en: "Map / Plan Labelling", zh: "地图标注", count: 22, desc: "根据录音里的方位描述在图上定位。提前读图、记住入口与参照物，跟着 opposite / past / next to 走。" },
    { en: "Matching", zh: "匹配题", count: 29, desc: "把人物、时间或选项与对应内容配对。选项数量通常多于题目，多出来的是干扰项。" },
    { en: "Short Answer", zh: "简答题", count: 17, desc: "用不超过规定词数回答问题。答案基本是原文原词，不需要自己组织语言。" },
  ],
  Writing: [
    { en: "Task 1 · Data Chart", zh: "小作文 · 数据图", count: 42, desc: "描述折线、柱状、饼图或表格里的主要趋势。先写总体特征，再分组比较，不逐个数据罗列。" },
    { en: "Task 1 · Process", zh: "小作文 · 流程图", count: 18, desc: "描述一个过程的各个阶段。数清阶段数、统一时态与被动语态，按顺序推进不跳步。" },
    { en: "Task 1 · Map", zh: "小作文 · 地图", count: 14, desc: "描述同一地点在不同时期的变化。按方位分区，先说消失的、再说新增的、最后说保留的。" },
    { en: "Task 2 · Opinion", zh: "大作文 · 观点类", count: 31, desc: "对一个说法表明你的立场并论证。每个主体段按「主张 → 原因 → 具体例子 → 回扣题目」展开。" },
    { en: "Task 2 · Discussion", zh: "大作文 · 讨论类", count: 26, desc: "讨论两种观点并给出自己的看法。两方各占一段，自己的立场必须单独交代，不能只写一边。" },
  ],
  Speaking: [
    { en: "Part 1 · Interview", zh: "第一部分 · 日常问答", count: 38, desc: "关于你自己、家乡、爱好的简短问答。答案不必长，但要给出一点具体内容，避免只答一句话。" },
    { en: "Part 2 · Long Turn", zh: "第二部分 · 个人陈述", count: 34, desc: "按题卡提示连续讲一到两分钟。先用九维度准备素材，讲的时候按自己搭好的顺序推进。" },
    { en: "Part 3 · Discussion", zh: "第三部分 · 深入讨论", count: 24, desc: "就 Part 2 的话题作抽象讨论。需要给理由、举例子、做对比，而不是只表态。" },
  ],
};
