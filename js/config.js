/**
 * 游戏配置文件
 */
export const CONFIG = {
  // 调试模式开关
  DEBUG: false,
  
  // 是否显示调试信息
  SHOW_DEBUG_INFO: false,
  
  // 是否启用性能监控
  ENABLE_PERFORMANCE_MONITOR: false,
  
  // 游戏版本
  VERSION: '1.0.0',
  
  // 是否启用错误报告
  ENABLE_ERROR_REPORTING: false
};

/**
 * 调试日志函数
 */
export function debugLog(...args) {
  if (CONFIG.DEBUG && CONFIG.SHOW_DEBUG_INFO) {
    console.log(...args);
  }
}

/**
 * 错误日志函数
 */
export function errorLog(...args) {
  if (CONFIG.ENABLE_ERROR_REPORTING) {
    console.error(...args);
  }
}
