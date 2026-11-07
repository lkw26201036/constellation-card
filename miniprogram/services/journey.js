const {days,summary}=require("../data/journey")
const STORAGE_KEY="sevenDayJourney",HISTORY_KEY="journeyHistory",VERSION="j1",STATUSES=["locked","available","saved","later","done"]
const pad=value=>String(value).padStart(2,"0")
function validKey(value){return typeof value==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value+"T00:00:00Z"))}
function keyFrom(value){if(validKey(value))return value;const date=value instanceof Date?value:new Date(value||Date.now());return date.getFullYear()+"-"+pad(date.getMonth()+1)+"-"+pad(date.getDate())}
function addDays(key,amount){const date=new Date(key+"T00:00:00Z");date.setUTCDate(date.getUTCDate()+amount);return date.getUTCFullYear()+"-"+pad(date.getUTCMonth()+1)+"-"+pad(date.getUTCDate())}
function diffDays(start,end){return Math.floor((Date.parse(end+"T00:00:00Z")-Date.parse(start+"T00:00:00Z"))/86400000)}
function emptyView(){return{started:false,completed:false,journeyId:"",startDate:"",currentDay:0,completedDays:0,days:[],card:null,summary:null,nextUnlockDate:""}}
function normalize(raw){
 if(!raw||typeof raw!=="object"||raw.version!==VERSION||!validKey(raw.startDate)||!Array.isArray(raw.days)||raw.days.length!==days.length)return null
 const normalized=raw.days.map((item,index)=>item&&item.day===index+1&&item.id===days[index].id&&STATUSES.includes(item.status)?{day:item.day,id:item.id,status:item.status,completedAt:Number(item.completedAt)||0}:null)
 if(normalized.some(item=>!item))return null
 return{version:VERSION,journeyId:typeof raw.journeyId==="string"&&raw.journeyId?raw.journeyId:"journey-"+raw.startDate,startDate:raw.startDate,days:normalized,lastProgressDate:validKey(raw.lastProgressDate)?raw.lastProgressDate:"",completedAt:Number(raw.completedAt)||0}
}
function cardFor(startDate,day,date,journeyId){
 const content=days[day-1];if(!content||!validKey(startDate)||!validKey(date))return null
 return{id:(journeyId||"journey-"+startDate)+"-"+content.id,sourceId:content.id,type:"journey-day",contentVersion:VERSION,journeyId:journeyId||"journey-"+startDate,startDate,day,date,dateLabel:date,title:content.title,keyword:"七日星光",summary:content.text,text:content.text,advice:content.advice,sign:"通用"}
}
module.exports={
 getJourneyHistory(){const raw=wx.getStorageSync(HISTORY_KEY);return(Array.isArray(raw)?raw:[]).filter(item=>item&&item.type==="journey"&&item.contentVersion===VERSION).slice(0,5)},
 getJourneyView(date){
  const state=normalize(wx.getStorageSync(STORAGE_KEY));if(!state)return emptyView()
  const today=keyFrom(date),elapsed=Math.max(0,diffDays(state.startDate,today)),scheduled=Math.min(days.length,elapsed+1),completedDays=state.days.filter(item=>item.status==="done").length
  if(completedDays===days.length){const completedDate=state.completedAt?keyFrom(new Date(state.completedAt)):addDays(state.startDate,days.length-1);return{started:true,completed:true,journeyId:state.journeyId,startDate:state.startDate,currentDay:days.length,completedDays,days:state.days.map(item=>({...item,title:days[item.day-1].title})),card:null,summary:this.getJourneySummary(state.startDate,completedDate,state.journeyId),nextUnlockDate:""}}
  const pending=state.days.find(item=>item.status!=="done"),pendingDay=pending?pending.day:days.length
  const blockedByToday=state.lastProgressDate===today
  const canOpen=pendingDay<=scheduled&&!blockedByToday
  if(pending&&pending.status==="locked"&&canOpen){pending.status="available";wx.setStorageSync(STORAGE_KEY,state)}
  const card=canOpen?cardFor(state.startDate,pendingDay,today,state.journeyId):null
  return{started:true,completed:false,journeyId:state.journeyId,startDate:state.startDate,currentDay:pendingDay,completedDays,days:state.days.map(item=>({...item,title:days[item.day-1].title})),card,summary:null,nextUnlockDate:card?"":blockedByToday?addDays(today,1):addDays(state.startDate,pendingDay-1)}
 },
 startJourney(date){
  const existing=normalize(wx.getStorageSync(STORAGE_KEY));if(existing&&existing.completedAt===0)return existing
  if(existing&&existing.completedAt){const completedDate=keyFrom(new Date(existing.completedAt));const summaryCard=this.getJourneySummary(existing.startDate,completedDate,existing.journeyId);wx.setStorageSync(HISTORY_KEY,[summaryCard,...this.getJourneyHistory().filter(item=>item.id!==summaryCard.id)].slice(0,5))}
  const startDate=keyFrom(date),sequence=Number(wx.getStorageSync("journeySequence"))||0,nextSequence=sequence+1;wx.setStorageSync("journeySequence",nextSequence);const journeyId=sequence===0&&!existing?"journey-"+startDate:"journey-"+startDate+"-"+nextSequence,state={version:VERSION,journeyId,startDate,days:days.map((item,index)=>({day:index+1,id:item.id,status:index===0?"available":"locked",completedAt:0})),lastProgressDate:"",completedAt:0}
  wx.setStorageSync(STORAGE_KEY,state);return state
 },
 syncJourneyAction(action){
  const state=normalize(wx.getStorageSync(STORAGE_KEY));if(!state||!action||typeof action.id!=="string")return null
  const index=state.days.findIndex(item=>(state.journeyId+"-"+item.id)===action.id);if(index<0||!STATUSES.includes(action.status))return null
  const today=validKey(action.date)?action.date:keyFrom(),view=this.getJourneyView(today)
  if(!view.card||view.card.id!==action.id)return this.getJourneyView(today)
  const target=state.days[index]
  if(action.status==="done"){
   if(target.status==="done")return this.getJourneyView(today)
   target.status="done";target.completedAt=Number(action.completedAt)||Date.now();state.lastProgressDate=today
   if(index===days.length-1)state.completedAt=target.completedAt
  }else target.status=action.status
  wx.setStorageSync(STORAGE_KEY,state);return this.getJourneyView(today)
 },
 getJourneyCard(startDate,day,date){return cardFor(startDate,day,keyFrom(date))},
 getJourneySummary(startDate,completedDate,journeyId){
  const start=keyFrom(startDate),completed=validKey(completedDate)?completedDate:addDays(start,days.length-1)
  const id=journeyId||"journey-"+start
  return{id:"journey-summary-"+id+"-"+completed,sourceId:id,type:"journey",journeyId:id,contentVersion:VERSION,sign:"通用",date:completed,dateLabel:completed,title:summary.title,keyword:summary.keyword,summary:summary.text,text:summary.text,advice:summary.advice,journey:{journeyId:id,startDate:start,completedDate:completed,days:days.length}}
 },
 getJourneyShareCard(query){
  if(!query||query.v!==VERSION||typeof query.start!=="string"||!validKey(query.start)||!validKey(query.date))return null
  return this.getJourneySummary(query.start,query.date,typeof query.journey==="string"&&query.journey?query.journey:undefined)
 }
}
