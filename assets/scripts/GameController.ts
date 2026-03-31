import { _decorator, Component, Node, Vec3, Color, Graphics, Camera, Widget, view, UITransform, Label, Canvas, Layers, Button, EventHandler } from 'cc';
import { GridManager } from './GridManager';
import { PlacementSystem } from './PlacementSystem';
const { ccclass, property } = _decorator;

/**
 * 游戏控制器 - 游戏主逻辑和UI管理
 */
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
        this.createUI();
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
            // 查找或创建相机
            const cameraNode = new Node('MainCamera');
            this.mainCamera = cameraNode.addComponent(Camera);
            cameraNode.parent = this.node;
        }

        // 设置正交相机以适配2D等距视角
        this.mainCamera.projection = Camera.ProjectionType.ORTHO;
        this.mainCamera.orthoHeight = 320;

        // 相机位置居中
        if (this.gridManager) {
            const centerX = (this.gridManager.gridWidth * this.gridManager.tileWidth) / 4;
            const centerY = (this.gridManager.gridHeight * this.gridManager.tileHeight) / 4;
            this.mainCamera.node.position = new Vec3(centerX, centerY, 1000);
        }
    }

    /**
     * 创建UI界面
     */
    createUI() {
        // 创建Canvas
        const canvasNode = new Node('Canvas');
        canvasNode.layer = Layers.Enum.UI_2D;
        canvasNode.addComponent(Canvas);
        const uiTransform = canvasNode.getComponent(UITransform);
        uiTransform.contentSize = view.getVisibleSize();
        canvasNode.parent = this.node;

        // 创建UI相机
        const uiCameraNode = new Node('UICamera');
        const uiCamera = uiCameraNode.addComponent(Camera);
        uiCamera.projection = Camera.ProjectionType.ORTHO;
        uiCamera.priority = 1; // UI相机优先级高于主相机
        uiCamera.clearFlags = Camera.ClearFlag.DEPTH_ONLY;
        uiCamera.visibility = Layers.Enum.UI_2D;
        uiCameraNode.layer = Layers.Enum.UI_2D;
        uiCameraNode.parent = canvasNode;

        // 创建放置按钮
        this.createPlacementButtons(canvasNode);

        // 创建说明文字
        this.createInstructions(canvasNode);
    }

    /**
     * 创建放置按钮
     */
    createPlacementButtons(parent: Node) {
        const buttonContainer = new Node('ButtonContainer');
        buttonContainer.parent = parent;
        buttonContainer.layer = Layers.Enum.UI_2D;

        const containerTransform = buttonContainer.addComponent(UITransform);
        containerTransform.setContentSize(200, 300);

        // 使用Widget定位到右上角
        const widget = buttonContainer.addComponent(Widget);
        widget.isAlignRight = true;
        widget.right = 20;
        widget.isAlignTop = true;
        widget.top = 20;
        widget.updateAlignment();

        // 按钮数据
        const buttons = [
            { name: '放置房屋', prefabIndex: 0 },
            { name: '放置树木', prefabIndex: 1 },
            { name: '放置石块', prefabIndex: 2 },
        ];

        buttons.forEach((btnData, index) => {
            this.createButton(buttonContainer, btnData.name, index * 60, btnData.prefabIndex);
        });
    }

    /**
     * 创建单个按钮
     */
    createButton(parent: Node, text: string, yPos: number, prefabIndex: number) {
        const buttonNode = new Node('Button_' + text);
        buttonNode.parent = parent;
        buttonNode.layer = Layers.Enum.UI_2D;

        const btnTransform = buttonNode.addComponent(UITransform);
        btnTransform.setContentSize(180, 50);
        btnTransform.setAnchorPoint(0.5, 1);
        buttonNode.setPosition(0, -yPos, 0);

        // 按钮背景
        const graphics = buttonNode.addComponent(Graphics);
        graphics.fillColor = new Color(70, 130, 180, 255);
        graphics.roundRect(-90, -50, 180, 50, 10);
        graphics.fill();

        // 按钮文字
        const labelNode = new Node('Label');
        labelNode.parent = buttonNode;
        labelNode.layer = Layers.Enum.UI_2D;

        const label = labelNode.addComponent(Label);
        label.string = text;
        label.fontSize = 20;
        label.color = Color.WHITE;

        const labelTransform = labelNode.getComponent(UITransform) ?? labelNode.addComponent(UITransform);
        labelTransform.setContentSize(180, 50);
        labelNode.setPosition(0, -25, 0);

        // 添加Button组件和点击事件
        const button = buttonNode.addComponent(Button);
        button.target = buttonNode;
        button.transition = Button.Transition.COLOR;
        button.normalColor = new Color(255, 255, 255, 255);
        button.pressedColor = new Color(200, 200, 200, 255);
        button.hoverColor = new Color(230, 230, 230, 255);
        button.disabledColor = new Color(100, 100, 100, 255);

        // 注册点击事件
        const clickEventHandler = new EventHandler();
        clickEventHandler.target = this.node;
        clickEventHandler.component = 'GameController';
        clickEventHandler.handler = 'onButtonClicked';
        clickEventHandler.customEventData = prefabIndex.toString();
        button.clickEvents.push(clickEventHandler);

        return buttonNode;
    }

    /**
     * 按钮点击回调
     */
    onButtonClicked(event: Event, customEventData: string) {
        const prefabIndex = parseInt(customEventData);
        console.log('Button clicked, prefab index:', prefabIndex);
        this.onPlaceItemClicked(prefabIndex);
    }

    /**
     * 创建说明文字
     */
    createInstructions(parent: Node) {
        const instructionNode = new Node('Instructions');
        instructionNode.parent = parent;
        instructionNode.layer = Layers.Enum.UI_2D;

        const label = instructionNode.addComponent(Label);
        label.string = '点击右侧按钮选择物品，点击网格放置，右键取消';
        label.fontSize = 16;
        label.color = Color.WHITE;
        label.overflow = Label.Overflow.SHRINK;

        const transform = instructionNode.getComponent(UITransform) ?? instructionNode.addComponent(UITransform);
        transform.setContentSize(400, 30);

        // 定位到底部
        const widget = instructionNode.addComponent(Widget);
        widget.isAlignBottom = true;
        widget.bottom = 20;
        widget.isAlignLeft = true;
        widget.left = 20;
        widget.updateAlignment();
    }

    /**
     * 点击放置物品按钮
     */
    onPlaceItemClicked(prefabIndex: number) {
        if (this.placementSystem) {
            this.placementSystem.startPlacement(prefabIndex);
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
