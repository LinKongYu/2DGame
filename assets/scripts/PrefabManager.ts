import { _decorator, Component, Node, Prefab, instantiate } from 'cc';
import { SimpleItemFactory } from './SimpleItemFactory';
import { PlaceableItem } from './PlaceableItem';
const { ccclass, property } = _decorator;

/**
 * 预制体管理器 - 负责创建和管理物品预制体
 * 在场景启动时自动生成测试用的预制体
 */
@ccclass('PrefabManager')
export class PrefabManager extends Component {

    @property([Node])
    generatedPrefabs: Node[] = [];

    start() {
        this.generatePrefabs();
    }

    /**
     * 生成预制体
     */
    generatePrefabs() {
        // 创建房屋预制体
        const housePrefab = SimpleItemFactory.createHouse('House');
        this.setupPrefab(housePrefab);
        this.generatedPrefabs.push(housePrefab);

        // 创建树木预制体
        const treePrefab = SimpleItemFactory.createTree('Tree');
        this.setupPrefab(treePrefab);
        this.generatedPrefabs.push(treePrefab);

        // 创建石块预制体
        const rockPrefab = SimpleItemFactory.createRock('Rock');
        this.setupPrefab(rockPrefab);
        this.generatedPrefabs.push(rockPrefab);

        // 禁用预制体节点（它们只是模板）
        this.generatedPrefabs.forEach(prefab => {
            prefab.active = false;
        });

        console.log(`Generated ${this.generatedPrefabs.length} prefabs`);

        // 通知PlacementSystem
        this.notifyPlacementSystem();
    }

    /**
     * 设置预制体
     */
    setupPrefab(node: Node) {
        // 确保节点有这个标签，方便查找
        node.parent = this.node;
    }

    /**
     * 通知放置系统有新的预制体
     */
    notifyPlacementSystem() {
        // 使用事件系统或直接查找PlacementSystem
        // 这里简化处理，让PlacementSystem自己查找PrefabManager
    }

    /**
     * 获取指定索引的预制体
     */
    getPrefab(index: number): Node | null {
        if (index < 0 || index >= this.generatedPrefabs.length) {
            return null;
        }
        return this.generatedPrefabs[index];
    }

    /**
     * 获取所有预制体
     */
    getAllPrefabs(): Node[] {
        return this.generatedPrefabs;
    }

    /**
     * 实例化预制体
     */
    instantiatePrefab(index: number): Node | null {
        const prefab = this.getPrefab(index);
        if (!prefab) return null;

        const instance = instantiate(prefab);
        instance.active = true;
        return instance;
    }
}
