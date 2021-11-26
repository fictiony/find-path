// 【最近优先寻路算法】
// - 最近优先寻路算法是A*寻路算法的变种，区别只是提升了启发函数值在优先级计算中的权重（即：f = g + h * w），但可能会导致最终得到的不是最优解
// - 当启发值权重为1时，最近优先寻路算法就等价于A*寻路算法
// - 当启发值权重为0时，最近优先寻路算法就等价于最短路径寻路算法

import AStarPathFinder from './AStarPathFinder'

export default class BestFirstPathFinder extends AStarPathFinder {
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
