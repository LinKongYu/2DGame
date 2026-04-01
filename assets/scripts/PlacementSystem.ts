import { _decorator, Component, Node, Vec2, Vec3, Camera, input, Input, EventMouse, EventTouch, geometry, PhysicsSystem2D, Collider2D, Contact2DType, Sprite, Color, instantiate } from 'cc';
import { GridManager } from './GridManager';
import { PlaceableItem } from './PlaceableItem';
const { ccclass, property } = _decorator;

/**
 * 放置系统 - 处理物品的创建、拖拽和放置
 */
@ccclass('PlacementSystem')
export class PlacementSystem extends Component {
    @property(GridManager)
    gridManager: GridManager | null = null;

    @property(Camera)
    mainCamera: Camera | null = null;

    @property(Node)
    itemContainer: Node | null = null; // 物品容器节点

    @property([Node])
    itemPrefabs: Node[] = []; // 物品预制体列表

    private _currentItem: PlaceableItem | null = null;
    private _isPlacing: boolean = false;
    private _hoveredGrid: Vec2 = new Vec2(-1, -1);
    private _placedItems: PlaceableItem[] = [];

    // 预览节点
    private _previewNode: Node | null = null;
    private _previewGraphics: any = null;

    start() {
        this.initInput();
        this.initPreview();

        // 如果没有指定 itemContainer，创建一个
        if (!this.itemContainer) {
            this.itemContainer = new Node('Items');
            this.itemContainer.parent = this.node;
        }
    }

    initInput() {
        // 鼠标/触摸输入
        input.on(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
        input.on(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
        input.on(Input.EventType.MOUSE_UP, this.onMouseUp, this);

        // 触摸支持
        input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    initPreview() {
        // 创建预览节点
        this._previewNode = new Node('PlacementPreview');
        this._previewNode.parent = this.node;

        const sprite = this._previewNode.addComponent(Sprite);
        sprite.color = new Color(100, 255, 100, 128); // 半透明绿色
    }

    /**
     * 开始放置物品
     */
    startPlacement(prefabIndex: number) {
        if (prefabIndex < 0 || prefabIndex >= this.itemPrefabs.length) {
            console.warn('Invalid prefab index:', prefabIndex);
            return;
        }

        // 如果已经在放置中，先取消
        if (this._isPlacing && this._currentItem) {
            this.cancelPlacement();
        }

        // 创建新物品
        const prefab = this.itemPrefabs[prefabIndex];
        const newNode = instantiate(prefab);

        if (this.itemContainer) {
            newNode.parent = this.itemContainer;
        } else {
            newNode.parent = this.node;
        }

        this._currentItem = newNode.getComponent(PlaceableItem);
        if (!this._currentItem) {
            this._currentItem = newNode.addComponent(PlaceableItem);
        }

        this._currentItem.startDrag();
        this._isPlacing = true;

        // 更新预览
        this.updatePreview(prefab);
    }

    /**
     * 更新预览显示
     */
    updatePreview(prefab: Node) {
        if (!this._previewNode) return;

        const prefabSprite = prefab.getComponent(Sprite);
        if (prefabSprite && prefabSprite.spriteFrame) {
            const previewSprite = this._previewNode.getComponent(Sprite);
            if (previewSprite) {
                previewSprite.spriteFrame = prefabSprite.spriteFrame;
            }
        }

        this._previewNode.active = true;
    }

    /**
     * 取消放置
     */
    cancelPlacement() {
        if (this._currentItem) {
            this._currentItem.recycle();
            this._currentItem = null;
        }

        this._isPlacing = false;

        if (this._previewNode) {
            this._previewNode.active = false;
        }

        if (this.gridManager) {
            this.gridManager.clearHighlight();
        }
    }

    /**
     * 确认放置
     */
    confirmPlacement(gridX: number, gridY: number) {
        if (!this._currentItem || !this.gridManager) return;

        // 检查是否可以放置
        if (!this.canPlaceAt(gridX, gridY, this._currentItem)) {
            console.log('Cannot place item here');
            return;
        }

        // 放置物品
        const worldPos = this.gridManager.getGridCenter(gridX, gridY);
        this._currentItem.place(gridX, gridY, worldPos);
        this._placedItems.push(this._currentItem);

        // 清空当前物品
        this._currentItem = null;
        this._isPlacing = false;

        if (this._previewNode) {
            this._previewNode.active = false;
        }

        this.gridManager.clearHighlight();
    }

    /**
     * 检查指定位置是否可以放置
     */
    canPlaceAt(gridX: number, gridY: number, item: PlaceableItem): boolean {
        if (!this.gridManager) return false;

        // 检查网格范围
        for (let x = 0; x < item.gridWidth; x++) {
            for (let y = 0; y < item.gridHeight; y++) {
                const checkX = gridX + x;
                const checkY = gridY + y;

                if (!this.gridManager.isValidGrid(checkX, checkY)) {
                    return false;
                }

                // 检查是否有其他物品占用
                if (this.isGridOccupied(checkX, checkY, item)) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * 检查网格是否被占用
     */
    isGridOccupied(gridX: number, gridY: number, excludeItem?: PlaceableItem): boolean {
        for (const item of this._placedItems) {
            if (excludeItem && item === excludeItem) continue;
            if (!item.isPlaced) continue;

            if (item.occupiesGrid(gridX, gridY) && item.isObstacle) {
                return true;
            }
        }
        return false;
    }

    /**
     * 获取网格上的物品
     */
    getItemAt(gridX: number, gridY: number): PlaceableItem | null {
        for (const item of this._placedItems) {
            if (item.occupiesGrid(gridX, gridY)) {
                return item;
            }
        }
        return null;
    }

    // 输入事件处理
    onMouseMove(event: EventMouse) {
        this.handlePointerMove(event.getLocationX(), event.getLocationY());
    }

    onTouchMove(event: EventTouch) {
        const touch = event.getTouches()[0];
        this.handlePointerMove(touch.getLocationX(), touch.getLocationY());
    }

    handlePointerMove(screenX: number, screenY: number) {
        if (!this.mainCamera || !this.gridManager) return;

        // 转换屏幕坐标到世界坐标
        const screenPos = new Vec3(screenX, screenY, 0);
        const worldPos = this.mainCamera.screenToWorld(screenPos);

        // 更新预览位置
        if (this._isPlacing && this._currentItem && this._previewNode) {
            // 计算网格坐标
            const gridPos = this.gridManager.worldToGrid(worldPos.x, worldPos.y);

            // 检查是否变化
            if (gridPos.x !== this._hoveredGrid.x || gridPos.y !== this._hoveredGrid.y) {
                this._hoveredGrid.set(gridPos.x, gridPos.y);

                // 高亮网格
                this.gridManager.highlightGrid(gridPos.x, gridPos.y);

                // 更新预览位置（吸附到网格）
                if (this.gridManager.isValidGrid(gridPos.x, gridPos.y)) {
                    const snapPos = this.gridManager.getGridCenter(gridPos.x, gridPos.y);
                    this._previewNode.position = snapPos;

                    // 根据是否可放置改变颜色
                    const canPlace = this.canPlaceAt(gridPos.x, gridPos.y, this._currentItem);
                    const sprite = this._previewNode.getComponent(Sprite);
                    if (sprite) {
                        sprite.color = canPlace ?
                            new Color(100, 255, 100, 180) :
                            new Color(255, 100, 100, 180);
                    }
                }
            }

            // 更新物品跟随鼠标
            this._currentItem.updateDragPosition(worldPos);
        }
    }

    onMouseDown(event: EventMouse) {
        // 左键点击
        if (event.getButton() === EventMouse.BUTTON_LEFT) {
            this.handlePointerDown();
        }
        // 右键取消
        else if (event.getButton() === EventMouse.BUTTON_RIGHT) {
            this.cancelPlacement();
        }
    }

    onTouchStart(event: EventTouch) {
        this.handlePointerDown();
    }

    handlePointerDown() {
        if (!this._isPlacing) return;

        // 点击确认放置
        if (this._hoveredGrid.x >= 0 && this._hoveredGrid.y >= 0) {
            this.confirmPlacement(this._hoveredGrid.x, this._hoveredGrid.y);
        }
    }

    onMouseUp(event: EventMouse) {
        // 处理拖拽释放（如果需要支持拖拽已放置的物品）
    }

    onTouchEnd(event: EventTouch) {
        // 处理触摸释放
    }

    /**
     * 移除指定位置的物品
     */
    removeItemAt(gridX: number, gridY: number) {
        const item = this.getItemAt(gridX, gridY);
        if (item) {
            const index = this._placedItems.indexOf(item);
            if (index > -1) {
                this._placedItems.splice(index, 1);
            }
            item.recycle();
        }
    }

    /**
     * 获取所有已放置的物品
     */
    getAllPlacedItems(): PlaceableItem[] {
        return this._placedItems.filter(item => item.isPlaced);
    }

    onDestroy() {
        // 移除输入监听
        input.off(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
        input.off(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
        input.off(Input.EventType.MOUSE_UP, this.onMouseUp, this);
        input.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    }
}

