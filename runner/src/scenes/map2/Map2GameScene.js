import { getAssetPath } from '@/utils/assetLoader';
import Generator from '@/gameobjects/generator';
import Phaser from 'phaser';
import { SceneTransition } from '@/utils/SceneTransition';
import { ProgressManager } from '@/utils/ProgressManager';
import BaseGameScene from '../BaseGameScene';

export default class Map2GameScene extends BaseGameScene {
    constructor() {
        super({ key: 'map2scene1' });
        this.player = null;
        this.score = 0;
        this.scoreText = null;
        this.currentMap = 2;
        this.questions = null;
        this.icons = [];
        this.answeredQuestions = 0;
        this.isTransitioning = false;
        this.clickCooldown = false;
        this.powerUpBitmask = 0;
        this.progressManager = new ProgressManager();
        this.sceneTransition = new SceneTransition();
    }

    init(data) {
        this.score = data.score || 0;
        this.powerUpBitmask = data.powerUpBitmask || 0;
        this.currentMap = data.currentMap || 2;

        // Save progress
        this.progressManager.saveProgress({
            lastCompletedScene: 'map2scene1',
            currentMap: this.currentMap,
            powerUpBitmask: this.powerUpBitmask,
            score: this.score
        });
    }

    preload() {
        this.load.scene('map2scene1', getAssetPath('images/map2scene1.png'));
        this.load.json('map-config', getAssetPath('data/map2/map-config.json'));
        this.load.json('questions', getAssetPath('data/questions.json'));
        this.load.image('checkMark', getAssetPath('images/checkmark.png'));
        this.load.image('xMark', getAssetPath('images/xmark.png'));

        // Add error handler for asset loading
        this.load.on('loaderror', (fileObj) => {
            console.error('Error loading file:', fileObj.key);
            // Use fallback assets if available
            if (fileObj.key === 'checkMark') {
                // Create a simple green circle as fallback
                const graphics = this.add.graphics();
                graphics.fillStyle(0x00ff00);
                graphics.fillCircle(0, 0, 20);
                graphics.generateTexture('checkMark', 40, 40);
                graphics.destroy();
            } else if (fileObj.key === 'xMark') {
                // Create a simple red X as fallback
                const graphics = this.add.graphics();
                graphics.lineStyle(4, 0xff0000);
                graphics.moveTo(-10, -10);
                graphics.lineTo(10, 10);
                graphics.moveTo(10, -10);
                graphics.lineTo(-10, 10);
                graphics.generateTexture('xMark', 40, 40);
                graphics.destroy();
            }
        });
    }

    create() {
        // Add semi-transparent dark background
        this.add.rectangle(400, 300, 800, 600, 0x000000, 0.8);

        // Initialize sound settings
        if (this.sound && this.sound.context) {
            this.sound.pauseOnBlur = false;
        }

        // Set up score display first
        this.setupScore();

        // Add power-up display
        this.powerUpText = this.add.text(16, 56, this.getPowerUpText(), {
            fontSize: '24px',
            fill: '#00ff00',
            fontFamily: 'Arial'
        });

        // Get the loaded questions and map config with error handling
        try {
            this.questions = this.cache.json.get('questions');
            const mapConfig = this.cache.json.get('map-config');

            if (!mapConfig || !mapConfig.zones) {
                throw new Error('Invalid map config structure');
            }

            // Set up the map based on config
            const zoneIndex = 0; // Use first zone for scene 1
            const activeZone = mapConfig.zones[zoneIndex] || mapConfig.zones[0];

            if (!activeZone) {
                throw new Error('No valid zone found in config');
            }

            // Set up the map with default values if needed
            const map = this.add.image(
                activeZone.x || 400,
                activeZone.y || 300,
                'map2scene1'
            );
            map.setOrigin(0.5);
            map.setScale(activeZone.scale || 1);

            // Load AWS icons after we have the config
            this.loadAwsIcons(mapConfig);

            // Add fade-in transition
            this.sceneTransition.fadeIn();

        } catch (error) {
            console.error('Error in create:', error);
            // Show error message to user
            this.add.text(400, 300, 'Error loading level. Restarting...', {
                fontSize: '24px',
                fill: '#fff',
                backgroundColor: '#ff0000',
                padding: { x: 10, y: 5 }
            }).setOrigin(0.5);

            // Restart the scene after a delay
            setTimeout(() => {
                this.scene.start('map2scene1');
            }, 2000);
        }
    }

    getPowerUpText() {
        const powerUps = [];
        if (this.powerUpBitmask & 1) powerUps.push('Life+');
        if (this.powerUpBitmask & 2) powerUps.push('Size+');
        if (this.powerUpBitmask & 4) powerUps.push('Speed+');
        if (this.powerUpBitmask & 8) powerUps.push('Fire+');
        return `Power-ups: ${powerUps.join(' ')}`;
    }

    loadAwsIcons(mapConfig) {
        mapConfig.zones.forEach(zone => {
            zone.icons.forEach(icon => {
                const iconSprite = this.add.image(
                    icon.x,
                    icon.y,
                    `icon_${icon.name}`
                )
                    .setInteractive()
                    .setScale(0.5);

                // Add green box around icon
                const box = this.add.rectangle(icon.x, icon.y, 48, 48, 0x00ff00, 0);
                box.setStrokeStyle(2, 0x00ff00);
                iconSprite.box = box;

                this.setupIconInteraction(iconSprite, icon);
                this.icons.push(iconSprite);
            });
        });
    }

    setupIconInteraction(iconSprite, iconConfig) {
        iconSprite.on('pointerover', () => {
            iconSprite.box.setStrokeStyle(2, 0xffff00);
            iconSprite.setScale(0.6);
        });

        iconSprite.on('pointerout', () => {
            iconSprite.box.setStrokeStyle(2, 0x00ff00);
            iconSprite.setScale(0.5);
        });

        iconSprite.on('pointerdown', () => {
            if (!this.clickCooldown) {
                this.handleIconClick(iconSprite, iconConfig);
            }
        });
    }

    handleIconClick(iconSprite, iconConfig) {
        // Handle icon click logic
        const relevantQuestion = this.questions.find(q =>
            iconConfig.questionTypes.some(type =>
                q.question.toLowerCase().includes(type.toLowerCase())
            )
        );

        if (relevantQuestion) {
            // Show question and handle answer
            this.showQuestion(relevantQuestion, correct => {
                this.handleQuestionAnswered(correct);
                if (correct) {
                    iconSprite.setTint(0x00ff00);
                    iconSprite.box.setStrokeStyle(2, 0x00ff00);
                }
            });
        }
    }

    showQuestion(question, callback) {
        // Question display logic here
        // This should be implemented based on your question display requirements
    }

    setupScore() {
        this.scoreText = this.add.text(16, 16, 'Score: 0', {
            fontSize: '32px',
            fill: '#fff',
            backgroundColor: '#000',
            padding: { x: 10, y: 5 }
        }).setScrollFactor(0).setDepth(200);
    }

    transitionToNextScene() {
        if (this.isTransitioning) return;
        this.isTransitioning = true;

        // Save progress before transition
        this.progressManager.saveProgress({
            lastCompletedScene: 'map2scene1',
            currentMap: this.currentMap,
            powerUpBitmask: this.powerUpBitmask,
            score: this.score
        });

        // Transition to sorting scene
        this.sceneTransition.fadeOut(() => {
            this.scene.start('sort_selection', {
                score: this.score,
                powerUpBitmask: this.powerUpBitmask,
                currentMap: this.currentMap
            });
        });
    }
}
