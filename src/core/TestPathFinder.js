// 【测试寻路算法】
// - 个人研究测试中的寻路算法

import P2HAStarPathFinder from './P2HAStarPathFinder'

export default class TestPathFinder extends P2HAStarPathFinder {
  // 计算节点启发函数值（重载）
  // calcHeurist (node) {
  //   const { x, y } = this.targetNode
  //   const dx = Math.abs(node.x - x)
  //   const dy = Math.abs(node.y - y)
  //   node.bias = Math.abs(dx - dy)
  //   return this.heuristic(dx, dy)
  // }

  // 计算节点启发函数值（重载）
  // calcHeurist (node) {
  //   return super.calcHeurist(node) ** 2 / node.distance
  // }
}
