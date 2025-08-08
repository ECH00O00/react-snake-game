import React, { useState, useEffect, useRef, useCallback } from 'react';

const SnakeGame = () => {
  // 游戏配置 - 竖屏优化
  const gridSize = 15; // 网格大小
  const getCellSize = () => Math.min(window.innerWidth * 0.07, 30); // 动态计算单元格大小
  const initialSpeed = 150;
  const minSpeed = 60;
  const speedDecrement = 10;
  
  // 游戏状态
  const [snake, setSnake] = useState([{x: 7, y: 7}]);
  const [food, setFood] = useState({x: 3, y: 3});
  const [direction, setDirection] = useState('RIGHT');
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return localStorage.getItem('snakeHighScore') || 0;
  });
  const [speed, setSpeed] = useState(initialSpeed);
  const [gameStarted, setGameStarted] = useState(false);
  const [cellSize, setCellSize] = useState(getCellSize());
  
  const gameBoardRef = useRef(null);
  
  // 响应式设计：检测屏幕变化
  useEffect(() => {
    const handleResize = () => {
      setCellSize(getCellSize());
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // 生成随机食物
  const generateFood = useCallback(() => {
    const newFood = {
      x: Math.floor(Math.random() * gridSize),
      y: Math.floor(Math.random() * gridSize)
    };
    
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
    setSnake([{x: 7, y: 7}]);
    setFood(generateFood());
    setDirection('RIGHT');
    setGameOver(false);
    setScore(0);
    setSpeed(initialSpeed);
    setGameStarted(true);
    setCellSize(getCellSize());
  };
  
  // 处理键盘和触摸事件
  useEffect(() => {
    if (!gameStarted) return;
    
    const handleKeyDown = (e) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
      }
      
      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W':
          if (direction !== 'DOWN') setDirection('UP');
          break;
        case 'ArrowDown': case 's': case 'S':
          if (direction !== 'UP') setDirection('DOWN');
          break;
        case 'ArrowLeft': case 'a': case 'A':
          if (direction !== 'RIGHT') setDirection('LEFT');
          break;
        case 'ArrowRight': case 'd': case 'D':
          if (direction !== 'LEFT') setDirection('RIGHT');
          break;
        default:
          break;
      }
    };
    
    // 添加触摸事件处理
    let touchStartX = 0;
    let touchStartY = 0;
    
    const handleTouchStart = (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      e.preventDefault();
    };
    
    const handleTouchMove = (e) => {
      const touchX = e.touches[0].clientX;
      const touchY = e.touches[0].clientY;
      const diffX = touchX - touchStartX;
      const diffY = touchY - touchStartY;
      
      // 确保至少有30px的移动才触发方向变化，避免误触
      if (Math.abs(diffX) > 30 || Math.abs(diffY) > 30) {
        if (Math.abs(diffX) > Math.abs(diffY)) {
          if (diffX > 0 && direction !== 'LEFT') {
            setDirection('RIGHT');
          } else if (diffX < 0 && direction !== 'RIGHT') {
            setDirection('LEFT');
          }
        } else {
          if (diffY > 0 && direction !== 'UP') {
            setDirection('DOWN');
          } else if (diffY < 0 && direction !== 'DOWN') {
            setDirection('UP');
          }
        }
        e.preventDefault();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [direction, gameStarted]);
  
  // 游戏主循环
  useEffect(() => {
    if (!gameStarted || gameOver) return;
    
    const moveSnake = () => {
      setSnake(prevSnake => {
        const head = {...prevSnake[0]};
        
        switch (direction) {
          case 'UP': head.y -= 1; break;
          case 'DOWN': head.y += 1; break;
          case 'LEFT': head.x -= 1; break;
          case 'RIGHT': head.x += 1; break;
        }
        
        // 穿墙功能
        head.x = (head.x + gridSize) % gridSize;
        head.y = (head.y + gridSize) % gridSize;
        
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
          
          setFood(generateFood());
        } else {
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
    
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const isSnake = snake.some(segment => segment.x === x && segment.y === y);
        const isFood = food.x === x && food.y === y;
        const isHead = snake[0].x === x && snake[0].y === y;
        
        let cellClass = "grid-cell";
        if (isSnake) cellClass += " snake";
        if (isFood) cellClass += " food";
        if (isHead) cellClass += " snake-head";
        
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
      <div className="game-header">
        <h1 className="game-title">贪吃蛇</h1>
        <div className="score-display">
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
              <p>滑动屏幕或使用按钮控制蛇</p>
              <button className="start-button" onClick={startGame}>
                开始游戏
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="mobile-controls">
        <div className="directional-pad">
          <div className="dpad-row">
            <div className="dpad-space"></div>
            <button 
              className="dpad-button up" 
              onClick={() => direction !== 'DOWN' && setDirection('UP')}
            >
              ↑
            </button>
            <div className="dpad-space"></div>
          </div>
          <div className="dpad-row">
            <button 
              className="dpad-button left" 
              onClick={() => direction !== 'RIGHT' && setDirection('LEFT')}
            >
              ←
            </button>
            <div className="dpad-center"></div>
            <button 
              className="dpad-button right" 
              onClick={() => direction !== 'LEFT' && setDirection('RIGHT')}
            >
              →
            </button>
          </div>
          <div className="dpad-row">
            <div className="dpad-space"></div>
            <button 
              className="dpad-button down" 
              onClick={() => direction !== 'UP' && setDirection('DOWN')}
            >
              ↓
            </button>
            <div className="dpad-space"></div>
          </div>
        </div>
        
        <div className="action-buttons">
          <button className="action-button pause" onClick={() => setGameStarted(!gameStarted)}>
            {gameStarted ? '暂停' : '继续'}
          </button>
          <button className="action-button restart" onClick={startGame}>
            重新开始
          </button>
        </div>
      </div>
    </div>
  );
};

// 添加样式
const style = document.createElement('style');
style.textContent = `
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  touch-action: manipulation;
}

html, body {
  overflow-x: hidden;
  width: 100%;
  height: 100%;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
  color: white;
}

.snake-game-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  padding: 20px 15px 80px;
  position: relative;
}

.game-header {
  width: 100%;
  max-width: 500px;
  text-align: center;
  margin-bottom: 15px;
}

.game-title {
  font-size: 36px;
  margin-bottom: 10px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
  color: #fff;
}

.score-display {
  display: flex;
  justify-content: center;
  gap: 25px;
  font-size: 18px;
  font-weight: bold;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
}

.game-board-wrapper {
  display: flex;
  justify-content: center;
  width: 100%;
  margin-bottom: 30px;
}

.game-board {
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 10px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  position: relative;
  backdrop-filter: blur(4px);
}

.grid-cell {
  position: absolute;
  transition: all 0.1s;
  border-radius: 4px;
}

.grid-cell.snake {
  background: #2ecc71;
  box-shadow: 0 0 5px rgba(46, 204, 113, 0.8);
  z-index: 1;
}

.grid-cell.snake-head {
  background: #27ae60;
  border-radius: 30%;
  transform: scale(0.9);
  box-shadow: 0 0 8px rgba(39, 174, 96, 0.9);
}

.grid-cell.food {
  background: #e74c3c;
  border-radius: 50%;
  animation: pulse 1s infinite alternate;
  z-index: 2;
  box-shadow: 0 0 10px rgba(231, 76, 60, 0.8);
}

@keyframes pulse {
  0% { transform: scale(0.9); }
  100% { transform: scale(1.1); }
}

.game-over-overlay,
.start-screen-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  z-index: 100;
  font-size: 18px;
  text-align: center;
  padding: 20px;
  border-radius: 10px;
}

.game-over-overlay h2, .start-screen-overlay h2 {
  margin-bottom: 15px;
  font-size: 32px;
  color: #ff6b6b;
}

button {
  background: linear-gradient(to right, #3498db, #2980b9);
  color: white;
  border: none;
  padding: 12px 25px;
  font-size: 18px;
  border-radius: 50px;
  cursor: pointer;
  margin: 10px 5px;
  transition: all 0.2s ease;
  box-shadow: 0 4px 10px rgba(0,0,0,0.2);
  outline: none;
  font-weight: bold;
}

button:hover, button:active {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(0,0,0,0.3);
}

.restart-button {
  background: linear-gradient(to right, #2ecc71, #27ae60);
}

.start-button {
  background: linear-gradient(to right, #9b59b6, #8e44ad);
}

.mobile-controls {
  width: 100%;
  max-width: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.directional-pad {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 200px;
  height: 200px;
  position: relative;
}

.dpad-row {
  display: flex;
  justify-content: center;
  width: 100%;
}

.dpad-button {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.15);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  font-size: 28px;
  color: white;
  box-shadow: 0 4px 10px rgba(0,0,0,0.2);
  transition: all 0.2s;
  backdrop-filter: blur(5px);
}

.dpad-button:active {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(0.95);
}

.dpad-space {
  width: 60px;
  height: 60px;
}

.dpad-center {
  width: 60px;
  height: 60px;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 15px;
  width: 100%;
}

.action-button {
  flex: 1;
  padding: 12px;
  font-size: 16px;
  border-radius: 50px;
  max-width: 140px;
}

.pause {
  background: linear-gradient(to right, #f39c12, #e67e22);
}

.restart {
  background: linear-gradient(to right, #e74c3c, #c0392b);
}

@media (max-width: 480px) {
  .game-title {
    font-size: 28px;
  }
  
  .score-display {
    font-size: 16px;
    gap: 20px;
  }
  
  .directional-pad {
    width: 180px;
    height: 180px;
  }
  
  .dpad-button {
    width: 55px;
    height: 55px;
    font-size: 24px;
  }
  
  .dpad-space, .dpad-center {
    width: 55px;
    height: 55px;
  }
  
  button {
    padding: 10px 20px;
    font-size: 16px;
  }
  
  .action-button {
    padding: 10px;
    font-size: 15px;
  }
}

@media (max-height: 700px) {
  .game-board-wrapper {
    margin-bottom: 15px;
  }
  
  .mobile-controls {
    gap: 15px;
  }
}
`;
document.head.appendChild(style);

export default SnakeGame;