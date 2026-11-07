Page({
 data:{phase:"ready",result:null,context:null,signs:[],face:1,reduced:false,isFavorite:false,error:"",invalid:false},
 onLoad(query){
  this.alive=true;const app=getApp();let context=null
  if(query&&query.local){let id;try{id=decodeURIComponent(query.local)}catch(e){this.setData({invalid:true,error:"这组星图的链接不完整，请重新打开。"});return}context=app.findLocalCard(id);if(!context||context.type!=="pair"){this.setData({invalid:true,error:"暂时找不到这组星图，请从双人结果重新进入。"});return}}
  else if(query&&query.type){context=app.resolveCard(query);if(!context||context.type!=="pair"){this.setData({invalid:true,error:"这组双人星图暂时无法还原。"});return}}
  this.setData({context,signs:context?[context.pair.signA,context.pair.signB]:[app.getCardIdentity()]})
 },
 onShow(){this.setData({reduced:getApp().getPreferences().reducedMotion});if(this.data.result)this.setData({isFavorite:getApp().isFavorite(this.data.result.id)})},
 onHide(){clearTimeout(this.timer);if(this.data.result)this.setData({phase:"revealed"})},
 onUnload(){this.alive=false;clearTimeout(this.timer)},
 roll(){if(this.data.phase==="rolling"||this.data.invalid)return;try{const card=getApp().rollDice(this.data.context);this.setData({result:card,face:card.face,phase:this.data.reduced?"revealed":"rolling",isFavorite:getApp().isFavorite(card.id),error:""});if(wx.pageScrollTo)wx.pageScrollTo({scrollTop:0,duration:0});if(!this.data.reduced)this.timer=setTimeout(()=>{if(this.alive)this.setData({phase:"revealed"})},1950)}catch(e){this.setData({error:"这次结果没有保存，请再试一次。"})}},
 skip(){clearTimeout(this.timer);if(this.data.result)this.setData({phase:"revealed"})},
 save(){try{this.setData({isFavorite:getApp().toggleFavorite(this.data.result)});getApp().track("favorite_toggle","dice")}catch(e){this.setData({error:e.message||"收藏未保存，请重试"})}},
 poster(){wx.navigateTo({url:getApp().getCardPath(this.data.result).replace("/pages/detail/detail","/pages/poster/poster")})},
 share(){getApp().openSharePreview(this.data.result)},
 pair(){wx.navigateTo({url:"/pages/pair/pair"})},
 onShareAppMessage(){return this.data.result?{title:this.data.result.pair?"我摇到了这个小约定，要不要一起试试？":"摇出今天的小幸运",path:getApp().getSharePath(this.data.result)}:{title:"把一点好运，变成今天的小行动",path:"/pages/dice/dice"}}
})
