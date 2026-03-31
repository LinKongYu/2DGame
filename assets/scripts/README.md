# 2D等距视角模拟经营游戏 - 基础Demo

## 项目结构

```
assets/
├── scripts/
│   ├── GridManager.ts        # 网格管理器 - 等距坐标转换和网格渲染
│   ├── PlaceableItem.ts      # 可放置物品基类
│   ├── PlacementSystem.ts    # 放置系统 - 处理物品创建和放置
│   ├── GameController.ts     # 游戏控制器
│   ├── SceneSetup.ts         # 场景自动设置
│   ├── PrefabManager.ts      # 预制体管理器
│   ├── SimpleItemFactory.ts  # 简单物品工厂（程序生成图形）
│   ├── CameraController.ts   # 相机控制器（键盘移动、滚轮缩放）
│   └── EditorBridge.ts       # 编辑器桥接
└── scenes/
    └── MainScene.scene       # 主场景
```

## 使用方法

### 1. 创建场景

在Cocos Creator中：
1. 右键 `assets/scenes` → 新建 → 场景
2. 命名为 `MainScene`
3. 在层级管理器中选择 `Canvas` 节点
4. 在属性检查器中点击 `添加组件` → `自定义脚本` → `SceneSetup`

或者直接挂载 `SceneSetup` 脚本到场景的根节点上，它会自动创建所有必需的节点和组件。

### 2. 运行场景

点击编辑器顶部的预览按钮（或按 Ctrl/Cmd + P）

### 3. 操作说明

- **放置物品**: 点击右侧按钮选择物品类型，然后点击网格放置
- **取消放置**: 点击"取消"按钮或按右键
- **移动相机**: 使用 WASD 或方向键
- **缩放相机**: 使用鼠标滚轮

## 等距投影说明

本Demo使用经典的2:1等距投影比例：
- 瓦片宽度: 64px
- 瓦片高度: 32px (宽度的一半)

坐标转换公式：
```
世界坐标 -> 网格坐标：
  gridX = (worldX / 32 + worldY / 16) / 2
  gridY = (worldY / 16 - worldX / 32) / 2

网格坐标 -> 世界坐标：
  worldX = (gridX - gridY) * 32
  worldY = (gridX + gridY) * 16
```

## 扩展指南

### 添加新物品类型

1. 在 `SimpleItemFactory.ts` 中添加绘制方法：
```typescript
static createCustomItem(name: string): Node {
    const node = new Node(name);
    const item = node.addComponent(PlaceableItem);
    item.itemId = 'custom';
    item.gridWidth = 1;
    item.gridHeight = 1;
    
    const graphics = node.addComponent(Graphics);
    // 绘制你的图形
    
    return node;
}
```

2. 在 `PrefabManager.ts` 的 `generatePrefabs()` 中注册新物品

3. 在 `SceneSetup.ts` 的 `createUI()` 中添加对应按钮

### 修改网格大小

修改 `SceneSetup.ts` 中的属性：
```typescript
gridWidth: number = 16;   // 网格宽度
gridHeight: number = 16;  // 网格高度
```

### 使用真实的美术资源

替换 `SimpleItemFactory` 中的程序绘制为精灵：
```typescript
// 使用SpriteFrame
const sprite = node.addComponent(Sprite);
sprite.spriteFrame = yourSpriteFrame;
```

## 注意事项

1. 所有脚本使用 TypeScript 和 ES Module 格式
2. 使用装饰器 `@ccclass` 和 `@property` 来暴露属性到编辑器
3. 网格坐标系原点在左下角
4. 物品层级按 Y 坐标自动排序（下方的物品覆盖上方的物品）
