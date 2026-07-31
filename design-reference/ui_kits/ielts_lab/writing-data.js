/* Writing 示例数据。model（参考范文）仅在用户点击「完成本次练习」后才允许读取——
   「先尝试、后解锁答案/范文」为全 Lab 统一规则。 */
window.WRITING_TASKS = [
  { id: "wt1", group: "Task 1", diff: "入门", minutes: 20, tasks: 2, chart: "数据图",
    title: "Line graph: household recycling rates in three cities, 2005–2020",
    zh: "折线图：三座城市 2005–2020 年的家庭回收率",
    strategy: "比较不同类别的波动模式：先锁定起点、终点与转折点，再决定分段方式。" },
  { id: "wt2", group: "Task 1", diff: "进阶", minutes: 20, tasks: 2, chart: "流程图",
    title: "Process diagram: how recycled glass is produced",
    zh: "流程图：回收玻璃的生产过程",
    strategy: "流程题先数清阶段数，再统一时态与被动语态，避免中途换主语。" },
  { id: "wt3", group: "Task 1", diff: "挑战", minutes: 20, tasks: 2, chart: "地图",
    title: "Maps: changes to a coastal town between 1990 and today",
    zh: "地图：某沿海小镇 1990 年至今的变化",
    strategy: "地图题按方位分区描述，先说消失的、再说新增的，最后说保留不变的。" },
  { id: "wt4", group: "Task 2", diff: "入门", minutes: 40, tasks: 2, chart: "观点类",
    title: "Some people think music education should be compulsory in all schools.",
    zh: "有人认为音乐教育应在所有学校成为必修课。",
    strategy: "观点类先明确立场，再用「主张 → 原因 → 具体例子 → 回扣题目」组织每个主体段。" },
  { id: "wt5", group: "Task 2", diff: "进阶", minutes: 40, tasks: 2, chart: "讨论类",
    title: "Discuss both views on public funding for the arts.",
    zh: "讨论关于艺术公共资助的两种观点。",
    strategy: "讨论类必须两方各占一段并给出自己的立场段，避免只写一边。" },
  { id: "wt6", group: "Task 2", diff: "挑战", minutes: 40, tasks: 2, chart: "双问类",
    title: "Should governments prioritise vocational training over university education?",
    zh: "政府是否应将职业培训置于大学教育之前？",
    strategy: "双问类逐问对应段落，先回答问题本身，再展开理由，不要合并作答。" },
];

window.WRITING_SESSION = {
  wt1: {
    tasks: [
      { key: "Task 1", minWords: 150, prompt: "The graph below shows the percentage of household waste recycled in three cities between 2005 and 2020.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.",
        chartType: "数据图", requirement: "Write at least 150 words.",
        series: [
          { name: "Ashford", color: "var(--blue-600)", points: [18, 26, 34, 41] },
          { name: "Brentwood", color: "var(--gold-600)", points: [30, 33, 31, 38] },
          { name: "Calbury", color: "var(--n-500)", points: [12, 20, 33, 52] },
        ],
        xLabels: ["2005", "2010", "2015", "2020"],
        model: "The line graph compares the proportion of domestic waste recycled in Ashford, Brentwood and Calbury over a fifteen-year period.\n\nOverall, all three cities recycled a greater share of their waste by 2020 than in 2005, with Calbury showing by far the steepest rise, overtaking both of the others in the final five years.\n\nIn 2005 Brentwood led at 30%, roughly two-thirds higher than Ashford and more than double Calbury's 12%. Brentwood's figure then stagnated, dipping slightly to 31% in 2015 before recovering to 38%. Ashford climbed steadily throughout, adding roughly eight percentage points in each interval to finish at 41%. Calbury, by contrast, accelerated sharply after 2010 and reached 52% by 2020." },
      { key: "Task 2", minWords: 250, prompt: "Some people believe that music education should be compulsory in all schools, while others argue that limited school hours are better spent on core academic subjects.\n\nDiscuss both these views and give your own opinion.",
        chartType: "讨论类", requirement: "Write at least 250 words.",
        model: "Whether every pupil should study music is a question about what schools are for, not simply about timetabling.\n\nThose who defend compulsory music education point to effects that reach beyond the subject itself. Learning an instrument requires sustained, unglamorous practice, and pupils who acquire that habit at ten often carry it into other work…（示例范文节选）" },
    ],
  },
};
