// 【寻路总模块】
import AStarPathFinder from './AStarPathFinder'
import DijkstraPathFinder from './DijkstraPathFinder'
import PathNode from './PathNode'

// 创建节点生成函数
// - @width, height 地图宽高
// - @states 格子状态表
function makeGenNode (width, height, states) {
  return id => {
    const [x, y] = PathNode.idToXY(id)
    if (x < 0 || x >= width || y < 0 || y >= height) return null
    const state = states[x + y * width] || 0
    if (state > 100) return null
    const cost = Math.exp(state / 20)
    return new PathNode(x, y, cost)
  }
}

export { AStarPathFinder, DijkstraPathFinder, makeGenNode }
