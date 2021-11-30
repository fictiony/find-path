// 【分层细化A*寻路算法】
// - 实验中，基本思路是：
// - 将地图按2x2、4x4、8x8等等2的幂次边长，依次分割成不同粒度的大格，不同边长对应不同层次，即第n层的每格边长为2^n（类似于Mipmap）
// - 先在起点终点位于不同格的最高层中进行A*寻路（每个大格的相邻大格根据其每边的相邻小格连接情况来判断，大格额外缓存节点信息）
// - 找到大格中的最佳路径后，再叠加上起点终点到大格边缘的部分路径，即得到完整的最佳路径
// - 由于每层大格内的路径可预先缓存，因此可以减少寻路过程的展开节点数，并提高路线的复用性，减少重复多次寻路的平均耗时

import AStarPathFinder from './AStarPathFinder'
import PathNode from './PathNode'

export default class MipmapAStarPathFinder extends AStarPathFinder {
  layerNodes = [] // 各层节点表，每项为：{ 节点ID: 节点对象或null }，节点ID怎么算？x,y,sideIndex
  maxLayer = 0 // 最高层数（层数越多所占的缓存空间也会越多，但性能也会越好）

  // 构造函数
  // - @options 功能选项增加：
  //    maxLayer 最高层数（默认5）
  constructor (genNode, options = {}) {
    super(genNode, options)
    this.maxLayer = options.maxLayer || 5
    for (let i = 1; i <= this.maxLayer; i++) {
      this.layerNodes[i] = new Map()
    }
  }

  // 重置状态缓存（重载）
  reset (keepNodes = false) {
    super.reset(keepNodes)
    if (!keepNodes) {
      this.layerNodes.forEach(i => i && i.clear())
    }
  }

  // 获取指定ID的节点（重载）
  // - @layer 所在层序号
  getNode (id, layer = 0) {
    let node = layer > 0 ? this.layerNodes[layer].get(id) : super.getNode(id)
    if (node === undefined) {
      node = new PathNode(id) // TODO 计算cost
      this.layerNodes[layer].set(id, node)
    }
    return node
  }

  // 获取相邻节点列表（重载）
  // - @layer 所在层序号
  getNeighbors (node, layer = 0) {
    // TODO
  }

  // 寻路（重载）
  async findPath (startNode, targetNode) {
    this.targetNode = targetNode
    this.reset(true)
    const ver = ++this.findPathVer
    let openIndex = 0

    // 将起始节点加入开启列表
    const { openNodes, openNotify } = this
    startNode.reset()
    startNode.openVer = ver
    startNode.openIndex = ++openIndex
    openNodes.push(startNode)
    if (openNotify && (await openNotify(startNode, 1))) return null

    // 开始搜索
    const { updateNotify, closeNotify } = this
    let node
    while ((node = openNodes.pop())) {
      node.closeVer = ver
      if (closeNotify && (await closeNotify(node, 0))) return null

      // 到达目标点则结束寻路
      if (node === targetNode) {
        return this.backtrace(node).reverse()
      }

      // 将相邻节点加入开启列表
      for (const n of this.getNeighbors(node)) {
        if (n.closeVer === ver) continue // 忽略已关闭的节点（因为其路径必然更短）

        // 若相邻节点已开启且路径更短，则忽略
        const isOpen = n.openVer === ver
        const distance = node.distance + node.neighbors.get(n.id)
        if (isOpen && n.distance <= distance) continue

        // 更新相邻节点状态
        n.parentId = node.id
        n.distance = distance
        n.priority = this.calcPriority(n)

        // 若已开启，则更新在列表中的顺序，否则加入开启列表
        n.openIndex = ++openIndex
        if (isOpen) {
          openNodes.update(n)
          if (updateNotify && (await updateNotify(n, 2))) return null
        } else {
          n.openVer = ver
          openNodes.push(n)
          if (openNotify && (await openNotify(n, 1))) return null
        }
      }
    }

    return null
  }
}
