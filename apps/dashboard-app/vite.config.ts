import federation from '@originjs/vite-plugin-federation';
import vue from '@vitejs/plugin-vue';
import { defineConfig, loadEnv } from 'vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    base: '/', // 确保资源路径正确
    plugins: [
      vue(),
      federation({
        name: 'dashboard-app', // 应用名称
        filename: 'remoteEntry.js', // 远程入口文件名
        exposes: {
          './RemotePage': './src/App.vue', // 暴露的组件
        },
        shared: ['vue', 'vue-router', 'pinia', 'element-plus'], // 共享依赖
      }),
    ],
    // 生产预览提供远程入口与资源时，开启 CORS 以供主应用加载 ESM 模块
    preview: {
      headers: {
        'Access-Control-Allow-Origin': '*', // 允许跨域
      },
    },
    server: {
      port: parseInt(env.VITE_APP_PORT) || 3003, // 开发服务器配置
      strictPort: true, // 严格端口
      cors: true, // 允许跨域
    },
    build: {
      target: 'esnext', // 目标环境
      modulePreload: false, // 模块预加载
      cssCodeSplit: false, // 禁用 CSS 代码分割，确保样式被包含
    },
  };
});
