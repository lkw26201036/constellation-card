const {getArt}=require("../../data/sign-art")
Page({
  data:{selectedSign:null,selectedIndex:0,signNames:[],card:{},isFavorite:false,cardAnimating:false,signChosen:false,quizDraft:null,themes:[]},
  onShow(){this.refreshCard();getApp().track("home_view","home")},
  onUnload(){clearTimeout(this.animationTimer)},
  refreshCard(){
    const app=getApp(),selectedSign=app.getSelectedSign(),signNames=["请选择星座",...app.globalData.zodiacSigns.map(item=>item.name)],card=app.getDailyCard()
    this.setData({selectedSign,selectedIndex:Math.max(0,signNames.indexOf(selectedSign)),signNames,card,dateLabel:card.dateLabel,isFavorite:app.isFavorite(card.id),glyph:getArt(selectedSign).symbol+"︎",signChosen:!!selectedSign,quizDraft:app.getQuizDraft(),themes:app.getThemes()})
  },
  chooseSign(event){
    const index=Number(event.detail.value);if(!Number.isInteger(index)||index<1||!this.data.signNames[index])return
    try{getApp().setSelectedSign(this.data.signNames[index]);this.refreshCard();clearTimeout(this.animationTimer);if(!getApp().getPreferences().reducedMotion){this.setData({cardAnimating:true});this.animationTimer=setTimeout(()=>this.setData({cardAnimating:false}),180)}}catch(error){wx.showToast({title:"未能保存星座，请重试",icon:"none"})}
  },
  openQuiz(){wx.navigateTo({url:"/pages/quiz/quiz"})},
  openDraw(){wx.switchTab({url:"/pages/draw/draw"})},
  openTheme(event){const id=event.currentTarget.dataset.id;if(!this.data.themes.some(item=>item.id===id))return;wx.navigateTo({url:"/pages/spread/spread?topic="+id})},
  openSpread(){wx.navigateTo({url:"/pages/spread/spread"})},
  openAnswer(){wx.navigateTo({url:"/pages/answer/answer"})},
  openPair(){wx.navigateTo({url:"/pages/pair/pair"})},
  openDice(){wx.navigateTo({url:"/pages/dice/dice"})},
  openDetail(){wx.navigateTo({url:getApp().getCardPath(this.data.card)})},
  saveCard(){try{const isFavorite=getApp().toggleFavorite(this.data.card);this.setData({isFavorite});wx.showToast({title:isFavorite?"已收藏":"已取消收藏",icon:"success"})}catch(error){wx.showToast({title:error.message||"保存失败，请重试",icon:"none"})}},
  onShareAppMessage(){return{title:(this.data.signChosen?this.data.selectedSign+"的今日卡":"今日灵感卡")+"｜"+this.data.card.title,path:getApp().getSharePath(this.data.card)}}
})
