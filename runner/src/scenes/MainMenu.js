import { getAssetPath } from '@/utils/assetLoader';
import Phaser from 'phaser';
import { SceneTransition } from '@/utils/SceneTransition';
import { ProgressManager } from '@/utils/ProgressManager';

export default class MainMenu extends Phaser.Scene {
    constructor() {
        super({ key: 'mainmenu' });
        this.progressManager = window.progressManager;
        this.sceneTransition = window.sceneTransition;
    }

    preload() {
        // Load assets with correct filenames
        this.load.image('logo', getAssetPath('images/logo.png'));
        this.load.image('cloud-trainer', getAssetPath('images/Not_Used/AWS-Cloud-Trainer.webp'));
        this.load.image('background', getAssetPath('images/background.png'));
    }

    create() {
        // Add background
        const bg = this.add.image(400, 300, 'background');
        bg.setDisplaySize(800, 600);
        bg.setAlpha(0.5);

        // Add cloud trainer logo at the top
        const logo = this.add.image(400, 125, 'logo');
        logo.setScale(0.5);
        logo.setDepth(2);

        // Add title text below logo
        const title = this.add.text(400, 200, 'AWS Cloud Game', {
            fontSize: '64px',
            fill: '#fff',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 8
        });
        title.setOrigin(0.5);
        title.setDepth(2);

        // Create menu container
        const menuContainer = this.add.container(400, 300);
        menuContainer.setDepth(1);

        // Menu options with proper transitions
        const menuItems = [
            {
                text: 'Start New Game',
                callback: () => {
                    this.progressManager.resetProgress();
                    this.sceneTransition.to(this, 'sort_selection', {
                        score: 0,
                        powerUpBitmask: 0,
                        currentMap: 1
                    });
                }
            },
            {
                text: 'Continue',
                callback: () => {
                    const progress = this.progressManager.loadProgress();
                    if (progress && progress.lastCompletedScene) {
                        this.sceneTransition.to(this, progress.lastCompletedScene, {
                            score: progress.score || 0,
                            powerUpBitmask: progress.powerUpBitmask || 0,
                            currentMap: progress.currentMap || 1
                        });
                    } else {
                        // If no progress, start new game
                        this.sceneTransition.to(this, 'sort_selection', {
                            score: 0,
                            powerUpBitmask: 0,
                            currentMap: 1
                        });
                    }
                }
            },
            {
                text: 'Sort Selection',
                callback: () => {
                    this.sceneTransition.to(this, 'sort_selection', {
                        score: 0,
                        powerUpBitmask: 0,
                        currentMap: 1
                    });
                }
            },
            {
                text: 'Space Invaders',
                callback: () => {
                    this.sceneTransition.to(this, 'space_invaders', {
                        score: 0,
                        powerUpBitmask: 0,
                        nextScene: 'mainmenu'
                    });
                }
            }
        ];

        // Create menu buttons with proper spacing
        menuItems.forEach((item, index) => {
            const yOffset = index * 70; // Increased spacing between buttons
            const button = this.createButton(0, yOffset, item.text, item.callback);
            menuContainer.add(button);
        });

        // Add version text at bottom left
        const version = this.add.text(16, 570, 'v1.0.0', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        });
        version.setDepth(2);

        // Add fade-in transition
        this.cameras.main.fadeIn(500);
    }

    createButton(x, y, text, callback) {
        const button = this.add.container(x, y);

        // Create button background with green outline
        const bg = this.add.rectangle(0, 0, 300, 50, 0x333333);
        bg.setStrokeStyle(2, 0x00ff00);

        // Create button text
        const buttonText = this.add.text(0, 0, text, {
            fontSize: '24px',
            fill: '#fff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Add background and text to button container
        button.add([bg, buttonText]);

        // Make button interactive with hover effects
        bg.setInteractive({ useHandCursor: true })
            .on('pointerover', () => {
                bg.setFillStyle(0x666666);
                buttonText.setStyle({ fill: '#00ff00' });
            })
            .on('pointerout', () => {
                bg.setFillStyle(0x333333);
                buttonText.setStyle({ fill: '#ffffff' });
            })
            .on('pointerdown', () => {
                // Visual feedback
                bg.setFillStyle(0x00ff00);
                buttonText.setStyle({ fill: '#000000' });

                // Add a small delay before transition
                this.time.delayedCall(100, () => {
                    if (callback) callback();
                });
            });

        return button;
    }
}