import Phaser from 'phaser';

export default class Button extends Phaser.GameObjects.Container {
    constructor(scene, x, y, text, config = {}) {
        super(scene, x, y);
        scene.add.existing(this);

        // Default configuration
        this.config = {
            width: config.width || 200,
            height: config.height || 50,
            backgroundColor: config.backgroundColor || 0x333333,
            hoverColor: config.hoverColor || 0x666666,
            disabledColor: config.disabledColor || 0x222222,
            textColor: config.textColor || '#ffffff',
            textHoverColor: config.textHoverColor || '#ffffff',
            textDisabledColor: config.textDisabledColor || '#666666',
            fontSize: config.fontSize || '24px',
            fontFamily: config.fontFamily || 'Arial',
            strokeColor: config.strokeColor || 0x00ff00,
            strokeWidth: config.strokeWidth || 2,
            cornerRadius: config.cornerRadius || 5,
            ...config
        };

        this.isEnabled = true;
        this.isHovered = false;

        this.createButton(text);
        this.setupInteraction();
    }

    createButton(text) {
        // Create background with rounded corners
        this.background = this.scene.add.graphics();
        this.drawBackground(this.config.backgroundColor);
        this.add(this.background);

        // Create text
        this.text = this.scene.add.text(0, 0, text, {
            fontSize: this.config.fontSize,
            fontFamily: this.config.fontFamily,
            fill: this.config.textColor
        }).setOrigin(0.5);
        this.add(this.text);

        // Set container size for interaction
        this.setSize(this.config.width, this.config.height);
    }

    setupInteraction() {
        this.setInteractive({ useHandCursor: true })
            .on('pointerover', this.onPointerOver, this)
            .on('pointerout', this.onPointerOut, this)
            .on('pointerdown', this.onPointerDown, this)
            .on('pointerup', this.onPointerUp, this);
    }

    drawBackground(color) {
        this.background.clear();

        // Draw fill
        this.background.fillStyle(color, 1);
        this.background.lineStyle(this.config.strokeWidth, this.config.strokeColor);

        // Draw rounded rectangle
        const halfWidth = this.config.width / 2;
        const halfHeight = this.config.height / 2;

        this.background.beginPath();
        this.background.moveTo(-halfWidth + this.config.cornerRadius, -halfHeight);
        this.background.lineTo(halfWidth - this.config.cornerRadius, -halfHeight);
        this.background.arc(halfWidth - this.config.cornerRadius, -halfHeight + this.config.cornerRadius, this.config.cornerRadius, -Math.PI / 2, 0);
        this.background.lineTo(halfWidth, halfHeight - this.config.cornerRadius);
        this.background.arc(halfWidth - this.config.cornerRadius, halfHeight - this.config.cornerRadius, this.config.cornerRadius, 0, Math.PI / 2);
        this.background.lineTo(-halfWidth + this.config.cornerRadius, halfHeight);
        this.background.arc(-halfWidth + this.config.cornerRadius, halfHeight - this.config.cornerRadius, this.config.cornerRadius, Math.PI / 2, Math.PI);
        this.background.lineTo(-halfWidth, -halfHeight + this.config.cornerRadius);
        this.background.arc(-halfWidth + this.config.cornerRadius, -halfHeight + this.config.cornerRadius, this.config.cornerRadius, Math.PI, -Math.PI / 2);
        this.background.closePath();

        this.background.fillPath();
        this.background.strokePath();
    }

    onPointerOver() {
        if (!this.isEnabled) return;

        this.isHovered = true;
        this.drawBackground(this.config.hoverColor);
        this.text.setColor(this.config.textHoverColor);
        this.scene.tweens.add({
            targets: this,
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 100
        });
    }

    onPointerOut() {
        if (!this.isEnabled) return;

        this.isHovered = false;
        this.drawBackground(this.config.backgroundColor);
        this.text.setColor(this.config.textColor);
        this.scene.tweens.add({
            targets: this,
            scaleX: 1,
            scaleY: 1,
            duration: 100
        });
    }

    onPointerDown() {
        if (!this.isEnabled) return;

        this.scene.tweens.add({
            targets: this,
            scaleX: 0.95,
            scaleY: 0.95,
            duration: 50
        });
    }

    onPointerUp() {
        if (!this.isEnabled) return;

        this.scene.tweens.add({
            targets: this,
            scaleX: this.isHovered ? 1.05 : 1,
            scaleY: this.isHovered ? 1.05 : 1,
            duration: 50
        });

        // Play click sound if configured
        if (this.config.clickSound) {
            this.scene.sound.play(this.config.clickSound);
        }

        // Emit click event
        this.emit('click');
    }

    setText(text) {
        this.text.setText(text);
    }

    setEnabled(enabled) {
        this.isEnabled = enabled;

        if (enabled) {
            this.drawBackground(this.isHovered ? this.config.hoverColor : this.config.backgroundColor);
            this.text.setColor(this.config.textColor);
            this.setInteractive();
        } else {
            this.drawBackground(this.config.disabledColor);
            this.text.setColor(this.config.textDisabledColor);
            this.disableInteractive();
            this.scene.tweens.add({
                targets: this,
                scaleX: 1,
                scaleY: 1,
                duration: 100
            });
        }
    }

    setBackgroundColor(color) {
        this.config.backgroundColor = color;
        if (this.isEnabled && !this.isHovered) {
            this.drawBackground(color);
        }
    }

    setTextColor(color) {
        this.config.textColor = color;
        if (this.isEnabled && !this.isHovered) {
            this.text.setColor(color);
        }
    }

    destroy() {
        this.background.destroy();
        this.text.destroy();
        super.destroy();
    }
}
