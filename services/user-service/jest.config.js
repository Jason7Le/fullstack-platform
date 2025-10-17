module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.module.(t|j)s',
    '!**/main.(t|j)s',
    '!**/*.dto.(t|j)s',
    '!**/*.entity.(t|j)s',
  ],
  coverageDirectory: '../coverage',
  coverageReporters: ['text', 'lcov'],
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@fullstack-platform/common$':
      'D:/前端研究相关/全栈微前端数据平台 - 技术架构方案/fullstack-platform/packages/common/src/index.ts',
    '^src/(.*)$': '<rootDir>/$1',
    '^users/(.*)$': '<rootDir>/users/$1',
  },
};
