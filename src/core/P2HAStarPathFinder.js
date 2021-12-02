// 【二次幂分层A*寻路算法】
// - 实验中，基本思路是：
// - 将地图按2x2、4x4、8x8等等2的幂次边长，依次分割成不同粒度的大格，不同边长对应不同层级，即第N层的每格边长为2^N
// - 先在起点终点位于不同大格的最高层级中进行A*寻路（相邻节点取大格边缘可到达的相邻小格，并缓存大格内路径，路径未知时先内部递归寻路，路径限制在大格内）
// - 将最高层级中的路径叠加上起点终点到大格边缘的部分路径，即为完整的路径
// - 由于每层大格内的路径可预先缓存，因此可以减少寻路过程的展开节点数，并提高路线的复用性，减少重复多次寻路的平均耗时
// - 缺点是只适用于标准直角网格类地图（否则没法实现分层合并大格）

import AStarPathFinder from './AStarPathFinder'
import SortedNodes from './SortedNodes'

export default class P2HAStarPathFinder extends AStarPathFinder {
  maxLayer = 0 // 最高层级（层数越多所占的缓存空间也会越多，但复用性也会越好）
  tempNodes = null // 递归寻路时用到的临时节点表

  // 构造函数
  // - @options 功能选项增加：
  //    maxLayer 最高层数（默认5）
  constructor (genNode, options = {}) {
    super(genNode, options)
    this.maxLayer = options.maxLayer || 3
  }

  // 获取指定ID的节点（重载）
  getNode (id) {
    return (this.tempNodes && this.tempNodes.get(id)) || super.getNode(id)
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
  // - @limitRange 递归寻路时限制搜索的大格范围（目标点例外）：{ minX: 最小X坐标, maxX: 最大X坐标, minY: 最小Y坐标, maxY: 最大Y坐标 }
  // - @return 若指定limitRange，则不再返回路径节点列表，而是返回路径长度（找不到路径和取消寻路时仍然返回null和undefined）
  async findPath (startNode, targetNode, limitRange) {
    if (limitRange) {
      // 若为递归寻路，则重建节点记录表
      this.openNodes = new SortedNodes(
        this.comparePriority,
        this.openNodes.heapSort
      )
      this.tempNodes = new Map()
      this.tempNodes.set(startNode.id, startNode)
      this.tempNodes.set(targetNode.id, targetNode)
    } else {
      this.reset(true)
    }
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
    if (openNotify && (await openNotify(startNode, 1))) return

    // 开始搜索
    const { tempNodes, updateNotify, closeNotify } = this
    let node
    while ((node = openNodes.pop())) {
      const { id, layer } = node
      console.log(`checkNode: ${id} (${node.parentId} @${layer}`)

      // 若为大格节点且之前尚无路径，则取缓存路径长度
      if (layer > 0 && !node.hasCachePath) {
        const parentNode = this.getNode(node.parentId)
        let distance = node.getCachePathDistance()

        // 若无缓存，则递归搜索大格内路径，并加缓存
        if (distance === undefined) {
          const minX = (parentNode.x >> layer) << layer
          const minY = (parentNode.y >> layer) << layer
          const size = 1 << layer
          const copyNode = node.clone()

          // 递归寻路
          console.log(
            `findPath: ${parentNode.id} -> ${
              node.id
            } in (${minX},${minY}-${minX + size - 1},${minY + size - 1})`
          )
          distance = await this.findPath(parentNode.clone(), copyNode, {
            minX,
            maxX: minX + size - 1,
            minY,
            maxY: minY + size - 1
          })

          // 恢复递归前搜索状态
          this.openNodes = openNodes
          this.tempNodes = tempNodes
          this.findPathVer = ver
          this.targetNode = targetNode

          // 缓存路径
          if (distance === undefined) return // 已取消寻路
          console.log(
            `cachePath: ${parentNode.id} -> ${node.id} = ${distance} (${copyNode.parentId} @${copyNode.layer})`
          )
          node.cachePath(node.parentId, copyNode.getCachePathLastId(), distance)
        }

        // 若无路径，则关闭节点，并忽略
        if (distance === null) {
          node.closeVer = ver
          if (closeNotify && (await closeNotify(node, 0))) return
          continue
        }

        // 更新节点状态
        const oldPriority = node.priority
        node.distance = parentNode.distance + distance
        node.priority = this.calcPriority(node)

        // 若节点优先级比原先低，则重新加回开启列表（视作更新）
        if (node.priority > oldPriority) {
          node.hasCachePath = true
          openNodes.push(node)
          if (updateNotify && (await updateNotify(node, 2))) return
          continue
        }
      }

      // 关闭节点
      node.closeVer = ver
      if (closeNotify && (await closeNotify(node, 0))) return

      // 到达目标点则结束寻路
      if (node === targetNode) {
        if (limitRange) return node.distance // 递归寻路时改为返回路径长度
        return this.backtrace(node).reverse()
      }

      // 将相邻节点加入开启列表
      const [neighbors, newLayer] = this.getNeighbors(node)
      let neighborHeurists
      for (let n of neighbors) {
        if (n.closeVer === ver) continue // 忽略已关闭的节点（因为其路径必然更短）
        const nId = n.id

        // 递归寻路时排除范围外的节点（目标点除外）
        if (limitRange && n !== targetNode) {
          if (n.x < limitRange.minX || n.x > limitRange.maxX) continue
          if (n.y < limitRange.minY || n.y > limitRange.maxY) continue
        }

        // 若相邻节点无路径，则忽略
        let cost = node.neighbors.get(nId)
        if (newLayer > 0 && cost == null) {
          cost = n.getCachePathDistance(id)
          if (cost === null) continue
        }
        console.log(
          `openNode: ${nId} = ${node.distance} + ${cost} (${id} @${newLayer})`
        )

        // 若相邻节点已开启且路径更短，也忽略？？
        const isOpen = n.openVer === ver
        let distance
        if (cost == null) {
          neighborHeurists ||= node.neighborsCache.get(newLayer)
          distance = node.distance + neighborHeurists.get(nId)
        } else {
          distance = node.distance + cost
        }
        if (isOpen && n.distance <= distance) continue

        // 更新相邻节点状态
        if (limitRange && !isOpen && !this.tempNodes.has(nId)) {
          n = n.clone() // 递归寻路时创建拷贝，避免影响最外层寻路状态
          this.tempNodes.set(nId, n)
        }
        n.layer = newLayer
        if (newLayer > 0) n.hasCachePath = cost != null
        n.parentId = id
        n.distance = distance
        n.priority = this.calcPriority(n)

        // 若已开启，则更新在列表中的顺序，否则加入开启列表
        n.openIndex = ++openIndex
        if (isOpen) {
          openNodes.update(n)
          if (updateNotify && (await updateNotify(n, 2))) return
        } else {
          n.openVer = ver
          openNodes.push(n)
          if (openNotify && (await openNotify(n, 1))) return
        }
      }
    }

    return null
  }

  // 回溯节点获取路径（重载）
  backtrace (node) {
    const path = [node]
    while (true) {
      node = this.getNode(node.getCachePathLastId())
      if (!node) break
      path.push(node)
    }
    return path
  }
}
