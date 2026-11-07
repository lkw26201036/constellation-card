const responseOptions=[
 {id:"resonate",title:"这句话很像我们",text:"有些默契不需要马上解释，先承认这一刻的共鸣，就已经是一次靠近。",action:"把这份共鸣留给一次真诚的回应。"},
 {id:"begin",title:"我想从这里开始",text:"关系不需要一次走完，找到一个双方都有余力的小入口，就可以慢慢继续。",action:"选一件你们都愿意尝试的小事。"},
 {id:"light",title:"一起试试这个小约定",text:"把星光交给日常，轻轻完成一件具体的事，比急着定义关系更有意义。",action:"向对方发出一个可以轻松拒绝的小邀请。"}
]
Page({
 data:{phase:"loading",pair:null,relationName:"",responseOptions,response:null,echoCard:null,error:""},
 onLoad(query){
  const app=getApp(),card=app.resolveCard(query||{})
  if(!card||card.type!=="pair"){this.setData({phase:"error",error:"这份星光回响链接暂时无法打开，请从双人星图重新进入。"});return}
  const relation=app.getRelations().find(item=>item.id===card.pair.relation)
  this.setData({phase:"ready",pair:card,relationName:relation?relation.name:card.pair.relation})
 },
 choose(event){
  if(this.data.phase!=="ready")return
  const response=this.data.responseOptions.find(item=>item.id===event.currentTarget.dataset.id)
  if(!response)return
  const pair=this.data.pair,echoCard={id:"echo-e1-"+pair.id+"-"+response.id,type:"echo",contentVersion:"e1",sign:pair.sign,date:pair.date,dateLabel:pair.dateLabel,title:"你们的星光回响",keyword:response.title,text:response.text,advice:response.action,pair:{signA:pair.pair.signA,signB:pair.pair.signB,relation:pair.pair.relation},responseId:response.id}
  try{getApp().saveAction(echoCard);this.setData({response,echoCard,phase:"revealed"})}catch(error){this.setData({error:"回应没有保存，请再试一次。"})}
 },
 openPair(){wx.navigateTo({url:"/pages/pair/pair"})},
 onShareAppMessage(){return this.data.pair?{title:"给彼此留一张星光回响",path:getApp().getEchoPath(this.data.pair)}:{title:"来看看你们的星光回响",path:"/pages/pair/pair"}}
})
