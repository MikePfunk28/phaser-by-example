// TetrisScene.js
import { Scene } from 'phaser';
import * as Phaser from 'phaser';


export default class TetrisScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TetrisScene' });

        // Game Constants
        this.ROW = 20;
        this.COL = 10;
        this.BLOCK_SIZE = 24; // Size of each block in pixels
        this.DROP_INTERVAL = 1000; // Initial drop interval in ms

        // Game State
        this.board = [];
        this.currentPiece = null;
        this.nextPiece = null;
        this.dropCounter = 0;
        this.dropInterval = this.DROP_INTERVAL;
        this.score = 0;
        this.highScore = 0;
        this.level = 1;
        this.linesCleared = 0;
        this.paused = false;

        // Assets
        this.colors = [
            null,
            0x00ffff, // I - Cyan
            0x0000ff, // J - Blue
            0xffa500, // L - Orange
            0xffff00, // O - Yellow
            0x00ff00, // S - Green
            0x800080, // T - Purple
            0xff0000  // Z - Red
        ];

        this.shapes = [
            [],
            [
                [1, 1, 1, 1]
            ], // I
            [
                [2, 2, 2],
                [0, 0, 2]
            ], // J
            [
                [3, 3, 3],
                [3, 0, 0]
            ], // L
            [
                [4, 4],
                [4, 4]
            ], // O
            [
                [0, 5, 5],
                [5, 5, 0]
            ], // S
            [
                [0, 6, 0],
                [6, 6, 6]
            ], // T
            [
                [7, 7, 0],
                [0, 7, 7]
            ]  // Z
        ];
    }

    preload() {
        // Load sound effects (optional)
        this.load.audio('move', 'assets/sounds/move.mp3');
        this.load.audio('rotate', 'assets/sounds/rotate.mp3');
        this.load.audio('lineClear', 'assets/sounds/lineClear.mp3');
        this.load.audio('gameOver', 'assets/sounds/gameOver.mp3');
    }

    create() {
        // Initialize board
        this.createBoard();

        // Initialize current and next pieces
        this.currentPiece = this.getRandomPiece();
        this.nextPiece = this.getRandomPiece();

        // Display Next Piece
        this.createNextPieceDisplay();

        // Display Score and Level
        this.createScoreDisplay();

        // Load High Score
        this.loadHighScore();

        // Input Handling
        this.input.keyboard.on('keydown-LEFT', () => {
            this.movePiece(-1);
        });

        this.input.keyboard.on('keydown-RIGHT', () => {
            this.movePiece(1);
        });

        this.input.keyboard.on('keydown-UP', () => {
            this.rotatePiece();
        });

        this.input.keyboard.on('keydown-DOWN', () => {
            this.softDrop();
        });

        this.input.keyboard.on('keydown-SPACE', () => {
            this.hardDrop();
        });

        this.input.keyboard.on('keydown-P', () => {
            this.togglePause();
        });

        // Pause Overlay
        this.pauseOverlay = this.add.text(this.scale.width / 2, this.scale.height / 2, 'Paused', {
            fontSize: '48px',
            fill: '#fff'
        }).setOrigin(0.5);
        this.pauseOverlay.setVisible(false);
    }

    update(time, delta) {
        if (this.paused) return;

        this.dropCounter += delta;
        if (this.dropCounter > this.dropInterval) {
            this.dropPiece();
            this.dropCounter = 0;
        }

        this.drawBoard();
        this.drawPiece(this.currentPiece);
    }

    createBoard() {
        for (let r = 0; r < this.ROW; r++) {
            this.board[r] = [];
            for (let c = 0; c < this.COL; c++) {
                this.board[r][c] = 0;
            }
        }
    }

    getRandomPiece() {
        const rand = Phaser.Math.Between(1, this.shapes.length - 1);
        return {
            shape: this.shapes[rand],
            color: this.colors[rand],
            x: Math.floor(this.COL / 2) - Math.ceil(this.shapes[rand][0].length / 2),
            y: 0
        };
    }

    drawBoard() {
        // Clear previous blocks
        this.children.list.forEach(child => {
            if (child.name === 'block') {
                child.destroy();
            }
        });

        // Draw fixed blocks
        for (let r = 0; r < this.ROW; r++) {
            for (let c = 0; c < this.COL; c++) {
                if (this.board[r][c] !== 0) {
                    this.drawBlock(c, r, this.board[r][c]);
                }
            }
        }
    }

    drawPiece(piece) {
        for (let r = 0; r < piece.shape.length; r++) {
            for (let c = 0; c < piece.shape[r].length; c++) {
                if (piece.shape[r][c]) {
                    this.drawBlock(piece.x + c, piece.y + r, piece.color);
                }
            }
        }
    }

    drawBlock(x, y, color) {
        this.add.rectangle(
            x * this.BLOCK_SIZE + this.BLOCK_SIZE / 2,
            y * this.BLOCK_SIZE + this.BLOCK_SIZE / 2,
            this.BLOCK_SIZE - 1,
            this.BLOCK_SIZE - 1,
            color
        ).setName('block');
    }

    movePiece(dir) {
        this.currentPiece.x += dir;
        if (this.collide(this.currentPiece)) {
            this.currentPiece.x -= dir;
        } else {
            this.playSound('move');
        }
    }

    rotatePiece() {
        const rotated = this.currentPiece.shape[0].map((_, index) => this.currentPiece.shape.map(row => row[index]).reverse());
        const temp = { ...this.currentPiece, shape: rotated };
        if (!this.collide(temp)) {
            this.currentPiece.shape = rotated;
            this.playSound('rotate');
        }
    }

    dropPiece() {
        this.currentPiece.y += 1;
        if (this.collide(this.currentPiece)) {
            this.currentPiece.y -= 1;
            this.merge(this.currentPiece);
            this.clearLines();
            this.updateScore();
            this.currentPiece = this.nextPiece;
            this.nextPiece = this.getRandomPiece();
            this.createNextPieceDisplay();
            this.playSound('lineClear');
            if (this.collide(this.currentPiece)) {
                this.gameOver();
            }
        }
    }

    softDrop() {
        this.dropPiece();
    }

    hardDrop() {
        while (!this.collide(this.currentPiece)) {
            this.currentPiece.y += 1;
        }
        this.currentPiece.y -= 1;
        this.merge(this.currentPiece);
        this.clearLines();
        this.updateScore();
        this.currentPiece = this.nextPiece;
        this.nextPiece = this.getRandomPiece();
        this.createNextPieceDisplay();
        this.playSound('lineClear');
        if (this.collide(this.currentPiece)) {
            this.gameOver();
        }
    }

    collide(piece) {
        for (let r = 0; r < piece.shape.length; r++) {
            for (let c = 0; c < piece.shape[r].length; c++) {
                if (piece.shape[r][c]) {
                    const newX = piece.x + c;
                    const newY = piece.y + r;
                    if (newX < 0 || newX >= this.COL || newY >= this.ROW) {
                        return true;
                    }
                    if (newY >= 0 && this.board[newY][newX] !== 0) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    merge(piece) {
        for (let r = 0; r < piece.shape.length; r++) {
            for (let c = 0; c < piece.shape[r].length; c++) {
                if (piece.shape[r][c]) {
                    const newX = piece.x + c;
                    const newY = piece.y + r;
                    if (newY >= 0 && newX >= 0 && newX < this.COL && newY < this.ROW) {
                        this.board[newY][newX] = piece.shape[r][c];
                    }
                }
            }
        }
    }

    clearLines() {
        let lines = 0;
        for (let r = this.ROW - 1; r >= 0; r--) {
            if (this.board[r].every(cell => cell !== 0)) {
                this.board.splice(r, 1);
                this.board.unshift(new Array(this.COL).fill(0));
                lines++;
                r++; // Recheck the same row after shifting
            }
        }

        if (lines > 0) {
            this.score += lines * 100;
            this.linesCleared += lines;

            // Level up every 10 lines
            if (this.linesCleared >= this.level * 10) {
                this.level++;
                this.dropInterval = Math.max(100, this.dropInterval - 100); // Minimum interval of 100ms
                this.levelText.setText(`Level: ${this.level}`);
            }

            // Update High Score
            if (this.score > this.highScore) {
                this.highScore = this.score;
                this.highScoreText.setText(`High Score: ${this.highScore}`);
                localStorage.setItem('tetrisHighScore', this.highScore);
            }

            // Update Score Display
            this.scoreText.setText(`Score: ${this.score}`);

            // Play Line Clear Sound
            this.playSound('lineClear');
        }
    }

    updateScore() {
        this.scoreText.setText(`Score: ${this.score}`);
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.highScoreText.setText(`High Score: ${this.highScore}`);
            localStorage.setItem('tetrisHighScore', this.highScore);
        }
    }

    gameOver() {
        this.playSound('gameOver');
        alert(`Game Over!\nYour Score: ${this.score}`);
        this.resetGame();
    }

    resetGame() {
        this.board = this.createBoard();
        this.score = 0;
        this.level = 1;
        this.linesCleared = 0;
        this.dropInterval = this.DROP_INTERVAL;
        this.scoreText.setText(`Score: ${this.score}`);
        this.levelText.setText(`Level: ${this.level}`);
        this.currentPiece = this.getRandomPiece();
        this.nextPiece = this.getRandomPiece();
        this.createNextPieceDisplay();
    }

    togglePause() {
        this.paused = !this.paused;
        this.pauseOverlay.setVisible(this.paused);
    }

    createNextPieceDisplay() {
        // Clear previous next piece blocks
        this.nextGraphics?.destroy();

        // Create a new graphics object
        this.nextGraphics = this.add.graphics();
        this.nextGraphics.lineStyle(1, 0xffffff, 1);

        for (let r = 0; r < this.nextPiece.shape.length; r++) {
            for (let c = 0; c < this.nextPiece.shape[r].length; c++) {
                if (this.nextPiece.shape[r][c]) {
                    this.nextGraphics.fillStyle(this.nextPiece.color, 1);
                    this.nextGraphics.fillRect(
                        this.cols * this.BLOCK_SIZE + 40 + c * this.BLOCK_SIZE,
                        140 + r * this.BLOCK_SIZE,
                        this.BLOCK_SIZE - 1,
                        this.BLOCK_SIZE - 1
                    );
                    this.nextGraphics.strokeRect(
                        this.cols * this.BLOCK_SIZE + 40 + c * this.BLOCK_SIZE,
                        140 + r * this.BLOCK_SIZE,
                        this.BLOCK_SIZE - 1,
                        this.BLOCK_SIZE - 1
                    );
                }
            }
        }
    }

    createScoreDisplay() {
        this.scoreText = this.add.text(this.COL * this.BLOCK_SIZE + 20, 20, `Score: ${this.score}`, {
            font: '16px Arial',
            fill: '#fff'
        });

        this.levelText = this.add.text(this.COL * this.BLOCK_SIZE + 20, 50, `Level: ${this.level}`, {
            font: '16px Arial',
            fill: '#fff'
        });

        this.highScoreText = this.add.text(this.COL * this.BLOCK_SIZE + 20, 80, `High Score: ${this.highScore}`, {
            font: '16px Arial',
            fill: '#fff'
        });
    }

    loadHighScore() {
        const storedHighScore = localStorage.getItem('tetrisHighScore');
        if (storedHighScore) {
            this.highScore = parseInt(storedHighScore);
            this.highScoreText.setText(`High Score: ${this.highScore}`);
        }
    }

    playSound(key) {
        const sound = this.sound.get(key);
        if (sound) {
            sound.play();
        }
    }
}
