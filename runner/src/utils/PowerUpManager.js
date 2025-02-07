import { ProgressManager } from './ProgressManager';

export class PowerUpManager {
    constructor() {
        this.progressManager = new ProgressManager();
        this.POWERUP_TYPES = {
            LIFE: 1,      // 0001
            SHIELD: 2,    // 0010
            SPEED: 4,     // 0100
            FIRE: 8,      // 1000
            BULLET_SPEED: 16,  // 00010000
            CRAFT_SIZE: 32,    // 00100000
            POWER_UP_COLLECT: 64,  // 01000000
            BONUS_POINTS: 128      // 10000000
        };

        this.BASE_STATS = {
            health: 3,
            shield: 0,
            speed: 200,
            fireRate: 2,
            bulletSpeed: 400,
            craftSize: 1.0,
            powerUpCollectRadius: 50,
            pointsMultiplier: 1
        };

        // Load permanent power-ups from localStorage
        this.powerUpBitmask = this.loadPowerUps();

        // Track temporary power-ups separately
        this.tempPowerUps = {
            fireRate: 0,
            speed: 0,
            shield: 0,
            bulletSpeed: 0
        };

        // Track correct answers for current scene only
        this.sceneCorrectAnswers = 0;
    }

    loadPowerUps() {
        const saved = localStorage.getItem('powerUpState');
        if (saved) {
            return parseInt(saved, 10);
        }
        return 0;
    }

    savePowerUps() {
        localStorage.setItem('powerUpState', this.powerUpBitmask.toString());
        // Also save to progress manager for consistency
        this.progressManager.saveProgress({
            powerUpBitmask: this.powerUpBitmask
        });
    }

    applyUpgrade(upgradeType) {
        this.powerUpBitmask |= upgradeType;
        this.savePowerUps();
        return this.getUpgradedStats();
    }

    removeUpgrade(upgradeType) {
        this.powerUpBitmask &= ~upgradeType;
        this.savePowerUps();
        return this.getUpgradedStats();
    }

    hasUpgrade(upgradeType) {
        return (this.powerUpBitmask & upgradeType) !== 0;
    }

    getFireRate() {
        const baseFireRate = this.BASE_STATS.fireRate;
        const permanentBoost = this.hasUpgrade(this.POWERUP_TYPES.FIRE) ? baseFireRate * 0.5 : 0;
        const tempBoost = this.tempPowerUps.fireRate * 0.2 * baseFireRate; // Each temp boost increases by 20%
        return baseFireRate + permanentBoost + tempBoost;
    }

    handleCorrectAnswer() {
        this.sceneCorrectAnswers++;

        if (this.sceneCorrectAnswers >= 5) {
            this.sceneCorrectAnswers = 0;
            return this.applyRandomPermanentUpgrade();
        }
        return null;
    }

    applyRandomPermanentUpgrade() {
        const availableUpgrades = Object.values(this.POWERUP_TYPES)
            .filter(type => !this.hasUpgrade(type));

        if (availableUpgrades.length > 0) {
            const randomUpgrade = availableUpgrades[Math.floor(Math.random() * availableUpgrades.length)];
            this.applyUpgrade(randomUpgrade);
            return randomUpgrade;
        }
        return null;
    }

    getUpgradedStats() {
        const stats = { ...this.BASE_STATS };

        // Apply permanent upgrades
        if (this.hasUpgrade(this.POWERUP_TYPES.LIFE)) {
            stats.health += 2;
        }
        if (this.hasUpgrade(this.POWERUP_TYPES.SHIELD)) {
            stats.shield += 1;
        }
        if (this.hasUpgrade(this.POWERUP_TYPES.SPEED)) {
            stats.speed *= 1.25;
        }
        if (this.hasUpgrade(this.POWERUP_TYPES.FIRE)) {
            stats.fireRate = this.getFireRate();
        }
        if (this.hasUpgrade(this.POWERUP_TYPES.BULLET_SPEED)) {
            stats.bulletSpeed *= 1.5;
        }
        if (this.hasUpgrade(this.POWERUP_TYPES.CRAFT_SIZE)) {
            stats.craftSize *= 0.8;
        }
        if (this.hasUpgrade(this.POWERUP_TYPES.POWER_UP_COLLECT)) {
            stats.powerUpCollectRadius *= 1.5;
        }
        if (this.hasUpgrade(this.POWERUP_TYPES.BONUS_POINTS)) {
            stats.pointsMultiplier *= 1.5;
        }

        // Apply temporary power-ups
        stats.fireRate += (this.tempPowerUps.fireRate * 0.2 * this.BASE_STATS.fireRate);
        stats.speed += (this.tempPowerUps.speed * 50);
        stats.shield += this.tempPowerUps.shield;
        stats.bulletSpeed += (this.tempPowerUps.bulletSpeed * 100);

        return stats;
    }

    getPowerUpText() {
        const powerUps = [];
        Object.entries(this.POWERUP_TYPES).forEach(([name, value]) => {
            if (this.hasUpgrade(value)) {
                powerUps.push(`${name}+`);
            }
        });
        return powerUps.join(' ');
    }

    reset() {
        this.powerUpBitmask = 0;
        this.savePowerUps();
        return this.getUpgradedStats();
    }

    // Reset scene-specific tracking when entering a new scene
    resetSceneProgress() {
        this.sceneCorrectAnswers = 0;
        this.tempPowerUps = {
            fireRate: 0,
            speed: 0,
            shield: 0,
            bulletSpeed: 0
        };
    }

    // Add temporary power-up during Space Invaders game
    addTemporaryPowerUp(type, duration) {
        if (this.tempPowerUps.hasOwnProperty(type)) {
            this.tempPowerUps[type]++;
            return true;
        }
        return false;
    }

    // Remove temporary power-up
    removeTemporaryPowerUp(type) {
        if (this.tempPowerUps.hasOwnProperty(type) && this.tempPowerUps[type] > 0) {
            this.tempPowerUps[type]--;
            return true;
        }
        return false;
    }
} 