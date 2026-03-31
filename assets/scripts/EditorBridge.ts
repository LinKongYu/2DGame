import { _decorator, Component, Node, director, game, Game, EventTarget } from 'cc';
const { ccclass, property } = _decorator;

/**
 * 编辑器桥接 - 处理编辑器与运行时的交互
 * 提供全局访问点和事件系统
 */
@ccclass('EditorBridge')
export class EditorBridge extends Component {

    // 全局事件系统
    static events: EventTarget = new EventTarget();

    // 单例访问
    private static _instance: EditorBridge | null = null;
    static get instance(): EditorBridge | null {
        return this._instance;
    }

    @property
    enableDebugInfo: boolean = true;

    onLoad() {
        // 设置单例
        if (EditorBridge._instance && EditorBridge._instance !== this) {
            console.warn('Multiple EditorBridge instances detected');
            return;
        }
        EditorBridge._instance = this;

        // 注册全局访问
        (window as any).gameAPI = this.createGameAPI();

        console.log('EditorBridge initialized');
    }

    /**
     * 创建游戏API供外部调用
     */
    createGameAPI() {
        return {
            // 场景控制
            reload: () => {
                director.loadScene(director.getScene()?.name || '');
            },

            // 获取当前场景信息
            getSceneInfo: () => {
                const scene = director.getScene();
                return {
                    name: scene?.name,
                    children: scene?.children.map(c => c.name)
                };
            },

            // 事件触发
            emit: (event: string, ...args: any[]) => {
                EditorBridge.events.emit(event, ...args);
            },

            // 事件监听
            on: (event: string, callback: Function) => {
                EditorBridge.events.on(event, callback);
            },

            // 日志
            log: (message: string) => {
                console.log('[Game]', message);
            }
        };
    }

    start() {
        // 监听游戏事件
        game.on(Game.EVENT_HIDE, () => {
            console.log('Game hidden');
        });

        game.on(Game.EVENT_SHOW, () => {
            console.log('Game shown');
        });
    }

    onDestroy() {
        if (EditorBridge._instance === this) {
            EditorBridge._instance = null;
        }
    }
}
