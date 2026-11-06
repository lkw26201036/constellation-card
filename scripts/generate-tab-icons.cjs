// Reproducible vector line icons rasterized to PNG for the native WeChat tab bar.
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib')
const out=path.join(__dirname,'../miniprogram/assets/tabbar');fs.mkdirSync(out,{recursive:true})
const shapes={
 today:[[[32,9],[52,32],[32,55],[12,32],[32,9]],[[32,23],[41,32],[32,41],[23,32],[32,23]]],
 draw:[[[23,13],[49,13],[49,51],[23,51],[23,13]],[[16,18],[16,55],[43,55]],[[36,25],[40,32],[36,39],[32,32],[36,25]]],
 book:[[[12,15],[27,15],[32,20],[37,15],[52,15],[52,48],[37,48],[32,53],[27,48],[12,48],[12,15]],[[32,21],[32,48]]],
 profile:[Array.from({length:49},(_,i)=>{const a=i/48*Math.PI*2;return[32+8*Math.cos(a),21+8*Math.sin(a)]}),Array.from({length:33},(_,i)=>{const a=Math.PI+i/32*Math.PI;return[32+17*Math.cos(a),51+13*Math.sin(a)]})]
}
const table=Array.from({length:256},(_,n)=>{let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0})
function crc(bytes){let c=0xffffffff;for(const b of bytes)c=table[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0}
function chunk(type,data){const t=Buffer.from(type),len=Buffer.alloc(4),sum=Buffer.alloc(4);len.writeUInt32BE(data.length);sum.writeUInt32BE(crc(Buffer.concat([t,data])));return Buffer.concat([len,t,data,sum])}
function distance(x,y,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy)}
for(const[name,paths]of Object.entries(shapes))for(const[selected,hex]of [[false,'7b846f'],[true,'294735']]){
 const rgb=[0,2,4].map(i=>parseInt(hex.slice(i,i+2),16)),rows=Buffer.alloc(64*(1+64*4)),segments=paths.flatMap(p=>p.slice(1).map((point,i)=>[p[i],point]))
 for(let y=0;y<64;y++)for(let x=0;x<64;x++){
  let hits=0;for(let sy=0;sy<4;sy++)for(let sx=0;sx<4;sx++){const px=x+(sx+.5)/4,py=y+(sy+.5)/4;if(segments.some(([a,b])=>distance(px,py,a,b)<1.3))hits++}
  const at=y*(1+64*4)+1+x*4;rows[at]=rgb[0];rows[at+1]=rgb[1];rows[at+2]=rgb[2];rows[at+3]=Math.round(hits/16*255)
 }
 const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(64,0);ihdr.writeUInt32BE(64,4);ihdr[8]=8;ihdr[9]=6
 fs.writeFileSync(path.join(out,name+(selected?'-active':'')+'.png'),Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',zlib.deflateSync(rows)),chunk('IEND',Buffer.alloc(0))]))
}
console.log('Generated eight 64px navigation icons')
