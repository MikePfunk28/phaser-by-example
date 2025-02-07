import BaseGameScene from '../BaseGameScene';
import { getAssetPath } from "@/utils/assetLoader";
import Player from '@/gameobjects/player';
import Generator from '@/gameobjects/generator';
import Phaser from 'phaser';
import { SceneTransition } from '@/utils/SceneTransition';
import { ProgressManager } from '@/utils/ProgressManager';

export default class Map2GameScene3 extends BaseGameScene {
    constructor() {
        super({ key: 'map2scene3' });
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
            lastCompletedScene: 'map2scene3',
            currentMap: this.currentMap,
            powerUpBitmask: this.powerUpBitmask,
            score: this.score
        });
    }

    preload() {
        this.load.scene('map2scene3', getAssetPath('images/map2scene3.png'));
        this.load.json('map-config3', getAssetPath('data/map2/map-config3.json'));
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
            const mapConfig = this.cache.json.get('map-config3');

            if (!mapConfig || !mapConfig.zones) {
                throw new Error('Invalid map config structure');
            }

            // Set up the map based on config
            const zoneIndex = 2; // Use third zone for scene 3
            const activeZone = mapConfig.zones[zoneIndex] || mapConfig.zones[0];

            if (!activeZone) {
                throw new Error('No valid zone found in config');
            }

            // Set up the map with default values if needed
            const map = this.add.image(
                activeZone.x || 400,
                activeZone.y || 300,
                'map2scene3'
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
                this.scene.start('map2scene3');
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
        // Preload all icons
        mapConfig.zones.forEach(zone => {
            zone.icons.forEach(iconConfig => {
                const iconPath = `assets/images/services16/${iconConfig.category}/48/${iconConfig.name}`;
                console.log('Loading icon:', iconConfig.name, 'from path:', iconPath);
                this.load.image(`icon_${iconConfig.name}`, iconPath);
            });
        });

        // Start the loader and create icons upon completion
        this.load.once('complete', () => {
            mapConfig.zones.forEach(zone => {
                zone.icons.forEach(iconConfig => {
                    const iconKey = `icon_${iconConfig.name}`;
                    console.log('Creating icon:', iconKey);

                    // Create icon sprite with natural size (scale 1.0)
                    const iconSprite = this.add.image(iconConfig.x, iconConfig.y, iconKey)
                        .setInteractive()
                        .setScale(1.0); // Natural size

                    // Add highlight box that matches icon size
                    const box = this.add.rectangle(
                        iconConfig.x,
                        iconConfig.y,
                        48, // Fixed size for AWS icons
                        48,
                        0x00ff00,
                        0
                    );
                    box.setStrokeStyle(2, 0x00ff00);
                    iconSprite.box = box;

                    this.setupIconInteraction(iconSprite, iconConfig);
                    this.icons.push(iconSprite);
                });
            });
        });

        this.load.start();
    }

    setupIconInteraction(iconSprite, iconConfig) {
        // No tint by default
        iconSprite.setTint(0xffffff);
        iconSprite.isAnswered = false;

        // Hover effects only if not answered
        iconSprite.on('pointerover', () => {
            if (!iconSprite.isAnswered) {
                iconSprite.setTint(0xcccccc);
            }
        });

        iconSprite.on('pointerout', () => {
            if (!iconSprite.isAnswered) {
                iconSprite.setTint(0xffffff);
            }
        });

        // Click handler with cooldown
        iconSprite.on('pointerdown', () => {
            if (!iconSprite.isAnswered && !this.clickCooldown) {
                this.handleIconClick(iconSprite, iconConfig);
                this.clickCooldown = true;
                setTimeout(() => {
                    this.clickCooldown = false;
                }, 500);
            }
        });
    }

    handleIconClick(iconSprite, iconConfig) {
        const relevantQuestion = this.questions.find(q =>
            iconConfig.questionTypes.some(type =>
                q.question.toLowerCase().includes(type.toLowerCase())
            )
        );

        if (relevantQuestion) {
            this.showQuestion(relevantQuestion, iconSprite);
        }
    }

    showQuestion(question, iconSprite) {
        // Create semi-transparent dark overlay
        const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.8)
            .setDepth(100);

        // Create question text with background
        const questionBg = this.add.rectangle(400, 150, 750, 100, 0x333333)
            .setDepth(101);

        const questionText = this.add.text(400, 150, question.question, {
            fontSize: '24px',
            fill: '#fff',
            align: 'center',
            wordWrap: { width: 700 },
            lineSpacing: 10
        }).setOrigin(0.5).setDepth(102);

        // Create answer buttons
        const answers = Object.entries(question.options);
        const startY = 250;
        const spacing = 70;
        let isAnswered = false;  // Flag to prevent multiple answers

        const answerButtons = answers.map(([key, value], index) => {
            const y = startY + (index * spacing);
            const button = this.add.rectangle(400, y, 600, 50, 0x333333)
                .setInteractive()
                .setDepth(101);

            const text = this.add.text(400, y, `${key}: ${value}`, {
                fontSize: '20px',
                fill: '#fff',
                wordWrap: { width: 550 },
                align: 'center'
            }).setOrigin(0.5).setDepth(102);

            button.on('pointerover', () => {
                if (!isAnswered) {
                    button.setFillStyle(0x666666);
                }
            });

            button.on('pointerout', () => {
                if (!isAnswered) {
                    button.setFillStyle(0x333333);
                }
            });

            button.on('pointerdown', () => {
                if (isAnswered) return;  // Prevent multiple answers
                isAnswered = true;

                const isCorrect = key === question.answer;

                // Update score and icon appearance
                if (isCorrect) {
                    this.score += 100;
                    this.scoreText.setText(`Score: ${this.score}`);
                    iconSprite.setTint(0x00ff00);  // Green for correct
                    this.add.image(iconSprite.x, iconSprite.y, 'checkMark')
                        .setScale(1.0)
                        .setDepth(50);
                } else {
                    iconSprite.setTint(0xff0000);  // Red for incorrect
                    this.add.image(iconSprite.x, iconSprite.y, 'xMark')
                        .setScale(1.0)
                        .setDepth(50);
                }

                // Mark icon as answered
                iconSprite.isAnswered = true;
                iconSprite.disableInteractive();

                // Show explanation with background
                const explanationBg = this.add.rectangle(400, 500, 750, 100, isCorrect ? 0x004400 : 0x440000)
                    .setDepth(101);

                const explanation = this.add.text(400, 500, question.explanation, {
                    fontSize: '20px',
                    fill: isCorrect ? '#00ff00' : '#ff0000',
                    align: 'center',
                    wordWrap: { width: 700 },
                    lineSpacing: 5
                }).setOrigin(0.5).setDepth(102);

                // Remove question interface after delay
                setTimeout(() => {
                    overlay.destroy();
                    questionBg.destroy();
                    questionText.destroy();
                    explanationBg.destroy();
                    explanation.destroy();
                    answerButtons.forEach(({ button, text }) => {
                        button.destroy();
                        text.destroy();
                    });

                    this.answeredQuestions++;
                    if (this.answeredQuestions === 5) {
                        this.transitionToNextScene();
                    }
                }, 3000);
            });

            return { button, text };
        });
    }

    setupScore() {
        this.scoreText = this.add.text(16, 16, 'Score: ' + this.score, {
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
            lastCompletedScene: 'map2scene3',
            currentMap: this.currentMap,
            powerUpBitmask: this.powerUpBitmask,
            score: this.score
        });

        // Transition to space invaders
        this.sceneTransition.to(this, 'space_invaders', {
            nextScene: 'map2scene4',
            score: this.score,
            powerUpBitmask: this.powerUpBitmask,
            currentMap: this.currentMap
        });
    }
}
