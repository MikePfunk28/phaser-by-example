import * as Phaser from 'phaser';

export default class Icon extends Phaser.GameObjects.Rectangle {
    constructor(scene, x, y) {
        super(scene, x, y, 32, 32, 0x00ff00); // Green rectangle for visibility
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.body.setAllowGravity(false);
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
    }
}