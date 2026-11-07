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
function page(name, app, wx = {}, runtime = {}) {
  let result
  vm.runInNewContext(fs.readFileSync(path.join(project, 'miniprogram/pages', name, name+'.js'), 'utf8'), {
    Page: obj => {result=obj}, getApp: () => app, wx, console, setTimeout, clearTimeout, require: id => require(path.join(project,"miniprogram/pages",name,id)), ...runtime
  })
  result.setData = (update, done) => { Object.assign(result.data, update); if(done)done() }
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
  assert.equal(app.globalData.selectedSign,null)
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
test('weekly research events stay aggregate and opt-in', () => {
 const env=makeApp(),app=env.app
 app.track('weekly_open','weekly')
 assert.equal(app.getResearchRows().length,0)
 app.setResearchEnabled(true)
 app.track('weekly_open','weekly');app.track('weekly_pack_open','weekly');app.track('weekly_action_complete','weekly');app.track('weekly_feedback','weekly')
 const report=app.getResearchReport()
 assert.equal(report.counts['weekly_open:weekly'],1)
 assert.equal(report.counts['weekly_pack_open:weekly'],1)
 assert.equal(report.counts['weekly_action_complete:weekly'],1)
 assert.equal(report.counts['weekly_feedback:weekly'],1)
 assert.equal(JSON.stringify(report).includes('label'),false)
})
test('weekly page exposes lightweight feedback actions', () => {
 const wxml=fs.readFileSync(path.join(project,'miniprogram/pages/weekly/weekly.wxml'),'utf8'),js=fs.readFileSync(path.join(project,'miniprogram/pages/weekly/weekly.js'),'utf8')
 assert.match(wxml,/有帮助/);assert.match(wxml,/换个角度/);assert.match(js,/weekly_feedback/);assert.match(js,/event\.detail\.action\.status===\"done\"/)
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
 const home=page('home',env.app,{...env.wx,navigateTo:opts=>{url=opts.url},switchTab:opts=>{url=opts.url}})
 home.onShow();home.openTheme({currentTarget:{dataset:{id:'work'}}});assert.equal(url,'/pages/spread/spread?topic=work')
 env.app.globalData.pendingTheme='work';const draw=page('draw',env.app);draw.onLoad();draw.onShow();assert.equal(draw.data.mode,'free');assert.equal(draw.data.themeId,'work');assert.equal(env.app.globalData.pendingTheme,null)
 env.app.globalData.pendingTheme='relation';env.app.globalData.pendingDrawMode='daily';draw.onShow();assert.equal(draw.data.mode,'daily')
})
test('draft storage failure does not prevent the current quiz from continuing', () => {
 const env=makeApp();env.wx.setStorageSync=(key)=>{if(key==='quizDraft')throw new Error('storage')}
 const p=page('quiz',env.app);p.start();p.choose({currentTarget:{dataset:{index:0}}});assert.equal(p.data.draftSaved,false);p.next();assert.equal(p.data.index,1)
})
function fakeClock(){
 let now=0,id=0;const tasks=new Map()
 const api={setTimeout(run,delay){const key=++id;tasks.set(key,{run,at:now+delay});return key},clearTimeout(key){tasks.delete(key)}}
 return{api,count:()=>tasks.size,advance(ms){const target=now+ms;let guard=0;while(true){const next=[...tasks].filter(([,task])=>task.at<=target).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;if(++guard>100)throw new Error('Timer loop');now=next[1].at;tasks.delete(next[0]);next[1].run()}now=target}}
}
function launchFixture(initial={},options={},switcher){
 const env=makeApp(initial),clock=fakeClock(),routes=[],backs=[]
 const p=page('launch',env.app,{...env.wx,switchTab(opts){routes.push(opts.url);if(switcher)switcher(opts,routes.length);else opts.success()},navigateBack(opts){backs.push(opts.delta)}},clock.api)
 p.onLoad(options);p.onShow();p.onReady()
 return{...env,p,clock,routes,backs}
}
test('launch scene has twelve bounded constellations and finishes drawing within its finite sequence',()=>{
 const {makeScene,INTRO_MS}=require('../miniprogram/pages/launch/scene'),{app}=makeApp()
 for(const sign of app.globalData.zodiacSigns){const scene=makeScene(sign.name);assert.equal(scene.ticks.length,12);assert.ok(scene.lines.length>0);for(const point of scene.points){assert.ok(point.x>0&&point.x<520&&point.y>0&&point.y<520);assert.ok(point.delay+420<INTRO_MS)}for(const line of scene.lines)assert.ok(line.delay+440<INTRO_MS)}
})
test('launch sequence reveals the homepage once and does not fake a loading percentage',()=>{
 const {INTRO_MS,EXIT_MS}=require('../miniprogram/pages/launch/scene'),env=launchFixture()
 assert.equal(env.routes.length,0);env.clock.advance(32);assert.equal(env.p.data.running,true)
 env.clock.advance(INTRO_MS);assert.equal(env.p.data.leaving,true);assert.equal(env.routes.length,0)
 env.clock.advance(EXIT_MS);assert.equal(env.routes[0],'/pages/home/home');assert.equal(env.app.globalData.launchAnimationSeen,true)
 env.p.skip();env.clock.advance(10000);assert.equal(env.routes.length,1)
 const config=JSON.parse(fs.readFileSync(path.join(project,'miniprogram/app.json'),'utf8'));assert.equal(config.pages[0],'pages/launch/launch');assert.ok(config.tabBar.list.some(item=>item.pagePath==='pages/home/home'))
 assert.ok(env.app.getCardPath(env.app.getDailyCard()).startsWith('/pages/detail/detail?'))
})
test('launch skip cancels pending timers and unload cannot redirect later',()=>{
 const env=launchFixture();env.p.skip();env.p.skip();env.clock.advance(10000);assert.equal(env.routes.length,1);assert.equal(env.clock.count(),0)
 const closed=launchFixture();closed.clock.advance(50);closed.p.onUnload();closed.clock.advance(10000);assert.equal(closed.routes.length,0);assert.equal(closed.clock.count(),0)
})
test('preview stays on its own screen, replays, and returns without claiming a real launch',()=>{
 const env=launchFixture({selectedSign:'天秤座'},{preview:'1'});env.clock.advance(10000)
 assert.equal(env.routes.length,0);assert.equal(env.p.data.finished,true);assert.equal(env.p.data.sign,'天秤座');assert.equal(env.app.globalData.launchAnimationSeen,false)
 env.p.replay();assert.equal(env.p.data.running,false);env.clock.advance(32);assert.equal(env.p.data.running,true)
 env.p.closePreview();assert.equal(env.backs[0],1);env.p.onUnload();env.clock.advance(10000);assert.equal(env.routes.length,0)
})
test('reduced motion and repeated launch entry do not force another animation wait',()=>{
 const env=launchFixture({reducedMotion:true});assert.equal(env.routes.length,1);assert.equal(env.clock.count(),0)
 const preview=launchFixture({reducedMotion:true},{preview:'1'});assert.equal(preview.routes.length,0);assert.equal(preview.p.data.finished,true)
 const app=makeApp().app;app.globalData.launchAnimationSeen=true;let count=0;const clock=fakeClock(),p=page('launch',app,{getStorageSync(){},switchTab(opts){count++;opts.success()}},clock.api);p.onLoad({});p.onReady();assert.equal(count,1);assert.equal(clock.count(),0)
})
test('background interruption during the exit cannot leave launch stuck transparent',()=>{
 const {INTRO_MS}=require('../miniprogram/pages/launch/scene'),env=launchFixture()
 env.clock.advance(32+INTRO_MS);assert.equal(env.p.data.leaving,true)
 env.p.onHide();assert.equal(env.clock.count(),0);env.clock.advance(5000);assert.equal(env.routes.length,0)
 env.p.onShow();assert.equal(env.routes.length,1)
})
test('homepage navigation failure exposes a working retry and does not mark the launch complete',()=>{
 const env=launchFixture({}, {},(opts,count)=>count===1?opts.fail():opts.success())
 env.p.skip();assert.equal(env.p.data.error,true);assert.equal(env.app.globalData.launchAnimationSeen,false)
 env.p.skip();assert.equal(env.routes.length,2);assert.equal(env.app.globalData.launchAnimationSeen,true)
})
test('replay waits for the old scene render acknowledgement before restarting animation',()=>{
 const env=launchFixture({}, {preview:'1'});env.clock.advance(5000)
 let acknowledge
 env.p.setData=(update,done)=>{Object.assign(env.p.data,update);if(done)acknowledge=done}
 env.p.replay();assert.equal(env.p.data.running,false);env.clock.advance(1000);assert.equal(env.p.data.running,false);assert.equal(env.clock.count(),0)
 acknowledge();env.clock.advance(32);assert.equal(env.p.data.running,true)
 env.p.onUnload();env.clock.advance(5000);assert.equal(env.routes.length,0)
})

test('absent, empty, invalid and cleared zodiac storage remain truly unbound',()=>{
 for(const stored of [undefined,null,"","未知",{},11]){
  const env=makeApp({selectedSign:stored}),before=JSON.stringify(env.storage);
  assert.equal(env.app.getSelectedSign(),null);assert.equal(env.app.getSignData(),null);
  const card=env.app.getDailyCard();assert.equal(card.sign,"通用");assert.equal(card.contentVersion,"u1");
  assert.equal(card.color,undefined);assert.equal(card.number,undefined);assert.equal(card.signNote,undefined);
  assert.equal(JSON.stringify(env.storage),before)
 }
 const env=makeApp({selectedSign:"天秤座"});delete env.storage.selectedSign;
 assert.equal(env.app.getCardIdentity(),"通用");assert.equal(env.app.globalData.selectedSign,null);
 assert.equal(env.app.getDailyCard("未知"),null)
})
test('guest daily, oracle, theme and quiz shares round-trip after restart and binding',()=>{
 const env=makeApp(),app=env.app, cards=[app.getDailyCard(),app.drawToday(),app.drawTheme("growth","calm"),app.finishQuiz(Array(8).fill(1))];
 for(const card of cards)for(const encoded of [true,false]){
  const receiver=makeApp({selectedSign:"白羊座"}).app;
  assert.equal(JSON.stringify(receiver.resolveCard(query(card,app,encoded))),JSON.stringify(card));
  assert.equal(receiver.getSelectedSign(),"白羊座")
 }
 app.setSelectedSign("金牛座");assert.equal(app.getDailyCard().sign,"金牛座");
 assert.equal(app.getTodayDraw().id,cards[1].id);
 assert.equal(makeApp(env.storage).app.drawToday().id,cards[1].id);
 for(const v of ["v1","legacy"])assert.equal(app.resolveCard({...query(cards[0],app),v}),null);
 assert.equal(app.resolveCard({...query(app.getDailyCard(),app),v:"u1"}),null)
})
test('guest home and profile stay neutral until a valid picker selection is saved',()=>{
 const env=makeApp({selectedSign:"invalid"}),home=page("home",env.app,env.wx),profile=page("profile",env.app,env.wx);
 home.onShow();profile.onShow();
 assert.equal(home.data.signChosen,false);assert.equal(home.data.selectedIndex,0);
 assert.equal(home.data.card.sign,"通用");assert.equal(profile.data.selectedSign,null);
 assert.equal(profile.data.latin,"TWELVE SIGNS");assert.ok(!home.onShareAppMessage().title.includes("null"));
 home.chooseSign({detail:{value:"0"}});assert.equal(env.app.getSelectedSign(),null);
 home.chooseSign({detail:{value:"1"}});clearTimeout(home.animationTimer);profile.onShow();
 assert.equal(home.data.signChosen,true);assert.equal(profile.data.selectedSign,"白羊座");
 assert.equal(makeApp(env.storage).app.getSelectedSign(),"白羊座")
})
test('twelve-star guest launch is distinct, bounded and completes within its sequence',()=>{
 const {makeScene,INTRO_MS}=require("../miniprogram/pages/launch/scene");
 const neutral=makeScene(null);
 assert.equal(neutral.general,true);assert.equal(neutral.latin,"TWELVE SIGNS");assert.equal(neutral.points.length,13);
 assert.equal(neutral.points.filter(p=>p.bright).length,1);
 for(const p of neutral.points){assert.ok(p.x>0&&p.x<520&&p.y>0&&p.y<520);assert.ok(p.delay+420<INTRO_MS)}
 for(const l of neutral.lines)assert.ok(l.delay+440<INTRO_MS);
 assert.notEqual(JSON.stringify(neutral),JSON.stringify(makeScene("双鱼座")));
 const env=launchFixture({selectedSign:"invalid"});assert.equal(env.p.data.signChosen,false);assert.equal(env.p.data.scene.general,true);
 env.p.onUnload()
})
test('preview switches guest and personal scenes without changing storage or launch state',()=>{
 const env=launchFixture({selectedSign:"天秤座"},{preview:"1"}),before=JSON.stringify(env.storage);
 env.p.changePreviewMode({currentTarget:{dataset:{mode:"guest"}}});env.clock.advance(5000);
 assert.equal(env.p.data.signChosen,false);assert.equal(env.p.data.scene.general,true);
 env.p.changePreviewMode({currentTarget:{dataset:{mode:"personal"}}});env.clock.advance(5000);
 assert.equal(env.p.data.sign,"天秤座");assert.equal(env.p.data.scene.general,false);
 assert.equal(JSON.stringify(env.storage),before);assert.equal(env.app.globalData.launchAnimationSeen,false);assert.equal(env.routes.length,0);
 env.p.onUnload()
 const guest={...makeApp(),clock:fakeClock()};let toast;
 guest.p=page("launch",guest.app,{...guest.wx,showToast:opts=>{toast=opts.title}},guest.clock.api);guest.p.onLoad({preview:"1"});
 guest.p.changePreviewMode({currentTarget:{dataset:{mode:"personal"}}});
 assert.ok(toast);assert.equal(guest.p.data.previewMode,"guest");assert.equal(guest.storage.selectedSign,undefined);guest.p.onUnload()
})
test('shared visual tokens define the approved constellation palette',()=>{
 const css=fs.readFileSync(path.join(project,'miniprogram/app.wxss'),'utf8')
 for(const token of ['--paper','--surface','--ink','--muted','--forest','--gold','--plum','--border','--radius-md','--motion-standard'])assert.match(css,new RegExp(token+'\\s*:'))
 for(const file of ['miniprogram/pages/home/home.wxss','miniprogram/pages/dice/dice.wxss','miniprogram/pages/pair/pair.wxss']){
  const pageCss=fs.readFileSync(path.join(project,file),'utf8')
  assert.doesNotMatch(pageCss,/#(?:7c3aed|8b5cf6|a855f7)/i)
 }
})
test('home and draw pages distinguish daily card from main draw',()=>{
 const home=fs.readFileSync(path.join(project,'miniprogram/pages/home/home.wxml'),'utf8')
 const draw=fs.readFileSync(path.join(project,'miniprogram/pages/draw/draw.wxml'),'utf8')
 const drawCss=fs.readFileSync(path.join(project,'miniprogram/pages/draw/draw.wxss'),'utf8')
 assert.match(home,/今日星座卡/)
 assert.match(home,/抽一张今日主签/)
 assert.match(draw,/今日主签/)
 assert.match(drawCss,/mode-grid|mode-group/)
})
test('dice result leads with an actionable direction and astral stage accent',()=>{
 const dice=fs.readFileSync(path.join(project,'miniprogram/pages/dice/dice.wxml'),'utf8')
 const diceCss=fs.readFileSync(path.join(project,'miniprogram/pages/dice/dice.wxss'),'utf8')
 assert.match(dice,/你摇到的是：/)
 assert.match(dice,/星光骰子/)
 assert.match(diceCss,/var\(--plum\)/)
})
test('functional arrows stay text presentation and release labels stay current',()=>{
 const files=['answer','collection','detail','dice','draw','home','pair','profile','share-preview','spread'].map(name=>path.join(project,'miniprogram/pages',name,name+'.wxml'))
 for(const file of files)assert.doesNotMatch(fs.readFileSync(file,'utf8'),/↗(?!\uFE0E)/)
 for(const file of ['miniprogram/pages/about/about.wxml','miniprogram/pages/profile/profile.wxml'])assert.match(fs.readFileSync(path.join(project,file),'utf8'),/V1\.3/)
})
test('dice poster copy uses the current star dice name',()=>{
 const poster=fs.readFileSync(path.join(project,'miniprogram/utils/poster.js'),'utf8')
 assert.match(poster,/星光骰子/)
})
test('local action follow-up saves status transitions and survives restart',()=>{
 const env=makeApp(),app=env.app,card=app.getDailyCard()
 const saved=app.saveAction(card)
 assert.equal(saved.status,'saved');assert.equal(app.getAction(card.id).status,'saved')
 const done=app.setActionStatus(card.id,'done');assert.equal(done.status,'done');assert.ok(done.completedAt>0)
 assert.equal(app.setActionStatus(card.id,'later').status,'later')
 assert.equal(app.getLatestAction().id,card.id)
 for(let i=0;i<65;i++)app.saveAction({...card,id:'action-'+i,title:'行动'+i})
 const retained=app.saveAction({...card,id:'retained-action',title:'保留行动'})
 assert.equal(app.getRecentActions().length,60)
 const restarted=makeApp(env.storage).app
 assert.equal(restarted.getAction(retained.id).status,'saved')
 assert.equal(restarted.getRecentActions().length,60)
 assert.throws(()=>app.setActionStatus(card.id,'bad'),/Invalid action status/)
})
test('home, dice and pair pages register the action follow-up component',()=>{
 for(const name of ['home','dice','pair']){
  const json=JSON.parse(fs.readFileSync(path.join(project,'miniprogram/pages',name,name+'.json'),'utf8'))
  const wxml=fs.readFileSync(path.join(project,'miniprogram/pages',name,name+'.wxml'),'utf8')
  assert.ok(json.usingComponents&&json.usingComponents['action-followup'])
  assert.match(wxml,/action-followup/)
 }
 assert.match(fs.readFileSync(path.join(project,'miniprogram/pages/home/home.wxml'),'utf8'),/上次的小行动/)
})
test('star echo route preserves public pair context without private fields',()=>{
 const config=JSON.parse(fs.readFileSync(path.join(project,'miniprogram/app.json'),'utf8'))
 assert.ok(config.pages.includes('pages/echo/echo'))
 const {app}=makeApp();const pair=app.buildPair(['a01','a02','a03'],{signA:'白羊座',signB:'双鱼座',relation:'friend'},'2026-11-07')
 const echo=app.getEchoPath(pair),params=new URL(echo,'https://test').searchParams
 assert.equal(params.get('type'),'pair');assert.equal(params.get('other'),'双鱼座');assert.equal(params.get('relation'),'friend')
 assert.equal(params.get('aliasA'),null);assert.equal(params.get('aliasB'),null);assert.equal(params.get('gender'),null)
 assert.equal(JSON.stringify(app.resolveCard(Object.fromEntries(params))),JSON.stringify(app.resolveCard(Object.fromEntries(new URL(app.getCardPath(pair),'https://test').searchParams))))
 const source=fs.readFileSync(path.join(project,'miniprogram/pages/echo/echo.js'),'utf8')
 assert.match(source,/responseOptions/);assert.match(source,/resonate/);assert.match(source,/begin/);assert.match(source,/light/)
 assert.match(fs.readFileSync(path.join(project,'miniprogram/components/action-followup/action-followup.wxml'),'utf8'),/completedLabel/)
 const responseParams=new URL(app.getEchoPath(pair,'resonate'),'https://test').searchParams
 assert.equal(responseParams.get('response'),'resonate')
 assert.match(source,/query\.response/)
})
test('weekly review stays stable by ISO week and counts local activity',()=>{
 const env=makeApp(),app=env.app,card=app.getDailyCard('白羊座','2026-11-07')
 assert.equal(typeof app.getWeekKey,'function');assert.equal(app.getWeekKey('2026-11-07'),app.getWeekKey('2026-11-08'));assert.notEqual(app.getWeekKey('2026-11-08'),app.getWeekKey('2026-11-09'))
 const theme=app.getWeeklyTheme('2026-11-07');assert.ok(theme.title&&theme.action)
 app.saveAction(card);app.setActionStatus(card.id,'done');app.toggleFavorite(card)
 const review=app.getWeeklyReview('2026-11-07');assert.equal(review.actionCount,1);assert.equal(review.doneCount,1);assert.equal(review.favoriteCount,1);assert.equal(review.recentActions[0].id,card.id)
 const empty=makeApp().app.getWeeklyReview('2026-11-07');assert.equal(empty.actionCount,0);assert.equal(empty.doneCount,0);assert.ok(empty.theme.title)
})
test('weekly star review page is registered with theme and empty-state copy',()=>{
 const config=JSON.parse(fs.readFileSync(path.join(project,'miniprogram/app.json'),'utf8'))
 assert.ok(config.pages.includes('pages/weekly/weekly'))
 const source=fs.readFileSync(path.join(project,'miniprogram/pages/weekly/weekly.js'),'utf8'),wxml=fs.readFileSync(path.join(project,'miniprogram/pages/weekly/weekly.wxml'),'utf8')
 assert.match(source,/getWeeklyReview/);assert.match(wxml,/本周星光/);assert.match(wxml,/还没有收下小行动/);assert.match(wxml,/本周主题/)
})
test('profile and collection surface the weekly review entry',()=>{
 const profile=fs.readFileSync(path.join(project,'miniprogram/pages/profile/profile.wxml'),'utf8'),profileJs=fs.readFileSync(path.join(project,'miniprogram/pages/profile/profile.js'),'utf8'),collection=fs.readFileSync(path.join(project,'miniprogram/pages/collection/collection.wxml'),'utf8'),collectionJs=fs.readFileSync(path.join(project,'miniprogram/pages/collection/collection.js'),'utf8')
 assert.match(profile,/本周星光/);assert.match(profileJs,/pages\/weekly\/weekly/);assert.match(collection,/本周星光/);assert.match(collectionJs,/pages\/weekly\/weekly/)
})
test('pair setup prevents incomplete start with visible guidance',()=>{
 const xml=fs.readFileSync(path.join(project,'miniprogram/pages/pair/pair.wxml'),'utf8')
 assert.match(xml,/disabled="\{\{!form\.signA \|\| !form\.signB \|\| !form\.relation\}\}"/)
 assert.match(xml,/请选择双方星座和关系类型后，再展开星图/)
})
test('weekly content packs provide three stable cards and pack progress',()=>{
 const env=makeApp(),app=env.app,pack=app.getWeeklyPack('2026-11-07')
 assert.equal(pack.cards.length,3);assert.ok(pack.theme.title);assert.equal(JSON.stringify(pack),JSON.stringify(app.getWeeklyPack('2026-11-08')));assert.notEqual(pack.theme.id,app.getWeeklyPack('2026-11-09').theme.id)
 const card=pack.cards[0];app.saveAction(card);app.setActionStatus(card.id,'done');const review=app.getWeeklyReview('2026-11-07');assert.equal(review.packActionCount,1);assert.equal(review.packDoneCount,1)
})
test('weekly page renders pack cards and pack progress',()=>{
 const wxml=fs.readFileSync(path.join(project,'miniprogram/pages/weekly/weekly.wxml'),'utf8')
 assert.match(wxml,/pack\.cards/);assert.match(wxml,/packDoneCount/);assert.match(wxml,/action-followup/);assert.match(wxml,/本周主题卡包/)
})
require('./ritual.cjs')({test,makeApp,page,query,fakeClock,project})
require('./connection.cjs')({test,makeApp,page,query,fakeClock,project})
console.log(passed+' checks passed')
module.exports={passed}
