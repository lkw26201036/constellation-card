Page({
 data:{review:null},
 onShow(){const app=getApp();this.setData({review:app.getWeeklyReview()});app.track("weekly_open","weekly");app.track("weekly_pack_open","weekly")},
 openHome(){wx.switchTab({url:"/pages/home/home"})},
 openDice(){wx.navigateTo({url:"/pages/dice/dice"})},
 openPair(){wx.navigateTo({url:"/pages/pair/pair"})},
 actionChanged(event){const app=getApp();this.setData({review:app.getWeeklyReview()});if(event&&event.detail&&event.detail.action&&event.detail.action.status==="done")app.track("weekly_action_complete","weekly")},
 feedback(){getApp().track("weekly_feedback","weekly");wx.showToast({title:"谢谢你的回应",icon:"none"})}
})
