#!/bin/bash

# 环境初始化脚本
echo "正在设置环境变量..."

# 复制全局配置
if [ ! -f .env ]; then
    cp .env.example .env
    echo "已创建全局 .env 文件"
else
    echo "全局 .env 文件已存在，跳过"
fi

# 复制服务配置
for service in services/*; do
    if [ -d "$service" ] && [ -f "$service/.env.example" ]; then
        if [ ! -f "$service/.env" ]; then
            cp "$service/.env.example" "$service/.env"
            echo "已创建 $service/.env 文件"
        else
            echo "$service/.env 已存在，跳过"
        fi
    fi
done

# 复制应用配置
for app in apps/*; do
    if [ -d "$app" ] && [ -f "$app/.env.example" ]; then
        if [ ! -f "$app/.env" ]; then
            cp "$app/.env.example" "$app/.env"
            echo "已创建 $app/.env 文件"
        else
            echo "$app/.env 已存在，跳过"
        fi
    fi
done

echo "环境变量设置完成！请编辑各 .env 文件配置实际值"