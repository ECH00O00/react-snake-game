import React, { useState, useEffect, useRef, useCallback } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './SnakeGame.css';

const SnakeGame = () => {
  // 游戏配置
  const gridSize = 15;
  const getCellSize = () => Math.min(window.innerWidth * 0.07, 30);
  const initialSpeed = 150;
  const minSpeed = 60;
  const speedDecrement = 10;
  
  // 游戏状态
  const [snake, setSnake] = useState([{x: 7, y: 7}]);
  const [food, setFood] = useState({x: 5, y: 5});
  const [direction, setDirection] = useState('RIGHT');
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return localStorage.getItem('snakeHighScore') || 0;
  });
  const [speed, setSpeed] = useState(initialSpeed);
  const [gameStarted, setGameStarted] = useState(false);
  const [cellSize, setCellSize] = useState(getCellSize());
  const [isPaused, setIsPaused] = useState(false);
  
  const gameBoardRef = useRef(null);
  const touchStartRef = useRef({x: 0, y: 0});
  
  // 响应式设计：检测屏幕变化
  useEffect(() => {
    const handleResize = () => {
      setCellSize(getCellSize());
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // 生成随机食物 - 确保在游戏区域内
  const generateFood = useCallback(() => {
    const newFood = {
      x: Math.floor(Math.random() * (gridSize - 2)) + 1, // 确保在1到gridSize-2之间
      y: Math.floor(Math.random() * (gridSize - 2)) + 1
    };
    
    // 确保食物不会出现在蛇身上
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
    setIsPaused(false);
    setCellSize(getCellSize());
  };
  
  // 暂停/继续游戏
  const togglePause = () => {
    setIsPaused(!isPaused);
  };
  
  // 修复移动端滑动控制问题并防止页面滚动
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY
    };
    e.preventDefault(); // 防止页面滚动
  };
  
  const handleTouchMove = (e) => {
    if (!gameStarted || isPaused) return;
    
    const touch = e.touches[0];
    const diffX = touch.clientX - touchStartRef.current.x;
    const diffY = touch.clientY - touchStartRef.current.y;
    
    // 确保至少有30px的移动才触发方向变化，避免误触
    if (Math.abs(diffX) > 30 || Math.abs(diffY) > 30) {
      if (Math.abs(diffX) > Math.abs(diffY)) {
        // 水平滑动
        if (diffX > 0 && direction !== 'LEFT') {
          setDirection('RIGHT');
        } else if (diffX < 0 && direction !== 'RIGHT') {
          setDirection('LEFT');
        }
      } else {
        // 垂直滑动
        if (diffY > 0 && direction !== 'UP') {
          setDirection('DOWN');
        } else if (diffY < 0 && direction !== 'DOWN') {
          setDirection('UP');
        }
      }
      // 重置起点，避免连续滑动
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY
      };
      e.preventDefault(); // 防止页面滚动
    }
  };
  
  // 处理键盘事件
  useEffect(() => {
    if (!gameStarted || isPaused) return;
    
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
        case ' ': // 空格键暂停
          togglePause();
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction, gameStarted, isPaused]);
  
  // 游戏主循环 - 添加墙壁碰撞检测
  useEffect(() => {
    if (!gameStarted || gameOver || isPaused) return;
    
    const moveSnake = () => {
      setSnake(prevSnake => {
        const head = {...prevSnake[0]};
        
        switch (direction) {
          case 'UP': head.y -= 1; break;
          case 'DOWN': head.y += 1; break;
          case 'LEFT': head.x -= 1; break;
          case 'RIGHT': head.x += 1; break;
        }
        
        // 检查是否撞墙 (0 和 gridSize-1 是墙壁)
        if (head.x <= 0 || head.x >= gridSize - 1 || head.y <= 0 || head.y >= gridSize - 1) {
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
          
          setFood(generateFood());
        } else {
          newSnake.pop();
        }
        
        return newSnake;
      });
    };
    
    const gameInterval = setInterval(moveSnake, speed);
    return () => clearInterval(gameInterval);
  }, [direction, food, speed, gameOver, score, gameStarted, highScore, gridSize, generateFood, isPaused]);
  
  // 渲染网格单元格 - 添加墙壁渲染
  const renderCells = () => {
    const cells = [];
    
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const isSnake = snake.some(segment => segment.x === x && segment.y === y);
        const isFood = food.x === x && food.y === y;
        const isHead = snake[0].x === x && snake[0].y === y;
        const isWall = x === 0 || x === gridSize - 1 || y === 0 || y === gridSize - 1;
        
        let cellClass = "grid-cell";
        if (isSnake) cellClass += " snake";
        if (isFood) cellClass += " food";
        if (isHead) cellClass += " snake-head";
        if (isWall) cellClass += " wall";
        
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
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          <div className="card shadow-lg border-0">
            <div className="card-header bg-primary text-white">
              <div className="d-flex justify-content-between align-items-center">
                <h1 className="h4 mb-0">贪吃蛇游戏</h1>
                <div className="d-flex">
                  <span className="badge bg-light text-dark me-2">
                    得分: <strong>{score}</strong>
                  </span>
                  <span className="badge bg-warning text-dark">
                    最高分: <strong>{highScore}</strong>
                  </span>
                </div>
              </div>
            </div>
            
            <div className="card-body p-3">
              <div className="d-flex justify-content-center mb-4">
                <div 
                  ref={gameBoardRef}
                  className="game-board rounded"
                  style={{
                    width: `${gridSize * cellSize}px`,
                    height: `${gridSize * cellSize}px`,
                  }}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                >
                  {renderCells()}
                  
                  {gameOver && (
                    <div className="game-over-overlay d-flex flex-column justify-content-center align-items-center">
                      <h2 className="text-danger fw-bold mb-3">游戏结束!</h2>
                      <p className="h5 mb-4">你的得分: {score}</p>
                      <button 
                        className="btn btn-success btn-lg px-4"
                        onClick={startGame}
                      >
                        重新开始
                      </button>
                    </div>
                  )}
                  
                  {!gameStarted && (
                    <div className="start-screen-overlay d-flex flex-column justify-content-center align-items-center">
                      <h2 className="text-primary fw-bold mb-3">欢迎来到贪吃蛇!</h2>
                      <p className="h6 mb-4 text-center">
                        滑动屏幕或使用按钮控制蛇
                      </p>
                      <button 
                        className="btn btn-primary btn-lg px-4"
                        onClick={startGame}
                      >
                        开始游戏
                      </button>
                    </div>
                  )}
                  
                  {gameStarted && !gameOver && isPaused && (
                    <div className="pause-overlay d-flex flex-column justify-content-center align-items-center">
                      <h2 className="text-warning fw-bold mb-4">游戏暂停</h2>
                      <button 
                        className="btn btn-primary btn-lg px-4"
                        onClick={togglePause}
                      >
                        继续游戏
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mobile-controls">
                <div className="directional-pad mb-4">
                  <div className="d-flex justify-content-center mb-2">
                    <button 
                      className="btn btn-outline-primary btn-lg rounded-circle mx-1"
                      onClick={() => direction !== 'DOWN' && setDirection('UP')}
                    >
                      ↑
                    </button>
                  </div>
                  <div className="d-flex justify-content-center">
                    <button 
                      className="btn btn-outline-primary btn-lg rounded-circle mx-1"
                      onClick={() => direction !== 'RIGHT' && setDirection('LEFT')}
                    >
                      ←
                    </button>
                    <div className="mx-2" style={{width: '60px'}}></div>
                    <button 
                      className="btn btn-outline-primary btn-lg rounded-circle mx-1"
                      onClick={() => direction !== 'LEFT' && setDirection('RIGHT')}
                    >
                      →
                    </button>
                  </div>
                  <div className="d-flex justify-content-center mt-2">
                    <button 
                      className="btn btn-outline-primary btn-lg rounded-circle mx-1"
                      onClick={() => direction !== 'UP' && setDirection('DOWN')}
                    >
                      ↓
                    </button>
                  </div>
                </div>
                
                <div className="action-buttons d-flex justify-content-center gap-3">
                  <button 
                    className="btn btn-warning flex-grow-1"
                    onClick={togglePause}
                  >
                    {isPaused ? '继续游戏' : '暂停游戏'}
                  </button>
                  <button 
                    className="btn btn-danger flex-grow-1"
                    onClick={startGame}
                  >
                    重新开始
                  </button>
                </div>
              </div>
            </div>
            
            <div className="card-footer bg-light text-center py-3">
              <small className="text-muted">
                使用方向键或屏幕按钮控制蛇的移动 | 每得5分速度会增加
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SnakeGame;