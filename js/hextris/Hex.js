import { settings, gameVars } from './settings.js';
import { drawPolygon } from './render.js';

// 游戏状态常量
const GAME_STATES = {
  MENU: 0,
  PLAYING: 1,
  GAME_OVER: 2,
  PAUSED: -1
};

/**
 * Hextris游戏中的中心六边形类 - 完全参考原版
 */
export default class Hex {
  constructor(sideLength) {
    this.playThrough = 0;
    this.fillColor = [44, 62, 80];
    this.tempColor = [44, 62, 80];
    this.angularVelocity = 0;
    this.position = 0;
    this.dy = 0;
    this.dt = 1;
    this.sides = 6;
    this.blocks = [];
    this.angle = 180 / this.sides;
    this.targetAngle = this.angle;
    this.shakes = [];
    this.sideLength = sideLength;
    this.strokeColor = 'blue';
    this.x = GameGlobal.canvas ? GameGlobal.canvas.width / 2 : 400;
    this.y = GameGlobal.canvas ? GameGlobal.canvas.height / 2 : 400;
    this.ct = 0;
    this.lastCombo = this.ct - settings.comboTime;
    this.lastColorScored = "#000";
    this.comboTime = 1;
    this.comboMultiplier = 1;
    this.texts = []; // 确保texts数组正确初始化
    this.lastRotate = Date.now();
    this.delay = 0;
    
    // 初始化六个方向的方块数组
    for (let i = 0; i < this.sides; i++) {
      this.blocks.push([]);
    }
  }

  /**
   * 添加方块到六边形
   */
  addBlock(block) {
    if (!(gameVars.gameState === 1 || gameVars.gameState === 0)) return;
    
    block.settled = 1;
    block.tint = 0.6;
    
    let lane = this.sides - block.fallingLane;
    this.shakes.push({
      lane: block.fallingLane, 
      magnitude: 4.5 * settings.scale
    });
    
    lane += this.position;
    lane = (lane + this.sides) % this.sides;
    
    block.distFromHex = this.sideLength / 2 * Math.sqrt(3) + block.height * this.blocks[lane].length;
    this.blocks[lane].push(block);
    block.attachedLane = lane;
    block.checked = 1;
  }

  /**
   * 检测方块碰撞 - 完全参考原版
   */
  doesBlockCollide(block, position, tArr) {
    if (block.settled) {
      return;
    }

    if (position !== undefined) {
      const arr = tArr;
      if (position <= 0) {
        if (block.distFromHex - block.iter * this.dt * settings.scale - (this.sideLength / 2) * Math.sqrt(3) <= 0) {
          block.distFromHex = (this.sideLength / 2) * Math.sqrt(3);
          block.settled = 1;
          block.checked = 1;
        } else {
          block.settled = 0;
          block.iter = 1.5 + (gameVars.waveone.difficulty / 15) * 3;
        }
      } else {
        if (arr[position - 1].settled && block.distFromHex - block.iter * this.dt * settings.scale - arr[position - 1].distFromHex - arr[position - 1].height <= 0) {
          block.distFromHex = arr[position - 1].distFromHex + arr[position - 1].height;
          block.settled = 1;
          block.checked = 1;
        } else {
          block.settled = 0;
          block.iter = 1.5 + (gameVars.waveone.difficulty / 15) * 3;
        }
      }
    } else {
      let lane = this.sides - block.fallingLane;
      lane += this.position;
      lane = (lane + this.sides) % this.sides;
      const arr = this.blocks[lane];

      if (arr.length > 0) {
        if (block.distFromHex + block.iter * this.dt * settings.scale - arr[arr.length - 1].distFromHex - arr[arr.length - 1].height <= 0) {
          block.distFromHex = arr[arr.length - 1].distFromHex + arr[arr.length - 1].height;
          this.addBlock(block);
        }
      } else {
        if (block.distFromHex + block.iter * this.dt * settings.scale - (this.sideLength / 2) * Math.sqrt(3) <= 0) {
          block.distFromHex = (this.sideLength / 2) * Math.sqrt(3);
          this.addBlock(block);
        }
      }
    }
  }

  /**
   * 旋转六边形 - 完全参考原版
   */
  rotate(direction) {
    const now = Date.now();
    if (now - this.lastRotate < 75) return;
    
    this.lastRotate = now;
    
    if (!(gameVars.gameState === GAME_STATES.PLAYING || gameVars.gameState === GAME_STATES.PAUSED)) return;
    
    this.position += direction;
    this.position = (this.position + this.sides) % this.sides;
    
    // 更新所有方块的目标角度
    this.blocks.forEach(function(blocks) {
      blocks.forEach(function(block) {
        block.targetAngle = block.targetAngle - direction * 60;
      });
    });

    this.targetAngle = this.targetAngle - direction * 60;
  }

  /**
   * 震动效果
   */
  shake(obj) {
    const angle = 30 + obj.lane * 60;
    const angleRad = angle * Math.PI / 180;
    const dx = Math.cos(angleRad) * obj.magnitude;
    const dy = Math.sin(angleRad) * obj.magnitude;
    gameVars.gdx -= dx;
    gameVars.gdy += dy;
    obj.magnitude /= 2 * (this.dt + 0.5);
    if (obj.magnitude < 1) {
      for (let i = 0; i < this.shakes.length; i++) {
        if (this.shakes[i] === obj) {
          this.shakes.splice(i, 1);
        }
      }
    }
  }

  /**
   * 绘制六边形 - 完全参考原版
   */
  draw() {
    this.x = GameGlobal.canvas.width / 2;
    this.y = GameGlobal.canvas.height / 2;
    this.sideLength = settings.hexWidth;
    
    gameVars.gdx = 0;
    gameVars.gdy = 0;
    
    // 处理震动效果
    for (let i = 0; i < this.shakes.length; i++) {
      this.shake(this.shakes[i]);
    }
    
    // 更新角度
    if (this.angle > this.targetAngle) {
      this.angularVelocity -= gameVars.angularVelocityConst * this.dt;
    } else if (this.angle < this.targetAngle) {
      this.angularVelocity += gameVars.angularVelocityConst * this.dt;
    }

    if (Math.abs(this.angle - this.targetAngle + this.angularVelocity) <= Math.abs(this.angularVelocity)) {
      this.angle = this.targetAngle;
      this.angularVelocity = 0;
    } else {
      this.angle += this.angularVelocity;
    }
    
    // 绘制六边形
    drawPolygon(this.x + gameVars.gdx, this.y + gameVars.gdy + this.dy, this.sides, this.sideLength, this.angle, this.arrayToColor(this.fillColor), 0, 'rgba(0,0,0,0)');
  }

  /**
   * 将数组转换为颜色字符串
   */
  arrayToColor(arr) {
    return 'rgb(' + arr[0] + ',' + arr[1] + ',' + arr[2] + ')';
  }

  /**
   * 获取方块在堆栈中的索引
   */
  getBlockIndex(block) {
    const parentArr = this.blocks[block.attachedLane];
    for (let i = 0; i < parentArr.length; i++) {
      if (parentArr[i] === block) {
        return i;
      }
    }
    return -1;
  }

  /**
   * 获取方块在堆栈中的索引（用于Block类）
   */
  getIndex() {
    return this.getBlockIndex(this);
  }
} 