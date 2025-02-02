import { getAssetPath } from "../utils/assetLoader";
import { ProgressManager } from "../utils/ProgressManager";
import Phaser from 'phaser';
import SceneTransition from "../utils/SceneTransition";

export default class SpaceInvadersScene extends Phaser.Scene {
<<<<<<< Updated upstream
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
=======
    constructor(sceneKey = 'space_invaders') {
        super({ key: sceneKey });
        this.player = null;
>>>>>>> Stashed changes
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
        this.progressManager = new ProgressManager();
        this.sceneTransition = new SceneTransition();
    }

    init(data) {
        this.nextScene = data.nextScene;
        this.score = data.score || 0;
        this.triviaScore = data.triviaScore || 0;
        this.powerUpBitmask = data.powerUpBitmask || 0;
        this.currentMap = data.currentMap || 1;

        // Reset power-ups based on trivia performance
        const correctAnswers = Math.floor(this.triviaScore / 100);

        // Award new power-ups based on performance
        if (correctAnswers >= 5) {
            // Perfect score - award all power-ups
            this.powerUpBitmask |= 15; // 1111 in binary
        } else {
            // Award power-ups based on performance
            for (let i = 0; i < correctAnswers; i++) {
                // Randomly select a power-up type that hasn't been awarded yet
                let availablePowerUps = [1, 2, 4, 8].filter(type => !(this.powerUpBitmask & type));
                if (availablePowerUps.length > 0) {
                    const powerUpType = availablePowerUps[Math.floor(Math.random() * availablePowerUps.length)];
                    this.powerUpBitmask |= powerUpType;
                }
            }
        }

        // Apply power-ups
        this.applyPowerUps();

        // Save progress
        this.progressManager.saveProgress({
            lastCompletedScene: 'space_invaders',
            currentMap: this.currentMap,
            powerUpBitmask: this.powerUpBitmask,
            score: this.score
        });
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

<<<<<<< Updated upstream
        // Define ASCII art
        this.asciiArt = {
            ship: [
                '   /^\\   ',
                '  //--\\\\  ',
                ' /_//_\\_\\ ',
                '/// ||| \\\\\\'
            ].join('\n'),
            bullet: '^o^',
            asteroid: '@#@',
            satellite: '[==]'
        };
=======
        // Create player
        this.player = this.add.sprite(400, 500, 'player');
        this.player.setScale(this.powerUpStats.craftSize);
>>>>>>> Stashed changes

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

<<<<<<< Updated upstream
        // Create player ship
        this.playerSprite = this.add.text(this.player.x, this.player.y, this.asciiArt.ship, {
            fontSize: '16px',
            fill: '#ffffff',
            align: 'center',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        // Create stars
        for (let i = 0; i < 100; i++) {
            this.stars.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() * 2 + 1
            });
        }
        this.progressManager.loadProgress();
        this.progressManager.updateStats(this.player.score);

        // Create HUD
        this.createHUD();

        // Start the game
        this.startGame();

        // Set up shooting star effect
        this.time.addEvent({
            delay: 10000,
            callback: this.createShootingStar,
            callbackScope: this,
            loop: true
        });
    }

    createHUD() {
        // Score and lives - top left
        this.scoreText = this.add.text(10, 10, `Score: ${this.player.score}`, {
            fontSize: '20px',
            fill: '#fff'
        });
=======
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
>>>>>>> Stashed changes

        this.scoreText = this.add.text(16, 16, `Score: ${this.score}`, {
            fontSize: '32px',
            fill: '#fff',
            fontFamily: 'Arial'
        }).setDepth(101);

<<<<<<< Updated upstream
        // Power-ups - top right
        this.powerUpText = this.add.text(this.width - 200, 10, '', {
            fontSize: '16px',
            fill: '#fff',
            align: 'left'
        });
=======
        this.powerUpText = this.add.text(16, 56, '', {
            fontSize: '24px',
            fill: '#00ff00',
            fontFamily: 'Arial'
        }).setDepth(101);
>>>>>>> Stashed changes
        this.updatePowerUpText();

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
<<<<<<< Updated upstream

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
                this.livesText.setText(`Lives: ${this.player.lives}`);
                break;
            case 'shield':
                this.player.shield = Math.min(this.player.shield + 1, 3);
                this.powerUpText.setText(`Shield: ${this.player.shield}`);
                break;
        }

        this.updatePowerUpText();
        powerUp.destroy();
=======
>>>>>>> Stashed changes
    }

    update(time, delta) {
        if (this.gameOver) return;
<<<<<<< Updated upstream

        // Draw stars
        this.stars.forEach(star => {
            const starSprite = this.add.rectangle(star.x, star.y, star.size, star.size, 0xffffff);
            this.time.delayedCall(16, () => starSprite.destroy());
        });
=======
>>>>>>> Stashed changes

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

<<<<<<< Updated upstream
        // Update player sprite position
        this.playerSprite.x = this.player.x;
        this.playerSprite.y = this.player.y;
=======
        // Update HUD
        this.scoreText.setText(`Score: ${this.score}`);
        this.healthText.setText(`Health: ${this.powerUpStats.life}`);
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
            bullet.y += bullet.velocity.y * (delta / 1000);
=======
            bullet.sprite.y -= (bullet.speed * delta) / 1000;
>>>>>>> Stashed changes

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

<<<<<<< Updated upstream
        // Enemy collisions
        this.asteroids.forEach((asteroid, index) => {
            if (this.checkOverlap(this.playerSprite, asteroid)) {
                asteroid.destroy();
                this.asteroids.splice(index, 1);
                this.handlePlayerHit();
            }
        });

        this.satellites.forEach((satellite, index) => {
            if (this.checkOverlap(this.playerSprite, satellite)) {
                satellite.destroy();
                this.satellites.splice(index, 1);
                this.handlePlayerHit();
            }
        });
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

    handlePlayerHit() {
        if (this.player.shield > 0) {
            this.player.shield--;
            this.powerUpText.setText(`Shield: ${this.player.shield}`);
            this.showShieldEffect();
        } else {
            this.player.lives--;
            this.livesText.setText(`Lives: ${this.player.lives}`);
=======
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

    handlePlayerHit() {
        this.powerUpStats.life--;
        this.healthText.setText(`Health: ${this.powerUpStats.life}`);
>>>>>>> Stashed changes

        if (this.powerUpStats.life <= 0) {
            this.gameOver = true;
            this.showGameOver();
            return;
        }

        // Flash player to show damage
        this.showDamageEffect();
    }

    showDamageEffect() {
        this.player.setTint(0xff0000);
        this.time.delayedCall(100, () => {
            this.player.clearTint();
        });
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

<<<<<<< Updated upstream
        const continueButton = this.add.text(this.width / 2, this.height / 2 + 80, 'Continue to Sort Selection', {
=======
        // Add continue button
        const continueButton = this.add.rectangle(400, 450, 200, 50, 0x00ff00);
        const continueText = this.add.text(400, 450, 'Continue', {
>>>>>>> Stashed changes
            fontSize: '24px',
            fill: '#000000'
        }).setOrigin(0.5);

<<<<<<< Updated upstream
        continueButton.on('pointerover', () => continueButton.setScale(1.1));
        continueButton.on('pointerout', () => continueButton.setScale(1.0));
        continueButton.on('pointerdown', () => this.endMiniGame());
    }

    endMiniGame() {
        if (this.nextScene) {
            console.log(`Ending Space Invaders. Going to: ${this.nextScene}`);
            this.scene.start(this.nextScene, {
                score: this.player.score,
                upgrades: this.upgrades,
                difficulty: this.difficulty
            });
        } else {
            console.log('No next scene specified, returning to SortSelectionScene');
            this.scene.start('SortSelectionScene', {
                score: this.player.score,
                upgrades: this.upgrades,
                difficulty: this.difficulty
            });
        }
    }

    // Function to spawn satellites
    spawnSatellite() {
        const satellite = this.add.text(
            Phaser.Math.Between(40, this.width - 40),
            -20,
            this.asciiArt.satellite,
            {
                fontSize: '20px',
                fill: '#ff0000',
                fontFamily: 'monospace'
            }
        ).setOrigin(0.5);

        satellite.speed = this.difficulty.satelliteSpeed;
        this.satellites.push(satellite);
    }

    // Function to spawn asteroids
    spawnAsteroid() {
        const asteroid = this.add.text(
            Phaser.Math.Between(40, this.width - 40),
            -20,
            this.asciiArt.asteroid,
            {
                fontSize: '24px',
                fill: '#888888',
                fontFamily: 'monospace'
            }
        ).setOrigin(0.5);

        asteroid.speed = this.difficulty.asteroidSpeed;
        this.asteroids.push(asteroid);
    }

    // Function to fire bullet
    fireBullet() {
        if (time - this.lastShot > 1000 / this.player.fireRate) {
            const bullet = this.add.text(
                this.player.x,
                this.player.y - 30,
                this.asciiArt.bullet,
                {
                    fontSize: '14px',
                    fill: '#ffff00',  // Yellow color for bullets
                    fontFamily: 'monospace'
                }
            ).setOrigin(0.5);
            this.bullets.push(bullet);
            this.lastShot = time;
        }
    }

    createShootingStar() {
        const startX = Phaser.Math.Between(0, this.width / 2);
        const startY = 0;
        const endX = startX + 200;
        const endY = 200;

        const shootingStar = this.add.text(startX, startY, '*--->', {
            fontSize: '20px',
            fill: '#ffffff',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: shootingStar,
            x: endX,
            y: endY,
            duration: 1000,
            ease: 'Linear',
            onComplete: () => {
                shootingStar.destroy();
            }
        });
    }

    getPowerUpText() {
        return [
            'POWER-UPS:',
            `Fire Rate: ${this.upgrades.fireRate}`,
            `Bullet Speed: ${this.upgrades.bulletSpeed}`,
            `Multi-Shot: ${this.upgrades.multiShot}`,
            `Health: ${this.upgrades.health}`,
            `Shield: ${this.upgrades.shield}`
        ].join('\n');
    }

    // Update power-ups based on trivia progress
    updatePowerUps(answeredQuestions) {
        if (answeredQuestions % 5 === 0) {
            switch (Math.floor(answeredQuestions / 5)) {
                case 1:
                    this.upgrades.health++;
                    break;
                case 2:
                    this.upgrades.fireRate++;
                    break;
                case 3:
                    this.upgrades.bulletSpeed += 100;
                    break;
                case 4:
                    this.upgrades.multiShot++;
                    break;
            }
            this.powerUpText.setText(this.getPowerUpText());
        }
    }
} 
=======
        continueButton.setInteractive();
        continueButton.on('pointerdown', () => {
            this.cameras.main.fadeOut(500);
            this.time.delayedCall(500, () => {
                this.scene.start(this.nextScene, {
                    score: this.score,
                    powerUpBitmask: this.powerUpBitmask,
                    currentMap: this.currentMap
                });
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
>>>>>>> Stashed changes
