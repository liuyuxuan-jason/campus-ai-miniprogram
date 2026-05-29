// pages/chat/chat.js - 核心对话页面
const { getPrompt, getModeList } = require('../../utils/promptTemplates');
const api = require('../../utils/api');

Page({
  data: {
    // 模式信息
    mainMode: 'writing',
    subMode: 'paperPolish',
    modeInfo: null,
    modeList: [],

    // 对话数据
    messages: [],
    inputText: '',
    isThinking: false,

    // UI 状态
    showModePicker: false,
    showDisclaimer: false,
    sessionId: '',

    // 滚动
    scrollTop: 0,
    scrollIntoView: ''
  },

  onLoad(options) {
    const { mainMode, subMode, sessionId } = options;

    // 加载模式列表
    const modeList = getModeList();
    this.setData({ modeList });

    // 检查是否需要展示免责声明
    const agreed = wx.getStorageSync('disclaimer_agreed');
    if (!agreed) {
      this.setData({ showDisclaimer: true });
    }

    // 恢复或新建对话
    if (sessionId) {
      this.loadSession(sessionId);
    } else {
      this.switchMode(mainMode || 'writing', subMode || 'paperPolish');
    }
  },

  // 切换到指定模式
  switchMode(mainMode, subMode) {
    const prompt = getPrompt(mainMode, subMode);
    const mainInfo = this.data.modeList.find(m => m.key === mainMode);

    this.setData({
      mainMode,
      subMode,
      modeInfo: {
        ...prompt,
        mainName: mainInfo ? mainInfo.name : 'AI 助手',
        mainColor: mainInfo ? mainInfo.color : '#4A90D9'
      },
      messages: [{
        role: 'assistant',
        content: `👋 你好！欢迎使用 **${mainInfo ? mainInfo.name : 'AI 助手'}**\n\n${this.getWelcomeMessage(subMode)}`,
        id: Date.now()
      }],
      sessionId: this.generateSessionId()
    });

    // 更新标题
    wx.setNavigationBarTitle({
      title: prompt.name || 'AI 对话'
    });
  },

  // 获取欢迎语
  getWelcomeMessage(subMode) {
    const welcomes = {
      paperPolish: '请粘贴你的论文段落，我会帮你润色优化。',
      essayGrade: '输入你的作文内容，我会给出评分和详细批改建议。',
      copywriting: '告诉我你想写什么文案，我来帮你创作。',
      knowledgeQA: '有什么学习问题？直接问我就好！',
      noteSummary: '粘贴你的笔记或学习资料，我帮你整理总结。',
      materialAnalysis: '上传或粘贴资料内容，我来帮你深度分析。',
      pptOutline: '告诉我 PPT 的主题，我帮你生成完整大纲。',
      imagePrompt: '描述你想要的画面，我帮你生成 AI 绘画提示词。',
      videoScript: '告诉我视频的主题和类型，我帮你写完整脚本。',
      campusQA: '学习生活有任何问题，随时问我～'
    };
    return welcomes[subMode] || '有什么我可以帮你的吗？';
  },

  // 生成会话 ID
  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  },

  // 加载历史会话
  loadSession(sessionId) {
    wx.showLoading({ title: '加载中...' });
    api.getHistoryDetail(sessionId).then(res => {
      const session = res.result;
      if (session) {
        this.switchMode(session.mainMode, session.subMode);
        // 延迟设置历史消息
        setTimeout(() => {
          this.setData({
            messages: session.messages || this.data.messages,
            sessionId: session._id || this.data.sessionId
          });
        }, 100);
      }
      wx.hideLoading();
    }).catch(() => {
      wx.hideLoading();
      this.switchMode('writing', 'paperPolish');
    });
  },

  // 输入框输入
  onInput(e) {
    this.setData({ inputText: e.detail.value });
  },

  // 发送消息
  onSend() {
    const { inputText, isThinking } = this.data;
    if (!inputText.trim() || isThinking) return;

    const userMsg = {
      role: 'user',
      content: inputText.trim(),
      id: Date.now()
    };

    const newMessages = [...this.data.messages, userMsg];
    this.setData({
      messages: newMessages,
      inputText: '',
      isThinking: true,
      scrollIntoView: 'msg-' + userMsg.id
    });

    // 调用 AI
    this.callAI(newMessages);
  },

  // 调用 AI 云函数
  callAI(messages) {
    const { mainMode, subMode, sessionId } = this.data;

    // 构建历史（排除系统消息和欢迎语）
    const history = messages
      .filter(m => m.role !== 'system' && m.id)
      .slice(-10) // 保留最近 10 轮
      .map(m => ({
        role: m.role,
        content: m.content
      }));

    api.aiChat(mainMode + '/' + subMode, messages[messages.length - 1].content, history)
      .then(res => {
        const reply = res.result.reply || '抱歉，我暂时无法回答这个问题，请稍后再试。';
        const aiMsg = {
          role: 'assistant',
          content: reply,
          id: Date.now()
        };

        this.setData({
          messages: [...this.data.messages, aiMsg],
          isThinking: false,
          scrollIntoView: 'msg-' + aiMsg.id
        });

        // 自动保存到历史（云开发）
        this.autoSaveSession([...this.data.messages]);
      })
      .catch(err => {
        console.error('AI 调用失败', err);
        const errorMsg = {
          role: 'assistant',
          content: '😅 抱歉，AI 回复出错了，请稍后再试。\n\n如果持续出错，请检查网络连接或联系开发者。',
          id: Date.now(),
          isError: true
        };
        this.setData({
          messages: [...this.data.messages, errorMsg],
          isThinking: false
        });
      });
  },

  // 自动保存会话 - 服务端已自动保存，本地不再重复保存
  autoSaveSession(messages) {
    // 服务端 ai-chat 接口已自动保存历史记录
  },

  // 切换模式
  showModePicker() {
    this.setData({ showModePicker: !this.data.showModePicker });
  },

  onSelectMode(e) {
    const { mainKey, subKey } = e.currentTarget.dataset;
    // 确认切换
    wx.showModal({
      title: '切换模式',
      content: '切换后将清空当前对话，确定吗？',
      success: (res) => {
        if (res.confirm) {
          this.switchMode(mainKey, subKey);
          this.setData({ showModePicker: false });
        }
      }
    });
  },

  // 同意免责声明
  onAgreeDisclaimer() {
    wx.setStorageSync('disclaimer_agreed', true);
    this.setData({ showDisclaimer: false });
  },

  // 新对话
  onNewChat() {
    wx.showActionSheet({
      itemList: ['清空并开始新对话'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.switchMode(this.data.mainMode, this.data.subMode);
        }
      }
    });
  },

  // 复制消息
  onCopyMsg(e) {
    const content = e.currentTarget.dataset.content;
    wx.setClipboardData({
      data: content,
      success: () => {
        wx.showToast({ title: '已复制', icon: 'success' });
      }
    });
  }
});
