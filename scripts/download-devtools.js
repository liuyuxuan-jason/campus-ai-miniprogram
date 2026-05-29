const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 下载微信开发者工具
const DOWNLOAD_URL = 'https://dldir1.qq.com/WechatWebDev/release/bea6e4b0f5cc7141d2da4b0b2ba2a761/wechat_devtools_1.06.241205_win32_x64.exe';
const outputPath = path.join('C:', 'Users', 'admin', 'Desktop', 'wechat_devtools_setup.exe');

console.log('正在下载微信开发者工具...');
console.log('下载地址:', DOWNLOAD_URL);

const file = fs.createWriteStream(outputPath);
https.get(DOWNLOAD_URL, (response) => {
  // 如果重定向
  if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
    console.log('重定向到:', response.headers.location);
    https.get(response.headers.location, (res2) => {
      res2.pipe(file);
      let downloaded = 0;
      res2.on('data', (chunk) => {
        downloaded += chunk.length;
        if (downloaded % 1048576 < 65536) { // 每约1MB打印一次
          process.stdout.write(`\r已下载: ${(downloaded / 1048576).toFixed(1)} MB`);
        }
      });
      file.on('finish', () => {
        file.close();
        console.log('\n✅ 下载完成!');
        console.log('路径:', outputPath);
        console.log('大小:', (fs.statSync(outputPath).size / 1048576).toFixed(1), 'MB');
      });
    });
    return;
  }
  response.pipe(file);
  let downloaded = 0;
  response.on('data', (chunk) => {
    downloaded += chunk.length;
    if (downloaded % 1048576 < 65536) {
      process.stdout.write(`\r已下载: ${(downloaded / 1048576).toFixed(1)} MB`);
    }
  });
  file.on('finish', () => {
    file.close();
    console.log('\n✅ 下载完成!');
    console.log('路径:', outputPath);
    console.log('大小:', (fs.statSync(outputPath).size / 1048576).toFixed(1), 'MB');
  });
}).on('error', (err) => {
  console.error('下载失败:', err.message);
  file.close();
  fs.unlinkSync(outputPath);
});
