const quiz=require("../../data/quiz")
Page({
 data:{title:quiz.title,total:quiz.questions.length,index:0,started:false,answers:[],question:quiz.questions[0],selected:-1},
 start(){this.setData({started:true})},
 choose(event){const value=Number(event.currentTarget.dataset.index);if(value<0||value>3)return;const answers=this.data.answers.slice();answers[this.data.index]=value;this.setData({answers,selected:value})},
 previous(){if(this.data.index===0)return;this.move(this.data.index-1)},
 move(index){this.setData({index,question:quiz.questions[index],selected:this.data.answers[index]===undefined?-1:this.data.answers[index]})},
 next(){
  if(this.data.selected<0)return
  if(this.data.index<this.data.total-1){this.move(this.data.index+1);return}
  if(this.finishing)return
  this.finishing=true
  try{const card=getApp().finishQuiz(this.data.answers);wx.navigateTo({url:getApp().getCardPath(card),success:()=>{this.setData({started:false,index:0,answers:[],question:quiz.questions[0],selected:-1})},complete:()=>{this.finishing=false}})}catch(error){this.finishing=false;wx.showToast({title:"结果保存失败，请重试",icon:"none"})}
 },
 onShareAppMessage(){return{title:quiz.title,path:"/pages/quiz/quiz"}}
})
