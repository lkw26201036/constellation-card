Page({
  data: {
    selectedSign: "双鱼座",
    selectedIndex: 11,
    signNames: [],
    dateLabel: "",
    card: {},
    isFavorite: false,
    cardAnimating: false
  },

  onLoad() {
    this.refreshCard()
  },

  onShow() {
    this.refreshCard()
  },

  refreshCard() {
    const app = getApp()
    const selectedSign = app.globalData.selectedSign
    const signNames = app.globalData.zodiacSigns.map((item) => item.name)
    const selectedIndex = Math.max(0, signNames.indexOf(selectedSign))
    const card = app.getDailyCard(selectedSign)
    this.setData({ selectedSign, selectedIndex, signNames, dateLabel: card.dateLabel, card, isFavorite: app.isFavorite(card.id) })
  },

  chooseSign(event) {
    const app = getApp()
    const selectedIndex = Number(event.detail.value)
    const selectedSign = app.globalData.zodiacSigns[selectedIndex].name
    app.setSelectedSign(selectedSign)
    const card = app.getDailyCard(selectedSign)
    this.setData({ selectedSign, selectedIndex, dateLabel: card.dateLabel, card, isFavorite: app.isFavorite(card.id), cardAnimating: true })
    setTimeout(() => this.setData({ cardAnimating: false }), 520)
  },

  openDraw() {
    wx.switchTab({ url: "/pages/draw/draw" })
  },

  saveCard() {
    const app = getApp()
    const isFavorite = app.toggleFavorite(this.data.card)
    this.setData({ isFavorite })
    wx.showToast({ title: isFavorite ? "已收藏" : "已取消收藏", icon: "success" })
  },

  onShareAppMessage() {
    return {
      title: `${this.data.selectedSign}的今日星象卡｜${this.data.card.title}`,
      path: `/pages/home/home?sign=${encodeURIComponent(this.data.selectedSign)}`
    }
  }
})
