import Phaser from 'phaser';

export default class Icon extends Phaser.GameObjects.Container {
    constructor(scene, x, y, texture, config) {
        super(scene, x, y);
        scene.add.existing(this);

        this.config = config;
        this.isInteractive = true;

        // Create icon sprite
        this.sprite = scene.add.sprite(0, 0, texture);
        this.add(this.sprite);

        // Create background box
        this.box = scene.add.rectangle(
            0,
            0,
            this.sprite.width + 20,
            this.sprite.height + 20,
            0x333333,
            0.8
        );
        this.add(this.box);
        this.sendToBack(this.box);

        // Create border
        this.border = scene.add.rectangle(
            0,
            0,
            this.sprite.width + 20,
            this.sprite.height + 20,
            0x00ff00,
            0
        );
        this.border.setStrokeStyle(2, 0x00ff00);
        this.add(this.border);
        this.sendToBack(this.border);

        // Set up interactivity
        this.setSize(this.sprite.width + 20, this.sprite.height + 20);
        this.setInteractive();

        // Add hover effects
        this.on('pointerover', this.onHover.bind(this));
        this.on('pointerout', this.onHoverOut.bind(this));
        this.on('pointerdown', this.onClick.bind(this));

        // Initialize state
        this.isAnswered = false;
        this.isCorrect = false;
    }

    onHover() {
        if (!this.isInteractive) return;

        // Scale up effect
        this.scene.tweens.add({
            targets: [this.sprite, this.box, this.border],
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 100
        });

        // Show tooltip if configured
        if (this.config.tooltip) {
            this.showTooltip();
        }
    }

    onHoverOut() {
        if (!this.isInteractive) return;

        // Scale down effect
        this.scene.tweens.add({
            targets: [this.sprite, this.box, this.border],
            scaleX: 1,
            scaleY: 1,
            duration: 100
        });

        // Hide tooltip
        this.hideTooltip();
    }

    onClick() {
        if (!this.isInteractive) return;

        // Emit click event with icon data
        this.emit('iconclick', {
            id: this.config.id,
            category: this.config.category,
            questionType: this.config.questionType
        });
    }

    showTooltip() {
        if (this.tooltip) return;

        // Create tooltip background
        this.tooltip = this.scene.add.container(0, -60);
        const background = this.scene.add.rectangle(
            0,
            0,
            200,
            40,
            0x000000,
            0.8
        );
        const text = this.scene.add.text(
            0,
            0,
            this.config.tooltip,
            {
                fontSize: '16px',
                fill: '#ffffff'
            }
        ).setOrigin(0.5);

        this.tooltip.add([background, text]);
        this.add(this.tooltip);

        // Fade in effect
        this.scene.tweens.add({
            targets: this.tooltip,
            alpha: { from: 0, to: 1 },
            duration: 200
        });
    }

    hideTooltip() {
        if (!this.tooltip) return;

        // Fade out and destroy tooltip
        this.scene.tweens.add({
            targets: this.tooltip,
            alpha: 0,
            duration: 200,
            onComplete: () => {
                this.tooltip.destroy();
                this.tooltip = null;
            }
        });
    }

    setAnswered(isCorrect) {
        this.isAnswered = true;
        this.isCorrect = isCorrect;
        this.isInteractive = false;

        // Update border color based on answer
        const color = isCorrect ? 0x00ff00 : 0xff0000;
        this.border.setStrokeStyle(2, color);

        // Add visual feedback
        if (isCorrect) {
            this.showCorrectAnimation();
        } else {
            this.showIncorrectAnimation();
        }
    }

    showCorrectAnimation() {
        // Create particles for correct answer
        const particles = this.scene.add.particles(this.x, this.y, 'particle', {
            speed: { min: -100, max: 100 },
            angle: { min: 0, max: 360 },
            scale: { start: 1, end: 0 },
            blendMode: 'ADD',
            lifespan: 1000,
            gravityY: 0,
            quantity: 20,
            tint: 0x00ff00
        });

        // Clean up particles after animation
        this.scene.time.delayedCall(1000, () => {
            particles.destroy();
        });
    }

    showIncorrectAnimation() {
        // Flash red effect
        this.scene.tweens.add({
            targets: [this.sprite, this.box],
            alpha: 0.5,
            duration: 100,
            yoyo: true,
            repeat: 3
        });
    }

    reset() {
        this.isAnswered = false;
        this.isCorrect = false;
        this.isInteractive = true;
        this.border.setStrokeStyle(2, 0x00ff00);
        this.setAlpha(1);
        this.setScale(1);
        if (this.tooltip) {
            this.hideTooltip();
        }
    }

    destroy() {
        if (this.tooltip) {
            this.tooltip.destroy();
        }
        super.destroy();
    }
}