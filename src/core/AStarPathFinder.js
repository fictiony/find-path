// 【A*寻路算法】
// - 从起始点出发，采用广度搜索，依次检测周围的节点，并加入开启列表（按优先级排序）
// - 每次从开启列表中取出最优先的节点，继续展开周围的新节点，并加入开启列表，当前节点则标记为关闭
// - 重复上述过程，直到展开到目标节点为止
// - 开启节点的优先级按可选的启发函数来计算，值越小的越优先，计算公式为：优先级 = 路径长度 + 启发函数值
// - 启发函数包括（dx、dy为当前节点距离终点的横坐标和纵坐标差）：
//   1. 曼哈顿距离（dx + dy）
//   2. 欧几里德距离（sqrt(dx² + dy²)）
//   3. 45°斜角距离（|dx - dy| + min(dx, dy) * √2）
//   2. 切比雪夫距离（max(dx + dy)）

import BasePathFinder from './BasePathFinder'

class AStarPathFinder extends BasePathFinder {}

export default AStarPathFinder
