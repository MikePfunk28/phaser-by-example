import SceneTransition from '../SceneTransition';

describe('SceneTransition', () => {
    let scene;

    beforeEach(() => {
        scene = {
            cameras: {
                main: {
                    fadeOut: jest.fn(),
                    fadeIn: jest.fn(),
                    once: jest.fn()
                }
            },
            scene: {
                start: jest.fn()
            }
        };
    });

    it('should transition to a new scene with fade effect', () => {
        SceneTransition.to(scene, 'nextScene', { fadeColor: 0x000000, fadeTime: 500 });

        expect(scene.cameras.main.fadeOut).toHaveBeenCalledWith(500);
        expect(scene.cameras.main.once).toHaveBeenCalledWith('camerafadeoutcomplete', expect.any(Function));
    });

    it('should start the new scene after fade out', () => {
        SceneTransition.to(scene, 'nextScene', { fadeColor: 0x000000, fadeTime: 500 });

        // Get the callback passed to once
        const fadeOutCallback = scene.cameras.main.once.mock.calls[0][1];
        fadeOutCallback();

        expect(scene.scene.start).toHaveBeenCalledWith('nextScene');
        expect(scene.cameras.main.fadeIn).toHaveBeenCalledWith(500);
    });
}); 