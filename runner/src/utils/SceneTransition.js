import { SCENE_TRANSITIONS } from '@/constants/sceneTransitions';
import getSortedScenes from '@/scenes/SortSelectionScene';
import SceneOrderManager from '@/utils/SceneOrderManager';


// src/constants/sceneTransitions.js
export const SCENE_TRANSITIONS = {
    bootscene: 'mainmenu',
    mainmenu: 'sortselection',
    sortselection: 'space_invaders',
    space_invaders: 'map1scene1',
    map1scene1: 'space_invaders',
    space_invaders: 'map1scene2',
    map1scene2: 'space_invaders',
    space_invaders: 'map1scene3',
    map1scene3: 'space_invaders',
    space_invaders: 'map1scene4',
    map1scene4: 'space_invaders',
    space_invaders: 'map2scene1',
    map2scene1: 'space_invaders',
    space_invaders: 'map2scene2',
    map2scene2: 'space_invaders',
    space_invaders: 'map2scene3',
    map2scene3: 'space_invaders',
    space_invaders: 'map2scene4',
    map2scene4: 'space_invaders',
    space_invaders: 'map3scene1',
    map3scene1: 'space_invaders',
    space_invaders: 'map3scene2',
    map3scene2: 'space_invaders',
    space_invaders: 'map3scene3',
    map3scene3: 'space_invaders',
    space_invaders: 'map3scene4',
    map3scene4: 'space_invaders',
    space_invaders: 'map4scene1',
    map4scene1: 'space_invaders',
    space_invaders: 'map4scene2',
    map4scene2: 'space_invaders',
    space_invaders: 'map4scene3',
    map4scene3: 'space_invaders',
    space_invaders: 'map4scene4',
    map4scene4: 'space_invaders',
    space_invaders: 'gameover',
    gameover: 'mainmenu',
    // ... continue for all scenes
};

export default class SceneTransition {
    static sceneManager = new SceneOrderManager();

    static getNextScene(currentScene) {
        return this.sceneManager.getNextScene(currentScene);
    }

    static transition(scene, targetScene, data = {}) {
        const nextScene = this.getNextScene(scene.scene.key) || targetScene;

        if (!scene.cameras || !scene.cameras.main) {
            scene.scene.start(targetScene, { ...data, nextScene });
            return;
        }

        scene.cameras.main.fadeOut(500);
        scene.cameras.main.once('camerafadeoutcomplete', () => {
            scene.scene.start(targetScene, { ...data, nextScene });
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