// 【测试寻路算法】
// - 个人研究测试中的寻路算法

import AStarPathFinder from './AStarPathFinder'

export default class TestPathFinder extends AStarPathFinder {
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
