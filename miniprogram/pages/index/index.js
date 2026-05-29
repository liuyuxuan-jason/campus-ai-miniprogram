// pages/index/index.js
const { getModeList } = require('../../utils/promptTemplates');

Page({
  data: {
    modeList: [],
    greeting: '',
    nickname: ''
  },

  onLoad() {
    this.setData({
      modeList: getModeList()
    });
    this.setGreeting();
  },

  onShow() {
    const app = getApp();
    if (app.globalData.userInfo) {
      this.setData({
        nickname: app.globalData.userInfo.nickName
      });
    }
  },

  // 设置问候语
  setGreeting() {
    const hour = new Date().getHours();
    let greeting = '';
    if (hour < 6) greeting = '夜深了，还在学习吗？';
    else if (hour < 9) greeting = '早上好，新的一天开始啦！';
    else if (hour < 12) greeting = '上午好，学习效率最高的时段！';
    else if (hour < 14) greeting = '中午好，记得吃午饭哦～';
    else if (hour < 18) greeting = '下午好，继续加油！';
    else if (hour < 21) greeting = '晚上好，今天的任务完成了吗？';
    else greeting = '晚安，早点休息哦～';
    this.setData({ greeting });
  },

  // 点击功能卡片
  onModeTap(e) {
    const { mainKey, subKey } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/chat/chat?mainMode=${mainKey}&subMode=${subKey}`
    });
  }
});
