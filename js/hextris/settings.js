/**
 * Hextris游戏设置和常量 - 完全参考原版
 */

// 获取屏幕信息
function getScreenInfo() {
  const systemInfo = wx.getSystemInfoSync();
  const screenWidth = systemInfo.screenWidth;
  const screenHeight = systemInfo.screenHeight;
  
  // 计算缩放比例，参考原始游戏的800px基准
  let scale;
  if (screenHeight > screenWidth) {
    scale = (screenWidth / 800) * 1.4; // 1.4是原始baseScale
  } else {
    scale = (screenHeight / 800) * 1.4;
  }
  
  return {
    screenWidth: screenWidth,
    screenHeight: screenHeight,
    designWidth: 800,
    designHeight: 800,
    scale: scale,
    scaleX: scale,
    scaleY: scale
  };
}

const screenInfo = getScreenInfo();

// 全局游戏变量
export const gameVars = {
  // 游戏状态
  gameState: 0, // MENU状态
  score: 0,
  prevScore: 0,
  scoreOpacity: 0,
  textOpacity: 0,
  op: 0,
  rush: 1,
  manualRush: 1, // 添加手动长按加速的独立变量
  startTime: 0,
  lastTime: 0,
  
  // 游戏对象
  MainHex: null,
  blocks: [],
  waveone: null,
  
  // 震动效果
  gdx: 0,
  gdy: 0,
  
  // 历史记录
  history: {},
  importedHistory: undefined,
  importing: 0,
  
  // 组合相关
  comboTime: 1,
  lastCombo: 0,
  lastColorScored: "#000",
  
  // 其他
  spawnLane: 0,
  tweetblock: false,
  infobuttonfading: true,
  playThrough: 0,
  
  // 最高分
  highscores: [],
  
  // 颜色相关
  colors: ["#8e44ad", "#f1c40f", "#3498db", "#d35400"],
  hexColorsToTintedColors: {
    "#8e44ad": "rgb(229,152,102)",
    "#f1c40f": "rgb(246,223,133)",
    "#3498db": "rgb(151,201,235)",
    "#d35400": "rgb(210,180,222)"
  },
  rgbToHex: {
    "rgb(142,68,173)": "#8e44ad",
    "rgb(241,196,15)": "#f1c40f",
    "rgb(52,152,219)": "#3498db",
    "rgb(211,84,0)": "#d35400"
  },
  rgbColorsToTintedColors: {
    "rgb(142,68,173)": "rgb(229,152,102)",
    "rgb(241,196,15)": "rgb(246,223,133)",
    "rgb(52,152,219)": "rgb(151,201,235)",
    "rgb(46,204,113)": "rgb(210,180,222)"
  },
  
  // 背景颜色
  hexagonBackgroundColor: 'rgb(44,62,80)',
  
  // 角度速度常量
  angularVelocityConst: 0.3,
  
  // 添加缺失的变量
  canRestart: false,
  lastRotate: 0
};

// 游戏设置
export const settings = {
  // 基础设置
  platform: 'mobile',
  os: 'android',
  ending_block: false,
  speedUpKeyHeld: false,
  
  // 缩放设置
  startDist: 227, // 原始基准值
  baseScale: 1.4, // 原始基准值
  scale: screenInfo.scale,
  prevScale: screenInfo.scale,
  
  // 六边形设置
  baseHexWidth: 87, // 原始基准值
  hexWidth: 87 * screenInfo.scale,
  
  // 方块设置
  baseBlockHeight: 20, // 原始基准值
  blockHeight: 20 * screenInfo.scale,
  
  // 游戏区域设置
  rows: 8, // 原始游戏mobile版本是7
  
  // 速度设置 - 完全参考原始游戏配置
  speedModifier: 0.73, // 原始mobile版本值
  creationSpeedModifier: 0.73, // 原始mobile版本值
  creationDt: 1000, // 原始值
  
  // 组合设置
  comboTime: 310 // 原始值
};

// 更新屏幕设置
export function updateScreenSettings() {
  const newScreenInfo = getScreenInfo();
  settings.scale = newScreenInfo.scale;
  settings.hexWidth = settings.baseHexWidth * settings.scale;
  settings.blockHeight = settings.baseBlockHeight * settings.scale;
}

// 随机整数生成
export function randInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

export function rotatePoint(x, y, theta) {
  const rad = theta * Math.PI / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return {
    x: x * cos - y * sin,
    y: x * sin + y * cos
  };
}

// 自适应工具函数
export function adaptSize(size) {
  return size * screenInfo.scale;
}

export function adaptPosition(x, y) {
  return {
    x: x * screenInfo.scaleX,
    y: y * screenInfo.scaleY
  };
} 