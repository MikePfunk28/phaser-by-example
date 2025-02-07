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
        this.isTransitioning = false;
        this.sortData = {
            thumbnails: [],
            sortedScenes: [],
            selected: null
        };
        this.gameState = {
            score: 0
        };
        this.timingInfo = {
            startTime: 0,
            endTime: 0,
            totalTime: 0,
            animationStartTime: 0,
            animationEndTime: 0
        };
        this.sceneManager = null;
    }

    init(data) {
        // Initialize scene data from registry or passed data
        this.score = data?.score || this.registry.get('score') || 0;
        this.currentMap = data?.currentMap || this.registry.get('currentMap') || 1;
        this.progress = data?.progress || this.registry.get('progress') || 0;
        this.powerUpBitmask = data.powerUpBitmask || 0;
        this.fromScene = data.fromScene;

        // Store initial values in registry
        this.registry.set('score', this.score);
        this.registry.set('currentMap', this.currentMap);
        this.registry.set('progress', this.progress);

        // Setup scene transition if available
        if (this.gameManager?.sceneTransition) {
            this.sceneTransition = this.gameManager.sceneTransition;
        }

        // Setup progress manager if available
        if (this.gameManager?.progressManager) {
            this.progressManager = this.gameManager.progressManager;
        }

        this.isTransitioning = false;
        this.isAnimating = false;

        // Listen for registry changes
        this.registry.events.on('changedata', this.handleRegistryChange, this);

        // Initialize scene manager if available
        if (window.gameManager?.sceneManager) {
            this.sceneManager = window.gameManager.sceneManager;
        }
    }

    handleRegistryChange(parent, key, data) {
        // Update local state when registry changes
        switch (key) {
            case 'score':
                this.score = data;
                break;
            case 'currentMap':
                this.currentMap = data;
                break;
            case 'progress':
                this.progress = data;
                break;
        }
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

        // Load sound effects with improved error handling and debug logging
        console.log('Loading sound effects...');

        this.load.audio('fail', getAssetPath('sounds/cartoon_fail.mp3'))
            .on('filecomplete', () => console.log('Fail sound loaded successfully'))
            .on('loaderror', (file) => console.error('Failed to load fail sound:', file));

        this.load.audio('buzzer', getAssetPath('sounds/buzzer.mp3'))
            .on('filecomplete', () => console.log('Buzzer sound loaded successfully'))
            .on('loaderror', (file) => console.error('Failed to load buzzer sound:', file));

        // Add load complete handler
        this.load.on('complete', () => {
            console.log('All assets loaded. Sound cache status:', {
                fail: this.cache.audio.exists('fail'),
                buzzer: this.cache.audio.exists('buzzer')
            });
        });
    }

    createSilentSound(key) {
        // Create a silent buffer as fallback
        if (this.game.sound.context) {
            const buffer = this.game.sound.context.createBuffer(1, 44100, 44100);
            this.cache.audio.add(key, buffer);
        }
    }

    // Improved sound playing method with debug
    playSound(key) {
        console.log(`Attempting to play sound: ${key}`);
        try {
            if (!this.sound.locked) {
                // Stop any currently playing sounds
                this.sound.stopAll();

                // Create and play the sound
                const sound = this.sound.add(key, { volume: 0.5 });
                sound.play();
                console.log(`Playing sound: ${key}`);
            } else {
                console.log('Audio system is locked. Waiting for user interaction...');
                // Add one-time unlock listener
                this.sound.once('unlocked', () => {
                    this.playSound(key);
                });
            }
        } catch (error) {
            console.error(`Error playing sound ${key}:`, error);
        }
    }

    create() {
        // Add animated background
        const bg = this.add.image(400, 300, 'background');
        bg.setAlpha(0.3);  // Semi-transparent background

        // Add a gradient overlay
        const gradient = this.add.graphics();
        gradient.fillGradientStyle(0x000000, 0x000000, 0x112244, 0x112244, 0.7);
        gradient.fillRect(0, 0, 800, 600);

        // Add score display
        this.add.text(20, 20, 'Score: ' + this.score, {
            fontSize: '24px',
            fill: '#fff'
        });

        // Create stats text in a visible position
        this.statsText = this.add.text(20, 150, '', {
            fontSize: '16px',
            fill: '#fff',
            fontFamily: 'monospace'
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
            this.backToMenu();
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

        // Improved slider interaction with minimum speed
        let isDragging = false;
        const MIN_SORT_SPEED = 200; // Minimum 200ms delay for stability

        const updateSpeed = (x) => {
            const bounds = slider.getBounds();
            knob.x = Phaser.Math.Clamp(x, bounds.left, bounds.right);
            // Ensure minimum speed and smoother scaling
            const speedPercentage = (knob.x - bounds.left) / bounds.width;
            this.sortSpeed = Math.max(MIN_SORT_SPEED, 1000 - (speedPercentage * 700));
        };

        knob.on('pointerdown', () => {
            isDragging = true;
        });

        this.input.on('pointermove', (pointer) => {
            if (isDragging) {
                updateSpeed(pointer.x);
            }
        });

        this.input.on('pointerup', () => {
            isDragging = false;
        });

        slider.on('pointerdown', (pointer) => {
            updateSpeed(pointer.x);
        });

        // Add cleanup method for animations
        this.cleanupAnimations = () => {
            this.tweens.killAll();  // Use killAll() instead of getAllTweens()
            if (this.thumbnails) {
                this.thumbnails.forEach(thumb => {
                    thumb.clearTint();
                    thumb.setScale(0.8);
                });
            }
        };

        // Add shuffle button at the start
        this.shuffleThumbnails();
    }

    selectSort(method) {
        if (this.isAnimating) return;
        this.isAnimating = true;
        this.selected = method;

        // Create or update stats display
        if (this.statsText) this.statsText.destroy();
        this.statsText = this.add.text(20, 60, 'Sorting...', {
            fontSize: '16px',
            fill: '#fff',
            fontFamily: 'monospace'
        });

        // Start timing for total duration
        this.sortStartTime = performance.now();

        // Start the animation
        const elements = this.thumbnails;
        const wrappedElements = this.initializeElements(elements);

        // Pre-compute the sort to get actual algorithm time
        const startTime = performance.now();
        const computedElements = [...wrappedElements];

        // Store timing info in scene for access by animation methods
        this.timingInfo = {
            startTime: startTime,
            endTime: null,
            totalTime: 0,
            animationStartTime: null,
            animationEndTime: null
        };

        switch (method) {
            case 'bubble':
                for (let i = 0; i < computedElements.length; i++) {
                    for (let j = 0; j < computedElements.length - i - 1; j++) {
                        if (computedElements[j].value > computedElements[j + 1].value) {
                            [computedElements[j], computedElements[j + 1]] = [computedElements[j + 1], computedElements[j]];
                        }
                    }
                }
                break;
            case 'quick':
                const quickSort = (arr, start, end) => {
                    if (start >= end) return;
                    let pivot = arr[end];
                    let i = start - 1;
                    for (let j = start; j < end; j++) {
                        if (arr[j].value <= pivot.value) {
                            i++;
                            [arr[i], arr[j]] = [arr[j], arr[i]];
                        }
                    }
                    [arr[i + 1], arr[end]] = [arr[end], arr[i + 1]];
                    quickSort(arr, start, i);
                    quickSort(arr, i + 2, end);
                };
                quickSort(computedElements, 0, computedElements.length - 1);
                break;
            case 'insertion':
                for (let i = 1; i < computedElements.length; i++) {
                    let current = computedElements[i];
                    let j = i - 1;
                    while (j >= 0 && computedElements[j].value > current.value) {
                        computedElements[j + 1] = computedElements[j];
                        j--;
                    }
                    computedElements[j + 1] = current;
                }
                break;
            case 'selection':
                for (let i = 0; i < computedElements.length - 1; i++) {
                    let minIdx = i;
                    for (let j = i + 1; j < computedElements.length; j++) {
                        if (computedElements[j].value < computedElements[minIdx].value) {
                            minIdx = j;
                        }
                    }
                    if (minIdx !== i) {
                        [computedElements[i], computedElements[minIdx]] = [computedElements[minIdx], computedElements[i]];
                    }
                }
                break;
            case 'heap':
                const heapify = (arr, n, i) => {
                    let largest = i;
                    const left = 2 * i + 1;
                    const right = 2 * i + 2;

                    if (left < n && arr[left].value > arr[largest].value) largest = left;
                    if (right < n && arr[right].value > arr[largest].value) largest = right;

                    if (largest !== i) {
                        [arr[i], arr[largest]] = [arr[largest], arr[i]];
                        heapify(arr, n, largest);
                    }
                };
                for (let i = Math.floor(computedElements.length / 2) - 1; i >= 0; i--) {
                    heapify(computedElements, computedElements.length, i);
                }
                for (let i = computedElements.length - 1; i > 0; i--) {
                    [computedElements[0], computedElements[i]] = [computedElements[i], computedElements[0]];
                    heapify(computedElements, i, 0);
                }
                break;
            case 'merge':
                const merge = (arr, start, mid, end) => {
                    const temp = [];
                    let i = start, j = mid + 1, k = 0;
                    while (i <= mid && j <= end) {
                        if (arr[i].value <= arr[j].value) temp[k++] = arr[i++];
                        else temp[k++] = arr[j++];
                    }
                    while (i <= mid) temp[k++] = arr[i++];
                    while (j <= end) temp[k++] = arr[j++];
                    for (i = 0; i < k; i++) arr[start + i] = temp[i];
                };
                const mergeSort = (arr, start, end) => {
                    if (start < end) {
                        const mid = Math.floor((start + end) / 2);
                        mergeSort(arr, start, mid);
                        mergeSort(arr, mid + 1, end);
                        merge(arr, start, mid, end);
                    }
                };
                mergeSort(computedElements, 0, computedElements.length - 1);
                break;
        }
        this.timingInfo.endTime = performance.now();
        this.timingInfo.totalTime = this.timingInfo.endTime - this.timingInfo.startTime;

        // Update stats with compute time
        const computeTime = this.timingInfo.totalTime.toFixed(4);
        console.log(`${method} Sort Time: ${computeTime}ms`);
        this.statsText.setText(`Computing sort... ${computeTime}ms`);

        // Start animation timing
        this.timingInfo.animationStartTime = performance.now();

        // Now start the visual animation
        switch (method) {
            case 'bubble':
                this.animateBubbleSort(wrappedElements);
                break;
            case 'quick':
                this.animateQuickSort(wrappedElements, 0, wrappedElements.length - 1);
                break;
            case 'merge':
                this.animateMergeSort(wrappedElements);
                break;
            case 'insertion':
                this.animateInsertionSort(wrappedElements);
                break;
            case 'selection':
                this.animateSelectionSort(wrappedElements);
                break;
            case 'heap':
                this.animateHeapSort(wrappedElements);
                break;
        }
    }

    initializeElements(elements) {
        return elements.map((el, idx) => ({
            sprite: el,                // The Phaser sprite object
            originalIndex: idx,        // Original position in array
            originalX: el.x,          // Original x position
            currentX: el.x,           // Current x position (changes during sort)
            value: idx                // Actual value to sort by (could be x, index, etc)
        }));
    }

    compareElements(a, b) {
        // Compare by value first
        if (a.value !== b.value) return a.value - b.value;
        // Use original index for stable sort
        return a.originalIndex - b.originalIndex;
    }

    async animateSwap(wrappedElements, i, j) {
        // Get target positions from original layout
        const posI = this.initialPositions[i];
        const posJ = this.initialPositions[j];

        // Swap the actual array elements
        [wrappedElements[i], wrappedElements[j]] = [wrappedElements[j], wrappedElements[i]];

        // Update current positions
        wrappedElements[i].currentX = posI.x;
        wrappedElements[j].currentX = posJ.x;

        // Animate the sprites
        return new Promise(resolve => {
            let completed = 0;
            const onComplete = () => {
                completed++;
                if (completed === 2) resolve();
            };

            this.tweens.add({
                targets: wrappedElements[i].sprite,
                x: posI.x,
                y: posI.y,
                duration: this.sortSpeed,
                onComplete
            });

            this.tweens.add({
                targets: wrappedElements[j].sprite,
                x: posJ.x,
                y: posJ.y,
                duration: this.sortSpeed,
                onComplete
            });
        });

        // Play buzzer sound for each swap to indicate "work being done"
        this.playSound('buzzer');
    }

    async animateBubbleSort(wrappedElements) {
        for (let i = 0; i < wrappedElements.length; i++) {
            for (let j = 0; j < wrappedElements.length - i - 1; j++) {
                // Highlight elements being compared
                wrappedElements[j].sprite.setTint(0x0000ff);
                wrappedElements[j + 1].sprite.setTint(0x0000ff);

                await new Promise(resolve => this.time.delayedCall(this.sortSpeed / 2, resolve));

                if (wrappedElements[j].value > wrappedElements[j + 1].value) {
                    // Highlight elements being swapped
                    wrappedElements[j].sprite.setTint(0xff0000);
                    wrappedElements[j + 1].sprite.setTint(0xff0000);
                    await this.animateSwap(wrappedElements, j, j + 1);
                }

                // Clear comparison tint
                wrappedElements[j].sprite.clearTint();
                wrappedElements[j + 1].sprite.clearTint();
            }
            // Mark the last element in this pass as sorted
            wrappedElements[wrappedElements.length - i - 1].sprite.setTint(0x00ff00);
        }
        // Mark the first element as sorted (it wasn't marked in the loop)
        wrappedElements[0].sprite.setTint(0x00ff00);
        this.finishSort(wrappedElements.map(w => w.sprite));
    }

    async animateQuickSort(wrappedElements, start, end) {
        if (start >= end) {
            if (start === end) {
                wrappedElements[start].sprite.setTint(0x00ff00);
            }
            return;
        }

        const pivot = wrappedElements[end];
        pivot.sprite.setTint(0xff0000);
        let i = start - 1;

        for (let j = start; j < end; j++) {
            wrappedElements[j].sprite.setTint(0x0000ff);
            await new Promise(resolve => this.time.delayedCall(this.sortSpeed / 2, resolve));

            if (wrappedElements[j].value <= pivot.value) {
                i++;
                if (i !== j) {
                    await this.animateSwap(wrappedElements, i, j);
                }
                wrappedElements[i].sprite.setTint(0x00ff00);
            }
            wrappedElements[j].sprite.clearTint();
        }

        if (i + 1 !== end) {
            await this.animateSwap(wrappedElements, i + 1, end);
        }
        pivot.sprite.clearTint();
        wrappedElements[i + 1].sprite.setTint(0x00ff00);

        await this.animateQuickSort(wrappedElements, start, i);
        await this.animateQuickSort(wrappedElements, i + 2, end);

        // Mark all elements in this partition as sorted
        for (let k = start; k <= end; k++) {
            wrappedElements[k].sprite.setTint(0x00ff00);
        }

        if (start === 0 && end === wrappedElements.length - 1) {
            this.finishSort(wrappedElements.map(w => w.sprite));
        }
    }

    async animateInsertionSort(wrappedElements) {
        // Mark first element as sorted
        wrappedElements[0].sprite.setTint(0x00ff00);

        for (let i = 1; i < wrappedElements.length; i++) {
            const current = wrappedElements[i];
            current.sprite.setTint(0xff0000);
            let j = i - 1;

            await new Promise(resolve => this.time.delayedCall(this.sortSpeed / 2, resolve));

            while (j >= 0 && wrappedElements[j].value > current.value) {
                wrappedElements[j].sprite.setTint(0x0000ff);
                await this.animateSwap(wrappedElements, j + 1, j);
                wrappedElements[j + 1].sprite.setTint(0x00ff00);
                j--;
            }

            // Mark current element as sorted
            wrappedElements[j + 1].sprite.setTint(0x00ff00);
        }
        this.finishSort(wrappedElements.map(w => w.sprite));
    }

    async animateSelectionSort(wrappedElements) {
        for (let i = 0; i < wrappedElements.length - 1; i++) {
            let minIdx = i;
            wrappedElements[i].sprite.setTint(0xff0000);

            for (let j = i + 1; j < wrappedElements.length; j++) {
                wrappedElements[j].sprite.setTint(0x0000ff);
                await new Promise(resolve => this.time.delayedCall(this.sortSpeed / 2, resolve));

                if (wrappedElements[j].value < wrappedElements[minIdx].value) {
                    if (minIdx !== i) wrappedElements[minIdx].sprite.clearTint();
                    minIdx = j;
                    wrappedElements[minIdx].sprite.setTint(0xff0000);
                } else {
                    wrappedElements[j].sprite.clearTint();
                }
            }

            if (minIdx !== i) {
                await this.animateSwap(wrappedElements, i, minIdx);
            }
            // Mark current position as sorted
            wrappedElements[i].sprite.setTint(0x00ff00);
        }
        // Mark last element as sorted
        wrappedElements[wrappedElements.length - 1].sprite.setTint(0x00ff00);
        this.finishSort(wrappedElements.map(w => w.sprite));
    }

    async animateHeapSort(wrappedElements) {
        const heapify = async (n, i) => {
            let largest = i;
            const left = 2 * i + 1;
            const right = 2 * i + 2;

            wrappedElements[i].sprite.setTint(0xff0000);
            if (left < n) wrappedElements[left].sprite.setTint(0x0000ff);
            if (right < n) wrappedElements[right].sprite.setTint(0x0000ff);

            await new Promise(resolve => this.time.delayedCall(this.sortSpeed / 2, resolve));

            if (left < n && wrappedElements[left].value > wrappedElements[largest].value) {
                largest = left;
            }

            if (right < n && wrappedElements[right].value > wrappedElements[largest].value) {
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

        // Build heap
        for (let i = Math.floor(wrappedElements.length / 2) - 1; i >= 0; i--) {
            await heapify(wrappedElements.length, i);
        }

        // Extract elements from heap one by one
        for (let i = wrappedElements.length - 1; i > 0; i--) {
            await this.animateSwap(wrappedElements, 0, i);
            wrappedElements[i].sprite.setTint(0x00ff00);  // Mark as sorted
            await heapify(i, 0);
        }
        wrappedElements[0].sprite.setTint(0x00ff00);  // Mark last element as sorted
        this.finishSort(wrappedElements.map(w => w.sprite));
    }

    async animateMergeSort(wrappedElements) {
        if (wrappedElements.length <= 1) {
            if (wrappedElements.length === 1) {
                wrappedElements[0].sprite.setTint(0x00ff00);
            }
            return wrappedElements;
        }

        const mid = Math.floor(wrappedElements.length / 2);
        const left = wrappedElements.slice(0, mid);
        const right = wrappedElements.slice(mid);

        // Highlight split
        left.forEach(el => el.sprite.setTint(0x0000ff));
        right.forEach(el => el.sprite.setTint(0xff0000));
        await new Promise(resolve => this.time.delayedCall(this.sortSpeed / 2, resolve));

        // Clear split highlighting
        left.forEach(el => el.sprite.clearTint());
        right.forEach(el => el.sprite.clearTint());

        await this.animateMergeSort(left);
        await this.animateMergeSort(right);

        let i = 0, j = 0, k = 0;
        while (i < left.length && j < right.length) {
            left[i].sprite.setTint(0x0000ff);
            right[j].sprite.setTint(0xff0000);
            await new Promise(resolve => this.time.delayedCall(this.sortSpeed / 2, resolve));

            if (left[i].value <= right[j].value) {
                if (k !== i) {
                    await this.animateSwap(wrappedElements, k, i);
                }
                wrappedElements[k].sprite.setTint(0x00ff00);
                i++;
            } else {
                if (k !== j + mid) {
                    await this.animateSwap(wrappedElements, k, j + mid);
                }
                wrappedElements[k].sprite.setTint(0x00ff00);
                j++;
            }
            k++;
        }

        while (i < left.length) {
            if (k !== i) {
                await this.animateSwap(wrappedElements, k, i);
            }
            wrappedElements[k].sprite.setTint(0x00ff00);
            i++;
            k++;
        }

        while (j < right.length) {
            if (k !== j + mid) {
                await this.animateSwap(wrappedElements, k, j + mid);
            }
            wrappedElements[k].sprite.setTint(0x00ff00);
            j++;
            k++;
        }

        if (wrappedElements.length === this.thumbnails.length) {
            this.finishSort(wrappedElements.map(w => w.sprite));
        }
        return wrappedElements;
    }

    finishSort(elements) {
        // Record animation end time
        this.timingInfo.animationEndTime = performance.now();
        const animationTime = (this.timingInfo.animationEndTime - this.timingInfo.animationStartTime).toFixed(4);
        const totalTime = (this.timingInfo.animationEndTime - this.timingInfo.startTime).toFixed(4);

        // Play fail sound if sorting took too long
        if (this.timingInfo.totalTime > 5000) { // 5 seconds threshold
            this.playSound('fail');
        } else if (this.timingInfo.totalTime > 3000) { // 3 seconds threshold
            this.playSound('buzzer');
        }

        // Update stats with final timing
        this.statsText.setText(
            `Sort complete!\nCompute time: ${this.computeTime}ms\nAnimation time: ${animationTime}ms\nTotal time: ${totalTime}ms`
        );

        // Return to previous scene after delay
        if (this.fromScene) {
            this.time.delayedCall(2000, () => {
                if (this.sceneManager) {
                    this.sceneManager.returnToPreviousScene({
                        score: this.score,
                        powerUpBitmask: this.powerUpBitmask,
                        currentMap: this.currentMap
                    });
                } else {
                    // Fallback to basic scene transition
                    this.scene.start(this.fromScene, {
                        score: this.score,
                        powerUpBitmask: this.powerUpBitmask,
                        currentMap: this.currentMap
                    });
                }
            });
        }
    }

    shuffleThumbnails() {
        if (this.isAnimating) return;

        // Clear any existing tints and reset scales
        this.thumbnails.forEach(thumb => {
            thumb.clearTint();
            thumb.setScale(0.8);
        });

        // Create array of indices and shuffle it
        const indices = Array.from({ length: this.thumbnails.length }, (_, i) => i);
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }

        // Animate thumbnails to new positions
        indices.forEach((newIndex, currentIndex) => {
            const targetPos = this.initialPositions[newIndex];
            this.tweens.add({
                targets: this.thumbnails[currentIndex],
                x: targetPos.x,
                y: targetPos.y,
                duration: 500,
                ease: 'Power2'
            });
        });

        // Update stats text
        if (this.statsText) {
            this.statsText.setText('Select a sorting algorithm to begin!');
        }

        // Clear selected sort method
        this.selected = null;
    }

    startGame() {
        if (!this.selected || this.isTransitioning || this.isAnimating) return;

        if (this.cleanupAnimations) {
            this.cleanupAnimations();
        }

        this.isTransitioning = true;

        // Get the sorted scenes from our thumbnails
        const sortedScenes = this.sortData.sortedScenes || [];

        // Store the sorted scenes in registry for access across scenes
        this.registry.set('dynamicScenes', sortedScenes);
        this.registry.set('currentSceneIndex', 0);
        this.registry.set('score', this.score);
        this.registry.set('currentMap', this.currentMap);

        // Create transition data with dynamic scene information
        const transitionData = {
            score: this.score,
            currentMap: this.currentMap,
            fromSort: true,
            sortedScenes: sortedScenes,
            isDynamicScene: true,
            sceneIndex: 0
        };

        // Emit event before transition
        this.events.emit('gameStart', transitionData);

        // Start the first dynamic scene
        if (this.sceneTransition) {
            this.sceneTransition.to(this, 'DynamicGameScene', transitionData);
        } else {
            this.cameras.main.fadeOut(500);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('DynamicGameScene', transitionData);
            });
        }
    }

    backToMenu() {
        if (this.isTransitioning || this.isAnimating) return;

        if (this.cleanupAnimations) {
            this.cleanupAnimations();
        }

        this.isTransitioning = true;
        const transitionData = {
            score: this.score,
            currentMap: this.currentMap,
            fromSort: false
        };

        // Update registry before transition
        this.registry.set('score', this.score);
        this.registry.set('currentMap', this.currentMap);

        // Emit event before transition
        this.events.emit('backToMenu', transitionData);

        if (this.sceneTransition) {
            this.sceneTransition.to(this, 'mainmenu', transitionData);
        } else {
            this.cameras.main.fadeOut(500);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('mainmenu', transitionData);
            });
        }
    }

    shutdown() {
        // Clean up animations and tweens
        if (this.cleanupAnimations) {
            this.cleanupAnimations();
        }

        // Reset state
        this.isTransitioning = false;
        this.isAnimating = false;

        // Clean up thumbnails
        if (this.thumbnails) {
            this.thumbnails.forEach(thumb => {
                thumb.destroy();
            });
            this.thumbnails = [];
        }

        // Clean up any remaining tweens
        this.tweens.killAll();

        // Remove registry event listener
        this.registry.events.off('changedata', this.handleRegistryChange, this);

        // Emit shutdown event
        this.events.emit('shutdown');
    }

    loadAwsIcons(mapConfig) {
        mapConfig.zones.forEach(zone => {
            zone.icons.forEach(icon => {
                // Get the icon path from the question that matches this icon's type
                const relevantQuestion = this.questions.find(q =>
                    icon.questionTypes.some(type =>
                        q.question.toLowerCase().includes(type.toLowerCase())
                    )
                );

                // Construct the AWS service icon path correctly
                const iconPath = `images/services16/${icon.category}/48/${icon.name}`;
                console.log('Loading AWS icon:', iconPath);
                this.load.image(`icon_${icon.name}`, getAssetPath(iconPath));
            });
        });

        // Start the loader and create icons upon completion
        this.load.once('complete', () => {
            mapConfig.zones.forEach(zone => {
                zone.icons.forEach(icon => {
                    const iconSprite = this.add.image(
                        icon.x,
                        icon.y,
                        `icon_${icon.name}`
                    )
                        .setInteractive()
                        .setScale(0.5);

                    this.setupIconInteraction(iconSprite, icon);
                    this.icons.push(iconSprite);
                });
            });
        });

        this.load.start();
    }

    // Update scene transition methods to use Phaser's scene management
    startScene(key, data = {}) {
        if (this.isTransitioning) return;
        this.isTransitioning = true;

        // Update global state
        window.gameState.lastScene = this.scene.key;

        // Start fade out
        this.cameras.main.fadeOut(500, 0, 0, 0);

        this.cameras.main.once('camerafadeoutcomplete', () => {
            // Start the new scene
            this.scene.start(key, {
                ...data,
                fromScene: this.scene.key,
                score: this.score,
                currentMap: this.currentMap,
                powerUpBitmask: this.powerUpBitmask
            });
        });
    }

    returnToPreviousScene(data = {}) {
        if (this.isTransitioning || !this.fromScene) return;
        this.isTransitioning = true;

        // Update global state
        window.gameState.lastScene = this.scene.key;

        // Start fade out
        this.cameras.main.fadeOut(500, 0, 0, 0);

        this.cameras.main.once('camerafadeoutcomplete', () => {
            // Return to previous scene
            this.scene.start(this.fromScene, {
                ...data,
                score: this.score,
                currentMap: this.currentMap,
                powerUpBitmask: this.powerUpBitmask
            });
        });
    }

    launchScene(key, data = {}) {
        if (this.isTransitioning) return;
        this.isTransitioning = true;

        // Update global state
        window.gameState.lastScene = this.scene.key;

        // Launch the new scene
        this.scene.launch(key, {
            ...data,
            fromScene: this.scene.key,
            score: this.score,
            currentMap: this.currentMap,
            powerUpBitmask: this.powerUpBitmask
        });

        this.scene.bringToTop(key);

        // Reset transition flag after a short delay
        this.time.delayedCall(100, () => {
            this.isTransitioning = false;
        });
    }
}