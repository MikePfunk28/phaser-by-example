class SceneTransition {
    static to(currentScene, targetScene, data = {}) {
        // Check if we're in a test environment or if cameras are available
        if (!currentScene.cameras || !currentScene.cameras.main) {
            // In test environment or when cameras aren't available, just start the scene directly
            currentScene.scene.start(targetScene, data);
            return;
        }

        // In game environment, use fade transition
        currentScene.cameras.main.fadeOut(500);
        currentScene.cameras.main.once('camerafadeoutcomplete', () => {
            currentScene.scene.start(targetScene, data);
        });
    }

    static fadeIn(scene) {
        if (scene.cameras && scene.cameras.main) {
            scene.cameras.main.fadeIn(500);
        }
    }

    // Method for transitioning with a loading screen
    static toWithLoading(currentScene, targetScene, data = {}) {
        if (!currentScene.cameras || !currentScene.cameras.main) {
            currentScene.scene.start('bootscene', {
                nextScene: targetScene,
                nextSceneData: data
            });
            return;
        }

        currentScene.cameras.main.fadeOut(500);
        currentScene.cameras.main.once('camerafadeoutcomplete', () => {
            currentScene.scene.start('bootscene', {
                nextScene: targetScene,
                nextSceneData: data
            });
        });
    }
}

export default SceneTransition; 