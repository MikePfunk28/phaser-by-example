import { getAssetPath } from "../utils/assetLoader";
import Phaser, { AUTO } from 'phaser';

export default class SortSelectionScene extends Phaser.Scene {
    constructor() {
        super({ key: 'sort_selection' });
        this.score = 0;
        this.currentMap = 1;
        this.selected = null;
        this.thumbnails = [];
        this.connections = [];
        this.sortSpeed = 500; // Default sort speed
        this.sceneManager = {
            setSortMethod: (method) => {
                this.selected = method;
            },
            getFirstScene: () => {
                return 'space_invaders';
            },
            getSortedScenes: () => {
                return this.thumbnails.map(thumb => thumb.texture.key);
            }
        };
    }
    static getSortedScene() {
        return 'space_invaders';
    }

    init(data) {
        this.score = data.score || 0;
        this.currentMap = data.currentMap || 1;
        this.selected = data.selected || null;
        this.thumbnails = [];
        this.connections = [];
        this.progress = data.progress || 0;
        window.sceneManager.gameState.score = this.score;
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

        // Add missing thumbnails
        this.load.image('map4scene364', getAssetPath('images/map4scene364.png'));
        this.load.image('map4scene464', getAssetPath('images/map4scene464.png'));

        this.load.json('map-config', getAssetPath('data/map1/map-config.json'));
        this.load.json('questions', getAssetPath('data/questions.json'));
        this.load.bitmapFont('arcade',
            getAssetPath('fonts/arcade.png'),
            getAssetPath('fonts/arcade.xml')
        );
        this.load.json('map-config4', getAssetPath('data/map1/map-config64.json'));

        // Add background
        this.load.image('background', getAssetPath('images/backgrounds/space-background.png'));
    }

    create() {
        // Add animated background
        const bg = this.add.image(400, 300, 'background');
        bg.setAlpha(0.3);  // Semi-transparent background

        // Add a gradient overlay
        const gradient = this.add.graphics();
        gradient.fillGradientStyle(0x000000, 0x000000, 0x112244, 0x112244, 0.7);
        gradient.fillRect(0, 0, 800, 600);

        // Add score display at top left
        this.add.text(20, 20, 'Score: ' + this.score, {
            fontSize: '24px',
            fill: '#fff'
        });

        // Add color key legend at top right
        const legendX = 600;
        const legendY = 5;
        this.add.text(legendX, legendY, 'Color Key:', {
            fontSize: '18px',
            fill: '#fff'
        });

        // Add color boxes with labels
        const colors = [
            { color: 0xff0000, label: 'Pivot/Current' },
            { color: 0x0000ff, label: 'Comparing' },
            { color: 0x00ff00, label: 'Sorted/Default' }
        ];

        colors.forEach((item, index) => {
            const boxY = legendY + 30 + (index * 25);
            this.add.rectangle(legendX, boxY, 20, 20, item.color);
            this.add.text(legendX + 15, boxY, item.label, {
                fontSize: '14px',
                fill: '#fff'
            }).setOrigin(0, 0.5);
        });

        // Title
        this.add.text(400, 50, 'Sort Selection', {
            fontSize: '32px',
            fill: '#fff'
        }).setOrigin(0.5);

        // Create graph container
        this.container = this.add.container(425, 250);

        // Create thumbnails in a grid layout
        const thumbnailKeys = [
            'map1scene164', 'map1scene264', 'map1scene364', 'map1scene464',
            'map2scene164', 'map2scene264', 'map2scene364', 'map2scene464',
            'map3scene164', 'map3scene264', 'map3scene364', 'map3scene464',
            'map4scene364', 'map4scene464'
        ];

        // Calculate grid layout parameters
        const GRID_COLS = 7;
        const GRID_ROWS = 2;
        const THUMB_WIDTH = 64;
        const THUMB_HEIGHT = 64;
        const SPACING_X = 20;
        const SPACING_Y = 20;

        // Calculate total grid dimensions
        const thumbnailGridWidth = (GRID_COLS * THUMB_WIDTH) + ((GRID_COLS - 1) * SPACING_X);
        const totalGridHeight = (GRID_ROWS * THUMB_HEIGHT) + ((GRID_ROWS - 1) * SPACING_Y);

        // Calculate starting position to center the grid
        const startX = -thumbnailGridWidth / 2;
        const startY = -totalGridHeight / 2;

        // Store initial positions for reference (needed for sorting animations)
        this.initialPositions = [];

        // Create thumbnails in a grid (7 columns, 2 rows)
        thumbnailKeys.forEach((key, index) => {
            const row = Math.floor(index / GRID_COLS);
            const col = index % GRID_COLS;

            // Calculate position with proper spacing
            const x = startX + (col * (THUMB_WIDTH + SPACING_X));
            const y = startY + (row * (THUMB_HEIGHT + SPACING_Y));

            // Store the position for this index
            this.initialPositions[index] = { x, y };

            const thumb = this.add.image(x, y, key)
                .setScale(0.8)
                .setInteractive();

            // Keep existing hover effects
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
        });

        // Create sort buttons in two rows with improved alignment and interaction
        const sorts = [
            {
                text: 'Bubble Sort',
                method: 'bubble',
                color: 0x4a90e2,
                complexity: 'O(n²)',
                description: 'Compares adjacent elements and swaps them if they are in the wrong order.'
            },
            {
                text: 'Quick Sort',
                method: 'quick',
                color: 0x50e3c2,
                complexity: 'O(n log n)',
                description: 'Uses a pivot element to partition the array into smaller sub-arrays.'
            },
            {
                text: 'Merge Sort',
                method: 'merge',
                color: 0xe3506f,
                complexity: 'O(n log n)',
                description: 'Divides array into smaller arrays, sorts them, and merges them back.'
            },
            {
                text: 'Insertion Sort',
                method: 'insertion',
                color: 0xe3a150,
                complexity: 'O(n²)',
                description: 'Builds sorted array one item at a time by comparing with previous elements.'
            },
            {
                text: 'Selection Sort',
                method: 'selection',
                color: 0x9b59b6,
                complexity: 'O(n²)',
                description: 'Finds minimum element and places it at the beginning.'
            },
            {
                text: 'Heap Sort',
                method: 'heap',
                color: 0x1abc9c,
                complexity: 'O(n log n)',
                description: 'Uses a binary heap data structure to sort elements.'
            }
        ];

        // Create modern tooltip style
        const createModernTooltip = (x, y, sort) => {
            // Create tooltip container
            const tooltipContainer = this.add.container(x, y - 70);

            // Semi-transparent background
            const bg = this.add.rectangle(0, 0, 320, 80, 0x000000, 0.7)
                .setStrokeStyle(1, 0xffffff, 0.3);

            // Simple tooltip text
            const tooltipText = this.add.text(0, 0,
                `Time Complexity: ${sort.complexity}\n${sort.description}`,
                {
                    fontSize: '14px',
                    fill: '#ffffff',
                    align: 'center',
                    padding: { x: 10, y: 5 },
                    wordWrap: { width: 300 }
                }
            ).setOrigin(0.5);

            tooltipContainer.add([bg, tooltipText]);
            tooltipContainer.setDepth(100);

            return tooltipContainer;
        };

        // Reorganize controls layout
        const controlsY = 525;  // Move controls up
        const buttonContainer = this.add.container(400, controlsY - 110);  // Buttons above controls

        // Calculate total width and height of button grid
        const buttonWidth = 180;
        const buttonHeight = 40;
        const buttonSpacingX = 40;
        const buttonSpacingY = 20;
        const buttonsPerRow = 3;

        const buttonGridWidth = (buttonWidth * buttonsPerRow) + (buttonSpacingX * (buttonsPerRow - 1));
        const buttonStartX = -buttonGridWidth / 2;

        sorts.forEach((sort, index) => {
            const row = Math.floor(index / buttonsPerRow);
            const col = index % buttonsPerRow;

            // Calculate centered position
            const x = buttonStartX + (col * (buttonWidth + buttonSpacingX)) + (buttonWidth / 2);
            const y = row * (buttonHeight + buttonSpacingY);

            const buttonGroup = this.add.container(x, y);

            const button = this.add.rectangle(0, 0, buttonWidth, buttonHeight, sort.color, 0.8)
                .setStrokeStyle(2, 0xffffff)
                .setInteractive({ useHandCursor: true });

            // Add unique name for the button
            button.name = `${sort.method}-sort-button`;

            const text = this.add.text(0, 0, sort.text, {
                fontSize: '18px',
                fill: '#ffffff',
                fontFamily: 'Arial'
            }).setOrigin(0.5);

            buttonGroup.add([button, text]);
            buttonContainer.add(buttonGroup);

            // Update button hover handlers
            button.on('pointerover', () => {
                button.setFillStyle(sort.color, 1);
                this.tweens.add({
                    targets: buttonGroup,
                    scaleX: 1.05,
                    scaleY: 1.05,
                    duration: 100
                });

                buttonGroup.tooltip = createModernTooltip(
                    buttonGroup.x + buttonContainer.x,
                    buttonGroup.y + buttonContainer.y,
                    sort
                );
            });

            button.on('pointerout', () => {
                button.setFillStyle(sort.color, 0.8);
                this.tweens.add({
                    targets: buttonGroup,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 100
                });

                if (buttonGroup.tooltip) {
                    buttonGroup.tooltip.destroy();
                    buttonGroup.tooltip = null;
                }
            });

            // Improved button click handling
            button.on('pointerdown', () => {
                button.setFillStyle(sort.color, 0.6);
                this.selectSort(sort.method);
            });

            button.on('pointerup', () => {
                button.setFillStyle(sort.color, 1);
            });
        });

        // Move speed control and back button
        const sliderX = 400;
        const sliderY = controlsY + 20;

        // Create a control panel background
        const controlPanel = this.add.rectangle(400, controlsY + 20, 600, 60, 0x000000, 0.5)
            .setStrokeStyle(1, 0xffffff, 0.3);

        // Back button on left with improved styling
        const backButtonGroup = this.add.container(180, controlsY + 20);

        const backButton = this.add.rectangle(0, 0, 100, 40, 0x000000, 0.6)
            .setInteractive({ useHandCursor: true })
            .setStrokeStyle(2, 0x00ff00, 0.8);

        const backText = this.add.text(0, 0, 'Back', {
            fontSize: '18px',
            fill: '#fff'
        }).setOrigin(0.5);

        // Add warning text (hidden by default)
        const warningText = this.add.text(0, -30, 'Please wait for sorting to finish', {
            fontSize: '14px',
            fill: '#ff0000',
            backgroundColor: '#000000',
            padding: { x: 5, y: 2 }
        }).setOrigin(0.5).setVisible(false);

        backButtonGroup.add([backButton, backText, warningText]);

        // Add hover effects for back button
        backButton.on('pointerover', () => {
            if (this.isAnimating) {
                warningText.setVisible(true);
                return;
            }
            backButton.setFillStyle(0x444444);
            this.tweens.add({
                targets: backButtonGroup,
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 100
            });
        });

        backButton.on('pointerout', () => {
            warningText.setVisible(false);
            if (this.isAnimating) return;
            backButton.setFillStyle(0x333333);
            this.tweens.add({
                targets: backButtonGroup,
                scaleX: 1,
                scaleY: 1,
                duration: 100
            });
        });

        backButton.on('pointerdown', () => {
            if (this.isAnimating) {
                // Show warning feedback
                this.tweens.add({
                    targets: warningText,
                    alpha: 0,
                    duration: 200,
                    yoyo: true,
                    repeat: 1
                });
                return;
            }
            backButton.setFillStyle(0x222222);
            // Add camera fade for smooth transition
            this.cameras.main.fadeOut(500);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                window.sceneTransition.transition(this, 'main_menu', {
                    score: this.score,
                    currentMap: this.currentMap
                });
            });
        });
        backButtonGroup.setDepth(50);  // Ensure it's above tooltips

        // Speed control with improved interaction
        this.add.text(sliderX - 165, sliderY, 'Speed:', {
            fontSize: '18px',
            fill: '#fff'
        }).setOrigin(0, 0.5);

        const slider = this.add.rectangle(sliderX, sliderY, 200, 10, 0x666666)
            .setInteractive({ useHandCursor: true });

        const knob = this.add.circle(sliderX, sliderY, 10, 0xffffff)
            .setInteractive({ useHandCursor: true })
            .setDepth(1);

        // Improved slider interaction
        let isDragging = false;

        knob.on('pointerdown', () => {
            isDragging = true;
        });

        this.input.on('pointermove', (pointer) => {
            if (isDragging) {
                const bounds = slider.getBounds();
                knob.x = Phaser.Math.Clamp(pointer.x, bounds.left, bounds.right);
                this.sortSpeed = 1000 - ((knob.x - bounds.left) / bounds.width * 900);
            }
        });

        this.input.on('pointerup', () => {
            isDragging = false;
        });

        slider.on('pointerdown', (pointer) => {
            const bounds = slider.getBounds();
            knob.x = Phaser.Math.Clamp(pointer.x, bounds.left, bounds.right);
            this.sortSpeed = 1000 - ((knob.x - bounds.left) / bounds.width * 900);
        });
    }

    selectSort(method) {
        if (this.isAnimating) return; // Prevent multiple animations
        this.isAnimating = true;
        this.selected = method;
        this.sceneManager.setSortMethod(method);

        // Create or update stats display
        if (this.statsText) this.statsText.destroy();
        this.statsText = this.add.text(20, 60, 'Sorting...', {
            fontSize: '16px',
            fill: '#fff',
            fontFamily: 'monospace'
        });

        // Start timing
        this.sortStartTime = performance.now();
        this.computeStartTime = performance.now();

        // Pre-compute the sort to get actual algorithm time
        const elements = [...this.thumbnails];
        const computeResult = this.computeSort(method, elements);
        this.computeEndTime = performance.now();

        // Update stats with compute time
        const computeTime = (this.computeEndTime - this.computeStartTime).toFixed(2);
        this.statsText.setText(`Computing sort... ${computeTime}ms`);

        // Now start the animation
        this.animateSort();
    }

    computeSort(method, elements) {
        const wrappedElements = this.initializeElements(elements);

        switch (method) {
            case 'bubble': return this.computeBubbleSort([...wrappedElements]);
            case 'quick': return this.computeQuickSort([...wrappedElements], 0, wrappedElements.length - 1);
            case 'merge': return this.computeMergeSort([...wrappedElements]);
            case 'insertion': return this.computeInsertionSort([...wrappedElements]);
            case 'selection': return this.computeSelectionSort([...wrappedElements]);
            case 'heap': return this.computeHeapSort([...wrappedElements]);
        }
    }

    // Example of one compute function (add similar ones for other sorts)
    computeBubbleSort(elements) {
        for (let i = 0; i < elements.length; i++) {
            for (let j = 0; j < elements.length - i - 1; j++) {
                if (this.compareElements(elements[j], elements[j + 1]) > 0) {
                    [elements[j], elements[j + 1]] = [elements[j + 1], elements[j]];
                }
            }
        }
        return elements;
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

    // Add consistent initialization for all sorting algorithms
    initializeElements(elements) {
        return elements.map((el, idx) => ({
            sprite: el,
            originalIndex: idx,
            originalX: el.x,
            value: el.x  // Store initial x value for comparison
        }));
    }

    // Add consistent comparison function that uses original values
    compareElements(a, b) {
        if (a.value !== b.value) return a.value - b.value;
        return a.originalIndex - b.originalIndex;
    }

    async animateSwap(wrappedElements, i, j, duration = 500) {
        const posI = this.initialPositions[i];
        const posJ = this.initialPositions[j];

        return new Promise(resolve => {
            let completed = 0;
            const onComplete = () => {
                completed++;
                if (completed === 2) resolve();
            };

            this.tweens.add({
                targets: wrappedElements[i].sprite,
                x: posJ.x,
                y: posJ.y,
                duration: duration,
                onComplete: onComplete
            });

            this.tweens.add({
                targets: wrappedElements[j].sprite,
                x: posI.x,
                y: posI.y,
                duration: duration,
                onComplete: onComplete
            });

            // Swap elements but keep their original values
            [wrappedElements[i], wrappedElements[j]] = [wrappedElements[j], wrappedElements[i]];
        });
    }

    async animateBubbleSort(elements) {
        const wrappedElements = this.initializeElements(elements);

        for (let i = 0; i < wrappedElements.length; i++) {
            for (let j = 0; j < wrappedElements.length - i - 1; j++) {
                // Use blue for current comparison
                wrappedElements[j].sprite.setTint(0x0000ff);
                wrappedElements[j + 1].sprite.setTint(0x0000ff);

                await new Promise(resolve => this.time.delayedCall(this.sortSpeed / 2, resolve));

                if (this.compareElements(wrappedElements[j], wrappedElements[j + 1]) > 0) {
                    // Use red for elements being swapped
                    wrappedElements[j].sprite.setTint(0xff0000);
                    wrappedElements[j + 1].sprite.setTint(0xff0000);
                    await this.animateSwap(wrappedElements, j, j + 1);
                    // Use green for sorted position
                    wrappedElements[j].sprite.setTint(0x00ff00);
                    wrappedElements[j + 1].sprite.setTint(0x00ff00);
                }

                wrappedElements[j].sprite.clearTint();
                wrappedElements[j + 1].sprite.clearTint();
            }
            // Mark the last element as sorted
            wrappedElements[wrappedElements.length - i - 1].sprite.setTint(0x00ff00);
        }

        await this.finishSort(wrappedElements.map(w => w.sprite));
    }

    async animateQuickSort(elements, start, end) {
        if (start >= end) {
            if (start === end) elements[start].sprite.setTint(0x00ff00);
            return;
        }

        const pivot = elements[end];
        pivot.sprite.setTint(0xff0000);
        let i = start - 1;

        for (let j = start; j < end; j++) {
            elements[j].sprite.setTint(0x00ff00);
            await new Promise(resolve => this.time.delayedCall(this.sortSpeed / 2, resolve));

            if (this.compareElements(elements[j], pivot) <= 0) {
                i++;
                if (i !== j) {
                    await this.animateSwap(elements, i, j);
                }
            }
            elements[j].sprite.clearTint();
        }

        if (i + 1 !== end) {
            await this.animateSwap(elements, i + 1, end);
        }
        pivot.sprite.clearTint();

        const pivotIndex = i + 1;
        await this.animateQuickSort(elements, start, pivotIndex - 1);
        await this.animateQuickSort(elements, pivotIndex + 1, end);

        if (start === 0 && end === elements.length - 1) {
            await this.finishSort(elements.map(w => w.sprite));
        }
    }

    async animateMergeSort(elements) {
        if (elements.length <= 1) return elements;

        const mid = Math.floor(elements.length / 2);
        const left = elements.slice(0, mid);
        const right = elements.slice(mid);

        // Highlight split with correct colors
        left.forEach(el => el.sprite.setTint(0x0000ff));  // Blue for left partition
        right.forEach(el => el.sprite.setTint(0xff0000)); // Red for right partition
        await new Promise(resolve => this.time.delayedCall(this.sortSpeed / 2, resolve));

        // Clear split highlighting before recursion
        left.forEach(el => el.sprite.clearTint());
        right.forEach(el => el.sprite.clearTint());

        const sortedLeft = await this.animateMergeSort(left);
        const sortedRight = await this.animateMergeSort(right);

        const merged = new Array(sortedLeft.length + sortedRight.length);
        let i = 0, j = 0, k = 0;

        while (i < sortedLeft.length && j < sortedRight.length) {
            // Use blue for comparing left element
            sortedLeft[i].sprite.setTint(0x0000ff);
            // Use red for comparing right element
            sortedRight[j].sprite.setTint(0xff0000);

            await new Promise(resolve => this.time.delayedCall(this.sortSpeed / 2, resolve));

            if (this.compareElements(sortedLeft[i], sortedRight[j]) <= 0) {
                merged[k] = sortedLeft[i];
                // Set green for placed element
                merged[k].sprite.setTint(0x00ff00);
                i++;
            } else {
                merged[k] = sortedRight[j];
                // Set green for placed element
                merged[k].sprite.setTint(0x00ff00);
                j++;
            }

            const targetPos = this.initialPositions[k];
            await this.tweens.add({
                targets: merged[k].sprite,
                x: targetPos.x,
                y: targetPos.y,
                duration: this.sortSpeed,
                onComplete: () => {
                    merged[k].sprite.clearTint();
                }
            });
            k++;
        }

        while (i < sortedLeft.length) {
            merged[k] = sortedLeft[i];
            const targetPos = this.initialPositions[k];
            await this.tweens.add({
                targets: merged[k].sprite,
                x: targetPos.x,
                y: targetPos.y,
                duration: this.sortSpeed,
                onComplete: () => {
                    merged[k].sprite.clearTint();
                }
            });
            i++;
            k++;
        }

        while (j < sortedRight.length) {
            merged[k] = sortedRight[j];
            const targetPos = this.initialPositions[k];
            await this.tweens.add({
                targets: merged[k].sprite,
                x: targetPos.x,
                y: targetPos.y,
                duration: this.sortSpeed,
                onComplete: () => {
                    merged[k].sprite.clearTint();
                }
            });
            j++;
            k++;
        }

        if (elements.length === this.thumbnails.length) {
            await this.finishSort(merged.map(w => w.sprite));
        }

        return merged;
    }

    async animateInsertionSort(elements) {
        const wrappedElements = this.initializeElements(elements);

        // Mark first element as sorted
        wrappedElements[0].sprite.setTint(0x00ff00);

        for (let i = 1; i < wrappedElements.length; i++) {
            const key = wrappedElements[i];
            key.sprite.setTint(0xff0000); // Current element in red
            let j = i - 1;

            await new Promise(resolve => this.time.delayedCall(this.sortSpeed / 2, resolve));

            while (j >= 0 && this.compareElements(wrappedElements[j], key) > 0) {
                wrappedElements[j].sprite.setTint(0x0000ff); // Comparing element in blue
                await this.animateSwap(wrappedElements, j + 1, j);
                j--;
                await new Promise(resolve => this.time.delayedCall(this.sortSpeed / 2, resolve));
                if (wrappedElements[j + 2]) {
                    wrappedElements[j + 2].sprite.setTint(0x00ff00); // Mark as sorted
                }
            }
            key.sprite.setTint(0x00ff00); // Mark as sorted
        }
        await this.finishSort(wrappedElements.map(w => w.sprite));
    }

    async animateSelectionSort(elements) {
        const wrappedElements = this.initializeElements(elements);

        for (let i = 0; i < wrappedElements.length - 1; i++) {
            let minIdx = i;
            wrappedElements[i].sprite.setTint(0xff0000); // Current position in red

            for (let j = i + 1; j < wrappedElements.length; j++) {
                wrappedElements[j].sprite.setTint(0x0000ff); // Comparing element in blue
                await new Promise(resolve => this.time.delayedCall(this.sortSpeed / 2, resolve));

                if (this.compareElements(wrappedElements[j], wrappedElements[minIdx]) < 0) {
                    wrappedElements[minIdx].sprite.clearTint();
                    minIdx = j;
                    wrappedElements[minIdx].sprite.setTint(0xff0000); // New minimum in red
                } else {
                    wrappedElements[j].sprite.clearTint();
                }
            }

            if (minIdx !== i) {
                await this.animateSwap(wrappedElements, i, minIdx);
            }
            wrappedElements[i].sprite.setTint(0x00ff00); // Sorted element in green
            if (minIdx !== i) wrappedElements[minIdx].sprite.clearTint();
        }
        // Mark last element as sorted
        wrappedElements[wrappedElements.length - 1].sprite.setTint(0x00ff00);

        await this.finishSort(wrappedElements.map(w => w.sprite));
    }

    async animateHeapSort(elements) {
        const wrappedElements = this.initializeElements(elements);

        const heapify = async (n, i) => {
            let largest = i;
            const left = 2 * i + 1;
            const right = 2 * i + 2;

            wrappedElements[i].sprite.setTint(0xff0000);
            await new Promise(resolve => this.time.delayedCall(this.sortSpeed / 2, resolve));

            if (left < n && this.compareElements(wrappedElements[left], wrappedElements[largest]) > 0) {
                wrappedElements[left].sprite.setTint(0x00ff00);
                largest = left;
            }

            if (right < n && this.compareElements(wrappedElements[right], wrappedElements[largest]) > 0) {
                if (largest !== i) wrappedElements[largest].sprite.clearTint();
                wrappedElements[right].sprite.setTint(0x00ff00);
                largest = right;
            }

            if (largest !== i) {
                await this.animateSwap(wrappedElements, i, largest);
                await heapify(n, largest);
            }

            wrappedElements[i].sprite.clearTint();
            if (left < n) wrappedElements[left].sprite.clearTint();
            if (right < n) wrappedElements[right].sprite.clearTint();
        };

        for (let i = Math.floor(wrappedElements.length / 2) - 1; i >= 0; i--) {
            await heapify(wrappedElements.length, i);
        }

        for (let i = wrappedElements.length - 1; i > 0; i--) {
            await this.animateSwap(wrappedElements, 0, i);
            await heapify(i, 0);
        }

        await this.finishSort(wrappedElements.map(w => w.sprite));
    }

    async finishSort(elements) {
        // Update scene manager with final sorted state
        window.sceneManager.sortData.thumbnails = [...elements];
        window.sceneManager.sortData.sortedScenes = elements.map(el => el.texture.key);
        window.sceneManager.sortData.selected = this.selected;

        // Clear any remaining tints and set all to green to show completion
        elements.forEach(el => {
            el.sprite.clearTint();
            el.sprite.setTint(0x00ff00);
        });

        // Calculate and display final stats
        const totalTime = (performance.now() - this.sortStartTime).toFixed(2);
        const computeTime = (this.computeEndTime - this.computeStartTime).toFixed(2);
        const animationTime = (totalTime - computeTime).toFixed(2);

        this.statsText.setText(
            `Sort Complete!\n` +
            `Algorithm Time: ${computeTime}ms\n` +
            `Animation Time: ${animationTime}ms\n` +
            `Total Time: ${totalTime}ms\n` +
            `Elements Sorted: ${elements.length}\n\n` +
            `Loading Space Invaders...`  // Add loading indicator
        );

        // Reset animation flag
        this.isAnimating = false;

        // Give time to read stats and show loading
        await new Promise(resolve => this.time.delayedCall(2000, resolve));

        // Start transition
        this.cameras.main.fadeOut(500);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            // Always go to space invaders first, it will handle the next transition
            window.sceneTransition.transition(this, 'space_invaders', {
                score: this.score,
                currentMap: this.currentMap,
                fromSort: true,  // Flag to indicate we're coming from sort scene
                nextScene: window.sceneManager.gameState.isInGame ?
                    window.sceneManager.gameState.currentScene : // Return to current game scene if in game
                    'map1scene1'  // Start new game if not
            });
        });
    }

    startGame() {
        if (!this.selected) return;
        this.isAnimating = false;
        this.finishSort(this.thumbnails);
    }
    transitionToNextScene() {
        if (this.isTransitioning) return;
        this.isTransitioning = true;

        this.cameras.main.fadeOut(500);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            window.sceneTransition.transition(this, 'space_invaders', {
                nextScene: 'map1scene1',
                score: this.score
            });
        });
    }
}