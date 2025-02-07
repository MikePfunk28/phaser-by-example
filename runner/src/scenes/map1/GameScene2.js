import BaseGameScene from '../BaseGameScene';
import { getAssetPath } from "@/utils/assetLoader";
import Player from '@/gameobjects/player';
import Generator from '@/gameobjects/generator';
import Phaser from 'phaser'; // Default import
import { SceneTransition } from '@/utils/SceneTransition';
import { ProgressManager } from '@/utils/ProgressManager';


export default class map1scene2 extends BaseGameScene {
    constructor() {
        super({ key: 'map1scene2' });
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
    // In the receiving scene's init method:
    init(data) {
        this.score = data.score || 0;
        this.powerUpBitmask = data.powerUpBitmask || 0;
        this.currentMap = data.currentMap || 1;

        // Save progress
        this.progressManager.saveProgress({
            lastCompletedScene: 'map1scene2',
            currentMap: this.currentMap,
            powerUpBitmask: this.powerUpBitmask,
            score: this.score
        });

        // Optional: Add fade in effect
        this.cameras.main.fadeIn(500);
    }
    preload() {
        super.preload();
        this.load.image('map1scene2', getAssetPath('images/map1scene2.png'));
        this.load.json('map-config', getAssetPath('data/map1/map-config2.json'));
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

    getNextSceneKey() {
        return 'map1scene3';
    }

    create() {
        // Add semi-transparent dark background
        this.add.rectangle(400, 300, 800, 600, 0x000000, 0.8);

        // Initialize sound settings properly
        if (this.sound && this.sound.context) {
            this.sound.pauseOnBlur = false;
        }

        this.questions = this.cache.json.get('questions');

        const mapConfig = this.cache.json.get('map-config');  // Remove the '2'

        // Set up the map based on config
        const activeZone = mapConfig.zones[0];
        const map = this.add.image(activeZone.x, activeZone.y, 'map1scene2');
        map.setScale(activeZone.scale);

        // Load AWS icons after we have the config
        this.loadAwsIcons(mapConfig);

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
            const mapConfig = this.cache.json.get('map-config2');

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
                'map1scene2'
            );
            map.setOrigin(0.5);

            // Calculate scale to fit screen
            const scaleX = this.cameras.main.width / map.width;
            const scaleY = this.cameras.main.height / map.height;
            const scale = Math.max(scaleX, scaleY);
            map.setScale(scale);

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
                this.scene.start('map1gamescene2');
            }, 2000);
        }
    }

    loadAwsIcons(mapConfig) {
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

                    // Create icon sprite with auto sizing
                    const iconSprite = this.add.image(iconConfig.x, iconConfig.y, iconKey)
                        .setInteractive()
                        .setScale(0.5); // Base scale for 48x48 icons

                    // Add highlight box that matches icon size
                    const iconBounds = iconSprite.getBounds();
                    const box = this.add.rectangle(
                        iconConfig.x,
                        iconConfig.y,
                        iconBounds.width,
                        iconBounds.height,
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
        iconSprite.inCooldown = false;

        // Add subtle pulse animation for normal state
        this.tweens.add({
            targets: iconSprite,
            scale: { from: 0.5, to: 0.55 }, // Smaller scale range for subtle effect
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Hover effects
        iconSprite.on('pointerover', () => {
            if (!iconSprite.isAnswered && !iconSprite.inCooldown) {
                // Scale up slightly and add glow effect
                this.tweens.add({
                    targets: iconSprite,
                    scale: 0.6,
                    duration: 200
                });
                iconSprite.preFX.addGlow(0xffffff, 0.5);
                this.sound.play('click', { volume: 0.5 });
            }
        });

        iconSprite.on('pointerout', () => {
            if (!iconSprite.isAnswered && !iconSprite.inCooldown) {
                // Return to normal scale and remove glow
                this.tweens.add({
                    targets: iconSprite,
                    scale: 0.5,
                    duration: 200
                });
                iconSprite.preFX.clear();
            }
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

    showQuestion(question, iconSprite) {
        // Prevent showing new questions if we're transitioning
        if (this.isTransitioning) return;

        // Create DOM elements for question
        const questionContainer = document.createElement('div');
        questionContainer.className = 'question-container';

        const overlay = document.createElement('div');
        overlay.className = 'overlay';

        const questionElement = document.createElement('div');
        questionElement.className = 'question';
        questionElement.textContent = question.question;

        questionContainer.appendChild(questionElement);

        let isAnswered = false;  // Flag to prevent multiple answers

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
                // Prevent multiple clicks
                if (isAnswered) return;
                isAnswered = true;

                const isCorrect = key === question.answer;
                if (isCorrect) {
                    this.score += 100;
                    this.scoreText.setText(`Score: ${this.score}`);
                }

                // Display feedback
                const feedbackMark = isCorrect ? 'checkMark' : 'xMark';
                const feedback = this.add.image(iconSprite.x, iconSprite.y, feedbackMark)
                    .setScale(0.5)
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

                // Set a flag to indicate we're transitioning
                if (this.answeredQuestions === 5) {
                    this.isTransitioning = true;
                }

                // Remove after delay
                setTimeout(() => {
                    document.body.removeChild(overlay);
                    document.body.removeChild(questionContainer);
                    feedback.destroy();

                    if (this.answeredQuestions === 5) {
                        console.log('All 5 questions answered, transitioning to Space Invaders...');
                        this.cameras.main.fade(1000, 0, 0, 0, false, (camera, progress) => {
                            if (progress === 1) {
                                this.scene.start('map1gamescene2', { nextScene: 'space_invaders', score: this.score });
                            }
                        });
                    }
                }, 2000);
            });

            questionContainer.appendChild(option);
        });

        document.body.appendChild(overlay);
        document.body.appendChild(questionContainer);
    }

    setupScore() {
        this.scoreText = this.add.text(16, 16, `Score: ${this.score}`, {
            fontSize: '32px',
            fill: '#fff',
            backgroundColor: '#000',
            padding: { x: 10, y: 5 }
        }).setScrollFactor(0).setDepth(200);
    }

    getPowerUpText() {
        const powerUps = [];
        if (this.powerUpBitmask & 1) powerUps.push('Life+');
        if (this.powerUpBitmask & 2) powerUps.push('Size+');
        if (this.powerUpBitmask & 4) powerUps.push('Speed+');
        if (this.powerUpBitmask & 8) powerUps.push('Fire+');
        return `Power-ups: ${powerUps.join(' ')}`;
    }

    transitionToNextScene() {
        if (this.isTransitioning) return;
        this.isTransitioning = true;

        // Save progress before transition
        this.progressManager.saveProgress({
            lastCompletedScene: 'map1scene2',
            currentMap: this.currentMap,
            powerUpBitmask: this.powerUpBitmask,
            score: this.score
        });

        // Transition to space invaders
        this.sceneTransition.to(this, 'space_invaders', {
            nextScene: 'map1scene3',
            score: this.score,
            powerUpBitmask: this.powerUpBitmask,
            currentMap: this.currentMap
        });
    }
}
