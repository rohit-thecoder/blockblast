module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: { '^.+\\.tsx?$': ['ts-jest', { tsconfig: { jsx: 'react', esModuleInterop: true, strict: true, module: 'commonjs' }, diagnostics: false }] },
};
