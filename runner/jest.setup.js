// Mock Phaser with more complete structure
global.Phaser = {
    Scene: class Scene {
        constructor(config) {
            if (config && config.key) this.key = config.key;
        }
        add = {
            text: jest.fn().mockReturnValue({
                setOrigin: jest.fn().mockReturnThis(),
                setDepth: jest.fn().mockReturnThis(),
                destroy: jest.fn()
            }),
            image: jest.fn().mockReturnValue({
                setInteractive: jest.fn().mockReturnThis(),
                setScale: jest.fn().mockReturnThis(),
                setOrigin: jest.fn().mockReturnThis(),
                setDepth: jest.fn().mockReturnThis(),
                on: jest.fn(),
                setTint: jest.fn(),
                clearTint: jest.fn(),
                destroy: jest.fn()
            }),
            container: jest.fn().mockReturnValue({
                add: jest.fn(),
                setDepth: jest.fn().mockReturnThis()
            }),
            graphics: jest.fn().mockReturnValue({
                fillStyle: jest.fn().mockReturnThis(),
                fillRect: jest.fn().mockReturnThis(),
                clear: jest.fn(),
                destroy: jest.fn(),
                lineStyle: jest.fn().mockReturnThis(),
                strokeRect: jest.fn()
            }),
            rectangle: jest.fn().mockReturnValue({
                setInteractive: jest.fn().mockReturnThis(),
                setFillStyle: jest.fn().mockReturnThis(),
                on: jest.fn()
            }),
            existing: jest.fn()
        };
        load = {
            image: jest.fn(),
            json: jest.fn(),
            bitmapFont: jest.fn(),
            on: jest.fn(),
            once: jest.fn(),
            start: jest.fn(),
            mapConfig: jest.fn(),
            map: jest.fn(),
            player: jest.fn(),
            button: jest.fn(),
            generator: jest.fn(),
            icons: jest.fn(),
            updateProgress: jest.fn(),
            SortSelectionScene: jest.fn(),
            style: jest.fn()
        };
        cache = {
            json: {
                get: jest.fn()
            }
        };
        cameras = {
            main: {
                fadeOut: jest.fn(),
                fadeIn: jest.fn(),
                once: jest.fn(),
                setBackgroundColor: jest.fn()
            }
        };
        scene = {
            start: jest.fn()
        };
        tweens = {
            add: jest.fn()
        };
        time = {
            delayedCall: jest.fn()
        };
        sound = {
            pauseOnBlur: true
        };
        game = {
            config: {
                height: 600,
                width: 800
            }
        }
    },
    AUTO: 'AUTO',
    Scale: {
        FIT: 'FIT',
        CENTER_BOTH: 'CENTER_BOTH'
    },
    Utils: {
        Array: {
            GetRandom: jest.fn()
        }
    },
    Game: class Game {
        constructor(config) {
            this.config = config;
        }
    }
};

// Mock window with AudioContext
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
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
    })),
    body: {
        appendChild: jest.fn(),
        removeChild: jest.fn()
    }
};

// Mock setTimeout
global.setTimeout = jest.fn(cb => cb());