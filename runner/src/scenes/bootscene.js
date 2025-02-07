import { getAssetPath } from "../utils/assetLoader";
import { ProgressManager } from "../utils/ProgressManager";
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

        // Add error handler for asset loading first
        this.load.on('loaderror', (fileObj) => {
            console.warn('Error loading file:', fileObj.key, fileObj.src);
            this.handleAssetError(fileObj);
        });

        // Load essential assets
        this.loadEssentialAssets();
    }

    handleAssetError(fileObj) {
        switch (fileObj.type) {
            case 'image':
                this.createFallbackImage(fileObj.key);
                break;
            case 'audio':
                this.createSilentAudio(fileObj.key);
                break;
            case 'json':
                this.createFallbackJSON(fileObj.key);
                break;
        }
    }

    createFallbackImage(key) {
        const graphics = this.add.graphics();
        if (key.includes('correct_icon')) {
            graphics.fillStyle(0x00ff00);
            graphics.fillCircle(0, 0, 20);
        } else if (key.includes('wrong_icon')) {
            graphics.lineStyle(4, 0xff0000);
            graphics.moveTo(-10, -10);
            graphics.lineTo(10, 10);
            graphics.moveTo(10, -10);
            graphics.lineTo(-10, 10);
        } else if (key.includes('aws_')) {
            // AWS service icon placeholder
            graphics.fillStyle(0xFF9900); // AWS Orange
            graphics.fillRect(0, 0, 48, 48);
            graphics.lineStyle(2, 0x232F3E); // AWS Navy
            graphics.strokeRect(0, 0, 48, 48);
            // Add "AWS" text
            const text = this.add.text(24, 24, 'AWS', {
                font: '12px Arial',
                fill: '#232F3E'
            }).setOrigin(0.5);
            graphics.generateTexture(key, 48, 48);
            text.destroy();
        } else {
            // Default placeholder
            graphics.fillStyle(0x666666);
            graphics.fillRect(0, 0, 64, 64);
            graphics.lineStyle(2, 0xffffff);
            graphics.strokeRect(0, 0, 64, 64);
        }
        graphics.generateTexture(key, 64, 64);
        graphics.destroy();
    }

    createSilentAudio(key) {
        const audioContext = this.game.sound.context;
        if (audioContext) {
            const buffer = audioContext.createBuffer(2, 44100, 44100);
            this.cache.audio.add(key, buffer);
            console.log(`Created silent audio fallback for: ${key}`);
        }
    }

    createFallbackJSON(key) {
        if (key === 'questions') {
            this.cache.json.add(key, {
                questions: [
                    {
                        question: "Placeholder question",
                        correct_answer: "Correct",
                        incorrect_answers: ["Wrong 1", "Wrong 2", "Wrong 3"]
                    }
                ]
            });
        }
    }

    loadEssentialAssets() {
        try {
            // Load UI images
            const uiImages = [
                'background',
                'logo',
                'correct_icon',
                'wrong_icon'
            ];

            uiImages.forEach(key => {
                this.load.image(key, getAssetPath(`images/${key}.png`));
            });

            // Load all available sound effects
            const audioFiles = [
                'Buzzer',
                'click',
                'correct',
                'wrong',
                'fail',
                'satellite_destroy',
                'laser',
                'theme',
                'dead',
                'jump'
            ];

            audioFiles.forEach(key => {
                this.load.audio(key, getAssetPath(`sounds/${key}.mp3`));
            });

            // Load questions data
            this.load.json('questions', getAssetPath('data/questions.json'));

            // Load font
            this.load.bitmapFont('arcade',
                getAssetPath('fonts/arcade.png'),
                getAssetPath('fonts/arcade.xml')
            );

        } catch (e) {
            console.error('Error in loadEssentialAssets:', e);
        }
    }

    create() {
        // Create background
        this.add.rectangle(400, 300, 800, 600, 0x000000);

        // Only proceed if loading is actually complete
        if (this.load.isReady()) {
            const text = this.add.text(400, 300, 'Loading Complete!', {
                font: '32px monospace',
                fill: '#ffffff'
            }).setOrigin(0.5, 0.5);

            this.time.delayedCall(1000, () => {
                this.cameras.main.fadeOut(500);
                this.time.delayedCall(500, () => {
                    this.scene.start(this.nextScene || 'mainmenu', this.nextSceneData);
                });
            });
        } else {
            // Show loading status
            const loadingText = this.add.text(400, 300, 'Still Loading...', {
                font: '32px monospace',
                fill: '#ffffff'
            }).setOrigin(0.5, 0.5);

            // Wait for loading to complete
            this.load.once('complete', () => {
                loadingText.setText('Loading Complete!');
                this.time.delayedCall(1000, () => {
                    this.cameras.main.fadeOut(500);
                    this.time.delayedCall(500, () => {
                        this.scene.start(this.nextScene || 'mainmenu', this.nextSceneData);
                    });
                });
            });
        }
    }
}