Component({
 properties:{card:{type:Object,value:{}},action:{type:Object,value:null},compact:{type:Boolean,value:false}},
 data:{record:null},
 observers:{"card,action":function(){this.sync()}},
 lifetimes:{attached(){this.sync()}},
 methods:{
  sync(){const source=this.data.action||(this.data.card&&this.data.card.id?getApp().getAction(this.data.card.id):null);this.setData({record:source})},
  save(){if(!this.data.card||!this.data.card.id)return;try{const action=getApp().saveAction(this.data.card);this.setData({record:action});this.triggerEvent("statuschange",{action})}catch(error){wx.showToast({title:"这一步没有保存，请重试",icon:"none"})}},
  changeStatus(event){const status=event.currentTarget.dataset.status;if(!this.data.record)return;try{const action=getApp().setActionStatus(this.data.record.id,status);this.setData({record:action});this.triggerEvent("statuschange",{action})}catch(error){wx.showToast({title:"状态没有更新，请重试",icon:"none"})}}
 }
})
