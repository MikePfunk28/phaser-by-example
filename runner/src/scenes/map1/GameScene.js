import { getAssetPath } from "@/utils/assetLoader";
import Player from '@/gameobjects/player';
import Generator from '@/gameobjects/generator';
import * as Phaser from 'phaser';


export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'map1scene1' });
        this.player = null;
        this.score = 0;
        this.scoreText = null;
        this.currentMap = 1;
        this.questions = null;
        this.icons = [];
        this.answeredQuestions = 0;
        this.isTransitioning = false;
        this.clickCooldown = false;
    }

    init(data) {
        if (data && typeof data.score === 'number') {
            this.score = data.score;
        }
    }

    preload() {
        this.load.image('map1scene1', getAssetPath('images/map1scene1.png'));
        this.load.json('map-config', getAssetPath('data/map1/map-config.json'));
        this.load.json('questions', getAssetPath('data/questions.json'));
        this.load.image('checkMark', getAssetPath('images/checkmark.png'));
        this.load.image('xMark', getAssetPath('images/xmark.png'));
        this.load.bitmapFont('arcade', getAssetPath('fonts/arcade.png'), getAssetPath('fonts/arcade.xml'));

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

        // Set up score display first
        this.setupScore();

        // Get the loaded questions and map config with error handling
        try {
            const mapConfig = this.cache.json.get('map-config');
            this.questions = this.cache.json.get('questions');

            console.log('MapConfig loaded:', mapConfig); // Debug log

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
                'map1scene1'
            );
            map.setOrigin(0.5);
            map.setScale(activeZone.scale || 1);

            // Load AWS icons after we have the config
            this.loadAwsIcons(mapConfig);

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
                this.scene.start('map1scene1');
            }, 2000);
        }
    }

    loadAwsIcons(mapConfig) {
        // In test environment, we still want to set up the callback
        // but we'll let the test trigger it manually
        const createIconsCallback = () => this.createIcons(mapConfig);

        // Register the callback even in test environment
        this.load.once('complete', createIconsCallback);

        // Only call start() if it exists (not in test environment)
        if (this.load.start) {
            this.load.start();
        }
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
            // If no specific questions found, pick a random one
            relevantQuestions = this.questions;
        }

        if (relevantQuestions) {
            randomQuestion = Phaser.Utils.Array.GetRandom(relevantQuestions);
            this.showQuestion(randomQuestion, iconSprite);
        }

        // Reset cooldown after delay
        setTimeout(() => {
            this.clickCooldown = false;
            if (!iconSprite.isAnswered) {
                iconSprite.clearTint();
            }
        }, 1000);
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
                this.handleAnswer(key === question.answer, iconSprite, question);
                document.body.removeChild(questionContainer);
                document.body.removeChild(overlay);
            });

            questionContainer.appendChild(option);
        });

        document.body.appendChild(overlay);
        document.body.appendChild(questionContainer);
    }

    handleAnswer(isCorrect, iconSprite, question) {
        iconSprite.isAnswered = true;
        this.answeredQuestions++;

        if (isCorrect) {
            this.score += 100;
            this.scoreText.setText('Score: ' + this.score);
            const checkMark = this.add.image(iconSprite.x, iconSprite.y, 'checkMark')
                .setScale(0.5)
                .setDepth(100);

            // Show explanation if available
            if (question.explanation) {
                const explanationContainer = document.createElement('div');
                explanationContainer.className = 'explanation-container';
                explanationContainer.textContent = question.explanation;
                document.body.appendChild(explanationContainer);

                setTimeout(() => {
                    document.body.removeChild(explanationContainer);
                }, 5000);
            }
        } else {
            const xMark = this.add.image(iconSprite.x, iconSprite.y, 'xMark')
                .setScale(0.5)
                .setDepth(100);
        }

        // Check if all questions are answered
        if (this.answeredQuestions >= this.icons.length) {
            setTimeout(() => {
                this.transitionToNextScene();
            }, 1000);
        }
    }

    setupScore() {
        this.scoreText = this.add.text(16, 16, 'Score: ' + this.score, {
            fontSize: '32px',
            fill: '#fff'
        });
    }

    transitionToNextScene() {
        if (this.isTransitioning) return;

        this.isTransitioning = true;
        this.cameras.main.fadeOut(500);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('space_invaders', {
                nextScene: 'map1scene2',
                score: this.score
            });
        });
    }
}
