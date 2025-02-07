// SpaceInvadersScene.js
import { getAssetPath } from "@/utils/assetLoader";
import { ProgressManager } from "@/utils/ProgressManager";
import { PowerUpManager } from "@/utils/PowerUpManager";
import Phaser from 'phaser';
import { SceneTransition } from "@/utils/SceneTransition";

export default class SpaceInvadersScene extends Phaser.Scene {
    constructor() {
        super({ key: 'space_invaders' });
        this.player = null;
        this.score = 0;
        this.scoreText = null;
        this.currentMap = 1;
        this.powerUpBitmask = 0;
        this.progressManager = null;
        this.sceneTransition = null;
        this.bullets = [];
        this.asteroids = [];
        this.satellites = [];
        this.powerUps = [];
        this.starSprites = [];  // Store star sprites for movement
        this.stars = [];        // Background stars array
        this.nextScene = null;
        this.fromScene = null;
        this.isPractice = false;
        this.baseHealth = 3;  // Fixed base health at 3
        this.health = 0;      // Starting health always 3
        this.isGameOver = false;
        this.lastAsteroidSpawn = 0;
        this.asteroidSpawnDelay = 2000; // Start with 2 seconds delay
        this.minAsteroidSpawnDelay = 800; // Minimum spawn delay
        this.asteroidSpeedMultiplier = 1; // Speed multiplier that increases over time
        this.tempBonuses = {
            shield: 0,
            speed: 0,
            fireRate: 0
        };
        this.powerUpManager = new PowerUpManager();

        // Base stats
        const BASE_SPEED = 200;
        const BASE_FIRE_RATE = 2;
        const BASE_BULLET_SPEED = 400;

        // Initialize upgrades based on powerUpBitmask
        this.upgrades = {
            health: 3,
            shield: (this.powerUpBitmask & 2) ? 1 : 0,
            speed: BASE_SPEED + ((this.powerUpBitmask & 4) ? BASE_SPEED * 0.25 : 0),
            fireRate: BASE_FIRE_RATE + ((this.powerUpBitmask & 8) ? BASE_FIRE_RATE * 0.5 : 0),
            bulletSpeed: BASE_BULLET_SPEED + ((this.powerUpBitmask & 8) ? BASE_BULLET_SPEED * 0.25 : 0),
            craftSize: (this.powerUpBitmask & 2) ? 0.8 : 1.0
        };

        // Create stars for background
        for (let i = 0; i < 100; i++) {
            this.stars.push({
                x: Phaser.Math.Between(0, 800),
                y: Phaser.Math.Between(0, 600),
                speed: Phaser.Math.Between(50, 150),
                char: ['.', '*', '+', '·', '°'][Phaser.Math.Between(0, 4)]
            });
        }
    }

    init(data) {
        this.progressManager = window.progressManager;
        this.sceneTransition = window.sceneTransition;
        this.powerUpManager = new PowerUpManager();

        const stats = this.powerUpManager.getUpgradedStats();
        this.score = data?.score || 0;
        this.baseHealth = stats.health;  // Always start with 3 health
        this.health = this.baseHealth;
        this.upgrades = stats;
        this.asteroidSpeedMultiplier = 1;
        this.lastAsteroidSpawn = 0;
        this.asteroidSpawnDelay = 2000;

        // Store transition data
        this.nextScene = data?.nextScene || 'mainmenu';
        this.fromScene = data?.fromScene;
        this.fromMainMenu = this.fromScene === 'mainmenu';

        this.powerUpManager.resetSceneProgress();
        this.resetGame();
        this.cameras.main.fadeIn(500);
    }

    resetGame() {
        this.player = {
            x: this.width / 2,
            y: this.height - 80,
            width: 60,
            height: 40,
            lives: this.upgrades.health,
            shield: this.upgrades.shield,
            score: 0,
            speed: 300,
            fireRate: this.upgrades.fireRate,
            bulletSpeed: this.upgrades.bulletSpeed,
            multiShot: this.upgrades.multiShot
        };
        this.bullets = [];
        this.asteroids = [];
        this.satellites = [];
        this.powerUps = [];
        this.score = 0;
        this.scoreText = null;
        this.powerUpText = null;
        this.isGameOver = false;
        this.powerUpTypes = {
            LIFE: 1,
            CRAFT: 2,
            SPEED: 4,
            BULLETS: 8
        };
        this.powerUpStats = {
            life: 3,
            craftSize: 1.0,
            speed: 200,
            bulletSpeed: 400,
            fireRate: 2
        };
        this.sceneTransition = new SceneTransition();
    }

    preload() {
        // Load sound effects
        this.load.audio('shoot', getAssetPath('sounds/laser.mp3'));
        this.load.audio('explosion', getAssetPath('sounds/dead.mp3'));
        this.load.audio('powerup', getAssetPath('sounds/jump.mp3'));
        this.load.audio('satellite_destroy', getAssetPath('sounds/satellite_destroy.mp3'));
        this.load.audio('buzzer', getAssetPath('sounds/boowomp.mp3'));
    }

    create() {
        const patterns = (count) => {
            ['↑', '||', '/\\', '/|\\', '/||\\'];
            return patterns[Math.min(count - 1, patterns.length - 1)] || '';
        };
        this.gameStarted = false;

        // Create star field background
        this.stars.forEach(star => {
            const starSprite = this.add.text(star.x, star.y, star.char, {
                fontFamily: 'Courier',
                fontSize: star.char === '*' ? '16px' : '12px',
                fill: '#ffffff'
            }).setAlpha(0.5);
            starSprite.speed = star.speed;
            this.starSprites.push(starSprite);
        });

        // Base ship design
        const baseShipText = [
            '^',
            '/|\\',
            '<=+=>',
            '\\|/'
        ];

        // Create player container
        this.player = this.add.container(400, 500);

        baseShipText.forEach((line, i) => {
            const text = this.add.text(0, i * 14, line, {
                fontFamily: 'Courier',
                fontSize: '16px',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5);
            this.player.add(text);
        });

        this.updateShieldVisuals();
        this.player.setScale(this.upgrades.craftSize);

        // Setup input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasdKeys = {
            left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
        };
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.lastShot = 0;

        // Create HUD
        this.createHUD();

        // Start game loop after a delay
        this.time.delayedCall(500, () => {
            this.gameStarted = true;
            this.startGameLoop();
        });

        this.cameras.main.fadeIn(500);

        // Initialize power-up tracking
        this.powerUpManager = this.scene.get('PowerUpManager');
        this.tempPowerUps = {
            shield: 0,
            speed: 0,
            fireRate: 0,
            bulletSpeed: 0
        };

        // Apply any existing shield upgrades
        const stats = this.powerUpManager.getUpgradedStats();
        if (stats.shield > 0) {
            this.tempPowerUps.shield = stats.shield;
            this.updateShieldDisplay();
        }
    }

    createHUD() {
        const hudBg = this.add.rectangle(400, 40, 780, 60, 0x000000, 0.5);
        hudBg.setDepth(100);

        this.scoreText = this.add.text(16, 16, `Score: ${this.score}`, {
            fontSize: '32px',
            fill: '#fff',
            fontFamily: 'Courier'
        }).setDepth(101);

        this.powerUpText = this.add.text(16, 56, `Power-ups: ${this.getPowerUpText()}`, {
            fontSize: '24px',
            fill: '#00ff00',
            fontFamily: 'Courier'
        }).setDepth(101);

        this.healthText = this.add.text(16, 96, `Health: ${this.health}`, {
            fontSize: '24px',
            fill: '#ff0000',
            fontFamily: 'Courier'
        }).setDepth(101);

        if (this.upgrades.shield > 0) {
            this.shieldText = this.add.text(200, 96, `Shield: ${this.upgrades.shield}`, {
                fontSize: '24px',
                fill: '#0000ff',
                fontFamily: 'Courier'
            }).setDepth(101);
        }
    }

    getPowerUpText() {
        const powerUps = [];
        if (this.powerUpBitmask & 1) powerUps.push('Life+');
        if (this.powerUpBitmask & 2) powerUps.push('Shield+');
        if (this.powerUpBitmask & 4) powerUps.push('Speed+');
        if (this.powerUpBitmask & 8) powerUps.push('Fire+');
        return powerUps.join(' ');
    }

    startGameLoop() {
        const progress = this.progressManager ? this.progressManager.loadProgress() : null;
        const currentLevel = progress ? progress.currentMap || 1 : 1;

        // Dynamic asteroid spawning based on time
        this.time.addEvent({
            delay: 100, // Check every 100ms
            callback: () => {
                if (!this.isGameOver) {
                    const currentTime = this.time.now;
                    if (currentTime - this.lastAsteroidSpawn >= this.asteroidSpawnDelay) {
                        this.spawnAsteroid();
                        this.lastAsteroidSpawn = currentTime;
                        // Decrease spawn delay and increase speed over time
                        this.asteroidSpawnDelay = Math.max(this.minAsteroidSpawnDelay, this.asteroidSpawnDelay * 0.98);
                        this.asteroidSpeedMultiplier *= 1.01;
                    }
                }
            },
            loop: true
        });

        this.powerUpTimer = this.time.addEvent({
            delay: 15000,
            callback: () => {
                if (!this.isGameOver && Math.random() < 0.5) { // Reduced power-up spawn chance
                    this.spawnPowerUp();
                }
            },
            loop: true
        });

        const baseDelay = Math.max(8000 - (currentLevel * 1000), 4000); // Faster satellite spawning
        this.satelliteTimer = this.time.addEvent({
            delay: baseDelay,
            callback: () => {
                if (!this.isGameOver) {
                    const count = Math.min(currentLevel + 1, 4); // More satellites based on level
                    for (let i = 0; i < count; i++) {
                        this.time.delayedCall(i * 400, () => this.spawnSatellite());
                    }
                }
            },
            loop: true
        });
    }

    spawnPowerUp() {
        const bonusTypes = [
            { type: 'temp_shield', char: 'S', color: '#00ffff', duration: 15000 },
            { type: 'temp_speed', char: '>', color: '#00ff00', duration: 10000 },
            { type: 'temp_fire', char: '!', color: '#ffff00', duration: 12000 }
        ];

        const bonus = bonusTypes[Phaser.Math.Between(0, bonusTypes.length - 1)];

        const powerUpSprite = this.add.text(
            Phaser.Math.Between(40, 760),
            -20,
            bonus.char,
            {
                fontFamily: 'Courier',
                fontSize: '24px',
                fill: bonus.color
            }
        ).setOrigin(0.5);

        this.powerUps.push({
            sprite: powerUpSprite,
            type: bonus.type,
            duration: bonus.duration,
            speed: 100
        });
    }

    shoot() {
        const currentTime = this.time.now;
        const fireDelay = 1000 / this.powerUpManager.getFireRate();

        if (currentTime - this.lastShot >= fireDelay) {
            this.lastShot = currentTime;

            const stats = this.powerUpManager.getUpgradedStats();
            const baseFireRate = this.powerUpManager.BASE_STATS.fireRate;
            const numBullets = Math.min(5, Math.max(1, Math.floor((stats.fireRate - baseFireRate) / 2) + 1));

            let bulletPattern;
            switch (numBullets) {
                case 1:
                    bulletPattern = [{ char: '↑', offset: 0 }];
                    break;
                case 2:
                    bulletPattern = [
                        { char: '↑', offset: -8 },
                        { char: '↑', offset: 8 }
                    ];
                    break;
                case 3:
                    bulletPattern = [
                        { char: '↗', offset: -16 },
                        { char: '↑', offset: 0 },
                        { char: '↖', offset: 16 }
                    ];
                    break;
                case 4:
                    bulletPattern = [
                        { char: '↖', offset: -24 },
                        { char: '↑', offset: -8 },
                        { char: '↑', offset: 8 },
                        { char: '↗', offset: 24 }
                    ];
                    break;
                case 5:
                    bulletPattern = [
                        { char: '↖', offset: -32 },
                        { char: '↖', offset: -16 },
                        { char: '↑', offset: 0 },
                        { char: '↗', offset: 16 },
                        { char: '↗', offset: 32 }
                    ];
                    break;
            }

            bulletPattern.forEach(pattern => {
                const bullet = this.add.text(
                    this.player.x + pattern.offset,
                    this.player.y - 20,
                    pattern.char,
                    {
                        fontFamily: 'Arial',
                        fontSize: '24px',
                        fill: '#ffffff',
                        stroke: '#00ff00',
                        strokeThickness: 2
                    }
                ).setOrigin(0.5);

                bullet.setBlendMode(Phaser.BlendModes.ADD);
                bullet.preFX.addGlow(0x00ff00, 4);
                bullet.setData('speed', -this.upgrades.bulletSpeed);
                this.bullets.push(bullet);
            });

            this.sound.play('shoot', { volume: 0.5 });
        }
    }

    update(time, delta) {
        if (!this.gameStarted || this.isGameOver) return;

        this.starSprites.forEach(star => {
            star.y += (star.speed * delta) / 1000;
            if (star.y > 600) {
                star.y = -10;
                star.x = Phaser.Math.Between(0, 800);
            }
        });

        const currentStats = this.getPlayerStats();

        if (this.bullets && this.bullets.length) {
            this.updateBullets(delta);
        }

        if (this.asteroids && this.asteroids.length) {
            this.updateAsteroids(delta);
        }

        if (this.satellites && this.satellites.length) {
            this.updateSatellites(delta);
        }

        if (this.powerUps && this.powerUps.length) {
            this.updatePowerUps(delta);
        }

        if (this.player) {
            const moveSpeed = currentStats.speed * (delta / 1000);

            if (this.cursors.left.isDown || this.wasdKeys.left.isDown) {
                this.player.x = Math.max(30, this.player.x - moveSpeed);
            }
            if (this.cursors.right.isDown || this.wasdKeys.right.isDown) {
                this.player.x = Math.min(770, this.player.x + moveSpeed);
            }

            if (this.spaceKey.isDown && time > this.lastShot + (1000 / currentStats.fireRate)) {
                this.shoot();
                this.lastShot = time;
            }
        }

        this.checkCollisions();
    }

    applyPowerUps() {
        this.powerUpStats = {
            life: 3,
            craftSize: 1.0,
            speed: 200,
            bulletSpeed: 400,
            fireRate: 2
        };

        if (this.powerUpBitmask & this.powerUpTypes.LIFE) {
            this.powerUpStats.life += 2;
        }
        if (this.powerUpBitmask & this.powerUpTypes.CRAFT) {
            this.powerUpStats.craftSize = 1.2;
        }
        if (this.powerUpBitmask & this.powerUpTypes.SPEED) {
            this.powerUpStats.speed += 100;
        }
        if (this.powerUpBitmask & this.powerUpTypes.BULLETS) {
            this.powerUpStats.bulletSpeed += 200;
            this.powerUpStats.fireRate += 2;
        }

        this.updatePowerUpText();
    }

    updatePowerUpText() {
        const activeUpgrades = [];
        if (this.powerUpBitmask & this.powerUpTypes.LIFE) activeUpgrades.push('Life+');
        if (this.powerUpBitmask & this.powerUpTypes.CRAFT) activeUpgrades.push('Size+');
        if (this.powerUpBitmask & this.powerUpTypes.SPEED) activeUpgrades.push('Speed+');
        if (this.powerUpBitmask & this.powerUpTypes.BULLETS) activeUpgrades.push('Fire+');

        if (this.powerUpText) {
            this.powerUpText.setText('Power-ups: ' + activeUpgrades.join(' '));
        }
    }

    updateBullets(delta) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.y += bullet.getData('speed') * delta / 1000;
            if (bullet.y < -10) {
                bullet.destroy();
                this.bullets.splice(i, 1);
            }
        }
    }

    spawnAsteroid() {
        const asteroidDesigns = [
            [' /==\\ ',
                '|====|',
                ' \\==/ '],
            ['  /\\  ',
                '<====>',
                '  \\/  '],
            [' /##\\ ',
                '{####}',
                ' \\##/ '],
            [' /-\\ ',
                '{***}',
                ' \\-/ ']
        ];

        const design = asteroidDesigns[Phaser.Math.Between(0, asteroidDesigns.length - 1)];
        const container = this.add.container(
            Phaser.Math.Between(40, 760),
            -40
        );

        design.forEach((line, i) => {
            const text = this.add.text(0, i * 16, line, {
                fontFamily: 'Courier',
                fontSize: '24px',
                fill: '#cccccc',
                stroke: '#666666',
                strokeThickness: 1
            }).setOrigin(0.5);
            container.add(text);
        });

        this.asteroids.push({
            sprite: container,
            speed: Phaser.Math.Between(150, 300) * this.asteroidSpeedMultiplier, // Faster asteroids
            rotationSpeed: Phaser.Math.Between(-3, 3),
            type: 'asteroid'
        });
    }

    updateAsteroids(delta) {
        for (let i = this.asteroids.length - 1; i >= 0; i--) {
            const asteroid = this.asteroids[i];
            asteroid.sprite.y += (asteroid.speed * delta) / 1000;
            asteroid.sprite.rotation += (asteroid.rotationSpeed * delta) / 1000;
            if (asteroid.sprite.y > 620) {
                asteroid.sprite.destroy();
                this.asteroids.splice(i, 1);
            }
        }
    }

    spawnSatellite() {
        const satelliteTypes = [
            { pattern: 'sine', char: '[-o-]', color: '#ff0000', speed: 200 },
            { pattern: 'zigzag', char: '{=o=}', color: '#ff3300', speed: 250 },
            { pattern: 'chase', char: '<-o->', color: '#ff6600', speed: 300 }
        ];

        const type = satelliteTypes[Phaser.Math.Between(0, satelliteTypes.length - 1)];
        const satellite = this.add.text(
            Phaser.Math.Between(40, 760),
            -20,
            type.char,
            {
                fontFamily: 'Courier',
                fontSize: '20px',
                fill: type.color,
                stroke: '#000000',
                strokeThickness: 1
            }
        ).setOrigin(0.5);

        this.satellites.push({
            sprite: satellite,
            speed: type.speed + Phaser.Math.Between(0, 50),
            horizontalSpeed: Phaser.Math.Between(-150, 150),
            pattern: type.pattern,
            type: 'satellite',
            timeOffset: Date.now()
        });
    }

    updateSatellites(delta) {
        for (let i = this.satellites.length - 1; i >= 0; i--) {
            const satellite = this.satellites[i];
            satellite.sprite.y += (satellite.speed * delta) / 1000;

            switch (satellite.pattern) {
                case 'sine':
                    const frequency = 0.003;
                    const amplitude = 100;
                    satellite.sprite.x = satellite.sprite.x +
                        Math.sin((Date.now() - satellite.timeOffset) * frequency) *
                        (delta / 1000) * amplitude;
                    break;
                case 'zigzag':
                    if (!satellite.direction) satellite.direction = 1;
                    satellite.sprite.x += satellite.direction * (150 * delta / 1000);
                    if (satellite.sprite.x < 40 || satellite.sprite.x > 760) {
                        satellite.direction *= -1;
                    }
                    break;
                case 'chase':
                    if (this.player) {
                        const dx = this.player.x - satellite.sprite.x;
                        satellite.sprite.x += Math.sign(dx) * (100 * delta / 1000);
                    }
                    break;
            }

            satellite.sprite.x = Phaser.Math.Clamp(satellite.sprite.x, 40, 760);

            if (satellite.sprite.y > 620) {
                satellite.sprite.destroy();
                this.satellites.splice(i, 1);
            }
        }
    }

    updatePowerUps(delta) {
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            powerUp.sprite.y += powerUp.speed * (delta / 1000);
            if (powerUp.sprite.y > this.height + 50) {
                powerUp.sprite.destroy();
                this.powerUps.splice(i, 1);
            }
        }
    }

    collectPowerUp(powerUp) {
        this.score += 25;
        this.scoreText.setText(`Score: ${this.score}`);

        switch (powerUp.type) {
            case 'temp_shield':
                this.powerUpManager.addTemporaryPowerUp('shield', powerUp.duration);
                this.updateShieldDisplay();
                this.time.delayedCall(powerUp.duration, () => {
                    this.powerUpManager.removeTemporaryPowerUp('shield');
                    this.updateShieldDisplay();
                });
                break;
            case 'temp_speed':
                this.powerUpManager.addTemporaryPowerUp('speed', powerUp.duration);
                this.time.delayedCall(powerUp.duration, () => {
                    this.powerUpManager.removeTemporaryPowerUp('speed');
                });
                break;
            case 'temp_fire':
                this.powerUpManager.addTemporaryPowerUp('fireRate', powerUp.duration);
                this.time.delayedCall(powerUp.duration, () => {
                    this.powerUpManager.removeTemporaryPowerUp('fireRate');
                });
                break;
        }

        this.sound.play('powerup', { volume: 0.5 });
        powerUp.sprite.destroy();

        const bonusText = this.add.text(powerUp.sprite.x, powerUp.sprite.y, '+25', {
            fontFamily: 'Courier',
            fontSize: '24px',
            fill: '#00ff00',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        this.tweens.add({
            targets: bonusText,
            y: bonusText.y - 50,
            alpha: 0,
            duration: 1000,
            onComplete: () => bonusText.destroy()
        });
    }

    updateBonusText() {
        const bonuses = [];
        if (this.tempBonuses.shield > 0) bonuses.push(`Shield(${this.tempBonuses.shield})`);
        if (this.tempBonuses.speed > 0) bonuses.push(`Speed(${this.tempBonuses.speed}×)`);
        if (this.tempBonuses.fireRate > 0) bonuses.push(`Fire(${this.tempBonuses.fireRate}×)`);

        if (this.powerUpText) {
            this.powerUpText.setText('Active Bonuses: ' + (bonuses.length ? bonuses.join(' ') : 'None'));
        }
    }

    getPlayerStats() {
        return this.powerUpManager.getUpgradedStats();
    }

    checkCollisions() {
        this.bullets = this.bullets.filter(bullet => bullet && !bullet.destroyed);
        this.asteroids = this.asteroids.filter(asteroid => asteroid && asteroid.sprite && !asteroid.sprite.destroyed);
        this.satellites = this.satellites.filter(satellite => satellite && satellite.sprite && !satellite.sprite.destroyed);

        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            if (!bullet || bullet.destroyed) continue;

            for (let j = this.asteroids.length - 1; j >= 0; j--) {
                const asteroid = this.asteroids[j];
                if (!asteroid || !asteroid.sprite || asteroid.sprite.destroyed) continue;

                if (this.checkOverlap(bullet, asteroid.sprite)) {
                    this.handleCollision(bullet, asteroid, 10);
                    break;
                }
            }

            if (bullet.destroyed) continue;

            for (let j = this.satellites.length - 1; j >= 0; j--) {
                const satellite = this.satellites[j];
                if (!satellite || !satellite.sprite || satellite.sprite.destroyed) continue;

                if (this.checkOverlap(bullet, satellite.sprite)) {
                    this.handleCollision(bullet, satellite, 20);
                    break;
                }
            }
        }

        if (this.player && !this.player.destroyed) {
            for (let i = this.asteroids.length - 1; i >= 0; i--) {
                const asteroid = this.asteroids[i];
                if (!asteroid || !asteroid.sprite || asteroid.sprite.destroyed) continue;

                if (this.checkOverlap(this.player, asteroid.sprite)) {
                    asteroid.sprite.destroy();
                    this.asteroids.splice(i, 1);
                    this.handlePlayerHit();
                }
            }

            for (let i = this.satellites.length - 1; i >= 0; i--) {
                const satellite = this.satellites[i];
                if (!satellite || !satellite.sprite || satellite.sprite.destroyed) continue;

                if (this.checkOverlap(this.player, satellite.sprite)) {
                    satellite.sprite.destroy();
                    this.satellites.splice(i, 1);
                    this.handlePlayerHit();
                }
            }

            for (let i = this.powerUps.length - 1; i >= 0; i--) {
                const powerUp = this.powerUps[i];
                if (!powerUp || !powerUp.sprite || powerUp.sprite.destroyed) continue;

                if (this.checkOverlap(this.player, powerUp.sprite)) {
                    this.collectPowerUp(powerUp);
                    this.powerUps.splice(i, 1);
                }
            }
        }
    }

    handlePlayerHit() {
        if (this.isInvulnerable) return;

        // Get current stats including shield
        const stats = this.powerUpManager.getUpgradedStats();

        if (stats.shield > 0) {
            // If we have shield, absorb the hit and show shield effect
            this.showShieldEffect();
            // Reduce shield count
            this.powerUpManager.tempPowerUps.shield = Math.max(0, this.powerUpManager.tempPowerUps.shield - 1);

            // Add score penalty for shield break
            this.score = Math.max(0, this.score - 25);
            this.scoreText.setText(`Score: ${this.score}`);

            // Show penalty text
            const penaltyText = this.add.text(this.player.x, this.player.y - 60, '-25 SHIELD BREAK!', {
                fontFamily: 'Courier',
                fontSize: '24px',
                fill: '#ff0000',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5);

            this.tweens.add({
                targets: penaltyText,
                y: penaltyText.y - 50,
                alpha: 0,
                duration: 1000,
                onComplete: () => penaltyText.destroy()
            });
            return;
        }

        // No shield, take damage
        this.health--;
        this.showDamageEffect();

        if (this.health <= 0) {
            this.handleGameOver();
        } else {
            // Make player temporarily invulnerable
            this.isInvulnerable = true;
            this.player.setAlpha(0.5);
            this.time.delayedCall(1000, () => {
                this.isInvulnerable = false;
                this.player.setAlpha(1);
            });
        }
    }

    showDamageEffect() {
        if (this.player && this.player.list) {
            this.player.list.forEach(child => {
                if (child.setFillStyle) {
                    child.setFillStyle('#ff0000');
                    this.time.delayedCall(100, () => {
                        child.setFillStyle('#ffffff');
                    });
                }
            });
        }
    }

    showShieldEffect() {
        // Create shield visual effect
        const shield = this.add.circle(this.player.x, this.player.y, 40, 0x00ff00, 0.3);
        shield.setStrokeStyle(2, 0x00ff00);

        // Add shield break text
        const shieldText = this.add.text(this.player.x, this.player.y - 40, 'SHIELD BREAK!', {
            fontFamily: 'Courier',
            fontSize: '24px',
            fill: '#00ffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        // Animate shield effect
        this.tweens.add({
            targets: [shield, shieldText],
            alpha: 0,
            scale: 1.5,
            duration: 500,
            onComplete: () => {
                shield.destroy();
                shieldText.destroy();
            }
        });

        // Play shield sound if available
        if (this.sound.get('shield')) {
            this.sound.play('shield', { volume: 0.3 });
        }

        // Update shield display
        this.updateShieldDisplay();
    }

    checkOverlap(spriteA, spriteB) {
        if (!spriteA || !spriteB) return false;

        let boundsA, boundsB;

        if (spriteA.list && spriteA.list.length > 0) {
            boundsA = spriteA.getBounds();
        } else {
            boundsA = spriteA.getBounds();
        }

        if (spriteB.list && spriteB.list.length > 0) {
            boundsB = spriteB.getBounds();
        } else {
            boundsB = spriteB.getBounds();
        }

        if (!boundsA || !boundsB) return false;

        return Phaser.Geom.Rectangle.Overlaps(boundsA, boundsB);
    }

    showGameOver() {
        if (this.isGameOver || !this.gameStarted) return;
        this.isGameOver = true;

        this.clearGameEntities();

        const overlay = this.add.rectangle(0, 0, this.game.config.width, this.game.config.height, 0x000000, 0);
        overlay.setOrigin(0).setDepth(1000);

        this.tweens.add({
            targets: overlay,
            alpha: 0.7,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                if (this.sceneTransition) {
                    if (this.fromMainMenu) {
                        this.sceneTransition.toMainMenu(this, {
                            score: this.score,
                            powerUpBitmask: this.powerUpManager.powerUpBitmask,
                            currentMap: this.currentMap
                        });
                    } else if (this.nextScene) {
                        this.sceneTransition.to(this, this.nextScene, {
                            score: this.score,
                            powerUpBitmask: this.powerUpManager.powerUpBitmask,
                            currentMap: this.currentMap,
                            fromSpaceInvaders: true
                        });
                    } else {
                        const nextScene = this.sceneTransition.getNextTransition(this.scene.key, 'space_invaders');
                        this.sceneTransition.to(this, nextScene || 'mainmenu', {
                            score: this.score,
                            powerUpBitmask: this.powerUpManager.powerUpBitmask,
                            currentMap: this.currentMap,
                            fromSpaceInvaders: true
                        });
                    }
                } else {
                    this.transitionToScene(this.nextScene || 'mainmenu');
                }
            }
        });
    }

    clearGameEntities() {
        this.asteroids?.forEach(asteroid => asteroid.sprite?.destroy());
        this.satellites?.forEach(satellite => satellite.sprite?.destroy());
        this.bullets?.forEach(bullet => bullet.destroy());
        this.powerUps?.forEach(powerUp => powerUp.sprite?.destroy());

        this.asteroids = [];
        this.satellites = [];
        this.bullets = [];
        this.powerUps = [];
    }

    updateShieldVisuals() {
        // Remove all existing shield layers
        this.player.list.forEach(child => {
            if (child.shieldLayer) {
                child.destroy();
            }
        });

        // Get current shield count
        const currentStats = this.getPlayerStats();
        const totalShields = this.tempBonuses.shield + (this.upgrades.shield || 0);

        // Only add shield visuals if we actually have shields
        if (totalShields > 0) {
            for (let i = 0; i < totalShields; i++) {
                const shieldOffset = (i + 1) * 4;
                const shieldColor = i < this.upgrades.shield ? '#4444ff' : '#44ffff';

                const topShield = this.add.text(0, -2 - shieldOffset, `/${' '.repeat(2 + i)}\\`, {
                    fontFamily: 'Courier',
                    fontSize: '16px',
                    fill: shieldColor,
                    stroke: '#000000',
                    strokeThickness: 1
                }).setOrigin(0.5);
                topShield.shieldLayer = true;
                this.player.add(topShield);

                const bottomShield = this.add.text(0, 44 + shieldOffset, `\\${' '.repeat(2 + i)}/`, {
                    fontFamily: 'Courier',
                    fontSize: '16px',
                    fill: shieldColor,
                    stroke: '#000000',
                    strokeThickness: 1
                }).setOrigin(0.5);
                bottomShield.shieldLayer = true;
                this.player.add(bottomShield);

                const sideOffset = 20 + (i * 4);
                const leftShield = this.add.text(-sideOffset, 20, ')', {
                    fontFamily: 'Courier',
                    fontSize: '16px',
                    fill: shieldColor,
                    stroke: '#000000',
                    strokeThickness: 1
                }).setOrigin(0.5);
                leftShield.shieldLayer = true;
                this.player.add(leftShield);

                const rightShield = this.add.text(sideOffset, 20, '(', {
                    fontFamily: 'Courier',
                    fontSize: '16px',
                    fill: shieldColor,
                    stroke: '#000000',
                    strokeThickness: 1
                }).setOrigin(0.5);
                rightShield.shieldLayer = true;
                this.player.add(rightShield);
            }
        }
    }

    handleCollision(bullet, target, points) {
        bullet.destroy();
        target.sprite.destroy();

        if (target.type === 'satellite') {
            this.score = Math.max(0, this.score - 75); // Bigger penalty for hitting satellites
            this.scoreText.setText(`Score: ${this.score}`);

            this.health -= 2; // Take 2 damage from hitting satellites
            this.healthText.setText(`Health: ${this.health}`);

            if (this.health <= 0) {
                this.showGameOver();
                return;
            }

            this.showDamageEffect();
            this.sound.play('satellite_destroy', { volume: 0.5 });

            const penaltyText = this.add.text(target.sprite.x, target.sprite.y, '-75 CRITICAL! -2 HP', {
                fontFamily: 'Courier',
                fontSize: '24px',
                fill: '#ff0000',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5);

            this.tweens.add({
                targets: penaltyText,
                y: penaltyText.y - 50,
                alpha: 0,
                duration: 1000,
                onComplete: () => penaltyText.destroy()
            });
        } else {
            // Reduced chance for permanent upgrades
            if (Math.random() < 0.03) { // 3% chance instead of 5%
                const upgrade = this.powerUpManager.applyRandomPermanentUpgrade();
                if (upgrade) {
                    this.showUpgradeNotification(upgrade);
                }
            }

            const explosion = [
                '\\   /',
                ' \\*/ ',
                '* * *',
                ' /*\\ ',
                '/   \\'
            ];

            const explosionContainer = this.add.container(target.sprite.x, target.sprite.y);
            explosionContainer.setDepth(100);

            explosion.forEach((line, i) => {
                const text = this.add.text(0, (i - 2) * 16, line, {
                    fontFamily: 'Courier',
                    fontSize: '24px',
                    fill: '#ffff00',
                    stroke: '#ff4400',
                    strokeThickness: 2
                }).setOrigin(0.5);

                explosionContainer.add(text);
            });

            this.tweens.add({
                targets: explosionContainer,
                alpha: 0,
                duration: 400,
                delay: 100,
                onComplete: () => explosionContainer.destroy()
            });

            this.score += points;
            this.scoreText.setText(`Score: ${this.score}`);
            this.sound.play('explosion', { volume: 0.3 });
        }

        const bulletIndex = this.bullets.indexOf(bullet);
        if (bulletIndex > -1) {
            this.bullets.splice(bulletIndex, 1);
        }

        const targetIndex = target.type === 'asteroid' ?
            this.asteroids.indexOf(target) :
            this.satellites.indexOf(target);
        if (targetIndex > -1) {
            if (target.type === 'asteroid') {
                this.asteroids.splice(targetIndex, 1);
            } else {
                this.satellites.splice(targetIndex, 1);
            }
        }
    }

    showUpgradeNotification(upgradeType) {
        const upgradeNames = {
            [this.powerUpManager.POWERUP_TYPES.LIFE]: 'LIFE UPGRADE!',
            [this.powerUpManager.POWERUP_TYPES.SHIELD]: 'SHIELD UPGRADE!',
            [this.powerUpManager.POWERUP_TYPES.SPEED]: 'SPEED UPGRADE!',
            [this.powerUpManager.POWERUP_TYPES.FIRE]: 'FIRE RATE UPGRADE!'
        };

        const notification = this.add.text(400, 300, upgradeNames[upgradeType], {
            fontSize: '32px',
            fill: '#00ff00',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(1000);

        this.tweens.add({
            targets: notification,
            y: 200,
            alpha: 0,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => notification.destroy()
        });
    }

    transitionToNextScene() {
        if (this.isTransitioning) return;
        this.isTransitioning = true;

        const match = this.nextScene?.match(/map(\d+)scene(\d+)/);
        if (!match) {
            console.error('Invalid next scene format:', this.nextScene);
            return;
        }

        const [_, mapNumber, sceneNumber] = match;

        this.scene.start('trivia_master', {
            mapNumber: parseInt(mapNumber),
            sceneNumber: parseInt(sceneNumber),
            score: this.score,
            powerUpBitmask: this.powerUpBitmask,
            currentMap: this.currentMap
        });
    }

    showQuestion(question, iconSprite) {
        // Create semi-transparent background overlay
        const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.8)
            .setOrigin(0.5)
            .setDepth(100);

        // Create question container
        const container = this.add.container(400, 300);
        container.setDepth(101);

        // Add question text with word wrap
        const questionText = this.add.text(0, -100, question.question, {
            fontSize: '24px',
            fill: '#fff',
            wordWrap: { width: 600 },
            align: 'center',
            fontFamily: 'Courier'
        }).setOrigin(0.5);
        container.add(questionText);

        // Add answer buttons
        const answers = [...question.incorrect_answers, question.correct_answer];
        this.shuffleArray(answers);

        answers.forEach((answer, index) => {
            const yOffset = index * 60 - 50;

            // Create button background
            const buttonBg = this.add.rectangle(0, yOffset, 550, 50, 0x333333)
                .setInteractive({ useHandCursor: true });

            // Create button text
            const buttonText = this.add.text(0, yOffset, answer, {
                fontSize: '20px',
                fill: '#fff',
                fontFamily: 'Courier'
            }).setOrigin(0.5);

            // Add hover effects
            buttonBg.on('pointerover', () => {
                buttonBg.setFillStyle(0x666666);
                buttonText.setFill('#00ff00');
            });
            buttonBg.on('pointerout', () => {
                buttonBg.setFillStyle(0x333333);
                buttonText.setFill('#ffffff');
            });

            // Handle click
            buttonBg.on('pointerdown', () => {
                const isCorrect = answer === question.correct_answer;

                // Visual feedback
                const feedbackImage = this.add.text(
                    buttonBg.x + 300,
                    buttonBg.y,
                    isCorrect ? '✓' : '✗',
                    {
                        fontSize: '32px',
                        fill: isCorrect ? '#00ff00' : '#ff0000',
                        fontFamily: 'Arial'
                    }
                ).setOrigin(0.5).setDepth(102);

                // Disable all buttons
                container.list.forEach(item => {
                    if (item.removeInteractive) item.removeInteractive();
                });

                // Show feedback and transition
                this.time.delayedCall(1000, () => {
                    container.destroy();
                    overlay.destroy();
                    feedbackImage.destroy();
                    if (isCorrect) {
                        this.score += 100;
                        this.scoreText.setText(`Score: ${this.score}`);
                        iconSprite.setTint(0x00ff00);
                    }
                });
            });

            container.add([buttonBg, buttonText]);
        });
    }

    handleGameOver() {
        if (this.isTransitioning) return;
        this.isTransitioning = true;

        // Save current progress
        this.progressManager.saveProgress({
            score: this.score,
            powerUpBitmask: this.powerUpBitmask,
            currentMap: this.currentMap
        });

        // Get next scene from transition data
        const nextScene = this.transitionData?.nextScene;
        if (!nextScene) {
            console.error('No next scene specified in transition data');
            this.scene.start('mainmenu');
            return;
        }

        // Show game over text with transition to next scene
        const gameOverText = this.add.text(400, 300, 'Game Over', {
            fontSize: '48px',
            fill: '#fff'
        }).setOrigin(0.5);

        // Add score display
        this.add.text(400, 350, `Final Score: ${this.score}`, {
            fontSize: '24px',
            fill: '#fff'
        }).setOrigin(0.5);

        this.time.delayedCall(2000, () => {
            // Transition to next scene
            if (this.sceneTransition) {
                this.sceneTransition.to(this, nextScene, {
                    score: this.score,
                    powerUpBitmask: this.powerUpBitmask,
                    currentMap: this.currentMap,
                    fromScene: 'space_invaders'
                });
            } else {
                this.scene.start(nextScene, {
                    score: this.score,
                    powerUpBitmask: this.powerUpBitmask,
                    currentMap: this.currentMap,
                    fromScene: 'space_invaders'
                });
            }
        });
    }

    updateShieldDisplay() {
        if (this.tempPowerUps.shield > 0) {
            if (!this.shieldText) {
                this.shieldText = this.add.text(16, 50, '', {
                    fontFamily: 'Courier',
                    fontSize: '20px',
                    fill: '#00ff00'
                });
            }
            this.shieldText.setText(`Shield: ${this.tempPowerUps.shield}`);
        } else if (this.shieldText) {
            this.shieldText.destroy();
            this.shieldText = null;
        }
    }
}
