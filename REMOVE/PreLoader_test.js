// src/scenes/PreLoader_test.js
import PreLoader from './PreLoader';
import { getAssetPath } from '@/utils/assetLoader';

jest.mock('@/utils/assetLoader', () => ({
    getAssetPath: jest.fn(path => path)
}));

describe('PreLoader Scene', () => {
    let scene;

    beforeEach(() => {
        scene = new PreLoader();
        // Mock Phaser scene methods
        scene.load = {
            image: jest.fn(),
            json: jest.fn(),
            bitmapFont: jest.fn(),
            on: jest.fn(),
            map: jest.fn(),
            player: jest.fn(),
            button: jest.fn(),
            generator: jest.fn(),
            icons: jest.fn(),
            mapConfig: jest.fn(),
            updateProgress: jest.fn()
        };
        scene.add = {
            text: jest.fn(),
            image: jest.fn().mockReturnValue({
                setScale: jest.fn().mockReturnThis(),
                setOrigin: jest.fn().mockReturnThis()
            })
        };
        scene.cache = {
            json: {
                get: jest.fn()
            }
        };
        scene.scene = {
            start: jest.fn()
        };
        scene.sound = {
            pauseOnBlur: true
        };
    });

    describe('Asset Loading', () => {
        test('loads all required map thumbnails', () => {
            scene.preload();
            // Test Map 1 thumbnails
            expect(scene.load.image).toHaveBeenCalledWith('map1scene164', expect.any(String));
            expect(scene.load.image).toHaveBeenCalledWith('map1scene264', expect.any(String));
            expect(scene.load.image).toHaveBeenCalledWith('map1scene364', expect.any(String));
            expect(scene.load.image).toHaveBeenCalledWith('map1scene464', expect.any(String));
        });

        test('loads all required map configs', () => {
            scene.preload();
            expect(scene.load.json).toHaveBeenCalledWith('map-config', expect.any(String));
            expect(scene.load.json).toHaveBeenCalledWith('questions', expect.any(String));
        });

        test('loads bitmap fonts', () => {
            scene.preload();
            expect(scene.load.bitmapFont).toHaveBeenCalledWith(
                'arcade',
                expect.any(String),
                expect.any(String)
            );
        });
    });

    describe('Scene Initialization', () => {
        test('initializes with default values', () => {
            scene.init({});
            expect(scene.score).toBe(0);
            expect(scene.currentMap).toBe(1);
            expect(scene.selected).toBeNull();
            expect(scene.thumbnails).toEqual([]);
            expect(scene.connections).toEqual([]);
            expect(scene.progress).toBe(0);
        });

        test('initializes with provided values', () => {
            const testData = {
                score: 100,
                currentMap: 2,
                selected: 'test',
                thumbnails: ['thumb1'],
                connections: ['conn1'],
                progress: 50
            };
            scene.init(testData);
            expect(scene.score).toBe(100);
            expect(scene.currentMap).toBe(2);
            expect(scene.selected).toBe('test');
            expect(scene.thumbnails).toEqual(['thumb1']);
            expect(scene.connections).toEqual(['conn1']);
            expect(scene.progress).toBe(50);
        });
    });

    describe('Scene Creation', () => {
        test('transitions to MainMenu', () => {
            scene.create();
            expect(scene.scene.start).toHaveBeenCalledWith('MainMenu');
        });

        test('sets sound settings', () => {
            scene.create();
            expect(scene.sound.pauseOnBlur).toBe(false);
        });
    });
});