// pages/history/history.js
const api = require('../../utils/api');

Page({
  data: {
    historyList: [],
    page: 1,
    pageSize: 20,
    hasMore: true,
    isLoading: false,
    currentFilter: 'all',
    filters: [
      { key: 'all', name: '全部' },
      { key: 'writing', name: '写作' },
      { key: 'learning', name: '学习' },
      { key: 'creative', name: '创意' },
      { key: 'chat', name: '对话' }
    ]
  },

  onShow() {
    this.loadHistory(true);
  },

  loadHistory(refresh = false) {
    if (this.data.isLoading) return;
    
    this.setData({ isLoading: true });
    if (refresh) {
      this.setData({ page: 1, historyList: [] });
    }

    const { page, pageSize, currentFilter } = this.data;
    const mode = currentFilter === 'all' ? '' : currentFilter;

    api.getHistoryList(page, pageSize, mode).then(res => {
      const { list, total } = res.result;
      this.setData({
        historyList: refresh ? list : [...this.data.historyList, ...list],
        hasMore: this.data.historyList.length + list.length < total,
        isLoading: false
      });
    }).catch(() => {
      this.setData({ isLoading: false });
    });
  },

  // 加载更多
  onLoadMore() {
    if (!this.data.hasMore) return;
    this.setData({ page: this.data.page + 1 });
    this.loadHistory();
  },

  // 筛选
  onFilter(e) {
    const key = e.currentTarget.dataset.key;
    if (key === this.data.currentFilter) return;
    this.setData({ currentFilter: key }, () => {
      this.loadHistory(true);
    });
  },

  // 点击进入对话
  onTapHistory(e) {
    const sessionId = e.currentTarget.dataset.id;
    const mainMode = e.currentTarget.dataset.mainmode;
    const subMode = e.currentTarget.dataset.submode;
    wx.navigateTo({
      url: `/pages/chat/chat?mainMode=${mainMode}&subMode=${subMode}&sessionId=${sessionId}`
    });
  },

  // 删除对话
  onDelete(e) {
    const sessionId = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定删除？',
      success: (res) => {
        if (res.confirm) {
          api.deleteHistory(sessionId).then(() => {
            wx.showToast({ title: '已删除', icon: 'success' });
            this.loadHistory(true);
          });
        }
      }
    });
  }
});
