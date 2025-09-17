# 监控指标单位规范

## 📊 概述

本文档定义了全栈微前端数据平台中所有监控指标的单位规范，确保数据的一致性和可读性。

## 🎯 页面监控配置

### 监控范围控制

为了优化性能，系统支持页面级别的监控配置：

#### 环境变量配置

```bash
# Web Vitals 监控配置
VITE_WEB_VITALS_ENABLED=true                    # 是否启用监控
VITE_WEB_VITALS_PAGES=/dashboard,/login         # 监控的页面列表

# 微前端监控配置
VITE_MICRO_FRONTEND_ENABLED=true                # 是否启用监控
VITE_MICRO_FRONTEND_PAGES=/dashboard-remote     # 监控的页面列表

# 错误监控配置
VITE_ERROR_MONITORING_ENABLED=true              # 是否启用监控
VITE_ERROR_MONITORING_PAGES=/*                  # 监控的页面列表
```

#### 页面匹配规则

| 配置方式   | 示例                         | 匹配规则              |
| ---------- | ---------------------------- | --------------------- |
| 精确匹配   | `/dashboard`                 | 只匹配 `/dashboard`   |
| 通配符匹配 | `/dashboard/*`               | 匹配 `/dashboard/xxx` |
| 所有页面   | `/*` 或留空                  | 匹配所有页面          |
| 混合配置   | `/dashboard,/login,/admin/*` | 支持多种匹配方式      |

#### 监控启用规则

1. **生产环境**：自动启用（除非明确禁用）
2. **开发环境**：需要明确设置 `ENABLED=true`
3. **页面过滤**：如果配置了 `PAGES`，只监控指定页面

#### 性能优化效果

- ✅ **精确控制**：只监控需要的页面
- ✅ **降低消耗**：避免不必要的性能开销
- ✅ **灵活配置**：支持不同环境的监控策略
- ✅ **开发友好**：开发环境可以只监控关键页面

## 🕒 时间单位

### 毫秒 (ms)

- **Web Vitals 时间指标**：
  - `TTFB` (Time to First Byte): 毫秒
  - `FCP` (First Contentful Paint): 毫秒
  - `LCP` (Largest Contentful Paint): 毫秒
  - `INP` (Interaction to Next Paint): 毫秒

- **微前端性能指标**：
  - `loadTime`: 组件加载时间，毫秒
  - `renderTime`: 组件渲染时间，毫秒
  - `value`: 性能指标数值，毫秒

- **时间戳**：
  - `timestamp`: JavaScript `Date.now()` 返回的毫秒时间戳

### 无单位指标

- **CLS** (Cumulative Layout Shift): 0-1 之间的数值，无单位

## 📈 性能指标单位

### Web Vitals 指标

| 指标 | 单位     | 说明           | 阈值           |
| ---- | -------- | -------------- | -------------- |
| TTFB | ms       | 首字节时间     | < 800ms (good) |
| FCP  | ms       | 首次内容绘制   | < 1.8s (good)  |
| LCP  | ms       | 最大内容绘制   | < 2.5s (good)  |
| INP  | ms       | 交互到下次绘制 | < 200ms (good) |
| CLS  | unitless | 累积布局偏移   | < 0.1 (good)   |

### 微前端性能指标

| 指标       | 单位 | 说明             |
| ---------- | ---- | ---------------- |
| loadTime   | ms   | 远程组件加载时间 |
| renderTime | ms   | 远程组件渲染时间 |
| value      | ms   | 性能指标数值     |

## 🚨 错误指标单位

### 错误严重程度等级

| 等级     | 说明         | 示例                     |
| -------- | ------------ | ------------------------ |
| low      | 低严重程度   | 一般警告                 |
| medium   | 中等严重程度 | 网络错误、代码块加载错误 |
| high     | 高严重程度   | 类型错误、引用错误       |
| critical | 严重程度     | 系统级错误               |

### 错误数据字段

| 字段      | 单位/类型 | 说明             |
| --------- | --------- | ---------------- |
| timestamp | ms        | 错误发生时间戳   |
| severity  | string    | 错误严重程度等级 |
| sessionId | string    | 会话标识符       |

## 📊 数据格式规范

### 前端发送数据格式

```typescript
// Web Vitals 数据
{
  name: "FCP",
  value: 1200,        // 毫秒
  unit: "ms",         // 明确单位
  rating: "good",
  delta: 1200,
  id: "unique-id",
  navigationType: "navigate",
  timestamp: 1703123456789,  // 毫秒时间戳
  url: "https://example.com",
  userAgent: "Mozilla/5.0..."
}

// 微前端性能数据
{
  name: "micro_frontend_load_time",
  value: 150,         // 毫秒
  componentName: "DashboardRemote",
  loadTime: 150,      // 毫秒
  timestamp: 1703123456789,  // 毫秒时间戳
  url: "https://example.com"
}

// 错误数据
{
  message: "Network Error",
  name: "TypeError",
  severity: "medium",  // 严重程度等级
  timestamp: 1703123456789,  // 毫秒时间戳
  sessionId: "session_123",
  url: "https://example.com"
}
```

### 后端接收数据格式

后端接口会接收上述格式的数据，并在日志中显示单位信息：

```
📊 [Analytics] 收到 Web Vitals 数据: {
  name: "FCP",
  value: 1200,
  unit: "ms",
  rating: "good",
  url: "https://example.com",
  timestamp: "2023-12-21T10:30:56.789Z",
  navigationType: "navigate"
}
```

## 🔧 实现细节

### 前端实现

1. **Web Vitals 监控**：
   - 使用 `web-vitals` 库获取原始数据
   - 添加 `unit` 字段明确单位
   - CLS 值保持原始格式（0-1）

2. **微前端监控**：
   - 使用 `performance.now()` 获取高精度时间
   - 所有时间相关指标统一使用毫秒

3. **错误监控**：
   - 使用 `Date.now()` 获取时间戳
   - 错误严重程度使用预定义等级

### 后端实现

1. **数据接收**：
   - 接口定义包含单位说明
   - 日志输出显示单位信息
   - 支持单位验证和转换

2. **数据存储**：
   - 保持原始单位格式
   - 支持单位查询和过滤
   - 提供单位转换功能

## 📋 最佳实践

1. **一致性**：
   - 所有时间指标统一使用毫秒
   - 错误严重程度使用标准等级
   - 时间戳统一使用毫秒格式

2. **可读性**：
   - 在日志中显示单位信息
   - 在接口文档中说明单位
   - 在代码注释中标注单位

3. **扩展性**：
   - 支持新的指标类型
   - 支持单位转换
   - 支持多语言单位显示

## 🚀 未来扩展

1. **国际化支持**：
   - 支持不同地区的单位显示
   - 支持单位自动转换

2. **可视化优化**：
   - 在图表中显示单位
   - 支持单位切换

3. **数据分析**：
   - 基于单位的统计分析
   - 单位相关的性能优化建议
