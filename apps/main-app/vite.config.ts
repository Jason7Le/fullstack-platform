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
    base: '/', // 确保资源路径正确
    plugins: [
      vue(),
      federation({
        // 联邦配置
        name: 'main-app', // 应用名称
        remotes: {
          'dashboard-app': DASHBOARD_REMOTE_ENTRY, // 远程入口
        },
        shared: {
          // 共享依赖配置，确保正确打包
          vue: {
            singleton: true,
          },
          'vue-router': {
            singleton: true,
          },
          pinia: {
            singleton: true,
          },
          'element-plus': {
            singleton: true,
          },
        } as any, // 类型断言，避免类型检查错误
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
      outDir: 'dist', // 明确指定输出目录
      // 开启联邦时建议保留 shared 的外部化，由插件处理去重
      target: 'esnext', // 目标环境
      modulePreload: false, // 禁用模块预加载
      // 确保所有代码都被包含，不过度优化
      // 使用默认的 esbuild minify，但不过度优化
      minify: 'esbuild', // 使用 esbuild（默认，但配置不过度优化）
      // 注意：esbuild 的压缩是安全的，不会误删代码
      // 禁用过度的代码分割，确保代码完整性
      cssCodeSplit: true,
      sourcemap: false, // 生产环境可以关闭 sourcemap 以减小体积
      rollupOptions: {
        // 打包配置
        output: {
          // 输出配置
          manualChunks: id => {
            // 联邦插件的 shared 依赖会被单独处理，不需要在这里分包
            // 避免与联邦插件的 shared 配置冲突
            if (id.includes('node_modules')) {
              // 排除已经在 shared 中声明的依赖
              const sharedDeps = ['vue', 'vue-router', 'pinia', 'element-plus'];
              const isShared = sharedDeps.some(dep => id.includes(`node_modules/${dep}`));

              if (isShared) {
                // 这些依赖由联邦插件处理，不在这里分包
                return null;
              }

              // 其他第三方库可以分包
              if (id.includes('node_modules')) {
                return 'vendor';
              }
            }
          },
          chunkFileNames: 'assets/js/[name]-[hash].js', // 分包后的文件名
          entryFileNames: 'assets/js/[name]-[hash].js', // 入口文件名
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]', // 资源文件名
          // 确保不会过度优化导致代码丢失
          preserveModules: false, // 保持模块结构，但不保留所有模块
        },
        // 确保所有外部依赖都被正确处理
        external: [], // 不排除任何依赖，让联邦插件处理
      },
      assetsInlineLimit: 4096, // 小于4kb的文件会自动转换为base64
      // 确保 chunk 大小警告不会阻止构建
      chunkSizeWarningLimit: 2000, // 提高警告阈值到 2MB
    },
  };
});
