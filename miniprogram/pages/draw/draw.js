Page({
  data: { selectedSign: "双鱼座", isRevealed: false, isDrawing: false, result: {}, isFavorite: false },
  onShow() { this.refreshResult() },
  onHide() { clearTimeout(this.drawTimer); this.setData({ isDrawing: false }) },
  onUnload() { clearTimeout(this.drawTimer) },
  refreshResult() {
    const app = getApp(), result = app.getTodayDraw()
    if (result) { try { app.addHistory(result) } catch (error) { console.warn("历史保存失败", error) } }
    this.setData({ selectedSign: result ? result.sign : app.globalData.selectedSign, result: result || {}, isRevealed: Boolean(result), isDrawing: false, isFavorite: result ? app.isFavorite(result.id) : false })
  },
  reveal() {
    if (this.data.isRevealed || this.data.isDrawing) return
    this.setData({ isDrawing: true })
    this.drawTimer = setTimeout(() => {
      try {
        getApp().drawToday()
        this.refreshResult()
        wx.vibrateShort({ type: "light", fail() {} })
      } catch (error) {
        this.refreshResult()
        wx.showToast({ title: "保存未完成，请重试", icon: "none" })
      }
    }, 560)
  },
  openDetail() { wx.navigateTo({ url: getApp().getCardPath(this.data.result) }) },
  saveResult() {
    try {
      const isFavorite = getApp().toggleFavorite(this.data.result)
      this.setData({ isFavorite })
      wx.showToast({ title: isFavorite ? "已收藏" : "已取消收藏", icon: "success" })
    } catch (error) { wx.showToast({ title: error.message || "保存失败，请重试", icon: "none" }) }
  },
  onShareAppMessage() {
    return this.data.isRevealed ? { title: "我抽到「" + this.data.result.title + "」，你呢？", path: getApp().getCardPath(this.data.result) } : { title: "来领取今天的一张卡", path: "/pages/draw/draw" }
  }
})
