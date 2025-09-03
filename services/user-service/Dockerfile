# Dockerfile
# 第一阶段：构建阶段
FROM node:20-alpine AS builder
# 使用Node.js 20版本的Alpine Linux镜像作为基础镜像，并命名为builder阶段
# Alpine Linux是一个轻量级的Linux发行版，适合容器化部署

# 设置工作目录
WORKDIR /app
# 在容器内创建并设置/app目录作为工作目录，后续的COPY、RUN等命令都在此目录下执行

# 复制 package.json 和 lock 文件
COPY package*.json ./
# 复制package.json和package-lock.json文件到容器的工作目录
# 使用通配符package*.json可以匹配package.json和package-lock.json

COPY pnpm-lock.yaml ./
# 复制pnpm的锁文件，确保依赖版本的一致性

# 安装 pnpm（如果基础镜像没有的话）
RUN npm install -g pnpm
# 全局安装pnpm包管理器，pnpm比npm更快且节省磁盘空间

# 安装依赖（包括 devDependencies，因为需要构建）
RUN pnpm install
# 安装所有依赖包，包括开发依赖，因为构建阶段需要TypeScript编译器等工具

# 复制源代码
COPY . .
# 将当前目录下的所有源代码文件复制到容器的工作目录中

# 构建应用（会生成 dist 目录）
RUN pnpm run build
# 执行构建脚本，将TypeScript代码编译为JavaScript，生成dist目录

# 第二阶段：生产运行阶段
FROM node:20-alpine AS production
# 开始第二阶段，使用相同的Node.js基础镜像，命名为production阶段
# 这样可以确保生产环境和构建环境的一致性

# 安装 pnpm
RUN npm install -g pnpm
# 在生产阶段也安装pnpm，用于管理依赖

# 设置工作目录
WORKDIR /app
# 设置生产阶段的工作目录

# 创建非root用户以提高安全性
RUN addgroup -g 1001 -S nodejs
# 创建一个名为nodejs的用户组，组ID为1001，-S表示系统组

RUN adduser -S nestjs -u 1001
# 创建一个名为nestjs的系统用户，用户ID为1001，属于nodejs组

# 复制 package.json
COPY package*.json ./
# 复制package.json文件到生产容器中

COPY pnpm-lock.yaml ./
# 复制pnpm锁文件到生产容器中

# 只安装生产依赖（不要 devDependencies）
RUN pnpm install --prod
# 只安装生产环境必需的依赖包，不安装开发依赖，减少镜像大小

# 从构建阶段复制编译后的文件
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
# 从builder阶段复制编译后的dist目录到生产容器
# --chown=nestjs:nodejs设置文件所有者为nestjs用户和nodejs组

# 切换用户
USER nestjs
# 切换到nestjs用户，提高安全性，避免以root权限运行应用

# 暴露端口（NestJS 默认是 3000）
EXPOSE 3000
# 声明容器将使用3000端口，这是NestJS应用的默认端口

# 启动应用
CMD ["node", "dist/main"]
# 容器启动时执行的命令，运行编译后的main.js文件