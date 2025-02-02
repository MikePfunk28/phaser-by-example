import { getAssetPath } from "../utils/assetLoader";
import { ProgressManager } from "../utils/ProgressManager";
import Phaser from 'phaser';
import SceneTransition from "../utils/SceneTransition";

export default class SpaceInvadersScene extends Phaser.Scene {
    constructor(config = {}) {
        super({ key: 'space_invaders' });
        this.progressManager = new ProgressManager();
        this.nextScene = config.nextScene || 'SortSelectionScene';  // Default to SortSelectionScene if not specified
        this.previousScore = 0;
        this.gameStarted = false;
        this.gameOver = false;

        // Initialize arrays
        this.bullets = [];
        this.asteroids = [];
        this.satellites = [];
        this.stars = [];

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
        this.isIntro = data.isIntro || false;
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
        // Load assets
        this.load.image('player', getAssetPath('images/player.png'));
        this.load.image('asteroid', getAssetPath('images/asteroid.png'));
        this.load.image('satellite', getAssetPath('images/satellite.png'));
        this.load.image('bullet', getAssetPath('images/bullet.png'));
        this.load.image('powerup', getAssetPath('images/powerup.png'));

        // Load sound effects
        this.load.audio('shoot', getAssetPath('sounds/shoot.wav'));
        this.load.audio('explosion', getAssetPath('sounds/explosion.wav'));
        this.load.audio('powerup', getAssetPath('sounds/powerup.wav'));
    }

    create() {
        // Create semi-transparent dark background
        this.add.rectangle(400, 300, 800, 600, 0x000000, 0.8);

        // Create player
        this.player = this.add.sprite(400, 500, 'player');
        this.player.setScale(this.powerUpStats.craftSize);

        // Setup input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasdKeys = {
            up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
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
        this.sceneTransition.fadeIn();
    }

    createHUD() {
        // Semi-transparent HUD background
        const hudBg = this.add.rectangle(400, 40, 780, 60, 0x000000, 0.5);
        hudBg.setDepth(100);

        this.scoreText = this.add.text(16, 16, `Score: ${this.score}`, {
            fontSize: '32px',
            fill: '#fff'
        }).setDepth(101);

        this.powerUpText = this.add.text(16, 56, '', {
            fontSize: '24px',
            fill: '#00ff00',
            fontFamily: 'Arial'
        }).setDepth(101);

        this.healthText = this.add.text(16, 96, `Health: ${this.powerUpStats.life}`, {
            fontSize: '24px',
            fill: '#ff0000',
            fontFamily: 'Arial'
        }).setDepth(101);
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
                this.healthText.setText(`Health: ${this.player.lives}`);
                break;
            case 'shield':
                this.player.shield = Math.min(this.player.shield + 1, 3);
                this.powerUpText.setText(`Shield: ${this.player.shield}`);
                break;
        }

        this.updatePowerUpText();
        powerUp.destroy();
    }

    update(time, delta) {
        if (this.gameOver) return;

        // Draw stars
        this.stars.forEach(star => {
            const starSprite = this.add.rectangle(star.x, star.y, star.size, star.size, 0xffffff);
            this.time.delayedCall(16, () => starSprite.destroy());
        });

        // Handle movement
        const moveSpeed = (this.powerUpStats.speed * delta) / 1000;

        if ((this.cursors.left.isDown || this.wasdKeys.left.isDown) && this.player.x > 40) {
            this.player.x -= moveSpeed;
        }
        if ((this.cursors.right.isDown || this.wasdKeys.right.isDown) && this.player.x < 760) {
            this.player.x += moveSpeed;
        }
        if ((this.cursors.up.isDown || this.wasdKeys.up.isDown) && this.player.y > 40) {
            this.player.y -= moveSpeed;
        }
        if ((this.cursors.down.isDown || this.wasdKeys.down.isDown) && this.player.y < 560) {
            this.player.y += moveSpeed;
        }

        // Handle shooting with power-up effects
        if (this.spaceKey.isDown && time > this.lastShot + (1000 / this.powerUpStats.fireRate)) {
            this.shoot();
            this.lastShot = time;
        }

        // Update game objects
        this.updateBullets(delta);
        this.updateAsteroids(delta);
        this.updateSatellites(delta);
        this.checkCollisions();

        // Update HUD
        this.scoreText.setText(`Score: ${this.score}`);
        this.healthText.setText(`Health: ${this.powerUpStats.life}`);
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

    shoot() {
        const bullet = this.add.rectangle(
            this.player.x,
            this.player.y - 20,
            4,
            10,
            0xffffff
        );

        // Apply bullet speed power-up
        const bulletSpeed = this.powerUpStats.bulletSpeed;

        this.bullets.push({
            sprite: bullet,
            speed: bulletSpeed,
            damage: 1
        });
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
        const x = Phaser.Math.Between(40, 760);
        const asteroid = this.add.sprite(x, -20, 'asteroid');
        asteroid.setScale(0.5);

        this.asteroids.push({
            sprite: asteroid,
            speed: Phaser.Math.Between(100, 200),
            rotationSpeed: Phaser.Math.Between(-2, 2)
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
        const x = Phaser.Math.Between(40, 760);
        const satellite = this.add.sprite(x, -20, 'satellite');
        satellite.setScale(0.4);

        this.satellites.push({
            sprite: satellite,
            speed: Phaser.Math.Between(150, 250),
            horizontalSpeed: Phaser.Math.Between(-100, 100)
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
            powerUp.y += powerUp.speed * (delta / 1000);

            if (powerUp.y > this.height + 50) {
                powerUp.destroy();
                this.powerUps.splice(i, 1);
            }
        }
    }

    checkCollisions() {
        // Check bullet collisions with asteroids and satellites
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];

            // Check asteroids
            for (let j = this.asteroids.length - 1; j >= 0; j--) {
                const asteroid = this.asteroids[j];
                if (this.checkOverlap(bullet.sprite, asteroid.sprite)) {
                    this.handleCollision(bullet, asteroid, 10);
                    break;
                }
            }

            // Check satellites
            for (let j = this.satellites.length - 1; j >= 0; j--) {
                const satellite = this.satellites[j];
                if (this.checkOverlap(bullet.sprite, satellite.sprite)) {
                    this.handleCollision(bullet, satellite, 20);
                    break;
                }
            }
        }

        // Check player collisions
        if (!this.gameOver) {
            // Check asteroids
            for (let i = this.asteroids.length - 1; i >= 0; i--) {
                const asteroid = this.asteroids[i];
                if (this.checkOverlap(this.player, asteroid.sprite)) {
                    this.handlePlayerHit();
                    asteroid.sprite.destroy();
                    this.asteroids.splice(i, 1);
                }
            }

            // Check satellites
            for (let i = this.satellites.length - 1; i >= 0; i--) {
                const satellite = this.satellites[i];
                if (this.checkOverlap(this.player, satellite.sprite)) {
                    this.handlePlayerHit();
                    satellite.sprite.destroy();
                    this.satellites.splice(i, 1);
                }
            }
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
        if (this.player.shield > 0) {
            this.player.shield--;
            this.powerUpText.setText(`Shield: ${this.player.shield}`);
            this.showShieldEffect();
        } else {
            this.player.lives--;
            this.healthText.setText(`Health: ${this.player.lives}`);

            if (this.player.lives <= 0) {
                this.gameOver = true;
                this.showGameOver();
                return;
            }

            // Flash player to show damage
            this.showDamageEffect();
        }
    }

    showDamageEffect() {
        this.player.setTint(0xff0000);
        this.time.delayedCall(100, () => {
            this.player.clearTint();
        });
    }

    checkOverlap(spriteA, spriteB) {
        const boundsA = spriteA.getBounds();
        const boundsB = spriteB.getBounds();
        return Phaser.Geom.Rectangle.Overlaps(boundsA, boundsB);
    }

    showGameOver() {
        this.gameOver = true;

        // Save final state
        this.progressManager.saveProgress({
            lastCompletedScene: 'space_invaders',
            currentMap: this.currentMap,
            powerUpBitmask: this.powerUpBitmask,
            score: this.score
        });

        // Create game over text
        const gameOverText = this.add.text(400, 300, 'GAME OVER', {
            fontSize: '64px',
            fill: '#ff0000'
        }).setOrigin(0.5);

        const finalScoreText = this.add.text(400, 380, `Final Score: ${this.score}`, {
            fontSize: '32px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Add continue button
        const continueButton = this.add.rectangle(400, 450, 200, 50, 0x00ff00);
        const continueText = this.add.text(400, 450, 'Continue', {
            fontSize: '24px',
            fill: '#000000'
        }).setOrigin(0.5);

        continueButton.setInteractive();
        continueButton.on('pointerdown', () => {
            this.cameras.main.fadeOut(500);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                if (this.nextScene) {
                    this.scene.start(this.nextScene, {
                        score: this.score,
                        powerUpBitmask: this.powerUpBitmask
                    });
                } else {
                    this.scene.start('mainmenu');
                }
            });
        });
    }

    endMiniGame() {
        // Store final score and power-ups for next scene
        const finalData = {
            score: this.score,
            powerUps: this.powerUpBitmask,
            nextScene: this.nextScene
        };

        // Fade out and transition
        this.cameras.main.fadeOut(500);
        this.time.delayedCall(500, () => {
            this.scene.start(this.nextScene, finalData);
        });
    }
}
