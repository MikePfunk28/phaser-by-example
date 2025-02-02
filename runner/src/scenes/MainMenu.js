import { getAssetPath } from "../utils/assetLoader";
import progressManager from "../utils/ProgressManager";
import Phaser from 'phaser';

export default class MainMenu extends Phaser.Scene {
    constructor() {
        super({ key: 'mainmenu' });
    }

    preload() {
        // Load only existing assets
        this.load.image('background', getAssetPath('images/aws-background.png'));
        this.load.image('logo', getAssetPath('images/logo.png'));

        // Load only the available sound files
        this.load.audio('coin', getAssetPath('sounds/coin.mp3'));
        this.load.audio('jump', getAssetPath('sounds/jump.mp3'));
        this.load.audio('dead', getAssetPath('sounds/dead.mp3'));
        this.load.audio('theme', getAssetPath('sounds/theme.mp3'));
    }

    create() {
        // Add full screen background first (bottom layer)
        const background = this.add.image(400, 300, 'background')
            .setDisplaySize(800, 600);

        // Create menu container centered on screen (middle layer)
        const menuContainer = this.add.container(400, 350); // Moved down to avoid logo

        // Create menu items with Space Invaders option
        const menuItems = [
            { text: 'Play Game', handler: () => this.startNewGame() },
            { text: 'Play Space Invaders', handler: () => this.startSpaceInvaders() },
            { text: 'Continue', handler: () => this.continueGame() },
            { text: 'AWS Trainer', handler: () => this.startAWSTrainer() },
            { text: 'Options', handler: () => this.showOptions() },
            { text: 'Credits', handler: () => this.showCredits() }
        ];

        // Create full-size menu buttons
        const buttonHeight = 60;
        const padding = 20;
        const totalHeight = (buttonHeight + padding) * menuItems.length;
        const startY = -totalHeight / 2;

        // Add buttons with slight delay for each
        menuItems.forEach((item, index) => {
            this.time.delayedCall(300 + (index * 100), () => {
                const y = startY + index * (buttonHeight + padding);

                // Semi-transparent dark background for button
                const button = this.add.rectangle(0, y, 400, buttonHeight, 0x000000, 0.8)
                    .setInteractive();

                // Create larger button text
                const text = this.add.text(0, y, item.text, {
                    fontSize: '32px',
                    fill: '#ffffff',
                    fontFamily: 'Arial',
                    backgroundColor: 'transparent'
                }).setOrigin(0.5)
                    .setAlpha(0);

                // Fade in animation
                this.tweens.add({
                    targets: [button, text],
                    alpha: { from: 0, to: 1 },
                    duration: 500,
                    ease: 'Power2'
                });

                // Add hover effects
                button.on('pointerover', () => {
                    button.setFillStyle(0x666666, 0.9);
                    text.setScale(1.1);
                    if (this.sound.get('jump')) {
                        this.sound.play('jump', { volume: 0.5 });
                    }
                });

                button.on('pointerout', () => {
                    button.setFillStyle(0x000000, 0.8);
                    text.setScale(1.0);
                });

                button.on('pointerdown', () => {
                    if (this.sound.get('coin')) {
                        this.sound.play('coin', { volume: 0.5 });
                    }
                    item.handler();
                });

                menuContainer.add([button, text]);
            });
        });

        // Add logo last (top layer) with transparency
        this.time.delayedCall(200, () => {
            const logo = this.add.image(400, 100, 'logo')
                .setAlpha(0)
                .setScale(0.8); // Slightly smaller logo

            this.tweens.add({
                targets: logo,
                alpha: 0.8, // Semi-transparent logo
                duration: 1000,
                ease: 'Power2'
            });
        });

        // Add version text
        this.add.text(780, 580, 'v1.0.0', {
            fontSize: '16px',
            fill: '#ffffff'
        }).setOrigin(1, 1);

        // Start background music if available
        if (this.sound.get('theme')) {
            this.sound.play('theme', { loop: true, volume: 0.3 });
        }
    }

    startNewGame() {
        // Reset progress
        progressManager.resetProgress();

        // Fade out and start game
        this.cameras.main.fadeOut(500);
        this.time.delayedCall(500, () => {
            this.scene.start('sort_selection', {
                score: 0,
                powerUpBitmask: 0,
                currentMap: 1
            });
        });
    }

    continueGame() {
        // Load saved progress
        const progress = progressManager.loadProgress();

        if (progress && progress.lastCompletedScene) {
            // Fade out and continue from last scene
            this.cameras.main.fadeOut(500);
            this.time.delayedCall(500, () => {
                this.scene.start(progress.lastCompletedScene, {
                    score: progress.score,
                    powerUpBitmask: progress.powerUpBitmask,
                    currentMap: progress.currentMap
                });
            });
        } else {
            // No saved progress, show message
            const message = this.add.text(400, 500, 'No saved game found!', {
                fontSize: '24px',
                fill: '#ff0000'
            }).setOrigin(0.5);

            this.time.delayedCall(2000, () => {
                message.destroy();
            });
        }
    }

    showOptions() {
        // Create options overlay
        const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.9);
        const container = this.add.container(400, 300);

        // Add options title
        const title = this.add.text(0, -150, 'Options', {
            fontSize: '48px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Add volume controls
        const volumeText = this.add.text(-100, -50, 'Volume:', {
            fontSize: '24px',
            fill: '#ffffff'
        }).setOrigin(0, 0.5);

        const volumeSlider = this.add.rectangle(50, -50, 200, 20, 0x666666);
        const volumeKnob = this.add.rectangle(
            50 + (this.sound.volume * 200) - 100,
            -50,
            20,
            40,
            0x00ff00
        ).setInteractive({ draggable: true });

        // Handle volume slider
        volumeKnob.on('drag', (pointer, dragX) => {
            const x = Phaser.Math.Clamp(dragX, -100, 100);
            volumeKnob.x = x;
            const volume = (x + 100) / 200;
            this.sound.volume = volume;
        });

        // Add back button
        const backButton = this.add.rectangle(0, 100, 200, 50, 0x333333)
            .setInteractive();
        const backText = this.add.text(0, 100, 'Back', {
            fontSize: '24px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Add hover effects
        backButton.on('pointerover', () => {
            backButton.setFillStyle(0x666666);
        });
        backButton.on('pointerout', () => {
            backButton.setFillStyle(0x333333);
        });

        // Add click handler
        backButton.on('pointerdown', () => {
            this.sound.play('button_click');
            container.destroy();
            overlay.destroy();
        });

        container.add([title, volumeText, volumeSlider, volumeKnob, backButton, backText]);
    }

    showCredits() {
        // Create credits overlay
        const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.9);
        const container = this.add.container(400, 300);

        // Add credits title
        const title = this.add.text(0, -200, 'Credits', {
            fontSize: '48px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Add credits text
        const credits = [
            'Game Design & Development',
            'Art & Animation',
            'Sound & Music',
            'Testing & QA'
        ];

        credits.forEach((credit, index) => {
            this.add.text(0, -100 + (index * 60), credit, {
                fontSize: '24px',
                fill: '#ffffff'
            }).setOrigin(0.5);
        });

        // Add back button
        const backButton = this.add.rectangle(0, 150, 200, 50, 0x333333)
            .setInteractive();
        const backText = this.add.text(0, 150, 'Back', {
            fontSize: '24px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Add hover effects
        backButton.on('pointerover', () => {
            backButton.setFillStyle(0x666666);
        });
        backButton.on('pointerout', () => {
            backButton.setFillStyle(0x333333);
        });

        // Add click handler
        backButton.on('pointerdown', () => {
            this.sound.play('button_click');
            container.destroy();
            overlay.destroy();
        });

        container.add([title, backButton, backText]);
    }

    startSpaceInvaders() {
        this.cameras.main.fadeOut(500);
        this.time.delayedCall(500, () => {
            this.scene.start('space_invaders', {
                score: 0,
                fromScene: 'mainmenu'
            });
        });
    }

    startAWSTrainer() {
        this.cameras.main.fadeOut(500);
        this.time.delayedCall(500, () => {
            this.scene.start('sort_selection', {
                score: 0,
                currentMap: 1,
                mode: 'aws_trainer'
            });
        });
    }
}