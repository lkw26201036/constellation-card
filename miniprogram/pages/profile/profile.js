const {getArt}=require("../../data/sign-art")
Page({
 data:{selectedSign:null,selectedIndex:0,signNames:[],streak:0,favoriteCount:0,drawCount:0,reducedMotion:false,quizDraft:null},
 onShow(){const app=getApp();app.recordVisit();const selectedSign=app.getSelectedSign(),signNames=["请选择星座",...app.globalData.zodiacSigns.map(item=>item.name)];this.setData({selectedSign,selectedIndex:Math.max(0,signNames.indexOf(selectedSign)),signNames,streak:app.getStreak(),favoriteCount:app.getFavorites().length,drawCount:app.getHistory().length,reducedMotion:app.getPreferences().reducedMotion,quizDraft:app.getQuizDraft(),dateRange:selectedSign?app.getSignData(selectedSign).dateRange:"选择后，为你保留专属星图",latin:getArt(selectedSign).latin,glyph:getArt(selectedSign).symbol+"︎"})},
 chooseSign(event){const selectedIndex=Number(event.detail.value),selectedSign=this.data.signNames[selectedIndex];if(!Number.isInteger(selectedIndex)||selectedIndex<1||!selectedSign)return;try{getApp().setSelectedSign(selectedSign);this.onShow();wx.showToast({title:"星座已更新",icon:"success"})}catch(error){wx.showToast({title:"未能保存星座，请重试",icon:"none"})}},
 changeMotion(event){try{getApp().setReducedMotion(event.detail.value);this.setData({reducedMotion:event.detail.value})}catch(error){this.setData({reducedMotion:getApp().getPreferences().reducedMotion});wx.showToast({title:"设置未保存，请重试",icon:"none"})}},
 openLaunchPreview(){wx.navigateTo({url:"/pages/launch/launch?preview=1"})},
 openQuiz(){wx.navigateTo({url:"/pages/quiz/quiz"})},
 openCollection(){wx.switchTab({url:"/pages/collection/collection"})},
 openResearch(){wx.navigateTo({url:"/pages/research/research"})},
 openPrivacy(){wx.navigateTo({url:"/pages/about/about"})}
})
