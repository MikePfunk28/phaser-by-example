import { getAssetPath } from "../utils/assetLoader";
import progressManager from "../utils/ProgressManager";
import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'bootscene' });
        this.nextScene = null;
        this.nextSceneData = null;
    }

    init(data) {
        this.nextScene = data.nextScene || 'mainmenu';
        this.nextSceneData = data.nextSceneData || {};
    }

    preload() {
        // Create loading bar
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 4, height / 2 - 30, width / 2, 50);

        // Loading text
        const loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
            font: '20px monospace',
            fill: '#ffffff'
        }).setOrigin(0.5, 0.5);

        // Percentage text
        const percentText = this.add.text(width / 2, height / 2 + 70, '0%', {
            font: '18px monospace',
            fill: '#ffffff'
        }).setOrigin(0.5, 0.5);

        // Loading event handlers
        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0x00ff00, 1);
            progressBar.fillRect(width / 4 + 10, height / 2 - 20, (width / 2 - 20) * value, 30);
            percentText.setText(parseInt(value * 100) + '%');
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            percentText.destroy();
        });

        // Load essential assets
        this.loadEssentialAssets();
    }

    loadEssentialAssets() {
        // Add error handler for asset loading first
        this.load.on('loaderror', (fileObj) => {
            console.error('Error loading file:', fileObj.key, fileObj.src);
            // Create fallback assets if needed
            if (fileObj.key === 'background') {
                const graphics = this.add.graphics();
                graphics.fillStyle(0x000000);
                graphics.fillRect(0, 0, 800, 600);
                graphics.generateTexture('background', 800, 600);
                graphics.destroy();
            }
        });

        // Load common assets needed across scenes with explicit error handling
        try {
            this.load.image('background', getAssetPath('images/background.png'));
            this.load.image('logo', getAssetPath('images/logo.png'));
            this.load.image('cloud', getAssetPath('images/cloud.png'));
            this.load.image('coin', getAssetPath('images/coin.png'));

            // Load map thumbnails
            this.load.image('map1scene164', getAssetPath('images/map1scene164.png'));
            this.load.image('map1scene264', getAssetPath('images/map1scene264.png'));
            this.load.image('map1scene364', getAssetPath('images/map1scene364.png'));
            this.load.image('map1scene464', getAssetPath('images/map1scene464.png'));

            // Load font
            this.load.bitmapFont('arcade',
                getAssetPath('fonts/arcade.png'),
                getAssetPath('fonts/arcade.xml')
            );

            // Load questions
            this.load.json('questions', getAssetPath('data/questions.json'));
        } catch (e) {
            console.error('Error in loadEssentialAssets:', e);
        }
    }

    create() {
        // Load saved progress
        const progress = progressManager.loadProgress();

        // Create background
        this.add.rectangle(400, 300, 800, 600, 0x000000);

        // Create loading complete text
        const text = this.add.text(400, 300, 'Loading Complete!', {
            font: '32px monospace',
            fill: '#ffffff'
        }).setOrigin(0.5, 0.5);

        // Transition to next scene
        this.time.delayedCall(1000, () => {
            this.cameras.main.fadeOut(500);
            this.time.delayedCall(500, () => {
                // If we have saved progress and no specific next scene, go to last completed scene
                if (progress && progress.lastCompletedScene && !this.nextScene) {
                    this.scene.start(progress.lastCompletedScene, {
                        score: progress.score,
                        powerUpBitmask: progress.powerUpBitmask,
                        currentMap: progress.currentMap
                    });
                } else {
                    this.scene.start(this.nextScene, this.nextSceneData);
                }
            });
        });
    }
}