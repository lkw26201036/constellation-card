const zodiacSigns = [
  { name: "白羊座", symbol: "♈", dateRange: "3.21 - 4.19", card: { title: "先迈出轻盈的一步", keyword: "行动", summary: "今天适合把想法变成一个小小的开始，速度不用快，但要让自己感受到正在前进。", color: "珊瑚橙", number: "3", tip: "把最想做的事拆成十分钟，先开始就已经很勇敢。" } },
  { name: "金牛座", symbol: "♉", dateRange: "4.20 - 5.20", card: { title: "把喜欢的事留给今天", keyword: "滋养", summary: "熟悉的节奏会给你安全感，也别忘了为自己留一段不被打扰的享受。", color: "奶油黄", number: "6", tip: "一顿好好吃的饭，也可以是今天给自己的礼物。" } },
  { name: "双子座", symbol: "♊", dateRange: "5.21 - 6.21", card: { title: "好奇心正在发光", keyword: "连接", summary: "一个新问题、一段真诚的对话，都会把你带到更开阔的地方。", color: "薄荷绿", number: "5", tip: "把今天遇到的一个新想法记下来，灵感会继续生长。" } },
  { name: "巨蟹座", symbol: "♋", dateRange: "6.22 - 7.22", card: { title: "温柔也有自己的力量", keyword: "安放", summary: "照顾好情绪的边界，先让自己感到安全，再去拥抱外面的世界。", color: "月光白", number: "2", tip: "给重要的人发一句问候，也给自己留一块安静空间。" } },
  { name: "狮子座", symbol: "♌", dateRange: "7.23 - 8.22", card: { title: "你的光不需要证明", keyword: "自信", summary: "今天可以放心表达真实的想法，你的存在本身就值得被看见。", color: "日落金", number: "1", tip: "穿一件让你心情变好的衣服，带着光出门。" } },
  { name: "处女座", symbol: "♍", dateRange: "8.23 - 9.22", card: { title: "慢慢整理，就会清晰", keyword: "秩序", summary: "不必一次解决所有问题，先收拾眼前的一小块，答案会逐渐浮现。", color: "雾灰蓝", number: "4", tip: "完成一件最小的待办，再给自己一个短暂的休息。" } },
  { name: "天秤座", symbol: "♎", dateRange: "9.23 - 10.23", card: { title: "把平衡还给自己", keyword: "选择", summary: "别让所有人的期待都占满今天，留一点空间给真正让你舒服的决定。", color: "玫瑰粉", number: "7", tip: "面对选择时，先问自己什么会让心里松一口气。" } },
  { name: "天蝎座", symbol: "♏", dateRange: "10.24 - 11.22", card: { title: "深处的答案正在醒来", keyword: "直觉", summary: "你比想象中更了解自己的感受，安静下来，就能听见内心的方向。", color: "莓果红", number: "9", tip: "相信第一秒出现的感受，再用时间验证它。" } },
  { name: "射手座", symbol: "♐", dateRange: "11.23 - 12.21", card: { title: "去看一眼更远的地方", keyword: "探索", summary: "今天适合换一条路、学一点新东西，轻微的变化会带来新鲜能量。", color: "湖水蓝", number: "8", tip: "给自己安排一次小小的探索，不必等到完美时机。" } },
  { name: "摩羯座", symbol: "♑", dateRange: "12.22 - 1.19", card: { title: "稳稳地走，也会到达", keyword: "积累", summary: "你正在做的努力不会消失，今天只需要守住一个清晰而可行的节奏。", color: "岩石灰", number: "10", tip: "记录今天完成的一件事，让进步变得可见。" } },
  { name: "水瓶座", symbol: "♒", dateRange: "1.20 - 2.18", card: { title: "让新鲜想法透口气", keyword: "创造", summary: "不一样的想法值得被保留，先写下来，再决定它要走向哪里。", color: "电光紫", number: "11", tip: "把一个奇怪但有趣的点子写进备忘录。" } },
  { name: "双鱼座", symbol: "♓", dateRange: "2.19 - 3.20", card: { title: "把今天过成柔软的光", keyword: "松弛感", summary: "今天适合放慢一点，在熟悉的节奏里找到自己的答案。", color: "雾蓝色", number: "7", tip: "把注意力放回当下，答案会在你愿意停下来的时候出现。" } }
]

const oracleCards = [
  { id: "oracle-01", title: "月光里的回声", keyword: "倾听", text: "今天适合听见内心真实的声音，给重要的关系留一点温柔的空间。", advice: "先照顾好自己的感受，再回应外界的期待。" },
  { id: "oracle-02", title: "长风经过窗前", keyword: "变化", text: "一个看似突然的变化，可能正在帮你打开新的视野。", advice: "不必马上做决定，先允许自己看看风往哪里吹。" },
  { id: "oracle-03", title: "藏在口袋里的星星", keyword: "好运", text: "一个小小的好消息正在靠近，保持轻松，别错过细节里的惊喜。", advice: "今天主动说一句谢谢，好运会因为分享而变亮。" },
  { id: "oracle-04", title: "一盏未熄的灯", keyword: "坚持", text: "你已经走了很远，眼前这一步只需要继续保持自己的节奏。", advice: "把任务缩小到下一步，完成就值得庆祝。" },
  { id: "oracle-05", title: "雨后的透明天空", keyword: "释怀", text: "有些情绪正在慢慢退潮，给自己一点时间，心会重新变得开阔。", advice: "今天不追问结果，先让自己好好呼吸。" },
  { id: "oracle-06", title: "穿过森林的路", keyword: "勇气", text: "你不需要看清全部终点，脚下的路会在每一次选择后变得明亮。", advice: "做一个对未来的自己更友善的决定。" },
  { id: "oracle-07", title: "两颗靠近的星", keyword: "回应", text: "真诚的表达会带来真诚的回声，今天适合把想说的话说清楚。", advice: "少一点猜测，多一次温和而直接的沟通。" },
  { id: "oracle-08", title: "午后的一页书", keyword: "沉淀", text: "暂时离开喧闹，你会重新发现自己真正想要的东西。", advice: "给自己留出二十分钟，不被任何消息打断。" },
  { id: "oracle-09", title: "潮汐带来的贝壳", keyword: "收获", text: "过去的经历正在变成今天的经验，你会比想象中更有准备。", advice: "回头看看已经完成的事，再出发会更有底气。" },
  { id: "oracle-10", title: "清晨的第一束光", keyword: "开始", text: "新的能量正在聚集，适合为自己设定一个轻盈而明确的目标。", advice: "今天只完成一件重要的事，也足够让生活向前。" },
  { id: "oracle-11", title: "风停之后的湖面", keyword: "稳定", text: "外界的声音会慢慢变小，你正在找回属于自己的判断。", advice: "不要用别人的速度衡量自己的进度。" },
  { id: "oracle-12", title: "远方寄来的明信片", keyword: "期待", text: "一个新的可能正在路上，保持好奇，也保持对自己的信任。", advice: "把想去的地方或想做的事写下来，给未来留个坐标。" }
]

function pad(value) {
  return String(value).padStart(2, "0")
}

function getDateInfo(date = new Date()) {
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  return {
    key: `${year}-${month}-${day}`,
    label: `${year}年${Number(month)}月${Number(day)}日`
  }
}

const dailyContent = require("./data/daily")
function validDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const timestamp = Date.parse(value + "T00:00:00Z")
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value
}

const explore = require("./services/explore")
const research = require("./services/research")
const preferences = require("./services/preferences")

App({
  ...explore,
  ...research,
  ...preferences,
  globalData: { selectedSign: null, launchAnimationSeen: false, zodiacSigns, oracleCards },
  onLaunch() {
    this.getSelectedSign()
    this.recordVisit()
  },
  onShow() { this.recordVisit(); this.track("app_open") },
  readArray(key) { const value = wx.getStorageSync(key); return Array.isArray(value) ? value : [] },
  isZodiac(sign) { return zodiacSigns.some(item => item.name === sign) },
  isCardIdentity(sign) { return sign === "通用" || this.isZodiac(sign) },
  getSelectedSign() {
    const stored = wx.getStorageSync("selectedSign")
    this.globalData.selectedSign = this.isZodiac(stored) ? stored : null
    return this.globalData.selectedSign
  },
  getCardIdentity() { return this.getSelectedSign() || "通用" },
  setSelectedSign(signName) {
    if (!zodiacSigns.some(item => item.name === signName)) return
    wx.setStorageSync("selectedSign", signName)
    this.globalData.selectedSign = signName
  },
  getSignData(signName = this.getSelectedSign()) {
    return zodiacSigns.find(item => item.name === signName) || null
  },
  getDailyCard(signName = this.getCardIdentity(), dateKey = getDateInfo().key) {
    const sign = this.getSignData(signName)
    if (!validDate(dateKey) || !this.isCardIdentity(signName)) return null
    const offset = sign ? zodiacSigns.indexOf(sign) : 0
    const dayIndex = Math.floor(Date.parse(dateKey + "T00:00:00Z") / 86400000)
    const content = dailyContent[((dayIndex + offset) % dailyContent.length + dailyContent.length) % dailyContent.length]
    const parts = dateKey.split("-").map(Number)
    if (!sign) return {
      id: "daily-general-" + dateKey, type: "daily", contentVersion: "u1", sign: "通用", date: dateKey,
      dateLabel: parts[0] + "年" + parts[1] + "月" + parts[2] + "日",
      title: content[0], keyword: content[1], summary: content[2], tip: content[3]
    }
    return {
      id: "daily-" + sign.name + "-" + dateKey, type: "daily", contentVersion: "v1",
      sign: sign.name, symbol: sign.symbol, date: dateKey,
      dateLabel: parts[0] + "年" + parts[1] + "月" + parts[2] + "日", dateRange: sign.dateRange,
      title: content[0], keyword: content[1], summary: content[2], tip: content[3],
      signNote: sign.card.tip, color: sign.card.color,
      number: String(((dayIndex + offset * 3) % 12 + 12) % 12 + 1)
    }
  },
  buildOracle(sourceId, signName, dateKey) {
    const card = oracleCards.find(item => item.id === sourceId)
    if (!card || !validDate(dateKey) || !this.isCardIdentity(signName)) return null
    return { ...card, sourceId, id: sourceId + "-" + signName + "-" + dateKey,
      type: "oracle", contentVersion: "v1", sign: signName, date: dateKey,
      dateLabel: dateKey.replace(/-/g, "/") }
  },
  getTodayDraw() {
    const record = wx.getStorageSync("dailyDraw")
    return record && record.date === getDateInfo().key && record.card && this.buildOracle(record.card.sourceId, record.card.sign, record.date) ? record.card : null
  },
  drawToday() {
    const existing = this.getTodayDraw()
    if (existing) return existing
    const sign = this.getCardIdentity()
    const source = oracleCards[Math.floor(Math.random() * oracleCards.length)]
    const card = this.buildOracle(source.id, sign, getDateInfo().key)
    // 先保存每日结果；后续打开时会修复历史，避免存储中断后重复抽取。
    wx.setStorageSync("dailyDraw", { date: card.date, card })
    this.track("draw_complete","oracle")
    this.addHistory(card)
    return card
  },
  getFavorites() { return this.readArray("favoriteCards") },
  isFavorite(cardId) { return this.getFavorites().some(item => item.id === cardId) },
  toggleFavorite(card) {
    if (!card || !card.id) return false
    const favorites = this.getFavorites()
    const index = favorites.findIndex(item => item.id === card.id)
    if (index >= 0) favorites.splice(index, 1)
    else {
      if (favorites.length >= 50) throw new Error("收藏已满50张，请先移除一些卡片")
      favorites.unshift({ ...card, savedAt: Date.now() })
    }
    wx.setStorageSync("favoriteCards", favorites)
    return index < 0
  },
  getHistory() { return this.readArray("drawHistory") },
  addHistory(card) {
    const history = this.getHistory()
    if (history.some(item => item.id === card.id)) return
    wx.setStorageSync("drawHistory", [{ ...card, drawnAt: Date.now() }, ...history].slice(0, 30))
  },
  recordVisit() {
    const today = getDateInfo().key
    const visits = this.readArray("visitDates").filter(validDate)
    if (!visits.includes(today)) {
      try { wx.setStorageSync("visitDates", [...visits, today].sort().slice(-400)) } catch (error) { console.warn("访问记录未能保存", error) }
    }
  },
  getStreak() {
    const dates = new Set(this.readArray("visitDates"))
    let day = Date.parse(getDateInfo().key + "T00:00:00Z"), streak = 0
    while (dates.has(new Date(day).toISOString().slice(0, 10))) { streak += 1; day -= 86400000 }
    return streak
  },
  getCardPath(card) {
    const sourceId = card.sourceId || (card.id.match(/^oracle-\d+/) || [""])[0]
    if (card.type === "theme" || card.type === "quiz") return "/pages/detail/detail?v=" + card.contentVersion + "&type=" + card.type + "&sign=" + encodeURIComponent(card.sign) + "&date=" + card.date + "&source=" + card.sourceId + (card.type === "theme" ? "&mood=" + card.mood : "")
    return "/pages/detail/detail?v=" + (card.contentVersion || "legacy") + "&type=" + card.type + "&sign=" + encodeURIComponent(card.sign) + "&date=" + card.date + (card.type === "oracle" ? "&source=" + sourceId : "")
  },
  resolveCard(query) {
    let sign
    try { sign = decodeURIComponent(query.sign || "") } catch (error) { return null }
    if (!this.isCardIdentity(sign) || !validDate(query.date)) return null
    if (query.type === "theme") return query.v === "t1" ? this.buildTheme(query.source,sign,query.date,query.mood) : null
    if (query.type === "quiz") return query.v === "q1" ? this.buildQuiz(query.source,sign,query.date) : null
    if (query.type === "daily" && query.v === "u1") return sign === "通用" ? this.getDailyCard(sign, query.date) : null
    if (query.v !== "v1" && query.v !== "legacy") return null
    if (query.type === "daily") {
      if (!this.isZodiac(sign)) return null
      if (query.v === "v1") return this.getDailyCard(sign, query.date)
      const info = this.getSignData(sign)
      return { ...info.card, id: "daily-" + sign + "-" + query.date, type: "daily", sign, symbol: info.symbol, date: query.date, dateLabel: query.date }
    }
    return query.type === "oracle" ? this.buildOracle(query.source, sign, query.date) : null
  }
})
