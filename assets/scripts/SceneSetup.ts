import { _decorator, Component, Node, Vec3, Color, Graphics, Camera, view, UITransform, Canvas, Widget, Label, instantiate, director, EventTarget } from 'cc';
import { GridManager } from './GridManager';
import { PlacementSystem } from './PlacementSystem';
import { GameController } from './GameController';
import { PrefabManager } from './PrefabManager';
const { ccclass, property } = _decorator;

// 全局事件系统
export const GameEvents = new EventTarget();

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
            // 检查是否已有手动创建的场景结构
            const existingCanvas = this.node.scene?.getChildByName('Canvas');
            if (existingCanvas) {
                console.log('Detected manually created scene, skipping auto-setup');
                this.bindEventsToExistingScene();
                return;
            }
            this.setupScene();
        }
    }

    /**
     * 绑定事件到已存在的场景
     */
    bindEventsToExistingScene() {
        // 查找现有组件
        const canvas = this.node.scene?.getChildByName('Canvas')?.getComponent(Canvas);
        const placementSystem = this.findComponentInScene(PlacementSystem);

        if (placementSystem) {
            this.bindEvents(placementSystem);

            // 在 Canvas 下创建 UI
            if (canvas) {
                this.createUIRoot(canvas.node);
            }
        }
    }

    /**
     * 在场景中查找组件
     */
    findComponentInScene<T extends Component>(componentClass: new () => T): T | null {
        const nodes = this.node.scene?.children || [];
        for (const node of nodes) {
            const component = node.getComponent(componentClass);
            if (component) return component;
            // 递归查找子节点
            for (const child of node.children) {
                const childComponent = child.getComponent(componentClass);
                if (childComponent) return childComponent;
            }
        }
        return null;
    }

    /**
     * 设置整个场景
     */
    setupScene() {
        console.log('Setting up isometric scene...');

        // 创建游戏世界节点
        const gameWorld = this.createGameWorld();

        // 1. 创建相机
        const camera = this.createCamera(gameWorld);

        // 2. 创建网格管理器
        const gridManager = this.createGridManager(gameWorld);

        // 3. 创建预制体管理器
        const prefabManager = this.createPrefabManager();

        // 4. 创建放置系统
        const placementSystem = this.createPlacementSystem(camera, gridManager, prefabManager, gameWorld);

        // 5. 创建游戏控制器
        this.createGameController(gridManager, placementSystem, camera);

        // 6. 创建Canvas（UI）- 独立层级
        const canvas = this.createCanvas();
        this.createUI(canvas);

        // 7. 绑定全局事件
        this.bindEvents(placementSystem);

        console.log('Scene setup complete!');
    }

    /**
     * 创建游戏世界根节点
     */
    createGameWorld(): Node {
        const gameWorld = new Node('GameWorld');
        gameWorld.parent = this.node;
        return gameWorld;
    }

    /**
     * 创建相机
     */
    createCamera(parent: Node): Camera {
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

        cameraNode.parent = parent;
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
    createGridManager(parent: Node): GridManager {
        const gridNode = new Node('GridManager');
        const gridManager = gridNode.addComponent(GridManager);

        // 配置网格
        gridManager.gridWidth = this.gridWidth;
        gridManager.gridHeight = this.gridHeight;
        gridManager.tileWidth = this.tileWidth;
        gridManager.tileHeight = this.tileHeight;

        gridNode.parent = parent;
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
    createPlacementSystem(camera: Camera, gridManager: GridManager, prefabManager: PrefabManager, parent: Node): PlacementSystem {
        const placementNode = new Node('PlacementSystem');
        const placementSystem = placementNode.addComponent(PlacementSystem);

        // 设置引用
        placementSystem.mainCamera = camera;
        placementSystem.gridManager = gridManager;

        // 创建物品容器
        const itemContainer = new Node('Items');
        itemContainer.parent = parent;
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
    createGameController(gridManager: GridManager, placementSystem: PlacementSystem, camera: Camera) {
        const controllerNode = new Node('GameController');
        const gameController = controllerNode.addComponent(GameController);

        gameController.gridManager = gridManager;
        gameController.placementSystem = placementSystem;
        gameController.mainCamera = camera;

        controllerNode.parent = this.node;
    }

    /**
     * 创建UI
     */
    createUI(canvas: Canvas) {
        this.createUIRoot(canvas.node);
    }

    /**
     * 在指定父节点下创建UI
     */
    createUIRoot(parent: Node) {
        // 检查是否已有UIRoot
        const existingUIRoot = parent.getChildByName('UIRoot');
        if (existingUIRoot) {
            console.log('UIRoot already exists, skipping UI creation');
            return;
        }

        // 创建UI根节点
        const uiRoot = new Node('UIRoot');
        uiRoot.parent = parent;

        // 创建按钮面板
        this.createButtonPanel(uiRoot);

        // 创建说明文字
        this.createInstructions(uiRoot);

        // 创建标题
        this.createTitle(uiRoot);
    }

    /**
     * 绑定全局事件
     */
    bindEvents(placementSystem: PlacementSystem) {
        // 监听放置事件
        GameEvents.on('START_PLACEMENT', (prefabIndex: number) => {
            console.log('Event: START_PLACEMENT', prefabIndex);
            placementSystem.startPlacement(prefabIndex);
        });

        GameEvents.on('CANCEL_PLACEMENT', () => {
            console.log('Event: CANCEL_PLACEMENT');
            placementSystem.cancelPlacement();
        });
    }

    /**
     * 创建按钮面板
     */
    createButtonPanel(parent: Node) {
        const panelNode = new Node('ButtonPanel');
        panelNode.parent = parent;

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

            // 添加点击事件 - 通过事件系统触发
            btnNode.on(Node.EventType.TOUCH_END, () => {
                if (btn.index >= 0) {
                    GameEvents.emit('START_PLACEMENT', btn.index);
                } else {
                    GameEvents.emit('CANCEL_PLACEMENT');
                }
            });
        });
    }

    /**
     * 创建单个按钮
     */
    createButton(text: string, index: number): Node {
        const btnNode = new Node(`Button_${text}`);

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
