module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['<rootDir>/tests/**/*.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  setupFilesAfterEnv: ['jest-extended', '<rootDir>/jest.setup.ts'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  // coverageThreshold: {
  //   global: { branches: 85, functions: 90, lines: 90, statements: 90 }
  // },
  transform: {
    '^.+\\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.json'
    }],
  }
}; 