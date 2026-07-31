window.SP_DIMS = [
  ["WHAT", "是什么"], ["WHO", "谁"], ["WHEN", "何时"], ["WHERE", "何地"], ["WHY", "为何"],
  ["MEMORY", "记忆"], ["FEELING", "感受"], ["CHANGE_OVER_TIME", "变化"], ["COMPARISON", "对比"],
];
window.SP_TOPICS = {
  "Part 1": [
    { id: "p1a", en: "Do you play a musical instrument?", zh: "你演奏乐器吗？" },
    { id: "p1b", en: "How do you usually practise?", zh: "你通常怎么练习？" },
    { id: "p1c", en: "What music did you listen to as a child?", zh: "你小时候听什么音乐？" },
  ],
  "Part 2": [
    { id: "p2a", en: "Describe a skill you learned recently", zh: "描述你最近学会的一项技能" },
    { id: "p2b", en: "Describe a performance you watched", zh: "描述你看过的一场演出" },
    { id: "p2c", en: "Describe a place where you like to study", zh: "描述一个你喜欢学习的地方" },
  ],
  "Part 3": [
    { id: "p3a", en: "Why do people learn instruments as adults?", zh: "为什么成年人学乐器？" },
    { id: "p3b", en: "Is live music better than recorded music?", zh: "现场音乐比录制音乐更好吗？" },
  ],
};
window.SP_CONNECTORS = ["because", "however", "for example", "after that", "which means", "compared with"];
/* 预填示例：演示 traceability —— 草稿只能由左栏片段与连接词组成 */
window.SP_SEED = {
  topic: "p2a",
  ideas: {
    WHAT: "learning to accompany singers on the piano",
    WHO: "my chamber music teacher pushed me to try",
    WHEN: "over the past three months",
    WHY: "solo practice felt isolating",
    FEELING: "nervous at first, then surprisingly calm",
    COMPARISON: "very different from playing alone",
  },
};
