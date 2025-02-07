// test/utils/SceneTransition.test.js
import SceneTransition from '@/utils/SceneTransition';
import { createMockScene } from '../helpers/sceneTestHelper';

describe('SceneTransition', () => {
    it('should transition between scenes with fade effect', () => {
        const mockScene = createMockScene();
        const targetScene = 'nextScene';
        const data = { test: 'data' };

        SceneTransition.to(mockScene, targetScene, data);

        expect(mockScene.cameras.main.fadeOut).toHaveBeenCalledWith(500);
        expect(mockScene.scene.start).toHaveBeenCalledWith(targetScene, data);
    });

    it('should handle scenes without cameras', () => {
        const mockScene = {
            scene: {
                start: jest.fn()
            }
        };
        const targetScene = 'nextScene';

        SceneTransition.to(mockScene, targetScene);

        expect(mockScene.scene.start).toHaveBeenCalledWith(targetScene, {});
    });
});
