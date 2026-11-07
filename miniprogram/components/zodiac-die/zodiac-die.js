const {faces}=require("../../data/dice")
const {getArt}=require("../../data/sign-art")
const rotations=[[-14,-18],[-14,-108],[-14,-198],[-14,72],[-78,-15],[102,-15]]
const transforms=["rotateY(0deg)","rotateY(90deg)","rotateY(180deg)","rotateY(-90deg)","rotateX(90deg)","rotateX(-90deg)"]
function chartsFor(signs){return signs.slice(0,2).map((sign,index)=>{const art=getArt(sign),width=signs.length>1?38:74,left=signs.length>1?8+index*46:13,points=art.points.map(p=>({id:p.id,x:left+p.x/600*width,y:24+p.y/185*48}));return{id:index,name:art.name,symbol:art.symbol+"︎",points,lines:art.edges.map(([a,b],id)=>{const p=points[a],q=points[b];return{id,x:p.x,y:p.y,length:Math.hypot(q.x-p.x,q.y-p.y),angle:Math.atan2(q.y-p.y,q.x-p.x)*180/Math.PI}})}})}
Component({
 properties:{value:{type:Number,value:1},rolling:{type:Boolean,value:false},signs:{type:Array,value:[]},reduced:{type:Boolean,value:false}},
 data:{faces:faces.map((face,i)=>({...face,points:face.points.map((p,id)=>({id,x:p[0],y:p[1]})),transform:transforms[i]+" translateZ(93rpx)"})),rx:-14,ry:-18,startX:-14,startY:-18,rollX:706,rollY:1062,charts:[],caption:"十二星光"},
 observers:{"value, signs, rolling":function(value,signs){const r=rotations[value-1]||rotations[0],names=Array.isArray(signs)&&signs.length?signs:["通用"];this.setData({startX:this.data.rx,startY:this.data.ry,rx:r[0],ry:r[1],rollX:r[0]+720,rollY:r[1]+1080,charts:chartsFor(names),caption:names.map(n=>n==="通用"?"十二星光":n).join(" × ")})}},
 lifetimes:{ready(){const r=rotations[this.data.value-1]||rotations[0],names=this.data.signs.length?this.data.signs:["通用"];this.setData({rx:r[0],ry:r[1],rollX:r[0]+720,rollY:r[1]+1080,charts:chartsFor(names),caption:names.map(n=>n==="通用"?"十二星光":n).join(" × ")})}}
})
