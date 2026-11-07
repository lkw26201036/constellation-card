Page({
 data:{journey:null},
 onShow(){this.refresh()},
 refresh(){this.setData({journey:getApp().getJourneyView()})},
 start(){const app=getApp();app.startJourney();app.track("journey_start","journey");this.refresh()},
 actionChanged(event){
  const app=getApp(),action=event&&event.detail&&event.detail.action,before=this.data.journey||app.getJourneyView(),next=app.syncJourneyAction(action)
  if(next&&action&&action.status==="done"&&next.completedDays>before.completedDays){app.track("journey_day_complete","journey");if(next.completed)app.track("journey_complete","journey")}
  this.setData({journey:next||app.getJourneyView()})
 },
 openSummary(){const summary=this.data.journey&&this.data.journey.summary;if(summary)wx.navigateTo({url: getApp().getCardPath(summary)})},
 openHome(){wx.switchTab({url:"/pages/home/home"})},
 openWeekly(){wx.navigateTo({url:"/pages/weekly/weekly"})},
 openDetail(){const card=this.data.journey&&this.data.journey.card;if(card)wx.navigateTo({url:getApp().getCardPath(card)})},
 onShareAppMessage(){const summary=this.data.journey&&this.data.journey.summary;return summary?{title:"我完成了七日星光旅程",path:getApp().getSharePath(summary)}:{title:"一起走七日星光旅程",path:"/pages/journey/journey"}}
})
