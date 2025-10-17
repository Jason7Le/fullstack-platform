# 导航组件说明

## 组件概述

为了提高用户体验，我们创建了两个主要的导航组件：

### 1. AppNavigation 组件

- **位置**: `src/components/AppNavigation.vue`
- **功能**: 提供统一的顶部导航栏
- **特性**:
  - Logo和面包屑导航
  - 用户信息显示和下拉菜单
  - 退出登录功能
  - 响应式设计

### 2. PageContainer 组件

- **位置**: `src/components/PageContainer.vue`
- **功能**: 提供统一的页面容器布局
- **特性**:
  - 包含导航栏
  - 页面标题和副标题
  - 返回按钮
  - 操作按钮区域
  - 页面内容区域

## 使用方法

### 在页面中使用 PageContainer

```vue
<template>
  <PageContainer title="页面标题" subtitle="页面副标题" icon="IconName" back-path="/dashboard">
    <template #actions>
      <el-button type="primary">操作按钮</el-button>
    </template>

    <!-- 页面内容 -->
    <div>页面内容...</div>
  </PageContainer>
</template>

<script setup lang="ts">
import PageContainer from '../components/PageContainer.vue';
</script>
```

### 在页面中使用 AppNavigation

```vue
<template>
  <div class="page-container">
    <AppNavigation />
    <div class="page-content">
      <!-- 页面内容 -->
    </div>
  </div>
</template>

<script setup lang="ts">
import AppNavigation from '../components/AppNavigation.vue';
</script>
```

## 已更新的页面

### 1. DashboardView

- 使用 AppNavigation 组件
- 移除了重复的导航代码
- 保持了原有的功能卡片布局

### 2. UserManagementView

- 使用 PageContainer 组件
- 添加了返回按钮
- 统一了页面布局

### 3. PermissionMatrixView

- 使用 PageContainer 组件
- 添加了返回按钮
- 统一了页面布局

## 功能特性

### 面包屑导航

- 自动根据当前路由生成面包屑
- 支持图标显示
- 可点击导航

### 返回按钮

- 自动显示在页面头部
- 可自定义返回路径
- 默认返回仪表板

### 用户菜单

- 用户头像和姓名显示
- 下拉菜单包含个人资料、设置、退出登录
- 统一的退出登录逻辑

### 响应式设计

- 移动端适配
- 小屏幕下隐藏部分元素
- 触摸友好的交互

## 自定义配置

### PageContainer Props

- `title`: 页面标题（必填）
- `subtitle`: 页面副标题（可选）
- `icon`: 页面图标（可选，默认为 Document）
- `showBackButton`: 是否显示返回按钮（可选，默认为 true）
- `backPath`: 返回路径（可选，默认为 /dashboard）

### 面包屑配置

面包屑会根据路由名称自动生成，支持的路由：

- `UserManagement`: 用户管理
- `PermissionMatrix`: 权限矩阵
- 其他路由会使用 `route.meta.title` 作为标题

## 样式定制

所有组件都使用了 scoped 样式，可以通过以下方式定制：

1. **修改组件内部样式**: 直接编辑组件文件
2. **全局样式覆盖**: 使用深度选择器 `:deep()`
3. **CSS 变量**: 使用 Element Plus 的主题变量

## 注意事项

1. 确保所有页面都使用统一的导航组件
2. 新增页面时优先使用 PageContainer
3. 面包屑会根据路由自动生成，无需手动配置
4. 用户信息来自 auth store，确保已正确初始化
