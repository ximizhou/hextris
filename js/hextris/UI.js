import { settings, gameVars } from './settings.js';

// 游戏状态常量
const GAME_STATES = {
  MENU: 0,
  PLAYING: 1,
  GAME_OVER: 2,
  PAUSED: -1
};

/**
 * UI管理器 - 完全参照原始Hextris设计
 */
export default class UI {
  constructor() {
    this.fontFamily = 'Exo, Arial, sans-serif';
    this.primaryColor = '#2c3e50';
    this.secondaryColor = '#34495e';
    this.textColor = '#ecf0f1';
    this.accentColor = '#3498db';
    
    // 教程透明度控制 - 按照原版方式
    this.tutorialAlpha = 1;
    this.tutorialFadeOut = false;
    
    // 分数透明度控制 - 按照原版方式
    this.textOpacity = 1;
    this.scoreOpacity = 1;
  }

  /**
   * 开始教程淡出动画
   */
  startTutorialFadeOut() {
    console.log('开始教程淡出动画');
    this.tutorialFadeOut = true;
  }

  /**
   * 更新教程透明度 - 按照原版方式
   */
  updateTutorialAlpha() {
    if (this.tutorialFadeOut && this.tutorialAlpha > 0) {
      // 按照原版方式，每帧减少0.01的透明度（比之前的0.02更慢）
      this.tutorialAlpha -= 0.01;
      
      // 添加调试信息
      if (Math.floor(this.tutorialAlpha * 100) % 10 === 0) { // 每10%输出一次
        console.log('渐变进度:', (1 - this.tutorialAlpha).toFixed(2), '透明度:', this.tutorialAlpha.toFixed(2));
      }
      
      // 确保透明度不会小于0
      if (this.tutorialAlpha <= 0) {
        this.tutorialAlpha = 0;
        this.tutorialFadeOut = false;
        console.log('渐变完成');
      }
    }
  }

  /**
   * 绘制渐变的标题和教程元素
   */
  drawFadingElements() {
    const ctx = GameGlobal.canvas.getContext('2d');
    const centerX = GameGlobal.canvas.width / 2;
    const centerY = GameGlobal.canvas.height / 2;

    // 绘制标题
    ctx.globalAlpha = this.tutorialAlpha;
    this.renderText(ctx, centerX + 6 * settings.scale, centerY - 155 * settings.scale, 150, "#ecf0f1", "Hextris");
    
    // 绘制教程区域
    this.drawTutorialSection(ctx, centerX, centerY);
    
    // 恢复透明度
    ctx.globalAlpha = 1;
  }

  /**
   * 绘制开始界面 - 完全参照原始Hextris设计
   */
  drawStartScreen() {
    const ctx = GameGlobal.canvas.getContext('2d');
    const centerX = GameGlobal.canvas.width / 2;
    const centerY = GameGlobal.canvas.height / 2;

    // 更新透明度动画
    if (this.textOpacity < 1) {
      this.textOpacity += 0.01;
    }

    // 绘制半透明背景
    ctx.fillStyle = this.backgroundColor;
    ctx.fillRect(0, 0, GameGlobal.canvas.width, GameGlobal.canvas.height);

    // 完全按照原始Hextris的drawScoreboard函数实现
    this.drawScoreboard(ctx, centerX, centerY);

    // 绘制开始提示
    this.drawStartHint(ctx, centerX, centerY);

    // 绘制教程区域（带渐变消失效果）
    this.drawTutorialSection(ctx, centerX, centerY);

    // 更新教程透明度
    this.updateTutorialAlpha();
  }

  /**
   * 绘制开始提示
   */
  drawStartHint(ctx, centerX, centerY) {
    // 创建脉冲动画效果
    const pulseAlpha = 0.8 + 0.2 * Math.sin(Date.now() * 0.003); // 提高基础透明度
    
    ctx.globalAlpha = pulseAlpha;
    ctx.fillStyle = this.textColor;
    ctx.font = `${Math.min(18 * settings.scale, 18)}px ${this.fontFamily}`; // 稍微增大字体
    ctx.textAlign = 'center';
    ctx.fillText('点击屏幕开始游戏', centerX, centerY + 50 * settings.scale);
    ctx.globalAlpha = 1;
  }

  /**
   * 绘制分数板 - 完全参照原始Hextris的drawScoreboard函数
   */
  drawScoreboard(ctx, centerX, centerY) {
    // 计算分数大小（参照原始逻辑）
    let scoreSize = 50;
    const scoreString = String(gameVars.score);
    if (scoreString.length == 6) {
      scoreSize = 43;
    } else if (scoreString.length == 7) {
      scoreSize = 35;
    } else if (scoreString.length == 8) {
      scoreSize = 31;
    } else if (scoreString.length == 9) {
      scoreSize = 27;
    }
    
    const color = "rgb(236, 240, 241)";
    const fontSize = settings.platform === 'mobile' ? 35 : 30;
    const h = centerY + 100 * settings.scale;
    
    if (gameVars.gameState === GAME_STATES.MENU) {
      // 绘制Hextris标题 - 使用教程透明度
      ctx.globalAlpha = this.tutorialAlpha;
      this.renderText(ctx, centerX + 6 * settings.scale, centerY - 155 * settings.scale, 150, "#ecf0f1", "Hextris");
    } else if (gameVars.gameState !== GAME_STATES.MENU && this.tutorialAlpha > 0) {
      // 使用教程透明度而不是textOpacity
      ctx.globalAlpha = this.tutorialAlpha;
      this.renderText(ctx, centerX + 6 * settings.scale, centerY - 155 * settings.scale, 150, "#ecf0f1", "Hextris");
      ctx.globalAlpha = this.scoreOpacity;
      this.renderText(ctx, centerX, centerY, scoreSize, color, gameVars.score);
    } else {
      ctx.globalAlpha = this.scoreOpacity;
      this.renderText(ctx, centerX, centerY, scoreSize, color, gameVars.score);
    }

    ctx.globalAlpha = 1;
  }

  /**
   * 渲染文本 - 完全参照原始Hextris的renderText函数
   */
  renderText(ctx, x, y, fontSize, color, text, font) {
    ctx.save();
    if (!font) {
      font = 'px Exo';
    }

    fontSize *= settings.scale;
    ctx.font = fontSize + font;
    ctx.textAlign = 'center';
    ctx.fillStyle = color;
    ctx.fillText(text, x, y + (fontSize / 2) - 9 * settings.scale);
    ctx.restore();
  }

  /**
   * 绘制教程区域
   */
  drawTutorialSection(ctx, centerX, centerY) {
    // 应用教程透明度
    ctx.globalAlpha = this.tutorialAlpha;
    
    // 绘制教程标题
    ctx.fillStyle = this.textColor;
    ctx.font = `bold ${Math.min(28 * settings.scale, 28)}px ${this.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.fillText('游戏操作', centerX, centerY + 220 * settings.scale); // 往下移

    // 绘制操作说明
    ctx.font = `${Math.min(20 * settings.scale, 20)}px ${this.fontFamily}`;
    ctx.fillStyle = this.textColor;
    ctx.fillText('点击左右两侧旋转六边形', centerX, centerY + 260 * settings.scale); // 往下移
    ctx.fillText('长按加速方块下落', centerX, centerY + 290 * settings.scale); // 往下移
    ctx.fillText('连接3个以上相同颜色方块消除', centerX, centerY + 320 * settings.scale); // 往下移

    // 恢复透明度
    ctx.globalAlpha = 1;
  }

  /**
   * 绘制游戏结束界面 - 简约高级设计
   */
  drawGameOverScreen() {
    const ctx = GameGlobal.canvas.getContext('2d');
    const centerX = GameGlobal.canvas.width / 2;
    const centerY = GameGlobal.canvas.height / 2;

    // 绘制深色背景
    ctx.fillStyle = 'rgba(52, 73, 94, 0.95)';
    ctx.fillRect(0, 0, GameGlobal.canvas.width, GameGlobal.canvas.height);

    // 绘制中央面板背景
    const panelWidth = Math.min(320 * settings.scale, 320);
    const panelHeight = Math.min(280 * settings.scale, 280);
    const panelX = centerX - panelWidth / 2;
    const panelY = centerY - panelHeight / 2;

    // 绘制面板背景（圆角矩形效果）
    ctx.fillStyle = 'rgba(236, 240, 241, 0.98)';
    this.drawRoundedRect(ctx, panelX, panelY, panelWidth, panelHeight, 8);

    // 绘制游戏结束标题
    ctx.fillStyle = '#2c3e50';
    ctx.font = `bold ${Math.min(28 * settings.scale, 28)}px ${this.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.fillText('游戏结束', centerX, panelY + 50 * settings.scale);

    // 绘制分数面板
    const scorePanelY = panelY + 80 * settings.scale;
    const scorePanelHeight = 100 * settings.scale;
    const scorePanelWidth = panelWidth - 40;

    // 绘制分数面板背景
    ctx.fillStyle = 'rgba(52, 73, 94, 0.05)';
    this.drawRoundedRect(ctx, panelX + 20, scorePanelY, scorePanelWidth, scorePanelHeight, 6);

    // 绘制当前分数（左侧）
    const leftScoreX = panelX + 40;
    ctx.fillStyle = '#7f8c8d';
    ctx.font = `${Math.min(14 * settings.scale, 14)}px ${this.fontFamily}`;
    ctx.textAlign = 'left';
    ctx.fillText('得分:', leftScoreX, scorePanelY + 25 * settings.scale);

    // 预留足够空间显示分数，支持大数字
    ctx.fillStyle = '#2c3e50';
    ctx.font = `bold ${Math.min(36 * settings.scale, 36)}px ${this.fontFamily}`;
    ctx.textAlign = 'left';
    const scoreText = gameVars.score.toString();
    ctx.fillText(scoreText, leftScoreX, scorePanelY + 65 * settings.scale);

    // 绘制分隔线
    ctx.strokeStyle = 'rgba(52, 73, 94, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX, scorePanelY + 15);
    ctx.lineTo(centerX, scorePanelY + scorePanelHeight - 15);
    ctx.stroke();

    // 绘制最高分（右侧）
    if (gameVars.highscores.length > 0) {
      const rightScoreX = centerX + 20;
      ctx.fillStyle = '#7f8c8d';
      ctx.font = `${Math.min(14 * settings.scale, 14)}px ${this.fontFamily}`;
      ctx.textAlign = 'left';
      ctx.fillText('高分', rightScoreX, scorePanelY + 25 * settings.scale);

      ctx.fillStyle = '#2c3e50';
      ctx.font = `bold ${Math.min(36 * settings.scale, 36)}px ${this.fontFamily}`;
      ctx.textAlign = 'left';
      const highScoreText = gameVars.highscores[0].toString();
      ctx.fillText(highScoreText, rightScoreX, scorePanelY + 65 * settings.scale);
    }

    // 绘制按钮区域
    const buttonY = scorePanelY + scorePanelHeight + 30 * settings.scale;
    const buttonHeight = 45 * settings.scale;
    const buttonSpacing = 15 * settings.scale;

    // 重新开始按钮
    const restartButtonY = buttonY;
    this.drawModernButton(ctx, centerX, restartButtonY, panelWidth - 40, buttonHeight, '点击屏幕重新开始', '#bdc3c7');

    // 排行榜按钮
    const leaderboardButtonY = buttonY + buttonHeight + buttonSpacing;
    this.drawModernButton(ctx, centerX, leaderboardButtonY, panelWidth - 40, buttonHeight, '排行榜', '#95a5a6');
  }

  /**
   * 绘制圆角矩形
   */
  drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * 绘制现代化按钮
   */
  drawModernButton(ctx, x, y, width, height, text, color) {
    // 绘制按钮背景
    ctx.fillStyle = color;
    this.drawRoundedRect(ctx, x - width / 2, y - height / 2, width, height, 6);

    // 绘制按钮文字
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.min(16 * settings.scale, 16)}px ${this.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.fillText(text, x, y + 5 * settings.scale);
  }

  /**
   * 绘制排行榜
   */
  drawLeaderboard(ctx, centerX, startY) {
    const maxScores = 5;
    const scoreHeight = 30 * settings.scale;

    // 绘制排行榜标题
    ctx.fillStyle = '#2c3e50';
    ctx.font = `bold ${Math.min(20 * settings.scale, 20)}px ${this.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.fillText('排行榜', centerX, startY);

    // 绘制排行榜项目
    ctx.font = `${Math.min(16 * settings.scale, 16)}px ${this.fontFamily}`;
    for (let i = 0; i < Math.min(maxScores, gameVars.highscores.length); i++) {
      const score = gameVars.highscores[i];
      const y = startY + 30 * settings.scale + i * scoreHeight;
      
      // 高亮当前分数
      if (score === gameVars.score) {
        ctx.fillStyle = '#3498db';
        ctx.font = `bold ${Math.min(16 * settings.scale, 16)}px ${this.fontFamily}`;
      } else {
        ctx.fillStyle = '#7f8c8d';
        ctx.font = `${Math.min(16 * settings.scale, 16)}px ${this.fontFamily}`;
      }
      
      ctx.textAlign = 'center';
      ctx.fillText(`${i + 1}. ${score}`, centerX, y);
    }
  }

  /**
   * 绘制暂停界面 - 简约高级设计
   */
  drawPauseScreen() {
    const ctx = GameGlobal.canvas.getContext('2d');
    const centerX = GameGlobal.canvas.width / 2;
    const centerY = GameGlobal.canvas.height / 2;

    // 绘制半透明背景
    ctx.fillStyle = 'rgba(52, 73, 94, 0.85)';
    ctx.fillRect(0, 0, GameGlobal.canvas.width, GameGlobal.canvas.height);

    // 绘制中央面板背景
    const panelWidth = Math.min(280 * settings.scale, 280);
    const panelHeight = Math.min(180 * settings.scale, 180);
    const panelX = centerX - panelWidth / 2;
    const panelY = centerY - panelHeight / 2;

    // 绘制面板背景（圆角矩形效果）
    ctx.fillStyle = 'rgba(236, 240, 241, 0.98)';
    this.drawRoundedRect(ctx, panelX, panelY, panelWidth, panelHeight, 8);

    // 绘制暂停标题
    ctx.fillStyle = '#2c3e50';
    ctx.font = `bold ${Math.min(24 * settings.scale, 24)}px ${this.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.fillText('游戏暂停', centerX, panelY + 50 * settings.scale);

    // 绘制当前分数
    ctx.fillStyle = '#7f8c8d';
    ctx.font = `${Math.min(16 * settings.scale, 16)}px ${this.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.fillText(`当前分数: ${gameVars.score}`, centerX, panelY + 90 * settings.scale);

    // 绘制继续按钮
    const buttonY = panelY + 130 * settings.scale;
    const buttonHeight = 40 * settings.scale;
    this.drawModernButton(ctx, centerX, buttonY, panelWidth - 40, buttonHeight, '点击屏幕继续游戏', '#27ae60');
  }

  /**
   * 绘制分数显示
   */
  drawScore() {
    const ctx = GameGlobal.canvas.getContext('2d');
    
    // 将分数显示位置往下调，去掉背景
    const scoreY = 80 * settings.scale; // 从20调整到80，位置往下调
    
    // 绘制分数（无背景）
    ctx.fillStyle = this.textColor;
    ctx.font = `bold ${Math.min(32 * settings.scale, 32)}px ${this.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.fillText(gameVars.score.toString(), GameGlobal.canvas.width / 2, scoreY + 10);
    
    // 保存分数点击区域信息，用于点击检测
    this.updateScoreClickArea(scoreY);
  }

  /**
   * 更新分数点击区域
   */
  updateScoreClickArea(scoreY) {
    this.scoreClickArea = {
      x: GameGlobal.canvas.width / 2 - 100 * settings.scale,
      y: scoreY - 20 * settings.scale,
      width: 200 * settings.scale,
      height: 60 * settings.scale
    };
    
    // 添加调试信息
    console.log('分数点击区域已更新:', this.scoreClickArea);
  }

  /**
   * 检查分数点击
   */
  checkScoreClick(x, y) {
    // 如果scoreClickArea不存在，则重新计算
    if (!this.scoreClickArea) {
      const scoreY = 80 * settings.scale;
      this.updateScoreClickArea(scoreY);
    }
    
    if (this.scoreClickArea && 
        x >= this.scoreClickArea.x && 
        x <= this.scoreClickArea.x + this.scoreClickArea.width &&
        y >= this.scoreClickArea.y && 
        y <= this.scoreClickArea.y + this.scoreClickArea.height) {
      console.log('分数点击检测成功:', x, y, this.scoreClickArea);
      return true;
    }
    
    // 添加调试信息
    console.log('分数点击检测失败:', x, y, this.scoreClickArea);
    return false;
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