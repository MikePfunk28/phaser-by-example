import { getAssetPath } from "@/utils/assetLoader";
import { ProgressManager } from "@/utils/ProgressManager";
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
        this.progressManager = window.progressManager;
        this.sceneTransition = window.sceneTransition;
        this.bullets = [];
        this.asteroids = [];
        this.satellites = [];
        this.powerUps = [];
        this.starSprites = [];  // Store star sprites for movement
        this.stars = [];  // Add stars array for background
    }

    init(data) {
        this.score = data?.score || 0;
        this.powerUpBitmask = data?.powerUpBitmask || 0;  // Permanent power-ups from trivia
        this.currentMap = data?.currentMap || 1;
        this.nextScene = data?.nextScene;
        this.isTransitioning = false;
        this.tempBonuses = {  // Temporary bonuses that last only for this round
            shield: 0,
            speed: 0,
            fireRate: 0
        };

        // Initialize upgrades based on permanent powerUpBitmask from trivia
        this.upgrades = {
            health: 3 + ((this.powerUpBitmask & 1) ? 2 : 0),  // LIFE powerup adds 2 health
            shield: (this.powerUpBitmask & 2) ? 1 : 0,        // CRAFT powerup adds shield
            speed: 200 + ((this.powerUpBitmask & 4) ? 100 : 0), // SPEED powerup adds 100 speed
            fireRate: 2 + ((this.powerUpBitmask & 8) ? 2 : 0),  // BULLETS powerup doubles fire rate
            bulletSpeed: 400 + ((this.powerUpBitmask & 8) ? 200 : 0), // BULLETS powerup adds bullet speed
            multiShot: 1 + ((this.powerUpBitmask & 8) ? 1 : 0)  // BULLETS powerup adds multishot
        };

        // Create more stars for a better space effect
        for (let i = 0; i < 100; i++) {
            this.stars.push({
                x: Phaser.Math.Between(0, 800),
                y: Phaser.Math.Between(0, 600),
                speed: Phaser.Math.Between(50, 150),  // Different star speeds for parallax
                char: ['.', '*', '+', '·', '°'][Phaser.Math.Between(0, 4)]  // More star variations
            });
        }

        // Optional: Add fade in effect
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
        this.gameOver = false;
        this.nextScene = null;
        this.powerUpBitmask = 0;
        this.powerUpTypes = {
            LIFE: 1,       // 0001
            CRAFT: 2,      // 0010
            SPEED: 4,      // 0100
            BULLETS: 8     // 1000
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
        // Remove image loading since we'll draw everything
        // Load only sound effects
        this.load.audio('shoot', getAssetPath('sounds/coin.mp3'));
        this.load.audio('explosion', getAssetPath('sounds/dead.mp3'));
        this.load.audio('powerup', getAssetPath('sounds/jump.mp3'));
    }

    create() {
        // Create scrolling star field
        this.stars.forEach(star => {
            const starSprite = this.add.text(star.x, star.y, star.char, {
                fontFamily: 'Courier',
                fontSize: star.char === '*' ? '16px' : '12px',  // Bigger stars for depth
                fill: '#ffffff'
            }).setAlpha(0.5);
            starSprite.speed = star.speed;
            this.starSprites.push(starSprite);
        });

        // Create player ship with better ASCII art
        const shipText = [
            '    /\\    ',
            '   |==|   ',
            '  /|/\\|\\  ',
            ' /  \\/  \\ ',
            '|   /\\   |',
            ' \\  ||  / ',
            '  >====<  ',
            '   VVVV   '
        ];

        // Position ship at bottom center
        this.player = this.add.container(400, 500);

        // Add ship text components with better contrast
        shipText.forEach((line, i) => {
            const text = this.add.text(0, i * 14, line, {
                fontFamily: 'Courier',
                fontSize: '16px',
                fill: '#ffffff',
                stroke: '#000000',  // Add stroke for better visibility
                strokeThickness: 2
            }).setOrigin(0.5);
            this.player.add(text);
        });

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

        // Start game loop
        this.startGameLoop();

        // Add fade-in transition
        this.cameras.main.fadeIn(500);
    }

    createHUD() {
        // Semi-transparent HUD background
        const hudBg = this.add.rectangle(400, 40, 780, 60, 0x000000, 0.5);
        hudBg.setDepth(100);

        // Score
        this.scoreText = this.add.text(16, 16, `Score: ${this.score}`, {
            fontSize: '32px',
            fill: '#fff',
            fontFamily: 'Courier'
        }).setDepth(101);

        // Power-ups
        this.powerUpText = this.add.text(16, 56, `Power-ups: ${this.getPowerUpText()}`, {
            fontSize: '24px',
            fill: '#00ff00',
            fontFamily: 'Courier'
        }).setDepth(101);

        // Health
        this.healthText = this.add.text(16, 96, `Health: ${this.upgrades.health}`, {
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
        // Spawn enemies
        this.time.addEvent({
            delay: 2000,
            callback: this.spawnAsteroid,
            callbackScope: this,
            loop: true
        });

        this.time.addEvent({
            delay: 3000,
            callback: this.spawnSatellite,
            callbackScope: this,
            loop: true
        });

        // Spawn power-ups periodically
        this.powerUpTimer = this.time.addEvent({
            delay: 10000,
            callback: this.spawnPowerUp,
            callbackScope: this,
            loop: true
        });
        this.progressManager.loadProgress();
        this.gameStarted = true;
    }

    spawnPowerUp() {
        const bonusTypes = [
            { type: 'temp_shield', char: 'S', color: '#00ffff', duration: 15000 },  // 15 seconds
            { type: 'temp_speed', char: '>', color: '#00ff00', duration: 10000 },   // 10 seconds
            { type: 'temp_fire', char: '!', color: '#ffff00', duration: 12000 }     // 12 seconds
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
        // Create better looking ASCII bullets
        const bulletChars = ['|', '↑', '⇈', '⇡'][Math.floor(Math.random() * 4)];
        const bullet = this.add.text(
            this.player.x,
            this.player.y - 40,  // Adjust to shoot from ship's top
            bulletChars,
            {
                fontFamily: 'Courier',
                fontSize: '20px',
                fill: '#ffff00',
                stroke: '#ff8800',  // Add glow effect
                strokeThickness: 1
            }
        ).setOrigin(0.5);

        this.bullets.push({
            sprite: bullet,
            speed: this.upgrades.bulletSpeed,
            damage: 1
        });

        // Play shoot sound
        this.sound.play('shoot', { volume: 0.5 });
    }

    update(time, delta) {
        if (!this.gameStarted || this.gameOver) return;

        // Update star positions for scrolling effect
        this.starSprites.forEach(star => {
            star.y += (star.speed * delta) / 1000;
            if (star.y > 600) {
                star.y = -10;
                star.x = Phaser.Math.Between(0, 800);
            }
        });

        // Get current stats including temporary bonuses
        const currentStats = this.getPlayerStats();

        // Ensure arrays exist before using forEach
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

        // Handle player movement with current speed
        if (this.player) {
            const moveSpeed = currentStats.speed * (delta / 1000);

            if (this.cursors.left.isDown || this.wasdKeys.left.isDown) {
                this.player.x = Math.max(30, this.player.x - moveSpeed);
            }
            if (this.cursors.right.isDown || this.wasdKeys.right.isDown) {
                this.player.x = Math.min(770, this.player.x + moveSpeed);
            }

            // Shooting with current fire rate
            if (this.spaceKey.isDown && time > this.lastShot + (1000 / currentStats.fireRate)) {
                this.shoot();
                this.lastShot = time;
            }
        }

        this.checkCollisions();
    }

    applyPowerUps() {
        // Reset stats to base values
        this.powerUpStats = {
            life: 3,
            craftSize: 1.0,
            speed: 200,
            bulletSpeed: 400,
            fireRate: 2
        };

        // Apply power-ups based on bitmask
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

        // Update HUD
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
            bullet.sprite.y -= (bullet.speed * delta) / 1000;

            if (bullet.sprite.y < -10) {
                bullet.sprite.destroy();
                this.bullets.splice(i, 1);
            }
        }
    }

    spawnAsteroid() {
        const asteroidChars = ['O', '@', '*', '&'];
        const char = asteroidChars[Phaser.Math.Between(0, asteroidChars.length - 1)];

        const asteroid = this.add.text(
            Phaser.Math.Between(40, 760),
            -20,
            char,
            {
                fontFamily: 'Courier',
                fontSize: '24px',
                fill: '#aaaaaa'
            }
        ).setOrigin(0.5);

        this.asteroids.push({
            sprite: asteroid,
            speed: Phaser.Math.Between(100, 200),
            type: 'asteroid'
        });
    }

    updateAsteroids(delta) {
        for (let i = this.asteroids.length - 1; i >= 0; i--) {
            const asteroid = this.asteroids[i];
            asteroid.sprite.y += (asteroid.speed * delta) / 1000;

            if (asteroid.sprite.y > 620) {
                asteroid.sprite.destroy();
                this.asteroids.splice(i, 1);
            }
        }
    }

    spawnSatellite() {
        const satellite = this.add.text(
            Phaser.Math.Between(40, 760),
            -20,
            '[-o-]',
            {
                fontFamily: 'Courier',
                fontSize: '20px',
                fill: '#ff0000'
            }
        ).setOrigin(0.5);

        this.satellites.push({
            sprite: satellite,
            speed: Phaser.Math.Between(150, 250),
            horizontalSpeed: Phaser.Math.Between(-100, 100),
            type: 'satellite'
        });
    }

    updateSatellites(delta) {
        for (let i = this.satellites.length - 1; i >= 0; i--) {
            const satellite = this.satellites[i];
            satellite.sprite.y += (satellite.speed * delta) / 1000;
            satellite.sprite.x += (satellite.horizontalSpeed * delta) / 1000;

            // Bounce off walls
            if (satellite.sprite.x < 40 || satellite.sprite.x > 760) {
                satellite.horizontalSpeed *= -1;
            }

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
        // Handle temporary bonuses
        switch (powerUp.type) {
            case 'temp_shield':
                this.tempBonuses.shield++;
                this.time.delayedCall(powerUp.duration, () => {
                    this.tempBonuses.shield = Math.max(0, this.tempBonuses.shield - 1);
                    this.updateBonusText();
                });
                break;
            case 'temp_speed':
                this.tempBonuses.speed++;
                this.time.delayedCall(powerUp.duration, () => {
                    this.tempBonuses.speed = Math.max(0, this.tempBonuses.speed - 1);
                    this.updateBonusText();
                });
                break;
            case 'temp_fire':
                this.tempBonuses.fireRate++;
                this.time.delayedCall(powerUp.duration, () => {
                    this.tempBonuses.fireRate = Math.max(0, this.tempBonuses.fireRate - 1);
                    this.updateBonusText();
                });
                break;
        }

        this.updateBonusText();
        // Play power-up sound
        this.sound.play('powerup', { volume: 0.5 });
        powerUp.sprite.destroy();
    }

    updateBonusText() {
        const bonuses = [];
        if (this.tempBonuses.shield > 0) bonuses.push(`Shield(${this.tempBonuses.shield})`);
        if (this.tempBonuses.speed > 0) bonuses.push(`Speed(${this.tempBonuses.speed})`);
        if (this.tempBonuses.fireRate > 0) bonuses.push(`Fire(${this.tempBonuses.fireRate})`);

        if (this.powerUpText) {
            this.powerUpText.setText('Active Bonuses: ' + (bonuses.length ? bonuses.join(' ') : 'None'));
        }
    }

    // Update the player's actual stats based on both permanent power-ups and temporary bonuses
    getPlayerStats() {
        return {
            speed: this.upgrades.speed * (1 + (this.tempBonuses.speed * 0.2)),  // Each speed bonus adds 20%
            fireRate: this.upgrades.fireRate * (1 + (this.tempBonuses.fireRate * 0.3)),  // Each fire bonus adds 30%
            shield: this.upgrades.shield + this.tempBonuses.shield  // Shields stack
        };
    }

    checkCollisions() {
        // Check bullet collisions with enemies
        this.bullets.forEach((bullet, bulletIndex) => {
            // Check asteroids
            this.asteroids.forEach((asteroid, asteroidIndex) => {
                if (this.checkOverlap(bullet.sprite, asteroid.sprite)) {
                    this.handleCollision(bullet, asteroid, 10);
                }
            });

            // Check satellites
            this.satellites.forEach((satellite, satelliteIndex) => {
                if (this.checkOverlap(bullet.sprite, satellite.sprite)) {
                    this.handleCollision(bullet, satellite, 20);
                }
            });
        });

        // Check player collisions with enemies
        if (this.player) {
            // Check asteroids
            this.asteroids.forEach((asteroid, index) => {
                if (this.checkOverlap(this.player, asteroid.sprite)) {
                    asteroid.sprite.destroy();
                    this.asteroids.splice(index, 1);
                    this.handlePlayerHit();
                }
            });

            // Check satellites
            this.satellites.forEach((satellite, index) => {
                if (this.checkOverlap(this.player, satellite.sprite)) {
                    satellite.sprite.destroy();
                    this.satellites.splice(index, 1);
                    this.handlePlayerHit();
                }
            });

            // Check power-ups
            this.powerUps.forEach((powerUp, index) => {
                if (this.checkOverlap(this.player, powerUp.sprite)) {
                    this.collectPowerUp(powerUp);
                    this.powerUps.splice(index, 1);
                }
            });
        }
    }

    handleCollision(bullet, target, points) {
        bullet.sprite.destroy();
        target.sprite.destroy();

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

        this.score += points;
        this.scoreText.setText(`Score: ${this.score}`);
    }

    handlePlayerHit() {
        const currentStats = this.getPlayerStats();
        if (currentStats.shield > 0) {
            // Use up one shield (temporary ones first)
            if (this.tempBonuses.shield > 0) {
                this.tempBonuses.shield--;
            } else if (this.upgrades.shield > 0) {
                this.upgrades.shield--;
            }
            this.updateBonusText();
            this.showShieldEffect();
        } else {
            this.upgrades.health--;
            this.healthText.setText(`Health: ${this.upgrades.health}`);

            if (this.upgrades.health <= 0) {
                this.gameOver = true;
                this.showGameOver();
                return;
            }

            // Flash player to show damage
            this.showDamageEffect();
        }
    }

    showDamageEffect() {
        if (this.player) {
            this.player.forEach(child => {
                child.setFillStyle(0xff0000);
                this.time.delayedCall(100, () => {
                    child.setFillStyle(0xffffff, 0.1);
                });
            });
        }
    }

    showShieldEffect() {
        if (this.player) {
            this.player.forEach(child => {
                child.setFillStyle(0x00ffff);
                this.time.delayedCall(100, () => {
                    child.setFillStyle(0xffffff, 0.1);
                });
            });
        }
    }

    checkOverlap(spriteA, spriteB) {
        const boundsA = spriteA.getBounds();
        const boundsB = spriteB.getBounds();
        return Phaser.Geom.Rectangle.Overlaps(boundsA, boundsB);
    }

    showGameOver() {
        if (this.gameOver) return;
        this.gameOver = true;

        // Create semi-transparent overlay
        const overlay = this.add.rectangle(0, 0, this.game.config.width, this.game.config.height, 0x000000, 0.7);
        overlay.setOrigin(0);
        overlay.setDepth(1000);

        // Game Over text
        const gameOverText = this.add.text(this.game.config.width / 2, this.game.config.height / 2 - 50, 'GAME OVER', {
            fontSize: '64px',
            fill: '#ff0000',
            fontFamily: 'Courier'
        });
        gameOverText.setOrigin(0.5);
        gameOverText.setDepth(1001);

        // Final score
        const finalScoreText = this.add.text(this.game.config.width / 2, this.game.config.height / 2 + 50,
            `Final Score: ${this.score}`, {
            fontSize: '32px',
            fill: '#ffffff',
            fontFamily: 'Courier'
        });
        finalScoreText.setOrigin(0.5);
        finalScoreText.setDepth(1001);

        // Add retry button
        const retryButton = this.add.text(this.game.config.width / 2, this.game.config.height / 2 + 150, 'Retry', {
            fontSize: '32px',
            fill: '#00ff00',
            fontFamily: 'Courier'
        });
        retryButton.setOrigin(0.5);
        retryButton.setDepth(1001);
        retryButton.setInteractive({ useHandCursor: true });

        // Add main menu button
        const menuButton = this.add.text(this.game.config.width / 2, this.game.config.height / 2 + 200, 'Main Menu', {
            fontSize: '32px',
            fill: '#00ff00',
            fontFamily: 'Courier'
        });
        menuButton.setOrigin(0.5);
        menuButton.setDepth(1001);
        menuButton.setInteractive({ useHandCursor: true });

        // Button hover effects
        [retryButton, menuButton].forEach(button => {
            button.on('pointerover', () => {
                button.setStyle({ fill: '#ffffff' });
            });
            button.on('pointerout', () => {
                button.setStyle({ fill: '#00ff00' });
            });
        });

        // Button click handlers
        retryButton.on('pointerdown', () => {
            this.scene.restart({
                score: 0,
                powerUpBitmask: this.powerUpBitmask,
                currentMap: this.currentMap,
                nextScene: this.nextScene
            });
        });

        menuButton.on('pointerdown', () => {
            this.endMiniGame(false);
        });

        // Stop all game loops and timers
        this.powerUpTimer?.remove();
        this.asteroids.forEach(asteroid => asteroid.destroy());
        this.satellites.forEach(satellite => satellite.destroy());
        this.bullets.forEach(bullet => bullet.destroy());
        this.powerUps.forEach(powerUp => powerUp.destroy());
    }

    endMiniGame(success = true) {
        if (this.isTransitioning) return;
        this.isTransitioning = true;

        // Store the score and power-ups
        const gameData = {
            score: this.score,
            powerUpBitmask: this.powerUpBitmask
        };

        // Fade out
        this.cameras.main.fadeOut(500);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            // Transition to the next game scene
            if (success) {
                const nextScene = this.nextScene || 'map1scene1';
                this.scene.start(nextScene, gameData);
            } else {
                this.scene.start('game_over', gameData);
            }
        });
    }
}

