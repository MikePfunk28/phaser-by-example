import { getAssetPath } from '@/utils/assetLoader';
import Phaser from 'phaser';
import { SceneTransition } from '@/utils/SceneTransition';
import { ProgressManager } from '@/utils/ProgressManager';

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
        this.powerUpBitmask = 0;
        this.progressManager = new ProgressManager();
        this.sceneTransition = new SceneTransition();
    }

    preload() {
        // Load game assets
        this.load.image('map1scene1', getAssetPath('images/map1scene1.png'));
        this.load.json('map-config', getAssetPath('data/map1/map-config.json'));
        this.load.json('questions', getAssetPath('data/questions.json'));
        this.load.image('checkMark', getAssetPath('images/checkmark.png'));
        this.load.image('xMark', getAssetPath('images/xmark.png'));

        // Load sound effects
        this.load.audio('click', getAssetPath('sounds/click.wav'));
        this.load.audio('correct', getAssetPath('sounds/correct.wav'));
        this.load.audio('wrong', getAssetPath('sounds/wrong.wav'));
    }

    create() {
        // Add semi-transparent dark background
        const bg = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.8);
        bg.setOrigin(0.5);

        // Initialize sound settings
        if (this.sound && this.sound.context) {
            this.sound.pauseOnBlur = false;
        }

        // Set up score display first
        this.setupScore();

        // Get the loaded questions and map config with error handling
        try {
            this.questions = this.cache.json.get('questions');
            const mapConfig = this.cache.json.get('map-config');

            if (!mapConfig || !mapConfig.zones) {
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
            map.setScale(1.0); // Full size for 800x600

            // Load AWS icons after we have the config
            this.loadAwsIcons(mapConfig);

            // Add fade-in transition
            this.cameras.main.fadeIn(500);

        } catch (error) {
            console.error('Error in create:', error);
            this.add.text(400, 300, error.message, {
                fontSize: '24px',
                fill: '#fff',
                backgroundColor: '#ff0000',
                padding: { x: 10, y: 5 }
            }).setOrigin(0.5);
        }
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

        // Start the loader and create icons upon completion
        this.load.once('complete', () => {
            mapConfig.zones.forEach(zone => {
                zone.icons.forEach(iconConfig => {
                    const iconKey = `icon_${iconConfig.name}`;
                    console.log('Creating icon:', iconKey);

                    // Create icon sprite at 1.3x size
                    const iconSprite = this.add.image(iconConfig.x, iconConfig.y, iconKey)
                        .setInteractive()
                        .setScale(1.3);

                    // Add green box around icon
                    const box = this.add.rectangle(iconConfig.x, iconConfig.y, 62, 62, 0x00ff00, 0);
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
        iconSprite.setTint(0xffffff);
        iconSprite.isAnswered = false;

        // Hover effects
        iconSprite.on('pointerover', () => {
            if (!iconSprite.isAnswered) {
                iconSprite.setTint(0x00ff00);
                this.sound.play('click', { volume: 0.5 });
            }
        });

        iconSprite.on('pointerout', () => {
            if (!iconSprite.isAnswered) {
                iconSprite.setTint(0xffffff);
            }
        });

        // Click handler
        iconSprite.on('pointerdown', () => {
            if (!iconSprite.isAnswered && !this.clickCooldown) {
                this.handleIconClick(iconSprite, iconConfig);
            }
        });
    }

    handleIconClick(iconSprite, iconConfig) {
        this.clickCooldown = true;
        this.sound.play('click');

        // Find relevant questions for this icon
        const relevantQuestions = this.questions.filter(q =>
            iconConfig.questionTypes.some(type =>
                q.question.toLowerCase().includes(type.toLowerCase())
            )
        );

        if (relevantQuestions.length > 0) {
            const randomQuestion = Phaser.Utils.Array.GetRandom(relevantQuestions);
            this.showQuestion(randomQuestion, iconSprite);
        }

        // Reset cooldown after 500ms
        setTimeout(() => {
            this.clickCooldown = false;
        }, 500);
    }

    showQuestion(question, iconSprite) {
        // Create semi-transparent overlay
        const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.8);
        overlay.setDepth(100);

        // Create question text
        const questionText = this.add.text(400, 150, question.question, {
            fontSize: '24px',
            fill: '#fff',
            align: 'center',
            wordWrap: { width: 700 }
        }).setOrigin(0.5).setDepth(101);

        // Create answer buttons
        const answers = Object.entries(question.options);
        const startY = 250;
        const spacing = 70;

        const answerButtons = answers.map(([key, value], index) => {
            const y = startY + (index * spacing);

            const button = this.add.rectangle(400, y, 600, 50, 0x333333)
                .setInteractive()
                .setDepth(101);

            const text = this.add.text(400, y, `${key}: ${value}`, {
                fontSize: '20px',
                fill: '#fff'
            }).setOrigin(0.5).setDepth(102);

            button.on('pointerover', () => {
                button.setFillStyle(0x666666);
                this.sound.play('click', { volume: 0.3 });
            });

            button.on('pointerout', () => {
                button.setFillStyle(0x333333);
            });

            button.on('pointerdown', () => {
                const isCorrect = key === question.answer;

                // Play sound effect
                this.sound.play(isCorrect ? 'correct' : 'wrong');

                // Update score
                if (isCorrect) {
                    this.score += 100;
                    this.scoreText.setText(`Score: ${this.score}`);
                }

                // Show feedback
                const feedbackMark = this.add.image(iconSprite.x, iconSprite.y,
                    isCorrect ? 'checkMark' : 'xMark')
                    .setScale(1.0)
                    .setDepth(50);

                // Grey out the icon
                iconSprite.setAlpha(0.5);
                iconSprite.isAnswered = true;
                this.tweens.killTweensOf(iconSprite);

                // Show explanation
                const explanation = this.add.text(400, 500, question.explanation, {
                    fontSize: '20px',
                    fill: isCorrect ? '#00ff00' : '#ff0000',
                    align: 'center',
                    wordWrap: { width: 700 }
                }).setOrigin(0.5).setDepth(101);

                // Remove question interface after delay
                setTimeout(() => {
                    overlay.destroy();
                    questionText.destroy();
                    answerButtons.forEach(({ button, text }) => {
                        button.destroy();
                        text.destroy();
                    });
                    explanation.destroy();

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
        this.scoreText = this.add.text(16, 16, 'Score: 0', {
            fontSize: '32px',
            fill: '#fff',
            backgroundColor: '#000',
            padding: { x: 10, y: 5 }
        });
    }

    transitionToNextScene() {
        if (this.isTransitioning) return;
        this.isTransitioning = true;

        // Save progress before transition
        this.progressManager.saveProgress({
            lastCompletedScene: 'map1scene1',
            currentMap: this.currentMap,
            powerUpBitmask: this.powerUpBitmask,
            score: this.score
        });

        // Transition to space invaders
        this.sceneTransition.to(this, 'space_invaders', {
            nextScene: 'map1scene2',
            score: this.score,
            powerUpBitmask: this.powerUpBitmask,
            currentMap: this.currentMap
        });
    }
}
