// 【双向最短路径寻路算法】
// - 从起点和终点同步开始进行最短路径寻路，直到两边的关闭节点相会

import DijkstraPathFinder from './DijkstraPathFinder'
import SortedNodes from './SortedNodes'

export default class DualDijkstraPathFinder extends DijkstraPathFinder {
  endOpenNodes = null // 终点开启节点有序列表

  // 构造函数
  constructor (genNode, options) {
    super(genNode, options)
    this.endOpenNodes = new SortedNodes(
      this.comparePriority,
      this.openNodes.heapSort
    )
  }

  // 重置状态缓存（重载）
  reset (keepNodes) {
    this.endOpenNodes.clear()
    super.reset(keepNodes)
  }

  // 寻路（重载）
  async findPath (startNode, targetNode) {
    this.reset(true)
    const ver = ++this.findPathVer

    // 将起始和目标节点加入开启列表
    const { openNodes, endOpenNodes, openNotify } = this
    startNode.reset()
    startNode.openVer = ver
    startNode.openSide = 1
    openNodes.push(startNode)
    if (openNotify && (await openNotify(startNode, 1))) return null
    targetNode.reset()
    targetNode.openVer = ver
    targetNode.openSide = 2
    endOpenNodes.push(targetNode)
    if (openNotify && (await openNotify(targetNode, 1))) return null

    // 开始搜索
    const { updateNotify, closeNotify } = this
    let side = (this.side = 1) // 当前搜索端：1-起点端/2-终点端
    let sideOpenNodes = openNodes
    let node
    let dualNode = targetNode
    while ((node = sideOpenNodes.pop())) {
      // 若当前节点优先级比对向节点低，则交换搜索端
      if (this.comparePriority(node, dualNode) > 0) {
        side = this.side = 3 - side
        sideOpenNodes = side === 1 ? openNodes : endOpenNodes
        const tmp = node
        node = dualNode
        dualNode = tmp
      }

      // 关闭节点
      if (node.closeVer === ver) {
        node.closeSide |= side
      } else {
        node.closeVer = ver
        node.closeSide = side
        node.closeInfo = null
      }
      if (closeNotify && (await closeNotify(node, 0))) return null

      // 若两端均关闭，则表示路径已闭合，可返回结果
      if (node.closeSide === 3) {
        return this.backtrace(node).reverse()
      }

      // 将相邻节点加入开启列表
      for (const n of this.getNeighbors(node)) {
        const isClose = n.closeVer === ver
        if (isClose && !!(n.closeSide & side)) continue // 忽略同搜索端已关闭的节点（因为其路径必然更短）

        // 若相邻节点已由对向搜索端开启且未关闭，则忽略（确保节点不会由两端同时开启）
        let isOpen = n.openVer === ver
        if (isOpen && n.openSide !== side) {
          if (!isClose) continue
          n.closeInfo ||= {
            side: n.closeSide,
            parentId: n.parentId,
            distance: n.distance
          }
          isOpen = false
        }

        // 若相邻节点已开启且路径更短，则忽略
        const distance = node.distance + node.neighbors.get(n.id)
        if (isOpen && n.distance <= distance) continue

        // 更新相邻节点状态
        n.parentId = node.id
        n.distance = distance
        n.priority = this.calcPriority(n)

        // 若已开启，则更新在列表中的顺序，否则加入开启列表
        if (isOpen) {
          sideOpenNodes.update(n)
          if (updateNotify && (await updateNotify(n, 2))) return null
        } else {
          sideOpenNodes.push(n)
          n.openVer = ver
          n.openSide = side
          if (openNotify && (await openNotify(n, 1))) return null
        }
      }
    }

    return null
  }

  // 回溯节点获取路径（重载）
  backtrace (node) {
    const path = [node]

    // 先回溯到终点
    let n = node
    while (n.parentId != null) {
      const { side, parentId } = n.closeInfo || {}
      n = this.nodes.get(side === 2 ? parentId : n.parentId)
      if (!n) break
      path.push(n)
    }

    // 调整终点距离
    path.reverse()
    path[0].distance = node.distance + node.closeInfo.distance

    // 再回溯到起点
    n = node
    while (n.parentId != null) {
      const { side, parentId } = n.closeInfo || {}
      n = this.nodes.get(side === 1 ? parentId : n.parentId)
      if (!n) break
      path.push(n)
    }

    return path
  }
}
