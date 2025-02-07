import { GridSpriteAnimation } from '../Spritegrid';
import spritesConfig from '../../../public/assets/data/sprites.json';

describe('GridSpriteAnimation', () => {
    let scene;

    beforeEach(() => {
        // Mock scene methods and properties
        scene = new GridSpriteAnimation();

        // Mock loading methods
        scene.load = {
            spritesheet: jest.fn(),
        };

        // Mock animation methods
        scene.anims = {
            create: jest.fn(),
            generateFrameNumbers: jest.fn().mockReturnValue([0, 1, 2, 3])
        };

        // Mock add methods
        scene.add = {
            sprite: jest.fn().mockReturnValue({
                setScale: jest.fn().mockReturnThis(),
                play: jest.fn().mockReturnThis(),
                setAngle: jest.fn().mockReturnThis()
            })
        };

        // Mock input
        scene.input = {
            keyboard: {
                createCursorKeys: jest.fn().mockReturnValue({
                    left: { isDown: false },
                    right: { isDown: false },
                    up: { isDown: false },
                    down: { isDown: false }
                })
            }
        };

        // Mock game config
        scene.game = {
            config: {
                width: 800,
                height: 600
            }
        };
    });

    describe('Sprite Configuration', () => {
        test('should match sprites.json dimensions', () => {
            const sprite = spritesConfig.find(s => s.name === 'sprite9'); // First walking sprite
            expect(scene.spriteConfig.frameWidth).toBe(sprite.width);
            expect(scene.spriteConfig.frameHeight).toBe(sprite.height);
        });
    });

    describe('Animation Creation', () => {
        test('should create all directional animations', () => {
            scene.create();

            expect(scene.anims.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    key: 'walk-right',
                    frameRate: 8,
                    repeat: -1
                })
            );

            expect(scene.anims.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    key: 'walk-left',
                    frameRate: 8,
                    repeat: -1
                })
            );
        });

        test('should create rotated animations for up/down', () => {
            scene.create();

            expect(scene.anims.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    key: 'walk-up',
                    frameRate: 8,
                    repeat: -1
                })
            );

            expect(scene.anims.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    key: 'walk-down',
                    frameRate: 8,
                    repeat: -1
                })
            );
        });
    });

    describe('Movement and Rotation', () => {
        beforeEach(() => {
            scene.create();
            scene.player = scene.add.sprite(400, 300, 'player-sprite');
            scene.player.speed = 4;
        });

        test('should rotate sprite for up movement', () => {
            scene.input.keyboard.createCursorKeys = jest.fn().mockReturnValue({
                up: { isDown: true },
                down: { isDown: false },
                left: { isDown: false },
                right: { isDown: false }
            });

            scene.update();
            expect(scene.player.setAngle).toHaveBeenCalledWith(-90);
        });

        test('should rotate sprite for down movement', () => {
            scene.input.keyboard.createCursorKeys = jest.fn().mockReturnValue({
                up: { isDown: false },
                down: { isDown: true },
                left: { isDown: false },
                right: { isDown: false }
            });

            scene.update();
            expect(scene.player.setAngle).toHaveBeenCalledWith(90);
        });

        test('should not rotate sprite for left/right movement', () => {
            scene.input.keyboard.createCursorKeys = jest.fn().mockReturnValue({
                up: { isDown: false },
                down: { isDown: false },
                left: { isDown: true },
                right: { isDown: false }
            });

            scene.update();
            expect(scene.player.setAngle).toHaveBeenCalledWith(0);
        });
    });
}); 