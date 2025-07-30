import { adaptSize, adaptPosition } from './settings.js';
import { settings } from './settings.js';

/**
 * 文本效果类
 */
export default class Text {
  constructor(x, y, text, font, color, animation) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.font = font;
    this.color = color;
    this.animation = animation;
    this.opacity = 1;
    this.life = 60; // 60帧的生命周期
    this.ct = 0;
  }

  /**
   * 绘制文本
   */
  draw() {
    const ctx = GameGlobal.canvas.getContext('2d');
    ctx.save();
    
    // 简化的字体处理
    let fontSize = 16; // 默认字体大小
    let fontFamily = 'Arial'; // 默认字体
    let fontWeight = 'normal'; // 默认字重
    
    try {
      if (this.font && typeof this.font === 'string') {
        // 检查是否包含 "bold"
        if (this.font.includes('bold')) {
          fontWeight = 'bold';
        }
        
        // 提取数字（字体大小）
        const sizeMatch = this.font.match(/\d+/);
        if (sizeMatch && sizeMatch[0]) {
          fontSize = Math.min(parseInt(sizeMatch[0]) * settings.scale, 30);
        }
        
        // 提取字体名称
        if (this.font.includes('Arial')) {
          fontFamily = 'Arial';
        } else if (this.font.includes('Q')) {
          fontFamily = 'Arial'; // 将Q替换为Arial
        } else {
          fontFamily = 'Arial'; // 默认使用Arial
        }
      }
    } catch (e) {
      console.log('字体处理错误:', e);
      fontSize = 16;
      fontFamily = 'Arial';
      fontWeight = 'normal';
    }
    
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = this.color;
    ctx.globalAlpha = this.opacity;
    ctx.textAlign = 'center';
    
    ctx.fillText(this.text, this.x, this.y);
    
    ctx.restore();
    
    // 更新动画
    if (this.animation) {
      this.animation(this);
    }
    
    this.ct++;
    return this.ct < this.life;
  }
}

/**
 * 淡出动画
 */
export function fadeUpAndOut(text) {
  text.y -= 1;
  text.opacity = 1 - (text.ct / text.life);
} 