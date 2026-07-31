/* Reading 做题界面示例数据。讲解内容仅在该题已作答后才允许展示（见 PracticeScreen 的解锁逻辑）。 */
window.PRACTICE = {
  r1: {
    id: "r1", skill: "Reading", part: 2, freq: "高频",
    title: "The Fascinating World of Mycorrhizal Networks",
    zh: "菌根网络的奇妙世界",
    instruction: "You should spend about 20 minutes on Questions 1–13, which are based on Reading Passage 2 below.",
    paragraphs: [
      { tag: "A", en: "Beneath almost every forest floor lies a network so dense and so old that biologists have taken to calling it the wood wide web. Fungal threads, each a fraction of the width of a human hair, wrap themselves around and inside the roots of trees, forming a partnership known as a mycorrhiza.", zh: "几乎每一片森林的地表之下，都存在着一张极其密集而古老的网络，生物学家称之为「树联网」。真菌菌丝的直径不足人类头发的几分之一，它们缠绕在树木根系的表面与内部，形成被称为菌根的共生关系。" },
      { tag: "B", en: "The arrangement is one of exchange rather than charity. Trees, which can photosynthesise, supply the fungus with sugars. The fungus, whose threads reach into soil pores far too narrow for a root, returns phosphorus, nitrogen and water. Neither partner could achieve alone what the pair achieves together.", zh: "这种安排是交换而非施舍。能够进行光合作用的树木向真菌提供糖类；菌丝可以伸入根系无法进入的细小土壤孔隙，因而回馈磷、氮与水分。任何一方单独都无法达成双方共同实现的成果。" },
      { tag: "C", en: "What surprised researchers was the scale of the connection. Suzanne Simard's experiments in British Columbia demonstrated that carbon could move from one tree to another through the fungal network — and that it moved preferentially towards seedlings growing in shade. Scarcely any of the earlier models of forest competition had anticipated such transfers.", zh: "令研究者意外的是这种连接的规模。Suzanne Simard 在不列颠哥伦比亚省的实验证明，碳可以通过真菌网络在树木之间移动，并且会优先流向生长在阴影中的幼苗。此前几乎没有任何森林竞争模型预见到这类物质转移。" },
      { tag: "D", en: "Not every biologist accepts the more expansive interpretations. Critics point out that laboratory conditions differ sharply from a living forest, and that a fungus moving carbon may simply be managing its own supply rather than nursing a seedling. The debate has sharpened the questions rather than settled them.", zh: "并非所有生物学家都接受更为宽泛的解读。批评者指出，实验室条件与真实森林差异显著；真菌转移碳，也可能只是在调配自身的供给，而非照料幼苗。这场争论使问题更加尖锐，而非得到解决。" },
      { tag: "E", en: "Practical consequences follow either way. Forestry operations that remove all mature trees destroy the network's hubs, and replanted seedlings establish more slowly as a result. Several Canadian provinces now require that a proportion of older trees be retained during harvesting.", zh: "无论如何，现实影响都随之而来。清除全部成熟树木的林业作业会摧毁网络的枢纽节点，重新栽种的幼苗因此更难立足。加拿大的若干省份现已要求在采伐时保留一定比例的老龄树木。" },
    ],
    questions: [
      { n: 1, type: "T/F/NG", stem: "Mycorrhizal fungi are visible to the naked eye as individual threads.", options: ["TRUE", "FALSE", "NOT GIVEN"], answer: "FALSE",
        zh: "菌根真菌的单根菌丝以肉眼可见。", ref: "A", explain: "A 段说明单根菌丝的直径不足人类头发的几分之一（a fraction of the width of a human hair），因此单根菌丝并非肉眼可见。" },
      { n: 2, type: "T/F/NG", stem: "The tree receives more benefit from the partnership than the fungus does.", options: ["TRUE", "FALSE", "NOT GIVEN"], answer: "NOT GIVEN",
        zh: "树木从这一共生关系中获得的益处多于真菌。", ref: "B", explain: "B 段只说明双方各自提供与获得什么，并称任何一方单独都无法达成共同成果，没有比较双方获益的多少。" },
      { n: 3, type: "填空", stem: "The fungus supplies the tree with phosphorus, nitrogen and ____.", answer: "water",
        zh: "真菌向树木提供磷、氮和 ____。", ref: "B", explain: "B 段原文：returns phosphorus, nitrogen and water。答案照抄原词 water。" },
      { n: 4, type: "单选", stem: "According to Simard's experiments, carbon moved preferentially towards", options: ["A the tallest trees in the plot", "B seedlings growing in shade", "C fungi with the longest threads", "D trees of a different species"], answer: "B seedlings growing in shade",
        zh: "根据 Simard 的实验，碳优先流向哪一类对象？", ref: "C", explain: "C 段原文：it moved preferentially towards seedlings growing in shade。其余选项原文未提及。" },
      { n: 5, type: "T/F/NG", stem: "Earlier models of forest competition predicted this kind of carbon transfer.", options: ["TRUE", "FALSE", "NOT GIVEN"], answer: "FALSE",
        zh: "早期的森林竞争模型曾预见到这类碳转移。", ref: "C", explain: "C 段用 Scarcely any ... had anticipated（几乎没有任何模型预见到）表达否定。scarcely any 属于否定量词，需与题干的 predicted 判为矛盾。" },
      { n: 6, type: "匹配", stem: "Which paragraph mentions a legal or regulatory requirement?", options: ["A", "B", "C", "D", "E"], answer: "E",
        zh: "哪一段提到了法律或法规层面的要求？", ref: "E", explain: "E 段：Several Canadian provinces now require that a proportion of older trees be retained（若干省份现已要求保留一定比例老龄树木）。" },
      { n: 7, type: "T/F/NG", stem: "All biologists agree with the wider interpretations of the research.", options: ["TRUE", "FALSE", "NOT GIVEN"], answer: "FALSE",
        zh: "所有生物学家都认同这项研究的更宽泛解读。", ref: "D", explain: "D 段首句 Not every biologist accepts...，与题干的 All ... agree 直接矛盾。" },
      { n: 8, type: "填空", stem: "Removing all mature trees destroys the network's ____.", answer: "hubs",
        zh: "清除全部成熟树木会摧毁网络的 ____。", ref: "E", explain: "E 段原文：destroy the network's hubs。答案照抄原词 hubs。" },
    ],
  },
};
