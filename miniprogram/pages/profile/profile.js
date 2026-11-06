const {getArt}=require("../../data/sign-art")
Page({
 data:{selectedSign:"双鱼座",selectedIndex:11,signNames:[],streak:0,favoriteCount:0,drawCount:0,reducedMotion:false,quizDraft:null},
 onShow(){const app=getApp();app.recordVisit();const selectedSign=app.globalData.selectedSign,signNames=app.globalData.zodiacSigns.map(item=>item.name);this.setData({selectedSign,selectedIndex:signNames.indexOf(selectedSign),signNames,streak:app.getStreak(),favoriteCount:app.getFavorites().length,drawCount:app.getHistory().length,reducedMotion:app.getPreferences().reducedMotion,quizDraft:app.getQuizDraft(),dateRange:app.getSignData(selectedSign).dateRange,latin:getArt(selectedSign).latin,glyph:getArt(selectedSign).symbol+"︎"})},
 chooseSign(event){const selectedIndex=Number(event.detail.value),selectedSign=this.data.signNames[selectedIndex];if(!selectedSign)return;try{getApp().setSelectedSign(selectedSign);this.onShow();wx.showToast({title:"星座已更新",icon:"success"})}catch(error){wx.showToast({title:"未能保存星座，请重试",icon:"none"})}},
 changeMotion(event){try{getApp().setReducedMotion(event.detail.value);this.setData({reducedMotion:event.detail.value})}catch(error){this.setData({reducedMotion:getApp().getPreferences().reducedMotion});wx.showToast({title:"设置未保存，请重试",icon:"none"})}},
 openQuiz(){wx.navigateTo({url:"/pages/quiz/quiz"})},
 openCollection(){wx.switchTab({url:"/pages/collection/collection"})},
 openResearch(){wx.navigateTo({url:"/pages/research/research"})},
 openPrivacy(){wx.navigateTo({url:"/pages/about/about"})}
})
