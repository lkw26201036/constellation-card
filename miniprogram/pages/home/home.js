Page({
  data: {
    selectedSign: "双鱼座",
    dateLabel: "2026年11月6日",
    card: {
      title: "把今天过成柔软的光",
      keyword: "松弛感",
      summary: "今天适合放慢一点，在熟悉的节奏里找到自己的答案。",
      color: "雾蓝色",
      number: "7"
    }
  },

  onLoad() {
    const app = getApp()
    const selectedSign = app.globalData.selectedSign
    this.setData({ selectedSign })
  },

  chooseSign() {
    wx.showActionSheet({
      itemList: ["白羊座", "金牛座", "双子座", "巨蟹座", "狮子座", "处女座", "天秤座", "天蝎座", "射手座", "摩羯座", "水瓶座", "双鱼座"],
      success: (result) => {
        const signs = ["白羊座", "金牛座", "双子座", "巨蟹座", "狮子座", "处女座", "天秤座", "天蝎座", "射手座", "摩羯座", "水瓶座", "双鱼座"]
        const selectedSign = signs[result.tapIndex]
        const app = getApp()
        app.globalData.selectedSign = selectedSign
        wx.setStorageSync("selectedSign", selectedSign)
        this.setData({ selectedSign })
      }
    })
  },

  openDraw() {
    wx.switchTab({ url: "/pages/draw/draw" })
  },

  saveCard() {
    wx.showToast({ title: "已收藏", icon: "success" })
  },

  shareCard() {
    wx.showToast({ title: "分享功能准备中", icon: "none" })
  }
})

