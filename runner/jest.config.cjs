// Mock Phaser
global.Phaser = {
  Scene: class Scene {
    constructor() { }
    add = {
      text: jest.fn(),
      image: jest.fn().mockReturnValue({
        setInteractive: jest.fn().mockReturnThis(),
        setScale: jest.fn().mockReturnThis(),
        setOrigin: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        on: jest.fn(),
        setTint: jest.fn(),
        clearTint: jest.fn()
      })
    };
    cache = {
      json: {
        get: jest.fn()
      }
    };
    load = {
      json: jest.fn(),
      image: jest.fn(),
      bitmapFont: jest.fn(),
      once: jest.fn(),
      start: jest.fn()
    };
    cameras = {
      main: {
        fadeOut: jest.fn(),
        once: jest.fn()
      }
    };
    scene = {
      start: jest.fn()
    };
    tweens = {
      add: jest.fn()
    }
  },
  Utils: {
    Array: {
      GetRandom: jest.fn()
    }
  }
};

// Mock DOM elements
global.document = {
  createElement: jest.fn(() => ({
    className: '',
    appendChild: jest.fn(),
    addEventListener: jest.fn()
  })),
  body: {
    appendChild: jest.fn(),
    removeChild: jest.fn()
  }
};

// Mock window
global.window = {
  addEventListener: jest.fn()
};