import { _decorator, Component, input, Input, EventKeyboard, KeyCode, find, director, Node } from 'cc';
import { GridManager } from './GridManager';
const { ccclass, property } = _decorator;

@ccclass('KeyboardMover')
export class KeyboardMover extends Component {
    @property
    moveSpeed: number = 200;

    @property(GridManager)
    gridManager: GridManager | null = null;

    private _pressedKeys: Set<KeyCode> = new Set();
    private _gridManager: GridManager | null = null;

    start() {
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.on(Input.EventType.KEY_UP, this.onKeyUp, this);

        this._gridManager = this.resolveGridManager();

        if (!this._gridManager) {
            console.warn('KeyboardMover: GridManager not found, water blocking disabled');
        }
    }

    private resolveGridManager(): GridManager | null {
        if (this.gridManager) {
            return this.gridManager;
        }

        const directNode =
            find('WorldRoot/World/TiledMap/GridManager') ||
            find('WorldRoot/GridManager') ||
            find('GameWorld/GridManager') ||
            find('GridManager');

        const directComponent = directNode?.getComponent(GridManager) ?? null;
        if (directComponent) {
            return directComponent;
        }

        const scene = director.getScene();
        if (!scene) {
            return null;
        }

        const stack: Node[] = [...scene.children];
        while (stack.length > 0) {
            const node = stack.pop()!;
            const component = node.getComponent(GridManager);
            if (component) {
                return component;
            }
            for (const child of node.children) {
                stack.push(child);
            }
        }

        return null;
    }

    onKeyDown(event: EventKeyboard) {
        this._pressedKeys.add(event.keyCode);
    }

    onKeyUp(event: EventKeyboard) {
        this._pressedKeys.delete(event.keyCode);
    }

    update(deltaTime: number) {
        let dx = 0;
        let dy = 0;

        if (this._pressedKeys.has(KeyCode.KEY_W) || this._pressedKeys.has(KeyCode.ARROW_UP)) {
            dy += 1;
        }
        if (this._pressedKeys.has(KeyCode.KEY_S) || this._pressedKeys.has(KeyCode.ARROW_DOWN)) {
            dy -= 1;
        }
        if (this._pressedKeys.has(KeyCode.KEY_A) || this._pressedKeys.has(KeyCode.ARROW_LEFT)) {
            dx -= 1;
        }
        if (this._pressedKeys.has(KeyCode.KEY_D) || this._pressedKeys.has(KeyCode.ARROW_RIGHT)) {
            dx += 1;
        }

        if (dx !== 0 || dy !== 0) {
            const pos = this.node.position;
            const nextX = pos.x + dx * this.moveSpeed * deltaTime;
            const nextY = pos.y + dy * this.moveSpeed * deltaTime;

            if (this._gridManager) {
                if (this._gridManager.isWaterAtWorld(nextX, nextY)) {
                    return;
                }
            }

            this.node.setPosition(nextX, nextY, pos.z);
        }
    }

    onDestroy() {
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.off(Input.EventType.KEY_UP, this.onKeyUp, this);
    }
}
