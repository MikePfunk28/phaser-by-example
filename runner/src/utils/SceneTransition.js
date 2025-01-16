import * as Phaser from 'phaser';

export default class SceneTransition {
    static to(currentScene, nextSceneName, data = {}) {
        currentScene.scene.start(nextSceneName, data);
    }
}