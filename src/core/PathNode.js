// 【路径节点】

export default class PathNode {
  // x = 0 // 节点X坐标
  // y = 0 // 节点Y坐标
  // id = 0 // 节点ID
  // cost = 1 // 消耗系数（值越大则路径优先级越低，可对应地形难度）
  // neighbors = null // 相邻节点距离表（需用Map）：{ 节点ID: 距离消耗（= 间距 * 消耗系数和 / 2）}，null表示自动计算
  // parentId = null // 父节点ID
  distance = 0 // 路径长度（路径中所有相邻节点的距离消耗总和）
  priority = 0 // 优先级
  // openVer = 0 // 开启状态版本号（与寻路版本号相同时表示节点已开启）
  // closeVer = 0 // 关闭状态版本号（与寻路版本号相同时表示节点已关闭）
  // openIndex = 0 // 开启序号（用于优先级排序）
  // 注：不初始化上述属性，可在一定程度上节省内存消耗

  // 构造函数
  constructor (x = 0, y = 0, cost = 1) {
    this.x = x
    this.y = y
    this.id = PathNode.xyToId(x, y)
    this.cost = cost
  }

  // 重置节点状态
  reset () {
    this.parentId = null
    this.distance = 0
    this.priority = 0
  }

  // 节点坐标转ID
  static xyToId (x, y) {
    return x | (y << 16)
  }

  // 节点ID转坐标
  static idToXY (id) {
    return [id & 0xffff, id >> 16]
  }
}
