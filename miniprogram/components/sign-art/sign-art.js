const { getArt } = require("../../data/sign-art")
Component({ properties: { sign: { type:String, value:"", observer(value) { this.setData({art:getArt(value)}) } } }, data:{art:getArt(null)} })
