const pairing=require("../data/pairing")
const arcana=require("../data/arcana").cards
const dice=require("../data/dice")
const distinct=(ids,n)=>Array.isArray(ids)&&ids.length===n&&new Set(ids).size===n&&ids.every(id=>arcana.some(c=>c.id===id))
const clean=value=>typeof value==="string"?value.trim().replace(/[\u0000-\u001f\u007f]/g,"").slice(0,24):""
function sample(pool,counts,n){const chosen=[];while(chosen.length<n){const weights=pool.map(c=>1/(1+Math.max(0,Number(counts[c.id])||0))),sum=weights.reduce((a,b)=>a+b,0);let mark=Math.random()*sum,at=pool.length-1;for(let i=0;i<pool.length;i++){mark-=weights[i];if(mark<0){at=i;break}}chosen.push(pool.splice(at,1)[0].id)}return chosen}
module.exports={
 getRelations(){return pairing.relations.map(({id,name})=>({id,name}))},
 normalizePair(input){
  if(!input||!this.isZodiac(input.signA)||!this.isZodiac(input.signB)||!pairing.relations.some(r=>r.id===input.relation))return null
  if(input.gender&&!['same','different'].includes(input.gender))return null
  return{signA:input.signA,signB:input.signB,relation:input.relation,aliasA:clean(input.aliasA),aliasB:clean(input.aliasB),gender:input.gender||""}
 },
 getPairMatch(input){const p=this.normalizePair(input);return p?pairing.matching(p.signA,p.signB,p.relation):null},
 buildPair(ids,input,date){
  const p=this.normalizePair(input);if(!p||!distinct(ids,3)||!this.getDailyCard(p.signA,date))return null
  const match=this.getPairMatch(p),relation=pairing.relations.find(r=>r.id===p.relation)
  const positions=ids.map((id,i)=>{const index=arcana.findIndex(c=>c.id===id),card=arcana[index],note=pairing.pairNotes[index][i];return{...card,position:i+1,role:pairing.roles[i],text:note+relation[['connection','difference','invitation'][i]]+match.dimensions[i].bridge}})
  return{id:"pair-p1-"+ids.join(".")+"-"+p.signA+"-"+p.signB+"-"+p.relation+"-"+date,type:"pair",contentVersion:"p1",sourceId:ids.join("."),sign:p.signA,date,dateLabel:date,pair:p,match,
   title:"你们的三束星光",keyword:relation.name+" · 双人星图",positions,
   text:positions.map(c=>c.role+"｜"+c.name+"\n"+c.text).join("\n\n"),summaryNote:"星座提示是这次探索的背景，三张牌是不同的观察角度。贴合的部分可以留给交流，不贴合的部分也可以轻轻放下。",advice:relation.action+positions[2].action}
 },
 getPairState(){const s=wx.getStorageSync("pairState");return s&&typeof s==="object"&&!Array.isArray(s)?s:{history:[],counts:{},draft:null}},
 getPairHistory(){const s=this.getPairState();return(Array.isArray(s.history)?s.history:[]).filter(c=>c&&this.buildPair(String(c.sourceId||"").split("."),c.pair,c.date)).slice(0,30)},
 getPairDraft(){const d=this.getPairState().draft;if(!d||d.version!=="p1"||!this.normalizePair(d.pair)||!distinct(d.candidates,7)||!Array.isArray(d.selected)||d.selected.length>3||new Set(d.selected).size!==d.selected.length||!d.selected.every(id=>d.candidates.includes(id))||!this.getDailyCard(d.pair.signA,d.date))return null;return d},
 startPair(input){
  const p=this.normalizePair(input);if(!p)throw new Error("请先选择双方星座和关系类型")
  const state=this.getPairState(),recent=new Set(this.getPairHistory().slice(0,4).flatMap(c=>c.sourceId.split("."))),pool=arcana.filter(c=>!recent.has(c.id))
  const draft={version:"p1",pair:p,candidates:sample(pool,state.counts||{},7),selected:[],date:this.getDailyCard().date,startedAt:Date.now()}
  wx.setStorageSync("pairState",{...state,draft});this.track("pair_start","pair");return draft
 },
 choosePair(index){const state=this.getPairState(),d=this.getPairDraft();if(!d||!Number.isInteger(index)||index<0||index>6)throw new Error("请重新展开双人牌阵");const selected=d.selected.slice(),id=d.candidates[index],at=selected.indexOf(id);if(at>=0)selected.splice(at,1);else if(selected.length<3)selected.push(id);else return d;const next={...d,selected};wx.setStorageSync("pairState",{...state,draft:next});return next},
 completePair(){
  const state=this.getPairState(),d=this.getPairDraft();if(!d)throw new Error("请先展开双人牌阵");const card=this.buildPair(d.selected,d.pair,d.date);if(!card)throw new Error("请先选择三张牌")
  const counts={};arcana.forEach(c=>{counts[c.id]=Math.max(0,Number(state.counts&&state.counts[c.id])||0)+(d.selected.includes(c.id)?1:0)})
  const saved={...card,drawnAt:Date.now()};wx.setStorageSync("pairState",{history:[saved,...this.getPairHistory().filter(c=>c.id!==card.id)].slice(0,30),counts,draft:null,lastResult:saved});this.track("pair_complete","pair");return card
 },
 getLastPair(){const c=this.getPairState().lastResult;return c&&this.buildPair(String(c.sourceId||"").split("."),c.pair,c.date)?c:null},
 getDiceFaces(){return dice.faces},
 buildDice(sourceId,sign,date,input=null,origin="",originDate=""){
  if(!this.isCardIdentity(sign)||!this.getDailyCard(sign,date))return null
  const p=input?this.normalizePair(input):null;if(input&&!p||p&&p.signA!==sign)return null
  const row=(p?dice.together:dice.solo).find(c=>c.id===sourceId);if(!row)return null
  const previous=origin&&p?this.buildPair(String(origin).split("."),p,originDate):null
  if(origin&&!previous||!p&&(origin||originDate)||!origin&&originDate)return null
  const face=dice.faces[row.face-1],match=p?this.getPairMatch(p):null,dimension=p?match.dimensions[(row.face-1)%3]:null,r=p?pairing.relations.find(r=>r.id===p.relation):null
  const link=previous?"这次沿着「"+previous.positions[(row.face-1)%3].name+"」的线索，留一个可以尝试的小约定。":""
  return{id:"dice-d1-"+(p?[p.signA,p.signB,p.relation].join("-"):sign)+"-"+sourceId+"-"+date+(origin?"-"+origin+"-"+originDate:""),type:"dice",contentVersion:"d1",sourceId,sign,date,dateLabel:date,
   pair:p,match,origin:origin||"",originDate:originDate||"",face:row.face,faceName:face.name,title:row.title,keyword:face.name+"之面 · "+(p?"你们的小约定":"今天的小幸运"),
   text:face.line+(p?r.lead+dimension.bridge+link:"点数选出行动方向，星座带来视觉陪伴。可以挑一个适合今天的时机，轻轻试一下。"),advice:row.action,linkText:link}
 },
 getDiceState(){const s=wx.getStorageSync("diceState");return s&&typeof s==="object"&&!Array.isArray(s)?s:{history:[],lastResult:null}},
 getDiceHistory(){const s=this.getDiceState();return(Array.isArray(s.history)?s.history:[]).filter(c=>c&&this.buildDice(c.sourceId,c.sign,c.date,c.pair,c.origin,c.originDate)).slice(0,30)},
 rollDice(input=null){
  const pairCard=input&&input.type==="pair"?this.buildPair(String(input.sourceId||"").split("."),input.pair,input.date):null
  if(input&&!pairCard)throw new Error("这组双人星图暂时不可用，请重新展开")
  const state=this.getDiceState(),history=this.getDiceHistory(),pair=pairCard?pairCard.pair:null,face=Math.floor(Math.random()*6)+1
  const recent=new Set(history.filter(c=>!!c.pair===!!pair&&c.face===face).slice(0,3).map(c=>c.sourceId)),rows=(pair?dice.together:dice.solo).filter(c=>c.face===face&&!recent.has(c.id)),row=rows[Math.floor(Math.random()*rows.length)]
  const card=this.buildDice(row.id,pair?pair.signA:this.getCardIdentity(),this.getDailyCard().date,pair,pairCard?pairCard.sourceId:"",pairCard?pairCard.date:"")
  wx.setStorageSync("diceState",{history:[{...card,drawnAt:Date.now()},...history.filter(c=>c.id!==card.id)].slice(0,30),lastResult:card});this.track("dice_roll","dice");return card
 },
 publicResult(card){
  if(!card)return null
  if(card.type==="pair"){const p=card.pair;return this.buildPair(String(card.sourceId).split("."),{signA:p.signA,signB:p.signB,relation:p.relation},card.date)}
  if(card.type==="dice"){const p=card.pair;return this.buildDice(card.sourceId,card.sign,card.date,p?{signA:p.signA,signB:p.signB,relation:p.relation}:null,card.origin,card.originDate)}
  return card
 },
 getEchoPath(card,responseId=""){const base=card&&card.type==="pair"?this.getCardPath(card).replace("/pages/detail/detail","/pages/echo/echo"):"/pages/echo/echo";return responseId?base+"&response="+encodeURIComponent(responseId):base},
 openSharePreview(card){wx.navigateTo({url:this.getCardPath(card).replace("/pages/detail/detail","/pages/share-preview/share-preview")})}
}
