// 【最短路径寻路算法】
// - 从起始节点出发，采用广度搜索，依次检测周围的节点，并加入开启列表（按优先级排序，路径越短越优先）
// - 每次从开启列表中取出最优先的节点，继续展开周围的新节点，并加入开启列表，当前节点则标记为关闭
// - 重复上述过程，直到展开到目标节点为止

import BasePathFinder from './BasePathFinder'
import SortedNodes from './SortedNodes'

export default class DijkstraPathFinder extends BasePathFinder {
  openNodes = null // 开启节点有序列表
  openNotify = null // 节点开启通知函数，格式为：(节点, 类型=1) => 是否取消寻路
  updateNotify = null // 节点更新通知函数，格式为：(节点, 类型=2) => 是否取消寻路
  closeNotify = null // 节点关闭通知函数，格式为：(节点, 类型=0) => 是否取消寻路

  // 构造函数
  // - @options 功能选项增加：
  //    heapSort: 节点优先级是否采用二叉堆排序，否则用数组快速排序（当节点数多时二叉堆排序可显著提升性能），默认为true
  //    openNotify: 节点开启通知函数（可选）
  //    updateNotify: 节点更新通知函数（可选）
  //    closeNotify: 节点关闭通知函数（可选）
  constructor (genNode, options = {}) {
    super(genNode, options)
    const heapSort = 'heapSort' in options ? options.heapSort : true
    this.openNodes = new SortedNodes(this.comparePriority, heapSort)
    this.openNotify = options.openNotify || null
    this.updateNotify = options.updateNotify || null
    this.closeNotify = options.closeNotify || null
  }

  // 重置状态缓存（重载）
  // - @keepNodes 是否保留节点缓存（当地图障碍无变化时，可提升性能）
  reset (keepNodes = false) {
    this.openNodes.clear()
    if (!keepNodes) {
      super.reset()
    }
  }

  // 寻路（重载）
  async findPath (startNode, targetNode) {
    this.reset(true)
    startNode.reset()
    const ver = ++this.findPathVer

    // 从起始节点开始搜索
    const { openNodes, openNotify, updateNotify, closeNotify } = this
    for (let node = startNode; node; node = openNodes.pop()) {
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
        if (isOpen) {
          openNodes.update(n)
          if (updateNotify && (await updateNotify(n, 2))) return null
        } else {
          openNodes.push(n)
          n.openVer = ver
          if (openNotify && (await openNotify(n, 1))) return null
        }
      }
    }

    return null
  }

  // 计算节点优先级（可重载）
  calcPriority (node) {
    return node.distance
  }

  // 节点优先级比较（可重载）
  comparePriority (nodeA, nodeB) {
    return nodeA.priority - nodeB.priority
  }
}
