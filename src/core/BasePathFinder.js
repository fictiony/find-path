// 【寻路算法基类】
import PathNode from './PathNode'

export default class BasePathFinder {
  genNode = null // 节点生成函数（当节点不在表中时调用），格式为：节点ID => PathNode对象或null（表示不可走）
  diagonalMove = 0 // 是否可走对角线
  nodes = {} // 节点表：{ 节点ID: 节点对象或null }

  // 构造函数
  // - @options 功能选项，可包含：
  //    diagonalMove: 是否可走对角线，可为：0-不可走（默认）/1-无阻挡可走/2-非全阻挡可走/3-始终可走
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
    this.nodes = {}
  }

  // 获取指定ID的节点
  getNode (id) {
    if (id in this.nodes) {
      return this.nodes[id]
    }
    const node = this.genNode(id)
    this.nodes[id] = node
    return node
  }

  // 获取指定坐标的节点
  getNodeAt (x, y) {
    return this.getNode(...PathNode.xyToId(x, y))
  }

  // TODO 获取相邻节点列表
  // - @node 中心节点
  // - @return 相邻节点列表（自动更新路径长度）
  getNeighbors (node) {
    const neighbors = []
    const { distance, cost } = node

    // 已指定则直接返回
    const dists = node.neighbors
    if (dists) {
      for (const id in dists) {
        const neighbor = this.getNode(id)
        neighbor.distance = distance + (dists[id] * (cost + neighbor.cost)) / 2
        neighbors.push(neighbor)
      }
    } else {
      // 按顺序查找四周
      // 5 1 6
      // 2 + 3
      // 7 4 8
      const { x, y } = node
      let n1, n2, n3, n4
      if ((n1 = this.getNodeAt(x, y - 1))) neighbors.push(n1)
      if ((n2 = this.getNodeAt(x - 1, y))) neighbors.push(n2)
      if ((n3 = this.getNodeAt(x + 1, y))) neighbors.push(n3)
      if ((n4 = this.getNodeAt(x, y + 1))) neighbors.push(n4)

      if (this.diagonalMove) {
        let n5, n6, n7, n8
        switch (this.diagonalMove) {
          case 1:
            n5 = !n1 || !n2
            n6 = !n1 || !n3
            n7 = !n2 || !n4
            n8 = !n3 || !n4
            break
          case 2:
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
    }

    return neighbors
  }

  // 寻路（需重载）
  // - @startNode 起始节点
  // - @targetNode 目标节点
  // - @return 若找到路径，则返回路径节点列表（含起始节点），否则返回null
  findPath (startNode, targetNode) {
    return null
  }

  // 回溯节点获取路径
  // - @node 末节点
  // - @return 路径节点列表（末节点在最前面）
  backtrace (node) {
    const path = [node]
    while (node.parentId != null) {
      node = this.nodes[node.parentId]
      if (!node) break
    }
    return path
  }
}
