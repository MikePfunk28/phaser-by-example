import Phaser from 'phaser';

// TODO: Add a transition animation
// Allows me to easily switch using, 
// SceneTransition.to(this, 'GameScene', { level: 1 });

export default class SceneTransition {
    static to(currentScene, nextSceneName, data = {}) {
        currentScene.scene.start(nextSceneName, data);
    }
}