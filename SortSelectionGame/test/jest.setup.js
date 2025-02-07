require('jest-canvas-mock');

// Mock Phaser
global.Phaser = {
    Scene: class Scene {
        constructor(config) {
            this.key = config?.key;
            this.scene = {
                start: jest.fn()
            };
            this.cameras = {
                main: {
                    fadeOut: jest.fn(),
                    fadeIn: jest.fn(),
                    once: jest.fn((event, callback) => callback())
                }
            };
            this.add = {
                text: jest.fn().mockReturnValue({
                    setOrigin: jest.fn().mockReturnThis()
                }),
                graphics: jest.fn().mockReturnValue({
                    fillStyle: jest.fn().mockReturnThis(),
                    fillRect: jest.fn().mockReturnThis(),
                    clear: jest.fn().mockReturnThis(),
                    destroy: jest.fn()
                })
            };
            this.load = {
                on: jest.fn(),
                off: jest.fn()
            };
        }
    },
    Game: class Game {
        constructor(config) {
            this.config = config;
        }
    },
    AUTO: 'AUTO',
    Scale: {
        FIT: 'FIT',
        CENTER_BOTH: 'CENTER_BOTH'
    }
};

// Mock window
global.window = {
    addEventListener: jest.fn(),
    AudioContext: jest.fn(),
    webkitAudioContext: jest.fn()
};

// Mock document
global.document = {
    createElement: jest.fn(() => ({
        className: '',
        style: {},
        textContent: '',
        appendChild: jest.fn(),
        addEventListener: jest.fn()
    })),
    body: {
        appendChild: jest.fn(),
        removeChild: jest.fn()
    }
};