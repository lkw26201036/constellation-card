Page({
  data: { selectedSign: "双鱼座", selectedIndex: 11, signNames: [], streak: 0, favoriteCount: 0, drawCount: 0 },
  onShow() {
    const app = getApp()
    app.recordVisit()
    const selectedSign = app.globalData.selectedSign, signNames = app.globalData.zodiacSigns.map(item => item.name)
    this.setData({ selectedSign, selectedIndex: signNames.indexOf(selectedSign), signNames,
      streak: app.getStreak(), favoriteCount: app.getFavorites().length, drawCount: app.getHistory().length })
  },
  chooseSign(event) {
    const selectedIndex = Number(event.detail.value), selectedSign = this.data.signNames[selectedIndex]
    try { getApp().setSelectedSign(selectedSign); this.setData({ selectedSign, selectedIndex }); wx.showToast({ title: "星座已更新", icon: "success" }) }
    catch (error) { wx.showToast({ title: "未能保存星座，请重试", icon: "none" }) }
  },
  openResearch() { wx.navigateTo({url:"/pages/research/research"}) },
  openPrivacy() { wx.navigateTo({ url: "/pages/about/about" }) }
})
