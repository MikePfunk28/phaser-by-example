// src/gameobjects/Generator.js

import Phaser from 'phaser';
import Icon from "./icons";
import Player from "./player";

export default class Generator extends Phaser.GameObjects.GameObject {
  constructor(scene) {
    super(scene, 'Generator');
    this.scene = scene;
    this.init();
  }

  init() {
    this.generateCloud();
    this.generateObstacle();
    this.generateCoin();
    this.generateIcon();
    this.generateButton();
  }

  generateCloud() {
    new Cloud(this.scene);
    this.scene.time.delayedCall(
      Phaser.Math.Between(2000, 3000),
      () => this.generateCloud(),
      null,
      this
    );
  }

  generateObstacle() {
    this.scene.obstacles.add(
      new Obstacle(
        this.scene,
        800,
        this.scene.scale.height - Phaser.Math.Between(32, 128)
      )
    );
    this.scene.time.delayedCall(
      Phaser.Math.Between(1500, 2500),
      () => this.generateObstacle(),
      null,
      this
    );
  }

  generateCoin() {
    this.scene.coins.add(
      new Coin(
        this.scene,
        800,
        this.scene.scale.height - Phaser.Math.Between(32, 128)
      )
    );
    this.scene.time.delayedCall(
      Phaser.Math.Between(500, 1500),
      () => this.generateCoin(),
      null,
      this
    );
  }

  generateIcon() {
    new Icon(this.scene, Phaser.Math.Between(100, 700), Phaser.Math.Between(100, 500));
    this.scene.time.delayedCall(
      Phaser.Math.Between(3000, 5000),
      () => this.generateIcon(),
      null,
      this
    );
  }

  generateButton() {
    new Button(this.scene, Phaser.Math.Between(100, 700), Phaser.Math.Between(100, 500));
    this.scene.time.delayedCall(
      Phaser.Math.Between(3000, 5000),
      () => this.generateButton(),
      null,
      this
    );
  }
}

/* 
 * Cloud Class
 */
class Cloud extends Phaser.GameObjects.Rectangle {
  constructor(scene, x = 800, y = Phaser.Math.Between(0, 100)) {
    super(scene, x, y, 98, 32, 0xffffff);
    scene.add.existing(this);
    const alpha = 1 / Phaser.Math.Between(1, 3);
    this.setScale(alpha);
    this.init();
  }

  init() {
    this.scene.tweens.add({
      targets: this,
      x: { from: 800, to: -100 },
      duration: 2000 / this.scale,
      onComplete: () => {
        this.destroy();
      },
    });
  }
}

/* 
 * Obstacle Class
 */
class Obstacle extends Phaser.GameObjects.Rectangle {
  constructor(scene, x = 800, y = Phaser.Math.Between(32, 368)) { // Assuming scene.scale.height = 400
    super(scene, x, y, 32, 32, 0xff0000);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setAllowGravity(false);
    const alpha = 1 / Phaser.Math.Between(1, 3);
    this.setScale(alpha);
    this.init();
  }

  init() {
    this.scene.tweens.add({
      targets: this,
      x: { from: 820, to: -100 },
      duration: 2000,
      onComplete: () => {
        this.destroy();
      },
    });

    // Add collision with player if necessary
    this.body.setVelocityX(-200);
    // Example collision handling:
    // this.scene.physics.add.overlap(this, this.scene.player, this.handleCollision, null, this);
  }

  handleCollision(obstacle, player) {
    // Handle collision logic (e.g., end game)
    this.scene.gameOver();
  }
}

/* 
 * Coin Class
 */
class Coin extends Phaser.GameObjects.Sprite {
  constructor(scene, x = 800, y = Phaser.Math.Between(32, 368)) {
    super(scene, x, y, "coin");
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setAllowGravity(false);
    const alpha = 1 / Phaser.Math.Between(1, 3);
    this.setScale(alpha);
    this.init();
  }

  init() {
    this.scene.tweens.add({
      targets: this,
      x: { from: 820, to: -100 },
      duration: 2000,
      onComplete: () => {
        this.destroy();
      },
    });

    const coinAnimation = this.scene.anims.create({
      key: "coin_anim",
      frames: this.scene.anims.generateFrameNumbers("coin", {
        start: 0,
        end: 7,
      }),
      frameRate: 8,
      repeat: -1
    });
    this.play({ key: "coin_anim", repeat: -1 });

    // Example collision handling:
    // this.scene.physics.add.overlap(this, this.scene.player, this.collectCoin, null, this);
  }

  collectCoin(coin, player) {
    // Increase score
    this.scene.score += 50;
    this.scene.updateScore();
    // Play sound if necessary
    this.scene.playSound('coinCollect');
    // Destroy the coin
    coin.destroy();
  }
}

/* 
 * Button Class
 */
class Button extends Phaser.GameObjects.Rectangle {
  constructor(scene, x = 800, y = Phaser.Math.Between(100, 500)) {
    super(scene, x, y, 32, 32, 0x00ff00); // Green rectangle for visibility
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setAllowGravity(false);
    this.setInteractive();
    this.init();
  }

  init() {
    this.scene.tweens.add({
      targets: this,
      x: { from: 1024, to: -100 },
      duration: 2000,
      onComplete: () => {
        this.destroy();
      },
    });

    // Add interaction if necessary
    this.setInteractive();
    this.on('pointerdown', () => {
      // Handle button click
      console.log('Button Clicked');
      // Example: Pause or perform an action
      this.scene.togglePause();
    });
  }
}
