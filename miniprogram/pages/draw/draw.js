Page({
  data: {
    selectedSign: "双鱼座",
    isRevealed: false,
    result: {
      title: "月光里的回声",
      keyword: "倾听",
      text: "今天适合听听内心真实的声音，给重要的关系留一点温柔的空间。",
      advice: "先照顾好自己的感受，再回应外界的期待。"
    }
  },

  onLoad() {
    const app = getApp()
    this.setData({ selectedSign: app.globalData.selectedSign })
  },

  reveal() {
    this.setData({ isRevealed: true })
    wx.vibrateShort({ type: "light" })
  },

  reset() {
    this.setData({ isRevealed: false })
  },

  saveResult() {
    wx.showToast({ title: "已收藏", icon: "success" })
  },

  shareResult() {
    wx.showToast({ title: "分享功能准备中", icon: "none" })
  }
})

