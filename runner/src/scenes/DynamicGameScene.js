import { getAssetPath } from "../utils/assetLoader";
import BaseGameScene from './BaseGameScene';

export default class DynamicGameScene extends BaseGameScene {
    constructor() {
        super({ key: 'DynamicGameScene' });
        this.score = 0;
        this.currentMap = 1;
        this.questions = null;
        this.icons = [];
        this.answeredQuestions = 0;
        this.isTransitioning = false;
        this.requiredAnswers = 5; // Number of questions to answer before proceeding
    }

    init(data) {
        // Get scene data from registry or passed data
        this.score = data.score || this.registry.get('score') || 0;
        this.currentMap = data.currentMap || this.registry.get('currentMap') || 1;
        this.sceneIndex = data.sceneIndex || this.registry.get('currentSceneIndex') || 0;
        this.sortedScenes = data.sortedScenes || this.registry.get('dynamicScenes') || [];

        // Setup managers if available
        if (this.gameManager?.sceneTransition) {
            this.sceneTransition = this.gameManager.sceneTransition;
        }
        if (this.gameManager?.progressManager) {
            this.progressManager = this.gameManager.progressManager;
        }

        this.isTransitioning = false;
        this.answeredQuestions = 0;
    }

    preload() {
        // Load the current scene's background
        const currentScene = this.sortedScenes[this.sceneIndex];
        this.load.image('currentBackground', getAssetPath(`images/${currentScene}`));

        // Load questions and icons
        this.load.json('questions', getAssetPath('data/questions.json'));
        this.load.image('checkMark', getAssetPath('images/checkmark.png'));
        this.load.image('xMark', getAssetPath('images/xmark.png'));
    }

    create() {
        // Set up background
        const bg = this.add.image(400, 300, 'currentBackground');
        bg.setScale(0.8);  // Adjust scale as needed

        // Load questions
        this.questions = this.cache.json.get('questions');

        // Set up score display
        this.setupScore();

        // Create random question points
        this.createQuestionPoints();

        // Add progress indicator
        this.add.text(400, 20, `Scene ${this.sceneIndex + 1}/${this.sortedScenes.length}`, {
            fontSize: '24px',
            fill: '#fff'
        }).setOrigin(0.5);
    }

    createQuestionPoints() {
        // Create 5 random positions for question icons
        const positions = this.generateRandomPositions(5);

        positions.forEach((pos, index) => {
            const icon = this.add.circle(pos.x, pos.y, 20, 0x00ff00, 0.8)
                .setInteractive({ useHandCursor: true });

            // Add pulsing animation
            this.tweens.add({
                targets: icon,
                scale: { from: 1, to: 1.2 },
                duration: 1000,
                yoyo: true,
                repeat: -1
            });

            // Handle click
            icon.on('pointerdown', () => this.showRandomQuestion(icon));

            this.icons.push(icon);
        });
    }

    generateRandomPositions(count) {
        const positions = [];
        const margin = 100; // Distance from edges

        for (let i = 0; i < count; i++) {
            let x, y, tooClose;
            do {
                x = Phaser.Math.Between(margin, 800 - margin);
                y = Phaser.Math.Between(margin, 600 - margin);
                tooClose = positions.some(pos =>
                    Phaser.Math.Distance.Between(x, y, pos.x, pos.y) < 100
                );
            } while (tooClose);

            positions.push({ x, y });
        }
        return positions;
    }

    showRandomQuestion(icon) {
        if (icon.answered) return;

        // Get random question
        const question = Phaser.Utils.Array.GetRandom(this.questions);

        // Create question container
        const container = this.add.container(400, 300);

        // Add semi-transparent background
        const overlay = this.add.rectangle(0, 0, 800, 600, 0x000000, 0.8);
        container.add(overlay);

        // Split question text if it contains a problem description
        let questionText;
        let descriptionText;

        if (question.question.toLowerCase().includes('given the problem description:')) {
            const parts = question.question.split('Given the problem description:');
            descriptionText = this.add.text(0, -150, 'Given the problem description:', {
                fontSize: '20px',
                fill: '#00ff00',
                wordWrap: { width: 600 },
                align: 'center'
            }).setOrigin(0.5);

            questionText = this.add.text(0, -100, parts[1].trim(), {
                fontSize: '24px',
                fill: '#fff',
                wordWrap: { width: 600 },
                align: 'center'
            }).setOrigin(0.5);

            container.add([descriptionText, questionText]);
        } else {
            // Regular question without description
            questionText = this.add.text(0, -100, question.question, {
                fontSize: '24px',
                fill: '#fff',
                wordWrap: { width: 600 },
                align: 'center'
            }).setOrigin(0.5);
            container.add(questionText);
        }

        // Add answer options
        const answers = [...question.incorrect_answers, question.correct_answer];
        Phaser.Utils.Array.Shuffle(answers);

        answers.forEach((answer, index) => {
            const y = index * 60 - 20;
            const button = this.add.rectangle(0, y, 500, 50, 0x333333)
                .setInteractive({ useHandCursor: true });
            const text = this.add.text(0, y, answer, {
                fontSize: '20px',
                fill: '#fff'
            }).setOrigin(0.5);

            button.on('pointerdown', () => this.handleAnswer(
                answer === question.correct_answer,
                icon,
                container
            ));

            container.add([button, text]);
        });
    }

    handleAnswer(correct, icon, container) {
        // Update score
        if (correct) {
            this.score += 100;
            this.registry.set('score', this.score);
            this.scoreText.setText('Score: ' + this.score);
            icon.setFillStyle(0x00ff00);
        } else {
            icon.setFillStyle(0xff0000);
        }

        // Mark as answered and remove container
        icon.answered = true;
        icon.disableInteractive();
        this.tweens.killTweensOf(icon);

        // Remove question container after shorter delay
        this.time.delayedCall(500, () => {  // Reduced from 1000 to 500ms
            container.destroy();
            this.answeredQuestions++;

            // Check if we should proceed to next scene
            if (this.answeredQuestions >= this.requiredAnswers) {
                this.proceedToNextScene();
            }
        });
    }

    proceedToNextScene() {
        if (this.isTransitioning) return;
        this.isTransitioning = true;

        const nextIndex = this.sceneIndex + 1;

        // If we've gone through all scenes, return to menu
        if (nextIndex >= this.sortedScenes.length) {
            const finalData = {
                score: this.score,
                currentMap: this.currentMap,
                fromDynamicScene: true
            };

            if (this.sceneTransition) {
                this.sceneTransition.to(this, 'mainmenu', finalData);
            } else {
                this.cameras.main.fadeOut(500);
                this.cameras.main.once('camerafadeoutcomplete', () => {
                    this.scene.start('mainmenu', finalData);
                });
            }
            return;
        }

        // Otherwise, proceed to next dynamic scene
        const nextSceneData = {
            score: this.score,
            currentMap: this.currentMap,
            sceneIndex: nextIndex,
            sortedScenes: this.sortedScenes,
            isDynamicScene: true
        };

        // Update registry
        this.registry.set('currentSceneIndex', nextIndex);

        if (this.sceneTransition) {
            this.sceneTransition.to(this, 'DynamicGameScene', nextSceneData);
        } else {
            this.cameras.main.fadeOut(500);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('DynamicGameScene', nextSceneData);
            });
        }
    }

    setupScore() {
        this.scoreText = this.add.text(16, 16, 'Score: ' + this.score, {
            fontSize: '32px',
            fill: '#fff',
            backgroundColor: '#000',
            padding: { x: 10, y: 5 }
        }).setScrollFactor(0).setDepth(200);
    }
} 