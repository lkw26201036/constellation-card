Page({
  data: { cards: [], history: [] },
  onShow() { this.loadData() },
  loadData() { this.setData({ cards: getApp().getFavorites(), history: getApp().getHistory() }) },
  openCard(event) {
    const id = event.currentTarget.dataset.id
    wx.navigateTo({ url: "/pages/detail/detail?local=" + encodeURIComponent(id) })
  },
  removeCard(event) {
    const card = this.data.cards.find(item => item.id === event.currentTarget.dataset.id)
    if (!card) return
    wx.showModal({ title: "取消收藏？", content: "取消后将从收藏列表移除。", success: result => {
      if (!result.confirm) return
      try { getApp().toggleFavorite(card); this.loadData() } catch (error) { wx.showToast({ title: "操作失败，请重试", icon: "none" }) }
    } })
  }
})
