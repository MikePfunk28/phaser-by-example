export default class sceneChanger {
    constructor(scene) {
        this.scene = scene;
    }


    transitionToNextScene() {
        if (this.isTransitioning) return;
        this.isTransitioning = true;
        this.cameras.main.fadeOut(500);

        this.cameras.main.once('camerafadeoutcomplete', () => {
            // 🚀 Get a list of all available scenes
            const sceneKeys = this.scene.manager.keys;

            // 🚀 Find the current scene key dynamically
            const currentSceneKey = this.sys.settings.key;
            console.log(`Current scene: ${currentSceneKey}`);

            // 🚀 Determine what the next scene should be
            const sceneList = Object.keys(sceneKeys);
            const currentIndex = sceneList.indexOf(currentSceneKey);

            if (currentIndex === -1 || currentIndex === sceneList.length - 1) {
                console.warn("No valid next scene found!");
                return;
            }

            const nextSceneKey = sceneList[currentIndex + 1]; // Get the next scene dynamically
            console.log(`Transitioning from ${currentSceneKey} → Space Invaders → ${nextSceneKey}`);

            // 🚀 Start Space Invaders and dynamically send the next scene
            this.scene.start('space_invaders', {
                nextScene: nextSceneKey, // Fully automatic!
                score: this.score
            });
        });
}
}