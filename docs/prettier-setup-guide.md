# Prettier 自动代码格式化配置指南

## 概述

本项目已配置完整的 Prettier 自动代码格式化系统，包括：

- ✅ Prettier 配置文件 (`.prettierrc`)
- ✅ 忽略文件配置 (`.prettierignore`)
- ✅ VSCode 工作区设置 (`.vscode/settings.json`)
- ✅ Git 钩子配置 (Husky + lint-staged)
- ✅ ESLint 集成

## 配置详情

### 1. Prettier 配置 (`.prettierrc`)

```json
{
  "singleQuote": true, // 使用单引号
  "semi": true, // 语句末尾添加分号
  "printWidth": 100, // 行宽限制 100 字符
  "trailingComma": "all", // 多行时添加尾随逗号
  "tabWidth": 2, // 缩进 2 个空格
  "useTabs": false, // 使用空格而非制表符
  "endOfLine": "lf", // 使用 LF 换行符
  "bracketSpacing": true, // 对象括号内添加空格
  "bracketSameLine": false, // 标签的 > 单独一行
  "arrowParens": "avoid", // 箭头函数单参数时省略括号
  "vueIndentScriptAndStyle": false, // Vue 文件 script 和 style 不缩进
  "htmlWhitespaceSensitivity": "css", // HTML 空白符敏感度
  "embeddedLanguageFormatting": "auto" // 自动格式化嵌入语言
}
```

### 2. VSCode 自动格式化

已配置以下功能：

- **保存时自动格式化** (`formatOnSave: true`)
- **粘贴时自动格式化** (`formatOnPaste: true`)
- **默认格式化工具**: Prettier
- **支持的文件类型**: TypeScript, JavaScript, Vue, HTML, CSS, SCSS, JSON, Markdown

### 3. Git 钩子配置

#### Pre-commit 钩子

- 运行 `lint-staged` 对暂存文件进行格式化和 ESLint 检查
- 配置的文件类型：
  - `*.{ts,tsx,js,vue}`: Prettier 格式化 + ESLint 修复
  - `*.{json,md,yml,yaml}`: Prettier 格式化

#### Commit-msg 钩子

- 使用 commitlint 检查提交信息格式
- 遵循 Conventional Commits 规范

## 使用方法

### 1. 手动格式化

```bash
# 检查所有文件格式
pnpm run format:check

# 格式化所有文件
pnpm run format:fix

# 检查特定目录
npx prettier --check "apps/**/*.{ts,vue}"

# 格式化特定目录
npx prettier --write "apps/**/*.{ts,vue}"
```

### 2. VSCode 中使用

1. **自动格式化**: 保存文件时自动格式化
2. **手动格式化**: `Shift + Alt + F` (Windows/Linux) 或 `Shift + Option + F` (Mac)
3. **格式化选择内容**: `Ctrl + K, Ctrl + F`

### 3. 提交代码

提交代码时会自动：

1. 格式化暂存的文件
2. 运行 ESLint 检查并自动修复
3. 验证提交信息格式

## 提交信息格式

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### 类型 (type)

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

### 示例

```
feat(auth): add user login functionality
fix(api): resolve timeout issue in data service
docs: update README with setup instructions
style: format code with prettier
```

## 安装依赖

首次使用需要安装依赖：

```bash
pnpm install
```

## 故障排除

### 1. Prettier 不生效

- 确保安装了 Prettier VSCode 扩展
- 检查 `.prettierrc` 文件是否存在
- 重启 VSCode

### 2. Git 钩子不工作

```bash
# 重新安装 Husky
pnpm run prepare
```

### 3. ESLint 与 Prettier 冲突

- 确保安装了 `eslint-config-prettier`
- 检查 ESLint 配置中是否禁用了与 Prettier 冲突的规则

### 4. 特定文件不格式化

- 检查 `.prettierignore` 文件
- 确保文件类型在 VSCode 设置中配置了格式化

## 团队协作

1. **统一配置**: 所有配置都在项目根目录，团队成员拉取代码后自动生效
2. **强制检查**: Git 钩子确保提交的代码都经过格式化
3. **CI/CD 集成**: 可以在 CI 中运行 `pnpm run format:check` 确保代码格式一致

## 扩展配置

### 添加新的文件类型支持

在 `.vscode/settings.json` 中添加：

```json
"[新文件类型]": {
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true
}
```

### 自定义 Prettier 规则

修改 `.prettierrc` 文件中的配置项。

### 排除特定文件

在 `.prettierignore` 文件中添加文件模式。
