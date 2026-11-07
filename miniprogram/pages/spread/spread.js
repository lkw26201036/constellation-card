Page({
 data:{phase:"ready",draft:null,deck:[],slots:[],result:null,topics:[],topic:"all",topicOpen:false,reduced:false,isFavorite:false,busy:false,error:""},
 onLoad(query){this.timers=[];this.alive=true;const app=getApp(),topic=query&&query.topic;this.requestedTopic=app.getSpreadTopics().some(t=>t.id===topic)?topic:null;this.setData({topics:app.getSpreadTopics(),topic:this.requestedTopic||"all"})},
 onShow(){
  const app=getApp();this.setData({reduced:app.getPreferences().reducedMotion});const draft=app.getSpreadDraft()
  if(this.requestedTopic){const topic=this.requestedTopic;this.requestedTopic=null;if(!draft||draft.topic!==topic){this.setData({phase:"ready",draft:null,result:null,topic,busy:false});return}}
  if(draft){this.showDraft(draft);return}
  if(this.data.result){this.setData({phase:"revealed",busy:false,isFavorite:app.isFavorite(this.data.result.id)});return}
  const last=app.getLastSpread();if(last)this.setData({result:last,phase:"revealed",isFavorite:app.isFavorite(last.id)})
 },
 onHide(){this.clearTimers();if(this.data.result)this.setData({phase:"revealed",busy:false});else if(this.data.draft)this.setData({phase:"selecting",busy:false})},
 onUnload(){this.alive=false;this.clearTimers()},
 clearTimers(){(this.timers||[]).forEach(clearTimeout);this.timers=[]},
 later(fn,ms){this.timers.push(setTimeout(()=>{if(this.alive)fn()},ms))},
 toTop(){if(wx.pageScrollTo)wx.pageScrollTo({scrollTop:0,duration:0})},
 showDraft(draft){
  const cards=getApp().getArcana(),slots=Array.from({length:3},(_,i)=>({index:i,role:["当下的你","可能的走向","给你的指引"][i],card:cards.find(c=>c.id===draft.selected[i])||null}))
  const deck=draft.candidates.map((id,index)=>({id,index,selected:draft.selected.includes(id),order:draft.selected.indexOf(id)+1,angle:(index-3)*8,x:(index-3)*72,y:Math.abs(index-3)*15,delay:index*55}))
  this.setData({draft,deck,slots,topic:draft.topic,phase:"selecting",busy:false,error:""})
 },
 start(){if(this.data.busy)return;try{const d=getApp().startSpread(this.data.topic);this.clearTimers();this.showDraft(d);this.setData({result:null,phase:this.data.reduced?"selecting":"dealing",busy:!this.data.reduced},()=>this.toTop());if(!this.data.reduced)this.later(()=>this.setData({phase:"selecting",busy:false}),1150)}catch(error){this.setData({error:"未能保存这次牌阵，请重试。"})}},
 choose(event){if(this.data.phase!=="selecting"||this.data.busy)return;try{this.showDraft(getApp().chooseSpread(Number(event.currentTarget.dataset.index)))}catch(error){this.setData({error:"选择没有保存，请重试。"})}},
 undo(event){const id=this.data.draft&&this.data.draft.selected[Number(event.currentTarget.dataset.slot)];if(id)this.choose({currentTarget:{dataset:{index:this.data.draft.candidates.indexOf(id)}}})},
 reveal(){
  if(this.data.phase!=="selecting"||this.data.busy)return
  try{const card=getApp().completeSpread();this.clearTimers();this.setData({result:card,isFavorite:getApp().isFavorite(card.id),phase:this.data.reduced?"revealed":"revealing",busy:!this.data.reduced,error:""});if(!this.data.reduced)this.later(()=>this.setData({phase:"revealed",busy:false}),1900)}catch(error){this.setData({error:error.message||"这组牌还没有保存，请重试。"})}
 },
 skip(){this.clearTimers();if(this.data.result)this.setData({phase:"revealed",busy:false});else this.setData({phase:"selecting",busy:false})},
 toggleTopic(){if(!this.data.busy)this.setData({topicOpen:!this.data.topicOpen})},
 chooseTopic(event){if(this.data.busy)return;const topic=event.currentTarget.dataset.id;if(getApp().getSpreadTopics().some(t=>t.id===topic))this.setData({topic,topicOpen:false})},
 save(){try{this.setData({isFavorite:getApp().toggleFavorite(this.data.result)});getApp().track("favorite_toggle","spread")}catch(e){this.setData({error:e.message||"收藏未保存，请重试"})}},
 detail(){wx.navigateTo({url:getApp().getCardPath(this.data.result)})},
 poster(){wx.navigateTo({url:getApp().getCardPath(this.data.result).replace("/pages/detail/detail","/pages/poster/poster")})},
 replay(){if(this.data.result&&!this.data.busy&&!this.data.reduced){this.clearTimers();this.setData({phase:"revealing",busy:true},()=>this.toTop());this.later(()=>this.setData({phase:"revealed",busy:false}),1900)}},
 onShareAppMessage(){return this.data.result?{title:"三张星光，留给此刻的自己",path:getApp().getSharePath(this.data.result)}:{title:"留一个问题在心里，选三张星光",path:"/pages/spread/spread"}}
})
