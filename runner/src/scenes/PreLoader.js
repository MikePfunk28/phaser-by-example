import { getAssetPath } from "/src/utils/assetLoader";
import Player from '/src/gameobjects/player';
import Generator from '/src/gameobjects/generator';
import * as Phaser from 'phaser';


export default class Preloader extends Phaser.Scene {
    constructor() {
        super({ key: 'preloader' });
        // Initialization code
    }

    init(data) {
        this.score = data.score || 0;
        this.currentMap = data.currentMap || 1;
        this.selected = data.selected || null;
        this.thumbnails = data.thumbnails || [];
        this.connections = data.connections || [];
        this.progress = data.progress || 0;
    }

    preload() {
        // Map 1 thumbnails
        this.load.image('map1scene164', getAssetPath('images/map1scene164.png'));
        this.load.image('map1scene264', getAssetPath('images/map1scene264.png'));
        this.load.image('map1scene364', getAssetPath('images/map1scene364.png'));
        this.load.image('map1scene464', getAssetPath('images/map1scene464.png'));

        // Map 2 thumbnails
        this.load.image('map2scene164', getAssetPath('images/map2scene164.png'));
        this.load.image('map2scene264', getAssetPath('images/map2scene264.png'));
        this.load.image('map2scene364', getAssetPath('images/map2scene364.png'));
        this.load.image('map2scene464', getAssetPath('images/map2scene464.png'));

        // Map 3 thumbnails
        this.load.image('map3scene164', getAssetPath('images/map3scene164.png'));
        this.load.image('map3scene264', getAssetPath('images/map3scene264.png'));
        this.load.image('map3scene364', getAssetPath('images/map3scene364.png'));
        this.load.image('map3scene464', getAssetPath('images/map3scene464.png'));

        this.load.json('map-config', getAssetPath('data/map1/map-config.json'));
        this.load.json('questions', getAssetPath('data/questions.json'));
        this.load.bitmapFont('arcade',
            getAssetPath('fonts/arcade.png'),
            getAssetPath('fonts/arcade.xml')
        );
        this.load.mapConfig('map-config2', getAssetPath('data/map1/map-config2.json'));
        this.load.mapConfig('map-config2', getAssetPath('data/map1/map-config2.json'));
        this.load.mapConfig('map-config3', getAssetPath('data/map1/map-config3.json'));
        this.load.mapConfig('map-config4', getAssetPath('data/map1/map-config4.json'));

        this.load.mapConfig('map-config2', getAssetPath('data/map2/map-config2.json'));
        this.load.mapConfig('map-config2', getAssetPath('data/map2/map-config2.json'));
        this.load.mapConfig('map-config3', getAssetPath('data/map2/map-config3.json'));
        this.load.mapConfig('map-config4', getAssetPath('data/map2/map-config4.json'));

        this.load.mapConfig('map-config2', getAssetPath('data/map3/map-config2.json'));
        this.load.mapConfig('map-config2', getAssetPath('data/map3/map-config2.json'));
        this.load.mapConfig('map-config3', getAssetPath('data/map3/map-config3.json'));
        this.load.mapConfig('map-config4', getAssetPath('data/map3/map-config4.json'));

        this.load.mapConfig('map-config2', getAssetPath('data/map4/map-config2.json'));
        this.load.mapConfig('map-config2', getAssetPath('data/map4/map-config2.json'));
        this.load.mapConfig('map-config3', getAssetPath('data/map4/map-config3.json'));
        this.load.mapConfig('map-config4', getAssetPath('data/map4/map-config4.json'));

        this.load.map('map1scene1', getAssetPath('images/map1scene1.png'));
        this.load.map('map1scene2', getAssetPath('images/map1scene2.png'));
        this.load.map('map1scene3', getAssetPath('images/map1scene3.png'));
        this.load.map('map1scene4', getAssetPath('images/map1scene4.png'));

        // Map 2 thumbnails
        this.load.map('map2scene1', getAssetPath('images/map2scene1.png'));
        this.load.map('map2scene2', getAssetPath('images/map2scene2.png'));
        this.load.map('map2scene3', getAssetPath('images/map2scene3.png'));
        this.load.map('map2scene4', getAssetPath('images/map2scene4.png'));

        // Map 3 thumbnails
        this.load.map('map3scene1', getAssetPath('images/map3scene1.png'));
        this.load.map('map3scene2', getAssetPath('images/map3scene2.png'));
        this.load.map('map3scene3', getAssetPath('images/map3scene3.png'));
        this.load.map('map3scene4', getAssetPath('images/map3scene4.png'));

        // Map 4 thumbnails
        this.load.map('map4scene1', getAssetPath('images/map4scene1.png'));
        this.load.map('map4scene2', getAssetPath('images/map4scene2.png'));
        this.load.map('map4scene3', getAssetPath('images/map4scene3.png'));
        this.load.map('map4scene4', getAssetPath('images/map4scene4.png'));

        // Load feedback marks
        this.load.image('checkMark', getAssetPath('images/checkmark.png'));
        this.load.image('xMark', getAssetPath('images/xmark.png'));

        this.load.player('player', getAssetPath('images/player.png'));
        this.load.button('button', getAssetPath('images/button.png'));
        this.load.generator('generator', getAssetPath('images/generator.png'));
        this.load.icons('icons', getAssetPath('images/icons.png'));

        this.load.updateProgress('progressManager', getAssetPath('images/progressManager.png'));
        this.load.SortSelectionScene('SortSelectionScene', getAssetPath('images/SortSelectionScene.png'));
        this.load.style('styles', getAssetPath('styles/game.css'));
    }

    create() {
        // Initialize sound settings properly
        if (this.sound && this.sound.context) {
            this.sound.pauseOnBlur = false;
        }

        this.questions = this.cache.json.get('questions');

        const mapConfig = this.cache.json.get('map-config'); // Ensure correct key

        // Set up the map based on config
        const activeZone = mapConfig.zones[0];
        const map = this.add.image(activeZone.x, activeZone.y, 'map1scene1');
        map.setScale(activeZone.scale);

        // Load AWS icons after we have the config
        this.loadAwsIcons(mapConfig);
        this.setupScore();
        this.scene.start('MainMenu');
    }

    // ... rest of your Preloader class methods
}

