const {makeScene,INTRO_MS,EXIT_MS}=require("./scene")
Page({
 data:{preview:false,reduced:false,running:false,leaving:false,finished:false,error:false,sign:"",signChosen:false,scene:{points:[],lines:[],ticks:[]}},
 onLoad(query){
  this.timers=[];this.disposed=false;this.entering=false;this.navigated=false;this.ready=false;this.visible=true
  const app=getApp(),preview=!!(query&&query.preview==="1"),sign=app.globalData.selectedSign
  this.setData({preview,reduced:app.getPreferences().reducedMotion,sign,signChosen:!!wx.getStorageSync("selectedSign"),scene:makeScene(sign)})
 },
 onReady(){this.ready=true;if(this.visible===false)return;if(!this.data.preview&&getApp().globalData.launchAnimationSeen){this.enter(true);return}this.play()},
 onHide(){this.visible=false;this.clearTimers();this.paused=true;if(!this.navigated){this.entering=false;this.setData({leaving:false})}},
 onShow(){this.visible=true;if(this.ready&&this.paused){this.paused=false;if(this.data.preview)this.play();else this.enter(true)}},
 onUnload(){this.disposed=true;this.clearTimers()},
 clearTimers(){(this.timers||[]).forEach(clearTimeout);this.timers=[]},
 later(run,delay){const id=setTimeout(()=>{if(!this.disposed)run()},delay);this.timers.push(id)},
 play(){
  if(this.entering||this.disposed)return
  this.clearTimers()
  this.setData({running:false,finished:false,error:false,leaving:false},()=>{
   if(this.disposed||this.entering||this.visible===false)return
   if(this.data.reduced){this.setData({running:true,finished:true});if(!this.data.preview)this.enter(true);return}
   this.later(()=>{this.setData({running:true});this.later(()=>{this.setData({finished:true});if(!this.data.preview)this.enter(false)},INTRO_MS)},32)
  })
 },
 enter(immediate){
  if(this.entering||this.navigated||this.disposed)return
  this.entering=true;this.clearTimers()
  if(immediate||this.data.reduced){this.openHome();return}
  this.setData({leaving:true});this.later(()=>this.openHome(),EXIT_MS)
 },
 openHome(){
  if(this.navigated||this.disposed)return
  this.navigated=true
  wx.switchTab({url:"/pages/home/home",success:()=>{if(!this.data.preview)getApp().globalData.launchAnimationSeen=true},fail:()=>{if(this.disposed)return;this.navigated=false;this.entering=false;this.setData({leaving:false,error:true,running:false})}})
 },
 skip(){this.enter(true)},
 replay(){if(this.data.preview)this.play()},
 closePreview(){wx.navigateBack({delta:1,fail:()=>this.enter(true)})},
 swallow(){},
 onShareAppMessage(){return{title:"给今天，一点方向",path:"/pages/home/home"}}
})
