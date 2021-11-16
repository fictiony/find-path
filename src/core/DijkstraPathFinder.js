// 【最短路径寻路算法】
// - 从起始节点出发，采用广度搜索，依次检测周围的节点，并加入开启列表（按优先级排序，路径越短越优先）
// - 每次从开启列表中取出最优先的节点，继续展开周围的新节点，并加入开启列表，当前节点则标记为关闭
// - 重复上述过程，直到展开到目标节点为止

import BasePathFinder from './BasePathFinder'
import SortedNodes from './SortedNodes'

// 比较节点优先级
function comparePriority (nodeA, nodeB) {
  return nodeA.priority - nodeB.priority
}

export default class DijkstraPathFinder extends BasePathFinder {
  openNodes = null // 节点开启列表
  stateVer = 0 // 当前寻路状态版本号（每次寻路递增1，这样可以省略节点开启关闭状态的重置处理）

  // 构造函数
  // - @options 功能选项增加：
  //    heapSort: 节点优先级是否采用二叉堆排序，否则用数组快速排序（当节点数多时二叉堆排序可显著提升性能），默认为true
  constructor (genNode, options = {}) {
    super(genNode, options)
    const heapSort = 'heapSort' in options ? options.heapSort : true
    this.openNodes = new SortedNodes(comparePriority, heapSort)
  }

  // 重置状态缓存（重载）
  // - @keepNodes 是否保留节点缓存（当地图障碍无变化时，可提升性能）
  reset (keepNodes = false) {
    this.openNodes.clear()
    if (keepNodes) {
      this.stateVer++
    } else {
      super.reset()
      this.stateVer = 0
    }
  }

  // 寻路（重载）
  findPath (startNode, targetNode) {
    this.reset(true)
    const ver = this.stateVer
    startNode.reset()

    // 从起始节点开始搜索
    for (let node = startNode; node; node = this.openNodes.pop()) {
      node.closeVer = ver

      // 到达目标点则结束寻路
      if (node === targetNode) {
        return this.backtrace(node).reverse()
      }

      // 将相邻节点加入开启列表
      this.getNeighbors(node).forEach(i => {
        if (node.closeVer === ver) continue

      })
    }

    return null
  }
}
