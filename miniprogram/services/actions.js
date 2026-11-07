const MAX_RECORDS=60
const STATUSES=["saved","done","later"]
function clean(value,max=180){return typeof value==="string"?value.replace(/[\u0000-\u001f\u007f]/g,"").trim().slice(0,max):""}
function normalize(record){
 if(!record||typeof record!=="object"||!clean(record.id)||!clean(record.type)||!/^\d{4}-\d{2}-\d{2}$/.test(record.date)||!STATUSES.includes(record.status))return null
 return{id:clean(record.id),type:clean(record.type,32),title:clean(record.title,120),advice:clean(record.advice,240),date:record.date,status:record.status,updatedAt:Number(record.updatedAt)||0,completedAt:Number(record.completedAt)||undefined}
}
module.exports={
 getActionRecords(){
  const raw=wx.getStorageSync("actionRecords")
  return(Array.isArray(raw)?raw:[]).map(normalize).filter(Boolean).sort((a,b)=>b.updatedAt-a.updatedAt).slice(0,MAX_RECORDS)
 },
 getRecentActions(){return this.getActionRecords()},
 getAction(cardId){const id=clean(cardId);return this.getActionRecords().find(item=>item.id===id)||null},
 saveAction(card){
  const id=clean(card&&card.id),type=clean(card&&card.type,32),date=clean(card&&card.date,16)
  if(!id||!type||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(date))throw new Error("Invalid action card")
  const previous=this.getAction(id),next={id,type,title:clean(card.title,120),advice:clean(card.advice||card.tip,240),date,status:previous?previous.status:"saved",updatedAt:Date.now(),completedAt:previous&&previous.status==="done"?previous.completedAt:undefined}
  wx.setStorageSync("actionRecords",[next,...this.getActionRecords().filter(item=>item.id!==id)].slice(0,MAX_RECORDS))
  return next
 },
 setActionStatus(cardId,status){
  if(!STATUSES.includes(status))throw new Error("Invalid action status")
  const action=this.getAction(cardId);if(!action)throw new Error("Action not found")
  const next={...action,status,updatedAt:Date.now(),completedAt:status==="done"?Date.now():undefined}
  wx.setStorageSync("actionRecords",[next,...this.getActionRecords().filter(item=>item.id!==action.id)].slice(0,MAX_RECORDS))
  return next
 },
 getLatestAction(){return this.getActionRecords()[0]||null}
}
