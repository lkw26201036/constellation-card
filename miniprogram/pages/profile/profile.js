Page({
  data: {
    selectedSign: "双鱼座",
    streak: 1
  },

  onLoad() {
    const app = getApp()
    this.setData({ selectedSign: app.globalData.selectedSign })
  },

  chooseSign() {
    wx.showToast({ title: "星座设置准备中", icon: "none" })
  },

  feedback() {
    wx.showToast({ title: "感谢你的反馈", icon: "none" })
  }
})

