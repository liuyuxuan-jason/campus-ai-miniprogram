// cloud-functions/ai-chat/index.js
// AI 对话云函数 - 调用 DeepSeek API

const cloud = require('wx-server-sdk');
cloud.init();

// DeepSeek API 配置
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
// API Key 在云函数环境变量中配置
const API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-82fea5b4023f412cb541f93bb75ea5b1';

// 各模式的系统提示词
const SYSTEM_PROMPTS = {
  'writing/paperPolish': '你是一个专业的学术写作助手。请帮用户润色文本：保持学术严谨性，不改变核心意思，优化语法和句式，提升表达流畅度。请先给出修改后文本，再列出修改要点说明。',
  'writing/essayGrade': '你是一个专业教师，请对用户的作文进行批改评分（满分100分）。从内容与立意(30分)、结构与逻辑(25分)、语言表达(25分)、格式与规范(20分)四个维度评价。给出总分、各维度评分、详细批注和改进建议。',
  'writing/copywriting': '你是一个专业的文案创作助手。根据用户需求生成文案，风格适配，提供多个版本（至少2个不同风格）。可创作：广告文案、社交媒体文案、产品介绍、活动推广等。',
  'learning/knowledgeQA': '你是一个大学课程辅导助手。回答学习问题时：解释清晰准确，善用类比例子，使用适合大学生的知识水平，不确定时说明。覆盖各学科大学课程内容。',
  'learning/noteSummary': '你是一个笔记整理助手。对用户提供的资料进行智能总结：提取核心观点，按逻辑结构重组，标记重点难点，使用思维导图层级结构。',
  'learning/materialAnalysis': '你是一个资料分析助手。对用户提供的资料进行深度分析：识别资料类型，提取核心论点，分析论据逻辑，给出优缺点评价。',
  'creative/pptOutline': '你是一个 PPT 大纲生成助手。根据用户主题生成结构化大纲：封面-目录-正文(每页3-5要点配配图建议)-总结。使用Markdown格式，8-15页。',
  'creative/imagePrompt': '你是一个 AI 绘画提示词生成助手。将用户描述转化为高质量中英文提示词。输出：英文提示词、中文提示词、画面描述、参数建议。',
  'creative/videoScript': '你是一个短视频脚本创作助手。生成完整视频脚本：基本信息、分镜表格、文案全文、拍摄建议、后期建议。默认时长60秒。',
  'chat/campusQA': '你是一个校园 AI 助手，帮助大学生解决校园生活和学习问题。回复友好亲切像学长学姐，信息准确，不确定时建议查阅学校官方通知。涵盖选课建议、学习规划、校园生活、就业指导等。'
};

// 默认通用提示词
const DEFAULT_SYSTEM_PROMPT = '你是一个智能 AI 助手，用中文回答用户问题。回答要清晰、准确、有帮助，不知道就说不知道。';

exports.main = async (event, context) => {
  const { mode, content, history = [], fileList = [] } = event;

  // 1. 获取系统提示词
  const systemPrompt = SYSTEM_PROMPTS[mode] || DEFAULT_SYSTEM_PROMPT;

  // 2. 组装消息
  const messages = [
    { role: 'system', content: systemPrompt }
  ];

  // 添加历史（限制最近10轮）
  const recentHistory = (history || []).slice(-10);
  messages.push(...recentHistory);

  // 添加用户当前输入
  let userContent = content;
  if (fileList && fileList.length > 0) {
    userContent = '[用户上传了文件，但文件处理需要额外逻辑]\n\n' + content;
  }
  messages.push({ role: 'user', content: userContent });

  // 3. 调用 DeepSeek API
  try {
    const result = await callDeepSeek(messages);
    return { reply: result };
  } catch (err) {
    console.error('DeepSeek API 调用失败:', err);
    throw err;
  }
};

// 调用 DeepSeek API
async function callDeepSeek(messages) {
  const response = await new Promise((resolve, reject) => {
    // 使用云开发的 HTTP 调用能力，或直接使用 wx.request 风格
    // 这里使用 axios 风格 - 云函数原生支持 fetch
    const https = require('https');

    const data = JSON.stringify({
      model: 'deepseek-chat',
      messages: messages,
      temperature: 0.7,
      max_tokens: 2048,
      stream: false
    });

    const req = https.request(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + API_KEY
      },
      timeout: 30000
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (json.choices && json.choices.length > 0) {
            resolve(json.choices[0].message.content);
          } else {
            reject(new Error('API 返回异常: ' + (json.error?.message || body)));
          }
        } catch (e) {
          reject(new Error('解析响应失败: ' + body));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('请求超时'));
    });

    req.write(data);
    req.end();
  });

  return response;
}
