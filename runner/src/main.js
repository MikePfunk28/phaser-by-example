import Phaser from 'phaser';
import BootScene from "./scenes/bootscene";
import GameOver from "./scenes/gameover";
import GameScene from "./scenes/map1/GameScene";
import GameScene2 from "./scenes/map1/GameScene2";
import GameScene3 from "./scenes/map1/GameScene3";
import GameScene4 from "./scenes/map1/GameScene4";
//map2
import Map2GameScene from "./scenes/map2/Map2GameScene";
import Map2GameScene2 from "./scenes/map2/Map2GameScene2";
import Map2GameScene3 from "./scenes/map2/Map2GameScene3";
import Map2GameScene4 from "./scenes/map2/Map2GameScene4";
//map3
import Map3GameScene from "./scenes/map3/Map3GameScene";
import Map3GameScene2 from "./scenes/map3/Map3GameScene2";
import Map3GameScene3 from "./scenes/map3/Map3GameScene3";
import Map3GameScene4 from "./scenes/map3/Map3GameScene4";
//map4
import Map4GameScene from "./scenes/map4/Map4GameScene";
import Map4GameScene2 from "./scenes/map4/Map4GameScene2";
import Map4GameScene3 from "./scenes/map4/Map4GameScene3";
import Map4GameScene4 from "./scenes/map4/Map4GameScene4";
import SpaceInvadersScene from "./scenes/SpaceInvadersScene";
import SortSelectionScene from './scenes/SortSelectionScene';
import MainMenu from './scenes/MainMenu';
import { ProgressManager } from "./utils/ProgressManager";
import { SceneTransition, SCENE_TRANSITIONS } from "./utils/SceneTransition";

// Add global scene management
class SceneManager {
  constructor() {
    this.sortData = {
      selected: null,
      thumbnails: [],
      sortedScenes: [],
      score: 0
    };

    // Power-up constants
    this.POWERUP_TYPES = {
      SHIELD: 0b1111000000000000,  // 4 bits for shield layers (1-4)
      SPEED: 0b0000111100000000,   // 4 bits for speed levels (1-4)
      FIRE_RATE: 0b0000000011110000, // 4 bits for fire rate (1-4)
      EXTRA_LIVES: 0b0000000000001111 // 4 bits for extra lives (1-4)
    };

    this.gameState = {
      currentMap: 1,
      score: 0,
      isInGame: false,  // Flag to track if we're in the main game or practice
      lastTriviaPowerUp: 0,  // Bitmap of permanent power-ups from trivia
      currentPowerUps: 0,    // Current active power-ups (can be damaged during game)
      baseHealth: 3,         // Base number of lives
    };
  }

  // Get the level of a specific power-up type
  getPowerUpLevel(powerUpType) {
    const shifted = this.gameState.currentPowerUps & powerUpType;
    switch (powerUpType) {
      case this.POWERUP_TYPES.SHIELD: return (shifted >> 12) & 0xF;
      case this.POWERUP_TYPES.SPEED: return (shifted >> 8) & 0xF;
      case this.POWERUP_TYPES.FIRE_RATE: return (shifted >> 4) & 0xF;
      case this.POWERUP_TYPES.EXTRA_LIVES: return shifted & 0xF;
      default: return 0;
    }
  }

  // Add a permanent power-up from trivia
  addTriviaPowerUp(type, level) {
    this.gameState.lastTriviaPowerUp |= (level << this.getPowerUpShift(type));
    this.resetPowerUpsToTrivia(); // Reset current power-ups to permanent ones
  }

  // Reset power-ups to permanent trivia bonuses
  resetPowerUpsToTrivia() {
    this.gameState.currentPowerUps = this.gameState.lastTriviaPowerUp;
  }

  // Handle taking damage
  takeDamage() {
    const shieldLevel = this.getPowerUpLevel(this.POWERUP_TYPES.SHIELD);
    if (shieldLevel > 0) {
      // Remove one shield layer
      const shift = this.getPowerUpShift(this.POWERUP_TYPES.SHIELD);
      const newShield = ((shieldLevel - 1) << shift);
      this.gameState.currentPowerUps =
        (this.gameState.currentPowerUps & ~this.POWERUP_TYPES.SHIELD) | newShield;
      return false; // Didn't lose a life
    }
    return true; // Lost a life
  }

  getPowerUpShift(type) {
    switch (type) {
      case this.POWERUP_TYPES.SHIELD: return 12;
      case this.POWERUP_TYPES.SPEED: return 8;
      case this.POWERUP_TYPES.FIRE_RATE: return 4;
      case this.POWERUP_TYPES.EXTRA_LIVES: return 0;
      default: return 0;
    }
  }

  startPracticeMode() {
    this.gameState.isInGame = false;
    this.gameState.currentPowerUps = 0;  // No power-ups in practice
    return {
      score: 0,
      powerUpBitmask: 0,
      nextScene: 'mainmenu',
      isPractice: true,
      baseHealth: this.gameState.baseHealth
    };
  }

  startTriviaMinigame(fromScene) {
    this.gameState.isInGame = true;
    this.resetPowerUpsToTrivia();  // Reset to permanent power-ups
    return {
      score: this.gameState.score,
      powerUpBitmask: this.gameState.currentPowerUps,
      nextScene: fromScene,
      isPractice: false,
      baseHealth: this.gameState.baseHealth
    };
  }

  getTransitionData(fromScene, toScene) {
    // Handle space invaders transitions
    if (toScene === 'space_invaders') {
      // If we're coming from sort selection
      if (fromScene === 'sort_selection') {
        return this.gameState.isInGame ?
          this.startTriviaMinigame(this.gameState.currentScene) :
          this.startPracticeMode();
      }
      // If we're between game scenes
      if (fromScene.startsWith('map')) {
        this.gameState.currentScene = fromScene;
        return this.startTriviaMinigame(fromScene);
      }
    }

    // Handle transitions between game scenes
    if (fromScene === 'space_invaders' && toScene.startsWith('map')) {
      return {
        score: this.gameState.score,
        powerUpBitmask: this.gameState.currentPowerUps,
        fromSpaceInvaders: true,
        baseHealth: this.gameState.baseHealth
      };
    }

    // Default transition data
    return {
      score: this.gameState.score,
      powerUpBitmask: this.gameState.currentPowerUps,
      sortType: this.sortData.selected,
      structure: this.sortData.thumbnails.map(thumb => thumb.texture.key),
      sortedScenes: this.sortData.sortedScenes,
      fromScene,
      toScene,
      baseHealth: this.gameState.baseHealth
    };
  }

  setSortMethod(method) {
    this.sortData.selected = method;
  }

  getSortedScenes() {
    return this.sortData.sortedScenes;
  }

  updateScore(score) {
    this.gameState.score = score;
  }
}

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  backgroundColor: '#000000',
  dom: {
    createContainer: true
  },
  audio: {
    context: new (window.AudioContext || window.webkitAudioContext)()
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 800,
    height: 600
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
    GameScene,
    GameScene2,
    GameScene3,
    GameScene4,
    Map2GameScene,
    Map2GameScene2,
    Map2GameScene3,
    Map2GameScene4,
    Map3GameScene,
    Map3GameScene2,
    Map3GameScene3,
    Map3GameScene4,
    Map4GameScene,
    Map4GameScene2,
    Map4GameScene3,
    Map4GameScene4,
    GameOver
  ]
};

// Initialize managers before game creation
const progressManager = new ProgressManager();
const sceneTransition = new SceneTransition();
const sceneManager = new SceneManager();

// Attach to window object
window.progressManager = progressManager;
window.sceneTransition = sceneTransition;
window.sceneManager = sceneManager;

window.addEventListener('load', () => {
  window.game = new Phaser.Game(config);

  // Initialize audio context on user interaction
  document.addEventListener('click', function initAudio() {
    if (window.game.sound && window.game.sound.context.state === 'suspended') {
      window.game.sound.context.resume();
    }
    document.removeEventListener('click', initAudio);
  });

  // Handle window focus/blur
  window.addEventListener('blur', () => {
    if (window.game.scene.scenes.length > 0) {
      window.game.scene.scenes.forEach(scene => {
        if (scene.scene.isActive()) {
          scene.scene.pause();
        }
      });
    }
  });

  window.addEventListener('focus', () => {
    if (window.game.scene.scenes.length > 0) {
      window.game.scene.scenes.forEach(scene => {
        if (scene.scene.isPaused()) {
          scene.scene.resume();
        }
      });
    }
  });

  // Handle game shutdown
  window.addEventListener('beforeunload', () => {
    // Save current progress before closing
    const currentScene = window.game.scene.scenes.find(scene => scene.scene.isActive());
    if (currentScene) {
      progressManager.saveProgress({
        lastCompletedScene: currentScene.scene.key
      });
    }
  });
});