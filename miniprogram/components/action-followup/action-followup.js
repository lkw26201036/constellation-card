Component({
 properties:{card:{type:Object,value:{}},action:{type:Object,value:null},compact:{type:Boolean,value:false}},
 data:{record:null},
 observers:{"card,action":function(){this.sync()}},
 lifetimes:{attached(){this.sync()}},
 methods:{
  formatAction(action){if(!action)return null;const completedLabel=action.completedAt?(()=>{const d=new Date(action.completedAt),pad=n=>String(n).padStart(2,"0");return d.getFullYear()+"/"+pad(d.getMonth()+1)+"/"+pad(d.getDate())+" "+pad(d.getHours())+":"+pad(d.getMinutes())})():"";return{...action,completedLabel}},
  sync(){const source=this.data.action||(this.data.card&&this.data.card.id?getApp().getAction(this.data.card.id):null);this.setData({record:this.formatAction(source)})},
  save(){if(!this.data.card||!this.data.card.id)return;try{const action=getApp().saveAction(this.data.card);this.setData({record:this.formatAction(action)});this.triggerEvent("statuschange",{action})}catch(error){wx.showToast({title:"这一步没有保存，请重试",icon:"none"})}},
  changeStatus(event){const status=event.currentTarget.dataset.status;if(!this.data.record)return;try{const action=getApp().setActionStatus(this.data.record.id,status);this.setData({record:this.formatAction(action)});this.triggerEvent("statuschange",{action})}catch(error){wx.showToast({title:"状态没有更新，请重试",icon:"none"})}}
 }
})
