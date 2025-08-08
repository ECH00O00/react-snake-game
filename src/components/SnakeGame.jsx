import React, { useState, useEffect, useRef, useCallback } from 'react';

const SnakeGame = () => {
  // 游戏配置
  const gridSize = 15; 
  // 修复：使用函数动态计算单元格大小
  const getCellSize = () => Math.min(window.innerWidth * 0.055, 30);
  const initialSpeed = 150;
  const minSpeed = 50;
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
  const [isPortrait, setIsPortrait] = useState(window.innerHeight > window.innerWidth);
  // 修复：添加单元格大小的状态
  const [cellSize, setCellSize] = useState(getCellSize());
  
  const gameBoardRef = useRef(null);
  
  // 响应式设计：检测屏幕方向变化
  useEffect(() => {
    const handleResize = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
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
      {isPortrait && !gameStarted ? (
        <div className="rotation-warning">
          <div className="phone-icon">📱</div>
          <p>请将手机横屏以获得更好体验</p>
        </div>
      ) : null}
      
      <div className={`game-content ${isPortrait ? 'portrait' : 'landscape'}`}>
        <h1 className="game-title">贪吃蛇游戏</h1>
        
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
                <p>使用方向键或滑动屏幕移动蛇</p>
                <p>将手机横屏获得更好体验</p>
                <button className="start-button" onClick={startGame}>
                  开始游戏
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="mobile-controls">
          <div className="direction-controls">
            <button className="control-button" onClick={() => direction !== 'DOWN' && setDirection('UP')}></button>
            <div className="horizontal-controls">
              <button className="control-button" onClick={() => direction !== 'RIGHT' && setDirection('LEFT')}></button>
              <button className="control-button blank"></button>
              <button className="control-button" onClick={() => direction !== 'LEFT' && setDirection('RIGHT')}></button>
            </div>
            <button className="control-button" onClick={() => direction !== 'UP' && setDirection('DOWN')}></button>
          </div>
          <div className="action-controls">
            <button className="action-button" onClick={startGame}>开始/暂停</button>
            <button className="action-button" onClick={() => setGameOver(true)}>结束</button>
          </div>
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
  background: #f0f5ff;
}

.snake-game-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
  position: relative;
}

.rotation-warning {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.phone-icon {
  font-size: 60px;
  animation: rotate 2s infinite;
  margin-bottom: 20px;
}

@keyframes rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(90deg); }
}

.game-content {
  width: 100%;
  max-width: 800px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.game-content.portrait .game-board-wrapper {
  margin-top: 10px;
  margin-bottom: 15px;
}

.game-content.portrait .mobile-controls {
  margin-top: 10px;
}

.game-content.landscape {
  flex-direction: row;
  align-items: flex-start;
  justify-content: center;
}

.game-content.landscape .game-board-wrapper {
  margin: 0 30px;
}

.game-content.landscape .mobile-controls {
  margin-top: 20px;
  flex-direction: column;
  align-self: flex-end;
}

.game-title {
  color: #2c3e50;
  font-size: 32px;
  margin-bottom: 15px;
  text-align: center;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
}

.game-info {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-bottom: 15px;
}

.score-board {
  display: flex;
  gap: 30px;
  background: #3498db;
  color: white;
  padding: 10px 20px;
  border-radius: 50px;
  font-weight: bold;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.game-board-wrapper {
  position: relative;
  display: flex;
  justify-content: center;
}

.game-board {
  background: #ecf0f1;
  border: 2px solid #3498db;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  position: relative;
}

.grid-cell {
  position: absolute;
  transition: all 0.1s;
}

.grid-cell.snake {
  background: #2ecc71;
  border-radius: 4px;
  z-index: 1;
}

.grid-cell.snake-head {
  background: #27ae60;
  border-radius: 30%;
  transform: scale(0.9);
}

.grid-cell.food {
  background: #e74c3c;
  border-radius: 50%;
  animation: pulse 1s infinite alternate;
  z-index: 2;
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
  border-radius: 8px;
}

.game-over-overlay h2, .start-screen-overlay h2 {
  margin-bottom: 15px;
  font-size: 32px;
  color: #ff6b6b;
}

button {
  background: #3498db;
  color: white;
  border: none;
  padding: 12px 30px;
  font-size: 18px;
  border-radius: 50px;
  cursor: pointer;
  margin: 10px 5px;
  transition: all 0.2s ease;
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  outline: none;
}

button:hover, button:active {
  background: #2980b9;
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0,0,0,0.2);
}

.restart-button {
  background: #2ecc71;
}

.restart-button:hover {
  background: #27ae60;
}

.mobile-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 20px;
  width: 100%;
  max-width: 500px;
}

.direction-controls {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: 1fr 1fr 1fr;
  gap: 8px;
  margin-bottom: 20px;
  width: 100%;
  max-width: 300px;
}

.control-button {
  background: rgba(52, 152, 219, 0.3);
  border: 2px solid #3498db;
  border-radius: 15px;
  width: 100%;
  height: 60px;
  position: relative;
  transition: all 0.2s;
}

.control-button:active {
  background: rgba(52, 152, 219, 0.8);
}

.control-button:nth-child(1) {
  grid-column: 2;
  grid-row: 1;
}

.control-button:nth-child(1)::after {
  content: "↑";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 24px;
}

.control-button:nth-child(2) {
  grid-column: 1;
  grid-row: 2;
}

.control-button:nth-child(2)::after {
  content: "←";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 24px;
}

.control-button:nth-child(3) {
  grid-column: 2;
  grid-row: 2;
  background: transparent;
  border: none;
}

.control-button:nth-child(4) {
  grid-column: 3;
  grid-row: 2;
}

.control-button:nth-child(4)::after {
  content: "→";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 24px;
}

.control-button:nth-child(5) {
  grid-column: 2;
  grid-row: 3;
}

.control-button:nth-child(5)::after {
  content: "↓";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 24px;
}

.action-controls {
  display: flex;
  justify-content: space-between;
  width: 100%;
  max-width: 350px;
}

.action-button {
  flex: 1;
  margin: 0 5px;
  padding: 15px;
  font-size: 16px;
  background: #9b59b6;
}

@media (max-width: 767px) {
  .score-board {
    padding: 8px 16px;
    font-size: 14px;
  }
  
  .game-title {
    font-size: 24px;
  }
  
  .game-over-overlay h2, .start-screen-overlay h2 {
    font-size: 26px;
  }
  
  button {
    padding: 10px 20px;
    font-size: 16px;
  }
  
  .control-button {
    height: 50px;
  }
}

@media (min-width: 768px) and (max-width: 1024px) {
  .direction-controls {
    max-width: 250px;
  }
  
  .control-button {
    height: 70px;
  }
  
  button {
    font-size: 18px;
    padding: 15px 25px;
  }
}

.game-content.landscape {
  @media (max-width: 1024px) {
    flex-direction: column;
    align-items: center;
    
    .game-board-wrapper {
      margin: 0 0 20px;
    }
  }
}
`;
document.head.appendChild(style);

export default SnakeGame;