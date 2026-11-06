const { themes, moods } = require("../data/themes")
const quiz = require("../data/quiz")
module.exports = {
  getThemes() { return themes.map(({id,name,caption,mark})=>({id,name,caption,mark})) },
  getMoods() { return moods },
  buildTheme(sourceId,sign,date,moodId="calm") {
    const match = /^theme-(relation|work|growth)-(\d{2})$/.exec(sourceId || "")
    const theme = match && themes.find(item=>item.id===match[1])
    const row = theme && theme.cards[Number(match[2])-1]
    const mood = moods.find(item=>item.id===moodId)
    if(!row || !mood || !this.isCardIdentity(sign) || !this.getDailyCard(sign,date)) return null
    return {id:sourceId+"-"+sign+"-"+date+"-"+mood.id,type:"theme",contentVersion:"t1",sourceId,sign,date,dateLabel:date,
      themeId:theme.id,themeLabel:theme.name,mood:mood.id,moodLabel:mood.name,moodNote:mood.note,
      title:row[0],keyword:row[1],text:row[2],advice:row[3]}
  },
  drawTheme(themeId,moodId) {
    const theme=themes.find(item=>item.id===themeId)
    if(!theme || !moods.some(item=>item.id===moodId)) throw new Error("请选择主题和心情")
    const previous=wx.getStorageSync("lastThemePick") || {}
    const choices=theme.cards.map((row,index)=>index).filter(index=>index!==previous[themeId])
    const index=choices[Math.floor(Math.random()*choices.length)]
    const card=this.buildTheme("theme-"+themeId+"-"+String(index+1).padStart(2,"0"),this.getCardIdentity(),this.getDailyCard().date,moodId)
    this.addHistory(card)
    this.unlockTheme(card)
    this.track("draw_complete","theme")
    try { wx.setStorageSync("lastThemePick",{...previous,[themeId]:index}) } catch(error) { console.warn("去重记录未保存",error) }
    return card
  },
  getQuizHistory() { return this.readArray("quizHistory") },
  buildQuiz(sourceId,sign,date) {
    const row=quiz.results.find(item=>item.id===sourceId)
    if(!row || !this.isCardIdentity(sign) || !this.getDailyCard(sign,date)) return null
    return {...row,sourceId,id:"quiz-"+sourceId+"-"+sign+"-"+date,type:"quiz",contentVersion:"q1",sign,date,dateLabel:date,quizTitle:quiz.title}
  },
  finishQuiz(answers) {
    const result=quiz.score(answers)
    if(!result) throw new Error("请完成全部题目")
    const card=this.buildQuiz(result.id,this.getCardIdentity(),this.getDailyCard().date)
    wx.setStorageSync("quizHistory",[{...card,completedAt:Date.now()},...this.getQuizHistory().filter(item=>item.id!==card.id)].slice(0,20))
    this.track("quiz_complete","quiz")
    return card
  },
  findLocalCard(id) { return [...this.getFavorites(),...this.getHistory(),...this.getQuizHistory(),...this.getThemeCatalog()].find(item=>item.id===id) || null }
}
