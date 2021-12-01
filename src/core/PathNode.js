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
  // parentCache = null // 父节点缓存（需用Map）：{ 对应起点ID: 父节点ID }
  // neighborsCache = null // 相邻节点表分层缓存（需用Map）：{ 层级: { 节点ID: 启发函数值 } }
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

  // 缓存父节点
  // - @startId 对应起点ID
  // - @parentId 父节点ID
  cacheParent (startId, parentId) {
    this.parentCache ||= new Map()
    this.parentCache.set(startId, parentId)
    this.parentId = startId
  }

  // 判断是否有缓存路径
  hasCachePath () {
    return this.parentCache
      ? this.parentCache.has(this.parentId)
      : this.parentId == null
  }

  // 获取缓存父节点ID
  getCacheParentId () {
    return this.parentCache && this.parentCache.get(this.parentId)
  }

  // 缓存相邻节点表
  // - @layer 层级
  // - @neighbors 相邻节点表（需用Map）：{ 节点ID: 启发函数值 }
  cacheNeighbors (layer, neighbors) {
    this.neighborsCache ||= new Map()
    this.neighborsCache.set(layer, neighbors)
  }

  // 获取缓存相邻节点表
  // - @layer 层级
  getCacheNeighbors (layer) {
    return this.neighborsCache && this.neighborsCache.get(layer)
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
