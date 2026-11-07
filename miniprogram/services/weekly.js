const {themes}=require("../data/weekly")
const pad=value=>String(value).padStart(2,"0")
function validKey(value){return typeof value==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value+"T00:00:00Z"))}
function keyFrom(value){if(typeof value==="string"&&validKey(value))return value;const date=value instanceof Date?value:new Date(value||Date.now());return date.getUTCFullYear()+"-"+pad(date.getUTCMonth()+1)+"-"+pad(date.getUTCDate())}
function addDays(key,amount){const d=new Date(key+"T00:00:00Z");d.setUTCDate(d.getUTCDate()+amount);return d.getUTCFullYear()+"-"+pad(d.getUTCMonth()+1)+"-"+pad(d.getUTCDate())}
function isoWeek(key){const d=new Date(key+"T00:00:00Z"),day=(d.getUTCDay()+6)%7;d.setUTCDate(d.getUTCDate()-day+3);const first=new Date(Date.UTC(d.getUTCFullYear(),0,4));return{year:d.getUTCFullYear(),week:1+Math.round((d-first)/604800000)}}
module.exports={
 getWeekKey(date){const value=isoWeek(keyFrom(date));return value.year+"-W"+pad(value.week)},
 getWeekRange(date){const key=keyFrom(date),day=(new Date(key+"T00:00:00Z").getUTCDay()+6)%7,start=addDays(key,-day),end=addDays(start,6);return{key:this.getWeekKey(key),start,end,label:start.slice(5).replace("-","/")+" — "+end.slice(5).replace("-","/")}},
 getWeeklyTheme(date){const week=isoWeek(keyFrom(date));return themes[((week.year*53+week.week)%themes.length+themes.length)%themes.length]},
 getWeeklyPack(date){const range=this.getWeekRange(date),theme=this.getWeeklyTheme(date);return{theme,cards:theme.cards.map((card,index)=>({...card,id:"weekly-pack-"+range.key+"-"+theme.id+"-"+(index+1),type:"weekly-pack",contentVersion:"w1",date:range.start,dateLabel:range.label,keyword:theme.title,sign:"通用"}))}},
 getWeeklyReview(date){
  const range=this.getWeekRange(date),pack=this.getWeeklyPack(date),packIds=new Set(pack.cards.map(item=>item.id)),actions=this.getActionRecords().filter(item=>item.date>=range.start&&item.date<=range.end),favorites=this.getFavorites().filter(item=>{const stamp=Number(item.savedAt)||0;return stamp>=Date.parse(range.start+"T00:00:00Z")&&stamp<Date.parse(addDays(range.end,1)+"T00:00:00Z")})
  const visits=this.readArray("visitDates").filter(item=>item>=range.start&&item<=range.end)
  return{...range,theme:pack.theme,pack,packActionCount:actions.filter(item=>packIds.has(item.id)).length,packDoneCount:actions.filter(item=>packIds.has(item.id)&&item.status==="done").length,actionCount:actions.length,doneCount:actions.filter(item=>item.status==="done").length,favoriteCount:favorites.length,visitCount:new Set(visits).size,recentActions:actions.slice(0,3)}
 }
}
