// setup.js — 项目自动配置脚本
// 在项目根目录运行: node setup.js
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ROOT = __dirname;

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

function updateFile(filePath, replacements) {
  let content = fs.readFileSync(filePath, 'utf8');
  for (const [search, replace] of replacements) {
    content = content.replace(search, replace);
  }
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`  ✅ 已更新: ${path.relative(ROOT, filePath)}`);
}

async function main() {
  console.log('\n========================================');
  console.log('   🚀 校园AI服务工作室 - 自动配置脚本');
  console.log('========================================\n');

  // 1. 获取配置信息
  const appid = await ask('📌 请输入你的小程序 AppID: ');
  const envId = await ask('📌 请输入你的云开发环境 ID: ');
  const apiKey = await ask('📌 请输入你的 DeepSeek API Key: ');

  console.log('\n⏳ 正在配置项目...\n');

  // 2. 配置 project.config.json
  updateFile(
    path.join(ROOT, 'project.config.json'),
    [[/("appid"\s*:\s*)"[^"]*"/, `$1"${appid}"`]]
  );

  // 3. 配置 app.js 中的云环境 ID
  updateFile(
    path.join(ROOT, 'miniprogram', 'app.js'),
    [[/env:\s*'[^']*'/, `env: '${envId}'`]]
  );

  // 4. 配置 ai-chat 云函数中的 API Key
  updateFile(
    path.join(ROOT, 'cloud-functions', 'ai-chat', 'index.js'),
    [[/\|\| '[^']*'/, `|| '${apiKey}'`]]
  );

  // 5. 生成云函数环境变量配置文件
  const envConfig = {
    DEEPSEEK_API_KEY: apiKey
  };
  const envPath = path.join(ROOT, 'cloud-functions', 'ai-chat', 'environment.json');
  fs.writeFileSync(envPath, JSON.stringify(envConfig, null, 2), 'utf8');
  console.log(`  ✅ 已生成: cloud-functions/ai-chat/environment.json`);

  // 6. 生成数据库初始化脚本
  const dbScript = `// 数据库初始化脚本
// 在云开发控制台 → 数据库 中运行此脚本
const db = cloud.database();

// 创建集合（云开发控制台手动操作）
// 需要创建: chat-history, users, feedback

// chat-history 权限规则:
// {
//   "read": "doc._openid == auth.openid",
//   "write": "doc._openid == auth.openid"
// }

console.log('✅ 数据库配置完成');
`;

  const dbPath = path.join(ROOT, 'scripts', 'database-init.js');
  if (!fs.existsSync(path.join(ROOT, 'scripts'))) {
    fs.mkdirSync(path.join(ROOT, 'scripts'));
  }
  fs.writeFileSync(dbPath, dbScript, 'utf8');
  console.log(`  ✅ 已生成: scripts/database-init.js`);

  // 7. 写配置完成标记文件
  const configInfo = {
    appid,
    envId,
    configuredAt: new Date().toISOString(),
    nextSteps: [
      '打开微信开发者工具，导入项目',
      '右键云函数 → 上传并部署（云端安装依赖）',
      '在云开发控制台创建 chat-history, users, feedback 集合',
      '配置集合权限（参考部署指南.md）'
    ]
  };
  fs.writeFileSync(
    path.join(ROOT, '.config-done.json'),
    JSON.stringify(configInfo, null, 2),
    'utf8'
  );

  console.log('\n========================================');
  console.log('   ✅ 配置完成！');
  console.log('========================================\n');
  console.log('📱 下一步操作:');
  console.log('   1. 打开微信开发者工具');
  console.log('   2. 导入项目目录: ' + ROOT);
  console.log('   3. 右键云函数目录 → 上传并部署（云端安装依赖）');
  console.log('   4. 在云开发控制台创建数据库集合');
  console.log('\n📖 详细步骤见: 部署指南.md\n');

  rl.close();
}

main().catch(console.error);
