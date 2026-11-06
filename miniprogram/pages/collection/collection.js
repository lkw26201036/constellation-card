Page({
  data: {
    cards: [],
    history: []
  },

  onShow() {
    this.loadData()
  },

  loadData() {
    const app = getApp()
    this.setData({
      cards: app.getFavorites(),
      history: app.getHistory()
    })
  },

  removeCard(event) {
    const id = event.currentTarget.dataset.id
    const card = this.data.cards.find((item) => item.id === id)
    if (!card) return
    getApp().toggleFavorite(card)
    this.loadData()
    wx.showToast({ title: "已取消收藏", icon: "success" })
  }
})
