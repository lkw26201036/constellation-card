App({
  globalData: {
    selectedSign: "双鱼座"
  },
  onLaunch() {
    const selectedSign = wx.getStorageSync("selectedSign")
    if (selectedSign) {
      this.globalData.selectedSign = selectedSign
    }
  }
})

