const { themes }=require("../../data/themes")
Page({
 data:{source:"favorites",filter:"all",tabs:[{id:"all",name:"全部"},{id:"daily",name:"每日卡"},{id:"oracle",name:"主签"},{id:"theme",name:"主题卡"},{id:"quiz",name:"测试"}],cards:[],visible:[],history:[],quizHistory:[],gallery:[],unlocked:0},
 onShow(){this.loadData()},
 loadData(){
  const app=getApp(),catalog=app.getThemeCatalog()
  const gallery=[]
  themes.forEach(theme=>theme.cards.forEach((row,index)=>{const sourceId="theme-"+theme.id+"-"+String(index+1).padStart(2,"0"),card=catalog.find(c=>c.sourceId===sourceId);gallery.push({sourceId,themeId:theme.id,label:theme.name,title:card?card.title:"等待遇见",unlocked:!!card,card:card||null})}))
  this.setData({cards:app.getFavorites(),history:app.getHistory(),quizHistory:app.getQuizHistory(),gallery,unlocked:catalog.length})
  this.filterCards()
 },
 chooseSource(event){this.setData({source:event.currentTarget.dataset.id});this.filterCards()},
 chooseFilter(event){this.setData({filter:event.currentTarget.dataset.id});this.filterCards()},
 filterCards(){const list=this.data.source==="favorites"?this.data.cards:[...this.data.history,...this.data.quizHistory].sort((a,b)=>(b.drawnAt||b.completedAt||0)-(a.drawnAt||a.completedAt||0));this.setData({visible:list.filter(card=>this.data.filter==="all"||card.type===this.data.filter)})},
 openCard(event){wx.navigateTo({url:"/pages/detail/detail?local="+encodeURIComponent(event.currentTarget.dataset.id)})},
 openGallery(event){
  const item=this.data.gallery.find(c=>c.sourceId===event.currentTarget.dataset.id)
  if(!item)return
  if(item.card)wx.navigateTo({url:getApp().getCardPath(item.card)})
  else wx.showToast({title:"自由抽卡中可以遇见它",icon:"none"})
 },
 openDraw(){wx.switchTab({url:"/pages/draw/draw"})},
 removeCard(event){const card=this.data.cards.find(item=>item.id===event.currentTarget.dataset.id);if(!card)return;wx.showModal({title:"取消收藏？",content:"卡片会从收藏移除，不会清除已遇见的主题卡进度。",success:result=>{if(!result.confirm)return;try{getApp().toggleFavorite(card);this.loadData()}catch(error){wx.showToast({title:"操作失败，请重试",icon:"none"})}}})}
})
