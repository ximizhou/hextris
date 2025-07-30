import { settings, gameVars, randInt } from './settings.js';
import Block from './Block.js';

/**
 * 方块生成器类 - 完全参考原版
 */
export default class waveGen {
  constructor(hex) {
    this.lastGen = 0;
    this.last = 0;
    this.nextGen = 2700; // 原始游戏值
    this.start = 0;
    this.colors = gameVars.colors;
    this.ct = 0;
    this.hex = hex;
    this.difficulty = 1;
    this.dt = 0;
    this.prevTimeScored = 0;
    
    // 设置当前生成函数
    this.currentFunction = this.randomGeneration.bind(this);
  }

  /**
   * 更新生成器
   */
  update() {
    this.currentFunction();
    this.dt = (settings.platform === 'mobile' ? 14 : 16.6667) * gameVars.MainHex.ct;
    this.computeDifficulty();
    
    // 根据难度调整生成速度 - 原始逻辑
    if ((this.dt - this.lastGen) * settings.creationSpeedModifier > this.nextGen) {
      if (this.nextGen > 600) {
        this.nextGen -= 11 * ((this.nextGen / 1300)) * settings.creationSpeedModifier;
      }
    }
  }

  /**
   * 随机生成方块
   */
  randomGeneration() {
    if (this.dt - this.lastGen > this.nextGen) {
      this.ct++;
      this.lastGen = this.dt;
      
      const fv = randInt(0, gameVars.MainHex.sides);
      const color = this.colors[randInt(0, this.colors.length)];
      const iter = 1.6 + (this.difficulty / 15) * 3;
      
      this.addNewBlock(fv, color, iter);
      
      const lim = 5;
      if (this.ct > lim) {
        const nextPattern = randInt(0, 3 + 21);
        if (nextPattern > 15) {
          this.ct = 0;
          this.currentFunction = this.doubleGeneration.bind(this);
        } else if (nextPattern > 10) {
          this.ct = 0;
          this.currentFunction = this.crosswiseGeneration.bind(this);
        } else if (nextPattern > 7) {
          this.ct = 0;
          this.currentFunction = this.spiralGeneration.bind(this);
        } else if (nextPattern > 4) {
          this.ct = 0;
          this.currentFunction = this.circleGeneration.bind(this);
        } else if (nextPattern > 1) {
          this.ct = 0;
          this.currentFunction = this.halfCircleGeneration.bind(this);
        }
      }
    }
  }

  /**
   * 计算难度 - 完全参考原版
   */
  computeDifficulty() {
    if (this.difficulty < 35) {
      let increment;
      if (this.difficulty < 8) {
        increment = (this.dt - this.last) / (5166667) * settings.speedModifier;
      } else if (this.difficulty < 15) {
        increment = (this.dt - this.last) / (72333333) * settings.speedModifier;
      } else {
        increment = (this.dt - this.last) / (90000000) * settings.speedModifier;
      }

      this.difficulty += increment * (1/2);
      this.last = this.dt;
    }
  }

  /**
   * 圆形生成模式 - 完全参考原版
   */
  circleGeneration() {
    if (this.dt - this.lastGen > this.nextGen + 500) {
      let numColors = randInt(1, 4);
      if (numColors == 3) {
        numColors = randInt(1, 4);
      }

      const colorList = [];
      nextLoop: for (let i = 0; i < numColors; i++) {
        const q = randInt(0, this.colors.length);
        for (let j in colorList) {
          if (colorList[j] == this.colors[q]) {
            i--;
            continue nextLoop;
          }
        }
        colorList.push(this.colors[q]);
      }

      for (let i = 0; i < gameVars.MainHex.sides; i++) {
        const iter = 1.5 + (this.difficulty / 15) * 3;
        this.addNewBlock(i, colorList[i % colorList.length], iter);
      }

      this.ct += 15;
      this.lastGen = this.dt;
      this.shouldChangePattern(1);
    }
  }

  /**
   * 半圆生成模式 - 完全参考原版
   */
  halfCircleGeneration() {
    if (this.dt - this.lastGen > (this.nextGen + 500) / 2) {
      const numColors = randInt(1, 3);
      const c = this.colors[randInt(0, this.colors.length)];
      let colorList = [c, c, c];
      if (numColors == 2) {
        colorList = [c, this.colors[randInt(0, this.colors.length)], c];
      }

      const d = randInt(0, 6);
      for (let i = 0; i < 3; i++) {
        const iter = 1.5 + (this.difficulty / 15) * 3;
        this.addNewBlock((d + i) % 6, colorList[i], iter);
      }

      this.ct += 8;
      this.lastGen = this.dt;
      this.shouldChangePattern();
    }
  }

  /**
   * 交叉生成模式 - 完全参考原版
   */
  crosswiseGeneration() {
    if (this.dt - this.lastGen > this.nextGen) {
      const ri = randInt(0, this.colors.length);
      const i = randInt(0, this.colors.length);
      const iter = 0.6 + (this.difficulty / 15) * 3;
      this.addNewBlock(i, this.colors[ri], iter);
      this.addNewBlock((i + 3) % gameVars.MainHex.sides, this.colors[ri], iter);
      this.ct += 1.5;
      this.lastGen = this.dt;
      this.shouldChangePattern();
    }
  }

  /**
   * 螺旋生成模式 - 完全参考原版
   */
  spiralGeneration() {
    const dir = randInt(0, 2);
    if (this.dt - this.lastGen > this.nextGen * (2 / 3)) {
      const color = this.colors[randInt(0, this.colors.length)];
      const iter = 1.5 + (this.difficulty / 15) * (3 / 2);
      if (dir) {
        this.addNewBlock(5 - (this.ct % gameVars.MainHex.sides), color, iter);
      } else {
        this.addNewBlock(this.ct % gameVars.MainHex.sides, color, iter);
      }
      this.ct += 1;
      this.lastGen = this.dt;
      this.shouldChangePattern();
    }
  }

  /**
   * 双重生成模式 - 完全参考原版
   */
  doubleGeneration() {
    if (this.dt - this.lastGen > this.nextGen) {
      const i = randInt(0, this.colors.length);
      const iter = 1.5 + (this.difficulty / 15) * 3;
      this.addNewBlock(i, this.colors[randInt(0, this.colors.length)], iter);
      this.addNewBlock((i + 1) % gameVars.MainHex.sides, this.colors[randInt(0, this.colors.length)], iter);
      this.ct += 2;
      this.lastGen = this.dt;
      this.shouldChangePattern();
    }
  }

  /**
   * 添加新方块
   */
  addNewBlock(fallingLane, color, iter) {
    const block = new Block(fallingLane, color, iter);
    gameVars.blocks.push(block);
  }

  /**
   * 设置随机生成模式
   */
  setRandom() {
    this.ct = 0;
    this.currentFunction = this.randomGeneration.bind(this);
  }

  /**
   * 检查是否应该改变生成模式 - 完全参考原版
   */
  shouldChangePattern(x) {
    if (x) {
      const q = randInt(0, 4);
      this.ct = 0;
      switch (q) {
        case 0:
          this.currentFunction = this.doubleGeneration.bind(this);
          break;
        case 1:
          this.currentFunction = this.spiralGeneration.bind(this);
          break;
        case 2:
          this.currentFunction = this.crosswiseGeneration.bind(this);
          break;
      }
    } else if (this.ct > 8) {
      if (randInt(0, 2) === 0) {
        this.setRandom();
        return 1;
      }
    }
    return 0;
  }
} 