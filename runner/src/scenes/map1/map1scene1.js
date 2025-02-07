class map1scene1 extends Phaser.Scene {

    constructor() {
        super({ key: 'map1scene1', active: true });
    }

    create() {
        let graphics = this.add.graphics();

        graphics.fillStyle(0xff3300, 1);

        graphics.fillRect(100, 200, 600, 300);
        graphics.fillRect(100, 100, 100, 100);

        this.add.text(120, 110, 'A', { font: '96px Courier', fill: '#000000' });
    }
}

let config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#392542',
    parent: 'phaser-example',
    scene: [map1scene1, SceneB]
};

let game = new Phaser.Game(config);

class SceneB extends Phaser.Scene {

    constructor() {
        super({ key: 'SceneB', active: true });
    }

    create() {
        let graphics = this.add.graphics();

        graphics.fillStyle(0xff9933, 1);

        graphics.fillRect(100, 200, 600, 300);
        graphics.fillRect(200, 100, 100, 100);

        this.add.text(220, 110, 'B', { font: '96px Courier', fill: '#000000' });
    }
}
