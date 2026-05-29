// cloud-functions/user-feedback/index.js
// 用户反馈云函数
const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();

exports.main = async (event, context) => {
  const { content, contact } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  if (!content || !content.trim()) {
    return { code: -1, msg: '反馈内容不能为空' };
  }

  await db.collection('feedback').add({
    data: {
      _openid: openid,
      content: content.trim(),
      contact: contact || '',
      createdAt: db.serverDate(),
      status: 'pending'
    }
  });

  return { code: 0, msg: '感谢反馈！' };
};
