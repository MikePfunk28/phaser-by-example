import BaseGameScene from '../BaseGameScene';
import { getAssetPath } from "@/utils/assetLoader";
import Player from '@/gameobjects/player';
import Generator from '@/gameobjects/generator';
import Phaser from 'phaser';
import SceneTransition from '@/utils/SceneTransition';
<<<<<<< Updated upstream

export default class GameScene extends BaseGameScene {
=======
import { ProgressManager } from '@/utils/ProgressManager';

export default class GameScene extends Phaser.Scene {
>>>>>>> Stashed changes
    constructor() {
        super({ key: 'map1gamescene1' });
        this.player = null;
        this.score = 0;
        this.scoreText = null;
        this.currentMap = 1;
        this.questions = null;
        this.icons = [];
        this.answeredQuestions = 0;
        this.isTransitioning = false;
        this.clickCooldown = false;
        this.powerUpBitmask = 0;
        this.progressManager = new ProgressManager();
        this.sceneTransition = new SceneTransition();
    }

<<<<<<< Updated upstream
    preload() {
        super.preload();
        this.load.image('map1scene1', getAssetPath('images/map1scene1.png'));
=======
    init(data) {
        this.score = data.score || 0;
        this.powerUpBitmask = data.powerUpBitmask || 0;
        this.currentMap = data.currentMap || 1;

        // Save progress
        this.progressManager.saveProgress({
            lastCompletedScene: 'map1gamescene1',
            currentMap: this.currentMap,
            powerUpBitmask: this.powerUpBitmask,
            score: this.score
        });
    }

    preload() {
        this.load.scene('map1gamescene1', getAssetPath('images/map1gamescene1.png'));
>>>>>>> Stashed changes
        this.load.json('map-config', getAssetPath('data/map1/map-config.json'));
    }

    getNextSceneKey() {
        return 'map1scene2';
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
            const mapConfig = this.cache.json.get('map-config');
            this.questions = this.cache.json.get('questions');

            if (!mapConfig) {
                throw new Error('Error: Map configuration not found');
            }

            if (!this.questions) {
                throw new Error('Error: Questions not found');
            }

            if (!mapConfig.zones) {
                throw new Error('Invalid map config structure');
            }

            // Set up the map based on config
            const activeZone = mapConfig.zones[0];

            if (!activeZone) {
                throw new Error('No valid zone found in config');
            }

            // Set up the map with default values if needed
            const map = this.add.image(
                activeZone.x || 400,
                activeZone.y || 300,
                'map1gamescene1'
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
            this.add.text(400, 300, error.message, {
                fontSize: '24px',
                fill: '#fff',
                backgroundColor: '#ff0000',
                padding: { x: 10, y: 5 }
            }).setOrigin(0.5);

            // Restart the scene after a delay
            setTimeout(() => {
                this.scene.start('map1gamescene1');
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
        // Preload all icons with proper error handling
        mapConfig.zones.forEach(zone => {
            zone.icons.forEach(iconConfig => {
                const iconPath = `assets/images/services16/${iconConfig.category}/48/${iconConfig.name}`;
                console.log('Loading icon:', iconConfig.name, 'from path:', iconPath);
                this.load.image(`icon_${iconConfig.name}`, iconPath);
            });
        });

        // Add error handling for failed loads
        this.load.on('loaderror', (fileObj) => {
            console.error('Error loading icon:', fileObj.key);
            // Create a colored rectangle as fallback
            const graphics = this.add.graphics();
            graphics.fillStyle(0x00ff00);
            graphics.fillRect(0, 0, 48, 48);
            graphics.generateTexture(fileObj.key, 48, 48);
            graphics.destroy();
        });

        // Start the loader and create icons upon completion
        this.load.once('complete', () => {
            mapConfig.zones.forEach(zone => {
                zone.icons.forEach(iconConfig => {
                    const iconKey = `icon_${iconConfig.name}`;
                    console.log('Creating icon:', iconKey);

                    // Create icon sprite
                    const iconSprite = this.add.image(iconConfig.x, iconConfig.y, iconKey)
                        .setInteractive()
                        .setScale(0.5);

                    // Add green box around icon
                    const box = this.add.rectangle(iconConfig.x, iconConfig.y, 48, 48, 0x00ff00, 0);
                    box.setStrokeStyle(2, 0x00ff00);
                    iconSprite.box = box;

                    this.setupIconInteraction(iconSprite, iconConfig);
                    this.icons.push(iconSprite);
                });
            });
        });

        this.load.start();
    }

    createIcons(mapConfig) {
        mapConfig.zones.forEach(zone => {
            zone.icons.forEach(icon => {
                const iconSprite = this.add.image(
                    icon.x,
                    icon.y,
                    'icon' // Use 'icon' as key in test environment
                )
                    .setInteractive()
                    .setScale(0.5);

                console.log('Creating icon sprite:', icon.name || icon.service);
                this.setupIconInteraction(iconSprite, icon);
                this.icons.push(iconSprite);
            });
        });
    }

    setupIconInteraction(iconSprite, iconConfig) {
        // Add visual feedback for interactivity
        iconSprite.setTint(0xffffff);
        iconSprite.isAnswered = false; // Track answered state

        // Hover effects
        iconSprite.on('pointerover', () => {
            if (iconSprite.isAnswered) return;
            iconSprite.setScale(1.3);
            iconSprite.setTint(0x00ff00);
            // Show icon name on hover
            this.showTooltip(iconConfig.name || iconConfig.service, iconSprite.x, iconSprite.y);
        });

        iconSprite.on('pointerout', () => {
            if (iconSprite.isAnswered) return;
            iconSprite.setScale(1.3);
            iconSprite.setTint(0xffffff);
            this.hideTooltip();
        });

        // Add pulsing animation if tweens is available (not in test environment)
        if (this.tweens && this.tweens.add) {
            this.tweens.add({
                targets: iconSprite,
                scale: { from: 1.0, to: 1.4 },
                duration: 1000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // Click handler - filter questions by type
        iconSprite.on('pointerdown', () => this.handleIconClick(iconSprite, iconConfig));
    }

    handleIconClick(iconSprite, iconConfig) {
        if (iconSprite.isAnswered || this.clickCooldown) return;

        this.clickCooldown = true;
        iconSprite.setTint(0xff0000);

        let randomQuestion;
        let relevantQuestions = this.questions && iconConfig && iconConfig.questionTypes ?
            this.questions.filter(q =>
                iconConfig.questionTypes.some(type =>
                    q.question.toLowerCase().includes(type.toLowerCase())
                )
            ) : this.questions;

        if (!relevantQuestions || relevantQuestions.length === 0) {
            relevantQuestions = this.questions;
        }

        if (relevantQuestions) {
            randomQuestion = Phaser.Utils.Array.GetRandom(relevantQuestions);
            this.showQuestion(randomQuestion, iconSprite);
        }

        // Reset cooldown after 500ms
        setTimeout(() => {
            this.clickCooldown = false;
            if (!iconSprite.isAnswered) {
                iconSprite.setTint(0xffffff);
            }
        }, 500);
    }

    showTooltip(text, x, y) {
        this.tooltip = this.add.text(x, y - 60, text, {
            fontSize: '16px',
            fill: '#fff',
            backgroundColor: '#000',
            padding: { x: 5, y: 3 }
        }).setOrigin(1.0).setDepth(150);
    }

    hideTooltip() {
        if (this.tooltip) {
            this.tooltip.destroy();
        }
    }

    showQuestion(question, icon) {
        if (!question || !question.options) {
            console.error('Invalid question format:', question);
            return;
        }

        // Create semi-transparent black background
        const bg = this.add.rectangle(400, 300, 750, 400, 0x000000, 0.85);
        bg.setDepth(2);

        // Add question text with proper wrapping
        const questionText = this.add.text(400, 150, question.question, {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#ffffff',
            align: 'center',
            wordWrap: { width: 700, useAdvancedWrap: true }
        });
        questionText.setOrigin(0.5);
        questionText.setDepth(3);

        // Create option buttons
        const options = Object.entries(question.options);
        const optionStartY = 220;
        const optionSpacing = 50;

        const optionButtons = options.map(([key, value], index) => {
            const y = optionStartY + index * optionSpacing;

            // Create button background
            const buttonBg = this.add.rectangle(400, y, 600, 40, 0x333333, 0.5);
            buttonBg.setDepth(2.5);
            buttonBg.setVisible(false);

            // Create button text
            const button = this.add.text(400, y, `${key}: ${value}`, {
                fontFamily: 'Arial',
                fontSize: '18px',
                color: '#ffffff',
                align: 'center'
            });
            button.setOrigin(0.5);
            button.setInteractive();
            button.setDepth(3);

            // Hover effects
            button.on('pointerover', () => {
                button.setColor('#ffff00');
                buttonBg.setVisible(true);
            });

            button.on('pointerout', () => {
                button.setColor('#ffffff');
                buttonBg.setVisible(false);
            });

            // Click handler
            button.on('pointerdown', () => {
                const isCorrect = key.toLowerCase() === question.answer.toLowerCase();

                if (isCorrect) {
                    this.score += 100;
                    this.scoreText.setText(`Score: ${this.score}`);
                }

                // Show explanation
                const explanation = this.add.text(400, optionStartY + options.length * optionSpacing + 20,
                    question.explanation, {
                    fontFamily: 'Arial',
                    fontSize: '16px',
                    color: isCorrect ? '#00ff00' : '#ff0000',
                    align: 'center',
                    wordWrap: { width: 600 }
                });
                explanation.setOrigin(0.5);
                explanation.setDepth(3);

                // Show feedback mark
                const markImage = this.add.image(icon.x, icon.y, isCorrect ? 'checkMark' : 'xMark');
                markImage.setDepth(2);
                icon.isAnswered = true;

                // Update box color
                if (icon.box) {
                    icon.box.setStrokeStyle(3, isCorrect ? 0x00ff00 : 0xff0000);
                }

                // Disable all buttons
                optionButtons.forEach(btn => {
                    btn.disableInteractive();
                    btn.buttonBg.setVisible(false);
                });

                // Remove question after delay
                setTimeout(() => {
<<<<<<< Updated upstream
                    document.body.removeChild(explanationContainer);
                }, 5000);
            }

            // Mark the icon as answered in the grid system
            this.scene.get('gridScene').markIconAsAnswered(iconConfig.name);
        } else {
            const xMark = this.add.image(iconSprite.x, iconSprite.y, 'xMark')
                .setScale(0.5)
                .setDepth(100);
        }
=======
                    [bg, questionText, ...optionButtons.map(b => [b, b.buttonBg]).flat(), explanation, markImage]
                        .forEach(obj => obj.destroy());
                }, 3000);
>>>>>>> Stashed changes

                // Check if all questions are answered
                this.answeredQuestions++;
                if (this.answeredQuestions >= this.icons.length) {
                    setTimeout(() => {
                        if (window.sceneManager) {
                            window.sceneManager.updateProgress();
                            window.sceneManager.startNextScene();
                        } else {
                            this.scene.start('space_invaders', {
                                nextScene: 'map1gamescene2',
                                score: this.score
                            });
                        }
                    }, 3500);
                }
            });

            button.buttonBg = buttonBg;
            return button;
        });
    }
<<<<<<< Updated upstream
}
=======

    setupScore() {
        this.scoreText = this.add.text(16, 16, 'Score: ' + this.score, {
            fontSize: '32px',
            fill: '#fff'
        });
    }

    transitionToNextScene() {
        if (this.isTransitioning) return;
        this.isTransitioning = true;

        // Save progress before transition
        this.progressManager.saveProgress({
            lastCompletedScene: 'map1gamescene1',
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
>>>>>>> Stashed changes
