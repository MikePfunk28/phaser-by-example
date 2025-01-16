import Player from '/src/gameobjects/player';
import Generator from '/src/gameobjects/generator';
import * as Phaser from 'phaser';


class Node {
    constructor(sceneName, score = 0) {
        this.sceneName = sceneName;
        this.score = score;
        this.next = null;
        this.left = null;
        this.right = null;
    }
}

export default class SceneOrderManager {
    constructor() {
        this.scenes = [
            'map1scene164', 'map1scene264', 'map1scene364', 'map1scene464',
            'map2scene164', 'map2scene264', 'map2scene364', 'map2scene464',
            'map3scene164', 'map3scene264', 'map3scene364', 'map3scene464'
        ];
        this.sortedScenes = [];
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
                return this.scenes;
        }
    }

    setSortMethod(method) {
        this.sortMethod = method;
        return this.sort();
    }

    sort() {
        switch (this.sortMethod) {
            case 'bubble':
                return this.bubbleSort([...this.scenes]);
            case 'quick':
                return this.quickSort([...this.scenes]);
            case 'merge':
                return this.mergeSort([...this.scenes]);
            default:
                return this.scenes;
        }
    }

    createLinkedList() {
        let head = new Node(this.scenes[0]);
        let current = head;
        for (let i = 1; i < this.scenes.length; i++) {
            current.next = new Node(this.scenes[i]);
            current = current.next;
        }
        return head;
    }

    createBinaryTree() {
        const root = new Node(this.scenes[0]);
        for (let i = 1; i < this.scenes.length; i++) {
            this.insertNode(root, new Node(this.scenes[i]));
        }
        return root;
    }

    createHeap() {
        const heap = [...this.scenes];
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

    getNextScene(currentScene) {
        const sortedScenes = this.sort();
        const currentIndex = sortedScenes.indexOf(currentScene);
        return currentIndex < sortedScenes.length - 1 ?
            sortedScenes[currentIndex + 1] : null;
    }

    getSortedScenes() {
        return this.sortedScenes;
    }

    getFirstScene() {
        return this.sortedScenes[0];
    }
}