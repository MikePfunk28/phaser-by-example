import BootScene from './bootscene';
import Phaser from 'phaser';

// Mock the assetLoader
jest.mock('../utils/assetLoader.js', () => ({
    getAssetPath: jest.fn(path => path)
}));

describe('BootScene', () => {
    let scene;

    beforeEach(() => {
        scene = new BootScene();
        scene.add = {
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
        scene.load = {
            on: jest.fn(),
            off: jest.fn()
        };
        scene.scene = {
            start: jest.fn()
        };
    });
    test('creates loading elements', () => {
        scene.preload();
        expect(scene.add.text).toHaveBeenCalled();
        expect(scene.add.graphics).toHaveBeenCalled();
    });

    test('transitions to next scene', () => {
        scene.create();
        expect(scene.scene.start).toHaveBeenCalledWith('MainMenu');
    });

    describe('Scene Loading', () => {
        test('creates loading text and progress bar', () => {
            scene.preload();
            expect(scene.add.text).toHaveBeenCalledWith(
                400, 300, 'Loading...',
                expect.any(Object)
            );
            expect(scene.add.graphics).toHaveBeenCalled();
        });

        test('sets up progress event handlers', () => {
            scene.preload();
            expect(scene.load.on).toHaveBeenCalledWith('progress', expect.any(Function));
            expect(scene.load.on).toHaveBeenCalledWith('complete', expect.any(Function));
        });

        test('updates progress bar on progress event', () => {
            scene.preload();
            const progressCallback = scene.load.on.mock.calls.find(call => call[0] === 'progress')[1];
            progressCallback(0.5);
            expect(scene.add.graphics().clear).toHaveBeenCalled();
            expect(scene.add.graphics().fillStyle).toHaveBeenCalledWith(0x00ff00, 1);
        });
    });

    describe('Scene Transitions', () => {
        test('transitions to MainMenu on create', () => {
            scene.create();
            expect(scene.scene.start).toHaveBeenCalledWith('MainMenu');
        });
    });
}); 