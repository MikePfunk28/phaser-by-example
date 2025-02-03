import { getAssetPath } from "@/utils/assetLoader";
import Phaser from 'phaser';
import { SceneTransition } from '@/utils/SceneTransition';
import { ProgressManager } from '@/utils/ProgressManager';

export default class BaseGameScene extends Phaser.Scene {
    constructor(config) {
        super(config);
        this.player = null;
        this.score = 0;
        this.scoreText = null;
        this.questions = null;
        this.icons = [];
        this.answeredQuestions = 0;
        this.isTransitioning = false;
        this.clickCooldown = false;
        this.progressManager = new ProgressManager();
        this.sceneTransition = new SceneTransition();
    }

    // Common methods from GameScene.js
    init(data) {
        this.score = data.score || 0;
        this.powerUpBitmask = data.powerUpBitmask || 0;
        this.currentMap = data.currentMap || 1;
        this.fromScene = data.fromScene;
        this.answeredQuestions = 0;
    }

    preload() {
        // Load map config based on current map
        this.load.json('map-config', getAssetPath(`data/map${this.currentMap}/map-config.json`));
        this.load.json('questions', getAssetPath('data/questions.json'));

        // Load common assets
        this.load.image('checkmark', getAssetPath('images/checkmark.png'));
        this.load.image('xmark', getAssetPath('images/xmark.png'));
        this.load.bitmapFont('arcade', getAssetPath('fonts/arcade.png'), getAssetPath('fonts/arcade.xml'));
    }

    create() {
        // Add semi-transparent dark background
        this.add.rectangle(400, 300, 800, 600, 0x000000, 0.8);

        // Set up score display first
        this.setupScore();

        // Add power-up display
        this.powerUpText = this.add.text(16, 56, this.getPowerUpText(), {
            fontSize: '24px',
            fill: '#00ff00',
            fontFamily: 'Arial'
        });

        // Get the loaded questions and map config
        try {
            this.questions = this.cache.json.get('questions');
            const mapConfig = this.cache.json.get('map-config');

            if (!mapConfig || !mapConfig.zones) {
                throw new Error('Invalid map config structure');
            }

            // Set up the map based on config
            this.setupMap(mapConfig);

            // Add fade-in transition
            this.sceneTransition.fadeIn(this);

        } catch (error) {
            console.error('Error in create():', error);
        }
    }

    // Add all the common methods from GameScene.js
    setupScore() {
        this.scoreText = this.add.text(16, 16, `Score: ${this.score}`, {
            fontSize: '32px',
            fill: '#fff',
            backgroundColor: '#000',
            padding: { x: 10, y: 5 }
        });
    }

    getPowerUpText() {
        const powerUps = [];
        if (this.powerUpBitmask & 1) powerUps.push('Life+');
        if (this.powerUpBitmask & 2) powerUps.push('Size+');
        if (this.powerUpBitmask & 4) powerUps.push('Speed+');
        if (this.powerUpBitmask & 8) powerUps.push('Fire+');
        return `Power-ups: ${powerUps.join(' ')}`;
    }

    setupMap(mapConfig) {
        // To be implemented by child classes
        throw new Error('setupMap must be implemented by child class');
    }

    transitionToNextScene() {
        if (this.isTransitioning) return;
        this.isTransitioning = true;

        // Save progress
        this.progressManager.saveProgress({
            lastCompletedScene: this.scene.key,
            score: this.score,
            powerUpBitmask: this.powerUpBitmask,
            currentMap: this.currentMap
        });

        // Transition to space invaders
        this.sceneTransition.toSpaceInvaders(this, this.getNextSceneKey(), {
            score: this.score,
            powerUpBitmask: this.powerUpBitmask,
            currentMap: this.currentMap
        });
    }

    getNextSceneKey() {
        const currentSceneNumber = parseInt(this.scene.key.slice(-1));
        if (currentSceneNumber < 4) {
            return `map${this.currentMap}scene${currentSceneNumber + 1}`;
        } else if (this.currentMap < 4) {
            return `map${this.currentMap + 1}scene1`;
        } else {
            return 'gameover';
        }
    }

    handleQuestionAnswered(correct) {
        if (correct) {
            this.score += 100;
            this.scoreText.setText(`Score: ${this.score}`);
        }

        this.answeredQuestions++;
        if (this.answeredQuestions >= 5) {
            this.transitionToNextScene();
        }
    }

    // Add other common methods...
} 