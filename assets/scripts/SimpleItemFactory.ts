import { _decorator, Component, Node, Sprite, Color, Graphics, SpriteFrame, Texture2D, Asset, ImageAsset, resources } from 'cc';
import { PlaceableItem } from './PlaceableItem';
const { ccclass, property } = _decorator;

/**
 * 简单物品工厂 - 用于动态创建简单的测试物品
 * 在没有美术资源的情况下，使用代码绘制简单的图形
 */
@ccclass('SimpleItemFactory')
export class SimpleItemFactory extends Component {

    /**
     * 创建一个简单的房屋
     */
    static createHouse(name: string = 'House'): Node {
        const node = new Node(name);

        // 添加PlaceableItem组件
        const item = node.addComponent(PlaceableItem);
        item.itemId = 'house';
        item.itemName = name;
        item.gridWidth = 2;
        item.gridHeight = 2;
        item.isObstacle = true;

        // 绘制房屋图形
        const graphics = node.addComponent(Graphics);
        this.drawHouse(graphics);

        return node;
    }

    /**
     * 创建一棵树
     */
    static createTree(name: string = 'Tree'): Node {
        const node = new Node(name);

        const item = node.addComponent(PlaceableItem);
        item.itemId = 'tree';
        item.itemName = name;
        item.gridWidth = 1;
        item.gridHeight = 1;
        item.isObstacle = true;

        const graphics = node.addComponent(Graphics);
        this.drawTree(graphics);

        return node;
    }

    /**
     * 创建石块
     */
    static createRock(name: string = 'Rock'): Node {
        const node = new Node(name);

        const item = node.addComponent(PlaceableItem);
        item.itemId = 'rock';
        item.itemName = name;
        item.gridWidth = 1;
        item.gridHeight = 1;
        item.isObstacle = true;

        const graphics = node.addComponent(Graphics);
        this.drawRock(graphics);

        return node;
    }

    /**
     * 绘制房屋
     */
    private static drawHouse(graphics: Graphics) {
        // 房屋主体（等距视角的立方体）
        const w = 60;  // 宽度
        const h = 40;  // 高度
        const d = 30;  // 深度

        // 颜色
        const wallColor = new Color(200, 180, 140, 255);
        const roofColor = new Color(150, 80, 60, 255);
        const sideColor = new Color(180, 160, 120, 255);

        // 绘制屋顶（三角形）
        graphics.fillColor = roofColor;
        graphics.moveTo(0, h/2 + 20);
        graphics.lineTo(-w/2, h/2);
        graphics.lineTo(w/2, h/2);
        graphics.close();
        graphics.fill();

        // 前面
        graphics.fillColor = wallColor;
        graphics.moveTo(-w/2, h/2);
        graphics.lineTo(w/2, h/2);
        graphics.lineTo(w/2, -h/2);
        graphics.lineTo(-w/2, -h/2);
        graphics.close();
        graphics.fill();
        graphics.strokeColor = Color.BLACK;
        graphics.stroke();

        // 门
        graphics.fillColor = new Color(100, 60, 40, 255);
        graphics.moveTo(-10, -h/2);
        graphics.lineTo(10, -h/2);
        graphics.lineTo(10, 0);
        graphics.lineTo(-10, 0);
        graphics.close();
        graphics.fill();
    }

    /**
     * 绘制树木
     */
    private static drawTree(graphics: Graphics) {
        // 树干
        const trunkColor = new Color(101, 67, 33, 255);
        graphics.fillColor = trunkColor;
        graphics.moveTo(-5, 0);
        graphics.lineTo(5, 0);
        graphics.lineTo(5, -25);
        graphics.lineTo(-5, -25);
        graphics.close();
        graphics.fill();
        graphics.strokeColor = Color.BLACK;
        graphics.stroke();

        // 树冠（圆形）
        const leafColor = new Color(34, 139, 34, 255);
        graphics.fillColor = leafColor;
        graphics.circle(0, 15, 25);
        graphics.fill();
        graphics.stroke();

        // 树冠高光
        graphics.fillColor = new Color(50, 160, 50, 255);
        graphics.circle(-5, 20, 15);
        graphics.fill();
    }

    /**
     * 绘制石块
     */
    private static drawRock(graphics: Graphics) {
        const rockColor = new Color(120, 120, 120, 255);
        const highlightColor = new Color(150, 150, 150, 255);

        graphics.fillColor = rockColor;

        // 不规则形状的石块
        graphics.moveTo(-15, -10);
        graphics.lineTo(-5, 5);
        graphics.lineTo(10, 8);
        graphics.lineTo(18, -5);
        graphics.lineTo(12, -18);
        graphics.lineTo(-8, -20);
        graphics.close();
        graphics.fill();
        graphics.strokeColor = Color.BLACK;
        graphics.stroke();

        // 高光
        graphics.fillColor = highlightColor;
        graphics.moveTo(-5, -5);
        graphics.lineTo(0, 0);
        graphics.lineTo(8, 2);
        graphics.lineTo(5, -8);
        graphics.close();
        graphics.fill();
    }

    /**
     * 创建纯色精灵作为占位符
     */
    static createPlaceholder(name: string, color: Color, width: number = 64, height: number = 64): Node {
        const node = new Node(name);

        const item = node.addComponent(PlaceableItem);
        item.itemId = name.toLowerCase();
        item.itemName = name;
        item.gridWidth = 1;
        item.gridHeight = 1;

        const graphics = node.addComponent(Graphics);
        graphics.fillColor = color;

        // 绘制等距方块
        const w = width;
        const h = height / 2;

        graphics.moveTo(0, h);
        graphics.lineTo(w/2, 0);
        graphics.lineTo(0, -h);
        graphics.lineTo(-w/2, 0);
        graphics.close();
        graphics.fill();
        graphics.strokeColor = Color.BLACK;
        graphics.stroke();

        return node;
    }
}
