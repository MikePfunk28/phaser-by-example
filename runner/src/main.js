// main.js
import Phaser from 'phaser';
import BootScene from "./scenes/bootscene";
import GameOver from "./scenes/gameover";
import MainMenu from './scenes/MainMenu';
import SpaceInvadersScene from "./scenes/SpaceInvadersScene";
import SortSelectionScene from './scenes/SortSelectionScene';
import TriviaMasterScene from './scenes/TriviaMasterScene';

// Map 1 Scenes (Trivia)
import Map1Scene1 from "./scenes/map1/GameScene";
import Map1Scene2 from "./scenes/map1/GameScene2";
import Map1Scene3 from "./scenes/map1/GameScene3";
import Map1Scene4 from "./scenes/map1/GameScene4";

// Map 2 Scenes (Trivia)
import Map2Scene1 from "./scenes/map2/Map2GameScene";
import Map2Scene2 from "./scenes/map2/Map2GameScene2";
import Map2Scene3 from "./scenes/map2/Map2GameScene3";
import Map2Scene4 from "./scenes/map2/Map2GameScene4";

// Map 3 Scenes (Trivia)
import Map3Scene1 from "./scenes/map3/Map3GameScene";
import Map3Scene2 from "./scenes/map3/Map3GameScene2";
import Map3Scene3 from "./scenes/map3/Map3GameScene3";
import Map3Scene4 from "./scenes/map3/Map3GameScene4";

// Map 4 Scenes (Diagram + Trivia)
import Map4Scene1 from "./scenes/map4/Map4GameScene";  // Diagram
import Map4Scene2 from "./scenes/map4/Map4GameScene2"; // Diagram
import Map4Scene3 from "./scenes/map4/Map4GameScene3"; // Trivia
import Map4Scene4 from "./scenes/map4/Map4GameScene4"; // Trivia

import { ProgressManager } from "./utils/ProgressManager";

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#000000',
    dom: {
        createContainer: true
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    render: {
        pixelArt: true,
        powerPreference: 'high-performance',
        antialias: true,
        antialiasGL: true,
    },
    scene: [
        BootScene,
        MainMenu,
        SortSelectionScene,
        SpaceInvadersScene,
        TriviaMasterScene,
        Map1Scene1,
        Map1Scene2,
        Map1Scene3,
        Map1Scene4,
        Map2Scene1,
        Map2Scene2,
        Map2Scene3,
        Map2Scene4,
        Map3Scene1,
        Map3Scene2,
        Map3Scene3,
        Map3Scene4,
        Map4Scene1,
        Map4Scene2,
        Map4Scene3,
        Map4Scene4,
        GameOver
    ]
};

window.addEventListener('load', () => {
    window.game = new Phaser.Game(config);

    window.gameState = {
        score: 0,
        currentMap: 1,
        powerUpBitmask: 0,
        lastScene: null
    };

    window.progressManager = new ProgressManager();

    document.addEventListener('click', function initAudio() {
        if (window.game.sound && window.game.sound.context.state === 'suspended') {
            window.game.sound.context.resume();
        }
        document.removeEventListener('click', initAudio);
    });

    // Removed automatic pausing/resuming on window blur/focus
    // window.addEventListener('blur', () => {
    //     const currentScene = window.game.scene.getScenes(true)[0];
    //     if (currentScene && !currentScene.scene.isTransitioning) {
    //         currentScene.scene.pause();
    //     }
    // });

    // window.addEventListener('focus', () => {
    //     const currentScene = window.game.scene.getScenes(true)[0];
    //     if (currentScene && !currentScene.scene.isTransitioning) {
    //         currentScene.scene.resume();
    //     }
    // });

    window.addEventListener('beforeunload', () => {
        const currentScene = window.game.scene.getScenes(true)[0];
        if (currentScene) {
            window.progressManager.saveProgress({
                lastCompletedScene: currentScene.scene.key,
                score: window.gameState.score,
                currentMap: window.gameState.currentMap,
                powerUpBitmask: window.gameState.powerUpBitmask
            });
        }
    });
});
