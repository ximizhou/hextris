import { settings, gameVars } from './settings.js';
import UI from './UI.js';

// 游戏状态常量
const GAME_STATES = {
  MENU: 0,
  PLAYING: 1,
  GAME_OVER: 2,
  PAUSED: -1
};

// 创建UI实例
const ui = new UI();

// 将UI实例添加到gameVars中，使其可以被游戏主逻辑访问
gameVars.UI = ui;

/**
 * 旋转点坐标
 */
function rotatePoint(x, y, angle) {
  const rad = angle * Math.PI / 180;
  return {
    x: x * Math.cos(rad) - y * Math.sin(rad),
    y: x * Math.sin(rad) + y * Math.cos(rad)
  };
}

/**
 * 绘制多边形 - 完全参考原版
 */
export function drawPolygon(x, y, sides, radius, theta, fillColor, lineWidth, lineColor) {
  const ctx = GameGlobal.canvas.getContext('2d');
  ctx.fillStyle = fillColor;
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = lineColor;

  ctx.beginPath();
  let coords = rotatePoint(0, radius, theta);
  ctx.moveTo(coords.x + x, coords.y + y);
  let oldX = coords.x;
  let oldY = coords.y;
  
  for (let i = 0; i < sides; i++) {
    coords = rotatePoint(oldX, oldY, 360 / sides);
    ctx.lineTo(coords.x + x, coords.y + y);
    oldX = coords.x;
    oldY = coords.y;
  }

  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0)';
}

/**
 * 清除游戏区域
 */
export function clearGameBoard() {
  const radius = Math.min(GameGlobal.canvas.width, GameGlobal.canvas.height) / 2;
  drawPolygon(GameGlobal.canvas.width / 2, GameGlobal.canvas.height / 2, 6, radius, 30, gameVars.hexagonBackgroundColor, 0, 'rgba(0,0,0,0)');
}

/**
 * 绘制计时器
 */
export function drawTimer() {
  // 绘制计时器逻辑
}

/**
 * 绘制分数板
 */
export function drawScoreboard() {
  const ctx = GameGlobal.canvas.getContext('2d');
  ctx.save();
  ctx.font = `bold ${Math.min(50 * settings.scale, 40)}px Arial`;
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.fillText(gameVars.score, GameGlobal.canvas.width / 2, 80 * settings.scale);
  ctx.restore();
}

/**
 * 渲染文本
 */
function renderText(x, y, fontSize, color, text, font) {
  const ctx = GameGlobal.canvas.getContext('2d');
  ctx.save();
  
  try {
    if (!font) {
      font = 'px Arial';
    }
    fontSize = Math.min(fontSize * settings.scale, fontSize * 0.8);
    ctx.font = fontSize + font;
    ctx.textAlign = 'center';
    ctx.fillStyle = color;
    ctx.fillText(text, x, y + (fontSize / 2) - 9 * settings.scale);
  } catch (e) {
    console.log('渲染文本错误:', e);
    // 使用默认设置
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = color || '#000';
    ctx.fillText(text || '', x, y);
  }
  
  ctx.restore();
}

/**
 * 渲染开始文本
 */
export function renderBeginningText() {
  const upperheight = (GameGlobal.canvas.height / 2) - ((settings.rows * settings.blockHeight) * (2 / Math.sqrt(3))) * (5 / 6);
  const lowerheight = (GameGlobal.canvas.height / 2) + ((settings.rows * settings.blockHeight) * (2 / Math.sqrt(3))) * (11 / 16);
  
  const fontSize = Math.min(35 * settings.scale, 35);
  const input_text = 'Tap the screen\'s left and right';
  const action_text = 'sides to rotate the hexagon';
  const score_text = 'Match 3+ blocks to score';
  
  renderText(GameGlobal.canvas.width / 2 + 2 * settings.scale, upperheight - 0 * settings.scale, fontSize, '#2c3e50', input_text);
  renderText(GameGlobal.canvas.width / 2 + 2 * settings.scale, upperheight + 33 * settings.scale, fontSize, '#2c3e50', action_text);
  renderText(GameGlobal.canvas.width / 2 + 2 * settings.scale, lowerheight, fontSize, '#2c3e50', score_text);
}

/**
 * 主渲染函数 - 完全参考原版
 */
export function render() {
  const ctx = GameGlobal.canvas.getContext('2d');
  let grey = '#bdc3c7';
  
  if (gameVars.gameState === GAME_STATES.MENU) {
    grey = "rgb(220, 223, 225)";
  }
  
  // 清除画布
  ctx.clearRect(0, 0, GameGlobal.canvas.width, GameGlobal.canvas.height);
  
  // 清除游戏区域
  clearGameBoard();
  
  // 绘制游戏区域背景
  if (gameVars.gameState === GAME_STATES.PLAYING || gameVars.gameState === GAME_STATES.GAME_OVER || 
      gameVars.gameState === GAME_STATES.PAUSED) {
    if (gameVars.op < 1) {
      gameVars.op += 0.01;
    }
    ctx.globalAlpha = gameVars.op;
    
    const radius = (settings.rows * settings.blockHeight) * (2 / Math.sqrt(3)) + settings.hexWidth;
    drawPolygon(GameGlobal.canvas.width / 2, GameGlobal.canvas.height / 2, 6, radius, 30, grey, false, 6);
    
    drawTimer();
    ctx.globalAlpha = 1;
  }

  // 绘制六边形上的方块
  if (gameVars.MainHex) {
    for (let i = 0; i < gameVars.MainHex.blocks.length; i++) {
      for (let j = 0; j < gameVars.MainHex.blocks[i].length; j++) {
        const block = gameVars.MainHex.blocks[i][j];
        block.draw(true, j);
      }
    }
  }
  
  // 绘制下落的方块
  for (let i = 0; i < gameVars.blocks.length; i++) {
    gameVars.blocks[i].draw();
  }

  // 绘制中心六边形
  if (gameVars.MainHex) {
    gameVars.MainHex.draw();
  }
  
  // 绘制分数显示
  if (gameVars.gameState === GAME_STATES.PLAYING || gameVars.gameState === GAME_STATES.PAUSED) {
    ui.drawScore();
  }

  // 绘制文本效果
  if (gameVars.MainHex && gameVars.MainHex.texts) {
    try {
      for (let i = 0; i < gameVars.MainHex.texts.length; i++) {
        if (gameVars.MainHex.texts[i] && typeof gameVars.MainHex.texts[i].draw === 'function') {
          const alive = gameVars.MainHex.texts[i].draw();
          if (!alive) {
            gameVars.MainHex.texts.splice(i, 1);
            i--;
          }
        } else {
          // 移除无效的文本对象
          gameVars.MainHex.texts.splice(i, 1);
          i--;
        }
      }
    } catch (e) {
      console.log('文本渲染错误:', e);
      // 清空文本数组
      if (gameVars.MainHex) {
        gameVars.MainHex.texts = [];
      }
    }
  }

  // 绘制操作提示
  if (gameVars.gameState === GAME_STATES.PLAYING) {
    ui.drawControls();
  }

  // 绘制界面
  switch (gameVars.gameState) {
    case GAME_STATES.MENU:
      ui.drawStartScreen();
      break;
    case GAME_STATES.GAME_OVER:
      ui.drawGameOverScreen();
      break;
    case GAME_STATES.PAUSED:
      ui.drawPauseScreen();
      break;
  }

  // 在游戏开始后仍然更新教程透明度（用于渐变效果）
  if (gameVars.gameState === GAME_STATES.PLAYING && ui.tutorialFadeOut) {
    ui.updateTutorialAlpha();
    
    // 在游戏开始后仍然绘制标题和教程，直到它们完全消失
    if (ui.tutorialAlpha > 0) {
      ui.drawFadingElements();
    }
  }

  // 更新设置
  settings.prevScale = settings.scale;
  settings.hexWidth = settings.baseHexWidth * settings.scale;
  settings.blockHeight = settings.baseBlockHeight * settings.scale;
} 