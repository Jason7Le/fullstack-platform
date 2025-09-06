import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量，支持多级目录
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [vue()],
    server: {
      port: env.VITE_APP_PORT,
    },
    define: {
      // 将环境变量注入到前端代码中
      'import.meta.env.VITE_APP_TITLE': JSON.stringify(env.VITE_APP_TITLE),
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL),
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(env.VITE_APP_VERSION),
    },
  };
});
