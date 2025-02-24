import { getAssetPath } from "../utils/assetLoader";
import { ProgressManager, loadProgress } from "../utils/ProgressManager";
import Phaser from 'phaser';
import SceneTransition from "../utils/SceneTransition";

export default class SpaceInvadersScene extends Phaser.Scene {
    constructor(sceneKey = 'space_invaders') {
        super({ key: 'space_invaders' });
        this.progressManager = new ProgressManager();

        // Progression system
        this.upgrades = {
            fireRate: 1,
            bulletSpeed: 300,
            multiShot: 1,
            health: 3,
            shield: 0,
            score: 0
        };

        // Difficulty scaling
        this.difficulty = {
            asteroidSpeed: 100,
            asteroidSpawnRate: 1000,
            satelliteSpeed: 150,
            satelliteSpawnRate: 2000,
            level: 1
        };
    }

    init(data) {
        if (data.stats) {
            this.stats = data.stats;
        }
        this.nextScene = data.nextScene;
        this.isIntro = data.isIntro || false;
        this.previousScore = data.score || 0;
        this.upgrades = data.upgrades || this.upgrades;
        this.difficulty = data.difficulty || this.difficulty;

        // Set up container bounds
        this.width = this.game.config.width;
        this.height = this.game.config.height;
        this.resetGame();
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
        this.stars = [];
        this.gameStarted = false;
        this.gameOver = false;
        this.lastShot = 0;
    }

    create() {
        console.log(`Starting SpaceInvadersScene with key: ${this.sys.settings.key}`);
        console.log('Stats:', this.stats);

        // Create stars within bounds
        for (let i = 0; i < 100; i++) {
            this.stars.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() * 2 + 1
            });
        }
        this.loadProgress();

        // Setup keyboard input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasdKeys = {
            up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
        };
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Add text displays
        this.createHUD();

        // Start spawning enemies and power-ups
        this.startGame();
    }

    createHUD() {
        // Score and lives
        this.scoreText = this.add.text(10, 10, `Score: ${this.player.score}`, {
            fontSize: '20px',
            fill: '#fff'
        });

        this.livesText = this.add.text(10, 40, `Lives: ${this.player.lives}`, {
            fontSize: '20px',
            fill: '#fff'
        });

        // Shield display
        this.shieldText = this.add.text(10, 70, `Shield: ${this.player.shield}`, {
            fontSize: '20px',
            fill: '#fff'
        });

        // Level display
        this.levelText = this.add.text(10, 100, `Level: ${this.difficulty.level}`, {
            fontSize: '20px',
            fill: '#fff'
        });

        // Power-up status
        this.powerUpText = this.add.text(this.width - 200, 10, '', {
            fontSize: '16px',
            fill: '#fff'
        });
        this.updatePowerUpText();
    }

    updatePowerUpText() {
        this.powerUpText.setText(
            `Fire Rate: ${this.player.fireRate}x\n` +
            `Multi-Shot: ${this.player.multiShot}x\n` +
            `Bullet Speed: ${Math.floor(this.player.bulletSpeed / 100)}x`
        );
    }

    startGame() {
        // Start spawning enemies with current difficulty
        this.asteroidTimer = this.time.addEvent({
            delay: this.difficulty.asteroidSpawnRate,
            callback: this.spawnAsteroid,
            callbackScope: this,
            loop: true
        });

        this.satelliteTimer = this.time.addEvent({
            delay: this.difficulty.satelliteSpawnRate,
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
        this.loadProgress();
        this.updateStats(this.player.score);
    }

    spawnPowerUp() {
        const types = ['fireRate', 'multiShot', 'bulletSpeed', 'health', 'shield'];
        const type = types[Phaser.Math.Between(0, types.length - 1)];

        const powerUp = this.add.text(
            Phaser.Math.Between(40, this.width - 40),
            -50,
            this.getPowerUpSymbol(type),
            {
                fontSize: '24px',
                fill: this.getPowerUpColor(type)
            }
        ).setOrigin(0.5);

        powerUp.type = type;
        powerUp.speed = 100;
        this.powerUps.push(powerUp);
    }

    getPowerUpSymbol(type) {
        const symbols = {
            fireRate: '⚡',
            multiShot: '⋈',
            bulletSpeed: '➾',
            health: '❤️',
            shield: '🛡️'
        };
        return symbols[type] || '✧';
    }

    getPowerUpColor(type) {
        const colors = {
            fireRate: '#ffff00',
            multiShot: '#00ffff',
            bulletSpeed: '#ff00ff',
            health: '#ff0000',
            shield: '#0000ff'
        };
        return colors[type] || '#ffffff';
    }

    collectPowerUp(powerUp) {
        switch (powerUp.type) {
            case 'fireRate':
                this.player.fireRate = Math.min(this.player.fireRate + 0.2, 5);
                break;
            case 'multiShot':
                this.player.multiShot = Math.min(this.player.multiShot + 1, 5);
                break;
            case 'bulletSpeed':
                this.player.bulletSpeed = Math.min(this.player.bulletSpeed + 100, 800);
                break;
            case 'health':
                this.player.lives++;
                this.livesText.setText(`Lives: ${this.player.lives}`);
                break;
            case 'shield':
                this.player.shield = Math.min(this.player.shield + 1, 3);
                this.shieldText.setText(`Shield: ${this.player.shield}`);
                break;
        }

        this.updatePowerUpText();
        powerUp.destroy();
    }

    update(time, delta) {
        if (!this.gameStarted || this.gameOver) return;

        // Update player position based on input
        const moveSpeed = this.player.speed * (delta / 1000);

        if ((this.cursors.left.isDown || this.wasdKeys.left.isDown) && this.player.x > 40) {
            this.player.x -= moveSpeed;
        }
        if ((this.cursors.right.isDown || this.wasdKeys.right.isDown) && this.player.x < this.width - 40) {
            this.player.x += moveSpeed;
        }
        if ((this.cursors.up.isDown || this.wasdKeys.up.isDown) && this.player.y > 100) {
            this.player.y -= moveSpeed;
        }
        if ((this.cursors.down.isDown || this.wasdKeys.down.isDown) && this.player.y < this.height - 40) {
            this.player.y += moveSpeed;
        }

        // Shooting
        if (this.spaceKey.isDown && time > this.lastShot + (1000 / this.player.fireRate)) {
            this.shoot();
            this.lastShot = time;
        }

        // Update game objects
        this.updateBullets(delta);
        this.updateAsteroids(delta);
        this.updateSatellites(delta);
        this.updatePowerUps(delta);
        this.checkCollisions();

        // Update difficulty based on score
        this.updateDifficulty();
    }

    updateDifficulty() {
        const newLevel = Math.floor(this.player.score / 1000) + 1;
        if (newLevel > this.difficulty.level) {
            this.difficulty.level = newLevel;
            this.difficulty.asteroidSpeed += 20;
            this.difficulty.asteroidSpawnRate = Math.max(500, this.difficulty.asteroidSpawnRate - 50);
            this.difficulty.satelliteSpeed += 25;
            this.difficulty.satelliteSpawnRate = Math.max(1000, this.difficulty.satelliteSpawnRate - 100);

            // Update timers
            this.asteroidTimer.delay = this.difficulty.asteroidSpawnRate;
            this.satelliteTimer.delay = this.difficulty.satelliteSpawnRate;

            // Update display
            this.levelText.setText(`Level: ${this.difficulty.level}`);

            // Visual feedback for level up
            this.showLevelUpEffect();
        }
    }

    showLevelUpEffect() {
        const levelUpText = this.add.text(this.width / 2, this.height / 2, 'LEVEL UP!', {
            fontSize: '48px',
            fill: '#ffff00',
            stroke: '#000',
            strokeThickness: 6
        }).setOrigin(0.5);

        this.tweens.add({
            targets: levelUpText,
            scale: { from: 0.5, to: 2 },
            alpha: { from: 1, to: 0 },
            duration: 1000,
            ease: 'Power2',
            onComplete: () => levelUpText.destroy()
        });
    }

    shoot() {
        const angles = this.getMultiShotAngles();
        angles.forEach(angle => {
            const bullet = this.add.text(this.player.x, this.player.y - 20, '⋆', {
                fontSize: '24px',
                fill: '#ffff00'
            }).setOrigin(0.5);

            bullet.velocity = {
                x: Math.sin(angle) * this.player.bulletSpeed,
                y: -Math.cos(angle) * this.player.bulletSpeed
            };

            this.bullets.push(bullet);
        });
    }

    getMultiShotAngles() {
        const angles = [];
        const spread = Math.min((this.player.multiShot - 1) * 0.1, 0.5);
        for (let i = 0; i < this.player.multiShot; i++) {
            const angle = -spread / 2 + (spread / (this.player.multiShot - 1)) * i;
            angles.push(angle || 0);
        }
        return angles;
    }

    updateBullets(delta) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.x += bullet.velocity.x * (delta / 1000);
            bullet.y += bullet.velocity.y * (delta / 1000);

            if (bullet.y < -20) {
                bullet.destroy();
                this.bullets.splice(i, 1);
            }
        }
    }

    updateAsteroids(delta) {
        for (let i = this.asteroids.length - 1; i >= 0; i--) {
            const asteroid = this.asteroids[i];
            asteroid.y += asteroid.speed * (delta / 1000);

            if (asteroid.y > this.height + 50) {
                asteroid.destroy();
                this.asteroids.splice(i, 1);
            }
        }
    }

    updateSatellites(delta) {
        for (let i = this.satellites.length - 1; i >= 0; i--) {
            const satellite = this.satellites[i];
            satellite.y += satellite.speed * (delta / 1000);

            if (satellite.y > this.height + 50) {
                satellite.destroy();
                this.satellites.splice(i, 1);
            }
        }
    }

    updatePowerUps(delta) {
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            powerUp.y += powerUp.speed * (delta / 1000);

            if (powerUp.y > this.height + 50) {
                powerUp.destroy();
                this.powerUps.splice(i, 1);
            }
        }
    }

    checkCollisions() {
        // Bullet collisions
        this.bullets.forEach((bullet, bulletIndex) => {
            // Check asteroid collisions
            this.asteroids.forEach((asteroid, asteroidIndex) => {
                if (this.checkOverlap(bullet, asteroid)) {
                    this.handleAsteroidDestruction(asteroid, bulletIndex, asteroidIndex);
                }
            });

            // Check satellite collisions
            this.satellites.forEach((satellite, satelliteIndex) => {
                if (this.checkOverlap(bullet, satellite)) {
                    this.handleSatelliteDestruction(satellite, bulletIndex, satelliteIndex);
                }
            });
        });

        // Player collisions
        const playerBounds = this.getPlayerBounds();

        // Power-up collection
        this.powerUps.forEach((powerUp, index) => {
            if (this.checkOverlap(powerUp, playerBounds)) {
                this.collectPowerUp(powerUp);
                this.powerUps.splice(index, 1);
            }
        });

        // Enemy collisions
        this.checkPlayerCollisions(playerBounds);
    }

    handleAsteroidDestruction(asteroid, bulletIndex, asteroidIndex) {
        // Create explosion effect
        this.createExplosion(asteroid.x, asteroid.y, '#ffff00');

        // Remove bullet and asteroid
        this.bullets[bulletIndex].destroy();
        this.bullets.splice(bulletIndex, 1);
        asteroid.destroy();
        this.asteroids.splice(asteroidIndex, 1);

        // Update score
        this.player.score += 10;
        this.scoreText.setText(`Score: ${this.player.score}`);
    }

    handleSatelliteDestruction(satellite, bulletIndex, satelliteIndex) {
        // Create explosion effect
        this.createExplosion(satellite.x, satellite.y, '#ff0000');

        // Remove bullet and satellite
        this.bullets[bulletIndex].destroy();
        this.bullets.splice(bulletIndex, 1);
        satellite.destroy();
        this.satellites.splice(satelliteIndex, 1);

        // Update score
        this.player.score += 20;
        this.scoreText.setText(`Score: ${this.player.score}`);
    }

    checkPlayerCollisions(playerBounds) {
        let isHit = false;

        // Check asteroid collisions
        this.asteroids.forEach((asteroid, index) => {
            if (this.checkOverlap(asteroid, playerBounds)) {
                this.handlePlayerHit();
                asteroid.destroy();
                this.asteroids.splice(index, 1);
                isHit = true;
            }
        });

        // Check satellite collisions
        this.satellites.forEach((satellite, index) => {
            if (this.checkOverlap(satellite, playerBounds)) {
                this.handlePlayerHit();
                satellite.destroy();
                this.satellites.splice(index, 1);
                isHit = true;
            }
        });

        if (isHit) {
            this.createExplosion(this.player.x, this.player.y, '#ff0000');
        }
    }

    handlePlayerHit() {
        if (this.player.shield > 0) {
            this.player.shield--;
            this.shieldText.setText(`Shield: ${this.player.shield}`);
            this.showShieldEffect();
        } else {
            this.player.lives--;
            this.livesText.setText(`Lives: ${this.player.lives}`);

            if (this.player.lives <= 0) {
                this.gameOver = true;
                this.showGameOver();
            } else {
                this.showDamageEffect();
            }
        }
    }

    showShieldEffect() {
        const shield = this.add.circle(this.player.x, this.player.y, 40, 0x0000ff, 0.5);
        this.tweens.add({
            targets: shield,
            alpha: 0,
            scale: 2,
            duration: 500,
            onComplete: () => shield.destroy()
        });
    }

    showDamageEffect() {
        const flash = this.add.rectangle(0, 0, this.width, this.height, 0xff0000, 0.5);
        this.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 100,
            onComplete: () => flash.destroy()
        });
    }

    createExplosion(x, y, color) {
        const particles = this.add.particles(x, y, {
            speed: { min: -100, max: 100 },
            angle: { min: 0, max: 360 },
            scale: { start: 1, end: 0 },
            blendMode: 'ADD',
            lifespan: 500,
            gravityY: 0,
            quantity: 20,
            tint: parseInt(color.replace('#', '0x'))
        });

        this.time.delayedCall(500, () => particles.destroy());
    }

    checkOverlap(obj1, obj2) {
        const bounds1 = obj1.getBounds();
        const bounds2 = obj2.getBounds ? obj2.getBounds() : obj2;
        return Phaser.Geom.Intersects.RectangleToRectangle(bounds1, bounds2);
    }

    getPlayerBounds() {
        return {
            x: this.player.x - this.player.width / 2,
            y: this.player.y - this.player.height / 2,
            width: this.player.width,
            height: this.player.height
        };
    }

    showGameOver() {
        // Save upgrades and difficulty for next session
        this.upgrades = {
            fireRate: this.player.fireRate,
            bulletSpeed: this.player.bulletSpeed,
            multiShot: this.player.multiShot,
            health: this.player.lives,
            shield: this.player.shield,
            score: this.player.score + this.previousScore
        };

        // Show game over screen
        const gameOverText = this.add.text(this.width / 2, this.height / 2 - 50, 'Game Over!', {
            fontSize: '48px',
            fill: '#ff0000',
            stroke: '#000',
            strokeThickness: 6
        }).setOrigin(0.5);

        const finalScore = this.add.text(this.width / 2, this.height / 2 + 10,
            `Final Score: ${this.player.score}\nTotal Score: ${this.upgrades.score}`, {
            fontSize: '24px',
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        const continueButton = this.add.text(this.width / 2, this.height / 2 + 80, 'Continue to Next Level', {
            fontSize: '24px',
            fill: '#ffffff',
            backgroundColor: '#4a4',
            padding: { x: 20, y: 10 }
        })
            .setOrigin(0.5)
            .setInteractive();

        continueButton.on('pointerover', () => continueButton.setScale(1.1));
        continueButton.on('pointerout', () => continueButton.setScale(1.0));
        continueButton.on('pointerdown', () => {
            this.scene.start(this.nextScene, {
                score: this.upgrades.score,
                upgrades: this.upgrades,
                difficulty: this.difficulty
            });
        });

    }
    endMiniGame() {
        console.log(`Ending Space Invaders. Going to: ${this.nextScene}`);
        SceneTransition.to(this, 'SortSelectionScene', {
            key: 'space_invaders',
            score: this.player.score
        });
    }

} 