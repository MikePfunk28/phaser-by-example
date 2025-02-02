<<<<<<< Updated upstream
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

    static to(currentScene, targetScene, data = {}) {
=======
import { ProgressManager } from './ProgressManager';

class SceneTransition {
    static progressManager = new ProgressManager();

    static to(currentScene, targetScene, data = {}) {
        // Save current progress
        this.progressManager.saveProgress({
            score: data.score || 0,
            powerUpBitmask: data.powerUpBitmask || 0,
            currentMap: data.currentMap || 1
        });

        // Check if we're in a test environment or if cameras are available
>>>>>>> Stashed changes
        if (!currentScene.cameras || !currentScene.cameras.main) {
            currentScene.scene.start(targetScene, data);
            return;
        }

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
        // Save current progress
        this.progressManager.saveProgress({
            score: data.score || 0,
            powerUpBitmask: data.powerUpBitmask || 0,
            currentMap: data.currentMap || 1
        });

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
<<<<<<< Updated upstream
=======

    static toSpaceInvaders(currentScene, nextScene, data = {}) {
        const progress = this.progressManager.loadProgress();
        const spaceInvadersData = {
            score: data.score || progress.score || 0,
            powerUpBitmask: data.powerUpBitmask || progress.powerUpBitmask || 0,
            triviaScore: data.triviaScore || 0,
            nextScene: nextScene
        };

        this.to(currentScene, 'space_invaders', spaceInvadersData);
    }

    static toSortSelection(currentScene, data = {}) {
        const progress = this.progressManager.loadProgress();
        const sortSelectionData = {
            score: data.score || progress.score || 0,
            powerUpBitmask: data.powerUpBitmask || progress.powerUpBitmask || 0,
            currentMap: data.currentMap || progress.currentMap || 1
        };

        this.to(currentScene, 'sort_selection', sortSelectionData);
    }

    static toGameScene(currentScene, mapNumber, sceneNumber, data = {}) {
        const progress = this.progressManager.loadProgress();
        const gameSceneData = {
            score: data.score || progress.score || 0,
            powerUpBitmask: data.powerUpBitmask || progress.powerUpBitmask || 0,
            currentMap: mapNumber
        };

        const targetScene = `map${mapNumber}scene${sceneNumber}`;
        this.to(currentScene, targetScene, gameSceneData);
    }

    static toMainMenu(currentScene, data = {}) {
        // Reset progress when going back to main menu
        this.progressManager.resetProgress();
        this.to(currentScene, 'mainmenu', data);
    }

    static toGameOver(currentScene, data = {}) {
        const progress = this.progressManager.loadProgress();
        const gameOverData = {
            score: data.score || progress.score || 0,
            powerUpBitmask: data.powerUpBitmask || progress.powerUpBitmask || 0,
            currentMap: data.currentMap || progress.currentMap || 1
        };

        this.to(currentScene, 'gameover', gameOverData);
    }
}
>>>>>>> Stashed changes

} 