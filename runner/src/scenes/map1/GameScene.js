import BaseGameScene from '../BaseGameScene';
import { getAssetPath } from '@/utils/assetLoader';
import Phaser from 'phaser';
import { SceneTransition, TRANSITION_STATE } from '@/utils/SceneTransition';
import { ProgressManager } from '@/utils/ProgressManager';

export default class map1scene1 extends BaseGameScene {
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
        this.isActive = false;
        this.isPaused = false;
    }

    init(data) {
        this.isActive = true;
        this.isPaused = false;
        this.fromScene = data?.fromScene;
        this.score = data?.score || 0;
        this.powerUpBitmask = data?.powerUpBitmask || 0;
        this.currentMap = data?.currentMap || 1;

        // Register cleanup handlers
        this.events.on('sceneCleanup', this.cleanup, this);
        this.events.on('scenePause', this.pause, this);
        this.events.on('sceneResume', this.resume, this);
        this.events.on('sceneEnd', this.end, this);

        // Set current scene in transition manager
        this.sceneTransition.setCurrentScene(this);
    }

    preload() {
        // Load game assets
        this.load.image('map1scene1', getAssetPath('images/map1scene1.png'));
        this.load.json('map-config', getAssetPath('data/map1/map-config.json'));
        this.load.json('questions', getAssetPath('data/questions.json'));
        this.load.image('checkMark', getAssetPath('images/checkmark.png'));
        this.load.image('xMark', getAssetPath('images/xmark.png'));

        // Load sound effects with error handling
        try {
            this.load.audio('click', getAssetPath('sounds/click.mp3'));
            this.load.audio('correct', getAssetPath('sounds/correct.mp3'));
            this.load.audio('wrong', getAssetPath('sounds/wrong.mp3'));

            // Add error handler for audio loading
            this.load.on('loaderror', (fileObj) => {
                console.warn('Error loading audio:', fileObj.key);
                // Create dummy sound to prevent errors
                this.cache.audio.add(fileObj.key, new Audio());
            });
        } catch (error) {
            console.warn('Error setting up audio:', error);
        }
    }

    create() {
        // Set up the map to fit 800x600
        const map = this.add.image(400, 300, 'map1scene1');
        map.setOrigin(0.5);

        // Set up UI elements
        this.setupUI();

        // Get the loaded questions and map config with error handling
        try {
            this.questions = this.cache.json.get('questions');
            const mapConfig = this.cache.json.get('map-config');

            if (!mapConfig || !mapConfig.zones) {
                throw new Error('Invalid map config structure');
            }

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

    setupUI() {
        // Create UI container at the top
        const uiContainer = this.add.container(0, 0);

        // Add semi-transparent background for UI
        const uiBg = this.add.rectangle(400, 30, 800, 60, 0x000000, 0.7);

        // Add score
        this.scoreText = this.add.text(20, 20, `Score: ${this.score}`, {
            fontSize: '24px',
            fontStyle: 'bold',
            fill: '#fff'
        });

        // Add power-ups display
        const powerUps = [];
        if (this.powerUpBitmask & 1) powerUps.push('❤️');  // Life
        if (this.powerUpBitmask & 2) powerUps.push('⚡');  // Speed
        if (this.powerUpBitmask & 4) powerUps.push('🛡️');  // Shield
        if (this.powerUpBitmask & 8) powerUps.push('🔥');  // Power

        const powerUpText = this.add.text(200, 20, powerUps.join(' '), {
            fontSize: '24px',
            fill: '#fff'
        });

        uiContainer.add([uiBg, this.scoreText, powerUpText]);
        uiContainer.setDepth(100);
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
                this.playSound('click');
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
        const SCREEN_WIDTH = 800;
        const SCREEN_HEIGHT = 600;
        const PADDING = 20;
        const QUESTION_WIDTH = SCREEN_WIDTH * 0.85; // 85% of screen width

        // Create container for all question elements
        const container = this.add.container(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
        container.setDepth(100);

        // Add question text first to measure its height
        const questionText = this.add.text(0, 0, question.question, {
            fontSize: '20px',
            fontStyle: 'bold',
            fill: '#fff',
            align: 'center',
            wordWrap: { width: QUESTION_WIDTH - (PADDING * 2) }
        }).setOrigin(0.5);

        const questionBounds = questionText.getBounds();

        // Create background for question
        const questionBg = this.add.rectangle(
            0,
            0,
            QUESTION_WIDTH,
            questionBounds.height + (PADDING * 2),
            0x333333,
            0.95
        ).setOrigin(0.5);

        // Position question text vertically
        questionText.setY(-SCREEN_HEIGHT / 4);
        questionBg.setY(questionText.y);

        // Create answer buttons
        const answers = Object.entries(question.options);
        const buttonWidth = QUESTION_WIDTH - (PADDING * 4);
        let nextButtonY = questionText.y + questionBounds.height + (PADDING * 3);

        const answerButtons = answers.map(([key, value]) => {
            const button = this.add.rectangle(0, nextButtonY, buttonWidth, 50, 0x666666)
                .setInteractive();

            const text = this.add.text(0, nextButtonY, `${key}: ${value}`, {
                fontSize: '18px',
                fontStyle: 'bold',
                fill: '#fff',
                align: 'center'
            }).setOrigin(0.5);

            // Update Y position for next button
            nextButtonY += 70;

            this.setupAnswerButton(button, text, key === question.answer, iconSprite, container);
            return { button, text };
        });

        // Add everything to container
        container.add([questionBg, questionText]);
        answerButtons.forEach(({ button, text }) => container.add([button, text]));
        //add a word wrap for answer buttons
        answerButtons.forEach(({ button, text }) => {
            text.setWordWrapWidth(buttonWidth - (PADDING * 2));
            text.setAlign('center');
        });

        // Add semi-transparent background behind everything
        const fullBg = this.add.rectangle(
            SCREEN_WIDTH / 2,
            SCREEN_HEIGHT / 2,
            SCREEN_WIDTH,
            SCREEN_HEIGHT,
            0x000000,
            0.7
        ).setDepth(99);

        // Store background reference in container for cleanup
        container.fullBg = fullBg;
    }

    setupAnswerButton(button, text, isCorrect, iconSprite, container) {
        let isAnswered = false;

        button.on('pointerover', () => {
            if (!isAnswered) {
                button.setFillStyle(0x888888);
                text.setColor('#ffff00');
                this.playSound('click');
            }
        });

        button.on('pointerout', () => {
            if (!isAnswered) {
                button.setFillStyle(0x666666);
                text.setColor('#ffffff');
            }
        });

        button.on('pointerdown', () => {
            if (isAnswered) return;
            isAnswered = true;

            // Highlight selected answer
            button.setFillStyle(isCorrect ? 0x00aa00 : 0xaa0000);
            text.setColor(isCorrect ? '#00ff00' : '#ff0000');

            this.handleAnswer(isCorrect, iconSprite, container);
        });
    }

    handleAnswer(isCorrect, iconSprite, container) {
        this.playSound(isCorrect ? 'correct' : 'wrong');

        if (isCorrect) {
            this.score += 100;
            this.scoreText.setText(`Score: ${this.score}`);
            iconSprite.setTint(0x00ff00);
            this.add.image(iconSprite.x, iconSprite.y, 'checkMark')
                .setScale(1.0)
                .setDepth(50);
        } else {
            iconSprite.setTint(0xff0000);
            this.add.image(iconSprite.x, iconSprite.y, 'xMark')
                .setScale(1.0)
                .setDepth(50);
        }

        iconSprite.isAnswered = true;
        iconSprite.disableInteractive();

        // Remove question after delay
        this.time.delayedCall(3000, () => {
            container.fullBg.destroy();
            container.destroy();
            this.answeredQuestions++;
            if (this.answeredQuestions === 5) {
                this.transitionToNextScene();
            }
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

    playSound(key) {
        try {
            if (this.sound && this.cache.audio.exists(key)) {
                this.sound.play(key, { volume: 0.5 });
            }
        } catch (error) {
            console.warn('Error playing sound:', key, error);
        }
    }

    cleanup() {
        if (this.currentQuestion) {
            this.currentQuestion.background.destroy();
            this.currentQuestion.container.destroy();
            this.currentQuestion = null;
        }
    }

    pause() {
        this.isPaused = true;
        // Additional pause logic if needed
    }

    resume() {
        this.isPaused = false;
        // Additional resume logic if needed
    }

    end() {
        this.isActive = false;
        this.cleanup();
        // Additional end logic if needed
    }
}
