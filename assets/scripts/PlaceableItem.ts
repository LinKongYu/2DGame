import { _decorator, Component, Sprite, SpriteFrame, Vec3, Color } from 'cc';
const { ccclass, property } = _decorator;

/**
 * 物品数据接口
 */
export interface ItemData {
    id: string;
    name: string;
    icon: string;
    width: number;  // 占用的网格宽度
    height: number; // 占用的网格高度
    canStack: boolean;
    maxStack: number;
}

/**
 * 可放置物品 - 所有可放置在地图上的物品的基类
 */
@ccclass('PlaceableItem')
export class PlaceableItem extends Component {
    @property
    itemId: string = '';

    @property
    itemName: string = '';

    @property
    gridWidth: number = 1; // 占用网格宽度

    @property
    gridHeight: number = 1; // 占用网格高度

    @property(SpriteFrame)
    defaultSprite: SpriteFrame | null = null;

    @property
    isObstacle: boolean = true; // 是否阻挡其他物品放置

    private _gridX: number = -1;
    private _gridY: number = -1;
    private _isPlaced: boolean = false;
    private _isDragging: boolean = false;
    private _originalColor: Color = new Color(255, 255, 255, 255);

    get gridX(): number { return this._gridX; }
    get gridY(): number { return this._gridY; }
    get isPlaced(): boolean { return this._isPlaced; }
    get isDragging(): boolean { return this._isDragging; }

    start() {
        this.initSprite();
    }

    initSprite() {
        let sprite = this.getComponent(Sprite);
        if (!sprite) {
            sprite = this.addComponent(Sprite);
        }
        if (this.defaultSprite) {
            sprite.spriteFrame = this.defaultSprite;
        }
        this._originalColor = sprite.color.clone();
    }

    /**
     * 放置物品到指定网格位置
     */
    place(gridX: number, gridY: number, worldPos: Vec3) {
        this._gridX = gridX;
        this._gridY = gridY;
        this._isPlaced = true;
        this._isDragging = false;

        this.node.position = worldPos;
        this.node.setScale(1, 1, 1);

        // 恢复颜色
        const sprite = this.getComponent(Sprite);
        if (sprite) {
            sprite.color = this._originalColor;
        }

        // 设置层级（Y轴排序）
        this.updateSortingOrder();
    }

    /**
     * 开始拖拽
     */
    startDrag() {
        this._isDragging = true;

        // 拖拽时半透明
        const sprite = this.getComponent(Sprite);
        if (sprite) {
            sprite.color = new Color(200, 200, 255, 180);
        }

        // 放大一点表示选中
        this.node.setScale(1.1, 1.1, 1);
    }

    /**
     * 结束拖拽
     */
    endDrag() {
        this._isDragging = false;

        const sprite = this.getComponent(Sprite);
        if (sprite) {
            sprite.color = this._originalColor;
        }

        this.node.setScale(1, 1, 1);
    }

    /**
     * 拖拽时更新位置
     */
    updateDragPosition(worldPos: Vec3) {
        if (this._isDragging) {
            this.node.position = worldPos;
        }
    }

    /**
     * 更新层级（Y轴排序，让下方的物品覆盖上方的物品）
     */
    updateSortingOrder() {
        // 在等距视角中，Y坐标越小的（越"上方"），层级应该越高
        // 这里简化处理，根据gridY + gridX 计算层级
        const order = -(this._gridX + this._gridY) * 10;
        // 注意：实际项目中可能需要更复杂的层级管理
    }

    /**
     * 检查物品是否占用指定网格
     */
    occupiesGrid(gridX: number, gridY: number): boolean {
        if (!this._isPlaced) return false;

        return gridX >= this._gridX &&
               gridX < this._gridX + this.gridWidth &&
               gridY >= this._gridY &&
               gridY < this._gridY + this.gridHeight;
    }

    /**
     * 获取占用的所有网格
     */
    getOccupiedGrids(): { x: number, y: number }[] {
        const grids: { x: number, y: number }[] = [];

        for (let x = 0; x < this.gridWidth; x++) {
            for (let y = 0; y < this.gridHeight; y++) {
                grids.push({
                    x: this._gridX + x,
                    y: this._gridY + y
                });
            }
        }

        return grids;
    }

    /**
     * 回收物品
     */
    recycle() {
        this._isPlaced = false;
        this._gridX = -1;
        this._gridY = -1;
        this.node.destroy();
    }
}
