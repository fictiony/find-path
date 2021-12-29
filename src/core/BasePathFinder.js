// 【寻路算法基类】
import PathNode from './PathNode'

export default class BasePathFinder {
  findPathVer = 0 // 当前寻路版本号（每次寻路递增1，这样可以省略节点状态重置处理）
  genNode = null // 节点生成函数（当节点不在表中时调用），格式为：节点ID => PathNode对象或null（表示不可走）
  diagonalMove = 0 // 是否可走对角线
  nodes = new Map() // 节点表：{ 节点ID: 节点对象或null }

  // 构造函数
  // - @options 功能选项，可包含：
  //    diagonalMove: 是否可走对角线：0-不可走（默认）/1-无阻挡可走/2-非全阻挡可走/3-始终可走
  constructor (genNode, options = {}) {
    if (new.target === BasePathFinder) {
      throw new Error('基类不能实例化')
    }
    if (typeof genNode !== 'function') {
      throw new Error('必须提供节点生成函数')
    }
    this.genNode = genNode
    this.diagonalMove = options.diagonalMove || 0
  }

  // 重置状态缓存
  reset () {
    this.nodes.clear()
    this.findPathVer = 0
  }

  // 获取指定ID的节点
  getNode (id) {
    let node = this.nodes.get(id)
    if (node === undefined) {
      node = this.genNode(id) || null
      this.nodes.set(id, node)
    }
    return node
  }

  // 获取指定坐标的节点
  getNodeAt (x, y) {
    return this.getNode(PathNode.xyToId(x, y))
  }

  // 获取相邻节点列表
  // - @node 中心节点
  // - @return 相邻节点列表
  getNeighbors (node) {
    const neighbors = []

    // 已存在则直接获取节点，否则自动检测
    if (node.neighbors) {
      for (const id of node.neighbors.keys()) {
        neighbors.push(this.getNode(id))
      }
    } else {
      // 按顺序查找四周
      // 5 1 6
      // 2 + 3
      // 7 4 8
      const { x, y, cost } = node
      let n1, n2, n3, n4
      if ((n1 = this.getNodeAt(x, y - 1))) neighbors.push(n1)
      if ((n2 = this.getNodeAt(x - 1, y))) neighbors.push(n2)
      if ((n3 = this.getNodeAt(x + 1, y))) neighbors.push(n3)
      if ((n4 = this.getNodeAt(x, y + 1))) neighbors.push(n4)

      // 可走对角线
      if (this.diagonalMove) {
        let n5, n6, n7, n8
        switch (this.diagonalMove) {
          case 1: // 无阻挡可走
            n5 = !n1 || !n2
            n6 = !n1 || !n3
            n7 = !n2 || !n4
            n8 = !n3 || !n4
            break
          case 2: // 非全阻挡可走
            n5 = !n1 && !n2
            n6 = !n1 && !n3
            n7 = !n2 && !n4
            n8 = !n3 && !n4
            break
        }
        if (!n5 && (n5 = this.getNodeAt(x - 1, y - 1))) neighbors.push(n5)
        if (!n6 && (n6 = this.getNodeAt(x + 1, y - 1))) neighbors.push(n6)
        if (!n7 && (n7 = this.getNodeAt(x - 1, y + 1))) neighbors.push(n7)
        if (!n8 && (n8 = this.getNodeAt(x + 1, y + 1))) neighbors.push(n8)
      }

      // 更新相邻节点距离表
      const stepCosts = new Map()
      for (const n of neighbors) {
        const step = n.x === x || n.y === y ? 0.5 : Math.SQRT1_2
        stepCosts.set(n.id, (cost + n.cost) * step)
      }
      node.neighbors = stepCosts
    }

    return neighbors
  }

  // 寻路（需重载）
  // - @startNode 起始节点
  // - @targetNode 目标节点
  // - @return 若找到路径，则返回路径节点列表（含起始节点），否则返回null，取消时返回undefined
  async findPath (startNode, targetNode) {
    ++this.findPathVer
    throw new Error('请重载findPath方法')
  }

  // 回溯节点获取路径
  // - @node 末节点
  // - @return 路径节点列表（末节点在最前面）
  backtrace (node) {
    const path = [node]
    while (node.parentId != null) {
      node = this.getNode(node.parentId)
      if (!node) break
      path.push(node)
    }
    return path
  }
}
