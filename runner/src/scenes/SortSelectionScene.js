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
        this.isAnimating = false;
        this.sortSpeed = 500;
        this.container = null;  // Will be initialized in create()
        this.gridSize = {
            x: 4,  // 4 columns
            y: 4,  // 4 rows
            spacing: 150,  // Space between elements
            startX: 200,   // Starting X position
            startY: 100    // Starting Y position
        };
    }
    static getSortedScene() {
        return 'space_invaders';
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
        // Only load assets we know exist
        this.load.image('map1scene164', getAssetPath('images/map1scene164.png'));
        this.load.image('map1scene264', getAssetPath('images/map1scene264.png'));
        this.load.image('map1scene364', getAssetPath('images/map1scene364.png'));
        this.load.image('map1scene464', getAssetPath('images/map1scene464.png'));

<<<<<<< Updated upstream
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
        this.load.json('map-config4', getAssetPath('data/map1/map-config64.json'));
=======
        // Load font if it exists
        try {
            this.load.bitmapFont('arcade',
                getAssetPath('fonts/arcade.png'),
                getAssetPath('fonts/arcade.xml')
            );
        } catch (e) {
            console.warn('Font loading failed, using system font');
        }
>>>>>>> Stashed changes
    }

    create() {
        // Set up the game area with a dark background
        this.cameras.main.setBackgroundColor('#000000');

        // Initialize the container
        this.container = this.add.container(0, 0);

        // Create fixed grid positions for thumbnails
        this.gridPositions = [];
        const startX = 200;
        const startY = 100;
        const spacing = 150;
        const itemsPerRow = 2;

        // Create a 2x2 grid for the 4 thumbnails
        for (let i = 0; i < 4; i++) {
            const row = Math.floor(i / itemsPerRow);
            const col = i % itemsPerRow;
            this.gridPositions.push({
                x: startX + (col * spacing),
                y: startY + (row * spacing)
            });
        }

        // Create thumbnails in grid layout
        const thumbnailKeys = [
            'map1scene164', 'map1scene264', 'map1scene364', 'map1scene464'
        ];

        this.thumbnails = [];
        thumbnailKeys.forEach((key, index) => {
            const pos = this.gridPositions[index];
            const thumb = this.add.image(pos.x, pos.y, key)
                .setScale(0.8)
                .setInteractive();

            // Add highlight box
            const highlight = this.add.rectangle(pos.x, pos.y, 100, 80, 0x00ff00, 0)
                .setStrokeStyle(2, 0x00ff00);
            thumb.highlight = highlight;

            // Store original position for sorting
            thumb.originalX = pos.x;
            thumb.originalY = pos.y;
            thumb.currentIndex = index;

            this.thumbnails.push(thumb);
            this.container.add([highlight, thumb]);
        });

        // Create sort method buttons
        const sorts = [
            { text: 'Bubble Sort', method: 'bubble', color: 0x4a90e2 },
            { text: 'Quick Sort', method: 'quick', color: 0x50e3c2 }
        ];

        // Position buttons at bottom
        sorts.forEach((sort, index) => {
            const buttonBg = this.add.rectangle(
                300 + (index * 200),
                500,
                150,
                40,
                sort.color,
                0.8
            )
                .setStrokeStyle(2, 0xffffff)
                .setInteractive();

            const button = this.add.text(
                300 + (index * 200),
                500,
                sort.text,
                {
                    fontSize: '18px',
                    fill: '#ffffff',
                    fontFamily: 'Arial'
                }
            ).setOrigin(0.5);

            buttonBg.on('pointerdown', () => {
                if (!this.isAnimating) {
                    this.selectSort(sort.method);
                }
            });

            // Add to container
            this.container.add([buttonBg, button]);
        });

        // Add speed control slider
        this.sortSpeed = 500;
        const slider = this.add.rectangle(700, 50, 200, 10, 0x666666)
            .setInteractive();
        const sliderKnob = this.add.circle(700, 50, 10, 0xffffff)
            .setInteractive();

        this.input.setDraggable(sliderKnob);
        sliderKnob.on('drag', (pointer, dragX) => {
            const boundedX = Phaser.Math.Clamp(dragX, 600, 800);
            sliderKnob.x = boundedX;
            this.sortSpeed = 1000 - ((boundedX - 600) / 200 * 900);
        });

        // Add slider to container
        this.container.add([slider, sliderKnob]);
    }

    async animateSwap(element1, element2) {
        if (!element1 || !element2) return;

        // Get grid positions for both elements
        const pos1 = this.gridPositions[element1.currentIndex];
        const pos2 = this.gridPositions[element2.currentIndex];

        // Swap current indices
        const tempIndex = element1.currentIndex;
        element1.currentIndex = element2.currentIndex;
        element2.currentIndex = tempIndex;

        // Create a promise that resolves when both animations complete
        return new Promise(resolve => {
            let completedAnimations = 0;
            const onComplete = () => {
                completedAnimations++;
                if (completedAnimations === 2) {
                    resolve();
                }
            };

            // Animate both elements simultaneously
            this.tweens.add({
                targets: element1,
                x: pos2.x,
                y: pos2.y,
                duration: this.sortSpeed,
                ease: 'Power2',
                onComplete: onComplete
            });

            this.tweens.add({
                targets: element2,
                x: pos1.x,
                y: pos1.y,
                duration: this.sortSpeed,
                ease: 'Power2',
                onComplete: onComplete
            });
        });
    }

    selectSort(method) {
        if (this.isAnimating) return;
        this.isAnimating = true;
        this.selected = method;
        const elements = [...this.thumbnails];

        // Store original positions for visualization
        elements.forEach(el => {
            el.originalX = el.x;
            el.originalY = el.y;
        });

        switch (method) {
            case 'bubble':
                this.animateBubbleSort(elements);
                break;
            case 'quick':
                this.animateQuickSort(elements, 0, elements.length - 1);
                break;
            case 'merge':
                this.animateMergeSort(elements);
                break;
            case 'insertion':
                this.animateInsertionSort(elements);
                break;
            case 'selection':
                this.animateSelectionSort(elements);
                break;
            case 'heap':
                this.animateHeapSort(elements);
                break;
        }
    }

    async animateBubbleSort(elements) {
        for (let i = 0; i < elements.length - 1; i++) {
            for (let j = 0; j < elements.length - i - 1; j++) {
                // Highlight current pair being compared
                this.highlightElements(
                    [elements[j], elements[j + 1]],
                    ['current', 'compare']
                );
                await new Promise(resolve => setTimeout(resolve, this.sortSpeed / 2));

                if (elements[j].originalY > elements[j + 1].originalY) {
                    await this.animateSwap(elements[j], elements[j + 1]);
                    [elements[j], elements[j + 1]] = [elements[j + 1], elements[j]];
                }
            }
        }
        await this.finishSorting();
    }

    async animateQuickSort(arr, start, end) {
        if (start >= end) return;

        // Highlight pivot
        this.highlightElements([arr[end]], ['pivot']);
        await new Promise(resolve => setTimeout(resolve, this.sortSpeed / 2));

        const pivot = await this.partition(arr, start, end);
        await this.animateQuickSort(arr, start, pivot - 1);
        await this.animateQuickSort(arr, pivot + 1, end);
    }

    async partition(arr, start, end) {
        const pivotValue = arr[end].y;
        let pivotIndex = start;

        // Highlight pivot
        this.highlightElements([arr[end]], ['pivot']);

        for (let i = start; i < end; i++) {
            // Highlight current comparison
            this.highlightElements([arr[i], arr[end]], ['current', 'pivot']);
            await new Promise(resolve => setTimeout(resolve, this.sortSpeed / 2));

            if (arr[i].y < pivotValue) {
                if (i !== pivotIndex) {
                    await this.animateSwap(arr[i], arr[pivotIndex], true);
                    [arr[i], arr[pivotIndex]] = [arr[pivotIndex], arr[i]];
                }
                pivotIndex++;
            }
        }

        if (pivotIndex !== end) {
            await this.animateSwap(arr[pivotIndex], arr[end], true);
            [arr[pivotIndex], arr[end]] = [arr[end], arr[pivotIndex]];
        }

        return pivotIndex;
    }

    async animateMergeSort(arr) {
        this.isAnimating = true;
        await this.mergeSortHelper(arr, 0, arr.length - 1);
        this.isAnimating = false;
    }

    async mergeSortHelper(arr, start, end) {
        if (start >= end) return;

        const mid = Math.floor((start + end) / 2);
        await this.mergeSortHelper(arr, start, mid);
        await this.mergeSortHelper(arr, mid + 1, end);
        await this.merge(arr, start, mid, end);
    }

    async merge(arr, start, mid, end) {
        const left = arr.slice(start, mid + 1);
        const right = arr.slice(mid + 1, end + 1);
        let i = 0, j = 0, k = start;

        while (i < left.length && j < right.length) {
            if (left[i].y <= right[j].y) {
                if (arr[k] !== left[i]) {
                    await this.animateSwap(arr[k], left[i]);
                    arr[k] = left[i];
                }
                i++;
            } else {
                if (arr[k] !== right[j]) {
                    await this.animateSwap(arr[k], right[j]);
                    arr[k] = right[j];
                }
                j++;
            }
            k++;
        }

        while (i < left.length) {
            if (arr[k] !== left[i]) {
                await this.animateSwap(arr[k], left[i]);
                arr[k] = left[i];
            }
            i++;
            k++;
        }

        while (j < right.length) {
            if (arr[k] !== right[j]) {
                await this.animateSwap(arr[k], right[j]);
                arr[k] = right[j];
            }
            j++;
            k++;
        }
    }

    async animateSelectionSort(arr) {
        this.isAnimating = true;
        const n = arr.length;

        for (let i = 0; i < n - 1; i++) {
            let minIdx = i;

            // Highlight current element
            this.highlightElements([arr[i]], ['current']);

            for (let j = i + 1; j < n; j++) {
                // Highlight element being compared
                this.highlightElements(
                    [arr[i], arr[j], arr[minIdx]],
                    ['current', 'compare', 'pivot']
                );
                await new Promise(resolve => setTimeout(resolve, this.sortSpeed / 2));

                if (arr[j].y < arr[minIdx].y) {
                    minIdx = j;
                }
            }

            if (minIdx !== i) {
                await this.animateSwap(arr[i], arr[minIdx]);
                [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
            }
        }
        await this.finishSorting();
    }

    async animateInsertionSort(arr) {
        this.isAnimating = true;
        const n = arr.length;

        for (let i = 1; i < n; i++) {
            const key = arr[i];
            let j = i - 1;

            while (j >= 0 && arr[j].y > key.y) {
                await this.animateSwap(arr[j + 1], arr[j]);
                arr[j + 1] = arr[j];
                j--;
            }
            arr[j + 1] = key;
        }
        await this.finishSorting();
    }

    async animateHeapSort(arr) {
        this.isAnimating = true;
        const n = arr.length;

        // Build heap
        for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
            await this.heapify(arr, n, i);
        }

        // Extract elements from heap one by one
        for (let i = n - 1; i > 0; i--) {
            await this.animateSwap(arr[0], arr[i]);
            [arr[0], arr[i]] = [arr[i], arr[0]];
            await this.heapify(arr, i, 0);
        }
        await this.finishSorting();
    }

    async heapify(arr, n, i) {
        let largest = i;
        const left = 2 * i + 1;
        const right = 2 * i + 2;

        if (left < n && arr[left].y > arr[largest].y) {
            largest = left;
        }

        if (right < n && arr[right].y > arr[largest].y) {
            largest = right;
        }

        if (largest !== i) {
            await this.animateSwap(arr[i], arr[largest]);
            [arr[i], arr[largest]] = [arr[largest], arr[i]];
            await this.heapify(arr, n, largest);
        }
    }

    async finishSorting() {
        this.isAnimating = false;

        // Visual feedback - scale animation for all thumbnails
        const promises = this.thumbnails.map(thumb => {
            return new Promise(resolve => {
                this.tweens.add({
                    targets: thumb,
                    scale: { from: 0.8, to: 1 },
                    duration: 200,
                    yoyo: true,
                    ease: 'Power2',
                    onComplete: resolve
                });
            });
        });

        await Promise.all(promises);

        // Store the sorted order and transition to the next scene
        const sortedScenes = this.thumbnails.map(thumb => thumb.texture.key);
        this.scene.start('game_scene', {
            sortType: this.selected,
            sortedScenes: sortedScenes,
            score: this.score || 0,
            currentMap: this.currentMap || 1
        });
    }

    highlightElements(elements, types) {
        // Clear all previous highlights
        this.thumbnails.forEach(thumb => thumb.highlight.setAlpha(0));

        // Apply new highlights with different colors for different types
        elements.forEach((element, index) => {
            if (element && types[index]) {
                const color = types[index] === 'pivot' ? 0xff0000 :
                    types[index] === 'current' ? 0x00ff00 : 0x0000ff;
                element.highlight
                    .setFillStyle(color)
                    .setAlpha(0.3);
            }
        });
    }
    transitionToNextScene() {
        if (this.isTransitioning) return;

        this.isTransitioning = true;
        this.cameras.main.fadeOut(500);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('space_invaders', {
                nextScene: 'map1scene1',
                score: this.score
            });
        });
    }
}