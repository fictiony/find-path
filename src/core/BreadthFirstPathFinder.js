// 【广度优先寻路算法】
// - 从起始节点出发，采用广度搜索，依次检测周围的节点，并加入开启队列
// - 每次从开启队列中取出最早加入的节点，继续展开周围的新节点，并加入开启队列，当前节点则标记为关闭
// - 重复上述过程，直到展开到目标节点为止
// - 和最短路径寻路（Dijkstra算法）相比，其展开节点的顺序并不依赖路径长度排序，而仅取决于节点展开的次序，因此当对角可走或节点消耗系数不为1时，最终得到的不是最优解
// - 但在对角不可走且节点消耗系数固定为1时，由于其不需要对开启节点进行排序，因此可以比最短路径寻路性能略高

import BasePathFinder from './BasePathFinder'

export default class BreadthFirstPathFinder extends BasePathFinder {
  openNodes = [] // 开启节点队列
  closeIndex = -1 // 关闭节点序号
  openNotify = null // 节点开启通知函数，格式为：(节点, 类型=1) => 是否取消寻路
  closeNotify = null // 节点关闭通知函数，格式为：(节点, 类型=0) => 是否取消寻路

  // 构造函数
  // - @options 功能选项增加：
  //    openNotify: 节点开启通知函数（可选）
  //    closeNotify: 节点关闭通知函数（可选）
  constructor (genNode, options = {}) {
    super(genNode, options)
    this.openNotify = options.openNotify || null
    this.closeNotify = options.closeNotify || null
  }

  // 重置状态缓存（重载）
  // - @keepNodes 是否保留节点缓存（当地图障碍无变化时，可提升性能）
  reset (keepNodes = false) {
    this.openNodes.length = 0
    this.closeIndex = -1
    if (!keepNodes) {
      super.reset()
    }
  }

  // 寻路（重载）
  async findPath (startNode, targetNode) {
    this.reset(true)
    const ver = ++this.findPathVer

    // 将起始节点加入开启列表
    const { openNodes, openNotify } = this
    startNode.reset()
    startNode.openVer = ver
    openNodes.push(startNode)
    if (openNotify && (await openNotify(startNode, 1))) return

    // 开始搜索
    const { closeNotify } = this
    let node
    while ((node = openNodes[++this.closeIndex])) {
      if (closeNotify && (await closeNotify(node, 0))) return

      // 到达目标点则结束寻路
      if (node === targetNode) {
        return this.backtrace(node).reverse()
      }

      // 将相邻节点加入开启队列
      for (const n of this.getNeighbors(node)) {
        if (n.openVer === ver) continue // 忽略已开启的节点

        // 更新相邻节点状态
        n.parentId = node.id
        n.distance = node.distance + node.neighbors.get(n.id)

        // 加入开启队列
        n.openVer = ver
        openNodes.push(n)
        if (openNotify && (await openNotify(n, 1))) return
      }
    }

    return null
  }
}
