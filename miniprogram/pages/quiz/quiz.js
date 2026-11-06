const quiz=require("../../data/quiz")
Page({
  data:{title:quiz.title,total:quiz.questions.length,index:0,started:false,answers:[],question:quiz.questions[0],selected:-1,draft:null,draftSaved:true},
  onLoad(query){if(query&&query.from==="share")getApp().track("share_open","quiz")},
  onShow(){if(!this.data.started)this.setData({draft:getApp().getQuizDraft()})},
  onHide(){if(this.data.started&&!this.finishing)this.persist()},
  start(){const draft=getApp().getQuizDraft();if(draft){this.setData({started:true,answers:draft.answers.slice(),index:draft.index,question:quiz.questions[draft.index],selected:draft.answers[draft.index]===undefined?-1:draft.answers[draft.index],draftSaved:true})}else{getApp().track("quiz_start","quiz");this.setData({started:true,answers:[],index:0,question:quiz.questions[0],selected:-1})}},
  restart(){wx.showModal({title:"重新开始测试？",content:"上次未完成的答案将被清除。",success:result=>{if(!result.confirm)return;try{getApp().clearQuizDraft();this.setData({draft:null,answers:[],index:0,started:false,selected:-1,question:quiz.questions[0]});this.start()}catch(error){wx.showToast({title:"未能重新开始，请重试",icon:"none"})}}})},
  persist(){try{getApp().saveQuizDraft(this.data.answers,this.data.index);this.setData({draftSaved:true})}catch(error){this.setData({draftSaved:false})}},
  choose(event){const value=Number(event.currentTarget.dataset.index);if(!Number.isInteger(value)||value<0||value>3)return;const answers=this.data.answers.slice();answers[this.data.index]=value;this.setData({answers,selected:value});this.persist()},
  previous(){if(this.data.index>0)this.move(this.data.index-1)},
  move(index){this.setData({index,question:quiz.questions[index],selected:this.data.answers[index]===undefined?-1:this.data.answers[index]});this.persist()},
  next(){
    if(this.data.selected<0)return
    if(this.data.index<this.data.total-1){this.move(this.data.index+1);return}
    if(this.finishing)return
    this.finishing=true
    try{const card=getApp().finishQuiz(this.data.answers);wx.navigateTo({url:getApp().getCardPath(card),success:()=>{try{getApp().clearQuizDraft()}catch(error){console.warn("草稿清理失败",error)}this.setData({started:false,index:0,answers:[],draft:null,question:quiz.questions[0],selected:-1})},fail:()=>wx.showToast({title:"结果已保存，可在卡册查看",icon:"none"}),complete:()=>{this.finishing=false}})}catch(error){this.finishing=false;wx.showToast({title:"结果保存失败，请重试",icon:"none"})}
  },
  onShareAppMessage(){getApp().track("share_intent","quiz");return{title:quiz.title,path:"/pages/quiz/quiz?from=share"}}
})
