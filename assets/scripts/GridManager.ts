import { _decorator, Component, Node, Vec2, Vec3, Graphics, Color } from 'cc';
const { ccclass, property } = _decorator;

/**
 * 网格管理器 - 处理等距视角的网格坐标转换和渲染
 */
@ccclass('GridManager')
export class GridManager extends Component {
    @property
    gridWidth: number = 10; // 网格宽度

    @property
    gridHeight: number = 10; // 网格高度

    @property
    tileWidth: number = 64; // 单个瓦片宽度

    @property
    tileHeight: number = 32; // 单个瓦片高度（等距视角高度通常是宽度的一半）

    @property(Color)
    gridColor: Color = new Color(100, 100, 100, 255);

    @property(Color)
    highlightColor: Color = new Color(100, 200, 100, 255);

    private graphics: Graphics | null = null;
    private highlightGraphics: Graphics | null = null;
    private _waterTiles: Set<string> = new Set();

    start() {
        this.initGraphics();
        this.drawGrid();
    }

    initGraphics() {
        // 主网格图形
        this.graphics = this.node.getComponent(Graphics);
        if (!this.graphics) {
            this.graphics = this.node.addComponent(Graphics);
        }

        // 高亮图形（放在上层）
        const highlightNode = new Node('Highlight');
        highlightNode.parent = this.node;
        this.highlightGraphics = highlightNode.addComponent(Graphics);
    }

    /**
     * 将网格坐标转换为世界坐标（等距投影）
     * @param gridX 网格X坐标
     * @param gridY 网格Y坐标
     * @returns 世界坐标
     */
    gridToWorld(gridX: number, gridY: number): Vec3 {
        const worldX = (gridX - gridY) * this.tileWidth / 2;
        const worldY = (gridX + gridY) * this.tileHeight / 2;
        return new Vec3(worldX, worldY, 0);
    }

    /**
     * 将世界坐标转换为网格坐标
     * @param worldX 世界X坐标
     * @param worldY 世界Y坐标
     * @returns 网格坐标
     */
    worldToGrid(worldX: number, worldY: number): Vec2 {
        // 等距逆变换
        const gridX = (worldX / (this.tileWidth / 2) + worldY / (this.tileHeight / 2)) / 2;
        const gridY = (worldY / (this.tileHeight / 2) - worldX / (this.tileWidth / 2)) / 2;
        return new Vec2(Math.floor(gridX), Math.floor(gridY));
    }

    /**
     * 检查网格坐标是否在有效范围内
     */
    isValidGrid(gridX: number, gridY: number): boolean {
        return gridX >= 0 && gridX < this.gridWidth &&
               gridY >= 0 && gridY < this.gridHeight;
    }

    /**
     * 绘制网格
     */
    drawGrid() {
        if (!this.graphics) return;

        this.graphics.clear();
        this.graphics.strokeColor = this.gridColor;
        this.graphics.lineWidth = 1;

        // 绘制每个瓦片的菱形
        for (let x = 0; x < this.gridWidth; x++) {
            for (let y = 0; y < this.gridHeight; y++) {
                this.drawTile(x, y, this.graphics);
            }
        }
    }

    /**
     * 绘制单个瓦片（菱形）
     */
    drawTile(gridX: number, gridY: number, graphics: Graphics, fillColor?: Color) {
        const center = this.gridToWorld(gridX, gridY);

        // 菱形的四个顶点
        const top = new Vec3(center.x, center.y + this.tileHeight / 2);
        const right = new Vec3(center.x + this.tileWidth / 2, center.y);
        const bottom = new Vec3(center.x, center.y - this.tileHeight / 2);
        const left = new Vec3(center.x - this.tileWidth / 2, center.y);

        graphics.moveTo(top.x, top.y);
        graphics.lineTo(right.x, right.y);
        graphics.lineTo(bottom.x, bottom.y);
        graphics.lineTo(left.x, left.y);
        graphics.close();

        if (fillColor) {
            const prevColor = graphics.fillColor;
            graphics.fillColor = fillColor;
            graphics.fill();
            graphics.fillColor = prevColor;
        }

        graphics.stroke();
    }

    /**
     * 高亮指定网格
     */
    highlightGrid(gridX: number, gridY: number) {
        if (!this.highlightGraphics) return;

        this.highlightGraphics.clear();

        if (this.isValidGrid(gridX, gridY)) {
            this.highlightGraphics.fillColor = new Color(
                this.highlightColor.r,
                this.highlightColor.g,
                this.highlightColor.b,
                100 // 半透明
            );
            this.drawTile(gridX, gridY, this.highlightGraphics, this.highlightColor);
        }
    }

    /**
     * 清除高亮
     */
    clearHighlight() {
        if (this.highlightGraphics) {
            this.highlightGraphics.clear();
        }
    }

    /**
     * 获取网格中心的世界坐标
     */
    getGridCenter(gridX: number, gridY: number): Vec3 {
        return this.gridToWorld(gridX, gridY);
    }

    /**
     * 标记水域格子
     */
    markWaterTile(gridX: number, gridY: number) {
        this._waterTiles.add(`${gridX},${gridY}`);
    }

    /**
     * 检查指定网格是否为水域
     */
    isWater(gridX: number, gridY: number): boolean {
        return this._waterTiles.has(`${gridX},${gridY}`);
    }

    isWaterAtWorld(worldX: number, worldY: number): boolean {
        const gridPos = this.worldToGrid(worldX, worldY);
        return this.isWater(gridPos.x, gridPos.y);
    }

    /**
     * 清除水域标记
     */
    clearWaterTiles() {
        this._waterTiles.clear();
    }
}
