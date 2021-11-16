// 【A*寻路算法】
// - 最短路径寻路算法的改进版本，开启节点的优先级按可选的启发函数来调整，值越小的越优先
// - 优先级计算公式为：路径长度 + 启发函数值
// - 常用启发函数值有（dx、dy为当前节点距离终点的横坐标和纵坐标差）：
//   1. 曼哈顿距离（dx + dy）
//   2. 欧几里德距离（sqrt(dx² + dy²)）
//   3. 45°角距离（|dx - dy| + min(dx, dy) * √2）
//   2. 切比雪夫距离（max(dx + dy)）

import DijkstraPathFinder from './DijkstraPathFinder'

const SQRT2_1 = Math.SQRT2 - 1

export default class AStarPathFinder extends DijkstraPathFinder {
  heuristic = null // 启发函数

  // 构造函数
  // - @options 功能选项增加：
  //    heuristic: 启发函数，默认为曼哈顿距离
  constructor (genNode, options = {}) {
    super(genNode, options)
    this.heuristic = options.heuristic || AStarPathFinder.manhattan
  }

  // 曼哈顿距离
  static manhattan (dx, dy) {
    return dx + dy
  }

  // 欧几里德距离
  static euclidean (dx, dy) {
    return Math.hypot(dx, dy)
  }

  // 45°角距离
  static octile (dx, dy) {
    return dx < dy ? dx * SQRT2_1 + dy : dx + dy * SQRT2_1
  }

  // 切比雪夫距离
  static chebyshev (dx, dy) {
    return Math.max(dx, dy)
  }
}
