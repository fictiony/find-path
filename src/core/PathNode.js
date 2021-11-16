// 【路径节点】

export default class PathNode {
  x = 0 // 节点X坐标
  y = 0 // 节点Y坐标
  id = 0 // 节点ID
  cost = 1 // 消耗系数（值越大则路径优先级越低，可对应地形难度）
  neighbors = null // 相邻节点距离表：{ 节点ID: 距离消耗（= 间距 * 消耗系数和 / 2）}，null表示自动计算
  parentId = null // 父节点ID
  distance = 0 // 路径长度（路径中所有相邻节点的距离消耗总和）
  heurist = null // 启发函数值（null表示尚未计算）
  priority = 0 // 优先级
  openVer = 0 // 开启状态版本号
  closeVer = 0 // 关闭状态版本号

  // 构造函数
  constructor (x, y, cost = 1) {
    this.x = x
    this.y = y
    this.id = PathNode.xyToId(x, y)
    this.cost = cost
  }

  // 重置节点状态
  reset () {
    this.parentId = null
    this.distance = 0
    this.heurist = null
    this.priority = 0
  }

  // 节点坐标转ID
  static xyToId (x, y) {
    return (x << 16) | y
  }

  // 节点ID转坐标
  static idToXY (id) {
    return [id >> 16, id & 0xffff]
  }
}
