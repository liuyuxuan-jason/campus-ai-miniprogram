// pages/mine/mine.js
const api = require('../../utils/api');

Page({
  data: {
    userInfo: null,
    stats: {
      totalSessions: 0,
      totalMessages: 0,
      daysActive: 0
    }
  },

  onShow() {
    const app = getApp();
    this.setData({
      userInfo: app.globalData.userInfo || { nickName: '校园用户', avatarUrl: '' }
    });
    this.loadStats();
  },

  loadStats() {
    // 从本地缓存读取统计数据
    const stats = wx.getStorageSync('user_stats') || {
      totalSessions: 0,
      totalMessages: 0,
      daysActive: 0
    };
    this.setData({ stats });
  },

  // 提交反馈
  onFeedback() {
    wx.showModal({
      title: '意见反馈',
      content: '',
      editable: true,
      placeholderText: '请输入你的建议或遇到的问题...',
      success: (res) => {
        if (res.confirm && res.content) {
          wx.showLoading({ title: '提交中...' });
          api.submitFeedback(res.content).then(() => {
            wx.hideLoading();
            wx.showToast({ title: '感谢反馈！', icon: 'success' });
          }).catch(() => {
            wx.hideLoading();
            wx.showToast({ title: '提交失败', icon: 'none' });
          });
        }
      }
    });
  },

  // 关于
  onAbout() {
    wx.showModal({
      title: '关于',
      content: '紫荆智学AI v1.0 - 校园AI服务工作室\n\n本小程序为个人开发项目，AI 生成内容仅供参考。\n\nPowered by DeepSeek API',
      showCancel: false
    });
  },

  // 引入模式列表用于图标显示
  onHistory() {
    wx.switchTab({ url: '/pages/history/history' });
  }
});
