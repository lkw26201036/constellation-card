Page({
  data: { card: null, isFavorite: false, unavailable: false },
  onLoad(query) {
    const app = getApp()
    let localId
    try { localId = decodeURIComponent(query.local || "") } catch (error) { this.setData({ unavailable: true }); return }
    const card = localId ? app.findLocalCard(localId) : app.resolveCard(query)
    this.setData({ card: card || null, unavailable: !card })
    if (card) wx.setNavigationBarTitle({ title: card.type === "quiz" ? "测试结果" : card.type === "daily" ? "每日卡片" : "抽签结果" })
  },
  onShow() { if (this.data.card) this.setData({ isFavorite: getApp().isFavorite(this.data.card.id) }) },
  saveCard() {
    try {
      const isFavorite = getApp().toggleFavorite(this.data.card)
      this.setData({ isFavorite })
      wx.showToast({ title: isFavorite ? "已收藏" : "已取消收藏", icon: "success" })
    } catch (error) { wx.showToast({ title: error.message || "保存失败，请重试", icon: "none" }) }
  },
  tryMine() { if(this.data.card && this.data.card.type === "quiz") { wx.navigateTo({url:"/pages/quiz/quiz"}); return } wx.switchTab({ url: !this.data.card || this.data.card.type === "daily" ? "/pages/home/home" : "/pages/draw/draw" }) },
  onShareAppMessage() {
    const card = this.data.card
    return card ? { title: card.sign + " · " + card.title, path: getApp().getCardPath(card) } : { title: "给今天一张温柔的卡", path: "/pages/home/home" }
  }
})
