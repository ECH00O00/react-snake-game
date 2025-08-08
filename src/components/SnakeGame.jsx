import React, { useState, useEffect, useRef, useCallback } from 'react';

const SnakeGame = () => {
  // 游戏配置
  const gridSize = 20; // 网格大小(20x20)
  const cellSize = 20; // 每个单元格的像素大小
  const initialSpeed = 150; // 初始速度（毫秒）
  const minSpeed = 50; // 最小速度
  const speedDecrement = 10; // 每得5分速度增加的量
  
  // 游戏状态
  const [snake, setSnake] = useState([{x: 10, y: 10}]);
  const [food, setFood] = useState({x: 5, y: 5});
  const [direction, setDirection] = useState('RIGHT');
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return localStorage.getItem('snakeHighScore') || 0;
  });
  const [speed, setSpeed] = useState(initialSpeed);
  const [gameStarted, setGameStarted] = useState(false);
  
  const gameBoardRef = useRef(null);
  
  // 生成随机食物位置（确保不在蛇身上）
  const generateFood = useCallback(() => {
    const newFood = {
      x: Math.floor(Math.random() * gridSize),
      y: Math.floor(Math.random() * gridSize)
    };
    
    // 检查食物是否在蛇身上，如果是则重新生成
    const isOnSnake = snake.some(segment => 
      segment.x === newFood.x && segment.y === newFood.y
    );
    
    if (isOnSnake) {
      return generateFood();
    }
    
    return newFood;
  }, [snake, gridSize]);
  
  // 初始化游戏
  const startGame = () => {
    setSnake([{x: 10, y: 10}]);
    setFood(generateFood());
    setDirection('RIGHT');
    setGameOver(false);
    setScore(0);
    setSpeed(initialSpeed);
    setGameStarted(true);
  };
  
  // 键盘事件处理
  useEffect(() => {
    if (!gameStarted) return;
    
    const handleKeyDown = (e) => {
      // 防止游戏区域滚动
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
      }
      
      switch (e.key) {
        case 'ArrowUp':
          if (direction !== 'DOWN') setDirection('UP');
          break;
        case 'ArrowDown':
          if (direction !== 'UP') setDirection('DOWN');
          break;
        case 'ArrowLeft':
          if (direction !== 'RIGHT') setDirection('LEFT');
          break;
        case 'ArrowRight':
          if (direction !== 'LEFT') setDirection('RIGHT');
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction, gameStarted]);
  
  // 游戏主循环
  useEffect(() => {
    if (!gameStarted || gameOver) return;
    
    const moveSnake = () => {
      setSnake(prevSnake => {
        // 获取蛇头位置
        const head = {...prevSnake[0]};
        
        // 根据方向移动蛇头
        switch (direction) {
          case 'UP':
            head.y -= 1;
            break;
          case 'DOWN':
            head.y += 1;
            break;
          case 'LEFT':
            head.x -= 1;
            break;
          case 'RIGHT':
            head.x += 1;
            break;
          default:
            break;
        }
        
        // 检查是否撞墙
        if (
          head.x < 0 || 
          head.x >= gridSize || 
          head.y < 0 || 
          head.y >= gridSize
        ) {
          setGameOver(true);
          return prevSnake;
        }
        
        // 检查是否撞到自己
        if (prevSnake.some(
          (segment, index) => index > 0 && 
          segment.x === head.x && segment.y === head.y)
        ) {
          setGameOver(true);
          return prevSnake;
        }
        
        // 检查是否吃到食物
        const newSnake = [head, ...prevSnake];
        if (head.x === food.x && head.y === food.y) {
          // 吃到食物
          const newScore = score + 1;
          setScore(newScore);
          
          // 更新最高分
          if (newScore > highScore) {
            setHighScore(newScore);
            localStorage.setItem('snakeHighScore', newScore);
          }
          
          // 每得5分增加速度
          if (newScore % 5 === 0 && speed > minSpeed) {
            setSpeed(prev => Math.max(minSpeed, prev - speedDecrement));
          }
          
          // 生成新食物
          setFood(generateFood());
        } else {
          // 没吃到食物，移除尾部
          newSnake.pop();
        }
        
        return newSnake;
      });
    };
    
    const gameInterval = setInterval(moveSnake, speed);
    
    return () => clearInterval(gameInterval);
  }, [direction, food, speed, gameOver, score, gameStarted, highScore, gridSize, generateFood]);
  
  // 渲染网格单元格
  const renderCells = () => {
    const cells = [];
    
    // 创建所有单元格
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const isSnake = snake.some(
          segment => segment.x === x && segment.y === y
        );
        const isFood = food.x === x && food.y === y;
        
        let cellClass = "grid-cell";
        if (isSnake) cellClass += " snake";
        if (isFood) cellClass += " food";
        if (isSnake && snake[0].x === x && snake[0].y === y) cellClass += " snake-head";
        
        cells.push(
          <div 
            key={`${x}-${y}`} 
            className={cellClass}
            style={{
              width: `${cellSize}px`,
              height: `${cellSize}px`,
              left: `${x * cellSize}px`,
              top: `${y * cellSize}px`,
            }}
          />
        );
      }
    }
    
    return cells;
  };

  return (
    <div className="snake-game-container">
      <h1 className="game-title">React 贪吃蛇</h1>
      
      <div className="game-info">
        <div className="score-board">
          <div className="score">得分: {score}</div>
          <div className="high-score">最高分: {highScore}</div>
        </div>
      </div>
      
      <div className="game-board-wrapper">
        <div 
          ref={gameBoardRef}
          className="game-board"
          style={{
            width: `${gridSize * cellSize}px`,
            height: `${gridSize * cellSize}px`,
            position: 'relative',
          }}
        >
          {renderCells()}
          
          {gameOver && (
            <div className="game-over-overlay">
              <h2>游戏结束!</h2>
              <p>你的得分: {score}</p>
              <button className="restart-button" onClick={startGame}>
                重新开始
              </button>
            </div>
          )}
          
          {!gameStarted && (
            <div className="start-screen-overlay">
              <h2>欢迎来到贪吃蛇!</h2>
              <p>使用方向键移动蛇</p>
              <button className="start-button" onClick={startGame}>
                开始游戏
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="controls">
        <p>使用键盘方向键控制蛇的移动</p>
        <p>每得5分，蛇的速度会增加</p>
      </div>
      
      <div className="mobile-controls">
        <button onClick={() => direction !== 'DOWN' && setDirection('UP')}>上</button>
        <div>
          <button onClick={() => direction !== 'RIGHT' && setDirection('LEFT')}>左</button>
          <button onClick={() => direction !== 'LEFT' && setDirection('RIGHT')}>右</button>
        </div>
        <button onClick={() => direction !== 'UP' && setDirection('DOWN')}>下</button>
      </div>
    </div>
  );
};

// 添加样式
const style = document.createElement('style');
style.textContent = `
.snake-game-container {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  text-align: center;
  background: #f0f5ff;
  border-radius: 12px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.game-title {
  color: #2c3e50;
  font-size: 36px;
  margin-bottom: 10px;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
}

.game-info {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.score-board {
  display: flex;
  gap: 30px;
  background: #3498db;
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: bold;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.game-board-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.game-board {
  background: #ecf0f1;
  border: 2px solid #3498db;
  border-radius: 4px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  position: relative;
}

.grid-cell {
  position: absolute;
  border: 1px solid #ddd;
  box-sizing: border-box;
  transition: background 0.1s;
}

.grid-cell.snake {
  background: #2ecc71;
  border-radius: 3px;
  z-index: 1;
}

.grid-cell.snake-head {
  background: #27ae60;
  border-radius: 6px;
}

.grid-cell.food {
  background: #e74c3c;
  border-radius: 50%;
  animation: pulse 1s infinite alternate;
  z-index: 1;
}

@keyframes pulse {
  from { transform: scale(0.8); }
  to { transform: scale(1.1); }
}

.game-over-overlay,
.start-screen-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  border-radius: 4px;
  z-index: 10;
  font-size: 20px;
}

button {
  background: #3498db;
  color: white;
  border: none;
  padding: 12px 24px;
  font-size: 18px;
  border-radius: 50px;
  cursor: pointer;
  margin-top: 15px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

button:hover {
  background: #2980b9;
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0,0,0,0.15);
}

button:active {
  transform: translateY(0);
}

.controls {
  margin-top: 20px;
  padding: 15px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
}

.mobile-controls {
  display: none;
  flex-direction: column;
  align-items: center;
  margin-top: 20px;
  gap: 10px;
}

.mobile-controls > div {
  display: flex;
  gap: 40px;
}

.mobile-controls button {
  width: 80px;
  height: 60px;
  font-size: 24px;
  background: #9b59b6;
}

@media (max-width: 600px) {
  .game-title {
    font-size: 28px;
  }
  
  .game-board {
    width: 100%;
    height: calc(100vw - 40px);
  }
  
  .grid-cell {
    width: calc(100% / ${20}) !important;
    height: calc(100% / ${20}) !important;
    left: auto !important;
    top: auto !important;
  }
  
  .mobile-controls {
    display: flex;
  }
}
`;
document.head.appendChild(style);

export default SnakeGame;