import { getAssetPath } from "/src/utils/assetLoader";
import Player from '/src/gameobjects/player';
import Generator from '/src/gameobjects/generator';
import * as Phaser from 'phaser';
import SceneOrderManager from '/src/utils/SceneOrderManager';

export default class Map3GameScene3 extends Phaser.Scene {
    constructor() {
        super({ key: 'map3_game3' });
        this.player = null;
        this.score = 0;
        this.scoreText = null;
        this.currentMap = 1;
        this.questions = null;
        this.icons = [];
        this.answeredQuestions = 0;
    }

    preload() {
        this.load.image('map3scene3', getAssetPath('images/map3scene3.png'));
        this.load.json('map-config3', getAssetPath('data/map3/map-config3.json'));
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
        // Initialize sound settings
        if (this.sound && this.sound.context) {
            this.sound.pauseOnBlur = false;
        }

        // Get the loaded questions and map config with error handling
        try {
            this.questions = this.cache.json.get('questions');
            const mapConfig = this.cache.json.get('map-config3');

            console.log('MapConfig loaded:', mapConfig); // Debug log

            if (!mapConfig || !mapConfig.zones) {
                throw new Error('Invalid map config structure');
            }

            // Set up the map based on config
            const zoneIndex = 1; // Use second zone for scene 2
            const activeZone = mapConfig.zones[zoneIndex] || mapConfig.zones[0];

            if (!activeZone) {
                throw new Error('No valid zone found in config');
            }

            // Set up the map with default values if needed
            const map = this.add.image(
                activeZone.x || 400,
                activeZone.y || 300,
                'map3scene3'
            );
            map.setOrigin(0.5);
            map.setScale(activeZone.scale || 1);

            // Load AWS icons after we have the config
            this.loadAwsIcons(mapConfig);
            this.setupScore();

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
                this.scene.start('map3_game3');
            }, 2000);
        }
    }

    loadAwsIcons(mapConfig) {
        // Preload all icons
        mapConfig.zones.forEach(zone => {
            zone.icons.forEach(icon => {
                // Get the icon path from the question that matches this icon's type
                const relevantQuestion = this.questions.find(q =>
                    icon.questionTypes.some(type =>
                        q.question.toLowerCase().includes(type.toLowerCase())
                    )
                );

                if (relevantQuestion && relevantQuestion.image) {
                    // Use the image path directly from the question
                    console.log('Loading icon from question:', relevantQuestion.image);
                    this.load.image(`icon_${icon.name}`, relevantQuestion.image);
                } else {
                    // Fallback to constructing the path based on the pattern
                    // Example: public/assets/images/services16/Arch_Storage/16/Arch_Amazon-Simple-Storage-Service_16.png
                    const iconPath = `assets/images/services16/${icon.category}/48/${icon.name}`;
                    console.log('Loading icon with constructed path:', iconPath);
                    this.load.image(`icon_${icon.name}`, iconPath);
                }
                const iconPath = `/assets/images/services16/${icon.category}/48/${icon.name}`;
                this.load.image(`icon_${icon.name}`, iconPath);
            });
        });

        // Start the loader and create icons upon completion
        this.load.once('complete', () => {
            mapConfig.zones.forEach(zone => {
                zone.icons.forEach(icon => {
                    const iconSprite = this.add.image(
                        icon.x,
                        icon.y,
                        `icon_${icon.name}`
                    )
                        .setInteractive()
                        .setScale(0.5);

                    console.log('Creating icon sprite:', icon.name);
                    this.setupIconInteraction(iconSprite, icon);
                    this.icons.push(iconSprite);
                });
            });
        });

        this.load.start();
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
            this.showTooltip(iconConfig.name, iconSprite.x, iconSprite.y);
        });

        iconSprite.on('pointerout', () => {
            if (iconSprite.isAnswered) return;
            iconSprite.setScale(1.3);
            iconSprite.setTint(0xffffff);
            this.hideTooltip();
        });

        // Add pulsing animation
        this.tweens.add({
            targets: iconSprite,
            scale: { from: 1.0, to: 1.4 },
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Click handler - filter questions by type
        iconSprite.on('pointerdown', () => {
            if (iconSprite.isAnswered) return; // Skip if already answered

            let randomQuestion;
            let relevantQuestions = this.questions.filter(q =>
                iconConfig.questionTypes.some(type =>
                    q.question.toLowerCase().includes(type.toLowerCase())
                )
            );

            if (relevantQuestions.length === 0) {
                // If no specific questions found, pick a random one
                relevantQuestions = this.questions;
            }

            randomQuestion = Phaser.Utils.Array.GetRandom(relevantQuestions);
            this.showQuestion(randomQuestion, iconSprite);
        });
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

    showQuestion(question, iconSprite) {
        // Create DOM elements for question
        const questionContainer = document.createElement('div');
        questionContainer.className = 'question-container';

        const overlay = document.createElement('div');
        overlay.className = 'overlay';

        const questionElement = document.createElement('div');
        questionElement.className = 'question';
        questionElement.textContent = question.question;

        questionContainer.appendChild(questionElement);

        Object.entries(question.options).forEach(([key, value]) => {
            const option = document.createElement('div');
            option.className = 'option';

            const letter = document.createElement('span');
            letter.className = 'option-letter';
            letter.textContent = key;

            const text = document.createElement('span');
            text.className = 'option-text';
            text.textContent = value;

            option.appendChild(letter);
            option.appendChild(text);

            option.addEventListener('click', () => {
                const isCorrect = key === question.answer;
                if (isCorrect) {
                    this.score += 100;
                    this.scoreText.setText(`Score: ${this.score}`);
                }

                // Display feedback
                const feedbackMark = isCorrect ? 'checkMark' : 'xMark';
                const feedback = this.add.image(iconSprite.x, iconSprite.y, feedbackMark)
                    .setScale(1.0)
                    .setDepth(150);

                // Disable the icon and stop its animation
                iconSprite.isAnswered = true;
                iconSprite.setAlpha(0.5);
                this.tweens.killTweensOf(iconSprite);
                iconSprite.setScale(1.0);
                iconSprite.disableInteractive();
                this.answeredQuestions++;

                // Show explanation
                if (question.explanation) {
                    const explanation = document.createElement('div');
                    explanation.className = 'explanation';
                    explanation.textContent = question.explanation;
                    questionContainer.appendChild(explanation);
                }

                // Remove after delay
                setTimeout(() => {
                    document.body.removeChild(overlay);
                    document.body.removeChild(questionContainer);
                    feedback.destroy();

                    if (this.answeredQuestions === 5) {
                        console.log('All 5 questions answered, transitioning to Space Invaders...');
                        setTimeout(() => {
                            this.scene.start('space_invaders', { nextScene: 'map3_game4' });
                        }, 3000);
                    }
                }, 2000);
            });

            questionContainer.appendChild(option);
        });

        document.body.appendChild(overlay);
        document.body.appendChild(questionContainer);
    }

    setupScore() {
        this.scoreText = this.add.text(16, 16, 'Score: 0', {
            fontSize: '32px',
            fill: '#fff',
            backgroundColor: '#000',
            padding: { x: 10, y: 5 }
        }).setScrollFactor(0).setDepth(200);
    }
}
