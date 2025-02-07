import { getAssetPath } from '@/utils/assetLoader';
import Phaser from 'phaser';
import { SceneTransition } from '@/utils/SceneTransition';
import { ProgressManager } from '@/utils/ProgressManager';

export default class MainMenu extends Phaser.Scene {
    constructor() {
        super({ key: 'mainmenu' });
        this.menuButtons = [];
        this.isTransitioning = false;
        console.log('MainMenu: Constructor called');
    }

    init(data) {
        console.log('MainMenu: Init called');
        // Initialize managers even if window.gameManager doesn't exist
        this.progressManager = window.gameManager?.progressManager || new ProgressManager();
        this.sceneTransition = window.gameManager?.sceneTransition || new SceneTransition(this.scene);
        this.menuButtons = [];
        this.isTransitioning = false;
    }

    preload() {
        console.log('MainMenu: Preload started');
        this.load.image('logo', getAssetPath('images/logo.png'));
        this.load.image('background', getAssetPath('images/background.png'));
    }

    create() {
        console.log('MainMenu: Create started');
        // Remove the early return and create the menu regardless
        this.add.image(400, 300, 'background').setDisplaySize(800, 600);
        this.add.image(400, 150, 'logo').setScale(0.5);

        this.createButtons();
        console.log('MainMenu: Create completed');
    }

    createButtons() {
        const buttons = [
            { text: 'New Game', y: 277, callback: () => this.startNewGame() },
            { text: 'Continue', y: 347, callback: () => this.continueGame() },
            { text: 'Sort Selection', y: 417, callback: () => this.startSortSelection() },
            { text: 'Space Invaders', y: 487, callback: () => this.startSpaceInvaders() }
        ];

        buttons.forEach(({ text, y, callback }) => {
            // Create button background
            const button = this.add.rectangle(400, y, 200, 40, 0x333333)
                .setInteractive({ useHandCursor: true });

            // Add hover effects
            button.on('pointerover', () => {
                button.setFillStyle(0x666666);
            });
            button.on('pointerout', () => {
                button.setFillStyle(0x333333);
            });
            button.on('pointerdown', callback);

            // Add button text
            const buttonText = this.add.text(400, y, text, {
                fontSize: '24px',
                fill: '#fff',
                backgroundColor: null
            }).setOrigin(0.5);

            this.menuButtons.push(button);
        });

        // Disable continue button if no save data
        if (!this.progressManager.loadProgress()?.lastCompletedScene) {
            this.menuButtons[1].setAlpha(0.5).disableInteractive();
        }
    }

    startNewGame() {
        if (this.isTransitioning) return;
        this.isTransitioning = true;
        console.log('Starting new game...');
        this.scene.start('trivia_master', {
            mapNumber: 1,
            sceneNumber: 1,
            isNewGame: true,
            score: 0,
            powerUpBitmask: 0,
            currentMap: 1
        });
    }

    continueGame() {
        if (this.isTransitioning) return;
        this.isTransitioning = true;
        console.log('Continuing game...');
        const savedData = this.progressManager.loadProgress();
        if (savedData?.lastCompletedScene) {
            // Parse the saved scene to get map and scene numbers
            const match = savedData.lastCompletedScene.match(/map(\d+)scene(\d+)/);
            if (match) {
                const [_, mapNumber, sceneNumber] = match;
                console.log('Continuing from:', { mapNumber, sceneNumber, savedData });
                this.scene.start('trivia_master', {
                    mapNumber: parseInt(mapNumber),
                    sceneNumber: parseInt(sceneNumber),
                    score: savedData.score,
                    powerUpBitmask: savedData.powerUpBitmask,
                    currentMap: savedData.currentMap
                });
            } else {
                console.warn('Invalid save format, starting new game');
                this.startNewGame();
            }
        } else {
            console.warn('No save data found, starting new game');
            this.startNewGame();
        }
    }

    startSortSelection() {
        if (this.isTransitioning) return;
        this.isTransitioning = true;
        this.sceneTransition.to(this, 'sort_selection', { fromMainMenu: true });
    }

    startSpaceInvaders() {
        if (this.isTransitioning) return;
        this.isTransitioning = true;
        this.sceneTransition.to(this, 'space_invaders', { fromMainMenu: true });
    }

    shutdown() {
        this.isTransitioning = false;
        this.menuButtons.forEach(button => button.destroy());
        this.menuButtons = [];
    }
}