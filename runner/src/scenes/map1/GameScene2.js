import BaseGameScene from '../BaseGameScene';
import { getAssetPath } from "@/utils/assetLoader";
import Player from '/src/gameobjects/player';
import Generator from '/src/gameobjects/generator';
import Phaser from 'phaser'; // Default import
import SceneTransition from '@/utils/SceneTransition';


export default class GameScene2 extends BaseGameScene {
    constructor() {
        super({ key: 'map1scene2' });
        this.currentMap = 1;
    }
    // In the receiving scene's init method:
    init(data) {
        this.score = data?.score || 0;
        this.isTransitioning = false;

        // Optional: Add fade in effect
        this.cameras.main.fadeIn(500);
    }
    preload() {
        super.preload();
        this.load.image('map1scene2', getAssetPath('images/map1scene2.png'));
        this.load.json('map-config', getAssetPath('data/map1/map-config2.json'));
    }

    getNextSceneKey() {
        return 'map1scene3';
    }

    create() {
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
        this.setupScore();
    }

    loadAwsIcons(mapConfig) {
        // Preload all icons
        mapConfig.zones.forEach(zone => {
            zone.icons.forEach(icon => {
                const relevantQuestion = this.questions.find(q =>
                    icon.questionTypes.some(type =>
                        q.question.toLowerCase().includes(type.toLowerCase())
                    )
                );

                if (relevantQuestion && relevantQuestion.image) {
                    console.log('Loading icon from question:', relevantQuestion.image);
                    this.load.image(`icon_${icon.name}`, relevantQuestion.image);
                } else {
                    const iconPath = `assets/images/services16/${icon.category}/48/${icon.name}.png`;
                    console.log('Loading icon with constructed path:', iconPath);
                    this.load.image(`icon_${icon.name}`, iconPath);
                }
            });
        });

        // Add error handling
        this.load.on('loaderror', (fileObj) => {
            console.error('Error loading file:', fileObj.key);
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
                        .setScale(1.0);

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
            iconSprite.setScale(1.0);
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
            if (iconSprite.isAnswered || this.clickCooldown) return; // Skip if answered or in cooldown

            // Set cooldown
            this.clickCooldown = true;
            this.time.delayedCall(500, () => { // 500ms cooldown
                this.clickCooldown = false;
            });

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
                                this.scene.start('map1scene2', { nextScene: 'space_invaders', score: this.score });
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

    transitionToNextScene() {
        if (this.isTransitioning) return;
        this.isTransitioning = true;
        // Pause any ongoing animations/updates
        this.scene.pause();

        this.camera.main.fadeOut(500);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            SceneTransition.toWithLoading(this, 'space-invaders', { nextScene: this.getNextSceneKey(), score: this.score })
        });
    }
}
