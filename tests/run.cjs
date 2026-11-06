const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const project = path.resolve(__dirname, '..')
const appCode = fs.readFileSync(path.join(project, 'miniprogram/app.js'), 'utf8')
const daily = require('../miniprogram/data/daily')
let passed = 0
function test(name, run) { run(); passed++; console.log('PASS ' + name) }
function makeApp(initial = {}) {
  const storage = structuredClone(initial)
  let clock = new Date(2026, 10, 7, 12).getTime(), app
  class Clock extends Date { constructor(...args) { super(...(args.length ? args : [clock])) } static now() { return clock } }
  const wx = { removeStorageSync: key => { delete storage[key] }, getStorageSync: key => structuredClone(storage[key]), setStorageSync: (key,value) => { storage[key] = structuredClone(value) } }
  const sandbox={ App: obj => {app=obj}, wx, Date:Clock, console }
  const context=vm.createContext(sandbox), cache={}
  function loadModule(id,parent=path.join(project,'miniprogram/app.js')) {
    const file=path.resolve(path.dirname(parent),id)+'.js'
    if(cache[file])return cache[file].exports
    const mod={exports:{}};cache[file]=mod
    const wrapper=vm.runInContext('(function(module,exports,require){'+fs.readFileSync(file,'utf8')+'\n})',context)
    wrapper(mod,mod.exports,child=>loadModule(child,file))
    return mod.exports
  }
  sandbox.require=id=>loadModule(id)
  vm.runInContext(appCode,context)
  app.onLaunch()
  return {app, storage, wx, setDay: (y,m,d) => {clock = new Date(y,m-1,d,12).getTime()} }
}
function query(card, app, encoded = false) {
  const link = app.getCardPath(card)
  return encoded ? Object.fromEntries(link.split('?')[1].split('&').map(part => part.split('='))) : Object.fromEntries(new URL(link, 'https://test').searchParams)
}
function page(name, app, wx = {}) {
  let result
  vm.runInNewContext(fs.readFileSync(path.join(project, 'miniprogram/pages', name, name+'.js'), 'utf8'), {
    Page: obj => {result=obj}, getApp: () => app, wx, console, setTimeout, clearTimeout, require: id => require(path.join(project,"miniprogram/pages",name,id))
  })
  result.setData = update => Object.assign(result.data, update)
  return result
}
test('12 signs: same date stable; next date changes; 14 daily themes', () => {
  const {app}=makeApp()
  assert.equal(app.globalData.zodiacSigns.length,12)
  for (const sign of app.globalData.zodiacSigns) {
    const a=app.getDailyCard(sign.name,'2026-11-07'), b=app.getDailyCard(sign.name,'2026-11-08')
    assert.equal(JSON.stringify(a),JSON.stringify(app.getDailyCard(sign.name,'2026-11-07')))
    assert.notEqual(a.title,b.title)
    assert.equal(a.sign,sign.name)
    const titles=new Set(Array.from({length:14},(_,i)=>app.getDailyCard(sign.name,'2026-11-'+String(i+1).padStart(2,'0')).title))
    assert.equal(titles.size,14)
  }
})
test('daily quota survives sign switch and restart, renews next day', () => {
  const env=makeApp(), first=env.app.drawToday()
  env.app.setSelectedSign('白羊座')
  assert.equal(env.app.drawToday().id,first.id)
  const restarted=makeApp(env.storage)
  assert.equal(restarted.app.drawToday().id,first.id)
  assert.equal(restarted.app.getHistory().length,1)
  restarted.setDay(2026,11,8)
  assert.equal(restarted.app.getTodayDraw(),null)
  assert.notEqual(restarted.app.drawToday().id,first.id)
})
test('all daily and oracle links restore exact content from encoded and decoded query', () => {
  const {app}=makeApp()
  for (const sign of app.globalData.zodiacSigns) {
    const cards=[app.getDailyCard(sign.name,'2026-11-07'), ...app.globalData.oracleCards.map(c=>app.buildOracle(c.id,sign.name,'2026-11-07'))]
    for (const card of cards) for(const encoded of [true,false]) assert.equal(JSON.stringify(app.resolveCard(query(card,app,encoded))),JSON.stringify(card))
  }
})
test('opening a friend card does not consume quota or change own sign', () => {
  const {app}=makeApp(), p=page('detail',app,{setNavigationBarTitle(){}})
  p.onLoad(query(app.buildOracle('oracle-01','白羊座','2026-11-07'),app,true))
  assert.equal(p.data.card.sign,'白羊座')
  assert.equal(app.globalData.selectedSign,'双鱼座')
  assert.equal(app.getTodayDraw(),null)
  assert.equal(app.getHistory().length,0)
})
test('invalid routes are rejected, missing and malformed links show empty state', () => {
  const {app}=makeApp()
  for(const patch of [{date:'2026-02-30'},{date:'bad'},{sign:'未知'},{sign:'%'},{v:'v999'},{type:'unknown'},{type:'oracle',source:'oracle-99'}]) {
    assert.equal(app.resolveCard({...query(app.getDailyCard(),app),...patch}),null)
  }
  for(const q of [{},{local:'%'},{local:'missing'}]) {const p=page('detail',app);p.onLoad(q);assert.equal(p.data.unavailable,true)}
})
test('legacy daily and oracle shares remain readable', () => {
  const {app}=makeApp()
  const legacy={...app.globalData.zodiacSigns[11].card,id:'daily-双鱼座-2026-11-06',type:'daily',sign:'双鱼座',date:'2026-11-06'}
  assert.equal(app.resolveCard(query(legacy,app,true)).title,legacy.title)
  const oldOracle={id:'oracle-03-双鱼座-1793900000000',type:'oracle',sign:'双鱼座',date:'2026-11-06'}
  assert.equal(app.resolveCard(query(oldOracle,app,true)).title,app.globalData.oracleCards[2].title)
})
test('old local favorites open their original full content', () => {
  const old={id:'daily-双鱼座-2026-11-06',type:'daily',sign:'双鱼座',date:'2026-11-06',title:'旧文案',summary:'旧的完整内容'}
  const {app}=makeApp({favoriteCards:[old]})
  const p=page('detail',app,{setNavigationBarTitle(){}})
  p.onLoad({local:encodeURIComponent(old.id)})
  assert.equal(p.data.card.summary,old.summary)
})
test('favorites toggle, reject overflow without silent deletion', () => {
  const {app,storage}=makeApp(), card=app.getDailyCard()
  assert.equal(app.toggleFavorite(card),true); assert.equal(app.isFavorite(card.id),true)
  assert.equal(app.toggleFavorite(card),false); assert.equal(app.getFavorites().length,0)
  storage.favoriteCards=Array.from({length:50},(_,i)=>({id:'existing-'+i}))
  assert.throws(()=>app.toggleFavorite(card),/50/)
  assert.equal(app.getFavorites().length,50)
})
test('history deduplicates and retains 30 most recent records', () => {
  const {app}=makeApp()
  for(let i=0;i<35;i++) app.addHistory({id:'record-'+i})
  app.addHistory({id:'record-34'})
  assert.equal(app.getHistory().length,30)
  assert.equal(app.getHistory()[0].id,'record-34')
})
test('visit streak handles repeated visits, gaps, month and year boundaries', () => {
  const env=makeApp(); env.app.onShow(); assert.equal(env.app.getStreak(),1)
  assert.equal(env.storage.visitDates.length,1)
  env.setDay(2026,11,8);env.app.recordVisit();assert.equal(env.app.getStreak(),2)
  env.setDay(2026,11,10);env.app.recordVisit();assert.equal(env.app.getStreak(),1)
  env.setDay(2026,12,31);env.app.recordVisit();env.setDay(2027,1,1);env.app.recordVisit();assert.equal(env.app.getStreak(),2)
})
test('draw storage failure does not grant extra quota or overwrite saved result', () => {
  const env=makeApp(), original=env.wx.setStorageSync
  env.wx.setStorageSync=(key,value)=>{if(key==='dailyDraw')throw new Error('quota'); original(key,value)}
  assert.throws(()=>env.app.drawToday(),/quota/);assert.equal(env.app.getTodayDraw(),null)
  env.wx.setStorageSync=(key,value)=>{if(key==='drawHistory')throw new Error('history');original(key,value)}
  assert.throws(()=>env.app.drawToday(),/history/)
  const saved=env.app.getTodayDraw();assert.ok(saved)
  env.wx.setStorageSync=original;env.app.addHistory(saved)
  assert.equal(env.app.drawToday().id,saved.id);assert.equal(env.app.getHistory().length,1)
})
test('draw tab refreshes favorite status and keeps original sign after switch', () => {
  const {app}=makeApp(), result=app.drawToday(), p=page('draw',app)
  app.setSelectedSign('白羊座');app.toggleFavorite(result);p.onShow()
  assert.equal(p.data.selectedSign,result.sign);assert.equal(p.data.isFavorite,true)
  app.toggleFavorite(result);p.onShow();assert.equal(p.data.isFavorite,false)
})
test('valid old dates do not crash the content resolver', () => {
  const {app}=makeApp()
  for(const date of ['0001-01-01','1900-01-01','1969-12-31']) {
    const card=app.resolveCard({v:'v1',type:'daily',sign:'双鱼座',date})
    assert.ok(card.title);assert.ok(Number(card.number)>=1)
  }
})
test('free theme draws never consume or replace the daily main card and avoid consecutive repeats', () => {
 const {app}=makeApp(), dailyCard=app.drawToday()
 for(const theme of app.getThemes()) {
  let previous
  for(let i=0;i<20;i++) {const card=app.drawTheme(theme.id,'calm');assert.equal(card.type,'theme');assert.equal(card.themeId,theme.id);assert.notEqual(card.sourceId,previous);previous=card.sourceId}
 }
 assert.equal(app.getTodayDraw().id,dailyCard.id)
})
test('all themes, moods and quiz outcomes share and restore without local storage', () => {
 const {app}=makeApp()
 for(const theme of app.getThemes()) for(let i=1;i<=8;i++) for(const mood of app.getMoods()) {
  const card=app.buildTheme('theme-'+theme.id+'-'+String(i).padStart(2,'0'),'天秤座','2026-11-07',mood.id)
  assert.equal(JSON.stringify(app.resolveCard(query(card,app,true))),JSON.stringify(card))
 }
 for(const id of ['quiet','connect','explore','order']) {const card=app.buildQuiz(id,'狮子座','2026-11-07');assert.equal(JSON.stringify(app.resolveCard(query(card,app))),JSON.stringify(card))}
 for(const patch of [{v:'bad'},{source:'theme-work-99'},{mood:'bad'}]) assert.equal(app.resolveCard({...query(app.buildTheme('theme-work-01','双鱼座','2026-11-07'),app),...patch}),null)
})
test('quiz validates completion, all outcomes, deterministic ties and keeps answers out of shares', () => {
 const {app}=makeApp(), q=require('../miniprogram/data/quiz')
 for(let i=0;i<4;i++){const card=app.finishQuiz(Array(8).fill(i));assert.equal(card.sourceId,q.results[i].id);assert.equal(card.answers,undefined);assert.equal(app.getCardPath(card).includes('answers'),false)}
 for(const invalid of [[],Array(8),Array(8).fill(4),[0,0,0,0,0,0,0,'1']]) assert.equal(q.score(invalid),null)
 assert.equal(q.score([0,1,2,3,0,1,2,3]).id,'quiet')
 const card=app.finishQuiz(Array(8).fill(0));assert.ok(app.findLocalCard(card.id))
})
test('each sign has distinct nonempty constellation artwork', () => {
 const {arts}=require('../miniprogram/data/sign-art')
 assert.equal(arts.length,12);assert.equal(new Set(arts.map(a=>JSON.stringify(a.points))).size,12)
 for(const art of arts) {assert.ok(art.lines.length>0);for(const p of art.points){assert.ok(p.x>=0&&p.x<=600&&p.y>=0&&p.y<=185)}}
})
test('research is opt-in, separate share intent from opens, and never records arbitrary values', () => {
 const env=makeApp(),app=env.app
 app.onShow();app.drawTheme('work','calm');assert.equal(app.getResearchRows().length,0)
 app.setResearchEnabled(true);app.onShow();app.track('share_intent','theme')
 assert.equal(app.getResearchReport().counts['share_open:theme'],undefined)
 const shared=app.buildTheme('theme-work-01','双鱼座','2026-11-07')
 const p=page('detail',app,{setNavigationBarTitle(){}});p.onLoad({...query(shared,app),from:'share'})
 assert.equal(app.getResearchReport().counts['share_open:theme'],1)
 app.track('private_answer','home');app.track('quiz_complete','private identity')
 assert.equal(JSON.stringify(app.getResearchReport()).includes('private'),false)
 const before=JSON.stringify(app.getResearchRows());app.setResearchEnabled(false);app.track('home_view','home');assert.equal(JSON.stringify(app.getResearchRows()),before)
})
test('research counts next-day return on this device and keeps a bounded history', () => {
 const env=makeApp();env.app.setResearchEnabled(true);env.app.onShow()
 env.setDay(2026,11,8);env.app.onShow();env.app.onShow()
 assert.equal(env.app.getResearchReport().nextDayReturns,1)
 assert.equal(env.app.getResearchReport().activeDays,2)
 for(let d=1;d<=31;d++){env.setDay(2026,12,d);env.app.onShow()}
 assert.equal(env.app.getResearchRows().length,30)
 assert.equal(env.app.getResearchReport().scope,'current_device_only')
})
test('catalog keeps unique encountered themes after recent history pruning and restart', () => {
 const env=makeApp(),app=env.app
 for(const theme of app.getThemes()) for(let i=1;i<=8;i++)app.unlockTheme(app.buildTheme('theme-'+theme.id+'-'+String(i).padStart(2,'0'),'双鱼座','2026-11-07'))
 const card=app.getThemeCatalog()[0];app.unlockTheme(card)
 for(let i=0;i<40;i++)app.addHistory({id:'later-'+i})
 const restart=makeApp(env.storage)
 assert.equal(restart.app.getThemeCatalog().length,24)
 assert.equal(restart.app.findLocalCard(card.id).title,card.title)
})
test('card book filters categories and shows quiz results among recent results', () => {
 const {app}=makeApp();const a=app.drawTheme('relation','calm'),b=app.finishQuiz(Array(8).fill(2));app.toggleFavorite(a);app.toggleFavorite(b)
 const p=page('collection',app);p.onShow();p.chooseFilter({currentTarget:{dataset:{id:'quiz'}}})
 assert.equal(p.data.visible.length,1);assert.equal(p.data.visible[0].type,'quiz')
 p.chooseSource({currentTarget:{dataset:{id:'recent'}}});assert.equal(p.data.visible[0].id,b.id)
})
test('poster lays out complete curated text without overflowing its image', () => {
 const renderer=require('../miniprogram/utils/poster'),{app}=makeApp()
 const ctx={font:'',measureText(text){return{width:Array.from(text).reduce((s,c)=>s+(c.charCodeAt(0)>255?24:12),0)}}}
 const cards=[app.getDailyCard(),app.buildTheme('theme-relation-01','白羊座','2026-11-07','busy'),...['quiet','connect','explore','order'].map(id=>app.buildQuiz(id,'天蝎座','2026-11-07'))]
 for(const card of cards){const box=renderer.layout(ctx,card);assert.ok(box.height>box.artY+230);assert.equal(box.body.join(''),card.summary||card.text);assert.ok(box.height<1800);assert.ok(box.body.every(line=>ctx.measureText(line).width<=546))}
})
test('draw page state machine permits selection only after shuffle and supports free repeats', () => {
 const {app}=makeApp(),p=page('draw',app,{showToast(){}})
 p.onLoad();p.onShow();p.pick({currentTarget:{dataset:{index:0}}});assert.equal(app.getTodayDraw(),null)
 p.changeMode({currentTarget:{dataset:{mode:'free'}}});p.skip();p.pick({currentTarget:{dataset:{index:1}}})
 assert.equal(p.data.phase,'revealed');assert.equal(p.data.result.type,'theme');assert.equal(app.getTodayDraw(),null)
 const first=p.data.result.sourceId;p.reset();p.skip();p.pick({currentTarget:{dataset:{index:2}}});assert.notEqual(p.data.result.sourceId,first)
})
test('quiz UI can finish all eight questions, restore previous choices and start over', () => {
 const {app}=makeApp();let link
 const p=page('quiz',app,{navigateTo(opts){link=opts.url;opts.success();opts.complete()},showToast(){}})
 p.start()
 for(let i=0;i<8;i++){p.choose({currentTarget:{dataset:{index:2}}});if(i===1){p.previous();assert.equal(p.data.selected,2);p.next()}p.next()}
 assert.equal(app.getQuizHistory()[0].sourceId,'explore');assert.ok(link.includes('type=quiz'));assert.equal(p.data.answers.length,0);assert.equal(p.data.started,false);assert.equal(app.getQuizDraft(),null)
})
test('unfinished quiz resumes on a new page and after an app restart', () => {
 const env=makeApp(), p=page('quiz',env.app)
 p.start();p.choose({currentTarget:{dataset:{index:1}}});p.next();p.choose({currentTarget:{dataset:{index:3}}});p.next()
 const restarted=makeApp(env.storage), resumed=page('quiz',restarted.app)
 resumed.onShow();assert.equal(resumed.data.draft.answers.length,2)
 resumed.start();assert.equal(resumed.data.index,2);assert.equal(resumed.data.selected,-1)
 resumed.previous();assert.equal(resumed.data.selected,3)
 assert.equal(restarted.app.getQuizHistory().length,0)
})
test('draft rejects unknown versions, invalid values and gaps without affecting other data', () => {
 for(const draft of [{version:'q2',answers:[0],index:0},{version:'q1',answers:[4],index:0},{version:'q1',answers:[0],index:7},{version:'q1',answers:[null],index:0}]) {
  const {app}=makeApp({quizDraft:draft});assert.equal(app.getQuizDraft(),null);assert.equal(app.getFavorites().length,0)
 }
 const env=makeApp();env.app.saveQuizDraft([0,2],1);env.app.clearQuizDraft();assert.equal(env.app.getQuizDraft(),null)
})
test('reduce motion persists and skips animation while daily quota remains unchanged', () => {
 const env=makeApp();const card=env.app.drawToday();env.app.setReducedMotion(true)
 const restarted=makeApp(env.storage),p=page('draw',restarted.app)
 p.onLoad();p.onShow();assert.equal(p.data.motion,false)
 p.changeMode({currentTarget:{dataset:{mode:'free'}}});p.shuffle();assert.equal(p.data.phase,'selecting')
 assert.equal(restarted.app.getTodayDraw().id,card.id)
})
test('home topic shortcut and result shortcut enter the requested draw mode', () => {
 const env=makeApp();let url
 const home=page('home',env.app,{...env.wx,switchTab:opts=>{url=opts.url}})
 home.onShow();home.openTheme({currentTarget:{dataset:{id:'work'}}});assert.equal(url,'/pages/draw/draw')
 const draw=page('draw',env.app);draw.onLoad();draw.onShow();assert.equal(draw.data.mode,'free');assert.equal(draw.data.themeId,'work');assert.equal(env.app.globalData.pendingTheme,null)
 env.app.globalData.pendingTheme='relation';env.app.globalData.pendingDrawMode='daily';draw.onShow();assert.equal(draw.data.mode,'daily')
})
test('draft storage failure does not prevent the current quiz from continuing', () => {
 const env=makeApp();env.wx.setStorageSync=(key)=>{if(key==='quizDraft')throw new Error('storage')}
 const p=page('quiz',env.app);p.start();p.choose({currentTarget:{dataset:{index:0}}});assert.equal(p.data.draftSaved,false);p.next();assert.equal(p.data.index,1)
})
console.log(passed+' checks passed')
module.exports={passed}
