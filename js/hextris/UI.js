import { settings, gameVars } from './settings.js';

// 游戏状态常量
const GAME_STATES = {
  MENU: 0,
  PLAYING: 1,
  GAME_OVER: 2,
  PAUSED: -1
};

/**
 * 美观的中文UI管理器
 */
export default class UI {
  constructor() {
    this.fontFamily = 'Arial, sans-serif';
    this.primaryColor = '#2c3e50';
    this.secondaryColor = '#3498db';
    this.accentColor = '#e74c3c';
    this.textColor = '#ecf0f1';
    this.backgroundColor = 'rgba(44, 62, 80, 0.9)';
  }

  /**
   * 绘制开始界面
   */
  drawStartScreen() {
    const ctx = GameGlobal.canvas.getContext('2d');
    const centerX = GameGlobal.canvas.width / 2;
    const centerY = GameGlobal.canvas.height / 2;

    // 绘制半透明背景
    ctx.fillStyle = this.backgroundColor;
    ctx.fillRect(0, 0, GameGlobal.canvas.width, GameGlobal.canvas.height);

    // 绘制标题
    ctx.fillStyle = this.textColor;
    ctx.font = `bold ${Math.min(60 * settings.scale, 60)}px ${this.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.fillText('Hextris', centerX, centerY - 100);

    // 绘制副标题
    ctx.font = `${Math.min(24 * settings.scale, 24)}px ${this.fontFamily}`;
    ctx.fillStyle = this.secondaryColor;
    ctx.fillText('点击屏幕开始游戏', centerX, centerY - 40);

    // 绘制操作说明
    ctx.font = `${Math.min(18 * settings.scale, 18)}px ${this.fontFamily}`;
    ctx.fillStyle = this.textColor;
    ctx.fillText('点击左右两侧旋转六边形', centerX, centerY + 20);
    ctx.fillText('长按加速方块下落', centerX, centerY + 50);
    ctx.fillText('连接3个以上相同颜色方块消除', centerX, centerY + 80);

    // 绘制最高分
    if (gameVars.highscores.length > 0) {
      ctx.font = `${Math.min(20 * settings.scale, 20)}px ${this.fontFamily}`;
      ctx.fillStyle = this.accentColor;
      ctx.fillText(`最高分: ${gameVars.highscores[0]}`, centerX, centerY + 120);
    }
  }

  /**
   * 绘制游戏结束界面
   */
  drawGameOverScreen() {
    const ctx = GameGlobal.canvas.getContext('2d');
    const centerX = GameGlobal.canvas.width / 2;
    const centerY = GameGlobal.canvas.height / 2;

    // 绘制半透明背景
    ctx.fillStyle = this.backgroundColor;
    ctx.fillRect(0, 0, GameGlobal.canvas.width, GameGlobal.canvas.height);

    // 绘制游戏结束标题
    ctx.fillStyle = this.accentColor;
    ctx.font = `bold ${Math.min(50 * settings.scale, 50)}px ${this.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.fillText('游戏结束', centerX, centerY - 150);

    // 绘制当前分数
    ctx.fillStyle = this.textColor;
    ctx.font = `bold ${Math.min(40 * settings.scale, 40)}px ${this.fontFamily}`;
    ctx.fillText(`得分: ${gameVars.score}`, centerX, centerY - 80);

    // 绘制最高分
    if (gameVars.highscores.length > 0) {
      ctx.font = `${Math.min(24 * settings.scale, 24)}px ${this.fontFamily}`;
      ctx.fillStyle = this.secondaryColor;
      ctx.fillText(`最高分: ${gameVars.highscores[0]}`, centerX, centerY - 40);
    }

    // 绘制重新开始提示
    ctx.font = `${Math.min(20 * settings.scale, 20)}px ${this.fontFamily}`;
    ctx.fillStyle = this.textColor;
    ctx.fillText('点击屏幕重新开始', centerX, centerY + 20);

    // 绘制排行榜
    if (gameVars.highscores.length > 0) {
      ctx.font = `bold ${Math.min(22 * settings.scale, 22)}px ${this.fontFamily}`;
      ctx.fillStyle = this.accentColor;
      ctx.fillText('排行榜', centerX, centerY + 60);

      ctx.font = `${Math.min(18 * settings.scale, 18)}px ${this.fontFamily}`;
      ctx.fillStyle = this.textColor;
      for (let i = 0; i < Math.min(5, gameVars.highscores.length); i++) {
        const score = gameVars.highscores[i];
        const y = centerY + 90 + i * 25;
        ctx.fillText(`${i + 1}. ${score}`, centerX, y);
      }
    }

    // 绘制操作说明
    ctx.font = `${Math.min(16 * settings.scale, 16)}px ${this.fontFamily}`;
    ctx.fillStyle = this.secondaryColor;
    ctx.fillText('点击屏幕任意位置重新开始游戏', centerX, centerY + 200);
  }

  /**
   * 绘制暂停界面
   */
  drawPauseScreen() {
    const ctx = GameGlobal.canvas.getContext('2d');
    const centerX = GameGlobal.canvas.width / 2;
    const centerY = GameGlobal.canvas.height / 2;

    // 绘制半透明背景
    ctx.fillStyle = 'rgba(44, 62, 80, 0.7)';
    ctx.fillRect(0, 0, GameGlobal.canvas.width, GameGlobal.canvas.height);

    // 绘制暂停标题
    ctx.fillStyle = this.textColor;
    ctx.font = `bold ${Math.min(40 * settings.scale, 40)}px ${this.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.fillText('游戏暂停', centerX, centerY - 50);

    // 绘制当前分数
    ctx.font = `${Math.min(24 * settings.scale, 24)}px ${this.fontFamily}`;
    ctx.fillStyle = this.secondaryColor;
    ctx.fillText(`当前分数: ${gameVars.score}`, centerX, centerY);

    // 绘制继续提示
    ctx.font = `${Math.min(20 * settings.scale, 20)}px ${this.fontFamily}`;
    ctx.fillStyle = this.textColor;
    ctx.fillText('点击屏幕继续游戏', centerX, centerY + 50);
  }

  /**
   * 绘制分数显示
   */
  drawScore() {
    const ctx = GameGlobal.canvas.getContext('2d');
    
    // 绘制分数背景
    const scoreWidth = 200 * settings.scale;
    const scoreHeight = 60 * settings.scale;
    const scoreX = (GameGlobal.canvas.width - scoreWidth) / 2;
    const scoreY = 20 * settings.scale;

    ctx.fillStyle = 'rgba(44, 62, 80, 0.8)';
    ctx.fillRect(scoreX, scoreY, scoreWidth, scoreHeight);

    // 绘制分数
    ctx.fillStyle = this.textColor;
    ctx.font = `bold ${Math.min(32 * settings.scale, 32)}px ${this.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.fillText(gameVars.score.toString(), GameGlobal.canvas.width / 2, scoreY + scoreHeight / 2 + 10);
  }

  /**
   * 绘制操作提示
   */
  drawControls() {
    const ctx = GameGlobal.canvas.getContext('2d');
    
    // 只在游戏开始时显示短暂的操作提示
    if (gameVars.MainHex && gameVars.MainHex.ct < 3000 && gameVars.gameState === GAME_STATES.PLAYING) {
      const alpha = Math.max(0, 1 - (gameVars.MainHex.ct / 3000));
      ctx.globalAlpha = alpha;
      
      ctx.fillStyle = this.textColor;
      ctx.font = `${Math.min(16 * settings.scale, 16)}px ${this.fontFamily}`;
      ctx.textAlign = 'center';
      
      // 左侧提示
      ctx.fillText('← 向左旋转', 100 * settings.scale, GameGlobal.canvas.height - 50);
      
      // 右侧提示
      ctx.fillText('向右旋转 →', GameGlobal.canvas.width - 100 * settings.scale, GameGlobal.canvas.height - 50);
      
      // 长按提示
      ctx.fillText('长按加速', GameGlobal.canvas.width / 2, GameGlobal.canvas.height - 50);
      
      ctx.globalAlpha = 1;
    }
  }

  /**
   * 绘制组合提示
   */
  drawCombo(combo, x, y) {
    const ctx = GameGlobal.canvas.getContext('2d');
    
    ctx.fillStyle = this.accentColor;
    ctx.font = `bold ${Math.min(24 * settings.scale, 24)}px ${this.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.fillText(`连击 x${combo}`, x, y);
  }
} 