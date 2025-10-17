#!/bin/bash

# 全栈微前端数据平台 - 后端服务启动脚本
# 简化版本，使用 concurrently 启动所有服务

set -e

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 启动后端服务...${NC}"

# 检查依赖
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm 未安装，请先安装 pnpm"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker"
    exit 1
fi

# 启动基础设施服务
echo -e "${BLUE}📦 启动基础设施服务...${NC}"
cd infra && docker-compose up -d && cd ..

# 等待服务启动
echo -e "${BLUE}⏳ 等待服务启动...${NC}"
sleep 5

# 启动后端服务
echo -e "${GREEN}✅ 启动后端微服务...${NC}"
pnpm run start:backend