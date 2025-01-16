import { getAssetPath } from "/src/utils/assetLoader";
import Player from '/src/gameobjects/player';
import Generator from '/src/gameobjects/generator';
import * as Phaser from 'phaser';
import SceneOrderManager from '/src/utils/SceneOrderManager';

export default class ProgressManager {
    constructor() {
        this.stats = {
            fireRate: 1,
            bulletSpeed: 400,
            multiShot: 1,
            score: 0
        };
        this.loadProgress();
    }

    loadProgress() {
        const saved = localStorage.getItem('gameProgress');
        if (saved) {
            this.stats = JSON.parse(saved);
        }
    }

    updateStats(score) {
        this.stats.score += score;
        // Level up based on score
        this.stats.fireRate = 1 + Math.floor(this.stats.score / 1000) * 0.1;
        this.stats.bulletSpeed = 400 + Math.floor(this.stats.score / 500) * 50;
        this.stats.multiShot = 1 + Math.floor(this.stats.score / 2000);

        localStorage.setItem('gameProgress', JSON.stringify(this.stats));
    }
}