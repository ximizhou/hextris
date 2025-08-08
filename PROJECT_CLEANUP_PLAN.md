# 项目清理计划（更新版）

## 分析结果

### 当前项目结构问题：
1. **混合了两个不同的游戏框架**：
   - Hextris游戏（主要使用的）
   - 另一个射击游戏框架（未使用的）

2. **未使用的文件和目录**：
   - `js/base/` - 基础类（sprite, animation, pool）
   - `js/npc/` - 敌人相关
   - `js/player/` - 玩家相关
   - `js/runtime/` - 运行时组件
   - `js/libs/` - 第三方库
   - `js/databus.js` - 数据总线（hextris未使用）
   - `images/Common.png` - 射击游戏图片
   - `images/bg.jpg` - 射击游戏背景
   - `audio/bgm.mp3` - 射击游戏音乐

3. **调试文档过多**：
   - 多个调试文档可以合并或删除

## 清理方案（更新版）

### 第一阶段：保留必要的目录结构
1. **保留目录但清空内容**：
   - `js/base/` - 保留目录，删除文件
   - `js/npc/` - 保留目录，删除文件
   - `js/player/` - 保留目录，删除文件
   - `js/runtime/` - 保留目录，删除文件
   - `js/libs/` - 保留目录，删除文件
   - `audio/` - 保留目录，删除文件

2. **删除未使用的文件**：
   - `js/databus.js`
   - `images/Common.png`
   - `images/bg.jpg`

### 第二阶段：整理文档
1. **保留重要文档**：
   - `README.md`
   - `FINAL_FIX.md`
   - `HEXTRIS_MIGRATION_SUMMARY.md`

2. **删除调试文档**：
   - `MAINHEX_DEBUG.md`
   - `RESTART_PAUSE_DEBUG.md`
   - `SIMPLE_CLICK_TEST.md`
   - `PAUSE_FIX_SUMMARY.md`
   - `DEBUG_CLICK_TEST.md`
   - `PROJECT_ISSUES_REPORT.md`

### 第三阶段：优化项目结构
1. **最终js目录结构**：
   ```
   js/
   ├── main.js          # 主入口
   ├── render.js        # Canvas初始化
   ├── config.js        # 配置
   ├── hextris/         # Hextris游戏核心
   │   ├── game.js
   │   ├── UI.js
   │   ├── render.js
   │   ├── settings.js
   │   ├── wavegen.js
   │   ├── Hex.js
   │   ├── Block.js
   │   ├── Text.js
   │   ├── checking.js
   │   └── update.js
   ├── base/            # 基础类（保留目录）
   ├── npc/             # NPC相关（保留目录）
   ├── player/          # 玩家相关（保留目录）
   ├── runtime/         # 运行时组件（保留目录）
   └── libs/            # 第三方库（保留目录）
   ```

2. **保留hextris-gh-pages**：
   - 作为参考和备份

3. **保留images/icons目录**：
   - 可能包含有用的图标资源

## 预期结果
- ✅ 项目结构更清晰
- ✅ 代码更简洁
- ✅ 保留必要的目录结构
- ✅ 便于未来扩展开发
- ✅ 提高维护性
