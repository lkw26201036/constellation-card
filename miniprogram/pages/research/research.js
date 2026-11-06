Page({
 data:{enabled:false,report:{activeDays:0,nextDayReturns:0},counts:[]},
 onShow(){this.refresh()},
 refresh(){const app=getApp(),report=app.getResearchReport();const labels={app_open:"打开小程序",home_view:"查看首页",draw_complete:"完成抽卡",quiz_start:"开始测试",quiz_complete:"完成测试",share_intent:"点击分享（不等于分享成功）",share_open:"从分享链接进入",poster_generate:"生成海报"};this.setData({enabled:app.researchEnabled(),report,counts:Object.keys(labels).map(name=>({name,label:labels[name],value:Object.keys(report.counts).filter(key=>key.split(":")[0]===name).reduce((sum,key)=>sum+report.counts[key],0)}))})},
 toggle(event){try{getApp().setResearchEnabled(event.detail.value);this.refresh()}catch(error){wx.showToast({title:"设置未保存，请重试",icon:"none"});this.refresh()}},
 copy(){wx.setClipboardData({data:JSON.stringify(getApp().getResearchReport(),null,2)})},
 clear(){wx.showModal({title:"清除本机调研记录？",content:"只清除调研计数，不影响卡册、主签和连续访问。",success:result=>{if(result.confirm){try{wx.removeStorageSync("researchDays");this.refresh()}catch(error){wx.showToast({title:"清除失败，请重试",icon:"none"})}}}})}
})
