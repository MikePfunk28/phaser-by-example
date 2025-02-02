import Phaser from 'phaser';

export default class Player extends Phaser.GameObjects.Container {
  constructor(scene, x, y, texture) {
    super(scene, x, y);

    // Create player sprite
    this.sprite = scene.add.sprite(0, 0, texture);
    this.add(this.sprite);

    // Set up physics
    scene.physics.world.enable(this);
    this.body.setCollideWorldBounds(true);

    // Player stats
    this.stats = {
      life: 3,
      craftSize: 1.0,
      speed: 200,
      bulletSpeed: 400,
      fireRate: 2
    };

    // Power-up tracking
    this.powerUpBitmask = 0;
    this.powerUpTypes = {
      LIFE: 1,       // 0001
      CRAFT: 2,      // 0010
      SPEED: 4,      // 0100
      BULLETS: 8     // 1000
    };

    // Initialize player
    this.init();
  }

  init() {
    // Set initial scale
    this.sprite.setScale(this.stats.craftSize);

    // Set up collision body
    this.body.setSize(this.sprite.width * this.stats.craftSize, this.sprite.height * this.stats.craftSize);
    this.body.setOffset(-this.sprite.width * this.stats.craftSize / 2, -this.sprite.height * this.stats.craftSize / 2);
  }

  update(cursors, wasdKeys, delta) {
    if (!this.active) return;

    // Calculate movement speed based on delta time
    const moveSpeed = (this.stats.speed * delta) / 1000;

    // Handle movement
    if ((cursors.left.isDown || wasdKeys.left.isDown) && this.x > 40) {
      this.x -= moveSpeed;
    }
    if ((cursors.right.isDown || wasdKeys.right.isDown) && this.x < 760) {
      this.x += moveSpeed;
    }
    if ((cursors.up.isDown || wasdKeys.up.isDown) && this.y > 40) {
      this.y -= moveSpeed;
    }
    if ((cursors.down.isDown || wasdKeys.down.isDown) && this.y < 560) {
      this.y += moveSpeed;
    }

    // Update collision body position
    this.body.setPosition(this.x, this.y);
  }

  addPowerUp(type) {
    this.powerUpBitmask |= type;
    this.updateStats();
  }

  updateStats() {
    // Reset stats to base values
    this.stats = {
      life: 3,
      craftSize: 1.0,
      speed: 200,
      bulletSpeed: 400,
      fireRate: 2
    };

    // Apply power-ups based on bitmask
    if (this.powerUpBitmask & this.powerUpTypes.LIFE) {
      this.stats.life += 2;
    }
    if (this.powerUpBitmask & this.powerUpTypes.CRAFT) {
      this.stats.craftSize = 1.2;
      this.sprite.setScale(this.stats.craftSize);
      this.body.setSize(
        this.sprite.width * this.stats.craftSize,
        this.sprite.height * this.stats.craftSize
      );
    }
    if (this.powerUpBitmask & this.powerUpTypes.SPEED) {
      this.stats.speed += 100;
    }
    if (this.powerUpBitmask & this.powerUpTypes.BULLETS) {
      this.stats.bulletSpeed += 200;
      this.stats.fireRate += 2;
    }
  }

  takeDamage() {
    this.stats.life--;

    // Flash effect
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      duration: 100,
      yoyo: true,
      repeat: 2
    });

    return this.stats.life <= 0;
  }

  getStats() {
    return { ...this.stats };
  }

  getPowerUpBitmask() {
    return this.powerUpBitmask;
  }

  setPowerUpBitmask(bitmask) {
    this.powerUpBitmask = bitmask;
    this.updateStats();
  }

  reset() {
    this.powerUpBitmask = 0;
    this.updateStats();
    this.sprite.setAlpha(1);
    this.setActive(true);
  }
}
