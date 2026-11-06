Page({
  data: { selectedSign: "双鱼座", selectedIndex: 11, signNames: [], dateLabel: "", card: {}, isFavorite: false, cardAnimating: false },
  onLoad(query) {
    const app = getApp()
    let sign
    try { sign = decodeURIComponent((query && query.sign) || "") } catch (error) { return }
    if (app.globalData.zodiacSigns.some(item => item.name === sign)) app.setSelectedSign(sign)
  },
  onShow() { this.refreshCard() },
  onUnload() { clearTimeout(this.animationTimer) },
  refreshCard() {
    const app = getApp(), selectedSign = app.globalData.selectedSign
    const signNames = app.globalData.zodiacSigns.map(item => item.name)
    const card = app.getDailyCard(selectedSign)
    this.setData({ selectedSign, selectedIndex: signNames.indexOf(selectedSign), signNames, dateLabel: card.dateLabel, card, isFavorite: app.isFavorite(card.id) })
  },
  chooseSign(event) {
    try {
      getApp().setSelectedSign(this.data.signNames[Number(event.detail.value)])
      this.refreshCard()
      this.setData({ cardAnimating: true })
      clearTimeout(this.animationTimer)
      this.animationTimer = setTimeout(() => this.setData({ cardAnimating: false }), 520)
    } catch (error) { wx.showToast({ title: "未能保存星座，请重试", icon: "none" }) }
  },
  openQuiz() { wx.navigateTo({url:"/pages/quiz/quiz"}) },
  openDraw() { wx.switchTab({ url: "/pages/draw/draw" }) },
  openDetail() { wx.navigateTo({ url: getApp().getCardPath(this.data.card) }) },
  saveCard() {
    try {
      const isFavorite = getApp().toggleFavorite(this.data.card)
      this.setData({ isFavorite })
      wx.showToast({ title: isFavorite ? "已收藏" : "已取消收藏", icon: "success" })
    } catch (error) { wx.showToast({ title: error.message || "保存失败，请重试", icon: "none" }) }
  },
  onShareAppMessage() { return { title: this.data.selectedSign + "的今日卡｜" + this.data.card.title, path: getApp().getCardPath(this.data.card) } }
})
