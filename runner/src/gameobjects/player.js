import * as Phaser from 'phaser';

export default class Player extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y, texture) {
    super(scene, x, y, 32, 32, 0x00ff00);
    this.setOrigin(0.5);
    this.scene.add.existing(this);
    this.scene.physics.add.existing(this);
    this.body.collideWorldBounds = true;
    this.setScale(1);
    this.jumping = false;
    this.invincible = false;
    this.health = 10;
    this.body.mass = 10;
    this.body.setDragY = 10;
    // Add player-specific properties and methods here
  }
}
