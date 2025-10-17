#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 开始格式化代码...\n');

try {
  // 格式化所有文件
  console.log('📝 格式化所有文件...');
  execSync('npx prettier --write .', { stdio: 'inherit' });

  console.log('\n✅ 代码格式化完成！');
} catch (error) {
  console.error('❌ 格式化失败:', error.message);
  process.exit(1);
}
