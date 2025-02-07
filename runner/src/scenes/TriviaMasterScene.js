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

        // In the constructor, add bound functions
        this.boundOnWindowBlur = this.onWindowBlur.bind(this);
        this.boundOnWindowFocus = this.onWindowFocus.bind(this);
    }

    init(data) {
        console.log('TriviaMasterScene: Actually starting scene initialization now', data);

        // Initialize managers here instead of constructor
        this.progressManager = new ProgressManager();
        this.sceneTransition = new SceneTransition();
        this.powerUpManager = new PowerUpManager();

        // Set mapNumber, sceneNumber, and sceneKey from data
        this.mapNumber = data.mapNumber || 1;
        this.sceneNumber = (data.sceneNumber !== undefined) ? data.sceneNumber : 1;
        this.sceneKey = data.sceneKey || `map${this.mapNumber}scene${this.sceneNumber}`;

        // Remove any previously added listeners and add our bound listeners
        window.removeEventListener('blur', this.boundOnWindowBlur);
        window.removeEventListener('focus', this.boundOnWindowFocus);
        window.addEventListener('blur', this.boundOnWindowBlur);
        window.addEventListener('focus', this.boundOnWindowFocus);

        // Register shutdown event to clean up listeners
        this.events.on('shutdown', this.shutdown, this);

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
        window.removeEventListener('blur', this.boundOnWindowBlur);
        window.removeEventListener('focus', this.boundOnWindowFocus);
        window.addEventListener('blur', this.boundOnWindowBlur);
        window.addEventListener('focus', this.boundOnWindowFocus);

        console.log('TriviaMasterScene: Scene configuration:', {
            mapNumber: this.mapNumber,
            sceneNumber: this.sceneNumber,
            sceneKey: this.sceneKey
        });
    }

    onWindowBlur() {
        if (this.currentQuestion) return;
        try {
            if (this.scene && this.scene.isActive && this.scene.isActive()) {
                this.scene.pause();
            } else {
                console.warn('onWindowBlur: Scene is not active, skipping pause.');
            }
        } catch (e) {
            console.error('Error pausing scene on blur:', e);
        }
    }

    onWindowFocus() {
        try {
            if (this.scene && this.scene.isPaused && this.scene.isPaused()) {
                this.scene.resume();
            } else {
                console.warn('onWindowFocus: Scene is not paused or not running, skipping resume.');
            }
        } catch (e) {
            console.error('Error resuming scene on focus:', e);
        }
    }

    preload() {
        console.log('TriviaMasterScene: Preload started with map:', this.mapNumber, 'scene:', this.sceneNumber);

        // Load the correct map config based on current map and scene
        const mapConfigPath = `data/map${this.mapNumber}/map-config${this.sceneNumber}.json`;
        this.load.json('map-config', getAssetPath(mapConfigPath));
        console.log('Loading map config:', mapConfigPath);

        // Load questions
        this.load.json('questions', getAssetPath('data/questions.json'));

        // Load UI elements
        this.load.image('checkMark', getAssetPath('images/checkmark.png'));
        this.load.image('xMark', getAssetPath('images/xmark.png'));

        // Load the correct background image
        const bgPath = `images/map${this.mapNumber}scene${this.sceneNumber}.png`;
        this.load.image('background', getAssetPath(bgPath));
        console.log('Loading background:', bgPath);

        // Add error handlers
        this.setupLoadErrorHandlers();
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
            // Get the loaded map config and questions
            const mapConfig = this.cache.json.get('map-config');
            this.questions = this.cache.json.get('questions');

            if (!mapConfig || !mapConfig.zones) {
                throw new Error(`Invalid map config for map${this.mapNumber}scene${this.sceneNumber}`);
            }

            // Set up background
            const bg = this.add.image(400, 300, 'background');
            bg.setScale(0.8);

            // Set up UI
            this.setupUI();

            // Load AWS icons after we have the config
            this.loadAwsIcons(mapConfig);

            // Save current progress
            this.progressManager.saveProgress({
                lastCompletedScene: `map${this.mapNumber}scene${this.sceneNumber}`,
                currentMap: this.mapNumber,
                powerUpBitmask: this.powerUpBitmask,
                score: this.score
            });

            // Add fade-in transition
            this.cameras.main.fadeIn(500);

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
                    this.finishQuestions();
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

    finishQuestions() {
        // Save progress before transitioning
        const sceneKey = `map${this.currentMap}scene${this.sceneNumber}`;
        this.progressManager.setLastCompletedScene(sceneKey);

        // Check if all questions were answered correctly for power-up
        if (this.correctAnswers === 5) {
            const powerUpType = this.getPowerUpForScene(this.currentMap, this.sceneNumber);
            if (powerUpType) {
                this.progressManager.addPowerUp(powerUpType);
                this.showPowerUpNotification(powerUpType);
            }
        }

        // Prepare transition data
        const nextSceneData = {
            score: this.score,
            powerUpBitmask: this.powerUpBitmask,
            currentMap: this.currentMap,
            fromScene: this.scene.key,
            nextScene: `map${this.currentMap}scene${this.sceneNumber + 1}`
        };

        // Transition to space invaders
        if (this.sceneTransition) {
            this.sceneTransition.to(this, 'space_invaders', nextSceneData);
        } else {
            this.scene.start('space_invaders', nextSceneData);
        }
    }

    getPowerUpForScene(mapNumber, sceneNumber) {
        const powerUpIndex = ((mapNumber - 1) * 4) + (sceneNumber - 1);
        // Return power-up type based on scene (1, 2, 4, 8 for different types)
        return Math.pow(2, powerUpIndex % 4);
    }

    showPowerUpNotification(powerUpType) {
        const powerUpNames = {
            1: 'LIFE +2',
            2: 'CRAFT SIZE +20%',
            4: 'SPEED +100',
            8: 'FIRE RATE +2'
        };

        const notification = this.add.text(400, 300,
            `Perfect Score!\nPower-Up Unlocked: ${powerUpNames[powerUpType]}`, {
            fontSize: '24px',
            fill: '#fff',
            align: 'center'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: notification,
            alpha: { from: 1, to: 0 },
            y: 250,
            duration: 2000,
            onComplete: () => notification.destroy()
        });
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

    setupDiagramScene() {
        console.log('Setting up diagram scene');
        // Use unique keys as in preload
        const mapImageKey = `map${this.mapNumber}scene${this.sceneNumber}.png`;
        const mapConfigKey = `map${this.mapNumber}/map-config${this.sceneNumber}.json`;

        // Show the diagram background image
        const bg = this.add.image(400, 300, mapImageKey);
        bg.setOrigin(0.5);

        // Get diagram configuration from cache
        const diagramConfig = this.cache.json.get(mapConfigKey);
        if (!diagramConfig) {
            console.error('Diagram config missing for scene', this.sceneKey);
            return;
        }

        // Assume diagramConfig contains:
        // - placeholders: an array of objects with x, y, width, height, and expectedIcon properties.
        // - availableIcons: an array of icon filenames that the player may drag
        this.placeholders = [];
        diagramConfig.placeholders.forEach(ph => {
            const placeholder = this.add.rectangle(ph.x, ph.y, ph.width, ph.height, 0xffffff, 0.2)
                .setStrokeStyle(2, 0x00ff00);
            placeholder.expectedIcon = ph.expectedIcon; // e.g. "SageMaker_Canvas_48.png"
            placeholder.filled = false;
            this.placeholders.push(placeholder);
        });

        // Create a draggable panel of available icons
        this.diagramIcons = [];
        const availableIcons = diagramConfig.availableIcons; // e.g. [ "SageMaker_Canvas_48.png", "Route53_48.png", ... ]
        const panelY = 550;
        const iconSpacing = 80;
        const panelStartX = 100;
        availableIcons.forEach((iconName, index) => {
            const iconKey = `icon_${iconName}`;
            const x = panelStartX + index * iconSpacing;
            let iconSprite = this.add.image(x, panelY, iconKey).setInteractive();
            iconSprite.originalX = x;
            iconSprite.originalY = panelY;
            this.input.setDraggable(iconSprite);
            iconSprite.on('dragstart', () => {
                iconSprite.setScale(1.2);
            });
            iconSprite.on('drag', (pointer, dragX, dragY) => {
                iconSprite.x = dragX;
                iconSprite.y = dragY;
            });
            iconSprite.on('dragend', (pointer, dragX, dragY, dropped) => {
                let correctPlaceholder = null;
                this.placeholders.forEach(ph => {
                    if (!ph.filled && Phaser.Geom.Intersects.RectangleToRectangle(iconSprite.getBounds(), ph.getBounds())) {
                        correctPlaceholder = ph;
                    }
                });
                if (correctPlaceholder && iconSprite.texture.key.endsWith(correctPlaceholder.expectedIcon)) {
                    // Snap icon to placeholder and mark as filled
                    iconSprite.x = correctPlaceholder.x;
                    iconSprite.y = correctPlaceholder.y;
                    iconSprite.setScale(1);
                    correctPlaceholder.filled = true;
                    iconSprite.disableInteractive();
                } else {
                    // Tween icon back to original position
                    this.tweens.add({
                        targets: iconSprite,
                        x: iconSprite.originalX,
                        y: iconSprite.originalY,
                        duration: 500,
                        ease: 'Power2'
                    });
                }
                this.checkDiagramCompletion();
            });
            this.diagramIcons.push(iconSprite);
        });

        // Auto-fill missing placeholders after 10 seconds
        this.time.delayedCall(10000, () => {
            this.placeholders.forEach(ph => {
                if (!ph.filled) {
                    // Create a black fallback box with a red stroke
                    const fallbackBox = this.add.rectangle(ph.x, ph.y, ph.width, ph.height, 0x000000)
                        .setOrigin(0.5)
                        .setStrokeStyle(2, 0xff0000);
                    ph.filled = true;
                }
            });
            this.checkDiagramCompletion();
        }, [], this);
    }

    checkDiagramCompletion() {
        const allFilled = this.placeholders.every(ph => ph.filled);
        if (allFilled) {
            console.log('Diagram completed successfully');
            this.triggerDiagramTransition();
        }
    }

    triggerDiagramTransition() {
        const nextTriviaSceneKey = this.getNextSceneKey();
        const match = nextTriviaSceneKey.match(/map(\d+)scene(\d+)/);
        if (match) {
            const mapNumber = parseInt(match[1], 10);
            const sceneNumber = parseInt(match[2], 10);
            // Transition to new trivia_master scene with updated data
            this.sceneTransition.to(this, 'trivia_master', {
                mapNumber: mapNumber,
                sceneNumber: sceneNumber,
                score: this.score,
                powerUpBitmask: this.powerUpBitmask,
                currentMap: this.currentMap
            });
        } else {
            console.warn('Invalid nextTriviaSceneKey:', nextTriviaSceneKey);
            // Fallback transition if next scene key is invalid
            this.sceneTransition.toSpaceInvaders(this);
        }
    }

    // Add shutdown method to remove window event listeners
    shutdown() {
        window.removeEventListener('blur', this.boundOnWindowBlur);
        window.removeEventListener('focus', this.boundOnWindowFocus);
    }
} 