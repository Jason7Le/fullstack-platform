    // 根：统一规则，子包可按需追加/覆盖
    import tseslint from '@typescript-eslint/eslint-plugin';
    import tsparser from '@typescript-eslint/parser';
    import prettier from 'eslint-plugin-prettier';

    export default [
      {
        files: ['**/*.{ts,tsx,js,vue}'],
        ignores: ['**/dist/**', '**/node_modules/**'],
        languageOptions: {
          parser: tsparser,
          parserOptions: { ecmaVersion: 'latest', sourceType: 'module', project: false },
        },
        plugins: { '@typescript-eslint': tseslint, prettier },
        rules: {
          'prettier/prettier': 'warn',
          // TypeScript 基础规则（可根据团队偏好微调）
          '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
          '@typescript-eslint/explicit-function-return-type': 'off',
        },
      },
      // 与 Prettier 对齐，禁用冲突规则
      { rules: { 'arrow-body-style': 'off', 'prefer-arrow-callback': 'off' } },
    ];