// 【双向最近优先寻路算法】
// - 从起点和终点同步开始进行最近优先寻路，直到两边的关闭节点相会

import BiAStarPathFinder from './BiAStarPathFinder'

export default class BiBestFirstPathFinder extends BiAStarPathFinder {
  heuristWeight = 1 // 启发值权重

  // 构造函数
  // - @options 功能选项增加：
  //    heuristWeight: 启发值权重，默认为10000
  constructor (genNode, options = {}) {
    super(genNode, options)
    this.heuristWeight =
      'heuristWeight' in options ? options.heuristWeight : 10000
  }

  // 计算节点启发函数值（重载）
  calcHeurist (node) {
    return super.calcHeurist(node) * this.heuristWeight
  }
}
