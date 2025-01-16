import React, { useState, useEffect, useCallback } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const INITIAL_SPEED = 1000;

const TETROMINOS = {
  I: {
    shape: [[1, 1, 1, 1]],
    color: 'bg-cyan-500',
  },
  J: {
    shape: [[1, 0, 0], [1, 1, 1]],
    color: 'bg-blue-500',
  },
  L: {
    shape: [[0, 0, 1], [1, 1, 1]],
    color: 'bg-orange-500',
  },
  O: {
    shape: [[1, 1], [1, 1]],
    color: 'bg-yellow-500',
  },
  S: {
    shape: [[0, 1, 1], [1, 1, 0]],
    color: 'bg-green-500',
  },
  T: {
    shape: [[0, 1, 0], [1, 1, 1]],
    color: 'bg-purple-500',
  },
  Z: {
    shape: [[1, 1, 0], [0, 1, 1]],
    color: 'bg-red-500',
  },
};

const createEmptyBoard = () => 
  Array.from({ length: BOARD_HEIGHT }, () => 
    Array.from({ length: BOARD_WIDTH }, () => null)
  );

const TetrisGame = ({ onGameComplete }) => {
  const [board, setBoard] = useState(createEmptyBoard());
  const [currentPiece, setCurrentPiece] = useState(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const getRandomTetromino = () => {
    const pieces = Object.keys(TETROMINOS);
    const randPiece = pieces[Math.floor(Math.random() * pieces.length)];
    return TETROMINOS[randPiece];
  };

  const isValidMove = useCallback((piece, pos) => {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = pos.x + x;
          const newY = pos.y + y;
          
          if (
            newX < 0 || 
            newX >= BOARD_WIDTH || 
            newY >= BOARD_HEIGHT ||
            (newY >= 0 && board[newY][newX])
          ) {
            return false;
          }
        }
      }
    }
    return true;
  }, [board]);

  const mergePieceWithBoard = useCallback(() => {
    const newBoard = board.map(row => [...row]);
    
    for (let y = 0; y < currentPiece.shape.length; y++) {
      for (let x = 0; x < currentPiece.shape[y].length; x++) {
        if (currentPiece.shape[y][x]) {
          const boardY = position.y + y;
          if (boardY < 0) {
            setGameOver(true);
            return;
          }
          newBoard[boardY][position.x + x] = currentPiece.color;
        }
      }
    }

    // Check for completed lines
    let linesCleared = 0;
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
      if (newBoard[y].every(cell => cell !== null)) {
        newBoard.splice(y, 1);
        newBoard.unshift(Array(BOARD_WIDTH).fill(null));
        linesCleared++;
        y++; // Check the same row again
      }
    }

    // Update score
    if (linesCleared > 0) {
      setScore(prev => prev + (linesCleared * 100));
    }

    setBoard(newBoard);
    spawnNewPiece();
  }, [board, currentPiece, position]);

  const moveDown = useCallback(() => {
    if (!currentPiece || isPaused) return;

    const newPosition = { ...position, y: position.y + 1 };
    if (isValidMove(currentPiece, newPosition)) {
      setPosition(newPosition);
    } else {
      mergePieceWithBoard();
    }
  }, [currentPiece, position, isValidMove, mergePieceWithBoard, isPaused]);

  const moveHorizontally = useCallback((direction) => {
    if (!currentPiece || isPaused) return;
    
    const newPosition = { ...position, x: position.x + direction };
    if (isValidMove(currentPiece, newPosition)) {
      setPosition(newPosition);
    }
  }, [currentPiece, position, isValidMove, isPaused]);

  const rotate = useCallback(() => {
    if (!currentPiece || isPaused) return;

    const rotatedShape = currentPiece.shape[0].map((_, i) =>
      currentPiece.shape.map(row => row[i]).reverse()
    );
    
    const rotatedPiece = { ...currentPiece, shape: rotatedShape };
    if (isValidMove(rotatedPiece, position)) {
      setCurrentPiece(rotatedPiece);
    }
  }, [currentPiece, position, isValidMove, isPaused]);

  const spawnNewPiece = useCallback(() => {
    const newPiece = getRandomTetromino();
    const newPosition = {
      x: Math.floor((BOARD_WIDTH - newPiece.shape[0].length) / 2),
      y: -newPiece.shape.length
    };
    
    if (!isValidMove(newPiece, newPosition)) {
      setGameOver(true);
    } else {
      setCurrentPiece(newPiece);
      setPosition(newPosition);
    }
  }, [isValidMove]);

  useEffect(() => {
    if (!currentPiece && !gameOver) {
      spawnNewPiece();
    }
  }, [currentPiece, gameOver, spawnNewPiece]);

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (gameOver) return;
      
      switch (event.key) {
        case 'ArrowLeft':
          moveHorizontally(-1);
          break;
        case 'ArrowRight':
          moveHorizontally(1);
          break;
        case 'ArrowDown':
          moveDown();
          break;
        case 'ArrowUp':
          rotate();
          break;
        case ' ':
          setIsPaused(prev => !prev);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [moveHorizontally, moveDown, rotate, gameOver]);

  useEffect(() => {
    if (!gameOver && !isPaused) {
      const interval = setInterval(moveDown, INITIAL_SPEED);
      return () => clearInterval(interval);
    }
  }, [moveDown, gameOver, isPaused]);
  
  const renderBoard = () => {
    const displayBoard = board.map(row => [...row]);

    if (currentPiece) {
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x]) {
            const boardY = position.y + y;
            const boardX = position.x + x;
            if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
              displayBoard[boardY][boardX] = currentPiece.color;
            }
          }
        }
      }
    }

    return displayBoard;
  };

  const handleGameComplete = () => {
    if (onGameComplete) {
      onGameComplete(score);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
      <div className="mb-4 text-2xl text-white">Score: {score}</div>
      <div className="relative">
        <div className="grid gap-px bg-gray-700 p-1">
          {renderBoard().map((row, y) => (
            <div key={y} className="flex">
              {row.map((cell, x) => (
                <div
                  key={`${x}-${y}`}
                  className={`w-6 h-6 border border-gray-800 ${cell || 'bg-gray-800'}`}
                />
              ))}
            </div>
          ))}
        </div>
        {isPaused && !gameOver && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-white text-2xl font-bold">PAUSED</div>
          </div>
        )}
      </div>
      <div className="mt-4 text-white text-sm">
        Use arrow keys to move • Space to pause
      </div>

      <AlertDialog open={gameOver}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Game Over!</AlertDialogTitle>
            <AlertDialogDescription>
              Final Score: {score}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleGameComplete}>
              Continue to Next Scene
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TetrisGame;