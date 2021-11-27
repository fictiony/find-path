// 【测试寻路算法】
// - 个人研究测试中的寻路算法

import AStarPathFinder from './AStarPathFinder'

export default class TestPathFinder extends AStarPathFinder {
  // 寻路（重载）
  async findPath (startNode, targetNode) {
    const { x, y } = targetNode
    const { heuristic } = this
    this.calcHeurist = node => {
      return heuristic(Math.abs(node.x - x), Math.abs(node.y - y))
    }
    return await super.findPath(startNode, targetNode)
  }

  // 计算节点优先级（重载）
  // calcPriority (node) {
  //   return super.calcPriority(node)
  // }

  // 计算节点启发函数值（可重载）
  calcHeurist (node) {
    console.log(123)
  }
}
