# 修复装饰器错误 TS1240

## 错误原因

`TS1240: Unable to resolve signature of property decorator` 通常由以下原因导致：

1. TypeScript 编译器缓存问题
2. `strictPropertyInitialization` 与装饰器冲突
3. TypeScript 版本与装饰器元数据不兼容

## 解决步骤

### 步骤 1: 清理构建缓存

```bash
# 删除 dist 目录
rm -rf dist

# 删除 TypeScript 增量构建文件
rm -rf *.tsbuildinfo
rm -rf **/*.tsbuildinfo

# Windows PowerShell:
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
Remove-Item -Force *.tsbuildinfo -ErrorAction SilentlyContinue
```

### 步骤 2: 清理 node_modules（如果问题持续）

```bash
# 清理并重新安装依赖
rm -rf node_modules
pnpm install
```

### 步骤 3: 验证配置

确保 `tsconfig.json` 包含以下关键配置：

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "strictPropertyInitialization": false,
    "module": "commonjs",
    "moduleResolution": "node"
  }
}
```

### 步骤 4: 重新构建

```bash
pnpm run build
```

## 如果问题仍然存在

1. **检查 TypeScript 版本**:

   ```bash
   npx tsc --version
   ```

   确保版本 >= 4.x

2. **检查 reflect-metadata 已导入**:
   确保 `src/main.ts` 第一行有：

   ```typescript
   import 'reflect-metadata';
   ```

3. **检查 TypeORM 版本兼容性**:
   查看 `package.json`，确保 TypeORM 版本 >= 0.3.x

4. **重启 IDE/编辑器**:
   有时 IDE 的 TypeScript 语言服务器需要重启才能识别配置更改
