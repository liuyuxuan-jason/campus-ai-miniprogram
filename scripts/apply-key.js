const fs = require('fs');
const path = require('path');

const ROOT = 'C:\\Users\\admin\\.openclaw\\workspace\\projects\\campus-ai-studio';

// 更新 ai-chat/index.js 的 API Key
const chatPath = path.join(ROOT, 'cloud-functions', 'ai-chat', 'index.js');
let chatJs = fs.readFileSync(chatPath, 'utf8');

// 替换 API Key
chatJs = chatJs.replace(
  /const API_KEY = proces…_KEY \|\| '[^']*'/,
  "const API_KEY = proces…ment.env.DEEPSEEK_API_KEY || 'sk-82fea5b4023f412cb541f93bb75ea5b1'"
);

// 还要修复拼写错误 proces…_KEY -> process.env.DEEPSEEK_API_KEY
chatJs = chatJs.replace(
  'proces…_KEY',
  'process.env.DEEPSEEK_API_KEY'
);

fs.writeFileSync(chatPath, chatJs, 'utf8');
console.log('✅ API Key 已写入 ai-chat/index.js');

// 验证
const verify = fs.readFileSync(chatPath, 'utf8');
const hasKey = verify.includes('sk-82fea5b4023f412cb541f93bb75ea5b1');
console.log('  验证:', hasKey ? '✅ Key 已配置' : '❌ 未找到 Key');

// 输出当前状态
console.log('\n📋 当前配置状态:');
console.log('  AppID:      ✅ wxc54eec7967a64e10');
console.log('  API Key:    ✅ sk-82fe...ea5b1');
console.log('  云环境 ID:  ⏳ 待提供');
