module.exports = {
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^/src/(.*)$': '<rootDir>/src/$1',
    '^phaser$': '<rootDir>/node_modules/phaser/dist/phaser.js'
  },
  setupFiles: ['<rootDir>/test/setup.js'],
  testMatch: ['**/__tests__/**/*.test.js'],
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  verbose: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/']
};