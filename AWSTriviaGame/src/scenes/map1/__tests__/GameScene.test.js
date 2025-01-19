// Mock Phaser
jest.mock('phaser', () => ({
    Scene: class Scene {
        constructor() { }
    },
    GameObjects: {
        GameObject: class GameObject {
            constructor(scene, type) {
                this.scene = scene;
                this.type = type;
            }
            destroy() { }
        }
    }
}));

// Mock Generator
jest.mock('../../../gameobjects/generator', () => ({
    __esModule: true,
    default: class Generator {
        constructor(scene) {
            this.scene = scene;
        }
        destroy() { }
    }
}));

// Mock Player
jest.mock('../../../gameobjects/player', () => ({
    __esModule: true,
    default: class Player {
        constructor(scene, x, y, texture) {
            this.scene = scene;
            this.x = x;
            this.y = y;
            this.texture = texture;
        }
    }
}));

// Mock assetLoader
jest.mock('../../../utils/assetLoader', () => ({
    getAssetPath: jest.fn(path => path)
}));

// Mock SceneOrderManager
jest.mock('../../../utils/SceneTransition.js', () => ({
    __esModule: true,
    default: class SceneTransition {
        constructor() { }
        getNextScene() { return 'next_scene'; }
    }
}));

import GameScene from '../GameScene';

describe('GameScene', () => {
    let scene;
    let mockMapConfig;
    let mockQuestions;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();

        // Create mock map config with AWS service icons
        mockMapConfig = {
            zones: [{
                x: 100,
                y: 100,
                scale: 1,
                icons: [{
                    x: 150,
                    y: 150,
                    service: 'EC2'
                }, {
                    x: 200,
                    y: 200,
                    service: 'S3'
                }]
            }]
        };

        // Create mock AWS trivia questions
        mockQuestions = [{
            question: 'What is Amazon EC2?',
            answers: [
                'Elastic Compute Cloud',
                'Elastic Cache Cloud',
                'Elastic Container Cloud',
                'Elastic Computer Cloud'
            ],
            correctAnswer: 0,
            explanation: 'Amazon EC2 (Elastic Compute Cloud) provides scalable computing capacity in the AWS cloud.'
        }];

        // Create mock scene with required Phaser functionality
        scene = new GameScene();
        scene.add = {
            image: jest.fn().mockReturnValue({
                setScale: jest.fn().mockReturnThis(),
                setOrigin: jest.fn().mockReturnThis(),
                setInteractive: jest.fn().mockReturnThis(),
                on: jest.fn().mockReturnThis(),
                setTint: jest.fn(),
                clearTint: jest.fn()
            }),
            text: jest.fn().mockReturnValue({
                setOrigin: jest.fn().mockReturnThis(),
                setText: jest.fn()
            })
        };
        scene.load = {
            image: jest.fn(),
            json: jest.fn(),
            bitmapFont: jest.fn(),
            on: jest.fn(),
            once: jest.fn()
        };
        scene.cache = {
            json: {
                get: jest.fn((key) => {
                    if (key === 'map-config') return mockMapConfig;
                    if (key === 'questions') return mockQuestions;
                    return null;
                })
            }
        };
        scene.cameras = {
            main: {
                fadeOut: jest.fn(),
                once: jest.fn((event, callback) => callback())
            }
        };
        scene.scene = {
            start: jest.fn()
        };
        scene.sound = {
            pauseOnBlur: true
        };
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    // Test initialization and configuration
    describe('Initialization', () => {
        test('should initialize with default values', () => {
            expect(scene.score).toBe(0);
            expect(scene.currentMap).toBe(1);
            expect(scene.questions).toBeNull();
            expect(scene.icons).toEqual([]);
            expect(scene.answeredQuestions).toBe(0);
            expect(scene.isTransitioning).toBe(false);
            expect(scene.clickCooldown).toBe(false);
        });

        test('should initialize with provided score', () => {
            scene.init({ score: 100 });
            expect(scene.score).toBe(100);
        });
    });

    // Test asset loading
    describe('Asset Loading', () => {
        test('should load required game assets', () => {
            scene.preload();
            expect(scene.load.image).toHaveBeenCalledWith('map1scene1', expect.any(String));
            expect(scene.load.json).toHaveBeenCalledWith('map-config', expect.any(String));
            expect(scene.load.json).toHaveBeenCalledWith('questions', expect.any(String));
            expect(scene.load.bitmapFont).toHaveBeenCalledWith('arcade', expect.any(String), expect.any(String));
            expect(scene.load.image).toHaveBeenCalledWith('checkMark', expect.any(String));
            expect(scene.load.image).toHaveBeenCalledWith('xMark', expect.any(String));
        });
    });

    // Test scene creation and setup
    describe('Scene Creation', () => {
        test('should create map and icons from config', () => {
            scene.create();
            expect(scene.add.image).toHaveBeenCalledWith(100, 100, 'map1scene1');
            const map = scene.add.image.mock.results[0].value;
            expect(map.setScale).toHaveBeenCalledWith(1);
        });

        test('should setup score display', () => {
            scene.create();
            expect(scene.add.text).toHaveBeenCalledWith(16, 16, 'Score: 0', expect.any(Object));
        });

        test('should handle missing map config', () => {
            scene.cache.json.get.mockImplementation((key) => {
                if (key === 'questions') return mockQuestions;
                return null;
            });
            scene.create();
            expect(scene.add.text).toHaveBeenCalledWith(
                400, 300, 'Error: Map configuration not found', expect.any(Object)
            );
        });

        test('should handle missing questions', () => {
            scene.cache.json.get.mockImplementation((key) => {
                if (key === 'map-config') return mockMapConfig;
                return null;
            });
            scene.create();
            expect(scene.add.text).toHaveBeenCalledWith(
                400, 300, 'Error: Questions not found', expect.any(Object)
            );
        });
    });

    // Test icon interactions
    describe('Icon Interactions', () => {
        test('should create interactive AWS service icons', () => {
            scene.create();
            const loadCompleteCallback = scene.load.once.mock.calls[0][1];
            loadCompleteCallback();
            expect(scene.icons).toHaveLength(2); // EC2 and S3 icons
            expect(scene.add.image).toHaveBeenCalledWith(150, 150, 'icon');
            expect(scene.add.image).toHaveBeenCalledWith(200, 200, 'icon');
        });

        test('should handle icon click with cooldown', () => {
            const icon = scene.add.image();
            scene.handleIconClick(icon);
            expect(scene.clickCooldown).toBe(true);
            expect(icon.setTint).toHaveBeenCalledWith(0xff0000);

            jest.advanceTimersByTime(1000);
            expect(scene.clickCooldown).toBe(false);
            expect(icon.clearTint).toHaveBeenCalled();
        });

        test('should prevent clicks during cooldown', () => {
            const icon = scene.add.image();
            scene.handleIconClick(icon);
            icon.setTint.mockClear();
            scene.handleIconClick(icon);
            expect(icon.setTint).not.toHaveBeenCalled();
        });
    });

    // Test scene transitions
    describe('Scene Transitions', () => {
        test('should transition to space invaders with score', () => {
            scene.score = 100;
            scene.transitionToNextScene();
            expect(scene.cameras.main.fadeOut).toHaveBeenCalledWith(500);
            expect(scene.scene.start).toHaveBeenCalledWith('space_invaders', {
                nextScene: 'map1scene2',
                score: 100
            });
        });

        test('should prevent multiple transitions', () => {
            scene.transitionToNextScene();
            scene.cameras.main.fadeOut.mockClear();
            scene.transitionToNextScene();
            expect(scene.cameras.main.fadeOut).not.toHaveBeenCalled();
        });
    });
}); 