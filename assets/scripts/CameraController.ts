import { _decorator, Component, Camera, Vec3, Vec2, Node, input, Input, EventMouse, math } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('CameraController')
export class CameraController extends Component {

    @property
    zoomSpeed: number = 0.1;

    @property
    panSpeed: number = 1;

    @property
    dragScaleCompensation: number = 1;

    @property
    minZoom: number = 0.1;

    @property
    maxZoom: number = 10.0;

    @property(Node)
    groundNode: Node = null!;

    private _ground: Node | null = null;
    private _currentScale: number = 1.0;

    private _isDragging: boolean = false;
    private _lastMousePos: Vec2 = new Vec2();
    private _dragButtonMask: number = 0;

    start() {
        this._ground = this.groundNode;
        if (!this._ground) {
            console.warn(`CameraController: Ground node not found as child of camera`);
            return;
        }

        this._currentScale = 1.0;
        const initPos = this._ground.position.clone();
        this._ground.setScale(this._currentScale, this._currentScale, 1);
        this._ground.setPosition(initPos);

        this.initInput();
    }

    initInput() {
        input.on(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
        input.on(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
        input.on(Input.EventType.MOUSE_UP, this.onMouseUp, this);

        input.on(Input.EventType.MOUSE_WHEEL, this.onMouseWheel, this);
    }

    onMouseDown(event: EventMouse) {
        const button = event.getButton();
        if (button === EventMouse.BUTTON_LEFT || button === EventMouse.BUTTON_RIGHT) {
            this._dragButtonMask |= 1 << button;
            this._isDragging = true;
            this._lastMousePos.set(event.getLocationX(), event.getLocationY());
        }
    }

    onMouseMove(event: EventMouse) {
        if (!this._isDragging || !this._ground) return;

        const currentX = event.getLocationX();
        const currentY = event.getLocationY();

        const deltaX = currentX - this._lastMousePos.x;
        const deltaY = currentY - this._lastMousePos.y;

        this._lastMousePos.set(currentX, currentY);

        const currentPos = this._ground.position;
        const compensation = Math.pow(this._currentScale, -this.dragScaleCompensation);
        const moveFactor = this.panSpeed * compensation;
        const newX = currentPos.x + deltaX * moveFactor;
        const newY = currentPos.y + deltaY * moveFactor;

        this._ground.setPosition(newX, newY, currentPos.z);
    }

    onMouseUp(event: EventMouse) {
        const button = event.getButton();
        if (button === EventMouse.BUTTON_LEFT || button === EventMouse.BUTTON_RIGHT) {
            this._dragButtonMask &= ~(1 << button);
            this._isDragging = this._dragButtonMask !== 0;
        }
    }

    onMouseWheel(event: EventMouse) {
        if (!this._ground) return;

        const scrollY = event.getScrollY();
        if (scrollY === 0) {
            return;
        }

        const direction = scrollY > 0 ? 1 : -1;
        const zoomFactor = 1 + this.zoomSpeed * direction;
        const lockedPos = this._ground.position.clone();
        this._currentScale = math.clamp(this._currentScale * zoomFactor, this.minZoom, this.maxZoom);
        this._ground.setScale(this._currentScale, this._currentScale, 1);
        this._ground.setPosition(lockedPos);
    }

    onDestroy() {
        input.off(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
        input.off(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
        input.off(Input.EventType.MOUSE_UP, this.onMouseUp, this);
        input.off(Input.EventType.MOUSE_WHEEL, this.onMouseWheel, this);
    }
}
