import { getAssetPath } from "@/utils/assetLoader";
import Phaser from 'phaser';
import { SceneTransition } from '@/utils/SceneTransition';
import { ProgressManager } from '@/utils/ProgressManager';

export default class BaseGameScene extends Phaser.Scene {
    constructor(config) {
        super(config);
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
        this.currentIconIndex = 0;
        this.isMoving = false;
        this.paths = [];
        this.navigationPoints = [];

        // Sprite configuration
        this.spriteConfig = {
            key: 'player-sprite',
            frameWidth: 1019,
            frameHeight: 235
        };
    }

    init(data) {
        super.init(data);
        this.score = data.score || 0;
        this.powerUpBitmask = data.powerUpBitmask || 0;
        this.currentMap = data.currentMap || 1;
        this.answeredIcons = data.answeredIcons || [];
        this.currentIconIndex = data.currentIconIndex || 0;
    }

    preload() {
        // Load core assets
        this.loadCoreAssets();

        // Load sprite assets
        this.load.atlas(
            this.spriteConfig.key,
            getAssetPath('images/spritewalk_animation (1)/spritewalk_animation.png'),
            getAssetPath('images/spritewalk_animation (1)/spritewalk_animation.json')
        );
    }

    create() {
        // Create sprite animations
        this.createAnimations();

        // Set up the scene
        this.setupScene();

        // Create paths between icons
        this.createPaths();

        // Create player sprite
        this.createPlayer();

        // Set up keyboard controls
        this.cursors = this.input.keyboard.createCursorKeys();

        // Register scene lifecycle events
        this.events.on('shutdown', this.onSceneShutdown, this);
        this.events.on('wake', this.onSceneWake, this);
        this.events.on('sleep', this.onSceneSleep, this);
    }

    createAnimations() {
        // Walking animations
        this.anims.create({
            key: 'walk',
            frames: this.anims.generateFrameNames(this.spriteConfig.key, {
                prefix: 'spritewalk_animation',
                start: 0,
                end: 7,
                suffix: '.png'
            }),
            frameRate: 8,
            repeat: -1
        });
    }

    createPaths() {
        // Create navigation points from icons
        this.navigationPoints = this.icons.map((icon, index) => ({
            x: icon.x,
            y: icon.y,
            name: icon.name,
            index: index,
            answered: this.answeredIcons.includes(icon.name)
        }));

        // Create paths between consecutive icons
        this.paths = [];
        for (let i = 0; i < this.navigationPoints.length - 1; i++) {
            this.paths.push({ from: i, to: i + 1 });
        }

        // Draw paths
        this.drawPaths();
    }

    drawPaths() {
        if (this.pathGraphics) {
            this.pathGraphics.destroy();
        }

        this.pathGraphics = this.add.graphics();
        this.pathGraphics.lineStyle(4, 0xffff00, 0.5);

        this.paths.forEach(path => {
            const fromPoint = this.navigationPoints[path.from];
            const toPoint = this.navigationPoints[path.to];
            this.pathGraphics.beginPath();
            this.pathGraphics.moveTo(fromPoint.x, fromPoint.y);
            this.pathGraphics.lineTo(toPoint.x, toPoint.y);
            this.pathGraphics.strokePath();
        });
    }

    createPlayer() {
        const startPoint = this.navigationPoints[this.currentIconIndex];
        if (!startPoint) return;

        this.player = this.add.sprite(startPoint.x, startPoint.y, this.spriteConfig.key);
        this.player.setScale(0.5);
        this.player.setDepth(100);
    }

    update() {
        if (!this.player || this.isMoving) return;

        const currentPoint = this.navigationPoints[this.currentIconIndex];
        let targetIndex = this.currentIconIndex;

        if (this.cursors.right.isDown || this.cursors.down.isDown) {
            const nextPath = this.paths.find(p => p.from === this.currentIconIndex);
            if (nextPath) {
                targetIndex = nextPath.to;
            }
        } else if (this.cursors.left.isDown || this.cursors.up.isDown) {
            const prevPath = this.paths.find(p => p.to === this.currentIconIndex);
            if (prevPath) {
                targetIndex = prevPath.from;
            }
        }

        if (targetIndex !== this.currentIconIndex) {
            const targetPoint = this.navigationPoints[targetIndex];
            this.moveToIcon(targetPoint, targetIndex);
        }

        // Handle space key for interaction
        if (Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
            const currentIcon = this.icons[this.currentIconIndex];
            if (currentIcon && !this.navigationPoints[this.currentIconIndex].answered) {
                this.handleIconClick(currentIcon);
            }
        }
    }

    moveToIcon(targetPoint, newIndex) {
        if (this.isMoving) return;
        this.isMoving = true;

        // Set animation based on movement direction
        if (targetPoint.x > this.player.x) {
            this.player.play('walk', true);
            this.player.setFlipX(false);
        } else {
            this.player.play('walk', true);
            this.player.setFlipX(true);
        }

        this.tweens.add({
            targets: this.player,
            x: targetPoint.x,
            y: targetPoint.y,
            duration: 500,
            ease: 'Linear',
            onComplete: () => {
                this.player.anims.stop();
                this.isMoving = false;
                this.currentIconIndex = newIndex;
            }
        });
    }

    markIconAsAnswered(iconName) {
        const point = this.navigationPoints.find(p => p.name === iconName);
        if (point) {
            point.answered = true;
            this.answeredIcons.push(iconName);

            if (this.navigationPoints.every(p => p.answered)) {
                this.events.emit('allIconsAnswered');
            }
        }
    }

    // Virtual method for scene-specific initialization
    initScene(data) {
        // Override in child classes
    }

    setupLoadErrorHandlers() {
        this.load.on('loaderror', (fileObj) => {
            console.error('Error loading file:', fileObj.key);

            if (fileObj.type === 'image') {
                this.handleImageError(fileObj);
            } else if (fileObj.type === 'audio') {
                this.handleAudioError(fileObj);
            } else if (fileObj.type === 'json') {
                this.handleConfigError(fileObj);
            }
        });
    }

    handleImageError(fileObj) {
        // Create fallback graphics
        const graphics = this.add.graphics();

        if (fileObj.key.includes('checkmark')) {
            graphics.fillStyle(0x00ff00);
            graphics.fillCircle(0, 0, 20);
            graphics.generateTexture(fileObj.key, 40, 40);
        } else if (fileObj.key.includes('xmark')) {
            graphics.lineStyle(4, 0xff0000);
            graphics.moveTo(-10, -10);
            graphics.lineTo(10, 10);
            graphics.moveTo(10, -10);
            graphics.lineTo(-10, 10);
            graphics.generateTexture(fileObj.key, 40, 40);
        }

        graphics.destroy();
    }

    handleAudioError(fileObj) {
        if (this.game.sound && this.game.sound.context) {
            const buffer = this.game.sound.context.createBuffer(2, 44100, 44100);
            this.cache.audio.add(fileObj.key, buffer);
        }
    }

    handleConfigError(fileObj) {
        if (fileObj.key.includes('map-config')) {
            this.mapConfig = { zones: [] };
        }
    }

    loadCoreAssets() {
        // Load essential game assets
        this.load.json('map-config', getAssetPath(`data/map${this.currentMap}/map-config.json`));
        this.load.json('questions', getAssetPath('data/questions.json'));
        this.load.image('checkmark', getAssetPath('images/checkmark.png'));
        this.load.image('xmark', getAssetPath('images/xmark.png'));
    }

    // Virtual method for scene-specific asset loading
    loadSceneAssets() {
        // Override in child classes
    }

    onAssetsLoaded() {
        try {
            this.mapConfig = this.cache.json.get('map-config');
            this.questions = this.cache.json.get('questions');

            if (!this.mapConfig || !this.mapConfig.zones) {
                throw new Error(`Invalid map config for map ${this.currentMap}`);
            }

            this.icons = this.mapConfig.zones.map((zone, index) => ({
                x: zone.x,
                y: zone.y,
                name: zone.name,
                index: index,
                answered: this.answeredIcons.includes(zone.name)
            }));

            this.isReady = true;
            this.events.emit('scene-ready');
        } catch (error) {
            console.error('Error loading assets:', error);
            this.handleLoadError(error);
        }
    }

    // Virtual method for scene-specific setup
    setupScene() {
        if (this.mapConfig) {
            this.setupMap(this.mapConfig);
        }
    }

    getPowerUpText() {
        const powerUps = [];
        if (this.powerUpBitmask & 1) powerUps.push('Life+');
        if (this.powerUpBitmask & 2) powerUps.push('Shield+');
        if (this.powerUpBitmask & 4) powerUps.push('Speed+');
        if (this.powerUpBitmask & 8) powerUps.push('Fire+');
        return powerUps.join(' ');
    }

    // Scene lifecycle handlers
    onSceneCreate() {
        if (this.gameManager) {
            this.gameManager.setCurrentScene(this);
        }
        console.log(`Scene ${this.scene.key} created`);
    }

    onSceneShutdown() {
        // Clean up event listeners
        this.events.off('create', this.onSceneCreate, this);
        this.events.off('shutdown', this.onSceneShutdown, this);
        this.events.off('wake', this.onSceneWake, this);
        this.events.off('sleep', this.onSceneSleep, this);

        this.cleanup();
    }

    onSceneWake() {
        this.isTransitioning = false;
        console.log(`Scene ${this.scene.key} resumed`);
    }

    onSceneSleep() {
        console.log(`Scene ${this.scene.key} paused`);
    }

    cleanup() {
        // Basic cleanup that all scenes should do
        if (this.scoreText) this.scoreText.destroy();
        if (this.player) this.player.destroy();

        // Allow child scenes to perform additional cleanup
        this.cleanupScene();
    }

    // Virtual method for scene-specific cleanup
    cleanupScene() {
        // Override in child classes
    }

    handleLoadError(error) {
        console.error('Scene load error:', error);
        const errorText = this.add.text(400, 300, 'Error loading scene. Restarting...', {
            fontSize: '24px',
            fill: '#ff0000',
            backgroundColor: '#000000',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);

        this.time.delayedCall(2000, () => {
            this.scene.restart();
        });
    }

    // Utility methods that child scenes might need
    updateScore(points) {
        this.score += points;
        if (this.scoreText) {
            this.scoreText.setText(`Score: ${this.score}`);
        }
    }

    saveProgress() {
        if (this.progressManager) {
            this.progressManager.saveProgress({
                lastCompletedScene: this.scene.key,
                score: this.score,
                powerUpBitmask: this.powerUpBitmask,
                currentMap: this.currentMap
            });
        }
    }

    setupMap(mapConfig) {
        // To be implemented by child classes
        throw new Error('setupMap must be implemented by child class');
    }

    getNextSceneKey() {
        // Extract current map and scene numbers from the scene key
        const sceneKey = this.scene.key.toLowerCase();
        const mapMatch = sceneKey.match(/map(\d+)/);
        const sceneMatch = sceneKey.match(/scene(\d+)/);

        if (!mapMatch || !sceneMatch) {
            console.error('Invalid scene key format:', sceneKey);
            return 'mainmenu';
        }

        const currentMapNumber = parseInt(mapMatch[1]);
        const currentSceneNumber = parseInt(sceneMatch[1]);

        // Determine next scene
        if (currentSceneNumber < 4) {
            // Next scene in current map
            return `map${currentMapNumber}scene${currentSceneNumber + 1}`;
        } else if (currentMapNumber < 4) {
            // First scene of next map
            return `map${currentMapNumber + 1}scene1`;
        } else if (currentMapNumber === 4 && currentSceneNumber === 4) {
            // End of game
            return 'gameover';
        } else {
            // Fallback
            return 'mainmenu';
        }
    }

    transitionToNextScene() {
        if (this.isTransitioning) return;
        this.isTransitioning = true;

        // Save progress
        this.saveProgress();

        const nextScene = this.getNextSceneKey();

        // Always transition through space invaders, even before game over
        this.sceneTransition.toSpaceInvaders(this, nextScene, {
            score: this.score,
            powerUpBitmask: this.powerUpBitmask,
            currentMap: this.currentMap,
            fromScene: this.scene.key
        });
    }

    showQuestion(question, iconSprite) {
        // Create semi-transparent dark overlay
        const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.9)
            .setDepth(100);

        // Create question container
        const container = this.add.container(400, 300)
            .setDepth(101);

        // Add question text with proper word wrap
        const questionText = this.add.text(0, -150, question.question, {
            fontSize: '20px',
            fill: '#ffffff',
            align: 'center',
            wordWrap: { width: 650 },
            lineSpacing: 12
        }).setOrigin(0.5).setDepth(101);
        container.add(questionText);

        // Add question background sized to fit text
        const textBounds = questionText.getBounds();
        const questionBg = this.add.rectangle(0, textBounds.centerY, textBounds.width + 60, textBounds.height + 40, 0x333333)
            .setDepth(100);
        container.add(questionBg);
        container.sendToBack(questionBg);

        // Create answer buttons with proper spacing
        const answers = [...question.incorrect_answers, question.correct_answer];
        this.shuffleArray(answers);

        const buttonStartY = questionBg.y + questionBg.height / 2 + 50;
        const buttonSpacing = 80;

        const answerButtons = answers.map((answer, i) => {
            // Create text first to measure its size
            const text = this.add.text(0, buttonStartY + (i * buttonSpacing), answer, {
                fontSize: '18px',
                fill: '#ffffff',
                align: 'center',
                wordWrap: { width: 650 }
            }).setOrigin(0.5).setDepth(101);

            // Create button sized to fit text
            const textBounds = text.getBounds();
            const button = this.add.rectangle(0, buttonStartY + (i * buttonSpacing), textBounds.width + 40, textBounds.height + 20, 0x666666)
                .setInteractive()
                .setDepth(100);

            // Add hover effects
            button.on('pointerover', () => {
                button.setFillStyle(0x888888);
                text.setStyle({ fill: '#00ff00' });
            });

            button.on('pointerout', () => {
                button.setFillStyle(0x666666);
                text.setStyle({ fill: '#ffffff' });
            });

            // Handle click
            button.on('pointerdown', () => {
                const isCorrect = answer === question.correct_answer;
                this.handleAnswer(isCorrect, iconSprite, container, overlay, question);
            });

            container.add([button, text]);
            return { button, text };
        });

        this.currentQuestion = {
            container: container,
            background: overlay,
            buttons: answerButtons
        };
    }

    handleAnswer(isCorrect, iconSprite, container, overlay, question) {
        // Disable all buttons
        this.currentQuestion.buttons.forEach(({ button }) => {
            button.disableInteractive();
        });

        // Update score and show feedback
        if (isCorrect) {
            this.updateScore(100);
            iconSprite.setTint(0x00ff00);
        } else {
            iconSprite.setTint(0xff0000);
        }

        // Show explanation with proper background
        const explanationBg = this.add.rectangle(400, 500, 750, 120, isCorrect ? 0x004400 : 0x440000)
            .setDepth(101);

        const explanation = this.add.text(400, 500, question.explanation, {
            fontSize: '18px',
            fill: isCorrect ? '#00ff00' : '#ff0000',
            align: 'center',
            wordWrap: { width: 700 },
            lineSpacing: 8
        }).setOrigin(0.5).setDepth(102);

        // Adjust explanation background height based on text
        const expBounds = explanation.getBounds();
        explanationBg.height = expBounds.height + 40;
        explanationBg.y = expBounds.centerY;

        // Add feedback mark
        const feedbackMark = this.add.image(iconSprite.x, iconSprite.y,
            isCorrect ? 'checkmark' : 'xmark')
            .setScale(0.5)
            .setDepth(150);

        // Mark question as answered
        iconSprite.isAnswered = true;
        iconSprite.disableInteractive();
        this.answeredQuestions++;

        // Remove everything after delay
        this.time.delayedCall(4000, () => {
            container.destroy();
            overlay.destroy();
            explanationBg.destroy();
            explanation.destroy();
            feedbackMark.destroy();

            // Check if we should transition
            if (this.answeredQuestions >= 5) {
                this.transitionToNextScene();
            }
        });
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
} 