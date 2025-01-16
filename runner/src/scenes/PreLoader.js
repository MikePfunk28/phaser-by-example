import { getAssetPath } from "/src/utils/assetLoader";
import Player from '/src/gameobjects/player';
import Generator from '/src/gameobjects/generator';
import * as Phaser from 'phaser';
import SceneOrderManager from '/src/utils/SceneOrderManager';

export default class Preloader extends Phaser.Scene {
    constructor() {
        super({ key: 'preloader' });
        // Initialization code
    }

    init(data) {
        this.score = data.score || 0;
    }

    preload() {
        // Load assets
        this.load.image('map1scene1', getAssetPath('images/map1scene1.png'));
        this.load.json('map-config', getAssetPath('data/map1/map-config.json'));
        this.load.json('questions', getAssetPath('data/questions.json'));
        this.load.bitmapFont('arcade',
            getAssetPath('fonts/arcade.png'),
            getAssetPath('fonts/arcade.xml')
        );

        // Load feedback marks
        this.load.image('checkMark', getAssetPath('images/checkmark.png'));
        this.load.image('xMark', getAssetPath('images/xmark.png'));
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
    }

    // ... rest of your Preloader class methods
}

