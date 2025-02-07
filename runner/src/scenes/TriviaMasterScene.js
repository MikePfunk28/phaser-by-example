import { getAssetPath } from "@/utils/assetLoader";
import BaseGameScene from './BaseGameScene';
import { SceneTransition } from '@/utils/SceneTransition';
import { ProgressManager } from '@/utils/ProgressManager';
import { PowerUpManager } from '@/utils/PowerUpManager';

export default class TriviaMasterScene extends BaseGameScene {
    constructor() {
        super({ key: 'trivia_master' });
        console.log('TriviaMasterScene: Constructor called during scene registration (this is normal)');

        // Only initialize basic properties in constructor
        this.score = 0;
        this.currentMap = 1;
        this.questions = null;
        this.icons = [];
        this.answeredQuestions = 0;
        this.correctAnswers = 0;
        this.isTransitioning = false;
        this.powerUpBitmask = 0;

        // Scene-specific configuration
        this.mapNumber = 1;
        this.sceneNumber = 1;
        this.requiredCorrectAnswers = 5;
    }

    init(data) {
        console.log('TriviaMasterScene: Actually starting scene initialization now', data);

        // Initialize managers here instead of constructor
        this.progressManager = new ProgressManager();
        this.sceneTransition = new SceneTransition();
        this.powerUpManager = new PowerUpManager();

        // Get scene configuration from data
        this.mapNumber = data.mapNumber || 1;
        this.sceneNumber = data.sceneNumber || 1;
        this.sceneKey = `map${this.mapNumber}scene${this.sceneNumber}`;

        // Initialize game state
        this.score = data.score || 0;
        this.powerUpBitmask = data.powerUpBitmask || 0;
        this.currentMap = data.currentMap || this.mapNumber;
        this.answeredQuestions = 0;
        this.correctAnswers = 0;

        // Reset scene-specific tracking
        this.powerUpManager.resetSceneProgress();

        // Save progress
        this.progressManager.saveProgress({
            lastCompletedScene: this.sceneKey,
            currentMap: this.currentMap,
            powerUpBitmask: this.powerUpBitmask,
            score: this.score
        });

        // Handle window focus/blur
        window.removeEventListener('blur', this.onWindowBlur);
        window.removeEventListener('focus', this.onWindowFocus);
        window.addEventListener('blur', this.onWindowBlur.bind(this));
        window.addEventListener('focus', this.onWindowFocus.bind(this));

        console.log('TriviaMasterScene: Scene configuration:', {
            mapNumber: this.mapNumber,
            sceneNumber: this.sceneNumber,
            sceneKey: this.sceneKey
        });
    }

    onWindowBlur() {
        // Don't pause if we're in a question dialog
        if (this.currentQuestion) return;
        this.scene.pause();
    }

    onWindowFocus() {
        if (this.scene.isPaused()) {
            this.scene.resume();
        }
    }

    preload() {
        console.log('TriviaMasterScene: Preload started with map:', this.mapNumber, 'scene:', this.sceneNumber);

        // Create fallback feedback icons first
        const graphics = this.add.graphics();

        // Create checkmark
        graphics.clear();
        graphics.lineStyle(4, 0x00ff00);
        graphics.beginPath();
        graphics.moveTo(10, 25);
        graphics.lineTo(20, 35);
        graphics.lineTo(38, 15);
        graphics.strokePath();
        graphics.generateTexture('checkMark', 48, 48);

        // Create X mark
        graphics.clear();
        graphics.lineStyle(4, 0xff0000);
        graphics.beginPath();
        graphics.moveTo(15, 15);
        graphics.lineTo(33, 33);
        graphics.moveTo(33, 15);
        graphics.lineTo(15, 33);
        graphics.strokePath();
        graphics.generateTexture('xMark', 48, 48);

        graphics.destroy();

        // Load scene-specific assets
        const mapImagePath = `images/map${this.mapNumber}scene${this.sceneNumber}.png`;
        const mapConfigPath = `data/map${this.mapNumber}/map-config${this.sceneNumber}.json`;
        const questionsPath = 'data/questions.json';

        console.log('Loading assets from paths:', {
            mapImage: mapImagePath,
            mapConfig: mapConfigPath,
            questions: questionsPath
        });

        // Load the map config and questions
        this.load.image('mapImage', getAssetPath(mapImagePath));
        this.load.json('map-config', getAssetPath(mapConfigPath));
        this.load.json('questions', getAssetPath(questionsPath));

        // Load AWS icons after map config is loaded
        this.load.on('filecomplete-json-map-config', (key, type, data) => {
            console.log('Map config loaded:', data);

            if (data.mapImage) {
                console.log('Loading background from config:', data.mapImage);
                this.load.image('background', getAssetPath(data.mapImage));
            }

            // Load AWS icons from map config
            if (data.zones) {
                data.zones.forEach(zone => {
                    zone.icons.forEach(icon => {
                        const iconPath = `images/services16/${icon.category}/48/${icon.name}`;
                        console.log('Loading AWS icon:', iconPath);
                        this.load.image(`icon_${icon.name}`, getAssetPath(iconPath));
                    });
                });
                // Start loading the queued assets
                this.load.start();
            }
        });

        // Add error handler for asset loading
        this.load.on('loaderror', this.handleAssetLoadError.bind(this));
    }

    handleAssetLoadError(fileObj) {
        console.warn('Creating fallback for:', fileObj.key);

        if (fileObj.type === 'image') {
            // Create a colored rectangle as fallback
            const graphics = this.add.graphics();
            graphics.fillStyle(0x666666);
            graphics.fillRect(0, 0, 64, 64);
            graphics.lineStyle(2, 0xffffff);
            graphics.strokeRect(0, 0, 64, 64);

            // Add text to indicate missing asset
            const text = this.add.text(32, 32, fileObj.key, {
                font: '10px Arial',
                fill: '#ffffff',
                align: 'center'
            }).setOrigin(0.5);

            graphics.generateTexture(fileObj.key, 64, 64);
            graphics.destroy();
            text.destroy();

            console.log('Created fallback image for:', fileObj.key);
        } else if (fileObj.type === 'json') {
            // Create fallback data
            const fallbackData = {
                zones: [{
                    x: 400,
                    y: 300,
                    icons: []
                }]
            };
            this.cache.json.add(fileObj.key, fallbackData);
            console.log('Created fallback JSON for:', fileObj.key);
        } else if (fileObj.type === 'audio') {
            // Create a silent audio buffer
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const buffer = audioContext.createBuffer(2, 44100, 44100);
            const source = audioContext.createBufferSource();
            source.buffer = buffer;

            // Add to Phaser's audio cache
            this.cache.audio.add(fileObj.key, buffer);
            console.log('Created silent audio fallback for:', fileObj.key);
        }
    }

    create() {
        console.log('TriviaMasterScene: Create started');
        try {
            // Add semi-transparent black background first
            this.add.rectangle(400, 300, 800, 600, 0x000000, 0.8);

            // Add the map background image
            const background = this.add.image(400, 300, 'mapImage');
            background.setOrigin(0.5);

            // Get the questions and map config
            this.questions = this.cache.json.get('questions');
            const mapConfig = this.cache.json.get('map-config');

            if (!mapConfig || !mapConfig.zones) {
                throw new Error('Invalid map config structure');
            }

            // Set up UI elements
            this.setupUI();

            // Load AWS icons
            this.loadAwsIcons(mapConfig);

        } catch (error) {
            console.error('Error in create:', error);
            this.handleSceneError(error);
        }
    }

    setupUI() {
        // Create a container for UI elements
        this.uiContainer = this.add.container(0, 0).setDepth(200);

        // Create a semi-transparent black background for UI
        const uiBackground = this.add.rectangle(0, 0, 800, 50, 0x000000, 0.7);
        this.uiContainer.add(uiBackground);

        // Score display - more compact
        this.scoreText = this.add.text(10, 5, `Score: ${this.score}`, {
            fontSize: '18px',
            fill: '#fff',
            padding: { x: 5, y: 2 }
        }).setScrollFactor(0);
        this.uiContainer.add(this.scoreText);

        // Map progress display - more compact
        const progressText = this.add.text(400, 5, `Map ${this.mapNumber} - Scene ${this.sceneNumber}`, {
            fontSize: '16px',
            fill: '#fff',
            padding: { x: 5, y: 2 }
        }).setOrigin(0.5, 0);
        this.uiContainer.add(progressText);

        // Power-up display - more compact and on same line
        const powerUps = this.powerUpManager.getPowerUpText().split(' ');
        let powerUpX = 600;
        powerUps.forEach((powerUp, index) => {
            const powerUpText = this.add.text(powerUpX, 5, powerUp, {
                fontSize: '16px',
                fill: '#00ff00',
                padding: { x: 3, y: 2 }
            });
            powerUpX += powerUpText.width + 10;
            this.uiContainer.add(powerUpText);
        });

        // Set up Registry listeners
        this.registry.events.on('changedata', this.updateData, this);
    }

    updateData(parent, key, data) {
        switch (key) {
            case 'score':
                this.score = data;
                this.scoreText.setText(`Score: ${this.score}`);
                break;
            case 'powerUpBitmask':
                this.powerUpBitmask = data;
                this.powerUpText.setText(this.powerUpManager.getPowerUpText());
                break;
            case 'currentMap':
                this.currentMap = data;
                break;
        }
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

                // Add visual feedback
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
            if (!iconSprite.isAnswered) {
                iconSprite.box.setStrokeStyle(2, 0xffff00);
                iconSprite.setScale(0.6);
                this.showTooltip(iconConfig.name, iconSprite.x, iconSprite.y);
            }
        });

        iconSprite.on('pointerout', () => {
            if (!iconSprite.isAnswered) {
                iconSprite.box.setStrokeStyle(2, 0x00ff00);
                iconSprite.setScale(0.5);
                this.hideTooltip();
            }
        });

        iconSprite.on('pointerdown', () => {
            if (!iconSprite.isAnswered && !this.isTransitioning) {
                this.handleIconClick(iconSprite, iconConfig);
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
        const container = this.add.container(400, 300);
        container.setDepth(100);

        // Add semi-transparent background
        const overlay = this.add.rectangle(0, 0, 800, 600, 0x000000, 0.8);
        container.add(overlay);

        // Add question text - more compact
        const questionText = this.add.text(0, -150, question.question, {
            fontSize: '20px',
            fill: '#fff',
            wordWrap: { width: 600 },
            align: 'center',
            lineSpacing: 5
        }).setOrigin(0.5);
        container.add(questionText);

        // Handle different question formats
        let answers = [];
        let correctAnswer = '';

        if (question.options && question.answer) {
            answers = Object.entries(question.options).map(([key, value]) => ({
                letter: key,
                text: value,
                isCorrect: key === question.answer
            }));
            correctAnswer = question.answer;
        } else if (question.incorrect_answers && question.correct_answer) {
            answers = [...question.incorrect_answers, question.correct_answer].map(text => ({
                text: text,
                isCorrect: text === question.correct_answer
            }));
            correctAnswer = question.correct_answer;
        }

        if (!question.options) {
            this.shuffleArray(answers);
        }

        this.currentQuestion = { container, overlay, answers, correctAnswer };

        // Position answers with more compact spacing
        answers.forEach((answer, index) => {
            const y = index * 70 - 50;

            const button = this.add.rectangle(0, y, 550, 50, 0x333333)
                .setInteractive({ useHandCursor: true });

            const answerText = answer.letter ?
                `${answer.letter}. ${answer.text}` :
                answer.text;

            const text = this.add.text(0, y, answerText, {
                fontSize: '16px',
                fill: '#fff',
                wordWrap: { width: 500 },
                align: 'center'
            }).setOrigin(0.5);

            button.on('pointerover', () => {
                button.setFillStyle(0x666666);
                text.setFill('#00ff00');
            });

            button.on('pointerout', () => {
                button.setFillStyle(0x333333);
                text.setFill('#fff');
            });

            button.on('pointerdown', () => {
                const isCorrect = answer.isCorrect;
                this.handleAnswer(isCorrect, iconSprite, container, question);
                // Update Registry
                this.registry.set('score', this.score);
            });

            container.add([button, text]);
        });
    }

    handleAnswer(isCorrect, iconSprite, container, question) {
        this.currentQuestion = null;
        this.answeredQuestions++;

        if (isCorrect) {
            this.correctAnswers++;
            this.score += 100;
            this.registry.set('score', this.score);
            this.sound.play('correct');
        } else {
            this.sound.play('wrong');
        }

        iconSprite.isAnswered = true;
        iconSprite.setTint(isCorrect ? 0x00ff00 : 0xff0000);
        iconSprite.disableInteractive();

        if (question.explanation) {
            const explanation = this.add.text(0, 150, question.explanation, {
                fontSize: '16px',
                fill: isCorrect ? '#00ff00' : '#ff6666',
                wordWrap: { width: 500 },
                align: 'center',
                backgroundColor: '#000000',
                padding: { x: 6, y: 4 }
            }).setOrigin(0.5);
            container.add(explanation);
        }

        this.time.delayedCall(2500, () => {
            container.destroy();

            if (this.answeredQuestions >= 5) {
                if (this.correctAnswers >= this.requiredCorrectAnswers) {
                    const upgrade = this.powerUpManager.handleCorrectAnswer();
                    if (upgrade) {
                        this.showUpgradeNotification(upgrade);
                        this.registry.set('powerUpBitmask', this.powerUpBitmask);
                    }
                }
                this.time.delayedCall(1000, () => {
                    this.transitionToNextScene();
                });
            }
        });
    }

    showUpgradeNotification(upgradeType) {
        const notification = this.add.text(400, 300, `New Power-Up Unlocked!\n${upgradeType}`, {
            fontSize: '32px',
            fill: '#00ff00',
            align: 'center',
            backgroundColor: '#000',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setDepth(1000);

        this.tweens.add({
            targets: notification,
            alpha: { from: 1, to: 0 },
            duration: 2000,
            ease: 'Power2',
            onComplete: () => notification.destroy()
        });
    }

    transitionToNextScene() {
        if (this.isTransitioning) return;
        this.isTransitioning = true;

        // Save progress
        this.progressManager.saveProgress({
            lastCompletedScene: this.sceneKey,
            currentMap: this.currentMap,
            powerUpBitmask: this.powerUpBitmask,
            score: this.score
        });

        // Transition to space invaders
        this.sceneTransition.to(this, 'space_invaders', {
            score: this.score,
            powerUpBitmask: this.powerUpBitmask,
            currentMap: this.currentMap,
            nextScene: this.getNextSceneKey()
        });
    }

    getNextSceneKey() {
        if (this.sceneNumber === 4) {
            if (this.mapNumber === 4) {
                return 'gameover';
            }
            return `map${this.mapNumber + 1}scene1`;
        }
        return `map${this.mapNumber}scene${this.sceneNumber + 1}`;
    }

    showTooltip(text, x, y) {
        this.tooltip = this.add.text(x, y - 60, text, {
            fontSize: '16px',
            fill: '#fff',
            backgroundColor: '#000',
            padding: { x: 5, y: 3 }
        }).setOrigin(0.5).setDepth(150);
    }

    hideTooltip() {
        if (this.tooltip) {
            this.tooltip.destroy();
        }
    }

    handleSceneError(error) {
        console.error('Scene error:', error);
        const errorText = this.add.text(400, 300, 'Error loading scene. Restarting...\n' + error.message, {
            fontSize: '24px',
            fill: '#fff',
            backgroundColor: '#ff0000',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);

        // Show error details in console
        console.error('Scene state at error:', {
            mapNumber: this.mapNumber,
            sceneNumber: this.sceneNumber,
            sceneKey: this.sceneKey,
            assetsLoaded: this.load.isReady()
        });

        this.time.delayedCall(2000, () => {
            this.scene.restart();
        });
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
} 