import { _decorator, Component, Vec3, Camera, Layers } from 'cc';
import { GridManager } from './GridManager';
import { PlacementSystem } from './PlacementSystem';
const { ccclass, property } = _decorator;

@ccclass('GameController')
export class GameController extends Component {
    @property(GridManager)
    gridManager: GridManager | null = null;

    @property(PlacementSystem)
    placementSystem: PlacementSystem | null = null;

    @property(Camera)
    mainCamera: Camera | null = null;

    private _isRunning: boolean = false;

    start() {
        this.initGame();
        this.setupCamera();
    }

    /**
     * 初始化游戏
     */
    initGame() {
        console.log('Initializing Isometric Simulation Game...');

        // 检查必要组件
        if (!this.gridManager) {
            console.error('GridManager is required!');
            return;
        }

        if (!this.placementSystem) {
            console.error('PlacementSystem is required!');
            return;
        }

        this._isRunning = true;
        console.log('Game initialized successfully!');
    }

    /**
     * 设置相机
     */
    setupCamera() {
        if (!this.mainCamera) {
            console.warn('MainCamera not assigned');
            return;
        }

        // 设置正交相机以适配2D等距视角
        this.mainCamera.projection = Camera.ProjectionType.ORTHO;
        this.mainCamera.orthoHeight = 320;
        this.mainCamera.visibility = Layers.Enum.DEFAULT;

        // 相机位置居中
        if (this.gridManager) {
            const centerX = (this.gridManager.gridWidth * this.gridManager.tileWidth) / 4;
            const centerY = (this.gridManager.gridHeight * this.gridManager.tileHeight) / 4;
            this.mainCamera.node.position = new Vec3(centerX, centerY, 1000);
        }
    }

    /**
     * 开始放置物品（供UI调用）
     */
    startPlacement(prefabIndex: number) {
        if (this.placementSystem) {
            this.placementSystem.startPlacement(prefabIndex);
        }
    }

    /**
     * 取消放置（供UI调用）
     */
    cancelPlacement() {
        if (this.placementSystem) {
            this.placementSystem.cancelPlacement();
        }
    }

    update(deltaTime: number) {
        if (!this._isRunning) return;

        // 游戏主循环逻辑
        // 可以在这里添加：
        // - 资源生成
        // - NPC AI
        // - 时间系统
        // - 自动保存
    }

    /**
     * 暂停游戏
     */
    pauseGame() {
        this._isRunning = false;
    }

    /**
     * 恢复游戏
     */
    resumeGame() {
        this._isRunning = true;
    }
}
