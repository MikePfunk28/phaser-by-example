// Mock canvas and WebGL context
class MockCanvas {
    getContext() {
        return {
            fillRect: jest.fn(),
            clearRect: jest.fn(),
            getImageData: jest.fn(),
            putImageData: jest.fn(),
            createImageData: jest.fn(),
            setTransform: jest.fn(),
            drawImage: jest.fn(),
            save: jest.fn(),
            restore: jest.fn(),
            scale: jest.fn(),
            rotate: jest.fn(),
            translate: jest.fn(),
            transform: jest.fn(),
            beginPath: jest.fn(),
            moveTo: jest.fn(),
            lineTo: jest.fn(),
            stroke: jest.fn(),
            fill: jest.fn()
        };
    }
}

// Mock document if it doesn't exist
if (typeof document === 'undefined') {
    global.document = {
        createElement: (type) => {
            if (type === 'canvas') {
                return new MockCanvas();
            }
            return {
                style: {},
                setAttribute: jest.fn(),
                appendChild: jest.fn()
            };
        },
        body: {
            appendChild: jest.fn(),
            removeChild: jest.fn()
        }
    };
}

// Mock window if it doesn't exist
if (typeof window === 'undefined') {
    global.window = {
        focus: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
    };
}

// Mock Phaser
global.Phaser = {
    Game: jest.fn(),
    Scene: class Scene { },
    GameObjects: {
        GameObject: class GameObject { },
        Sprite: class Sprite { },
        Image: class Image { },
        Text: class Text { }
    },
    Physics: {
        Arcade: {
            Sprite: class Sprite { }
        }
    },
    Math: {
        Between: jest.fn()
    },
    Utils: {
        Array: {
            GetRandom: jest.fn()
        }
    }
}; 