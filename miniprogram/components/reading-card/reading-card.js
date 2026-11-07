Component({
  properties: {
    card: { type: Object, value: {}, observer(card) {
      const labels = {daily:"每日星座卡",oracle:"今日主签",theme:"自由主题卡",quiz:"趣味测试结果",spread:"星光牌阵 · 三张星光",book:"答案之书"}
      this.setData({kind: card && card.type === "daily" && card.sign === "通用" ? "今日灵感卡" : labels[card && card.type] || "星座卡牌"})
    } },
    showAdvice: { type: Boolean, value: false }
  },
  data: { kind: "星座卡牌" }
})
