Component({
  properties: {
    card: { type: Object, value: {}, observer(card) {
      const labels = {daily:"每日星座卡",oracle:"今日主签",theme:"自由主题卡",quiz:"趣味测试结果"}
      this.setData({kind: labels[card && card.type] || "星座卡牌"})
    } },
    showAdvice: { type: Boolean, value: false }
  },
  data: { kind: "星座卡牌" }
})
