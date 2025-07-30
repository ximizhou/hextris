import { settings, gameVars } from './settings.js';

// 游戏状态常量
const GAME_STATES = {
  MENU: 0,
  PLAYING: 1,
  GAME_OVER: 2,
  PAUSED: -1
};

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
 * Hextris游戏中的方块类 - 完全参考原版
 */
export default class Block {
  constructor(fallingLane, color, iter, distFromHex, settled) {
    // 方块是否已经稳定在六边形上
    this.settled = (settled === undefined) ? 0 : 1;
    this.height = settings.blockHeight;
    
    // 方块从哪个方向落下
    this.fallingLane = fallingLane;
    this.checked = 0;
    
    // 方块的角度
    this.angle = 90 - (30 + 60 * fallingLane);
    this.angularVelocity = 0;
    this.targetAngle = this.angle;
    
    // 方块颜色
    this.color = color;
    
    // 方块状态
    this.deleted = 0;
    this.removed = 0;
    this.tint = 0;
    this.opacity = 1;
    this.initializing = 1;
    this.ict = gameVars.MainHex ? gameVars.MainHex.ct : 0;
    
    // 方块速度
    this.iter = iter;
    this.initLen = settings.creationDt;
    
    // 方块位置
    this.attachedLane = 0;
    this.distFromHex = distFromHex || settings.startDist * settings.scale;
    
    // 方块尺寸
    this.width = 0;
    this.widthWide = 0;
  }

  /**
   * 更新方块透明度
   */
  incrementOpacity() {
    if (this.deleted) {
      // 添加震动效果
      if (this.opacity >= 0.925) {
        if (gameVars.MainHex) {
          let tLane = this.attachedLane - gameVars.MainHex.position;
          tLane = gameVars.MainHex.sides - tLane;
          while (tLane < 0) {
            tLane += gameVars.MainHex.sides;
          }
          tLane %= gameVars.MainHex.sides;
          gameVars.MainHex.shakes.push({lane: tLane, magnitude: 3 * settings.scale});
        }
      }
      // 淡出透明度
      this.opacity = this.opacity - 0.075 * (gameVars.MainHex ? gameVars.MainHex.dt : 1);
      if (this.opacity <= 0) {
        this.opacity = 0;
        this.deleted = 2;
      }
    }
  }

  /**
   * 获取方块在堆栈中的索引
   */
  getIndex() {
    if (!gameVars.MainHex) return 0;
    const parentArr = gameVars.MainHex.blocks[this.attachedLane];
    for (let i = 0; i < parentArr.length; i++) {
      if (parentArr[i] === this) {
        return i;
      }
    }
    return 0;
  }

  /**
   * 绘制方块 - 完全参考原版
   */
  draw(attached, index) {
    this.height = settings.blockHeight;
    
    // 处理缩放变化
    if (Math.abs(settings.scale - settings.prevScale) > 0.000000001) {
      this.distFromHex *= (settings.scale / settings.prevScale);
    }

    this.incrementOpacity();
    
    if (attached === undefined) {
      attached = false;
    }

    // 更新角度
    if (this.angle > this.targetAngle) {
      this.angularVelocity -= gameVars.angularVelocityConst * (gameVars.MainHex ? gameVars.MainHex.dt : 1);
    } else if (this.angle < this.targetAngle) {
      this.angularVelocity += gameVars.angularVelocityConst * (gameVars.MainHex ? gameVars.MainHex.dt : 1);
    }

    if (Math.abs(this.angle - this.targetAngle + this.angularVelocity) <= Math.abs(this.angularVelocity)) {
      this.angle = this.targetAngle;
      this.angularVelocity = 0;
    } else {
      this.angle += this.angularVelocity;
    }
    
    // 计算方块宽度
    this.width = 2 * this.distFromHex / Math.sqrt(3);
    this.widthWide = 2 * (this.distFromHex + this.height) / Math.sqrt(3);

    // 计算方块顶点
    let p1, p2, p3, p4;
    if (this.initializing) {
      const rat = ((gameVars.MainHex ? gameVars.MainHex.ct : 0) - this.ict) / this.initLen;
      const finalRat = Math.min(rat, 1);
      p1 = rotatePoint((-this.width / 2) * finalRat, this.height / 2, this.angle);
      p2 = rotatePoint((this.width / 2) * finalRat, this.height / 2, this.angle);
      p3 = rotatePoint((this.widthWide / 2) * finalRat, -this.height / 2, this.angle);
      p4 = rotatePoint((-this.widthWide / 2) * finalRat, -this.height / 2, this.angle);
      if ((gameVars.MainHex ? gameVars.MainHex.ct : 0) - this.ict >= this.initLen) {
        this.initializing = 0;
      }
    } else {
      p1 = rotatePoint(-this.width / 2, this.height / 2, this.angle);
      p2 = rotatePoint(this.width / 2, this.height / 2, this.angle);
      p3 = rotatePoint(this.widthWide / 2, -this.height / 2, this.angle);
      p4 = rotatePoint(-this.widthWide / 2, -this.height / 2, this.angle);
    }

    // 绘制方块
    const ctx = GameGlobal.canvas.getContext('2d');
    
    // 设置颜色
    if (this.deleted) {
      ctx.fillStyle = "#FFF";
    } else if (gameVars.gameState === GAME_STATES.MENU || gameVars.gameState === GAME_STATES.PAUSED) {
      if (this.color.charAt(0) === 'r') {
        ctx.fillStyle = gameVars.rgbColorsToTintedColors[this.color] || this.color;
      } else {
        ctx.fillStyle = gameVars.hexColorsToTintedColors[this.color] || this.color;
      }
    } else {
      ctx.fillStyle = this.color;
    }

    ctx.globalAlpha = this.opacity;
    
    // 计算基础位置
    const baseX = GameGlobal.canvas.width / 2 + Math.sin((this.angle) * (Math.PI / 180)) * (this.distFromHex + this.height / 2) + gameVars.gdx;
    const baseY = GameGlobal.canvas.height / 2 - Math.cos((this.angle) * (Math.PI / 180)) * (this.distFromHex + this.height / 2) + gameVars.gdy;
    
    // 绘制方块主体
    ctx.beginPath();
    ctx.moveTo(baseX + p1.x, baseY + p1.y);
    ctx.lineTo(baseX + p2.x, baseY + p2.y);
    ctx.lineTo(baseX + p3.x, baseY + p3.y);
    ctx.lineTo(baseX + p4.x, baseY + p4.y);
    ctx.closePath();
    ctx.fill();

    // 绘制发光效果
    if (this.tint) {
      if (this.opacity < 1) {
        this.iter = 2.25;
        this.tint = 0;
      }

      ctx.fillStyle = "#FFF";
      ctx.globalAlpha = this.tint;
      ctx.beginPath();
      ctx.moveTo(baseX + p1.x, baseY + p1.y);
      ctx.lineTo(baseX + p2.x, baseY + p2.y);
      ctx.lineTo(baseX + p3.x, baseY + p3.y);
      ctx.lineTo(baseX + p4.x, baseY + p4.y);
      ctx.closePath();
      ctx.fill();
      
      this.tint -= 0.02 * (gameVars.MainHex ? gameVars.MainHex.dt : 1);
      if (this.tint < 0) {
        this.tint = 0;
      }
    }

    ctx.globalAlpha = 1;
  }

  /**
   * 更新方块逻辑
   */
  update(dt = 16.6667) {
    if (!this.settled) {
      if (!this.initializing) {
        this.distFromHex -= this.iter * dt * settings.scale;
      }
    }
  }

  /**
   * 将十六进制颜色转换为RGB
   */
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [0, 0, 0];
  }
} 