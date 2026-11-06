Page({
  data:{mode:"daily",selectedSign:"通用",themes:[],moods:[],themeId:"relation",moodId:"calm",phase:"ready",choice:-1,result:{},isRevealed:false,isDrawing:false,isFavorite:false,motion:true},
  onLoad(){this.setData({themes:getApp().getThemes(),moods:getApp().getMoods()})},
  onShow(){
    const app=getApp(),pending=app.globalData.pendingTheme
    this.setData({motion:!app.getPreferences().reducedMotion})
    if(app.globalData.pendingDrawMode==="daily"){app.globalData.pendingDrawMode=null;app.globalData.pendingTheme=null;this.setData({mode:"daily"});this.refreshResult();return}
    if(app.getThemes().some(item=>item.id===pending)){app.globalData.pendingTheme=null;this.setData({mode:"free",themeId:pending});this.reset();return}
    if(this.data.mode==="daily") this.refreshResult()
    else { const sign=getApp().getCardIdentity(); if(sign!==this.data.selectedSign) this.reset(); else if(this.data.result.id) this.setData({phase:"revealed",isRevealed:true,isDrawing:false,isFavorite:getApp().isFavorite(this.data.result.id)}) }
  },
  onHide(){clearTimeout(this.drawTimer);if(this.data.isDrawing)this.setData({isDrawing:false,phase:this.data.result.id?"revealed":"ready",isRevealed:!!this.data.result.id})},
  onUnload(){clearTimeout(this.drawTimer)},
  refreshResult(){
    const app=getApp(),result=app.getTodayDraw()
    if(result){try{app.addHistory(result)}catch(error){console.warn(error)}}
    this.setData({selectedSign:result?result.sign:app.getCardIdentity(),result:result||{},phase:result?"revealed":"ready",isRevealed:!!result,isDrawing:false,isFavorite:result?app.isFavorite(result.id):false})
  },
  changeMode(event){
    clearTimeout(this.drawTimer)
    this.setData({mode:event.currentTarget.dataset.mode})
    if(this.data.mode==="daily")this.refreshResult();else this.reset()
  },
  changeTheme(event){if(this.data.isDrawing)return;this.setData({themeId:event.currentTarget.dataset.id});this.reset()},
  changeMood(event){if(this.data.isDrawing)return;this.setData({moodId:event.currentTarget.dataset.id});this.reset()},
  reset(){clearTimeout(this.drawTimer);this.setData({phase:"ready",choice:-1,result:{},isRevealed:false,isDrawing:false,isFavorite:false,selectedSign:getApp().getCardIdentity()})},
  shuffle(){
    if(this.data.isDrawing)return
    if(!this.data.motion){this.setData({phase:"selecting"});return}
    this.setData({phase:"shuffling",isDrawing:true})
    this.drawTimer=setTimeout(()=>this.setData({phase:"selecting",isDrawing:false}),480)
  },
  skip(){clearTimeout(this.drawTimer);this.setData({motion:false,phase:this.data.result.id?"revealed":"selecting",isDrawing:false,isRevealed:!!this.data.result.id})},
  pick(event){
    if(this.data.phase!=="selecting" || this.data.isDrawing)return
    try{
      const app=getApp(),result=this.data.mode==="daily"?app.drawToday():app.drawTheme(this.data.themeId,this.data.moodId)
      this.setData({result,selectedSign:result.sign,choice:Number(event.currentTarget.dataset.index),phase:"flipping",isDrawing:true,isFavorite:app.isFavorite(result.id)})
      if(!this.data.motion){this.setData({phase:"revealed",isRevealed:true,isDrawing:false});return}
      this.drawTimer=setTimeout(()=>{this.setData({phase:"revealed",isRevealed:true,isDrawing:false});wx.vibrateShort({type:"light",fail(){}})},560)
    }catch(error){this.setData({isDrawing:false});wx.showToast({title:"保存未完成，请重试",icon:"none"})}
  },
  openQuiz(){wx.navigateTo({url:"/pages/quiz/quiz"})},
  openDetail(){wx.navigateTo({url:getApp().getCardPath(this.data.result)})},
  saveResult(){try{const isFavorite=getApp().toggleFavorite(this.data.result);this.setData({isFavorite});wx.showToast({title:isFavorite?"已收藏":"已取消收藏",icon:"success"})}catch(error){wx.showToast({title:error.message||"保存失败",icon:"none"})}},
  onShareAppMessage(){return this.data.result.id?{title:"我抽到「"+this.data.result.title+"」，你呢？",path:getApp().getSharePath(this.data.result)}:{title:"来抽一张属于你的卡",path:"/pages/draw/draw"}}
})
