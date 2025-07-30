import { settings, gameVars } from './settings.js';
import Text, { fadeUpAndOut } from './Text.js';

/**
 * 搜索二维数组中是否包含一维数组
 */
function search(twoD, oneD) {
  for (let i = 0; i < twoD.length; i++) {
    if (twoD[i][0] === oneD[0] && twoD[i][1] === oneD[1]) {
      return true;
    }
  }
  return false;
}

/**
 * 洪水填充算法，用于查找相同颜色的相邻方块
 */
function floodFill(hex, side, index, deleting) {
  if (hex.blocks[side] === undefined || hex.blocks[side][index] === undefined) return;

  // 存储颜色
  const color = hex.blocks[side][index].color;
  
  // 嵌套循环遍历相邻方块
  for (let x = -1; x < 2; x++) {
    for (let y = -1; y < 2; y++) {
      // 确保不是对角线
      if (Math.abs(x) === Math.abs(y)) continue;
      
      // 计算要探索的边
      const curSide = (side + x + hex.sides) % hex.sides;
      // 计算索引
      const curIndex = index + y;
      
      // 确保方块存在
      if (hex.blocks[curSide] === undefined) continue;
      if (hex.blocks[curSide][curIndex] !== undefined) {
        // 检查颜色是否相同，是否已被探索，是否已被删除
        if (hex.blocks[curSide][curIndex].color === color && 
            !search(deleting, [curSide, curIndex]) && 
            hex.blocks[curSide][curIndex].deleted === 0) {
          // 添加到已探索数组
          deleting.push([curSide, curIndex]);
          // 递归探索下一个方块
          floodFill(hex, curSide, curIndex, deleting);
        }
      }
    }
  }
}

/**
 * 查找方块组的中心
 */
function findCenterOfBlocks(blocks) {
  let totalX = 0;
  let totalY = 0;
  
  for (const block of blocks) {
    const angle = block.angle * Math.PI / 180;
    totalX += Math.cos(angle) * block.distFromHex;
    totalY += Math.sin(angle) * block.distFromHex;
  }
  
  return {
    x: totalX / blocks.length,
    y: totalY / blocks.length
  };
}

/**
 * 合并方块，消除相同颜色的相邻方块 - 完全参考原版
 */
export function consolidateBlocks(hex, side, index) {
  // 记录哪些边发生了变化
  const sidesChanged = [];
  const deleting = [];
  const deletedBlocks = [];
  
  // 添加起始情况
  deleting.push([side, index]);
  
  // 填充删除数组
  floodFill(hex, side, index, deleting);
  
  // 确保有超过3个方块要删除
  if (deleting.length < 3) return;
  
  for (let i = 0; i < deleting.length; i++) {
    const arr = deleting[i];
    // 确保数组格式正确
    if (arr !== undefined && arr.length === 2) {
      // 添加到已改变的边
      if (sidesChanged.indexOf(arr[0]) === -1) {
        sidesChanged.push(arr[0]);
      }
      // 标记为已删除
      hex.blocks[arr[0]][arr[1]].deleted = 1;
      deletedBlocks.push(hex.blocks[arr[0]][arr[1]]);
    }
  }

  // 添加分数 - 完全参考原版
  const now = gameVars.MainHex.ct;
  if (now - hex.lastCombo < settings.comboTime) {
    settings.comboTime = (1 / settings.creationSpeedModifier) * (gameVars.waveone.nextGen / 16.666667) * 3;
    hex.comboMultiplier += 1;
    hex.lastCombo = now;
    const coords = findCenterOfBlocks(deletedBlocks);
    hex.texts.push(new Text(coords.x, coords.y, "x " + hex.comboMultiplier.toString(), "bold 20px Arial", "#fff", fadeUpAndOut));
  } else {
    settings.comboTime = 240;
    hex.lastCombo = now;
    hex.comboMultiplier = 1;
  }
  
  const adder = deleting.length * deleting.length * hex.comboMultiplier;
  hex.texts.push(new Text(hex.x, hex.y, "+ " + adder.toString(), "bold 20px Arial", deletedBlocks[0].color, fadeUpAndOut));
  hex.lastColorScored = deletedBlocks[0].color;
  
  // 更新全局分数
  gameVars.score += adder;
}

/**
 * 检查并处理方块消除
 */
export function checkAndConsolidateBlocks(hex, side, index) {
  consolidateBlocks(hex, side, index);
}

/**
 * 方块被销毁时的处理 - 完全参考原版
 */
export function blockDestroyed() {
  if (gameVars.waveone.nextGen > 1350) {
    gameVars.waveone.nextGen -= 30 * settings.creationSpeedModifier;
  } else if (gameVars.waveone.nextGen > 600) {
    gameVars.waveone.nextGen -= 8 * settings.creationSpeedModifier;
  } else {
    gameVars.waveone.nextGen = 600;
  }

  if (gameVars.waveone.difficulty < 35) {
    gameVars.waveone.difficulty += 0.085 * settings.speedModifier;
  } else {
    gameVars.waveone.difficulty = 35;
  }
} 