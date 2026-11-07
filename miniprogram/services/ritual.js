const {cards,roles}=require("../data/arcana")
const answers=require("../data/answers")
const topics=[{id:"all",name:"随心"},{id:"relation",name:"关系沟通"},{id:"work",name:"学习工作"},{id:"growth",name:"自我成长"}]
const byId=id=>cards.find(card=>card.id===id)
function validIds(ids,size){return Array.isArray(ids)&&ids.length===size&&new Set(ids).size===size&&ids.every(id=>!!byId(id))}
module.exports={
 getSpreadTopics(){return topics},
 getArcana(){return cards},
 buildSpread(ids,sign,date,topic="all"){
  if(!validIds(ids,3)||!this.isCardIdentity(sign)||!this.getDailyCard(sign,date)||!topics.some(t=>t.id===topic))return null
  const positions=ids.map((id,index)=>{const card=byId(id);return{...card,role:roles[index],text:card.notes[index],position:index+1}})
  return{id:"spread-s1-"+ids.join(".")+"-"+sign+"-"+date+"-"+topic,type:"spread",contentVersion:"s1",sourceId:ids.join("."),topic,sign,date,dateLabel:date,
   title:positions.map(c=>c.name).join(" · "),keyword:positions.map(c=>c.keyword).join(" / "),positions,
   text:positions.map(c=>c.role+"｜"+c.name+"\n"+c.text).join("\n\n"),
   summaryNote:"把三张牌当作三个观察角度：留意第一张带来的共鸣，读读第二张提出的可能，再从第三张里选一个愿意尝试的动作。无需让每句话都符合自己。",
   advice:positions[2].action}
 },
 getRitualState(){const value=wx.getStorageSync("ritualState");return value&&typeof value==="object"&&!Array.isArray(value)?value:{history:[],counts:{},draft:null}},
 getSpreadHistory(){const state=this.getRitualState();return (Array.isArray(state.history)?state.history:[]).filter(c=>c&&this.buildSpread(String(c.sourceId||"").split("."),c.sign,c.date,c.topic)).slice(0,30)},
 getSpreadDraft(){
  const d=this.getRitualState().draft
  if(!d||d.version!=="s1"||!validIds(d.candidates,7)||!Array.isArray(d.selected)||d.selected.length>3||new Set(d.selected).size!==d.selected.length||!d.selected.every(id=>d.candidates.includes(id))||!topics.some(t=>t.id===d.topic)||!this.isCardIdentity(d.sign)||!this.getDailyCard(d.sign,d.date))return null
  return d
 },
 startSpread(topic="all"){
  if(!topics.some(t=>t.id===topic))throw new Error("请选择有效主题")
  const state=this.getRitualState(),history=this.getSpreadHistory(),recent=new Set(history.slice(0,4).flatMap(c=>c.sourceId.split(".")))
  const eligible=cards.filter((c,i)=>topic==="all"||topic==="relation"&&i>=20&&i<30||topic==="work"&&i>=30&&i<40||topic==="growth"&&(i<20||i>=40))
  const pool=eligible.filter(c=>!recent.has(c.id))
  // 筛选后不足七张时，优先恢复距离上次出现最久的牌。
  if(pool.length<7){const seen=eligible.filter(c=>recent.has(c.id)).sort((a,b)=>history.findIndex(h=>h.sourceId.split(".").includes(b.id))-history.findIndex(h=>h.sourceId.split(".").includes(a.id)));while(pool.length<7&&seen.length)pool.push(seen.shift())}
  const counts=state.counts&&typeof state.counts==="object"?state.counts:{},selected=[]
  while(selected.length<7){const weights=pool.map(c=>1/(1+Math.max(0,Number(counts[c.id])||0))),total=weights.reduce((a,b)=>a+b,0);let target=Math.random()*total,index=weights.length-1;for(let i=0;i<weights.length;i++){target-=weights[i];if(target<0){index=i;break}}selected.push(pool.splice(index,1)[0].id)}
  const draft={version:"s1",topic,sign:this.getCardIdentity(),date:this.getDailyCard().date,candidates:selected,selected:[],startedAt:Date.now()}
  wx.setStorageSync("ritualState",{...state,draft});this.track("spread_start","spread");return draft
 },
 chooseSpread(index){
  const state=this.getRitualState(),draft=this.getSpreadDraft()
  if(!draft||!Number.isInteger(index)||index<0||index>6)throw new Error("请重新展开牌阵")
  const id=draft.candidates[index],selected=draft.selected.slice(),at=selected.indexOf(id)
  if(at>=0)selected.splice(at,1);else if(selected.length<3)selected.push(id);else return draft
  const next={...draft,selected};wx.setStorageSync("ritualState",{...state,draft:next});return next
 },
 completeSpread(){
  const state=this.getRitualState(),draft=this.getSpreadDraft()
  if(!draft)throw new Error("请先展开牌阵")
  const card=this.buildSpread(draft.selected,draft.sign,draft.date,draft.topic)
  if(!card)throw new Error("请先选择三张牌")
  const counts={};cards.forEach(c=>{counts[c.id]=Math.max(0,Number(state.counts&&state.counts[c.id])||0)+(draft.selected.includes(c.id)?1:0)})
  const saved={...card,drawnAt:Date.now()},history=[saved,...this.getSpreadHistory().filter(c=>c.id!==card.id)].slice(0,30)
  // 一次存储提交结果、避重频次并清空草稿，失败时允许原样重试。
  wx.setStorageSync("ritualState",{history,counts,draft:null,lastResult:saved});this.track("spread_complete","spread");return card
 },
 getLastSpread(){const c=this.getRitualState().lastResult;return c&&this.buildSpread(String(c.sourceId||"").split("."),c.sign,c.date,c.topic)?c:null},
 buildAnswer(number,sign,date){
  if(!Number.isInteger(number)||number<1||number>200||!this.isCardIdentity(sign)||!this.getDailyCard(sign,date))return null
  const row=answers[number-1];if(!row)return null
  return{id:"book-b1-"+number,type:"book",contentVersion:"b1",sourceId:String(number),number,sign,date,dateLabel:date,title:row.title,keyword:"第 "+String(number).padStart(3,"0")+" 页",text:row.answer,advice:row.action}
 },
 getAnswerHistory(){return this.readArray("answerHistory").filter(c=>c&&this.buildAnswer(c.number,c.sign,c.date)).slice(0,30)},
 openAnswer(number){const card=this.buildAnswer(number,this.getCardIdentity(),this.getDailyCard().date);if(!card)throw new Error("请选择1—200之间的整数");wx.setStorageSync("answerHistory",[{...card,drawnAt:Date.now()},...this.getAnswerHistory().filter(c=>c.number!==number)].slice(0,30));this.track("book_open","book");return card},
 randomAnswerNumber(){const recent=new Set(this.getAnswerHistory().slice(0,15).map(c=>c.number)),choices=answers.map(a=>a.number).filter(n=>!recent.has(n));return choices[Math.floor(Math.random()*choices.length)]}
}
