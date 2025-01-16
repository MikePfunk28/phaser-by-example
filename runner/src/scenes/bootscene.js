import { getAssetPath } from "../utils/assetLoader";
import * as Phaser from 'phaser';
import PreLoader from "./PreLoader"

export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'bootscene' });
    }

    preload() {
        // Show loading text
        const loadingText = this.add.text(400, 300, 'Loading...', {
            fontFamily: 'Arial',
            fontSize: 24,
            color: '#ffffff'
        }).setOrigin(0.5);

        // Create loading bar
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(240, 270, 320, 50);

        // Loading progress events
        this.load.on('progress', function (value) {
            progressBar.clear();
            progressBar.fillStyle(0x00ff00, 1);
            progressBar.fillRect(250, 280, 300 * value, 30);
        });

        this.load.on('complete', function () {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
        });
    }

    create() {
        // Transition to MainMenu scene
        this.scene.start('PreLoader');
    }
}