# 构建错误故障排除指南

本文档列出了 `pnpm run build` 时常见的错误及解决方法。

## 📋 目录

- [常见错误类型](#常见错误类型)
- [解决方案](#解决方案)
- [分步构建调试](#分步构建调试)

---

## 常见错误类型

### 1. TypeScript 类型检查错误

**错误示例**:

```
error TS2307: Cannot find module '@fullstack-platform/common'
error TS2339: Property 'xxx' does not exist on type 'yyy'
```

**原因**:

- 类型定义不完整
- 模块路径未正确解析
- Monorepo 工作空间包未正确链接

---

### 2. 依赖包缺失错误

**错误示例**:

```
Cannot find module 'xxx'
Error: Cannot find module '@/xxx'
```

**原因**:

- 依赖未安装
- Monorepo 工作空间包未构建
- 路径别名配置错误

---

### 3. Monorepo 工作空间错误

**错误示例**:

```
ERR_PNPM_NO_IMPORTER_MANIFEST_FOUND
Cannot find package '@fullstack-platform/common'
```

**原因**:

- 工作空间配置错误
- 公共包未构建

---

### 4. 构建工具配置错误

**错误示例**:

```
[plugin:vite:vue] Unexpected token
Failed to resolve import "xxx"
```

**原因**:

- Vite 配置问题
- 模块联邦配置错误

---

## 解决方案

### 🔧 方案 1: 清理并重新安装依赖

这是最常用的解决方法，适用于大部分构建错误：

```bash
# 1. 清理所有 node_modules
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf services/*/node_modules
rm -rf packages/*/node_modules

# Windows PowerShell:
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force apps/*/node_modules
Remove-Item -Recurse -Force services/*/node_modules
Remove-Item -Recurse -Force packages/*/node_modules

# 2. 清理构建产物
pnpm run clean
# 或手动删除
rm -rf apps/*/dist
rm -rf services/*/dist
rm -rf packages/*/dist

# 3. 清理 pnpm 缓存
pnpm store prune

# 4. 重新安装依赖
pnpm install

# 5. 构建公共包（如果有）
pnpm run build:packages
# 或
pnpm run build:monitoring

# 6. 再次尝试构建
pnpm run build
```

---

### 🔧 方案 2: 构建顺序问题 - 先构建公共包

Monorepo 项目需要先构建公共包，再构建应用：

```bash
# 1. 构建公共包（必须）
cd packages/common
pnpm run build
cd ../monitoring
pnpm run build
cd ../..

# 或使用根目录命令
pnpm run build:packages
pnpm run build:monitoring

# 2. 构建应用
pnpm run build:frontend
pnpm run build:dashboard
pnpm run build:gateway
pnpm run build:backend
pnpm run build:settings
```

**修改根目录 package.json**，在构建脚本前添加公共包构建：

```json
{
  "scripts": {
    "build": "pnpm run build:packages && pnpm run build:monitoring && pnpm run build:frontend && pnpm run build:gateway && pnpm run build:backend && pnpm run build:settings"
  }
}
```

---

### 🔧 方案 3: TypeScript 配置问题

#### 3.1 检查 tsconfig.json 路径配置

确保每个子项目的 `tsconfig.json` 正确配置了路径别名：

**apps/main-app/tsconfig.json**:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "extends": "../tsconfig.json" // 如果有根配置
}
```

#### 3.2 跳过类型检查（临时方案）

如果类型错误不影响运行，可以临时跳过类型检查：

**修改构建脚本**（`apps/main-app/package.json`）:

```json
{
  "scripts": {
    "build": "vite build" // 移除 vue-tsc -b
  }
}
```

**注意**: 这只是临时方案，应尽快修复类型错误。

---

### 🔧 方案 4: Monorepo 工作空间配置问题

#### 4.1 检查 pnpm-workspace.yaml

确保工作空间配置正确：

```yaml
packages:
  - 'apps/*'
  - 'services/*'
  - 'packages/*'
```

#### 4.2 检查 package.json 的 workspaces

根目录 `package.json`:

```json
{
  "workspaces": [
    "app/*", // 注意：可能是 "apps/*" 而不是 "app/*"
    "services/*",
    "packages/*"
  ]
}
```

如果工作空间路径不匹配，修改为正确路径。

---

### 🔧 方案 5: 模块联邦配置问题

如果使用模块联邦（微前端），检查 Vite 配置：

**apps/main-app/vite.config.ts**:

```typescript
import federation from '@originjs/vite-plugin-federation';

export default {
  plugins: [
    federation({
      name: 'main-app',
      remotes: {
        'dashboard-app': 'http://localhost:3003/assets/remoteEntry.js',
      },
      shared: {
        vue: { singleton: true },
        'vue-router': { singleton: true },
      },
    }),
  ],
};
```

**构建时的问题**:

- 如果远程模块未构建，可以先注释掉 `remotes` 配置
- 或确保所有远程应用都已构建完成

---

### 🔧 方案 6: NestJS 构建问题

#### 6.1 检查 nest-cli.json

确保每个 NestJS 服务的 `nest-cli.json` 存在且配置正确：

**services/user-service/nest-cli.json**:

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
```

#### 6.2 检查 tsconfig.json

确保 NestJS 服务的 TypeScript 配置正确：

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true
  }
}
```

#### 6.3 清理 NestJS 构建缓存

```bash
# 删除 dist 目录
rm -rf services/user-service/dist
rm -rf services/api-gateway/dist
rm -rf services/settings-service/dist

# 重新构建
pnpm run build:backend
pnpm run build:gateway
pnpm run build:settings
```

---

## 分步构建调试

如果整体构建失败，可以分步构建以定位问题：

### 步骤 1: 构建公共包

```bash
# 构建 common 包
cd packages/common
pnpm run build

# 构建 monitoring 包
cd ../monitoring
pnpm run build
```

**如果失败**: 检查公共包的 TypeScript 配置和依赖

---

### 步骤 2: 构建前端应用

```bash
# 构建主应用
cd apps/main-app
pnpm run build

# 构建仪表板应用
cd ../dashboard-app
pnpm run build
```

**如果失败**:

- 检查 Vite 配置
- 检查 TypeScript 类型错误
- 检查模块联邦配置

---

### 步骤 3: 构建后端服务

```bash
# 构建 API 网关
cd services/api-gateway
pnpm run build

# 构建用户服务
cd ../user-service
pnpm run build

# 构建设置服务
cd ../settings-service
pnpm run build
```

**如果失败**:

- 检查 NestJS 配置
- 检查数据库连接（构建时通常不需要，但可能影响）
- 检查环境变量配置

---

## 常见错误信息对照表

| 错误信息                                          | 可能原因             | 解决方案                                     |
| ------------------------------------------------- | -------------------- | -------------------------------------------- |
| `Cannot find module '@fullstack-platform/common'` | 公共包未构建或未链接 | 先运行 `pnpm run build:packages`             |
| `ERR_PNPM_NO_IMPORTER_MANIFEST_FOUND`             | 工作空间配置错误     | 检查 `pnpm-workspace.yaml` 和 `package.json` |
| `Property 'xxx' does not exist`                   | TypeScript 类型错误  | 修复类型定义或临时跳过类型检查               |
| `Failed to resolve import`                        | 路径别名配置错误     | 检查 `tsconfig.json` 和 `vite.config.ts`     |
| `[plugin:vite:vue] Unexpected token`              | Vue 组件语法错误     | 检查组件代码语法                             |
| `nest build` 失败                                 | NestJS 配置问题      | 检查 `nest-cli.json` 和依赖                  |

---

## 快速修复清单

遇到构建错误时，按以下顺序尝试：

1. ✅ **清理并重新安装依赖**

   ```bash
   rm -rf node_modules apps/*/node_modules services/*/node_modules packages/*/node_modules
   pnpm install
   ```

2. ✅ **构建公共包**

   ```bash
   pnpm run build:packages
   pnpm run build:monitoring
   ```

3. ✅ **清理构建产物**

   ```bash
   pnpm run clean
   ```

4. ✅ **分步构建定位问题**

   ```bash
   pnpm run build:frontend  # 单独测试前端构建
   ```

5. ✅ **检查 TypeScript 配置**
   - 确保所有 `tsconfig.json` 配置正确
   - 检查路径别名是否一致

6. ✅ **更新依赖版本**

   ```bash
   pnpm update
   ```

7. ✅ **检查 Node.js 和 pnpm 版本**
   ```bash
   node --version  # 应该 >= 20.19.0
   pnpm --version  # 应该 >= 8.15.0
   ```

---

## 如果以上都不行

1. **查看详细错误日志**:

   ```bash
   pnpm run build 2>&1 | tee build-error.log
   ```

2. **检查具体哪个步骤失败**:
   逐个运行构建命令，定位具体失败的服务

3. **检查环境变量**:
   某些构建可能需要环境变量，检查 `.env` 文件

4. **查看 GitHub Issues**:
   如果是依赖包的问题，查看对应包的 GitHub Issues

5. **提交问题**:
   如果都无法解决，记录详细的错误信息（包括 Node.js 版本、pnpm 版本、错误堆栈）提交 Issue

---

## 预防措施

1. **定期更新依赖**: `pnpm update`
2. **使用锁文件**: 确保 `pnpm-lock.yaml` 已提交到版本控制
3. **统一环境**: 使用 `.nvmrc` 或 `package.json` 中的 `engines` 字段固定版本
4. **CI/CD 验证**: 在 CI/CD 中运行构建，及早发现问题

---

## 相关文档

- [项目 README](../README.md)
- [快速开始指南](../README.md#快速开始)
- [本地部署指南](./local-deployment-guide.md)
