import './render'; // 初始化Canvas
import HextrisGame from './hextris/game'; // 导入hextris游戏类

const ctx = GameGlobal.canvas.getContext('2d'); // 获取canvas的2D绘图上下文

/**
 * 游戏主函数
 */
export default class Main {
  constructor() {
    // 创建hextris游戏实例并开始游戏
    this.hextrisGame = new HextrisGame();
    this.hextrisGame.start();
  }
}
