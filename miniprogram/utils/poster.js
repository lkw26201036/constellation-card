const {getArt}=require("../data/sign-art")
function wrap(ctx,text,width,font){
 ctx.font=font
 const lines=[]
 String(text||"").split("\n").forEach(paragraph=>{let line="";Array.from(paragraph).forEach(char=>{if(line && ctx.measureText(line+char).width>width){lines.push(line);line=char}else line+=char});if(line)lines.push(line)})
 return lines
}
function layout(ctx,card){
 const title=wrap(ctx,card.title,546,"500 36px serif")
 const body=wrap(ctx,card.summary||card.text,546,"24px sans-serif")
 const advice=wrap(ctx,(card.tip||card.advice)+(card.moodNote?"\n"+card.moodNote:"")+(card.signNote?"\n给"+card.sign+"的小提醒："+card.signNote:""),514,"22px sans-serif")
 const titleY=170,keywordY=titleY+title.length*49+15,bodyY=keywordY+55
 const adviceY=bodyY+body.length*37+32,artY=adviceY+89+advice.length*34+25
 return{width:650,height:artY+278,title,body,advice,titleY,keywordY,bodyY,adviceY,artY}
}
function paint(canvas,card){
 const ctx=canvas.getContext("2d"),box=layout(ctx,card),ratio=2
 canvas.width=box.width*ratio;canvas.height=box.height*ratio;ctx.scale(ratio,ratio)
 ctx.fillStyle="#233f39";ctx.fillRect(0,0,box.width,box.height)
 ctx.strokeStyle="rgba(227,204,156,.45)";ctx.lineWidth=1;ctx.strokeRect(24,24,602,box.height-48)
 ctx.textBaseline="top";ctx.fillStyle="#d8c49a";ctx.font="19px sans-serif"
 const label=card.type==="quiz"?"趣味测试 · 我的充电方式":card.type==="theme"?card.themeLabel+" · 自由抽卡":card.type==="daily"?"每日星座卡":"今日主签"
 ctx.fillText(label,52,65);ctx.fillText(card.sign+" / "+card.date,52,103)
 ctx.fillStyle="#fff8eb";ctx.font="500 36px serif";box.title.forEach((line,i)=>ctx.fillText(line,52,box.titleY+i*49))
 ctx.font="24px sans-serif";ctx.fillStyle="#e4c88b";ctx.fillText(card.keyword,52,box.keywordY)
 ctx.font="24px sans-serif";ctx.fillStyle="#eee8db";box.body.forEach((line,i)=>ctx.fillText(line,52,box.bodyY+i*37))
 ctx.fillStyle="rgba(255,248,235,.06)";ctx.fillRect(42,box.adviceY,566,89+box.advice.length*34)
 ctx.fillStyle="#dec99b";ctx.font="600 21px sans-serif";ctx.fillText("给此刻的一点建议",62,box.adviceY+22)
 ctx.fillStyle="#f0e7d4";ctx.font="22px sans-serif";box.advice.forEach((line,i)=>ctx.fillText(line,62,box.adviceY+63+i*34))
 const art=getArt(card.sign),ox=35,oy=box.artY+10
 ctx.strokeStyle="rgba(234,207,152,.65)";ctx.lineWidth=1.3
 art.edges.forEach(([a,b])=>{ctx.beginPath();ctx.moveTo(ox+art.points[a].x,oy+art.points[a].y);ctx.lineTo(ox+art.points[b].x,oy+art.points[b].y);ctx.stroke()})
 ctx.fillStyle="#eedbb0";art.points.forEach(point=>{ctx.beginPath();ctx.arc(ox+point.x,oy+point.y,3,0,Math.PI*2);ctx.fill()})
 ctx.font="20px sans-serif";ctx.fillText(art.name,52,box.artY+202)
 ctx.textAlign="right";ctx.fillText(art.latin,598,box.artY+202);ctx.textAlign="left"
 ctx.font="17px sans-serif";ctx.fillStyle="#c7c8b7";ctx.fillText("仅供娱乐与自我探索 · 和朋友一起发现自己的节奏",52,box.height-50)
 return box
}
module.exports={wrap,layout,paint}
