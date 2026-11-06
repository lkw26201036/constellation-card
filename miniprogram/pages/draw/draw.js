Page({
  data: {
    selectedSign: "双鱼座",
    isRevealed: false,
    isDrawing: false,
    result: {},
    isFavorite: false
  },

  onLoad() {
    this.refreshSign()
  },

  onShow() {
    this.refreshSign()
  },

  refreshSign() {
    const app = getApp()
    this.setData({ selectedSign: app.globalData.selectedSign })
  },

  reveal() {
    if (this.data.isRevealed || this.data.isDrawing) return
    this.setData({ isDrawing: true })
    setTimeout(() => {
      const app = getApp()
      const result = app.getRandomOracle(this.data.selectedSign)
      app.addHistory(result)
      this.setData({
        isDrawing: false,
        isRevealed: true,
        result,
        isFavorite: app.isFavorite(result.id)
      })
      wx.vibrateShort({ type: "light" })
    }, 560)
  },

  reset() {
    this.setData({ isRevealed: false, isDrawing: false, result: {}, isFavorite: false })
  },

  saveResult() {
    const app = getApp()
    const isFavorite = app.toggleFavorite(this.data.result)
    this.setData({ isFavorite })
    wx.showToast({ title: isFavorite ? "已收藏" : "已取消收藏", icon: "success" })
  },

  onShareAppMessage() {
    const title = this.data.result.title ? `${this.data.selectedSign}抽到「${this.data.result.title}」` : "来抽一张今天的神谕卡"
    return {
      title,
      path: `/pages/draw/draw?sign=${encodeURIComponent(this.data.selectedSign)}`
    }
  }
})
