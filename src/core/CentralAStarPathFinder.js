// 【中心线A*寻路算法】
// - 由于A*寻路算法在展开节点时只考虑已走路径的距离和预估距离的影响，因此得到的最优路径虽然在距离上是最短的，但在形状上却往往并不符合人的思维
// - 为了让找到的路径尽量靠近起止点间的连线（即中心线），故在A*基础上增加了对节点展开顺序的优化
// - 基本思想就是：
//   1. 优先展开更靠近中心线的节点
//   2. 节点优先级排序中也加入对偏离中心线的累计量作次级参考

import AStarPathFinder from './AStarPathFinder'

export default class CentralAStarPathFinder extends AStarPathFinder {
  // 寻路（重载）
  async findPath (startNode, targetNode) {
    const dx = targetNode.x - startNode.x
    const dy = targetNode.y - startNode.y
    const d = Math.hypot(dx, dy)
    this.cos = dx / d
    this.sin = dy / d
    return super.findPath(startNode, targetNode)
  }

  // 计算节点优先级（重载）
  calcPriority (node) {
    const { x, y } = this.targetNode
    const parentNode = this.getNode(node.parentId)

    // 用偏离中心线的距离和加上剩余直线距离作为优先级排序
    const bias = Math.abs((node.x - x) * this.sin - (node.y - y) * this.cos)
    node.bias = (parentNode.bias || 0) + bias
    if (node.openVer !== this.findPathVer) {
      node.biasHeurist = Math.hypot(node.x - x, node.y - y)
    }
    node.biasPriority = node.bias + node.biasHeurist

    return super.calcPriority(node)
  }

  // 节点优先级比较（重载）
  comparePriority (nodeA, nodeB) {
    return (
      nodeA.priority - nodeB.priority ||
      nodeA.biasPriority - nodeB.biasPriority ||
      nodeA.heurist - nodeB.heurist ||
      nodeA.openIndex - nodeB.openIndex
    )
  }
}
