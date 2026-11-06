Page({
  data: {
    selectedSign: "双鱼座",
    selectedIndex: 11,
    signNames: [],
    streak: 1,
    favoriteCount: 0,
    drawCount: 0
  },

  onShow() {
    this.refreshData()
  },

  refreshData() {
    const app = getApp()
    const selectedSign = app.globalData.selectedSign
    const signNames = app.globalData.zodiacSigns.map((item) => item.name)
    this.setData({
      selectedSign,
      selectedIndex: Math.max(0, signNames.indexOf(selectedSign)),
      signNames,
      favoriteCount: app.getFavorites().length,
      drawCount: app.getHistory().length
    })
  },

  chooseSign(event) {
    const app = getApp()
    const selectedIndex = Number(event.detail.value)
    const selectedSign = app.globalData.zodiacSigns[selectedIndex].name
    app.setSelectedSign(selectedSign)
    this.setData({ selectedSign, selectedIndex })
    wx.showToast({ title: "星座已更新", icon: "success" })
  },

  feedback() {
    wx.showToast({ title: "感谢你的反馈", icon: "none" })
  }
})
