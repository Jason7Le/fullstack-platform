-- MySQL 初始化脚本
-- 确保 app_user 有正确的权限

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS user_db;

-- 确保用户存在并设置正确权限
CREATE USER IF NOT EXISTS 'app_user'@'%' IDENTIFIED BY 'userpassword';
GRANT ALL PRIVILEGES ON user_db.* TO 'app_user'@'%';

-- 允许从 localhost 连接
CREATE USER IF NOT EXISTS 'app_user'@'localhost' IDENTIFIED BY 'userpassword';
GRANT ALL PRIVILEGES ON user_db.* TO 'app_user'@'localhost';

-- 刷新权限
FLUSH PRIVILEGES;

-- 显示用户权限（用于调试）
SHOW GRANTS FOR 'app_user'@'%';
SHOW GRANTS FOR 'app_user'@'localhost';
