
import * as Quadtree from "./quadtree.js";

const { ccclass, property } = cc._decorator;

class customObj {
    id: number;
    x: number;
    y: number;
    width: number;
    height: number;
    constructor(obj) {
        this.id = obj?.id;
        this.width = obj?.width;
        this.height = obj?.height;
        this.x = obj?.x;
        this.y = obj?.y;
    }
}

@ccclass
export default class NewClass extends cc.Component {

    @property(cc.Node)
    map: cc.Node = null;

    @property(cc.Label)
    nodeCountLabel: cc.Label = null;

    @property(cc.Node)
    view: cc.Node = null;

    @property(cc.Prefab)
    objPfb: cc.Prefab = null;

    // 
    _quadTree: Quadtree = null;
    // 
    _pool: cc.NodePool = null;

    _existCache: { [id: number]: cc.Node } = null;

    onLoad() {
        this.map.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.map.on(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this._pool = new cc.NodePool();
        this._existCache = {};
        this.initTree();
        this.ranObj();
    }

    onTouchStart() {
    }

    // 
    onTouchMove(event: cc.Event.EventTouch) {
        let touches = event.getTouches();
        if (touches.length >= 1) {
            this.dealMove(event);
        }
    }

    dealMove(event: cc.Event.EventTouch) {
        let dir = event.getDelta();
        this.map.x += dir.x;
        this.map.y += dir.y;
        this.refreshView();
    }

    initTree() {
        this._quadTree = new Quadtree({
            x: 0, y: 0, width: this.map.width, height: this.map.height,
        }, 0);
    }

    // 随机物块
    ranObj() {
        for (let i = 0; i < 1000; i++) {
            let o = new customObj({
                id: i,
                x: Math.random() * this.map.width,
                y: Math.random() * this.map.height,
                width: 20,
                height: 20,
            })
            this._quadTree.insert(o)
        }
    }


    // 上次物块
    private _lastObjs = [];
    refreshView() {
        let objs = [];
        let viewWpos = this.view.convertToWorldSpaceAR(cc.Vec2.ZERO);
        let viewInMapPos = this.map.convertToNodeSpaceAR(viewWpos);
        objs = this._quadTree.retrieve({
            x: viewInMapPos.x,
            y: viewInMapPos.y,
            width: this.view.width,
            height: this.view.height,
        })
        console.log("objs ====", objs.length)
        let oldObjs = this._lastObjs.filter(function (i) {
            return objs.indexOf(i) === -1
        })

        oldObjs.forEach(o => {
            let n = this._existCache[o.id];
            this.putItem(n);
        })
        console.log("要销毁的数量 ====", oldObjs.length);

        let newOBjs = objs.filter((i) => {
            return this._lastObjs.indexOf(i) === -1
        })
        console.log("新增的数量 ====", newOBjs.length);
        for (let i = 0, len = newOBjs.length; i < len; i++) {
            let obj = newOBjs[i];
            if (obj && obj?.id) {
                let n = this.getItem();
                n.parent = this.map;
                n.x = obj.x;
                n.y = obj.y;
                this._existCache[obj?.id] = n;
            }
        }
        this._lastObjs = objs;

    }

    getItem() {
        if (this._pool.size() === 0) {
            return cc.instantiate(this.objPfb);
        }
        else {
            return this._pool.get();
        }
    }

    putItem(n: cc.Node) {
        if (n) {
            n.removeFromParent();
            this._pool.put(n);
        }
    }

    protected update(dt: number): void {
        this.nodeCountLabel.string = "地图上的节点数量:" + this.map.childrenCount;
    }

}
