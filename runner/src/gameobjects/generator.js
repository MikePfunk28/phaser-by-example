// src/gameobjects/Generator.js

import Phaser from 'phaser';
import Icon from "./icons";
import Player from "./player";
import { getAssetPath } from '../utils/assetLoader';

export default class Generator {
  constructor(scene) {
    this.scene = scene;
    this.icons = new Map();
    this.categories = new Set();
  }

  /**
   * Generate icons based on map configuration
   * @param {Object} config - Map configuration object
   * @returns {Array} Array of generated icons
   */
  generateIcons(config) {
    const icons = [];

    config.icons.forEach(iconConfig => {
      // Create icon
      const icon = new Icon(
        this.scene,
        iconConfig.x,
        iconConfig.y,
        getAssetPath(`images/${iconConfig.name}`),
        {
          id: iconConfig.name,
          category: iconConfig.category,
          questionType: iconConfig.questionType,
          tooltip: iconConfig.tooltip || iconConfig.name
        }
      );

      // Store icon reference
      this.icons.set(iconConfig.name, icon);
      this.categories.add(iconConfig.category);

      // Add click handler
      icon.on('iconclick', this.handleIconClick.bind(this));

      icons.push(icon);
    });

    return icons;
  }

  /**
   * Handle icon click events
   * @param {Object} iconData - Data about the clicked icon
   */
  handleIconClick(iconData) {
    // Emit event for scene to handle
    this.scene.events.emit('iconselectchange', iconData);
  }

  /**
   * Get all icons of a specific category
   * @param {string} category - Category to filter by
   * @returns {Array} Array of icons in the category
   */
  getIconsByCategory(category) {
    return Array.from(this.icons.values())
      .filter(icon => icon.config.category === category);
  }

  /**
   * Get all unique categories
   * @returns {Array} Array of unique categories
   */
  getCategories() {
    return Array.from(this.categories);
  }

  /**
   * Get an icon by its name
   * @param {string} name - Name of the icon
   * @returns {Icon} The icon object
   */
  getIcon(name) {
    return this.icons.get(name);
  }

  /**
   * Update icon positions based on zone
   * @param {Object} zone - Zone configuration
   */
  updateIconPositions(zone) {
    this.icons.forEach(icon => {
      const originalX = icon.x;
      const originalY = icon.y;

      icon.x = originalX * zone.scale + zone.x;
      icon.y = originalY * zone.scale + zone.y;
    });
  }

  /**
   * Reset all icons to their default state
   */
  resetIcons() {
    this.icons.forEach(icon => {
      icon.reset();
    });
  }

  /**
   * Mark an icon as answered
   * @param {string} name - Name of the icon
   * @param {boolean} isCorrect - Whether the answer was correct
   */
  setIconAnswered(name, isCorrect) {
    const icon = this.icons.get(name);
    if (icon) {
      icon.setAnswered(isCorrect);
    }
  }

  /**
   * Check if all icons have been answered
   * @returns {boolean} True if all icons are answered
   */
  areAllIconsAnswered() {
    return Array.from(this.icons.values())
      .every(icon => icon.isAnswered);
  }

  /**
   * Get the number of correctly answered icons
   * @returns {number} Number of correct answers
   */
  getCorrectAnswerCount() {
    return Array.from(this.icons.values())
      .filter(icon => icon.isAnswered && icon.isCorrect)
      .length;
  }

  /**
   * Destroy all icons and clean up
   */
  destroy() {
    this.icons.forEach(icon => {
      icon.destroy();
    });
    this.icons.clear();
    this.categories.clear();
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
