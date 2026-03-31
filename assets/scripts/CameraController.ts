import { _decorator, Component, Camera, Vec3, input, Input, EventKeyboard, KeyCode, EventMouse, geometry, math } from 'cc';
const { ccclass, property } = _decorator;

/**
 * 相机控制器 - 支持键盘移动和鼠标滚轮缩放
 */
@ccclass('CameraController')
export class CameraController extends Component {

    @property
    moveSpeed: number = 300;

    @property
    zoomSpeed: number = 0.1;

    @property
    minZoom: number = 200;

    @property
    maxZoom: number = 800;

    private _camera: Camera | null = null;
    private _moveDirection: Vec3 = new Vec3();
    private _targetPosition: Vec3 = new Vec3();
    private _isMoving: boolean = false;

    start() {
        this._camera = this.getComponent(Camera);
        if (!this._camera) {
            console.error('CameraController requires a Camera component');
            return;
        }

        this._targetPosition = this.node.position.clone();
        this.initInput();
    }

    initInput() {
        // 键盘输入
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.on(Input.EventType.KEY_UP, this.onKeyUp, this);

        // 鼠标滚轮
        input.on(Input.EventType.MOUSE_WHEEL, this.onMouseWheel, this);
    }

    onKeyDown(event: EventKeyboard) {
        switch (event.keyCode) {
            case KeyCode.KEY_W:
            case KeyCode.ARROW_UP:
                this._moveDirection.y = 1;
                break;
            case KeyCode.KEY_S:
            case KeyCode.ARROW_DOWN:
                this._moveDirection.y = -1;
                break;
            case KeyCode.KEY_A:
            case KeyCode.ARROW_LEFT:
                this._moveDirection.x = -1;
                break;
            case KeyCode.KEY_D:
            case KeyCode.ARROW_RIGHT:
                this._moveDirection.x = 1;
                break;
        }
        this._isMoving = this._moveDirection.length() > 0;
    }

    onKeyUp(event: EventKeyboard) {
        switch (event.keyCode) {
            case KeyCode.KEY_W:
            case KeyCode.ARROW_UP:
            case KeyCode.KEY_S:
            case KeyCode.ARROW_DOWN:
                this._moveDirection.y = 0;
                break;
            case KeyCode.KEY_A:
            case KeyCode.ARROW_LEFT:
            case KeyCode.KEY_D:
            case KeyCode.ARROW_RIGHT:
                this._moveDirection.x = 0;
                break;
        }
        this._isMoving = this._moveDirection.length() > 0;
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
        if (!this._isMoving || !this._camera) return;

        // 移动相机
        const moveDistance = this.moveSpeed * deltaTime;
        const movement = new Vec3(
            this._moveDirection.x * moveDistance,
            this._moveDirection.y * moveDistance,
            0
        );

        const newPosition = this.node.position.clone();
        newPosition.add(movement);
        this.node.position = newPosition;
    }

    onDestroy() {
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.off(Input.EventType.KEY_UP, this.onKeyUp, this);
        input.off(Input.EventType.MOUSE_WHEEL, this.onMouseWheel, this);
    }
}
