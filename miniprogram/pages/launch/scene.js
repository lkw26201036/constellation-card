const {getArt}=require("../../data/sign-art")
const INTRO_MS=1950
const EXIT_MS=180
function makeScene(sign){
 const art=getArt(sign)
 const general=art.index===-1
 const points=general?Array.from({length:12},(_,id)=>{const a=id*Math.PI/6-Math.PI/2;return{id,x:260+145*Math.cos(a),y:260+145*Math.sin(a),delay:360+id*40,bright:false}}):art.points.map((point,index)=>({id:index,x:(point.x-300)*.75+260,y:(point.y-92)*.85+260,delay:420+index*90,bright:index===Math.floor(art.points.length/2)}))
 if(general)points.push({id:12,x:260,y:260,delay:1080,bright:true})
 const edges=general?[...Array.from({length:12},(_,id)=>[id,(id+1)%12]),[0,12],[3,12],[6,12],[9,12]]:art.edges
 const lines=edges.map(([a,b],index)=>{const p=points[a],q=points[b];return{id:index,x:p.x,y:p.y,length:Math.hypot(q.x-p.x,q.y-p.y),angle:Math.atan2(q.y-p.y,q.x-p.x)*180/Math.PI,delay:general?650+index*25:490+index*80}})
 const ticks=Array.from({length:12},(_,index)=>{const angle=index*Math.PI/6-Math.PI/2;return{id:index,x:260+224*Math.cos(angle),y:260+224*Math.sin(angle),angle:index*30}})
 return{points,lines,ticks,latin:art.latin,general}
}
module.exports={makeScene,INTRO_MS,EXIT_MS}
