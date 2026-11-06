const {getArt}=require("../../data/sign-art")
Page({
  data:{selectedSign:"双鱼座",selectedIndex:11,signNames:[],card:{},isFavorite:false,cardAnimating:false,signChosen:false,quizDraft:null,themes:[]},
  onLoad(query){let sign;try{sign=decodeURIComponent((query&&query.sign)||"")}catch(error){return}if(getApp().globalData.zodiacSigns.some(item=>item.name===sign))getApp().setSelectedSign(sign)},
  onShow(){this.refreshCard();getApp().track("home_view","home")},
  onUnload(){clearTimeout(this.animationTimer)},
  refreshCard(){
    const app=getApp(),selectedSign=app.globalData.selectedSign,signNames=app.globalData.zodiacSigns.map(item=>item.name),card=app.getDailyCard(selectedSign)
    this.setData({selectedSign,selectedIndex:signNames.indexOf(selectedSign),signNames,card,dateLabel:card.dateLabel,isFavorite:app.isFavorite(card.id),glyph:getArt(selectedSign).symbol+"︎",signChosen:!!wx.getStorageSync("selectedSign"),quizDraft:app.getQuizDraft(),themes:app.getThemes()})
  },
  chooseSign(event){
    const index=Number(event.detail.value);if(!Number.isInteger(index)||!this.data.signNames[index])return
    try{getApp().setSelectedSign(this.data.signNames[index]);this.refreshCard();clearTimeout(this.animationTimer);if(!getApp().getPreferences().reducedMotion){this.setData({cardAnimating:true});this.animationTimer=setTimeout(()=>this.setData({cardAnimating:false}),180)}}catch(error){wx.showToast({title:"未能保存星座，请重试",icon:"none"})}
  },
  openQuiz(){wx.navigateTo({url:"/pages/quiz/quiz"})},
  openDraw(){wx.switchTab({url:"/pages/draw/draw"})},
  openTheme(event){const id=event.currentTarget.dataset.id;if(!this.data.themes.some(item=>item.id===id))return;getApp().globalData.pendingDrawMode=null;getApp().globalData.pendingTheme=id;wx.switchTab({url:"/pages/draw/draw"})},
  openDetail(){wx.navigateTo({url:getApp().getCardPath(this.data.card)})},
  saveCard(){try{const isFavorite=getApp().toggleFavorite(this.data.card);this.setData({isFavorite});wx.showToast({title:isFavorite?"已收藏":"已取消收藏",icon:"success"})}catch(error){wx.showToast({title:error.message||"保存失败，请重试",icon:"none"})}},
  onShareAppMessage(){return{title:this.data.selectedSign+"的今日卡｜"+this.data.card.title,path:getApp().getSharePath(this.data.card)}}
})
