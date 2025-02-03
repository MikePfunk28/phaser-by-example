import SceneOrderManager from '@/utils/SceneOrderManager';
import { ProgressManager } from './ProgressManager';

// src/constants/sceneTransitions.js
const SCENE_TRANSITIONS = {
    bootscene: 'mainmenu',
    mainmenu: {
        sort_selection: 'sort_selection',
        space_invaders: 'space_invaders',
        practice_mode: 'practice_mode'
    },
    sort_selection: 'space_invaders',
    space_invaders_to_map1scene1: { from: 'space_invaders', to: 'map1scene1' },
    map1scene1_to_space_invaders: { from: 'map1scene1', to: 'space_invaders', next: 'map1scene2' },
    space_invaders_to_map1scene2: { from: 'space_invaders', to: 'map1scene2' },
    map1scene2_to_space_invaders: { from: 'map1scene2', to: 'space_invaders', next: 'map1scene3' },
    space_invaders_to_map1scene3: { from: 'space_invaders', to: 'map1scene3' },
    map1scene3_to_space_invaders: { from: 'map1scene3', to: 'space_invaders', next: 'map1scene4' },
    space_invaders_to_map1scene4: { from: 'space_invaders', to: 'map1scene4' },
    map1scene4_to_space_invaders: { from: 'map1scene4', to: 'space_invaders', next: 'map2scene1' },
    space_invaders_to_map2scene1: { from: 'space_invaders', to: 'map2scene1' },
    map2scene1_to_space_invaders: { from: 'map2scene1', to: 'space_invaders', next: 'map2scene2' },
    space_invaders_to_map2scene2: { from: 'space_invaders', to: 'map2scene2' },
    map2scene2_to_space_invaders: { from: 'map2scene2', to: 'space_invaders', next: 'map2scene3' },
    space_invaders_to_map2scene3: { from: 'space_invaders', to: 'map2scene3' },
    map2scene3_to_space_invaders: { from: 'map2scene3', to: 'space_invaders', next: 'map2scene4' },
    space_invaders_to_map2scene4: { from: 'space_invaders', to: 'map2scene4' },
    map2scene4_to_space_invaders: { from: 'map2scene4', to: 'space_invaders', next: 'map3scene1' },
    space_invaders_to_map3scene1: { from: 'space_invaders', to: 'map3scene1' },
    map3scene1_to_space_invaders: { from: 'map3scene1', to: 'space_invaders', next: 'map3scene2' },
    space_invaders_to_map3scene2: { from: 'space_invaders', to: 'map3scene2' },
    map3scene2_to_space_invaders: { from: 'map3scene2', to: 'space_invaders', next: 'map3scene3' },
    space_invaders_to_map3scene3: { from: 'space_invaders', to: 'map3scene3' },
    map3scene3_to_space_invaders: { from: 'map3scene3', to: 'space_invaders', next: 'map3scene4' },
    space_invaders_to_map3scene4: { from: 'space_invaders', to: 'map3scene4' },
    map3scene4_to_space_invaders: { from: 'map3scene4', to: 'space_invaders', next: 'map4scene1' },
    space_invaders_to_map4scene1: { from: 'space_invaders', to: 'map4scene1' },
    map4scene1_to_space_invaders: { from: 'map4scene1', to: 'space_invaders', next: 'map4scene2' },
    space_invaders_to_map4scene2: { from: 'space_invaders', to: 'map4scene2' },
    map4scene2_to_space_invaders: { from: 'map4scene2', to: 'space_invaders', next: 'map4scene3' },
    space_invaders_to_map4scene3: { from: 'space_invaders', to: 'map4scene3' },
    map4scene3_to_space_invaders: { from: 'map4scene3', to: 'space_invaders', next: 'map4scene4' },
    space_invaders_to_map4scene4: { from: 'space_invaders', to: 'map4scene4' },
    map4scene4_to_gameover: { from: 'map4scene4', to: 'gameover' },
    gameover: 'mainmenu'
};

class SceneTransition {
    constructor() {
        this.isTransitioning = false;
        this.progressManager = new ProgressManager();
        this.sceneManager = new SceneOrderManager();
    }

    fadeIn(scene, duration = 500) {
        scene.cameras.main.fadeIn(duration);
    }

    fadeOut(scene, callback, duration = 500) {
        scene.cameras.main.fadeOut(duration);
        scene.cameras.main.once('camerafadeoutcomplete', () => {
            if (callback) callback();
        });
    }

    getNextTransition(fromScene, toScene) {
        // Handle the new mainmenu transitions structure
        if (fromScene === 'mainmenu' && SCENE_TRANSITIONS.mainmenu[toScene]) {
            return SCENE_TRANSITIONS.mainmenu[toScene];
        }

        const transitionKey = Object.keys(SCENE_TRANSITIONS).find(key => {
            const transition = SCENE_TRANSITIONS[key];
            if (typeof transition === 'string') {
                return key === fromScene && transition === toScene;
            }
            return transition.from === fromScene && transition.to === toScene;
        });

        return transitionKey ? SCENE_TRANSITIONS[transitionKey] : null;
    }

    to(scene, targetScene, data = {}) {
        if (this.isTransitioning) return;
        this.isTransitioning = true;

        const transition = this.getNextTransition(scene.scene.key, targetScene);
        if (!transition) {
            console.error(`No valid transition from ${scene.scene.key} to ${targetScene}`);
            this.isTransitioning = false;
            return;
        }

        // Save progress before transition
        this.progressManager.saveProgress({
            lastCompletedScene: scene.scene.key,
            score: data.score || 0,
            powerUpBitmask: data.powerUpBitmask || 0,
            currentMap: data.currentMap || 1
        });

        // Emit scene end event before transitioning
        scene.events.emit('sceneEnd');

        this.fadeOut(scene, () => {
            const nextScene = typeof transition === 'string' ? transition : transition.to;
            const transitionData = {
                ...data,
                fromScene: scene.scene.key,
                nextScene: typeof transition === 'object' ? transition.next : null
            };

            scene.scene.start(nextScene, transitionData);
            this.isTransitioning = false;
        });
    }

    toSpaceInvaders(scene, nextScene, data = {}) {
        const progress = this.progressManager.loadProgress();
        const spaceInvadersData = {
            score: data.score || progress.score || 0,
            powerUpBitmask: data.powerUpBitmask || progress.powerUpBitmask || 0,
            nextScene: nextScene,
            fromScene: scene.scene.key
        };

        // Emit scene pause event before going to space invaders
        scene.events.emit('scenePause');

        this.to(scene, 'space_invaders', spaceInvadersData);
    }

    fromSpaceInvaders(scene, data = {}) {
        const nextScene = data.nextScene;
        if (!nextScene) {
            console.error('No next scene specified for space invaders transition');
            return;
        }

        const gameSceneData = {
            score: data.score || 0,
            powerUpBitmask: data.powerUpBitmask || 0,
            currentMap: data.currentMap || 1,
            fromScene: 'space_invaders'
        };

        this.to(scene, nextScene, gameSceneData);
    }

    toGameScene(scene, mapNumber, sceneNumber, data = {}) {
        const progress = this.progressManager.loadProgress();
        const gameSceneData = {
            score: data.score || progress.score || 0,
            powerUpBitmask: data.powerUpBitmask || progress.powerUpBitmask || 0,
            currentMap: mapNumber,
            fromScene: scene.scene.key
        };

        // Emit scene start event when entering game scene
        scene.events.emit('sceneStart');

        const targetScene = `map${mapNumber}scene${sceneNumber}`;
        this.to(scene, targetScene, gameSceneData);
    }

    toMainMenu(scene, data = {}) {
        // Reset progress when going back to main menu
        this.progressManager.resetProgress();
        this.to(scene, 'mainmenu', data);
    }

    toGameOver(scene, data = {}) {
        const progress = this.progressManager.loadProgress();
        const gameOverData = {
            score: data.score || progress.score || 0,
            powerUpBitmask: data.powerUpBitmask || progress.powerUpBitmask || 0,
            currentMap: data.currentMap || progress.currentMap || 1,
            fromScene: scene.scene.key
        };

        this.to(scene, 'gameover', gameOverData);
    }
}

export { SceneTransition, SCENE_TRANSITIONS }; 