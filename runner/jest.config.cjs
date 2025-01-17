module.exports = {
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^gameobjects/(.*)$': '<rootDir>/src/gameobjects/$1',
        '^scenes/(.*)$': '<rootDir>/src/scenes/$1',
        '^utils/(.*)$': '<rootDir>/src/utils/$1'
    },
    testEnvironment: 'jsdom',
    setupFiles: ['<rootDir>/jest.setup.js'],
    moduleFileExtensions: ['js', 'json'],
    testMatch: [
        "**/__tests__/**/*.js",
        "**/*.test.js",
        "**/*_test.js"
    ],
    transform: {
        '^.+\\.js$': 'babel-jest'
    },
    verbose: true,
    testPathIgnorePatterns: [
        '/node_modules/',
        '/dist/'
    ]
}; 