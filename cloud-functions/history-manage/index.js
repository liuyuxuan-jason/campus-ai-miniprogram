// cloud-functions/history-manage/index.js
// 对话历史管理云函数
const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();

exports.main = async (event, context) => {
  const { action, sessionId, mainMode, subMode, title, modeName, messages, page, pageSize, mode } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const collection = db.collection('chat-history');

  switch (action) {
    // 保存/更新对话
    case 'save':
      if (!sessionId) return { code: -1, msg: '缺少 sessionId' };

      const existing = await collection.where({
        _openid: openid,
        _id: sessionId
      }).get();

      if (existing.data.length > 0) {
        // 更新
        await collection.doc(sessionId).update({
          data: {
            messages: messages,
            updatedAt: db.serverDate(),
            msgCount: messages ? messages.length : 0
          }
        });
      } else {
        // 创建
        await collection.add({
          data: {
            _openid: openid,
            _id: sessionId,
            mainMode,
            subMode,
            title: title || '新对话',
            modeName: modeName || '',
            messages: messages || [],
            createdAt: db.serverDate(),
            updatedAt: db.serverDate(),
            msgCount: messages ? messages.length : 0
          }
        });
      }
      return { code: 0, msg: 'ok' };

    // 获取列表
    case 'list':
      let query = { _openid: openid };
      if (mode) {
        query.mainMode = mode;
      }

      const countResult = await collection.where(query).count();
      const skip = (page - 1) * pageSize;

      const listResult = await collection.where(query)
        .orderBy('updatedAt', 'desc')
        .skip(skip)
        .limit(pageSize)
        .field({
          _id: true,
          mainMode: true,
          subMode: true,
          title: true,
          modeName: true,
          msgCount: true,
          createdAt: true,
          updatedAt: true
        })
        .get();

      return {
        list: listResult.data,
        total: countResult.total,
        page,
        pageSize
      };

    // 获取单条详情
    case 'detail':
      const detailResult = await collection.doc(sessionId).get();
      return detailResult.data;

    // 删除
    case 'delete':
      await collection.doc(sessionId).remove();
      return { code: 0, msg: '已删除' };

    default:
      return { code: -1, msg: '未知操作' };
  }
};
