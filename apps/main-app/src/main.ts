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
app.mount('#app');

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
