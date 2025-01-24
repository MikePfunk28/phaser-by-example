import Phaser from "phaser";

export default class GridSpriteAnimation extends Phaser.Scene {
    constructor() {
        super();
    }

    preload() {
        this.load.image('bg', '../assets/images/map1scene1.png');
        this.load.spritesheet('spsh1', '../assets/images/spritesheet2.png', { frameWidth: 64, frameHeight: 112 });
    }

    create() {
        this.add.image(400, 300, 'bg');

        this.anims.create({
            key: 'walk',
            frames: this.anims.generateFrameNumbers('spsh1'),
            frameRate: 16,
            repeat: -1
        });

        const sprites = [];

        for (var i = 0; i < 60; i++) {
            sprites.push(this.add.sprite(0, 0, 'spsh1').play('walk'));
        }

        //  The sprites are 64x112 in size

        //  Let's lay them out in a grid 12 sprites wide, by as many tall as we have sprites in the array for

        Phaser.Actions.GridAlign(sprites, {
            width: 12,
            cellWidth: 64,
            cellHeight: 120,
            x: 16,
            y: 4
        });
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
