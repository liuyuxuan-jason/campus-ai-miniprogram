const fs = require('fs');
const path = require('path');

const ROOT = 'C:\\Users\\admin\\.openclaw\\workspace\\projects\\campus-ai-studio';

// 1. 更新 project.config.json
const configPath = path.join(ROOT, 'project.config.json');
let config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
config.appid = 'wxc54eec7967a64e10';
fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
console.log('project.config.json -> AppID 已配置');

// 2. 更新 app.js 云环境（占位）
const appJsPath = path.join(ROOT, 'miniprogram', 'app.js');
let appJs = fs.readFileSync(appJsPath, 'utf8');
appJs = appJs.replace(/env:\s*'[^']*'/, "env: '你的云开发环境ID'");
fs.writeFileSync(appJsPath, appJs, 'utf8');
console.log('app.js -> 已标记云环境待填');

// 3. 更新 ai-chat 的 API Key（占位）
const chatPath = path.join(ROOT, 'cloud-functions', 'ai-chat', 'index.js');
let chatJs = fs.readFileSync(chatPath, 'utf8');
chatJs = chatJs.replace(/\|\| '你的DeepSeekAPIKey'/, "|| '你的DeepSeekAPIKey'");
chatJs = chatJs.replace(/\|\| '[^']*'/, "|| '你的DeepSeekAPIKey'");
fs.writeFileSync(chatPath, chatJs, 'utf8');
console.log('ai-chat/index.js -> 已标记 API Key 待填');

console.log('\n配置状态:');
console.log('  AppID:      wxc54eec7967a64e10  ✅');
console.log('  云环境 ID:  待提供                ⏳');
console.log('  API Key:    待提供                ⏳');
