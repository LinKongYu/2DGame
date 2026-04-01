import { _decorator, Component, Camera, Vec3, Vec2, input, Input, EventMouse, math } from 'cc';
const { ccclass, property } = _decorator;

/**
 * 相机控制器 - 支持鼠标拖拽移动和滚轮缩放
 */
@ccclass('CameraController')
export class CameraController extends Component {

    @property
    zoomSpeed: number = 0.1;

    @property
    minZoom: number = 100;

    @property
    maxZoom: number = 500;

    private _camera: Camera | null = null;

    // 拖拽相关
    private _isDragging: boolean = false;
    private _lastMousePos: Vec2 = new Vec2();
    private _dragStartCameraPos: Vec3 = new Vec3();

    start() {
        this._camera = this.getComponent(Camera);
        if (!this._camera) {
            console.error('CameraController requires a Camera component');
            return;
        }

        this.initInput();
    }

    initInput() {
        // 鼠标事件
        input.on(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
        input.on(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
        input.on(Input.EventType.MOUSE_UP, this.onMouseUp, this);

        // 鼠标滚轮（缩放）
        input.on(Input.EventType.MOUSE_WHEEL, this.onMouseWheel, this);
    }

    onMouseDown(event: EventMouse) {
        // 左键按下开始拖拽
        if (event.getButton() === EventMouse.BUTTON_LEFT) {
            this._isDragging = true;
            this._lastMousePos.set(event.getLocationX(), event.getLocationY());
            this._dragStartCameraPos = this.node.position.clone();
        }
    }

    onMouseMove(event: EventMouse) {
        if (!this._isDragging || !this._camera) return;

        const currentX = event.getLocationX();
        const currentY = event.getLocationY();

        // 计算鼠标移动差值
        const deltaX = currentX - this._lastMousePos.x;
        const deltaY = currentY - this._lastMousePos.y;

        // 更新鼠标位置
        this._lastMousePos.set(currentX, currentY);

        // 移动相机（反向移动，这样拖拽感觉像是在拖地图）
        const currentPos = this.node.position;
        const newX = currentPos.x - deltaX;
        const newY = currentPos.y - deltaY;

        this.node.setPosition(newX, newY, currentPos.z);
    }

    onMouseUp(event: EventMouse) {
        // 左键释放结束拖拽
        if (event.getButton() === EventMouse.BUTTON_LEFT) {
            this._isDragging = false;
        }
    }

    onMouseWheel(event: EventMouse) {
        if (!this._camera) return;

        const scrollY = event.getScrollY();
        const currentHeight = this._camera.orthoHeight;

        // 缩放
        if (scrollY > 0) {
            // 向上滚动 = 放大
            this._camera.orthoHeight = math.clamp(
                currentHeight * (1 - this.zoomSpeed),
                this.minZoom,
                this.maxZoom
            );
        } else if (scrollY < 0) {
            // 向下滚动 = 缩小
            this._camera.orthoHeight = math.clamp(
                currentHeight * (1 + this.zoomSpeed),
                this.minZoom,
                this.maxZoom
            );
        }
    }

    update(deltaTime: number) {
        // 拖拽在 onMouseMove 中处理，这里不需要额外逻辑
    }

    onDestroy() {
        input.off(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
        input.off(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
        input.off(Input.EventType.MOUSE_UP, this.onMouseUp, this);
        input.off(Input.EventType.MOUSE_WHEEL, this.onMouseWheel, this);
    }
}
