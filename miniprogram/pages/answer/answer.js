Page({
 data:{value:"",phase:"closed",result:null,error:"",reduced:false,isFavorite:false},
 onLoad(){this.alive=true},
 onShow(){this.setData({reduced:getApp().getPreferences().reducedMotion});if(this.data.result)this.setData({isFavorite:getApp().isFavorite(this.data.result.id)})},
 onHide(){clearTimeout(this.timer);if(this.data.result)this.setData({phase:"open"})},
 onUnload(){this.alive=false;clearTimeout(this.timer)},
 input(event){this.setData({value:event.detail.value,error:""})},
 random(){if(this.data.phase==="opening")return;this.setData({value:String(getApp().randomAnswerNumber()),error:""})},
 open(){
  if(this.data.phase==="opening")return
  const raw=String(this.data.value).trim()
  if(!/^\d{1,3}$/.test(raw)||Number(raw)<1||Number(raw)>200){this.setData({error:"选一个1—200之间的整数，让这一页陪你片刻。"});return}
  try{const card=getApp().openAnswer(Number(raw));if(wx.hideKeyboard)wx.hideKeyboard();this.setData({result:card,value:String(card.number),phase:this.data.reduced?"open":"opening",isFavorite:getApp().isFavorite(card.id),error:""});if(!this.data.reduced)this.timer=setTimeout(()=>{if(this.alive)this.setData({phase:"open"})},1250)}catch(e){this.setData({error:"这页还没有保存，请再试一次。"})}
 },
 skip(){clearTimeout(this.timer);if(this.data.result)this.setData({phase:"open"})},
 reset(){clearTimeout(this.timer);this.setData({phase:"closed",result:null,value:"",error:""},()=>{if(wx.pageScrollTo)wx.pageScrollTo({scrollTop:0,duration:0})})},
 save(){try{this.setData({isFavorite:getApp().toggleFavorite(this.data.result)});getApp().track("favorite_toggle","book")}catch(e){this.setData({error:e.message||"收藏没有保存，请重试"})}},
 poster(){wx.navigateTo({url:getApp().getCardPath(this.data.result).replace("/pages/detail/detail","/pages/poster/poster")})},
 onShareAppMessage(){const c=this.data.result;return c?{title:"我翻到了第"+c.number+"页，你会选哪个数字？",path:getApp().getSharePath(c)}:{title:"心里留一个问题，翻开一页温柔的答案",path:"/pages/answer/answer"}}
})
