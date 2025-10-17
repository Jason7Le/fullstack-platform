# 密码验证问题排查指南

## 概述

本文档介绍如何排查和解决用户登录时密码验证失败的问题，特别是当其他用户能正常登录，但特定用户无法登录的情况。

## 问题场景

- 用户反馈：使用 `admin@example.com` 和 `password123` 无法登录
- 现象：其他邮箱可以正常登录，只有特定用户不行
- 后端日志：查询用户后没有返回结果，接口卡住

## 排查步骤

### 1. 检查数据库连接

首先确认数据库连接正常：

```bash
# 检查Docker容器状态
docker ps

# 检查数据库连接
docker exec platform-mysql mysql -u app_user -puserpassword -D user_db -e "SELECT 1;"
```

### 2. 检查用户数据

查询问题用户的数据：

```bash
# 查看用户基本信息
docker exec platform-mysql mysql -u app_user -puserpassword -D user_db -e "SELECT id, email, name, role FROM users WHERE email = 'admin@example.com';"

# 查看密码哈希
docker exec platform-mysql mysql -u app_user -puserpassword -D user_db -e "SELECT email, passwordHash FROM users WHERE email = 'admin@example.com';"
```

### 3. 验证密码哈希

创建测试脚本验证密码：

```javascript
// test-password.js
const bcrypt = require('bcrypt');

// 从数据库获取的密码哈希
const passwordHash = '$2b$10$h9yE9LPWjbisQNF3UByoluEmNqv5Qx.f6fyBemCrOatNHXLAxnk4W';
const password = 'password123';

// 验证密码
bcrypt
  .compare(password, passwordHash)
  .then(result => {
    console.log('密码验证结果:', result);
  })
  .catch(error => {
    console.error('密码验证错误:', error);
  });
```

运行测试：

```bash
node test-password.js
```

### 4. 对比正常用户

检查能正常登录的用户：

```bash
# 查看正常用户的密码哈希
docker exec platform-mysql mysql -u app_user -puserpassword -D user_db -e "SELECT email, passwordHash FROM users WHERE email = 'user@example.com';"
```

测试正常用户的密码：

```javascript
// 测试正常用户的密码哈希
const normalPasswordHash = '$2b$10$.YQ9oyk66Qn3hVzEMwRbOeZ/0a8CEr4TESvqzHdLdRvLXyxhAZ3iC';
const password = 'password123';

bcrypt.compare(password, normalPasswordHash).then(result => {
  console.log('正常用户密码验证结果:', result);
});
```

## 解决方案

### 方案1：重新生成密码哈希

如果发现密码哈希损坏，重新生成：

```javascript
// generate-hash.js
const bcrypt = require('bcrypt');

// 生成新的密码哈希
const password = 'password123';
const saltRounds = 10;

bcrypt
  .hash(password, saltRounds)
  .then(hash => {
    console.log('新的密码哈希:', hash);
  })
  .catch(error => {
    console.error('生成哈希错误:', error);
  });
```

运行生成新哈希：

```bash
node generate-hash.js
```

### 方案2：更新数据库

使用新生成的哈希更新数据库：

```bash
# 更新密码哈希
docker exec platform-mysql mysql -u app_user -puserpassword -D user_db -e "UPDATE users SET passwordHash = '新的哈希值' WHERE email = 'admin@example.com';"
```

### 方案3：验证修复

验证修复是否成功：

```javascript
// 使用新的哈希值测试
const newPasswordHash = '新的哈希值';
const password = 'password123';

bcrypt.compare(password, newPasswordHash).then(result => {
  console.log('修复后密码验证结果:', result);
});
```

## 常见问题

### 1. 字符编码问题

如果用户名显示为 `?????`，可能是字符编码问题：

```bash
# 检查数据库字符集
docker exec platform-mysql mysql -u app_user -puserpassword -D user_db -e "SHOW VARIABLES LIKE 'character_set%';"
```

**解决方案**：

- 确保数据库使用 `utf8mb4` 字符集
- 检查连接字符集配置

### 2. 密码哈希算法不匹配

确保使用相同的bcrypt算法：

```javascript
// 检查哈希格式
const hash = '$2b$10$...'; // 正确的bcrypt格式
// $2b$ - bcrypt算法标识
// $10$ - 成本因子
// $... - 盐值和哈希
```

### 3. 数据库连接超时

如果查询卡住，检查：

```bash
# 检查数据库连接数
docker exec platform-mysql mysql -u app_user -puserpassword -D user_db -e "SHOW PROCESSLIST;"

# 检查数据库状态
docker exec platform-mysql mysql -u app_user -puserpassword -D user_db -e "SHOW STATUS LIKE 'Threads_connected';"
```

## 预防措施

### 1. 密码哈希验证

在用户创建时验证哈希：

```javascript
// 创建用户后立即验证
const user = await createUser(userData);
const isValid = await bcrypt.compare(userData.password, user.passwordHash);
if (!isValid) {
  throw new Error('密码哈希验证失败');
}
```

### 2. 数据库备份

定期备份用户数据：

```bash
# 备份用户表
docker exec platform-mysql mysqldump -u app_user -puserpassword user_db users > users_backup.sql
```

### 3. 监控日志

添加密码验证日志：

```javascript
// 在AuthService中添加日志
async validateUser(email: string, password: string) {
  const user = await this.userService.findByEmail(email);
  if (user) {
    const isValid = await PasswordUtil.comparePassword(password, user.passwordHash);
    console.log(`用户 ${email} 密码验证结果: ${isValid}`);
    return isValid ? user : null;
  }
  return null;
}
```

## 工具脚本

### 批量密码验证脚本

```javascript
// batch-password-check.js
const bcrypt = require('bcrypt');

const users = [
  { email: 'admin@example.com', password: 'password123' },
  { email: 'user@example.com', password: 'password123' },
  // 添加更多用户
];

async function checkAllPasswords() {
  for (const user of users) {
    // 这里需要从数据库获取哈希值
    const hash = await getPasswordHash(user.email);
    const isValid = await bcrypt.compare(user.password, hash);
    console.log(`${user.email}: ${isValid ? '✓' : '✗'}`);
  }
}

checkAllPasswords();
```

### 密码重置脚本

```javascript
// reset-password.js
const bcrypt = require('bcrypt');

async function resetPassword(email, newPassword) {
  const saltRounds = 10;
  const newHash = await bcrypt.hash(newPassword, saltRounds);

  // 更新数据库
  console.log(`更新用户 ${email} 的密码哈希: ${newHash}`);

  // 验证新密码
  const isValid = await bcrypt.compare(newPassword, newHash);
  console.log(`新密码验证结果: ${isValid}`);
}

// 使用示例
resetPassword('admin@example.com', 'password123');
```

## 总结

密码验证问题通常由以下原因引起：

1. **密码哈希损坏** - 最常见的原因
2. **字符编码问题** - 影响数据存储
3. **数据库连接问题** - 导致查询失败
4. **算法不匹配** - 哈希算法不一致

通过系统性的排查和验证，可以快速定位和解决问题。建议在生产环境中添加适当的监控和日志记录，以便及时发现和处理类似问题。
