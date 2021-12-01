// 【双向A*寻路算法】
// - 从起点和终点同步开始进行A*寻路，直到两边的关闭节点相会

import BiDijkstraPathFinder from './BiDijkstraPathFinder'
import AStarPathFinder from './AStarPathFinder'

export default class BiAStarPathFinder extends BiDijkstraPathFinder {
  heuristic = null // 启发函数，格式为：(dx, dy) => 启发函数值，其中dx,dy为当前节点距离目标节点的横纵向距离
  startNode = null // 当前寻路的起始节点（启发函数要用到）
  targetNode = null // 当前寻路的目标节点（启发函数要用到）

  // 构造函数
  // - @options 功能选项增加：
  //    heuristic: 启发函数（亦可为内置启发函数名），默认为曼哈顿距离
  constructor (genNode, options = {}) {
    super(genNode, options)
    this.heuristic =
      typeof options.heuristic === 'function'
        ? options.heuristic
        : AStarPathFinder[options.heuristic] || AStarPathFinder.manhattan
  }

  // 寻路（重载）
  async findPath (startNode, targetNode) {
    this.startNode = startNode
    this.targetNode = targetNode
    return await super.findPath(startNode, targetNode)
  }

  // 计算节点优先级（重载）
  calcPriority (node) {
    if (node.openVer !== this.findPathVer || node.openSide !== this.side) {
      node.heurist = this.calcHeurist(node)
    }
    return Math.round((node.distance + node.heurist) * 1e8) * 1e-8 // 修正浮点误差，避免扩展无效节点
  }

  // 计算节点启发函数值（可重载）
  calcHeurist (node) {
    const { x, y } = this.side === 1 ? this.targetNode : this.startNode
    const dx = Math.abs(node.x - x)
    const dy = Math.abs(node.y - y)
    return this.heuristic(dx, dy)
  }

  // 节点优先级比较（重载）
  comparePriority (nodeA, nodeB) {
    return (
      nodeA.priority - nodeB.priority ||
      (nodeA.openSide === nodeB.openSide ? nodeA.heurist - nodeB.heurist : 0) || // 不同搜索端无法比较启发值
      nodeA.openIndex - nodeB.openIndex
    )
  }
}
