Page({
 data:{review:null},
 onShow(){this.setData({review:getApp().getWeeklyReview()})},
 openHome(){wx.switchTab({url:"/pages/home/home"})},
 openDice(){wx.navigateTo({url:"/pages/dice/dice"})},
 openPair(){wx.navigateTo({url:"/pages/pair/pair"})},
 actionChanged(){this.setData({review:getApp().getWeeklyReview()})}
})
