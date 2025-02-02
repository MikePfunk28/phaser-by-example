import { getAssetPath } from "../utils/assetLoader";
import progressManager from "../utils/ProgressManager";
import Phaser from 'phaser';

export default class GameOver extends Phaser.Scene {
  constructor() {
    super({ key: 'gameover' });
  }

  init(data) {
    this.score = data.score || 0;
    this.powerUpBitmask = data.powerUpBitmask || 0;
    this.currentMap = data.currentMap || 1;
  }

  create() {
    // Create semi-transparent dark background
    this.add.rectangle(400, 300, 800, 600, 0x000000, 0.9);

    // Create game over text
    const gameOverText = this.add.text(400, 150, 'GAME OVER', {
      fontSize: '64px',
      fill: '#ff0000',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Add score text
    const scoreText = this.add.text(400, 250, `Final Score: ${this.score}`, {
      fontSize: '32px',
      fill: '#ffffff'
    }).setOrigin(0.5);

    // Add power-ups text
    const powerUps = [];
    if (this.powerUpBitmask & 1) powerUps.push('Life+');
    if (this.powerUpBitmask & 2) powerUps.push('Size+');
    if (this.powerUpBitmask & 4) powerUps.push('Speed+');
    if (this.powerUpBitmask & 8) powerUps.push('Fire+');

    const powerUpText = this.add.text(400, 300, `Power-ups: ${powerUps.join(' ')}`, {
      fontSize: '24px',
      fill: '#00ff00'
    }).setOrigin(0.5);

    // Create buttons container
    const buttonsContainer = this.add.container(400, 400);

    // Create retry button
    const retryButton = this.add.rectangle(0, 0, 200, 50, 0x00ff00)
      .setInteractive();
    const retryText = this.add.text(0, 0, 'Try Again', {
      fontSize: '24px',
      fill: '#000000'
    }).setOrigin(0.5);

    // Create main menu button
    const menuButton = this.add.rectangle(0, 70, 200, 50, 0x666666)
      .setInteractive();
    const menuText = this.add.text(0, 70, 'Main Menu', {
      fontSize: '24px',
      fill: '#ffffff'
    }).setOrigin(0.5);

    // Add hover effects
    retryButton.on('pointerover', () => {
      retryButton.setFillStyle(0x00cc00);
      retryText.setScale(1.1);
    });
    retryButton.on('pointerout', () => {
      retryButton.setFillStyle(0x00ff00);
      retryText.setScale(1.0);
    });

    menuButton.on('pointerover', () => {
      menuButton.setFillStyle(0x888888);
      menuText.setScale(1.1);
    });
    menuButton.on('pointerout', () => {
      menuButton.setFillStyle(0x666666);
      menuText.setScale(1.0);
    });

    // Add click handlers
    retryButton.on('pointerdown', () => {
      this.sound.play('button_click');
      this.retryGame();
    });

    menuButton.on('pointerdown', () => {
      this.sound.play('button_click');
      this.returnToMenu();
    });

    // Add buttons to container
    buttonsContainer.add([retryButton, retryText, menuButton, menuText]);

    // Add high score text if applicable
    const highScore = this.getHighScore();
    if (this.score > highScore) {
      this.setHighScore(this.score);
      this.add.text(400, 500, 'New High Score!', {
        fontSize: '32px',
        fill: '#ffff00'
      }).setOrigin(0.5);
    } else if (highScore > 0) {
      this.add.text(400, 500, `High Score: ${highScore}`, {
        fontSize: '24px',
        fill: '#ffffff'
      }).setOrigin(0.5);
    }
  }

  retryGame() {
    // Reset progress but keep high score
    progressManager.resetProgress();

    // Fade out and restart game
    this.cameras.main.fadeOut(500);
    this.time.delayedCall(500, () => {
      this.scene.start('sort_selection', {
        score: 0,
        powerUpBitmask: 0,
        currentMap: 1
      });
    });
  }

  returnToMenu() {
    // Reset progress and return to main menu
    progressManager.resetProgress();

    // Fade out and return to menu
    this.cameras.main.fadeOut(500);
    this.time.delayedCall(500, () => {
      this.scene.start('mainmenu');
    });
  }

  getHighScore() {
    try {
      const highScore = localStorage.getItem('highScore');
      return highScore ? parseInt(highScore) : 0;
    } catch (error) {
      console.error('Error getting high score:', error);
      return 0;
    }
  }

  setHighScore(score) {
    try {
      localStorage.setItem('highScore', score.toString());
    } catch (error) {
      console.error('Error setting high score:', error);
    }
  }
}
