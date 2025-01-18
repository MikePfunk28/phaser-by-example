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
    transform: {
        '^.+\\.js$': 'babel-jest'
    },
    transformIgnorePatterns: [
        'node_modules/(?!(phaser|@babel)/)'
    ],
    verbose: true,
    testPathIgnorePatterns: [
        '/node_modules/',
        '/dist/'
    ]
}; 