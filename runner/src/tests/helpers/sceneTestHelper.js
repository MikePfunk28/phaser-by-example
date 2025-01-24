// test/helpers/sceneTestHelper.js
export const createMockScene = () => ({
    cameras: {
        main: {
            fadeOut: jest.fn(),
            once: jest.fn((event, callback) => callback())
        }
    },
    scene: {
        start: jest.fn()
    }
});
