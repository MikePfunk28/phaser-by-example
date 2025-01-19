import Phaser from 'phaser';

export default class MainMenu extends Phaser.Scene {
    constructor() {
        super('MainMenu');

    }

    preload() {
        // Load required assets with correct paths
        this.load.image('background', '/assets/images/background.png');
        this.load.image('logo', '/assets/images/logo.png');
    }

    create() {
        // Set a solid color background if image fails to load
        this.cameras.main.setBackgroundColor('#000033');

        // Create title text
        this.add.text(400, 100, 'AWS Certification Trainer', {
            fontFamily: 'Arial Black',
            fontSize: 38,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5);

        // Create menu items
        const menuItems = [
            {
                text: 'Start AWS Training',
                scene: 'sort_selection',
                description: 'Begin your AWS certification journey'
            },
            {
                text: 'Space Invaders Practice',
                scene: 'space_invaders',
                data: { nextScene: 'sort_selection' },
                description: 'Practice while defending against space invaders!'
            },
            {
                text: 'Skip to AWS Trainer',
                scene: 'map1scene1',
                description: 'Jump straight into AWS training'
            }
        ];

        let yPosition = 250;
        menuItems.forEach(item => {
            // Create button container
            const buttonContainer = this.add.container(400, yPosition);

            // Button background
            const buttonBg = this.add.rectangle(0, 0, 300, 60, 0x4a4a4a)
                .setInteractive({ useHandCursor: true });

            // Main text
            const menuText = this.add.text(0, -10, item.text, {
                fontFamily: 'Arial',
                fontSize: 24,
                color: '#ffffff',
            }).setOrigin(0.5);

            // Description text
            const descText = this.add.text(0, 15, item.description, {
                fontFamily: 'Arial',
                fontSize: 14,
                color: '#aaaaaa',
            }).setOrigin(0.5);

            // Add to container
            buttonContainer.add([buttonBg, menuText, descText]);

            // Hover effects
            buttonBg.on('pointerover', () => {
                buttonBg.setFillStyle(0x6a6a6a);
                this.tweens.add({
                    targets: buttonContainer,
                    scaleX: 1.1,
                    scaleY: 1.1,
                    duration: 200
                });
            });

            buttonBg.on('pointerout', () => {
                buttonBg.setFillStyle(0x4a4a4a);
                this.tweens.add({
                    targets: buttonContainer,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 200
                });
            });

            // Click handler
            buttonBg.on('pointerdown', () => {
                this.cameras.main.fadeOut(500);
                this.time.delayedCall(500, () => {
                    this.scene.start(item.scene, item.data);
                });
            });

            yPosition += 100;
        });

        // Version number
        this.add.text(16, this.game.config.height - 30, 'v0.0.1', {
            fontFamily: 'Arial',
            fontSize: 16,
            color: '#ffffff'
        });

        // Fade in effect
        this.cameras.main.fadeIn(1000);
    }

}