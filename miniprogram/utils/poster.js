const {getArt}=require("../data/sign-art")
const {artwork}=require("../data/arcana-art")
function wrap(ctx,text,width,font){
 ctx.font=font
 const lines=[]
 String(text||"").split("\n").forEach(paragraph=>{let line="";Array.from(paragraph).forEach(char=>{if(line && ctx.measureText(line+char).width>width){const chars=Array.from(line);if(chars.length>1&&(/[，。！？：；、）》”’]/.test(char)||/[（《“‘]/.test(chars[chars.length-1]))){const last=chars.pop();lines.push(chars.join(""));line=last+char}else{lines.push(line);line=char}}else line+=char});if(line)lines.push(line)})
 return lines
}
function layout(ctx,card){
 if(card.type==="spread"||card.type==="pair"){
  let y=460
  let matchBox=null
  if(card.type==="pair"){
   const summary=wrap(ctx,card.match.summary,546,"27px serif"),summaryY=y;y+=summary.length*40+20
   const dimensions=card.match.dimensions.map(d=>{const lines=wrap(ctx,d.text,546,"22px sans-serif"),entry={name:d.name,tag:d.tag,lines,y};y+=40+lines.length*33+20;return entry})
   matchBox={summary,summaryY,dimensions}
  }
  const sections=card.positions.map(p=>{const lines=wrap(ctx,p.text,546,"24px sans-serif"),section={role:p.role,name:p.name,lines,y};y+=49+lines.length*37+28;return section})
  const note=wrap(ctx,card.summaryNote,546,"21px sans-serif");y+=note.length*32+24
  const advice=wrap(ctx,card.advice,514,"22px sans-serif"),adviceY=y,artY=adviceY+89+advice.length*34+25
  return{width:650,height:artY+278,sections,note,noteY:y-note.length*32-24,advice,adviceY,artY,matchBox}
 }
 const title=wrap(ctx,card.title,546,"500 36px serif")
 const body=wrap(ctx,card.type==="dice"&&card.pair?card.match.summary+"\n"+card.text:card.summary||card.text,546,"24px sans-serif")
 const advice=wrap(ctx,(card.tip||card.advice)+(card.moodNote?"\n"+card.moodNote:"")+(card.signNote?"\n给"+card.sign+"的小提醒："+card.signNote:""),514,"22px sans-serif")
 const titleY=170,keywordY=titleY+title.length*49+15,bodyY=keywordY+55
 const adviceY=bodyY+body.length*37+32,artY=adviceY+89+advice.length*34+25
 return{width:650,height:artY+278,title,body,advice,titleY,keywordY,bodyY,adviceY,artY}
}
function paint(canvas,card){
 const ctx=canvas.getContext("2d"),box=layout(ctx,card),ratio=Math.min(2,Math.floor(4096/box.height*100)/100)
 canvas.width=box.width*ratio;canvas.height=box.height*ratio;ctx.scale(ratio,ratio)
 ctx.fillStyle="#233f39";ctx.fillRect(0,0,box.width,box.height)
 ctx.strokeStyle="rgba(227,204,156,.45)";ctx.lineWidth=1;ctx.strokeRect(24,24,602,box.height-48)
 ctx.textBaseline="top";ctx.fillStyle="#d8c49a";ctx.font="19px sans-serif"
 const label=card.type==="pair"?"双人星图 · "+card.match.relation:card.type==="dice"?"吉运骰子 · "+card.face+"点 · "+card.faceName+"之面":card.type==="spread"?"星光牌阵 · 给此刻的三束星光":card.type==="book"?"答案之书 · "+card.keyword:card.type==="quiz"?"趣味测试 · 我的充电方式":card.type==="theme"?card.themeLabel+" · 自由抽卡":card.type==="daily"?(card.sign==="通用"?"今日灵感卡":"每日星座卡"):"今日主签"
 ctx.fillText(label,52,65);ctx.fillText((card.pair?card.pair.signA+" × "+card.pair.signB:card.sign==="通用"?"十二星光":card.sign)+" / "+card.date,52,103)
 if(card.type==="spread"||card.type==="pair"){
  card.positions.forEach((p,i)=>{
   const x=46+i*190,y=i===1?140:157;ctx.strokeStyle="#9d956d";ctx.lineWidth=1;ctx.strokeRect(x,y,178,265)
   ctx.strokeStyle="#d8c093";ctx.lineWidth=1.2
   artwork(Number(p.id.slice(1))-1).forEach(points=>{ctx.beginPath();points.forEach(([px,py],j)=>{if(j)ctx.lineTo(x+px*.7+5,y+py*.7+6);else ctx.moveTo(x+px*.7+5,y+py*.7+6)});ctx.stroke()})
   ctx.fillStyle="#f0dfb8";ctx.font="23px serif";ctx.textAlign="center";ctx.fillText(p.name,x+89,y+227);ctx.textAlign="left"
  })
  if(box.matchBox){ctx.fillStyle="#efdfba";ctx.font="27px serif";box.matchBox.summary.forEach((line,i)=>ctx.fillText(line,52,box.matchBox.summaryY+i*40));box.matchBox.dimensions.forEach(d=>{ctx.fillStyle="#d4bf93";ctx.font="20px sans-serif";ctx.fillText(d.name+" / "+d.tag,52,d.y);ctx.fillStyle="#d5decb";ctx.font="22px sans-serif";d.lines.forEach((line,i)=>ctx.fillText(line,52,d.y+35+i*33))})}
  box.sections.forEach(s=>{ctx.fillStyle="#d4bf93";ctx.font="21px sans-serif";ctx.fillText(s.role+" / "+s.name,52,s.y);ctx.fillStyle="#eee8db";ctx.font="24px sans-serif";s.lines.forEach((line,i)=>ctx.fillText(line,52,s.y+42+i*37))})
  ctx.fillStyle="#bac3ab";ctx.font="21px sans-serif";box.note.forEach((line,i)=>ctx.fillText(line,52,box.noteY+i*32))
 }else{
  ctx.fillStyle="#fff8eb";ctx.font="500 36px serif";box.title.forEach((line,i)=>ctx.fillText(line,52,box.titleY+i*49))
  ctx.font="24px sans-serif";ctx.fillStyle="#e4c88b";ctx.fillText(card.keyword,52,box.keywordY)
  ctx.font="24px sans-serif";ctx.fillStyle="#eee8db";box.body.forEach((line,i)=>ctx.fillText(line,52,box.bodyY+i*37))
 }
 ctx.fillStyle="rgba(255,248,235,.06)";ctx.fillRect(42,box.adviceY,566,89+box.advice.length*34)
 ctx.fillStyle="#dec99b";ctx.font="600 21px sans-serif";ctx.fillText("给此刻的一点建议",62,box.adviceY+22)
 ctx.fillStyle="#f0e7d4";ctx.font="22px sans-serif";box.advice.forEach((line,i)=>ctx.fillText(line,62,box.adviceY+63+i*34))
 const signList=card.pair?[card.pair.signA,card.pair.signB]:[card.sign],oy=box.artY+10
 signList.forEach((sign,index)=>{const art=getArt(sign),scale=card.pair?0.43:1,vertical=card.pair?0.85:1,ox=card.pair?52+index*290:35
  ctx.strokeStyle="rgba(234,207,152,.65)";ctx.lineWidth=1.3
  art.edges.forEach(([a,b])=>{ctx.beginPath();ctx.moveTo(ox+art.points[a].x*scale,oy+art.points[a].y*vertical);ctx.lineTo(ox+art.points[b].x*scale,oy+art.points[b].y*vertical);ctx.stroke()})
  ctx.fillStyle="#eedbb0";art.points.forEach(point=>{ctx.beginPath();ctx.arc(ox+point.x*scale,oy+point.y*vertical,card.pair?2:3,0,Math.PI*2);ctx.fill()})
  ctx.font="20px sans-serif";ctx.fillText(art.name,card.pair?ox:52,box.artY+202)
  if(!card.pair){ctx.textAlign="right";ctx.fillText(art.latin,598,box.artY+202);ctx.textAlign="left"}
 })
 ctx.font="17px sans-serif";ctx.fillStyle="#c7c8b7";ctx.fillText("仅供娱乐与自我探索 · 和朋友一起发现自己的节奏",52,box.height-50)
 return box
}
module.exports={wrap,layout,paint}
