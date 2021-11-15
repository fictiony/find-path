// 【最短路径寻路算法】
// - 是A*寻路算法的简化版本，即忽略启发函数，仅按路径长度为优先级来排序

import BasePathFinder from './BasePathFinder'

class DijkstraPathFinder extends BasePathFinder {}

export default DijkstraPathFinder
