const allowed=["app_open","home_view","draw_complete","quiz_start","quiz_complete","share_intent","share_open","poster_generate","spread_start","spread_complete","book_open","favorite_toggle"]
const sources=["daily","oracle","theme","quiz","home","app","spread","book"]
module.exports={
  researchEnabled(){return wx.getStorageSync("researchEnabled")===true},
  setResearchEnabled(enabled){wx.setStorageSync("researchEnabled",enabled===true)},
  getResearchRows(){return this.readArray("researchDays").filter(row=>row && typeof row.date==="string" && row.counts && typeof row.counts==="object").sort((a,b)=>a.date.localeCompare(b.date))},
  track(name,source="app"){
    if(!this.researchEnabled() || !allowed.includes(name) || !sources.includes(source))return
    try{
      const date=this.getDailyCard().date, rows=this.getResearchRows(), row=rows.find(item=>item.date===date)||{date,counts:{}}
      const key=name+":"+source
      row.counts[key]=(Number(row.counts[key])||0)+1
      wx.setStorageSync("researchDays",[...rows.filter(item=>item.date!==date),row].sort((a,b)=>a.date.localeCompare(b.date)).slice(-30))
    }catch(error){console.warn("本机调研记录未保存",error)}
  },
  getResearchReport(){
    const days=this.getResearchRows(), counts={}
    days.forEach(row=>Object.keys(row.counts).forEach(key=>{if(allowed.includes(key.split(":")[0]) && sources.includes(key.split(":")[1])) counts[key]=(counts[key]||0)+Number(row.counts[key]||0)}))
    const active=days.filter(row=>row.counts["app_open:app"]>0).map(row=>row.date)
    const returns=active.filter(date=>active.includes(new Date(Date.parse(date+"T00:00:00Z")-86400000).toISOString().slice(0,10)))
    return{version:1,scope:"current_device_only",enabled:this.researchEnabled(),activeDays:active.length,nextDayReturns:returns.length,counts,days:days.map(row=>({date:row.date,counts:Object.fromEntries(Object.entries(row.counts).filter(([key])=>allowed.includes(key.split(":")[0])&&sources.includes(key.split(":")[1])))}))}
  },
  getSharePath(card){this.track("share_intent",card.type);return this.getCardPath(card)+"&from=share"},
  getThemeCatalog(){
    const known=[...this.readArray("themeCatalog"),...this.getHistory(),...this.getFavorites()].filter(card=>card && card.type==="theme")
    return known.filter((card,index)=>known.findIndex(item=>item.sourceId===card.sourceId)===index).filter(card=>this.buildTheme(card.sourceId,card.sign,card.date,card.mood)).slice(0,24)
  },
  unlockTheme(card){
    try{const known=this.getThemeCatalog();if(!known.some(item=>item.sourceId===card.sourceId))known.push(card);wx.setStorageSync("themeCatalog",known.slice(0,24))}catch(error){console.warn("卡册进度未保存",error)}
  }
}
