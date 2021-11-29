// 【测试寻路算法】
// - 个人研究测试中的寻路算法

import DualAStarPathFinder from './DualAStarPathFinder'

export default class TestPathFinder extends DualAStarPathFinder {
  // 计算节点启发函数值（重载）
  // calcHeurist (node) {
  //   const { x, y } = this.targetNode
  //   const dx = Math.abs(node.x - x)
  //   const dy = Math.abs(node.y - y)
  //   node.bias = Math.abs(dx - dy)
  //   return this.heuristic(dx, dy)
  // }

  // 节点优先级比较（重载）
  // comparePriority (nodeA, nodeB) {
  //   return (
  //     super.comparePriority(nodeA, nodeB) || nodeA.bias - nodeB.bias
  //   )
  // }
}
