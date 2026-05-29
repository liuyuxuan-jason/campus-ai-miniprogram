// cloud-functions/user-login/index.js
// 用户登录云函数
const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();

exports.main = async (event, context) => {
  const { code } = event;

  // 获取微信用户信息
  const { result } = await cloud.openapi({
    action: 'wx.login',
    data: { code }
  });

  // 实际使用中，这里需要调用微信登录凭证校验接口
  // 简化版：直接使用云开发自带的用户身份
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  // 检查用户是否存在，不存在则创建
  const userCollection = db.collection('users');
  const existing = await userCollection.where({
    _openid: openid
  }).get();

  if (existing.data.length === 0) {
    await userCollection.add({
      data: {
        _openid: openid,
        createdAt: db.serverDate(),
        lastLoginAt: db.serverDate(),
        totalSessions: 0,
        totalMessages: 0
      }
    });
  } else {
    // 更新登录时间
    await userCollection.where({
      _openid: openid
    }).update({
      data: {
        lastLoginAt: db.serverDate()
      }
    });
  }

  return { openid };
};
