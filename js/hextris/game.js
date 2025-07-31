import { 
  settings, gameVars, updateScreenSettings
} from './settings.js';
import Text from './Text.js';
import Hex from './Hex.js';
import waveGen from './wavegen.js';
import { render } from './render.js';
import { update } from './update.js';
import { checkAndConsolidateBlocks } from './checking.js';

// 游戏状态常量
const GAME_STATES = {
  MENU: 0,
  PLAYING: 1,
  GAME_OVER: 2,
  PAUSED: -1
};

/**
 * Hextris游戏主类 - 完全参考原版
 */
export default class HextrisGame {
  constructor() {
    this.aniId = null;
    this.spd = 1;
    this.autoSpeedUpStarted = false; // 自动加速是否已开始
    this.autoSpeedUpStartTime = 0; // 自动加速开始时间
    this.autoSpeedUpActive = false; // 自动加速是否激活
    this.manualSpeedUp = false; // 是否手动长按加速
    
    // 初始化canvas尺寸
    this.initCanvas();
    
    // 更新屏幕设置
    updateScreenSettings();
    
    // 初始化游戏
    this.init();
  }

  /**
   * 初始化canvas尺寸
   */
  initCanvas() {
    // 获取系统信息
    let systemInfo;
    try {
      if (wx.getSystemInfoSync) {
        systemInfo = wx.getSystemInfoSync();
      } else {
        systemInfo = { screenWidth: 375, screenHeight: 667 }; // 默认值
      }
    } catch (e) {
      console.log('获取系统信息失败:', e);
      systemInfo = { screenWidth: 375, screenHeight: 667 }; // 默认值
    }
    
    // 设置canvas尺寸为屏幕尺寸
    GameGlobal.canvas.width = systemInfo.screenWidth;
    GameGlobal.canvas.height = systemInfo.screenHeight;
    
    console.log('Canvas尺寸已设置为:', GameGlobal.canvas.width, 'x', GameGlobal.canvas.height);
  }

  /**
   * 初始化游戏 - 完全参考原版
   */
  init(b = false) {
    if (settings.ending_block && b == 1) return;
    
    if (b) {
      // 隐藏帮助按钮
      this.clearSaveState();
    }
    
    // 设置最高分
    if (gameVars.highscores.length === 0) {
      // 设置最高分为0
    } else {
      // 设置当前最高分
    }
    
    gameVars.infobuttonfading = true;
    this.hideUIElements();
    
    // 获取保存状态
    let saveState = '{}';
    try {
      if (wx.getStorageSync) {
        saveState = wx.getStorageSync('saveState') || '{}';
      }
    } catch (e) {
      console.log('读取保存状态失败:', e);
      saveState = '{}';
    }
    const parsedSaveState = JSON.parse(saveState);
    
    // 重置游戏状态
    gameVars.history = {};
    gameVars.importedHistory = undefined;
    gameVars.importing = 0;
    gameVars.score = parsedSaveState.score || 0;
    gameVars.prevScore = 0;
    gameVars.spawnLane = 0;
    gameVars.op = 0;
    gameVars.tweetblock = false;
    gameVars.scoreOpacity = 0;
    gameVars.gameState = GAME_STATES.PLAYING;
    gameVars.rush = 1; // 添加rush变量
    gameVars.manualRush = 1; // 重置手动加速变量
    gameVars.lastTime = Date.now(); // 初始化lastTime
    
    // 更新设置
    settings.blockHeight = settings.baseBlockHeight * settings.scale;
    settings.hexWidth = settings.baseHexWidth * settings.scale;
    
    // 创建或恢复六边形
    gameVars.MainHex = parsedSaveState.hex || new Hex(settings.hexWidth);
    if (parsedSaveState.hex) {
      gameVars.MainHex.playThrough += 1;
    }
    gameVars.MainHex.sideLength = settings.hexWidth;

    // 处理保存的方块
    if (parsedSaveState.blocks) {
      parsedSaveState.blocks.map(function(o) {
        if (gameVars.rgbToHex[o.color]) {
          o.color = gameVars.rgbToHex[o.color];
        }
      });

      for (let i = 0; i < parsedSaveState.blocks.length; i++) {
        const block = parsedSaveState.blocks[i];
        gameVars.blocks.push(block);
      }
    } else {
      gameVars.blocks = [];
    }

    gameVars.gdx = parsedSaveState.gdx || 0;
    gameVars.gdy = parsedSaveState.gdy || 0;
    gameVars.comboTime = parsedSaveState.comboTime || 0;

    // 更新六边形上的方块
    for (let i = 0; i < gameVars.MainHex.blocks.length; i++) {
      for (let j = 0; j < gameVars.MainHex.blocks[i].length; j++) {
        gameVars.MainHex.blocks[i][j].height = settings.blockHeight;
        gameVars.MainHex.blocks[i][j].settled = 0;
      }
    }

    gameVars.MainHex.blocks.map(function(i) {
      i.map(function(o) {
        if (gameVars.rgbToHex[o.color]) {
          o.color = gameVars.rgbToHex[o.color];
        }
      });
    });

    gameVars.MainHex.y = -100;

    gameVars.startTime = Date.now();
    // 总是创建新的waveGen对象，确保每次重新开始都使用初始状态
    gameVars.waveone = new waveGen(gameVars.MainHex);

    gameVars.MainHex.texts = []; // 清空文本
    gameVars.MainHex.delay = 0; // 移除延迟，立即开始游戏
    this.hideText();
    
    // 初始化输入处理
    this.initInput();
    
    // 确保分数点击区域被正确初始化
    if (gameVars.UI && typeof gameVars.UI.updateScoreClickArea === 'function') {
      const scoreY = 80 * settings.scale;
      gameVars.UI.updateScoreClickArea(scoreY);
      console.log('init: 初始化分数点击区域');
    }
  }

  /**
   * 初始化输入处理 - 优化微信小游戏兼容性
   */
  initInput() {
    let longPressTimer = null;
    let isLongPressing = false;
    let pressX = 0, pressY = 0;
    let pressStartTime = 0;
    let hasTriggeredLongPress = false; // 添加标志，防止重复触发
    let isMouseEvent = false; // 添加标志，区分鼠标事件和触摸事件

    try {
      // 优先使用微信小游戏API
      if (wx && wx.onTouchStart) {
        console.log('使用微信小游戏触摸API');
        
        wx.onTouchStart((e) => {
          isMouseEvent = false; // 标记为触摸事件
          const touch = e.touches[0];
          // 微信小游戏API的坐标需要从clientX/clientY获取
          pressX = touch.clientX;
          pressY = touch.clientY;
          pressStartTime = Date.now();
          isLongPressing = false;
          hasTriggeredLongPress = false; // 重置长按触发标志
          
          longPressTimer = setTimeout(() => {
            // 额外的保护：确保没有触发过点击事件
            if (gameVars.MainHex && gameVars.gameState === GAME_STATES.PLAYING && !hasTriggeredLongPress && !isMouseEvent) {
              // 再次检查是否已经处理过点击事件
              const currentTime = Date.now();
              const pressDuration = currentTime - pressStartTime;
              
              // 如果按下时间已经超过300ms，说明可能已经处理过点击事件，不再触发长按
              if (pressDuration >= 300) {
                isLongPressing = true;
                hasTriggeredLongPress = true; // 标记已触发长按
                this.manualSpeedUp = true; // 标记为手动长按
                if (!settings.speedUpKeyHeld) {
                  settings.speedUpKeyHeld = true;
                  gameVars.manualRush = 4; // 手动长按加速4倍
                  console.log('手动长按加速开启（手动加速：' + gameVars.manualRush + '倍）');
                }
              }
            }
          }, 300);
        });

        wx.onTouchEnd((e) => {
          if (isMouseEvent) return; // 如果是鼠标事件，忽略触摸结束
          
          const pressDuration = Date.now() - pressStartTime;
          
          if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
          }
          
          // 先处理长按结束逻辑
          if (isLongPressing) {
            isLongPressing = false;
            this.manualSpeedUp = false; // 重置手动长按标志
            if (settings.speedUpKeyHeld) {
              gameVars.manualRush = 1; // 重置手动长按加速
              settings.speedUpKeyHeld = false;
              console.log('手动长按加速关闭（手动加速：' + gameVars.manualRush + '倍）');
            }
          }
          
          // 再处理点击事件，确保没有触发过长按
          if (pressDuration < 300 && !hasTriggeredLongPress) {
            this.handleClickTap(pressX, pressY);
          }
        });

        wx.onTouchMove((e) => {
          // 可以在这里添加移动检测
        });
      }

      // Canvas事件作为备用（主要用于开发调试）
      if (GameGlobal.canvas && typeof GameGlobal.canvas.addEventListener === 'function') {
        console.log('使用Canvas事件作为备用');
        
        GameGlobal.canvas.addEventListener('touchstart', (e) => {
          isMouseEvent = false; // 标记为触摸事件
          e.preventDefault();
          const touch = e.touches[0];
          // 直接使用clientX/clientY，不需要getBoundingClientRect
          const x = touch.clientX;
          const y = touch.clientY;
          
          pressX = x;
          pressY = y;
          pressStartTime = Date.now();
          isLongPressing = false;
          hasTriggeredLongPress = false; // 重置长按触发标志
          
          longPressTimer = setTimeout(() => {
            // 额外的保护：确保没有触发过点击事件
            if (gameVars.MainHex && gameVars.gameState === GAME_STATES.PLAYING && !hasTriggeredLongPress && !isMouseEvent) {
              // 再次检查是否已经处理过点击事件
              const currentTime = Date.now();
              const pressDuration = currentTime - pressStartTime;
              
              // 如果按下时间已经超过300ms，说明可能已经处理过点击事件，不再触发长按
              if (pressDuration >= 300) {
                isLongPressing = true;
                hasTriggeredLongPress = true; // 标记已触发长按
                this.manualSpeedUp = true; // 标记为手动长按
                if (!settings.speedUpKeyHeld) {
                  settings.speedUpKeyHeld = true;
                  gameVars.manualRush = 4; // 手动长按加速4倍
                  console.log('手动长按加速开启（手动加速：' + gameVars.manualRush + '倍）');
                }
              }
            }
          }, 300);
        });

        GameGlobal.canvas.addEventListener('touchend', (e) => {
          if (isMouseEvent) return; // 如果是鼠标事件，忽略触摸结束
          
          const pressDuration = Date.now() - pressStartTime;
          
          if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
          }
          
          // 先处理长按结束逻辑
          if (isLongPressing) {
            isLongPressing = false;
            this.manualSpeedUp = false; // 重置手动长按标志
            if (settings.speedUpKeyHeld) {
              gameVars.manualRush = 1; // 重置手动长按加速
              settings.speedUpKeyHeld = false;
              console.log('手动长按加速关闭（手动加速：' + gameVars.manualRush + '倍）');
            }
          }
          
          // 再处理点击事件，确保没有触发过长按
          if (pressDuration < 300 && !hasTriggeredLongPress) {
            console.log('Canvas触发点击事件:', pressX, pressY);
            this.handleClickTap(pressX, pressY);
          }
        });

        // 鼠标事件（开发调试用）
        GameGlobal.canvas.addEventListener('mousedown', (e) => {
          isMouseEvent = true; // 标记为鼠标事件
          // 直接使用clientX/clientY，与其他事件保持一致
          const x = e.clientX;
          const y = e.clientY;
          
          pressX = x;
          pressY = y;
          pressStartTime = Date.now();
          isLongPressing = false;
          hasTriggeredLongPress = false; // 重置长按触发标志
          
          longPressTimer = setTimeout(() => {
            if (gameVars.MainHex && gameVars.gameState === GAME_STATES.PLAYING && !hasTriggeredLongPress && isMouseEvent) {
              isLongPressing = true;
              hasTriggeredLongPress = true; // 标记已触发长按
              this.manualSpeedUp = true; // 标记为手动长按
              if (!settings.speedUpKeyHeld) {
                settings.speedUpKeyHeld = true;
                gameVars.manualRush = 4; // 手动长按加速4倍
                console.log('鼠标长按加速开启（手动加速：' + gameVars.manualRush + '倍）');
              }
            }
          }, 300);
        });

        GameGlobal.canvas.addEventListener('mouseup', (e) => {
          if (!isMouseEvent) return; // 如果不是鼠标事件，忽略鼠标抬起
          
          const pressDuration = Date.now() - pressStartTime;
          
          if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
          }
          
          // 先处理长按结束逻辑
          if (isLongPressing) {
            isLongPressing = false;
            this.manualSpeedUp = false; // 重置手动长按标志
            if (settings.speedUpKeyHeld) {
              gameVars.manualRush = 1; // 重置手动长按加速
              settings.speedUpKeyHeld = false;
              console.log('鼠标长按加速关闭（手动加速：' + gameVars.manualRush + '倍）');
            }
          }
          
          // 再处理点击事件，确保没有触发过长按
          if (pressDuration < 300 && !hasTriggeredLongPress) {
            console.log('鼠标触发点击事件:', pressX, pressY);
            this.handleClickTap(pressX, pressY);
          }
        });
      }

      // 添加全局触摸事件监听（兼容性处理）
      if (typeof window !== 'undefined' && window.addEventListener) {
        console.log('添加全局触摸事件监听');
        
        window.addEventListener('touchstart', (e) => {
          if (e.target === GameGlobal.canvas) {
            isMouseEvent = false; // 标记为触摸事件
            const touch = e.touches[0];
            pressX = touch.clientX;
            pressY = touch.clientY;
            pressStartTime = Date.now();
            isLongPressing = false;
            hasTriggeredLongPress = false; // 重置长按触发标志
            
            longPressTimer = setTimeout(() => {
              if (gameVars.MainHex && gameVars.gameState === GAME_STATES.PLAYING && !hasTriggeredLongPress && !isMouseEvent) {
                isLongPressing = true;
                hasTriggeredLongPress = true; // 标记已触发长按
                this.manualSpeedUp = true; // 标记为手动长按
                if (!settings.speedUpKeyHeld) {
                  settings.speedUpKeyHeld = true;
                  gameVars.manualRush = 4; // 手动长按加速4倍
                  console.log('全局长按加速开启（手动加速：' + gameVars.manualRush + '倍）');
                }
              }
            }, 300);
          }
        });

        window.addEventListener('touchend', (e) => {
          if (e.target === GameGlobal.canvas && !isMouseEvent) {
            const pressDuration = Date.now() - pressStartTime;
            
            if (longPressTimer) {
              clearTimeout(longPressTimer);
              longPressTimer = null;
            }
            
            // 先处理长按结束逻辑
            if (isLongPressing) {
              isLongPressing = false;
              this.manualSpeedUp = false; // 重置手动长按标志
              if (settings.speedUpKeyHeld) {
                gameVars.manualRush = 1; // 重置手动长按加速
                settings.speedUpKeyHeld = false;
                console.log('全局长按加速关闭（手动加速：' + gameVars.manualRush + '倍）');
              }
            }
            
            // 再处理点击事件，确保没有触发过长按
            if (pressDuration < 300 && !hasTriggeredLongPress) {
              console.log('全局触发点击事件:', pressX, pressY);
              this.handleClickTap(pressX, pressY);
            }
          }
        });
      }
    } catch (e) {
      console.log('输入初始化失败:', e);
    }
  }

  /**
   * 处理点击/触摸 - 参考原版
   */
  handleClickTap(x, y) {
    if (!gameVars.MainHex) return;

    // 在菜单状态下点击开始游戏
    if (gameVars.gameState === GAME_STATES.MENU) {
      console.log('开始游戏');
      
      // 立即开始游戏
      this.resumeGame();
      
      // 触发教程淡出动画（游戏已经开始，标题和教程逐渐消失）
      if (gameVars.UI && typeof gameVars.UI.startTutorialFadeOut === 'function') {
        gameVars.UI.startTutorialFadeOut();
      }
      
      // 重置触摸状态，防止后续触摸事件干扰
      this.resetTouchState();
      
      return;
    }

    // 在游戏结束状态下点击重新开始
    if (gameVars.gameState === GAME_STATES.GAME_OVER) {
      console.log('重新开始游戏');
      this.init();
      return;
    }

    // 在暂停状态下点击继续游戏
    if (gameVars.gameState === GAME_STATES.PAUSED) {
      console.log('继续游戏');
      this.resumeGame();
      return;
    }

    // 在游戏状态下根据点击位置旋转六边形 - 参考原版逻辑
    if (gameVars.gameState === GAME_STATES.PLAYING) {
      console.log('游戏进行中，检查分数点击:', x, y);
      
      // 检查是否点击了分数区域
      if (gameVars.UI && typeof gameVars.UI.checkScoreClick === 'function') {
        const isScoreClick = gameVars.UI.checkScoreClick(x, y);
        console.log('分数点击检测结果:', isScoreClick);
        
        if (isScoreClick) {
          console.log('点击分数，暂停游戏');
          this.pause();
          return;
        }
      } else {
        console.log('UI.checkScoreClick方法不存在');
      }
      
      const centerX = GameGlobal.canvas.width / 2;
      
      if (x < centerX) {
        // 左侧点击 - 向右旋转（顺时针）
        gameVars.MainHex.rotate(1);
      } else {
        // 右侧点击 - 向左旋转（逆时针）
        gameVars.MainHex.rotate(-1);
      }
    }
  }

  /**
   * 重置触摸状态
   */
  resetTouchState() {
    // 重置所有触摸相关的状态变量
    if (typeof window !== 'undefined') {
      // 清除可能存在的定时器
      if (window.longPressTimer) {
        clearTimeout(window.longPressTimer);
        window.longPressTimer = null;
      }
      
      // 重置触摸状态
      window.isLongPressing = false;
      window.hasTriggeredLongPress = false;
      window.isMouseEvent = false;
      window.pressStartTime = 0;
      window.pressX = 0;
      window.pressY = 0;
    }
  }

  /**
   * 隐藏UI元素
   */
  hideUIElements() {
    // 隐藏UI元素
  }

  /**
   * 隐藏文本
   */
  hideText() {
    // 隐藏文本
  }

  /**
   * 清除保存状态
   */
  clearSaveState() {
    try {
      if (wx.removeStorageSync) {
        wx.removeStorageSync('saveState');
      }
    } catch (e) {
      console.log('清除保存状态失败:', e);
    }
  }

  /**
   * 暂停游戏
   */
  pause() {
    if (gameVars.gameState === GAME_STATES.PLAYING) {
      gameVars.gameState = GAME_STATES.PAUSED;
    } else if (gameVars.gameState === GAME_STATES.PAUSED) {
      gameVars.gameState = GAME_STATES.PLAYING;
    }
  }

  /**
   * 恢复游戏
   */
  resumeGame() {
    gameVars.gameState = GAME_STATES.PLAYING;
    this.hideUIElements();
    gameVars.importing = 0;
    gameVars.startTime = Date.now();
    
    // 重置自动加速相关变量
    this.autoSpeedUpStarted = false;
    this.autoSpeedUpStartTime = 0;
    this.autoSpeedUpActive = false;
    this.manualSpeedUp = false;
    
    // 强制重置加速状态，防止加速残留
    if (settings.speedUpKeyHeld) {
      settings.speedUpKeyHeld = false;
      gameVars.manualRush = 1; // 重置手动加速变量
      console.log('强制重置加速状态');
    }
    
    // 确保分数点击区域被正确初始化
    if (gameVars.UI && typeof gameVars.UI.updateScoreClickArea === 'function') {
      const scoreY = 80 * settings.scale;
      gameVars.UI.updateScoreClickArea(scoreY);
      console.log('resumeGame: 初始化分数点击区域');
    }
  }

  /**
   * 检查游戏结束 - 完全参考原版
   */
  checkGameOver() {
    return this.isInfringing(gameVars.MainHex);
  }

  /**
   * 检查是否违反游戏规则 - 完全参考原版
   */
  isInfringing(hex) {
    for (let i = 0; i < hex.sides; i++) {
      let subTotal = 0;
      for (let j = 0; j < hex.blocks[i].length; j++) {
        subTotal += hex.blocks[i][j].deleted;
      }

      if (hex.blocks[i].length - subTotal > settings.rows) {
        return true;
      }
    }
    return false;
  }

  /**
   * 游戏结束处理
   */
  gameOver() {
    gameVars.gameState = GAME_STATES.GAME_OVER;
    
    // 强制重置加速状态，防止加速残留
    if (settings.speedUpKeyHeld) {
      settings.speedUpKeyHeld = false;
      gameVars.manualRush = 1; // 重置手动加速变量
      console.log('游戏结束时强制重置加速状态');
    }
    
    // 保存最高分
    if (gameVars.score > (gameVars.highscores[0] || 0)) {
      gameVars.highscores.unshift(gameVars.score);
      gameVars.highscores = gameVars.highscores.slice(0, 10); // 只保留前10名
      try {
        if (wx.setStorageSync) {
          wx.setStorageSync('hextris_high_scores', JSON.stringify(gameVars.highscores));
        }
      } catch (e) {
        console.log('保存最高分失败:', e);
      }
    }
    
    // 清除保存状态
    this.clearSaveState();
    
    // 显示游戏结束界面
    setTimeout(() => {
      this.showGameOver();
    }, 150);
  }

  /**
   * 显示游戏结束界面
   */
  showGameOver() {
    // 在微信小游戏中，我们可以使用console.log来显示游戏结束信息
    console.log(`游戏结束！得分: ${gameVars.score}, 最高分: ${gameVars.highscores[0] || 0}`);
    
    // 不再自动重新开始，等待用户主动点击
    // 游戏状态已经设置为GAME_OVER，UI会显示结束界面
  }

  /**
   * 设置开始界面
   */
  setStartScreen() {
    // 不调用this.init()，避免重置UI状态
    // this.init();
    gameVars.gameState = GAME_STATES.MENU;
    this.animLoop();
  }

  /**
   * 添加新方块
   */
  addNewBlock(blocklane, color, iter, distFromHex, settled) {
    iter *= settings.speedModifier;
    if (!gameVars.history[gameVars.MainHex.ct]) {
      gameVars.history[gameVars.MainHex.ct] = {};
    }

    gameVars.history[gameVars.MainHex.ct].block = {
      blocklane: blocklane,
      color: color,
      iter: iter
    };

    if (distFromHex) {
      gameVars.history[gameVars.MainHex.ct].distFromHex = distFromHex;
    }
    if (settled) {
      gameVars.history[gameVars.MainHex.ct].settled = settled;
    }
    
    const Block = require('./Block.js').default;
    gameVars.blocks.push(new Block(blocklane, color, iter, distFromHex, settled));
  }

  /**
   * 动画循环 - 完全参考原版
   */
  animLoop() {
    switch (gameVars.gameState) {
      case GAME_STATES.PLAYING:
        this.aniId = requestAnimationFrame(this.animLoop.bind(this));
        render();
        const now = Date.now();
        const dt = (now - gameVars.lastTime) / 16.666 * gameVars.rush * gameVars.manualRush; // 使用两个独立的加速变量
        if (this.spd > 1) {
          dt *= this.spd;
        }

        // 前5秒自动长按加速效果
        /*
        if (!this.autoSpeedUpStarted) {
          this.autoSpeedUpStarted = true;
          this.autoSpeedUpStartTime = now;
        }
        
        const gameTime = now - this.autoSpeedUpStartTime;
        if (gameTime < 2000) { // 前3秒
          // 自动启用长按加速效果（与手动长按叠加）
          if (!this.autoSpeedUpActive) {
            this.autoSpeedUpActive = true;
            gameVars.rush *= 4;
            console.log('自动加速开启');
          }
        } else {
          // 3秒后自动加速停止
          if (this.autoSpeedUpActive) {
            this.autoSpeedUpActive = false;
            gameVars.rush /= 4;
            console.log('自动加速关闭');
          }
        }
        */

        if (gameVars.gameState == GAME_STATES.PLAYING) {
          update(dt);
        }

        gameVars.lastTime = now;

        if (this.checkGameOver() && !gameVars.importing) {
          this.gameOver();
        }
        break;

      case GAME_STATES.MENU:
        this.aniId = requestAnimationFrame(this.animLoop.bind(this));
        render();
        break;

      case GAME_STATES.GAME_OVER:
        this.aniId = requestAnimationFrame(this.animLoop.bind(this));
        render();
        break;

      case GAME_STATES.PAUSED:
        // 暂停状态下只渲染UI，不更新游戏逻辑
        this.aniId = requestAnimationFrame(this.animLoop.bind(this));
        render();
        // 不调用update，真正暂停游戏逻辑
        break;
    }
  }

  /**
   * 开始游戏
   */
  start() {
    this.setStartScreen();
  }
} 