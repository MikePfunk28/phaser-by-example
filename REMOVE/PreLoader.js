import { getAssetPath } from "@/utils/assetLoader";
import Player from '/src/gameobjects/player';
import Generator from '/src/gameobjects/generator';
import Phaser from 'phaser';


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
        this.load.scene('map1gamescene164', getAssetPath('images/map1gamescene164.png'));
        this.load.scene('map1gamescene264', getAssetPath('images/map1gamescene264.png'));
        this.load.scene('map1gamescene364', getAssetPath('images/map1gamescene364.png'));
        this.load.scene('map1gamescene464', getAssetPath('images/map1gamescene464.png'));

        // Map 2 thumbnails
        this.load.scene('map2gamescene164', getAssetPath('images/map2gamescene164.png'));
        this.load.scene('map2gamescene264', getAssetPath('images/map2gamescene264.png'));
        this.load.scene('map2gamescene364', getAssetPath('images/map2gamescene364.png'));
        this.load.scene('map2gamescene464', getAssetPath('images/map2gamescene464.png'));

        // Map 3 thumbnails
        this.load.scene('map3gamescene164', getAssetPath('images/map3gamescene164.png'));
        this.load.scene('map3gamescene264', getAssetPath('images/map3gamescene264.png'));
        this.load.scene('map3gamescene364', getAssetPath('images/map3gamescene364.png'));
        this.load.scene('map3gamescene464', getAssetPath('images/map3gamescene464.png'));

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

        this.load.map('map1gamescene1', getAssetPath('images/map1gamescene1.png'));
        this.load.map('map1gamescene2', getAssetPath('images/map1gamescene2.png'));
        this.load.map('map1gamescene3', getAssetPath('images/map1gamescene3.png'));
        this.load.map('map1gamescene4', getAssetPath('images/map1gamescene4.png'));

        // Map 2 thumbnails
        this.load.map('map2gamescene1', getAssetPath('images/map2gamescene1.png'));
        this.load.map('map2gamescene2', getAssetPath('images/map2gamescene2.png'));
        this.load.map('map2gamescene3', getAssetPath('images/map2gamescene3.png'));
        this.load.map('map2gamescene4', getAssetPath('images/map2gamescene4.png'));

        // Map 3 thumbnails
        this.load.map('map3gamescene1', getAssetPath('images/map3gamescene1.png'));
        this.load.map('map3gamescene2', getAssetPath('images/map3gamescene2.png'));
        this.load.map('map3gamescene3', getAssetPath('images/map3gamescene3.png'));
        this.load.map('map3gamescene4', getAssetPath('images/map3gamescene4.png'));

        // Map 4 thumbnails
        this.load.map('map4gamescene1', getAssetPath('images/map4gamescene1.png'));
        this.load.map('map4gamescene2', getAssetPath('images/map4gamescene2.png'));
        this.load.map('map4gamescene3', getAssetPath('images/map4gamescene3.png'));
        this.load.map('map4gamescene4', getAssetPath('images/map4gamescene4.png'));

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
        const map = this.add.image(activeZone.x, activeZone.y, '/');
        map.setScale(activeZone.scale);

        // Load AWS icons after we have the config
        this.loadAwsIcons(mapConfig);
        this.setupScore();
        this.scene.start('MainMenu');
    }

    // ... rest of your Preloader class methods
}

