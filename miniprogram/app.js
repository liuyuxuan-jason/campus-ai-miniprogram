// app.js - 校园AI服务工作室
const api = require('./utils/api');

App({
  globalData: {
    userInfo: null,
    openid: ''
  },

  onLaunch() {
    // 不初始化云开发了，改用本地后端 API
    this.autoLogin();
  },

  // 自动登录（简化版）
  autoLogin() {
    const cachedOpenid = wx.getStorageSync('openid');
    if (cachedOpenid) {
      this.globalData.openid = cachedOpenid;
      this.getUserInfo();
      return;
    }

    wx.showLoading({ title: '登录中...' });
    // 调用本地后端的登录接口
    api.userLogin('auto').then(resp => {
      const { openid } = resp;
      this.globalData.openid = openid;
      wx.setStorageSync('openid', openid);
      wx.hideLoading();
      this.getUserInfo();
    }).catch(err => {
      wx.hideLoading();
      console.error('登录失败', err);
      // 使用临时 ID
      const tmpId = 'tmp_' + Date.now();
      this.globalData.openid = tmpId;
      wx.setStorageSync('openid', tmpId);
    });
  },

  // 获取用户信息
  getUserInfo() {
    wx.getUserProfile({
      desc: '用于展示用户信息',
      success: (res) => {
        this.globalData.userInfo = res.userInfo;
      },
      fail: () => {
        this.globalData.userInfo = {
          nickName: '校园用户',
          avatarUrl: ''
        };
      }
    });
  }
});
