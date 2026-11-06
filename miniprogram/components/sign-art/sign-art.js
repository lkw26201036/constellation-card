const { getArt } = require("../../data/sign-art")
Component({ properties: { sign: { type:String, value:"双鱼座", observer(value) { this.setData({art:getArt(value)}) } } }, data:{art:getArt("双鱼座")} })
