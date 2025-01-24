import { getAssetPath } from "@/utils/assetLoader";
import Phaser from 'phaser';
import SceneTransition from '@/utils/SceneTransition';

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
    }

    // Common methods from GameScene.js
    init(data) {
        if (data && typeof data.score === 'number') {
            this.score = data.score;
        }
    }

    preload() {
        // Load common assets
        this.load.json('questions', getAssetPath('data/questions.json'));
        this.load.image('checkMark', getAssetPath('images/checkmark.png'));
        this.load.image('xMark', getAssetPath('images/xmark.png'));
        this.load.bitmapFont('arcade', getAssetPath('fonts/arcade.png'), getAssetPath('fonts/arcade.xml'));
    }

    // Add all the common methods from GameScene.js
    setupScore() {
        this.scoreText = this.add.text(16, 16, 'Score: ' + this.score, {
            fontSize: '32px',
            fill: '#fff'
        });
    }

    transitionToNextScene() {
        if (this.isTransitioning) return;
        this.isTransitioning = true;
        SceneTransition.to(this, 'space_invaders', {
            nextScene: this.getNextSceneKey(),
            score: this.score
        });
    }

    // Method to be overridden by child classes
    getNextSceneKey() {
        throw new Error('getNextSceneKey must be implemented by child class');
    }

    // Add other common methods...
} 