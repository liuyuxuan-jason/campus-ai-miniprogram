// utils/api.js — HTTP API 调用封装（使用本地后端服务器）
// 不再依赖微信云开发

const API_BASE = 'https://campus-ai-backend.loca.lt/api';

/**
 * 调用 AI 对话 API
 * @param {string} mode - 模式: writing/learning/creative/chat
 * @param {string} content - 用户输入
 * @param {Array} history - 对话历史
 * @param {Array} fileList - 文件列表(可选)
 */
async function aiChat(mode, content, history = [], fileList = []) {
  return httpPost('/ai-chat', { mode, content, history, fileList });
}

/**
 * 用户登录
 * @param {string} code - 微信登录 code
 */
async function userLogin(code) {
  return httpPost('/user-login', { code });
}

/**
 * 获取对话历史列表
 */
async function getHistoryList(page = 1, pageSize = 20, mode = '') {
  const params = { page, pageSize };
  if (mode) params.mode = mode;
  return httpGet('/history', params);
}

/**
 * 获取单条对话详情
 */
async function getHistoryDetail(sessionId) {
  return httpGet(`/history/${sessionId}`);
}

/**
 * 删除对话
 */
async function deleteHistory(sessionId) {
  return httpDelete(`/history/${sessionId}`);
}

/**
 * 提交意见反馈
 */
async function submitFeedback(content, contact = '') {
  return httpPost('/feedback', { content, contact });
}

// ====== HTTP 工具 ======
async function httpPost(url, data) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: API_BASE + url,
      method: 'POST',
      data: data,
      header: { 'Content-Type': 'application/json' },
      success(res) {
        if (res.statusCode === 200) {
          resolve(res.data);
        } else {
          reject(new Error(res.data?.error || '请求失败'));
        }
      },
      fail(err) {
        reject(new Error('网络连接失败，请检查服务器是否已启动'));
      }
    });
  });
}

async function httpGet(url, params = {}) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: API_BASE + url,
      method: 'GET',
      data: params,
      header: { 'Content-Type': 'application/json' },
      success(res) {
        if (res.statusCode === 200) {
          resolve(res.data);
        } else {
          reject(new Error(res.data?.error || '请求失败'));
        }
      },
      fail(err) {
        reject(new Error('网络连接失败'));
      }
    });
  });
}

async function httpDelete(url) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: API_BASE + url,
      method: 'DELETE',
      header: { 'Content-Type': 'application/json' },
      success(res) {
        if (res.statusCode === 200) {
          resolve(res.data);
        } else {
          reject(new Error(res.data?.error || '请求失败'));
        }
      },
      fail(err) {
        reject(new Error('网络连接失败'));
      }
    });
  });
}

module.exports = {
  aiChat,
  userLogin,
  getHistoryList,
  getHistoryDetail,
  deleteHistory,
  submitFeedback
};
