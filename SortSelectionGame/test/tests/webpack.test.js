describe('Vite Module Definition', () => {
    test('Phaser is properly imported as ES module', () => {
        expect(global.Phaser).toBeDefined();
        expect(global.Phaser.Scene).toBeDefined();
        expect(global.Phaser.Game).toBeDefined();
        expect(global.Phaser.GameObjects).toBeDefined();
    });

    test('Phaser Game can be instantiated with ES module syntax', () => {
        const config = {
            type: Phaser.AUTO,
            width: 800,
            height: 600,
            parent: 'game-container',
            scene: {
                create: () => { }
            }
        };
        const game = new Phaser.Game(config);
        expect(game).toBeDefined();
        expect(game.config).toEqual(expect.objectContaining({
            width: 800,
            height: 600
        }));
    });

    test('Phaser Scene can be extended with ES module syntax', () => {
        class TestScene extends Phaser.Scene {
            constructor() {
                super({ key: 'testscene' });
            }
        }
        const scene = new TestScene();
        expect(scene).toBeInstanceOf(Phaser.Scene);
        expect(scene.config.key).toBe('testscene');
    });
}); 