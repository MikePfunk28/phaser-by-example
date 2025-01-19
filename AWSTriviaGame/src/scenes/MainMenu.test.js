import MainMenu from './MainMenu';

describe('MainMenu', () => {
    let scene;

    beforeEach(() => {
        scene = new MainMenu();
        scene.add = {
            text: jest.fn().mockReturnValue({
                setOrigin: jest.fn().mockReturnThis()
            }),
            container: jest.fn().mockReturnValue({
                add: jest.fn()
            }),
            rectangle: jest.fn().mockReturnValue({
                setInteractive: jest.fn().mockReturnThis(),
                on: jest.fn().mockReturnThis(),
                setFillStyle: jest.fn().mockReturnThis()
            })
        };
        scene.cameras = {
            main: {
                setBackgroundColor: jest.fn(),
                fadeIn: jest.fn(),
                fadeOut: jest.fn()
            }
        };
        scene.tweens = {
            add: jest.fn()
        };
        scene.time = {
            delayedCall: jest.fn()
        };
        scene.scene = {
            start: jest.fn()
        };
        scene.game = {
            config: {
                height: 600
            }
        };
    });

    describe('Scene Creation', () => {
        test('creates title text', () => {
            scene.create();
            expect(scene.add.text).toHaveBeenCalledWith(
                400, 100, 'AWS Certification Trainer',
                expect.any(Object)
            );
        });

        test('creates menu items', () => {
            scene.create();
            // Should create 3 menu items
            expect(scene.add.container).toHaveBeenCalledTimes(3);
        });

        test('creates version text', () => {
            scene.create();
            expect(scene.add.text).toHaveBeenCalledWith(
                16, 570, 'v1.0.0',
                expect.any(Object)
            );
        });
    });

    describe('Menu Interactions', () => {
        test('handles button hover effects', () => {
            scene.create();
            const button = scene.add.rectangle();
            const pointerover = button.on.mock.calls.find(call => call[0] === 'pointerover')[1];
            pointerover();
            expect(scene.tweens.add).toHaveBeenCalled();
        });

        test('handles scene transitions on button click', () => {
            scene.create();
            const button = scene.add.rectangle();
            const pointerdown = button.on.mock.calls.find(call => call[0] === 'pointerdown')[1];
            pointerdown();
            expect(scene.cameras.main.fadeOut).toHaveBeenCalled();
            expect(scene.time.delayedCall).toHaveBeenCalled();
        });
    });
}); 