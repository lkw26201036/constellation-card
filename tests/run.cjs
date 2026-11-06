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
  const wx = { getStorageSync: key => structuredClone(storage[key]), setStorageSync: (key,value) => { storage[key] = structuredClone(value) } }
  vm.runInNewContext(appCode, { App: obj => {app = obj}, wx, Date: Clock, require: () => daily, console })
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
    Page: obj => {result=obj}, getApp: () => app, wx, console, setTimeout, clearTimeout
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
console.log(passed+' checks passed')
module.exports={passed}
