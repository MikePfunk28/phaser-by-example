import Phaser from 'phaser';
import { getAssetPath } from "../utils/assetLoader";

export class GridSpriteAnimation extends Phaser.Scene {
    spriteConfig = {
        key: 'player-sprite',
        frameWidth: 87,  // Based on your sprites.json dimensions
        frameHeight: 190 // Based on your sprites.json dimensions
    };

    init(data) {
        this.mapConfig = this.cache.json.get('map-config');
        this.currentIconIndex = data.currentIconIndex || 0;
        this.answeredIcons = data.answeredIcons || [];

        // Get icons and create path connections
        const icons = this.mapConfig.zones[0].icons;
        this.paths = [
            // Define direct paths between icons (like Mario 3)
            { from: 0, to: 1 },  // Can move from first to second icon
            { from: 1, to: 2 },  // Second to third
            { from: 2, to: 3 },  // Third to fourth
            { from: 3, to: 4 }   // Fourth to fifth
            // Add more paths as needed
        ];

        this.navigationPoints = icons.map((icon, index) => ({
            x: icon.x,
            y: icon.y,
            name: icon.name,
            index: index,
            questionTypes: icon.questionTypes,
            answered: this.answeredIcons.includes(icon.name)
        }));

        // Find first unanswered icon to start from
        const startPoint = this.navigationPoints.find(p => !p.answered) || this.navigationPoints[0];
        this.currentIconIndex = startPoint.index;
        this.startX = startPoint.x;
        this.startY = startPoint.y;
    }

    preload() {
        // Load sprites.json
        this.load.json('spritedata', getAssetPath('data/sprites.json'));
        // Load the walking animation spritesheet
        this.load.spritesheet(
            this.spriteConfig.key,
            getAssetPath('images/spritesheetanime.png'),
            this.spriteConfig
        );
    }

    create() {
        // Create animations for different directions
        this.anims.create({
            key: 'walk-right',
            frames: this.anims.generateFrameNumbers(this.spriteConfig.key, { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'walk-left',
            frames: this.anims.generateFrameNumbers(this.spriteConfig.key, { start: 4, end: 7 }),
            frameRate: 8,
            repeat: -1
        });

        // For up/down movement, we'll use the side frames but rotate the sprite
        this.anims.create({
            key: 'walk-up',
            frames: this.anims.generateFrameNumbers(this.spriteConfig.key, { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'walk-down',
            frames: this.anims.generateFrameNumbers(this.spriteConfig.key, { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1
        });

        // Create player at the starting point
        this.player = this.add.sprite(this.startX, this.startY, this.spriteConfig.key);
        this.player.setScale(0.5);

        // Draw only valid paths (like Mario 3 paths)
        this.drawMarioPaths();

        // Set up cursor key controls
        this.cursors = this.input.keyboard.createCursorKeys();
    }

    drawMarioPaths() {
        const graphics = this.add.graphics();
        graphics.lineStyle(4, 0xffff00, 0.5);

        this.paths.forEach(path => {
            const fromPoint = this.navigationPoints[path.from];
            const toPoint = this.navigationPoints[path.to];
            graphics.beginPath();
            graphics.moveTo(fromPoint.x, fromPoint.y);
            graphics.lineTo(toPoint.x, toPoint.y);
            graphics.strokePath();
        });
    }

    update() {
        if (this.isMoving) return;

        const currentPoint = this.navigationPoints[this.currentIconIndex];
        let targetIndex = this.currentIconIndex;

        // Handle keyboard movement along paths
        if (this.cursors.right.isDown || this.cursors.down.isDown) {
            // Find next valid path
            const nextPath = this.paths.find(p => p.from === this.currentIconIndex);
            if (nextPath) {
                targetIndex = nextPath.to;
            }
        } else if (this.cursors.left.isDown || this.cursors.up.isDown) {
            // Find previous valid path
            const prevPath = this.paths.find(p => p.to === this.currentIconIndex);
            if (prevPath) {
                targetIndex = prevPath.from;
            }
        }

        // Move if we found a valid path
        if (targetIndex !== this.currentIconIndex) {
            const targetPoint = this.navigationPoints[targetIndex];
            this.moveToIcon(targetPoint, targetIndex);
        }
    }

    moveToIcon(targetPoint, newIndex) {
        if (this.isMoving) return;
        this.isMoving = true;

        // Set correct animation based on movement direction
        if (targetPoint.x > this.player.x) {
            this.player.play('walk-right', true);
            this.player.setAngle(0);
        } else {
            this.player.play('walk-left', true);
            this.player.setAngle(0);
        }

        this.tweens.add({
            targets: this.player,
            x: targetPoint.x,
            y: targetPoint.y,
            duration: 500,
            onComplete: () => {
                this.player.anims.stop();
                this.isMoving = false;
                this.currentIconIndex = newIndex;

                // Emit event when reaching new icon
                if (!targetPoint.answered) {
                    this.events.emit('reachIcon', targetPoint);
                }
            }
        });
    }

    markIconAsAnswered(iconName) {
        const point = this.navigationPoints.find(p => p.name === iconName);
        if (point) {
            point.answered = true;
            this.answeredIcons.push(iconName);

            // Check if all icons are answered
            if (this.navigationPoints.every(p => p.answered)) {
                this.events.emit('allIconsAnswered');
            }
        }
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#2d2d2d',
    parent: 'phaser-example',
    scene: Example
};

const game = new Phaser.Game(config);
