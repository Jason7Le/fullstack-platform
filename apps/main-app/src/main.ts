// 立即执行，确保即使后续代码出错也能看到这条日志
console.log('🚀 main.ts 开始执行...', new Date().toISOString());

// 全局错误捕获
window.addEventListener('error', event => {
  console.error('❌ 全局错误:', event.error, event.message, event.filename, event.lineno);
});

window.addEventListener('unhandledrejection', event => {
  console.error('❌ 未处理的 Promise 拒绝:', event.reason);
});

import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import './style.css';
import { ErrorMonitoringService } from './utils/errorMonitoring';
import { initWebVitals } from './utils/webVitals';

console.log('✅ 所有依赖导入成功');

// 调试信息：检查 Vue 和 Pinia 是否正常加载
try {
  const vueVersion = typeof createApp === 'function' ? 'Vue 3 已加载' : 'Vue 未加载';
  const piniaVersion = typeof createPinia === 'function' ? 'Pinia 已加载' : 'Pinia 未加载';
  console.log('Vue 版本:', vueVersion);
  console.log('Pinia 版本:', piniaVersion);
  console.log('路由状态:', window.location.href);
  console.log('当前环境:', import.meta.env.MODE);
} catch (error) {
  console.error('检查依赖时出错:', error);
}

const app = createApp(App);
const pinia = createPinia();
// 注册 Element Plus，配置中文语言包
app.use(ElementPlus, {
  locale: zhCn,
});
// 注册 Pinia
app.use(pinia);
// 注册路由
app.use(router);
// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

// 初始化错误监控
ErrorMonitoringService.init();

// 设置全局错误处理器
app.config.errorHandler = (err, _instance, info) => {
  console.error('Vue 应用错误:', err, info);
  // 这里可以集成到错误监控服务
};

// 延迟初始化 Web Vitals 监控，确保页面准备好
try {
  const mountElement = document.getElementById('app');
  if (!mountElement) {
    console.error('❌ 找不到挂载元素 #app');
    throw new Error('找不到挂载元素 #app');
  }
  console.log('✅ 找到挂载元素，开始挂载应用...');
  app.mount('#app');
  console.log('✅ 应用挂载成功');
} catch (error) {
  console.error('❌ 应用挂载失败:', error);
  // 显示错误信息给用户
  const appElement = document.getElementById('app');
  if (appElement) {
    appElement.innerHTML = `
      <div style="padding: 20px; text-align: center;">
        <h1>应用加载失败</h1>
        <p>错误信息: ${error instanceof Error ? error.message : String(error)}</p>
        <p>请查看浏览器控制台获取详细信息</p>
      </div>
    `;
  }
  throw error;
}

// 在应用挂载后初始化 Web Vitals 监控
// 使用多种方式确保页面完全准备好
function initMonitoringWhenReady() {
  if (document.readyState === 'complete') {
    // 页面已经完全加载
    setTimeout(() => {
      initWebVitals();
    }, 100);
  } else {
    // 等待页面加载完成
    window.addEventListener('load', () => {
      setTimeout(() => {
        initWebVitals();
      }, 100);
    });
  }
}

initMonitoringWhenReady();
