const poster=require("../../utils/poster")
Page({
 data:{card:null,src:"",loading:true,error:false},
 onLoad(query){this.alive=true;const card=getApp().resolveCard(query);this.setData({card,error:!card,loading:!!card})},
 onReady(){if(this.data.card)this.generate()},
 onUnload(){this.alive=false},
 generate(){
  if(this.building||!this.data.card)return
  this.building=true;this.setData({loading:true,error:false})
  wx.createSelectorQuery().in(this).select("#posterCanvas").fields({node:true,size:true}).exec(result=>{
   if(!this.alive)return
   try{
    const node=result[0]&&result[0].node;if(!node)throw new Error("Canvas unavailable")
    poster.paint(node,this.data.card)
    wx.canvasToTempFilePath({canvas:node,fileType:"png",success:res=>{if(!this.alive)return;this.setData({src:res.tempFilePath,loading:false});getApp().track("poster_generate",this.data.card.type)},fail:()=>{if(this.alive)this.setData({error:true,loading:false})},complete:()=>{this.building=false}},this)
   }catch(error){this.building=false;if(this.alive)this.setData({error:true,loading:false})}
  })
 },
 preview(){if(this.data.src)wx.previewImage({current:this.data.src,urls:[this.data.src]})},
 onShareAppMessage(){const card=this.data.card;return card?{title:card.sign+" · "+card.title,path:getApp().getSharePath(card)}:{title:"来抽一张属于你的卡",path:"/pages/home/home"}}
})
