import Player from '../gameobjects/player';
import Generator from '../gameobjects/generator';
import * as Phaser from 'phaser'; // Default import

class Node {
    constructor(imageName, score = 0) {
        this.imageNamerunn = imageName;
        this.score = score;
        this.next = null;
        this.left = null;
        this.right = null;
    }
}

export default class SceneOrderManager {
    constructor() {
        this.images = [
            'map1scene164.png', 'map1scene264.png', 'map1scene364.png', 'map1scene464.png',
            'map2scene164.png', 'map2scene264.png', 'map2scene364.png', 'map2scene464.png',
            'map3scene164.png', 'map3scene264.png', 'map3scene364.png', 'map3scene464.png',
            'map4scene364.png', 'map4scene464.png'
        ];
        this.sortedImages = [];
        this.currentStructure = 'array';
        this.sortMethod = 'bubble';
    }

    setDataStructure(type) {
        this.currentStructure = type;
        switch (type) {
            case 'linkedList':
                return this.createLinkedList();
            case 'binaryTree':
                return this.createBinaryTree();
            case 'heap':
                return this.createHeap();
            default:
                return this.images;
        }
    }

    setSortMethod(method) {
        this.sortMethod = method;
        return this.sort();
    }

    sort() {
        switch (this.sortMethod) {
            case 'bubble':
                return this.bubbleSort([...this.images]);
            case 'quick':
                return this.quickSort([...this.images]);
            case 'merge':
                return this.mergeSort([...this.images]);
            default:
                return this.images;
        }
    }

    createLinkedList() {
        let head = new Node(this.images[0]);
        let current = head;
        for (let i = 1; i < this.images.length; i++) {
            current.next = new Node(this.images[i]);
            current = current.next;
        }
        return head;
    }

    createBinaryTree() {
        const root = new Node(this.images[0]);
        for (let i = 1; i < this.images.length; i++) {
            this.insertNode(root, new Node(this.images[i]));
        }
        return root;
    }

    createHeap() {
        const heap = [...this.images];
        for (let i = Math.floor(heap.length / 2) - 1; i >= 0; i--) {
            this.heapify(heap, heap.length, i);
        }
        return heap;
    }

    // Sorting implementations
    bubbleSort(arr) {
        for (let i = 0; i < arr.length; i++) {
            for (let j = 0; j < arr.length - i - 1; j++) {
                if (arr[j] > arr[j + 1]) {
                    [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
                }
            }
        }
        return arr;
    }

    quickSort(arr) {
        if (arr.length <= 1) return arr;
        const pivot = arr[0];
        const left = arr.slice(1).filter(x => x < pivot);
        const right = arr.slice(1).filter(x => x >= pivot);
        return [...this.quickSort(left), pivot, ...this.quickSort(right)];
    }

    mergeSort(arr) {
        if (arr.length <= 1) return arr;
        const mid = Math.floor(arr.length / 2);
        const left = this.mergeSort(arr.slice(0, mid));
        const right = this.mergeSort(arr.slice(mid));
        return this.merge(left, right);
    }

    merge(left, right) {
        let result = [];
        let leftIndex = 0;
        let rightIndex = 0;
        while (leftIndex < left.length && rightIndex < right.length) {
            if (left[leftIndex] < right[rightIndex]) {
                result.push(left[leftIndex]);
                leftIndex++;
            } else {
                result.push(right[rightIndex]);
                rightIndex++;
            }
        }
        return result.concat(left.slice(leftIndex)).concat(right.slice(rightIndex));
    }

    getOrderedImages() {
        if (this.sortedImages.length === 0) {
            // Only initialize if empty
            this.sortedImages = [...this.image];
            this.sort(); // Apply current sort method
        }
        return this.sortedImages;
    }

    getNextImage(currentScene) {
        const currentIndex = this.sortedImages.indexOf(currentScene);
        if (currentIndex !== -1 && currentIndex < this.sortedImages.length - 1) {
            return this.sortedImages[currentIndex + 1];
        }
        return 'sort_selection'; // Return to sort selection if at end
    }

    getSortedImages() {
        return this.sortedImages;
    }

    getFirstImage() {
        return this.sortedImages[0];
    }
}