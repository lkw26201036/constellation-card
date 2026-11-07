const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib')
const {artwork}=require('../miniprogram/data/arcana-art'),out=path.join(__dirname,'../miniprogram/assets/arcana');fs.mkdirSync(out,{recursive:true})
const table=Array.from({length:256},(_,n)=>{let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0})
function crc(bytes){let c=0xffffffff;for(const b of bytes)c=table[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0}
function chunk(type,data){const t=Buffer.from(type),n=Buffer.alloc(4),c=Buffer.alloc(4);n.writeUInt32BE(data.length);c.writeUInt32BE(crc(Buffer.concat([t,data])));return Buffer.concat([n,t,data,c])}
const w=360,h=450,scale=1.5
for(let index=0;index<60;index++){
 const alpha=new Float32Array(w*h)
 for(const p of artwork(index))for(let i=1;i<p.length;i++){
  const a=p[i-1].map(n=>n*scale),b=p[i].map(n=>n*scale),dx=b[0]-a[0],dy=b[1]-a[1],sq=dx*dx+dy*dy
  for(let y=Math.max(0,Math.floor(Math.min(a[1],b[1])-2));y<=Math.min(h-1,Math.ceil(Math.max(a[1],b[1])+2));y++)for(let x=Math.max(0,Math.floor(Math.min(a[0],b[0])-2));x<=Math.min(w-1,Math.ceil(Math.max(a[0],b[0])+2));x++){
   const t=sq?Math.max(0,Math.min(1,((x+.5-a[0])*dx+(y+.5-a[1])*dy)/sq)):0,d=Math.hypot(x+.5-a[0]-t*dx,y+.5-a[1]-t*dy),v=Math.max(0,Math.min(1,1.45-d));alpha[y*w+x]=Math.max(alpha[y*w+x],v)
  }
 }
 const rows=Buffer.alloc(h*(w*4+1));for(let y=0;y<h;y++)for(let x=0;x<w;x++){const at=y*(w*4+1)+1+x*4;rows[at]=221;rows[at+1]=197;rows[at+2]=147;rows[at+3]=Math.round(alpha[y*w+x]*255)}
 const header=Buffer.alloc(13);header.writeUInt32BE(w,0);header.writeUInt32BE(h,4);header[8]=8;header[9]=6
 fs.writeFileSync(path.join(out,'a'+String(index+1).padStart(2,'0')+'.png'),Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(rows)),chunk('IEND',Buffer.alloc(0))]))
}
console.log('Generated 60 original arcana line illustrations')
