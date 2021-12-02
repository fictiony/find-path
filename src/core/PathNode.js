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
  // heurist = 0 // 启发函数值 ——仅用于A*寻路及其拓展算法
  // openVer = 0 // 开启状态版本号（与寻路版本号相同时表示节点已开启）
  // closeVer = 0 // 关闭状态版本号（与寻路版本号相同时表示节点已关闭）
  // openIndex = 0 // 开启序号（用于优先级排序）
  // closeSide = 0 // 关闭的搜索端 ——仅用于双向寻路算法
  // closeInfo = null // 关闭的信息 ——仅用于双向寻路算法
  // pathCache = null // 路径缓存（需用Map）：{ 起点ID: [前一节点ID, 路径长度]（或null，表示无路径） }  ——仅用于P2HAStar算法
  // neighborsCache = null // 相邻节点表分层缓存（需用Map）：{ 层级: { 节点ID: 启发函数值 } }  ——仅用于P2HAStar算法
  // layer = 0 // 节点所在搜索层级  ——仅用于P2HAStar算法
  // 注：不初始化上述属性，可在一定程度上节省内存消耗，而且部分属性是只有个别寻路算法才用的到

  // 构造函数
  constructor (x = 0, y = 0, cost = 1) {
    this.x = x
    this.y = y
    this.id = PathNode.xyToId(x, y)
    this.cost = cost
  }

  // 克隆一份（相邻节点距离表和缓存表共享引用）
  clone () {
    return Object.setPrototypeOf({ ...this }, Object.getPrototypeOf(this))
  }

  // 重置节点状态
  reset () {
    this.parentId = null
    this.distance = 0
    this.priority = 0
  }

  // 缓存路径
  // - @startId 起点ID
  // - @lastId 前一节点ID（null表示无路径）
  // - @distance 路径长度
  cachePath (startId, lastId = null, distance = 0) {
    this.pathCache ||= new Map()
    this.pathCache.set(startId, lastId && [lastId, distance])
  }

  // 判断是否有路径缓存（以当前父节点为起点，无父节点或缓存为无路径也返回true）
  hasCachePath () {
    if (this.parentId == null) return true
    return this.pathCache ? this.pathCache.has(this.parentId) : false
  }

  // 获取缓存路径的前一节点ID（以当前父节点为起点）
  // - @return 前一节点ID（null表示无路径，undefined表示无缓存）
  // getCachePathLastId () {
  //   const cache = this.pathCache && this.pathCache.get(this.parentId)
  //   return cache && cache[0]
  // }

  // 获取缓存路径的长度（以当前父节点为起点）
  // - @return 路径长度（null表示无路径，undefined表示无缓存）
  getCachePathDistance () {
    const cache = this.pathCache && this.pathCache.get(this.parentId)
    return cache && cache[1]
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
