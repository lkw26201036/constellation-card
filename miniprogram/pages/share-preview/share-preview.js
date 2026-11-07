Page({
 data:{card:null},
 onLoad(query){const app=getApp(),c=app.resolveCard(query);this.setData({card:c?app.publicResult(c):null})},
 back(){wx.navigateBack({delta:1})},
 onShareAppMessage(){const c=this.data.card;return c?{title:c.type==="pair"?"你们的三束星光，会照向哪里？":c.pair?"我摇到了这个小约定，要不要一起试试？":"摇出今天的小方向",path:getApp().getSharePath(c)}:{title:"给今天，一点方向",path:"/pages/home/home"}}
})
