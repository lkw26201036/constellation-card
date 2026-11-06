const {getArt}=require("../../data/sign-art")
const INTRO_MS=1950
const EXIT_MS=180
function makeScene(sign){
 const art=getArt(sign)
 const points=art.points.map((point,index)=>({id:index,x:(point.x-300)*.75+260,y:(point.y-92)*.85+260,delay:420+index*90,bright:index===Math.floor(art.points.length/2)}))
 const lines=art.edges.map(([a,b],index)=>{const p=points[a],q=points[b];return{id:index,x:p.x,y:p.y,length:Math.hypot(q.x-p.x,q.y-p.y),angle:Math.atan2(q.y-p.y,q.x-p.x)*180/Math.PI,delay:490+index*80}})
 const ticks=Array.from({length:12},(_,index)=>{const angle=index*Math.PI/6-Math.PI/2;return{id:index,x:260+224*Math.cos(angle),y:260+224*Math.sin(angle),angle:index*30}})
 return{points,lines,ticks,latin:art.latin}
}
module.exports={makeScene,INTRO_MS,EXIT_MS}
