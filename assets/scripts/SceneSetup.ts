import { _decorator, Component, Node, Vec3, Color, Graphics, Camera, view, UITransform, Canvas, Widget, Label, instantiate, director } from 'cc';
import { GridManager } from './GridManager';
import { PlacementSystem } from './PlacementSystem';
import { GameController } from './GameController';
import { PrefabManager } from './PrefabManager';
const { ccclass, property } = _decorator;

/**
 * 场景设置 - 自动设置整个场景
 * 将此脚本挂载到场景的根节点上
 */
@ccclass('SceneSetup')
export class SceneSetup extends Component {

    @property
    autoSetup: boolean = true;

    @property
    gridWidth: number = 12;

    @property
    gridHeight: number = 12;

    @property
    tileWidth: number = 64;

    @property
    tileHeight: number = 32;

    start() {
        if (this.autoSetup) {
            this.setupScene();
        }
    }

    /**
     * 设置整个场景
     */
    setupScene() {
        console.log('Setting up isometric scene...');

        // 1. 创建相机
        const camera = this.createCamera();

        // 2. 创建Canvas（UI）
        const canvas = this.createCanvas();

        // 3. 创建网格管理器
        const gridManager = this.createGridManager();

        // 4. 创建预制体管理器
        const prefabManager = this.createPrefabManager();

        // 5. 创建放置系统
        const placementSystem = this.createPlacementSystem(camera, gridManager, prefabManager);

        // 6. 创建游戏控制器
        const gameController = this.createGameController(gridManager, placementSystem, camera);

        // 7. 创建UI
        this.createUI(canvas, placementSystem);

        console.log('Scene setup complete!');
    }

    /**
     * 创建相机
     */
    createCamera(): Camera {
        const cameraNode = new Node('MainCamera');
        const camera = cameraNode.addComponent(Camera);

        // 设置为正交相机
        camera.projection = Camera.ProjectionType.ORTHO;
        camera.orthoHeight = 400;
        camera.priority = 0;

        // 设置位置（居中）
        const centerX = (this.gridWidth * this.tileWidth) / 4;
        const centerY = (this.gridHeight * this.tileHeight) / 4;
        cameraNode.position = new Vec3(centerX, centerY, 1000);

        cameraNode.parent = this.node;
        return camera;
    }

    /**
     * 创建Canvas
     */
    createCanvas(): Canvas {
        const canvasNode = new Node('Canvas');
        const canvas = canvasNode.addComponent(Canvas);
        const uiTransform = canvasNode.addComponent(UITransform);

        // 适配屏幕
        const visibleSize = view.getVisibleSize();
        uiTransform.contentSize = visibleSize;
        canvas.resolution = visibleSize;

        canvasNode.parent = this.node;
        return canvas;
    }

    /**
     * 创建网格管理器
     */
    createGridManager(): GridManager {
        const gridNode = new Node('GridManager');
        const gridManager = gridNode.addComponent(GridManager);

        // 配置网格
        gridManager.gridWidth = this.gridWidth;
        gridManager.gridHeight = this.gridHeight;
        gridManager.tileWidth = this.tileWidth;
        gridManager.tileHeight = this.tileHeight;

        gridNode.parent = this.node;
        return gridManager;
    }

    /**
     * 创建预制体管理器
     */
    createPrefabManager(): PrefabManager {
        const prefabManagerNode = new Node('PrefabManager');
        const prefabManager = prefabManagerNode.addComponent(PrefabManager);

        prefabManagerNode.parent = this.node;
        return prefabManager;
    }

    /**
     * 创建放置系统
     */
    createPlacementSystem(camera: Camera, gridManager: GridManager, prefabManager: PrefabManager): PlacementSystem {
        const placementNode = new Node('PlacementSystem');
        const placementSystem = placementNode.addComponent(PlacementSystem);

        // 设置引用
        placementSystem.mainCamera = camera;
        placementSystem.gridManager = gridManager;

        // 创建物品容器
        const itemContainer = new Node('Items');
        itemContainer.parent = this.node;
        placementSystem.itemContainer = itemContainer;

        // 等待预制体生成完成后再设置prefabs
        this.scheduleOnce(() => {
            const prefabs = prefabManager.getAllPrefabs();
            placementSystem.itemPrefabs = prefabs;
            console.log(`PlacementSystem initialized with ${prefabs.length} prefabs`);
        }, 0.1);

        placementNode.parent = this.node;
        return placementSystem;
    }

    /**
     * 创建游戏控制器
     */
    createGameController(gridManager: GridManager, placementSystem: PlacementSystem, camera: Camera): GameController {
        const controllerNode = new Node('GameController');
        const gameController = controllerNode.addComponent(GameController);

        gameController.gridManager = gridManager;
        gameController.placementSystem = placementSystem;
        gameController.mainCamera = camera;

        controllerNode.parent = this.node;
        return gameController;
    }

    /**
     * 创建UI
     */
    createUI(canvas: Canvas, placementSystem: PlacementSystem) {
        // 注意：Canvas 自带相机，不需要额外创建UI相机
        // 确保 Canvas 的相机设置正确
        const canvasCamera = canvas.node.getComponent(Camera);
        if (!canvasCamera) {
            const uiCameraNode = new Node('UICamera');
            const uiCamera = uiCameraNode.addComponent(Camera);
            uiCamera.projection = Camera.ProjectionType.ORTHO;
            uiCamera.priority = 1;
            uiCamera.clearFlags = Camera.ClearFlag.DEPTH_ONLY;
            uiCameraNode.parent = canvas.node;
        }

        // 创建按钮面板
        this.createButtonPanel(canvas.node, placementSystem);

        // 创建说明文字
        this.createInstructions(canvas.node);

        // 创建标题
        this.createTitle(canvas.node);
    }

    /**
     * 创建按钮面板
     */
    createButtonPanel(parent: Node, placementSystem: PlacementSystem) {
        const panelNode = new Node('ButtonPanel');
        panelNode.parent = parent;
        panelNode.layer = 1 << 1; // UI层

        const panelTransform = panelNode.addComponent(UITransform);
        panelTransform.setContentSize(200, 300);

        // 定位到右侧
        const widget = panelNode.addComponent(Widget);
        widget.isAlignRight = true;
        widget.right = 20;
        widget.isAlignTop = true;
        widget.top = 100;
        widget.updateAlignment();

        // 面板背景
        const bg = panelNode.addComponent(Graphics);
        bg.fillColor = new Color(0, 0, 0, 150);
        bg.roundRect(-100, -300, 200, 300, 10);
        bg.fill();

        // 创建按钮
        const buttons = [
            { name: '🏠 房屋', index: 0 },
            { name: '🌲 树木', index: 1 },
            { name: '🪨 石块', index: 2 },
            { name: '❌ 取消', index: -1 },
        ];

        buttons.forEach((btn, i) => {
            const btnNode = this.createButton(btn.name, i);
            btnNode.parent = panelNode;

            // 添加点击事件
            btnNode.on(Node.EventType.TOUCH_END, () => {
                if (btn.index >= 0) {
                    placementSystem.startPlacement(btn.index);
                } else {
                    placementSystem.cancelPlacement();
                }
            });
        });
    }

    /**
     * 创建单个按钮
     */
    createButton(text: string, index: number): Node {
        const btnNode = new Node(`Button_${text}`);
        btnNode.layer = 1 << 1;

        const btnTransform = btnNode.addComponent(UITransform);
        btnTransform.setContentSize(160, 50);
        btnTransform.setAnchorPoint(0.5, 1);
        btnNode.setPosition(0, -index * 60 - 20, 0);

        // 按钮背景
        const bg = btnNode.addComponent(Graphics);
        bg.fillColor = new Color(70, 130, 180, 255);
        bg.roundRect(-80, -50, 160, 50, 8);
        bg.fill();

        // 文字
        const labelNode = new Node('Label');
        labelNode.parent = btnNode;
        labelNode.layer = 1 << 1;

        const label = labelNode.addComponent(Label);
        label.string = text;
        label.fontSize = 20;
        label.color = Color.WHITE;

        const labelTransform = labelNode.addComponent(UITransform);
        labelTransform.setContentSize(160, 50);
        labelNode.setPosition(0, -25, 0);

        return btnNode;
    }

    /**
     * 创建说明文字
     */
    createInstructions(parent: Node) {
        const textNode = new Node('Instructions');
        textNode.parent = parent;
        textNode.layer = 1 << 1;

        const label = textNode.addComponent(Label);
        label.string = '点击按钮选择物品 → 点击网格放置\n右键或取消按钮可以取消放置';
        label.fontSize = 14;
        label.color = Color.WHITE;
        label.overflow = Label.Overflow.RESIZE_HEIGHT;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        label.enableWrapText = true;

        const transform = textNode.addComponent(UITransform);
        transform.setContentSize(400, 60);

        const widget = textNode.addComponent(Widget);
        widget.isAlignBottom = true;
        widget.bottom = 20;
        widget.isAlignLeft = true;
        widget.left = 20;
        widget.updateAlignment();
    }

    /**
     * 创建标题
     */
    createTitle(parent: Node) {
        const titleNode = new Node('Title');
        titleNode.parent = parent;
        titleNode.layer = 1 << 1;

        const label = titleNode.addComponent(Label);
        label.string = '等距模拟经营 Demo';
        label.fontSize = 28;
        label.color = new Color(255, 215, 0, 255); // 金色
        label.bold = true;

        const transform = titleNode.addComponent(UITransform);
        transform.setContentSize(400, 50);

        const widget = titleNode.addComponent(Widget);
        widget.isAlignTop = true;
        widget.top = 20;
        widget.isAlignLeft = true;
        widget.left = 20;
        widget.updateAlignment();
    }
}
