import { ProgressManager } from './ProgressManager';

// Scene transition states
const TRANSITION_STATE = {
    IDLE: 'idle',
    TRANSITIONING: 'transitioning',
    FADING: 'fading',
    ERROR: 'error'
};

// Scene transitions configuration
const SCENE_TRANSITIONS = {
    bootscene: 'mainmenu',
    mainmenu: {
        sort_selection: 'sort_selection',
        space_invaders: 'space_invaders',
        practice_mode: 'practice_mode',
        map1scene1: 'map1scene1'
    },
    sort_selection: 'mainmenu',
    space_invaders: {
        mainmenu: 'mainmenu',
        map1scene1: 'map1scene1',
        map1scene2: 'map1scene2',
        map1scene3: 'map1scene3',
        map1scene4: 'map1scene4',
        map2scene1: 'map2scene1',
        map2scene2: 'map2scene2',
        map2scene3: 'map2scene3',
        map2scene4: 'map2scene4',
        map3scene1: 'map3scene1',
        map3scene2: 'map3scene2',
        map3scene3: 'map3scene3',
        map3scene4: 'map3scene4',
        map4scene1: 'map4scene1',
        map4scene2: 'map4scene2',
        map4scene3: 'map4scene3',
        map4scene4: 'map4scene4'
    },
    gameover: 'mainmenu'
};

export class SceneTransition {
    constructor() {
        this.state = TRANSITION_STATE.IDLE;
        this.currentScene = null;
        this.nextScene = null;
        this.transitionData = null;
        this.progressManager = new ProgressManager();
        this.transitionHistory = [];
    }

    setCurrentScene(scene) {
        this.currentScene = scene;
        this.state = TRANSITION_STATE.IDLE;
    }

    getState() {
        return this.state;
    }

    getTransitionHistory() {
        return this.transitionHistory;
    }

    fadeIn(scene, duration = 500) {
        if (!scene || !scene.cameras) {
            console.error('Invalid scene for fadeIn');
            return;
        }
        this.state = TRANSITION_STATE.FADING;
        scene.cameras.main.fadeIn(duration);
        scene.cameras.main.once('camerafadeincomplete', () => {
            this.state = TRANSITION_STATE.IDLE;
        });
    }

    fadeOut(scene, callback, duration = 500) {
        if (!scene || !scene.cameras) {
            console.error('Invalid scene for fadeOut');
            return;
        }
        this.state = TRANSITION_STATE.FADING;
        scene.cameras.main.fadeOut(duration);
        scene.cameras.main.once('camerafadeoutcomplete', () => {
            if (callback) callback();
            this.state = TRANSITION_STATE.TRANSITIONING;
        });
    }

    getNextTransition(fromScene, toScene) {
        if (!fromScene || !toScene) {
            console.error('Invalid scene parameters');
            return null;
        }

        if (fromScene === 'mainmenu' && SCENE_TRANSITIONS.mainmenu[toScene]) {
            return SCENE_TRANSITIONS.mainmenu[toScene];
        }

        if (fromScene === 'space_invaders' && SCENE_TRANSITIONS.space_invaders[toScene]) {
            return SCENE_TRANSITIONS.space_invaders[toScene];
        }

        if (fromScene === 'sort_selection') {
            return SCENE_TRANSITIONS.sort_selection;
        }

        if (fromScene === 'trivia_master') {
            const match = toScene.match(/map(\d+)scene(\d+)/);
            if (match) {
                const [_, mapNumber, sceneNumber] = match;
                if (sceneNumber === '4' && mapNumber !== '4') {
                    return `map${parseInt(mapNumber) + 1}scene1`;
                } else if (sceneNumber === '4' && mapNumber === '4') {
                    return 'gameover';
                } else {
                    return `map${mapNumber}scene${parseInt(sceneNumber) + 1}`;
                }
            }
        }

        return null;
    }

    to(scene, targetScene, data = {}) {
        if (this.state === TRANSITION_STATE.TRANSITIONING) {
            console.warn('Scene transition already in progress');
            return;
        }

        if (!scene || !scene.scene || !targetScene) {
            console.error('Invalid scene parameters');
            this.state = TRANSITION_STATE.ERROR;
            return;
        }

        this.state = TRANSITION_STATE.TRANSITIONING;
        this.nextScene = targetScene;
        this.transitionData = data;

        if (targetScene.match(/map\d+scene\d+/)) {
            const match = targetScene.match(/map(\d+)scene(\d+)/);
            if (match) {
                const [_, mapNumber, sceneNumber] = match;
                this.fadeOut(scene, () => {
                    scene.scene.start('trivia_master', {
                        ...data,
                        mapNumber: parseInt(mapNumber),
                        sceneNumber: parseInt(sceneNumber),
                        fromScene: scene.scene.key
                    });
                    this.setCurrentScene('trivia_master');
                });
                return;
            }
        }

        const transition = this.getNextTransition(scene.scene.key, targetScene);
        if (!transition) {
            console.error(`Invalid transition from ${scene.scene.key} to ${targetScene}`);
            this.state = TRANSITION_STATE.ERROR;
            return;
        }

        this.progressManager.saveProgress({
            lastCompletedScene: scene.scene.key,
            score: data.score || 0,
            powerUpBitmask: data.powerUpBitmask || 0,
            currentMap: data.currentMap || 1
        });

        this.transitionHistory.push({
            from: scene.scene.key,
            to: targetScene,
            timestamp: Date.now(),
            data: { ...data }
        });

        scene.events.emit('sceneCleanup');
        scene.events.emit('sceneEnd');

        this.fadeOut(scene, () => {
            scene.scene.start(targetScene, {
                ...data,
                fromScene: scene.scene.key
            });
            this.setCurrentScene(targetScene);
        });
    }

    toSpaceInvaders(scene, nextScene, data = {}) {
        if (this.state === TRANSITION_STATE.TRANSITIONING) {
            console.warn('Scene transition already in progress');
            return;
        }

        const progress = this.progressManager.loadProgress();
        const spaceInvadersData = {
            score: data.score || progress.score || 0,
            powerUpBitmask: data.powerUpBitmask || progress.powerUpBitmask || 0,
            nextScene: nextScene,
            fromScene: scene.scene.key,
            currentMap: data.currentMap || progress.currentMap || 1
        };

        scene.events.emit('scenePause');
        this.to(scene, 'space_invaders', spaceInvadersData);
    }

    fromSpaceInvaders(scene, data = {}) {
        const nextScene = data.nextScene;
        if (!nextScene) {
            console.error('No next scene specified for space invaders transition');
            this.state = TRANSITION_STATE.ERROR;
            return;
        }

        const gameSceneData = {
            score: data.score || 0,
            powerUpBitmask: data.powerUpBitmask || 0,
            currentMap: data.currentMap || 1,
            fromScene: 'space_invaders'
        };

        if (nextScene === 'gameover') {
            this.toGameOver(scene, gameSceneData);
        } else {
            this.to(scene, nextScene, gameSceneData);
        }
    }

    toMainMenu(scene, data = {}) {
        scene.events.emit('sceneCleanup');
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

        scene.events.emit('sceneCleanup');
        this.to(scene, 'gameover', gameOverData);
    }

    reset() {
        this.state = TRANSITION_STATE.IDLE;
        this.nextScene = null;
        this.transitionData = null;
    }
}

export { SCENE_TRANSITIONS, TRANSITION_STATE }; 