// 【二次幂分层A*寻路算法】
// - 实验中，基本思路是：
// - 将地图按2x2、4x4、8x8等等2的幂次边长，依次分割成不同粒度的大格，不同边长对应不同层级，即第N层的每格边长为2^N
// - 先在起点终点位于不同大格的最高层级中进行A*寻路（相邻节点取大格边缘可到达的相邻小格，并缓存大格内路径，路径未知时先内部递归寻路，路径限制在大格内）
// - 将最高层级中的路径叠加上起点终点到大格边缘的部分路径，即为完整的路径
// - 由于每层大格内的路径可预先缓存，因此可以减少寻路过程的展开节点数，并提高路线的复用性，减少重复多次寻路的平均耗时
// - 缺点是只适用于标准直角网格类地图（否则没法实现分层合并大格）

import AStarPathFinder from './AStarPathFinder'

export default class P2HAStarPathFinder extends AStarPathFinder {
  maxLayer = 0 // 最高层级（层数越多所占的缓存空间也会越多，但复用性也会越好）

  // 构造函数
  // - @options 功能选项增加：
  //    maxLayer 最高层数（默认5）
  constructor (genNode, options = {}) {
    super(genNode, options)
    this.maxLayer = options.maxLayer || 3
  }

  // 获取相邻节点列表（重载）
  // - @return [ 相邻节点列表, 当前层级 ]
  getNeighbors (node) {
    const { x, y } = node
    const { x: tx, y: ty } = this.targetNode
    const neighbors = node.neighbors ? null : super.getNeighbors(node) // 确保node.neighbors已存在

    // 先判断可用的最大层级（需满足和目标点不在同一大格，且层级不超过当前层级+1）
    for (let i = Math.min(this.maxLayer, node.layer + 1); i > 0; i--) {
      const lx = x >> i
      const ly = y >> i
      const ltx = tx >> i
      const lty = ty >> i
      if (lx === ltx && ly === lty) continue

      // 取该层级大格的边缘小格作为相邻节点
      return [this.getLayerNeighbors(node, i), i]
    }

    // 若无可用的大格，则返回小格本身的邻格
    return [neighbors || super.getNeighbors(node), 0]
  }

  // 获取指定层级的相邻节点列表
  // - @node 中心节点
  // - @layer 指定层级
  // - @return 相邻节点列表
  getLayerNeighbors (node, layer) {
    const neighbors = []

    // 已有缓存则直接获取节点，否则自动检测边缘小格
    const cache = node.getCacheNeighbors(layer)
    if (cache) {
      for (const id of cache.keys()) {
        neighbors.push(this.getNode(id))
      }
    } else {
      // 按顺序查找四周
      // 5 1 .. 1 6
      // 2 +      3
      // :        :
      // 2        3
      // 7 4 .. 4 8
      const { x, y } = node
      const x0 = (x >> layer) << layer
      const y0 = (y >> layer) << layer
      const a = 1 << layer
      let n
      for (let i = a - 1; i >= 0; i--) {
        if ((n = this.getNodeAt(x0 + i, y0 - 1))) neighbors.push(n)
        if ((n = this.getNodeAt(x0 - 1, y0 + i))) neighbors.push(n)
        if ((n = this.getNodeAt(x0 + a, y0 + i))) neighbors.push(n)
        if ((n = this.getNodeAt(x0 + i, y0 + a))) neighbors.push(n)
      }

      // 可走对角线（无需检测阻挡）
      if (this.diagonalMove) {
        if ((n = this.getNodeAt(x0 - 1, y0 - 1))) neighbors.push(n)
        if ((n = this.getNodeAt(x0 + a, y0 - 1))) neighbors.push(n)
        if ((n = this.getNodeAt(x0 - 1, y0 + a))) neighbors.push(n)
        if ((n = this.getNodeAt(x0 + a, y0 + a))) neighbors.push(n)
      }

      // 更新相邻节点缓存
      const cache = new Map()
      for (const n of neighbors) {
        const dx = Math.abs(n.x - x)
        const dy = Math.abs(n.y - y)
        cache.set(n.id, this.heuristic(dx, dy))
      }
      node.cacheNeighbors(layer, cache)
    }

    return neighbors
  }

  // 寻路（重载）
  async findPath (startNode, targetNode) {
    this.reset(true)
    const ver = ++this.findPathVer
    let openIndex = 0
    this.targetNode = targetNode

    // 将起始节点加入开启列表
    const { openNodes, openNotify } = this
    startNode.reset()
    startNode.openVer = ver
    startNode.openIndex = ++openIndex
    startNode.layer = -1
    openNodes.push(startNode)
    if (openNotify && (await openNotify(startNode, 1))) return null

    // 开始搜索
    const { updateNotify, closeNotify } = this
    let node
    while ((node = openNodes.pop())) {
      const nodeId = node.id

      // 若节点无缓存路径，则先搜索大格内路径
      if (!node.hasCachePath()) {
        // TODO 递归搜索大格内路径
        continue
      } else {
        // 否则关闭节点
        node.closeVer = ver
        if (closeNotify && (await closeNotify(node, 0))) return null

        // 到达目标点则结束寻路
        if (node === targetNode) {
          return this.backtrace(node).reverse()
        }
      }

      // 将相邻节点加入开启列表
      const [neighbors, layer] = this.getNeighbors(node)
      const costs = layer > 0 ? node.neighborsCache.get(layer) : node.neighbors
      for (const n of neighbors) {
        if (n.closeVer === ver) continue // 忽略已关闭的节点（因为其路径必然更短）

        // 若相邻节点已开启且路径更短，则忽略
        const isOpen = n.openVer === ver
        const distance = node.distance + (layer > 0 ? 0 : costs.get(n.id)) // 对于大格相邻节点的距离尚未知
        if (isOpen && n.distance <= distance) continue

        // 更新相邻节点状态
        n.layer = layer
        n.parentId = nodeId
        n.distance = distance
        if (layer > 0) {
          n.priority = this.calcPriority(n) + costs.get(n.id) // 对于大格还要叠加相邻节点的启发值
        } else {
          n.priority = this.calcPriority(n)
          n.cacheParent(nodeId, nodeId)
        }

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

  // 回溯节点获取路径（重载）
  backtrace (node) {
    const path = [node]
    while (true) {
      node = this.nodes.get(node.getCacheParentId())
      if (!node) break
      path.push(node)
    }
    return path
  }
}
