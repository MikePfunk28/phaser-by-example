import { getAssetPath } from "@/utils/assetLoader";
import Player from '../gameobjects/player';
import Generator from '../gameobjects/generator';
import Phaser from 'phaser';

export class ProgressManager {
    constructor() {
        this.progress = {
            score: 0,
            powerUpBitmask: 0,
            currentMap: 1,
            lastCompletedScene: null,
            powerUpStats: {
                life: 3,
                craftSize: 1.0,
                speed: 200,
                bulletSpeed: 400,
                fireRate: 2
            }
        };
        this.loadProgress();
    }

    loadProgress() {
        try {
            const saved = localStorage.getItem('gameProgress');
            if (saved) {
                const loadedProgress = JSON.parse(saved);
                this.progress = {
                    ...this.progress,
                    ...loadedProgress
                };
            }
            return this.progress;
        } catch (error) {
            console.error('Error loading progress:', error);
            return this.progress;
        }
    }

    saveProgress(data = {}) {
        try {
            // Update progress with new data
            this.progress = {
                ...this.progress,
                ...data
            };

            // Update power-up stats based on bitmask
            this.updatePowerUpStats();

            // Save to localStorage
            localStorage.setItem('gameProgress', JSON.stringify(this.progress));
            return true;
        } catch (error) {
            console.error('Error saving progress:', error);
            return false;
        }
    }

    updatePowerUpStats() {
        // Reset stats to base values
        this.progress.powerUpStats = {
            life: 3,
            craftSize: 1.0,
            speed: 200,
            bulletSpeed: 400,
            fireRate: 2
        };

        // Apply power-ups based on bitmask
        if (this.progress.powerUpBitmask & 1) { // LIFE
            this.progress.powerUpStats.life += 2;
        }
        if (this.progress.powerUpBitmask & 2) { // CRAFT
            this.progress.powerUpStats.craftSize = 1.2;
        }
        if (this.progress.powerUpBitmask & 4) { // SPEED
            this.progress.powerUpStats.speed += 100;
        }
        if (this.progress.powerUpBitmask & 8) { // BULLETS
            this.progress.powerUpStats.bulletSpeed += 200;
            this.progress.powerUpStats.fireRate += 2;
        }
    }

    getPowerUpStats() {
        return this.progress.powerUpStats;
    }

    updateScore(points) {
        this.progress.score += points;
        this.saveProgress();
        return this.progress.score;
    }

    setCurrentMap(mapNumber) {
        this.progress.currentMap = mapNumber;
        this.saveProgress();
    }

    getCurrentMap() {
        return this.progress.currentMap;
    }

    setLastCompletedScene(sceneKey) {
        this.progress.lastCompletedScene = sceneKey;
        this.saveProgress();
    }

    getLastCompletedScene() {
        return this.progress.lastCompletedScene;
    }

    addPowerUp(powerUpType) {
        this.progress.powerUpBitmask |= powerUpType;
        this.updatePowerUpStats();
        this.saveProgress();
    }

    hasPowerUp(powerUpType) {
        return (this.progress.powerUpBitmask & powerUpType) !== 0;
    }

    resetProgress() {
        this.progress = {
            score: 0,
            powerUpBitmask: 0,
            currentMap: 1,
            lastCompletedScene: null,
            powerUpStats: {
                life: 3,
                craftSize: 1.0,
                speed: 200,
                bulletSpeed: 400,
                fireRate: 2
            }
        };
        this.saveProgress();
    }

    getProgress() {
        return { ...this.progress };
    }
}

// Singleton instance
const progressManager = new ProgressManager();
export default progressManager;