import { getAssetPath } from "../utils/assetLoader";
import Phaser from 'phaser';


export default class SortSelectionScene extends Phaser.Scene {
    constructor() {
        super({ key: 'sort_selection' });
        this.score = 0;
        this.currentMap = 1;
        this.selected = null;
        this.thumbnails = [];
        this.connections = [];

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
        this.load.json('map-config', getAssetPath('data/map1/map-config.json'));
        this.load.json('map-config2', getAssetPath('data/map1/map-config2.json'));
        this.load.json('map-config3', getAssetPath('data/map1/map-config3.json'));
        this.load.json('map-config4', getAssetPath('data/map1/map-config4.json'));

        this.load.json('map-config', getAssetPath('data/map2/map-config.json'));
        this.load.json('map-config2', getAssetPath('data/map2/map-config2.json'));
        this.load.json('map-config3', getAssetPath('data/map2/map-config3.json'));
        this.load.json('map-config4', getAssetPath('data/map2/map-config4.json'));

        this.load.json('map-config', getAssetPath('data/map3/map-config.json'));
        this.load.json('map-config2', getAssetPath('data/map3/map-config2.json'));
        this.load.json('map-config3', getAssetPath('data/map3/map-config3.json'));
        this.load.json('map-config4', getAssetPath('data/map3/map-config4.json'));

        this.load.json('map-config', getAssetPath('data/map4/map-config.json'));
        this.load.json('map-config2', getAssetPath('data/map4/map-config2.json'));
        this.load.json('map-config3', getAssetPath('data/map4/map-config3.json'));
        this.load.json('map-config4', getAssetPath('data/map4/map-config4.json'));
    }

    create() {

        // Title
        this.add.text(400, 50, 'Select Sorting Method', {
            fontSize: '32px',
            fill: '#fff'
        }).setOrigin(0.5);

        // Create graph container
        this.container = this.add.container(400, 250);

        // Create thumbnails in a tree structure
        const thumbnailKeys = [
            'map1scene164', 'map1scene264', 'map1scene364', 'map1scene464',
            'map2scene164', 'map2scene264', 'map2scene364', 'map2scene464',
            'map3scene164', 'map3scene264', 'map3scene364', 'map3scene464'
        ];

        // Create thumbnails in a binary tree layout
        thumbnailKeys.forEach((key, index) => {
            const level = Math.floor(Math.log2(index + 1));
            const position = index - Math.pow(2, level) + 1;
            const maxInLevel = Math.pow(2, level);
            const spacing = 100;

            const x = position * (800 / maxInLevel) - 350;
            const y = level * spacing - 100;

            const thumb = this.add.image(x, y, key)
                .setScale(0.8)
                .setInteractive();

            // Add hover effects
            thumb.on('pointerover', () => {
                this.tweens.add({
                    targets: thumb,
                    scale: 1,
                    duration: 200
                });
            });

            thumb.on('pointerout', () => {
                this.tweens.add({
                    targets: thumb,
                    scale: 0.8,
                    duration: 200
                });
            });

            this.thumbnails.push(thumb);
            this.container.add(thumb);

            // Draw connections
            if (index > 0) {
                const parentIndex = Math.floor((index - 1) / 2);
                const parent = this.thumbnails[parentIndex];
                const graphics = this.add.graphics();
                graphics.lineStyle(2, 0x666666);
                graphics.beginPath();
                graphics.moveTo(parent.x, parent.y);
                graphics.lineTo(thumb.x, thumb.y);
                graphics.strokePath();
                this.connections.push(graphics);
                this.container.add(graphics);
            }
        });

        // Sort method buttons
        const sorts = [
            { text: 'Bubble Sort', method: 'bubble', description: 'O(n²) - Simple but inefficient' },
            { text: 'Quick Sort', method: 'quick', description: 'O(n log n) - Fast divide & conquer' },
            { text: 'Merge Sort', method: 'merge', description: 'O(n log n) - Stable divide & conquer' },
            { text: 'Insertion Sort', method: 'insertion', description: 'O(n²) - Good for small data' },
            { text: 'Selection Sort', method: 'selection', description: 'O(n²) - Simple to understand' },
            { text: 'Heap Sort', method: 'heap', description: 'O(n log n) - In-place sorting' }
        ];

        // Create a container for sort buttons
        const buttonContainer = this.add.container(400, 450);
        const buttonSpacing = 50;
        const buttonsPerColumn = 3;

        sorts.forEach((sort, index) => {
            const column = Math.floor(index / buttonsPerColumn);
            const row = index % buttonsPerColumn;
            const x = column * 250 - 200;
            const y = row * buttonSpacing;

            // Create button background
            const buttonBg = this.add.rectangle(x, y, 200, 40, 0x333333)
                .setInteractive();

            // Create button text
            const button = this.add.text(x, y, sort.text, {
                fontSize: '20px',
                fill: '#fff',
                padding: { x: 10, y: 5 }
            }).setOrigin(0.5);

            // Create description text
            const description = this.add.text(x, y + 15, sort.description, {
                fontSize: '12px',
                fill: '#aaa',
            }).setOrigin(0.5);
            description.setVisible(false);

            // Add hover effects
            buttonBg.on('pointerover', () => {
                this.tweens.add({
                    targets: [buttonBg, button],
                    scaleX: 1.1,
                    scaleY: 1.1,
                    duration: 100
                });
                buttonBg.setFillStyle(0x666666);
                description.setVisible(true);
            });

            buttonBg.on('pointerout', () => {
                this.tweens.add({
                    targets: [buttonBg, button],
                    scaleX: 1,
                    scaleY: 1,
                    duration: 100
                });
                buttonBg.setFillStyle(0x333333);
                description.setVisible(false);
            });

            buttonBg.on('pointerdown', () => {
                this.selectSort(sort.method);
                // Highlight selected button
                sorts.forEach((_, i) => {
                    const otherButton = buttonContainer.list[i * 3];
                    otherButton.setFillStyle(0x333333);
                });
                buttonBg.setFillStyle(0x00aa00);
            });

            // Add to container
            buttonContainer.add([buttonBg, button, description]);
        });

        // Add container to scene
        this.add.existing(buttonContainer);
    }

    selectSort(method) {
        this.selected = method;
        this.sceneManager.setSortMethod(method);
        this.animateSort();
    }

    animateSort() {
        const elements = this.thumbnails;
        switch (this.selected) {
            case 'bubble':
                this.animateBubbleSort([...elements]);
                break;
            case 'quick':
                this.animateQuickSort([...elements], 0, elements.length - 1);
                break;
            case 'merge':
                this.animateMergeSort([...elements]);
                break;
            case 'insertion':
                this.animateInsertionSort([...elements]);
                break;
            case 'selection':
                this.animateSelectionSort([...elements]);
                break;
            case 'heap':
                this.animateHeapSort([...elements]);
                break;
        }
    }

    async animateBubbleSort(elements) {
        const positions = elements.map(el => ({ x: el.x, y: el.y }));

        for (let i = 0; i < elements.length; i++) {
            for (let j = 0; j < elements.length - i - 1; j++) {
                // Highlight current comparison
                elements[j].setTint(0x00ff00);
                elements[j + 1].setTint(0x00ff00);

                await new Promise(resolve => {
                    this.time.delayedCall(500, resolve);
                });

                if (elements[j].x > elements[j + 1].x) {
                    // Swap positions
                    const tempX = positions[j].x;
                    positions[j].x = positions[j + 1].x;
                    positions[j + 1].x = tempX;

                    // Animate the swap
                    this.tweens.add({
                        targets: elements[j],
                        x: positions[j].x,
                        duration: 500
                    });
                    this.tweens.add({
                        targets: elements[j + 1],
                        x: positions[j + 1].x,
                        duration: 500
                    });

                    // Swap elements in array
                    [elements[j], elements[j + 1]] = [elements[j + 1], elements[j]];
                }

                // Remove highlight
                elements[j].clearTint();
                elements[j + 1].clearTint();
            }
        }

        this.startGame();
    }

    async animateQuickSort(elements, start, end) {
        if (start >= end) {
            if (start === end) elements[start].setTint(0x00ff00);
            return;
        }

        const pivot = elements[end];
        pivot.setTint(0xff0000);
        let i = start - 1;

        for (let j = start; j < end; j++) {
            elements[j].setTint(0x00ff00);
            await new Promise(resolve => this.time.delayedCall(500, resolve));

            if (elements[j].x < pivot.x) {
                i++;
                // Swap animation
                const tempX = elements[i].x;
                elements[i].x = elements[j].x;
                elements[j].x = tempX;
                [elements[i], elements[j]] = [elements[j], elements[i]];
            }

            elements[j].clearTint();
        }

        // Place pivot in correct position
        const tempX = elements[i + 1].x;
        elements[i + 1].x = pivot.x;
        pivot.x = tempX;
        [elements[i + 1], elements[end]] = [elements[end], elements[i + 1]];

        pivot.clearTint();

        // Recursively sort sub-arrays
        await this.animateQuickSort(elements, start, i);
        await this.animateQuickSort(elements, i + 2, end);

        if (start === 0 && end === elements.length - 1) {
            this.startGame();
        }
    }

    async animateMergeSort(elements) {
        if (elements.length <= 1) return elements;

        const mid = Math.floor(elements.length / 2);
        const left = elements.slice(0, mid);
        const right = elements.slice(mid);

        // Highlight split
        left.forEach(el => el.setTint(0x0000ff));
        right.forEach(el => el.setTint(0xff0000));
        await new Promise(resolve => this.time.delayedCall(500, resolve));

        // Recursively sort
        await this.animateMergeSort(left);
        await this.animateMergeSort(right);

        // Merge animation
        let i = 0, j = 0, k = 0;
        const merged = [];
        const positions = elements.map(el => el.x);

        while (i < left.length && j < right.length) {
            if (left[i].x < right[j].x) {
                merged[k] = left[i];
                elements[k].x = positions[k];
                i++;
            } else {
                merged[k] = right[j];
                elements[k].x = positions[k];
                j++;
            }
            k++;
        }

        // Add remaining elements
        while (i < left.length) {
            merged[k] = left[i];
            elements[k].x = positions[k];
            i++;
            k++;
        }

        while (j < right.length) {
            merged[k] = right[j];
            elements[k].x = positions[k];
            j++;
            k++;
        }

        // Clear tints
        elements.forEach(el => el.clearTint());

        if (elements.length === this.thumbnails.length) {
            this.startGame();
        }

        return merged;
    }

    async animateInsertionSort(elements) {
        const positions = elements.map(el => ({ x: el.x, y: el.y }));

        for (let i = 1; i < elements.length; i++) {
            const key = elements[i];
            key.setTint(0xff0000);
            let j = i - 1;

            await new Promise(resolve => this.time.delayedCall(500, resolve));

            while (j >= 0 && elements[j].x > key.x) {
                elements[j].setTint(0x00ff00);

                // Move element right
                elements[j + 1] = elements[j];
                this.tweens.add({
                    targets: elements[j],
                    x: positions[j + 1].x,
                    duration: 500
                });

                j--;
                await new Promise(resolve => this.time.delayedCall(300, resolve));
                elements[j + 2]?.clearTint();
            }

            elements[j + 1] = key;
            this.tweens.add({
                targets: key,
                x: positions[j + 1].x,
                duration: 500
            });

            await new Promise(resolve => this.time.delayedCall(500, resolve));
            key.clearTint();
        }

        this.startGame();
    }

    async animateSelectionSort(elements) {
        const positions = elements.map(el => ({ x: el.x, y: el.y }));

        for (let i = 0; i < elements.length - 1; i++) {
            let minIdx = i;
            elements[i].setTint(0xff0000);

            for (let j = i + 1; j < elements.length; j++) {
                elements[j].setTint(0x00ff00);
                await new Promise(resolve => this.time.delayedCall(300, resolve));

                if (elements[j].x < elements[minIdx].x) {
                    elements[minIdx].clearTint();
                    minIdx = j;
                    elements[minIdx].setTint(0xff00ff);
                } else {
                    elements[j].clearTint();
                }
            }

            if (minIdx !== i) {
                // Swap animation
                const tempX = positions[i].x;
                positions[i].x = positions[minIdx].x;
                positions[minIdx].x = tempX;

                this.tweens.add({
                    targets: elements[i],
                    x: positions[i].x,
                    duration: 500
                });
                this.tweens.add({
                    targets: elements[minIdx],
                    x: positions[minIdx].x,
                    duration: 500
                });

                [elements[i], elements[minIdx]] = [elements[minIdx], elements[i]];
            }

            await new Promise(resolve => this.time.delayedCall(500, resolve));
            elements[i].clearTint();
            elements[minIdx].clearTint();
        }

        this.startGame();
    }

    async animateHeapSort(elements) {
        const positions = elements.map(el => ({ x: el.x, y: el.y }));

        const heapify = async (n, i) => {
            let largest = i;
            const left = 2 * i + 1;
            const right = 2 * i + 2;

            elements[i].setTint(0xff0000);
            await new Promise(resolve => this.time.delayedCall(300, resolve));

            if (left < n) {
                elements[left].setTint(0x00ff00);
                if (elements[left].x > elements[largest].x) {
                    elements[largest].clearTint();
                    largest = left;
                    elements[largest].setTint(0xff0000);
                }
            }

            if (right < n) {
                elements[right].setTint(0x00ff00);
                if (elements[right].x > elements[largest].x) {
                    elements[largest].clearTint();
                    largest = right;
                    elements[largest].setTint(0xff0000);
                }
            }

            if (largest !== i) {
                // Swap animation
                const tempX = positions[i].x;
                positions[i].x = positions[largest].x;
                positions[largest].x = tempX;

                this.tweens.add({
                    targets: elements[i],
                    x: positions[i].x,
                    duration: 500
                });
                this.tweens.add({
                    targets: elements[largest],
                    x: positions[largest].x,
                    duration: 500
                });

                [elements[i], elements[largest]] = [elements[largest], elements[i]];

                await heapify(n, largest);
            }

            elements[i].clearTint();
            if (left < n) elements[left].clearTint();
            if (right < n) elements[right].clearTint();
        };

        // Build max heap
        for (let i = Math.floor(elements.length / 2) - 1; i >= 0; i--) {
            await heapify(elements.length, i);
        }

        // Extract elements from heap
        for (let i = elements.length - 1; i > 0; i--) {
            // Swap root with last element
            const tempX = positions[0].x;
            positions[0].x = positions[i].x;
            positions[i].x = tempX;

            this.tweens.add({
                targets: elements[0],
                x: positions[0].x,
                duration: 500
            });
            this.tweens.add({
                targets: elements[i],
                x: positions[i].x,
                duration: 500
            });

            [elements[0], elements[i]] = [elements[i], elements[0]];

            await new Promise(resolve => this.time.delayedCall(500, resolve));
            await heapify(i, 0);
        }

        this.startGame();
    }

    startGame() {
        this.time.delayedCall(1000, () => {
            const firstScene = this.sceneManager.getFirstScene();
            this.scene.start(firstScene, {
                sortType: this.selected,
                structure: this.thumbnails,
                sortedScenes: this.sceneManager.getSortedScenes()
            });
        });
    }
}