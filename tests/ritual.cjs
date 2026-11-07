const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto')
module.exports=({test,makeApp,page,query,fakeClock,project})=>{
 const chooseThree=app=>[0,2,4].forEach(index=>app.chooseSpread(index))
 test('sixty original cards have 180 distinct position texts and sixty distinct PNG illustrations',()=>{
  const {cards}=require('../miniprogram/data/arcana'),{artwork}=require('../miniprogram/data/arcana-art');assert.equal(cards.length,60);assert.equal(new Set(cards.map(c=>c.id)).size,60);assert.equal(new Set(cards.flatMap(c=>c.notes)).size,180)
  const hashes=new Set();cards.forEach((c,i)=>{assert.equal(c.notes.length,3);assert.ok(c.action.length>8);const png=fs.readFileSync(path.join(project,'miniprogram',c.art));assert.equal(png.readUInt32BE(16),360);assert.equal(png.readUInt32BE(20),450);hashes.add(crypto.createHash('sha256').update(png).digest('hex'));for(const line of artwork(i))for(const [x,y]of line)assert.ok(Number.isFinite(x)&&Number.isFinite(y)&&x>=0&&x<=240&&y>=0&&y<=300)});assert.equal(hashes.size,60)
 })
 test('answer book contains exactly 200 original responses and useful actions without missing numbers',()=>{
  const answers=require('../miniprogram/data/answers');assert.equal(answers.length,200);assert.equal(new Set(answers.map(a=>a.answer)).size,200);assert.equal(new Set(answers.map(a=>a.title)).size,200);answers.forEach((a,i)=>{assert.equal(a.number,i+1);assert.ok(a.answer.length>=15);assert.ok(a.action.length>=10)})
 })
 test('seven candidates are real cards, undo preserves identity and completed positions preserve selection order',()=>{
  const env=makeApp(),d=env.app.startSpread();assert.equal(new Set(d.candidates).size,7)
  env.app.chooseSpread(2);env.app.chooseSpread(0);env.app.chooseSpread(2);env.app.chooseSpread(5);env.app.chooseSpread(1)
  const ids=env.app.getSpreadDraft().selected.slice();assert.equal(ids.join('.'),[d.candidates[0],d.candidates[5],d.candidates[1]].join('.'))
  env.app.chooseSpread(4);assert.equal(env.app.getSpreadDraft().selected.join('.'),ids.join('.'))
  const restarted=makeApp(env.storage).app;assert.equal(restarted.getSpreadDraft().candidates.join('.'),d.candidates.join('.'));const c=restarted.completeSpread();assert.equal(c.sourceId,ids.join('.'));assert.equal(c.positions[0].role,'当下的你');assert.equal(c.positions[1].role,'可能的走向');assert.equal(c.positions[2].role,'给你的指引');assert.equal(restarted.getSpreadDraft(),null)
 })
 test('full library excludes four completed spreads from each new candidate set',()=>{
  const {app}=makeApp();for(let round=0;round<30;round++){const recent=new Set(app.getSpreadHistory().slice(0,4).flatMap(c=>c.sourceId.split('.'))),d=app.startSpread();d.candidates.forEach(id=>assert.ok(!recent.has(id)));chooseThree(app);app.completeSpread()}assert.equal(app.getSpreadHistory().length,30)
 })
 test('small themed candidate pools recover oldest seen cards while remaining playable',()=>{
  const {app}=makeApp();for(let round=0;round<18;round++){const d=app.startSpread('relation');assert.equal(d.candidates.length,7);assert.equal(new Set(d.candidates).size,7);assert.ok(d.candidates.every(id=>Number(id.slice(1))>=21&&Number(id.slice(1))<=30));chooseThree(app);app.completeSpread()}
 })
 test('failed ritual writes preserve original draft and never partially increment counts',()=>{
  const env=makeApp();env.app.startSpread();chooseThree(env.app);const before=JSON.stringify(env.storage.ritualState),save=env.wx.setStorageSync;env.wx.setStorageSync=()=>{throw new Error('full')};assert.throws(()=>env.app.completeSpread());assert.equal(JSON.stringify(env.storage.ritualState),before);env.wx.setStorageSync=save;const result=env.app.completeSpread();assert.equal(env.app.getSpreadHistory().length,1);assert.throws(()=>env.app.completeSpread());assert.equal(Object.values(env.storage.ritualState.counts).reduce((a,b)=>a+b,0),3);assert.equal(env.app.getLastSpread().id,result.id)
 })
 test('all book numbers and ordered spread shares restore on a different device without binding or quota changes',()=>{
  const sender=makeApp().app,receiver=makeApp({selectedSign:'天秤座'}).app
  const cards=Array.from({length:200},(_,i)=>sender.buildAnswer(i+1,'通用','2026-11-07'));for(let i=1;i<=58;i+=3)cards.push(sender.buildSpread([i,i+1,i+2].map(n=>'a'+String(n).padStart(2,'0')),'白羊座','2026-11-07'))
  for(const c of cards)for(const encoded of [true,false])assert.equal(JSON.stringify(receiver.resolveCard(query(c,sender,encoded))),JSON.stringify(c))
  assert.equal(receiver.getSelectedSign(),'天秤座');assert.equal(receiver.getTodayDraw(),null);assert.equal(receiver.getSpreadHistory().length,0);assert.equal(receiver.getAnswerHistory().length,0)
 })
 test('new routes reject forged versions, duplicate positions, invalid numbers and unsupported topics',()=>{
  const {app}=makeApp(),s=query(app.buildSpread(['a01','a02','a03'],'通用','2026-11-07'),app),b=query(app.buildAnswer(1,'通用','2026-11-07'),app)
  for(const patch of [{v:'s9'},{source:'a01.a01.a02'},{source:'a01.a02.a61'},{source:'a01.a02'},{topic:'bad'},{sign:'bad'},{date:'2026-02-30'}])assert.equal(app.resolveCard({...s,...patch}),null)
  for(const source of ['0','201','-1','1.2','01','Infinity','NaN',''])assert.equal(app.resolveCard({...b,source}),null)
  assert.equal(app.resolveCard({...b,v:'b2'}),null)
 })
 test('book fixed mapping is independent of date or sign, repeated numbers dedupe, history is bounded',()=>{
  const env=makeApp();for(let n=1;n<=40;n++)env.app.openAnswer(n);assert.equal(env.app.getAnswerHistory().length,30);const a=env.app.openAnswer(21);env.app.setSelectedSign('巨蟹座');env.setDay(2026,11,8);const b=env.app.openAnswer(21);assert.equal(a.text,b.text);assert.equal(a.advice,b.advice);assert.equal(env.app.getAnswerHistory().filter(c=>c.number===21).length,1);for(let i=0;i<30;i++)assert.ok(!env.app.getAnswerHistory().slice(0,15).some(c=>c.number===env.app.randomAnswerNumber()))
 })
 test('new play modes do not spend main-card quota and new theme cards have no mood data',()=>{
  const {app}=makeApp();app.startSpread();chooseThree(app);app.completeSpread();app.openAnswer(127);assert.equal(app.getTodayDraw(),null);const c=app.drawThemePlain('relation');assert.equal(c.mood,undefined);assert.equal(c.moodNote,undefined);assert.equal(c.contentVersion,'t2');assert.equal(JSON.stringify(app.resolveCard(query(c,app))),JSON.stringify(c));const main=app.drawToday();app.openAnswer(200);app.startSpread();chooseThree(app);app.completeSpread();assert.equal(app.drawToday().id,main.id)
 })
 test('spread page handles selection, reveal interruption, replay and reduced motion without extra completions',()=>{
  const env=makeApp(),clock=fakeClock(),p=page('spread',env.app,{},clock.api);p.onLoad({});p.onShow();p.start();assert.equal(p.data.phase,'dealing');p.choose({currentTarget:{dataset:{index:0}}});assert.equal(p.data.draft.selected.length,0);p.skip();[0,2,4].forEach(index=>p.choose({currentTarget:{dataset:{index}}}));p.reveal();assert.equal(p.data.phase,'revealing');p.reveal();assert.equal(env.app.getSpreadHistory().length,1);p.onHide();assert.equal(p.data.phase,'revealed');assert.equal(clock.count(),0);p.replay();clock.advance(3000);assert.equal(env.app.getSpreadHistory().length,1);p.onUnload();assert.equal(clock.count(),0)
  const reduced=makeApp({reducedMotion:true}),q=page('spread',reduced.app);q.onLoad({});q.onShow();q.start();assert.equal(q.data.phase,'selecting');[0,1,2].forEach(index=>q.choose({currentTarget:{dataset:{index}}}));q.reveal();assert.equal(q.data.phase,'revealed');q.onUnload()
 })
 test('book UI validates input and backgrounding finishes the saved page without rerolling',()=>{
  const env=makeApp(),clock=fakeClock(),p=page('answer',env.app,{},clock.api);p.onLoad();p.onShow();for(const value of ['','0','201','-1','1.5','abc']){p.input({detail:{value}});p.open();assert.ok(p.data.error);assert.equal(env.app.getAnswerHistory().length,0)}p.input({detail:{value:'127'}});p.open();assert.equal(p.data.phase,'opening');p.open();assert.equal(env.app.getAnswerHistory().length,1);p.onHide();assert.equal(p.data.phase,'open');assert.equal(clock.count(),0);assert.equal(p.data.result.number,127);p.reset();assert.equal(p.data.phase,'closed');p.onUnload()
 })
 test('new favorites, full-spread local lookup and collection filters remain usable after restart',()=>{
  const env=makeApp();env.app.startSpread();chooseThree(env.app);const a=env.app.completeSpread(),b=env.app.openAnswer(200);env.app.toggleFavorite(a);env.app.toggleFavorite(b);const app=makeApp(env.storage).app,p=page('collection',app);p.onShow();p.chooseFilter({currentTarget:{dataset:{id:'spread'}}});assert.equal(p.data.visible[0].positions.length,3);p.chooseSource({currentTarget:{dataset:{id:'recent'}}});p.chooseFilter({currentTarget:{dataset:{id:'book'}}});assert.equal(p.data.visible[0].number,200);assert.equal(app.findLocalCard(a.id).positions[1].id,a.positions[1].id)
 })
 test('new opt-in metrics contain aggregate actions only and never spread ids or selected book numbers',()=>{
  const env=makeApp();env.app.startSpread();chooseThree(env.app);env.app.completeSpread();env.app.openAnswer(127);assert.equal(env.app.getResearchRows().length,0);env.app.setResearchEnabled(true);env.app.startSpread();chooseThree(env.app);env.app.completeSpread();env.app.openAnswer(127);const report=env.app.getResearchReport();assert.equal(report.counts['spread_complete:spread'],1);assert.equal(report.counts['book_open:book'],1);const raw=JSON.stringify(report);assert.ok(!raw.includes('127'));assert.ok(!raw.includes('a01'));assert.ok(!raw.includes('candidates'))
 })
 test('spread and book posters include every position and action without clipping artwork or text',()=>{
  const {app}=makeApp(),renderer=require('../miniprogram/utils/poster'),printed=[];const ctx=new Proxy({font:'',measureText(t){return{width:Array.from(t).reduce((s,c)=>s+(c.charCodeAt(0)>255?24:12),0)}},fillText(t,x,y){printed.push({t,x,y})}},{get(target,key){return key in target?target[key]:()=>{}}}),canvas={getContext:()=>ctx}
  const s=app.buildSpread(['a01','a23','a60'],'通用','2026-11-07'),book=app.buildAnswer(200,'通用','2026-11-07')
  for(const c of [s,book]){printed.length=0;const box=renderer.paint(canvas,c);assert.ok(box.height<2600);assert.ok(printed.every(p=>p.y<box.height-20));const text=printed.map(p=>p.t).join('');assert.ok(text.includes(c.advice));if(c.positions)c.positions.forEach(p=>{assert.ok(text.includes(p.name));assert.ok(text.includes(p.text))});else assert.ok(text.includes(c.text))}
 })
 test('requested topic starts at its own entry without overwriting an unfinished different spread',()=>{
  const env=makeApp();env.app.startSpread('relation');env.app.chooseSpread(1);const before=JSON.stringify(env.storage.ritualState),p=page('spread',env.app);p.onLoad({topic:'work'});p.onShow();assert.equal(p.data.phase,'ready');assert.equal(p.data.topic,'work');assert.equal(JSON.stringify(env.storage.ritualState),before);p.onUnload()
 })
 test('both new page routes are registered and WeChat expressions do not contain escaped JavaScript operators',()=>{
  const config=JSON.parse(fs.readFileSync(path.join(project,'miniprogram/app.json'),'utf8'));for(const name of ['spread','answer']){assert.ok(config.pages.includes('pages/'+name+'/'+name));const xml=fs.readFileSync(path.join(project,'miniprogram/pages',name,name+'.wxml'),'utf8');for(const [,expression]of xml.matchAll(/\{\{([\s\S]*?)\}\}/g))assert.ok(!expression.includes('&amp;'))}
 })
 test('poster line breaks keep closing punctuation with text and retain every character',()=>{
  const {wrap}=require('../miniprogram/utils/poster'),ctx={measureText:t=>({width:Array.from(t).length*24})},text='给自己一点温柔。慢慢走，也可以。';const lines=wrap(ctx,text,144,'24px serif');assert.equal(lines.join(''),text);lines.forEach(line=>{assert.ok(!/^[，。！？：；、）》”’]/.test(line));assert.ok(ctx.measureText(line).width<=144)})
 })
 test('advertising is disabled and never gates result generation',()=>{
  const config=require('../miniprogram/config/monetization');assert.equal(config.enabled,false);assert.equal(config.requiresAdForResult,false);assert.ok(Object.values(config.placements).every(id=>id===''))
 })
}
