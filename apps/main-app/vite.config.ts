import federation from '@originjs/vite-plugin-federation';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import { defineConfig, loadEnv } from 'vite';
// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量，支持多级目录
  const env = loadEnv(mode, process.cwd(), '');
  // 加载环境变量：限定在当前 app 目录，避免根目录 .env 干扰
  // const env = loadEnv(mode, __dirname, '');

  // dev/prod 远程入口，可通过 .env.* 配置覆盖
  const DASHBOARD_REMOTE_ENTRY =
    env.VITE_REMOTE_DASHBOARD_URL || 'http://localhost:3003/assets/remoteEntry.js';
  return {
    plugins: [
      vue(),
      federation({
        // 联邦配置
        name: 'main-app', // 应用名称
        remotes: {
          'dashboard-app': DASHBOARD_REMOTE_ENTRY, // 远程入口
        },
        shared: ['vue', 'vue-router', 'pinia', 'element-plus'], // 共享依赖
      }),
    ],
    resolve: {
      // 路径别名配置
      alias: {
        '@': resolve(__dirname, 'src'), // 路径别名
      },
    },
    server: {
      // 开发服务器配置
      port: parseInt(env.VITE_APP_PORT) || 5173,
    },
    define: {
      // 将环境变量注入到前端代码中
      'import.meta.env.VITE_APP_TITLE': JSON.stringify(env.VITE_APP_TITLE),
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL),
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(env.VITE_APP_VERSION),
      'import.meta.env.VITE_WEB_VITALS_ENABLED': JSON.stringify(env.VITE_WEB_VITALS_ENABLED),
      'import.meta.env.VITE_WEB_VITALS_PAGES': JSON.stringify(env.VITE_WEB_VITALS_PAGES),
      'import.meta.env.VITE_MICRO_FRONTEND_ENABLED': JSON.stringify(
        env.VITE_MICRO_FRONTEND_ENABLED,
      ),
      'import.meta.env.VITE_MICRO_FRONTEND_PAGES': JSON.stringify(env.VITE_MICRO_FRONTEND_PAGES),
      'import.meta.env.VITE_ERROR_MONITORING_ENABLED': JSON.stringify(
        env.VITE_ERROR_MONITORING_ENABLED,
      ),
      'import.meta.env.VITE_ERROR_MONITORING_PAGES': JSON.stringify(
        env.VITE_ERROR_MONITORING_PAGES,
      ),
      'import.meta.env.VITE_GA_MEASUREMENT_ID': JSON.stringify(env.VITE_GA_MEASUREMENT_ID),
      'import.meta.env.VITE_ANALYTICS_ENDPOINT': JSON.stringify(env.VITE_ANALYTICS_ENDPOINT),
      'import.meta.env.VITE_WEBSOCKET_URL': JSON.stringify(env.VITE_WEBSOCKET_URL),
    },
    // 资源优化配置
    build: {
      // 开启联邦时建议保留 shared 的外部化，由插件处理去重
      target: 'esnext', // 目标环境
      modulePreload: false, // 禁用模块预加载
      rollupOptions: {
        // 打包配置
        output: {
          // 输出配置
          manualChunks: {
            // 非 shared 的库依然可以手动分包
            vendor: ['vue', 'vue-router', 'pinia'], // 第三方库
            ui: ['element-plus', '@element-plus/icons-vue'], // 组件库
          },
          chunkFileNames: 'assets/js/[name]-[hash].js', // 分包后的文件名
          entryFileNames: 'assets/js/[name]-[hash].js', // 入口文件名
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]', // 资源文件名
        },
      },
      assetsInlineLimit: 4096, // 小于4kb的文件会自动转换为base64
    },
  };
});
