// 【路径节点】

// 直接引用原始节点的属性
const DIRECT_PROPS = ['neighbors', 'neighborsCache', 'pathCache']

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
  // neighborsCache = null // 相邻节点表分层缓存（需用Map）：{ 层级: { 节点ID: 启发函数值 } }  ——仅用于P2HAStar算法
  // pathCache = null // 路径缓存（需用Map）：{ 起点ID: [前一节点ID, 路径长度]（或null，表示无路径） }  ——仅用于P2HAStar算法
  // hasCachePath = false // 节点是否已有缓存路径  ——仅用于P2HAStar算法
  // layer = 0 // 节点所在搜索层级  ——仅用于P2HAStar算法
  // 注：不初始化上述属性，可在一定程度上节省内存消耗，而且部分属性是只有个别寻路算法才用的到

  // 构造函数
  constructor (x = 0, y = 0, cost = 1) {
    this.x = x
    this.y = y
    this.id = PathNode.xyToId(x, y)
    this.cost = cost
  }

  // 创建节点引用对象
  // - neighbors、neighborsCache、pathCache属性直接读写原始节点
  // - 额外增加node属性，用以记录原始节点
  ref () {
    const node = this.node || this
    const ref = { node }
    Object.setPrototypeOf(ref, node)
    DIRECT_PROPS.forEach(prop =>
      Object.defineProperty(ref, prop, {
        get: () => node[prop],
        set: val => (node[prop] = val)
      })
    )
    return ref
  }

  // 重置节点状态
  reset () {
    this.parentId = null
    this.distance = 0
    this.priority = 0
  }

  // 缓存路径
  // - @startId 起点ID
  // - @lastId 前一节点ID
  // - @distance 路径长度（空表示无路径）
  cachePath (startId, lastId, distance) {
    this.pathCache ||= new Map()
    const cache = this.pathCache.get(startId)
    if (cache !== undefined) {
      if (distance == null) return
      if (cache && cache[1] < distance + 1e-8) return
    }
    // console.log(
    //   `cachePath: ${startId} -> ${this.id} = ${distance} (${lastId}${
    //     cache === undefined ? '' : ' update'
    //   })`
    // )
    this.pathCache.set(startId, distance == null ? null : [lastId, distance])
  }

  // 获取缓存路径的长度
  // - @startId 起点ID（默认取父节点ID）
  // - @return 路径长度（null表示无路径，undefined表示无缓存）
  getCachePathDistance (startId = this.parentId) {
    const cache = this.pathCache && this.pathCache.get(startId)
    return cache && cache[1]
  }

  // 获取缓存路径的前一节点ID
  // - @startId 起点ID（默认取父节点ID）
  // - @return 前一节点ID（若无缓存路径，则返回起点ID）
  getCachePathLastId (startId = this.parentId) {
    const cache = this.pathCache && this.pathCache.get(startId)
    return cache ? cache[0] : startId
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
    // return x + y * 10000
  }

  // 节点ID转坐标
  static idToXY (id) {
    return [id & 0xffff, id >> 16]
    // return [id % 10000, Math.floor(id / 10000)]
  }
}
