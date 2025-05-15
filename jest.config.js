module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  setupFilesAfterEnv: ['jest-extended'],        // optional
  collectCoverage: true,
  coverageDirectory: 'coverage',
  // coverageThreshold: {
  //   global: { branches: 85, functions: 90, lines: 90, statements: 90 }
  // },
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json'
    }
  }
};