import { settings, gameVars } from './settings.js';
import { checkAndConsolidateBlocks, blockDestroyed } from './checking.js';

/**
 * 更新函数 - 完全参考原版
 */
export function update(dt) {
  gameVars.MainHex.dt = dt;
  
  if (gameVars.gameState == 1) {
    gameVars.waveone.update();
    if (gameVars.MainHex.ct - gameVars.waveone.prevTimeScored > 1000) {
      gameVars.waveone.prevTimeScored = gameVars.MainHex.ct;
    }
  }
  
  let lowestDeletedIndex = 99;
  let i, j, block;

  // 更新下落的方块
  for (i = 0; i < gameVars.blocks.length; i++) {
    gameVars.MainHex.doesBlockCollide(gameVars.blocks[i]);
    if (!gameVars.blocks[i].settled) {
      if (!gameVars.blocks[i].initializing) {
        gameVars.blocks[i].distFromHex -= gameVars.blocks[i].iter * dt * settings.scale;
      }
    } else if (!gameVars.blocks[i].removed) {
      gameVars.blocks[i].removed = 1;
    }
  }

  // 检查并合并方块
  for (i = 0; i < gameVars.MainHex.blocks.length; i++) {
    for (j = 0; j < gameVars.MainHex.blocks[i].length; j++) {
      if (gameVars.MainHex.blocks[i][j].checked == 1) {
        checkAndConsolidateBlocks(gameVars.MainHex, i, j);
        gameVars.MainHex.blocks[i][j].checked = 0;
      }
    }
  }

  // 处理已删除的方块
  for (i = 0; i < gameVars.MainHex.blocks.length; i++) {
    lowestDeletedIndex = 99;
    for (j = 0; j < gameVars.MainHex.blocks[i].length; j++) {
      block = gameVars.MainHex.blocks[i][j];
      if (block.deleted == 2) {
        gameVars.MainHex.blocks[i].splice(j, 1);
        blockDestroyed();
        if (j < lowestDeletedIndex) lowestDeletedIndex = j;
        j--;
      }
    }

    // 重新设置上方方块的稳定状态
    if (lowestDeletedIndex < gameVars.MainHex.blocks[i].length) {
      for (j = lowestDeletedIndex; j < gameVars.MainHex.blocks[i].length; j++) {
        gameVars.MainHex.blocks[i][j].settled = 0;
      }
    }
  }

  // 更新六边形上的方块
  for (i = 0; i < gameVars.MainHex.blocks.length; i++) {
    for (j = 0; j < gameVars.MainHex.blocks[i].length; j++) {
      block = gameVars.MainHex.blocks[i][j];
      gameVars.MainHex.doesBlockCollide(block, j, gameVars.MainHex.blocks[i]);

      if (!gameVars.MainHex.blocks[i][j].settled) {
        gameVars.MainHex.blocks[i][j].distFromHex -= block.iter * dt * settings.scale;
      }
    }
  }

  // 移除已处理的方块
  for (i = 0; i < gameVars.blocks.length; i++) {
    if (gameVars.blocks[i].removed == 1) {
      gameVars.blocks.splice(i, 1);
      i--;
    }
  }

  gameVars.MainHex.ct += dt;
} 