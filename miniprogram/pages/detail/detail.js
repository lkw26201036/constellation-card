Page({
  data: { card: null, isFavorite: false, unavailable: false, shared: false },
  onLoad(query) {
    const app = getApp()
    let localId
    try { localId = decodeURIComponent(query.local || "") } catch (error) { this.setData({ unavailable: true }); return }
    const card = localId ? app.findLocalCard(localId) : app.resolveCard(query)
    if(card && query.from === "share") app.track("share_open",card.type)
    this.setData({ card: card || null, unavailable: !card, shared: query.from === "share" })
    if (card) wx.setNavigationBarTitle({ title: card.type === "spread" ? "这组星光" : card.type === "book" ? "答案之书" : card.type === "quiz" ? "测试结果" : card.type === "daily" ? "每日卡片" : "抽签结果" })
  },
  onShow() { if (this.data.card) this.setData({ isFavorite: getApp().isFavorite(this.data.card.id) }) },
  saveCard() {
    try {
      const isFavorite = getApp().toggleFavorite(this.data.card)
      this.setData({ isFavorite })
      wx.showToast({ title: isFavorite ? "已收藏" : "已取消收藏", icon: "success" })
    } catch (error) { wx.showToast({ title: error.message || "保存失败，请重试", icon: "none" }) }
  },
  openPoster() { wx.navigateTo({url:getApp().getCardPath(this.data.card).replace("/pages/detail/detail","/pages/poster/poster")}) },
  secondaryAction() { if(this.data.shared)this.openPoster();else this.tryMine() },
  tryMine() {
    const app=getApp(),card=this.data.card
    if(card&&card.type==="spread"){wx.navigateTo({url:"/pages/spread/spread"});return}
    if(card&&card.type==="book"){wx.navigateTo({url:"/pages/answer/answer"});return}
    if(card&&card.type==="quiz"){wx.navigateTo({url:"/pages/quiz/quiz"});return}
    if(card&&card.type==="theme"){app.globalData.pendingDrawMode=null;app.globalData.pendingTheme=card.themeId}
    else if(card&&card.type==="oracle"){app.globalData.pendingTheme=null;app.globalData.pendingDrawMode="daily"}
    wx.switchTab({url:!card||card.type==="daily"?"/pages/home/home":"/pages/draw/draw"})
  },
  onShareAppMessage() {
    const card = this.data.card
    return card ? { title: (card.sign === "通用" ? "十二星光" : card.sign) + " · " + card.title, path: getApp().getSharePath(card) } : { title: "给今天一张温柔的卡", path: "/pages/home/home" }
  }
})
