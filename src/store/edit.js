// 【编辑相关】
import { LocalStorage } from 'quasar'
import {
  sleep,
  ROOT,
  genMutations,
  B,
  notify,
  showMsg,
  setClipboardText
} from 'boot/utils'
import PathNode from 'src/core/PathNode'
import AStarPathFinder from 'src/core/AStarPathFinder'
import DijkstraPathFinder from 'src/core/DijkstraPathFinder'

// ----------------------------------------------------------------------------【utils】

// 寻路状态相关
let fpCtx = null // 当前寻路的vuex环境
let genCount = 0 // 节点生成计数
let openCount = 0 // 节点开启计数
let updateCount = 0 // 节点更新计数
let closeCount = 0 // 节点关闭计数
let delaySum = 0 // 累积延时时间（毫秒）

// 寻路状态通知函数
// - @id 节点ID
// - @type 通知类型
async function findPathNotify ({ id }, type) {
  const { pathStates, pathDirty, showState, showDelay } = fpCtx.state
  const newDirty =
    !showState || pathDirty === 'all' ? null : pathDirty || new Map()

  // 更新寻路状态
  let state = pathStates.get(id) || 0
  switch (type) {
    case 0:
      closeCount++
      state = (state || 1) + 100
      break
    case 1:
      openCount++
      state = 1
      break
    case 2:
      updateCount++
      if (state++ % 100) break
      return // 最多加到100
  }
  pathStates.set(id, state)

  // 更新脏区域
  if (newDirty) {
    newDirty.set(id, true)
    if (newDirty !== pathDirty) {
      fpCtx.commit('pathDirty', newDirty)
    }
  }

  // 延时显示（每累积10毫秒以上延时一下）
  if (showState && showDelay > 0) {
    delaySum += showDelay
    if (delaySum >= 10) {
      if (await findPathDelay(Math.floor(delaySum))) return true
      delaySum = delaySum % 1
    }
  }

  // 暂停寻路
  while (fpCtx.state.findPaused) {
    if (await findPathDelay()) return true
  }
}

// 寻路延迟处理
// - @delay 要延迟的时间（毫秒）
// - @return 是否取消本次寻路
async function findPathDelay (delay = 10) {
  const id = fpCtx.state.findPathId
  const pf = fpCtx.getters.pathFinder
  await sleep(delay)
  if (id !== fpCtx.state.findPathId || pf !== fpCtx.getters.pathFinder) {
    return true // 若延时过程中寻路环境改变，则取消本次寻路
  }
  return false
}

// ----------------------------------------------------------------------------【state】
const state = () => ({
  xGrids: 100, // 横向格数
  yGrids: 100, // 纵向格数
  gridSize: 20, // 格子边长
  gridStates: new Map(), // 格子状态表：{ 格子ID: 状态值 }，状态值可为：1~100-不同程度的阻碍/101~200-绝对阻挡不可通过/其他-无阻挡
  gridDirty: null, // 格子脏区域（Map对象）：{ 格子ID: true }，null表示无，特殊值'all'表示全脏
  findPathId: 0, // 当前寻路标识（每次递增1）
  findingPath: false, // 当前是否正在寻路中
  pathStates: new Map(), // 路径状态表：{ 格子ID: 状态值 }，状态值可为：1~100-不同刷新次数的开启节点/101~200-不同刷新次数的关闭节点/201路径节点/其他-无
  pathDirty: null, // 路径脏区域（Map对象）：{ 格子ID: true }，null表示无，特殊值'all'表示全脏

  algorithm: 'astar_h', // 当前算法类型：
  // astar_h - A*寻路（曼哈顿距离）
  // astar_e - A*寻路（欧几里德距离）
  // astar_o - A*寻路（八分角距离）
  // astar_c - A*寻路（切比雪夫距离）
  // dijkstra - 最短路径寻路
  heapSort: true, // 是否使用二叉堆排序寻路节点优先级
  diagonalMove: 2, // 是否可走对角线：0-不可走/1-无阻挡可走/2-非全阻挡可走/3-始终可走
  showState: false, // 寻路时是否显示实时状态（即节点开启关闭状态）
  showDelay: 0, // 显示每个寻路实时状态的延时时间（毫秒）
  pointMode: 0, // 起止点模式：1-指定起点/2-指定终点/null-无，pointMode优先级高于brushMode
  startPos: null, // 当前寻路起点坐标：{x, y}
  endPos: null, // 当前寻路终点坐标：{x, y}
  autoFind: true, // 是否在选完起止点后立即自动寻路
  findPaused: false, // 寻路是否已暂停

  brushMode: 1, // 笔刷模式：1-叠加/2-扣除/3-合并/4-清除/null-无
  brushType: 2, // 笔刷样式：1-方形/2-圆形/3-随机杂点/4-方形随机散布/5-圆形随机散布
  brushSize: 5, // 笔刷大小（1~200）
  brushSoft: 0, // 笔刷软度（0~100），值越大表示边缘越快渐变到1，0表示不渐变
  // 计算公式为：(cos(π * D^(1-ln(S/50))^2) + 1) / 2，其中D/S分别表示距离/软度
  brushState: 200, // 笔刷状态值（1~200）
  brushStatesRefresh: 1, // 用于手动刷新笔刷格子状态列表（当笔刷类型为随机杂点时有用）
  brushPos: null, // 笔刷当前位置：{x, y}
  lockBrushDir: false // 是否锁定笔刷移动方向
})

// ----------------------------------------------------------------------------【getters】
const getters = {
  // 网格宽度的一半
  halfGridWidth (state) {
    return (state.xGrids * state.gridSize) / 2
  },

  // 网格高度的一半
  halfGridHeight (state) {
    return (state.yGrids * state.gridSize) / 2
  },

  // 位置坐标转格点坐标
  // - @x, y 位置坐标
  // - @return [X格点, Y格点]
  getGridXY (state) {
    return (x, y) => {
      const { xGrids, yGrids, gridSize } = state
      return [
        Math.floor(x / gridSize + xGrids / 2),
        Math.floor(y / gridSize + yGrids / 2)
      ]
    }
  },

  // 是否为方形笔刷
  isSquareBrush (state) {
    return state.brushType === 1 || state.brushType === 4
  },

  // 笔刷格子状态列表（预先计算好）
  brushStates (state, getters) {
    if (!state.brushStatesRefresh) return
    const { brushType, brushSize, brushSoft, brushState } = state
    const square = getters.isSquareBrush
    const states = new Array(brushSize ** 2)
    if (square && brushSoft === 0) {
      states.fill(brushState)
    } else {
      const c = (brushSize - 1) / 2
      for (let y = 0, i = 0; y < brushSize; y++) {
        for (let x = 0; x < brushSize; x++) {
          let d // 距离与半径的比值
          let s = brushState // 当前格子的状态值
          if (square) {
            d = Math.max(Math.abs(x - c), Math.abs(y - c)) / (c + 0.5)
          } else {
            d = Math.hypot(x - c, y - c) / (c + 0.5)
            if (d > 1) {
              s = 0
            } else if (brushType === 3) {
              const p = (1 - d) ** 2 // 中心最大概率1，向边缘递减到0
              if (Math.random() >= p) {
                s = 0
              }
            }
          }
          if (s > 0 && brushSoft > 0) {
            const ratio = (1 - Math.log(brushSoft / 50)) ** 2
            s = Math.round((Math.cos(Math.PI * d ** ratio) + 1) * (s / 2))
            if (s < 1) s = 1
          }
          states[i++] = s
        }
      }
    }
    return states
  },

  // 网格状态统计
  // - @return 统计情况：{ blockCount: 绝对阻挡格数量, blockPercent: 绝对阻挡格百分比, emptyCount: 空格数量, emptyPercent: 空格百分比,
  //    totalCost: 网格总消耗, averageCost: 网格平均消耗 }
  gridStats (state) {
    const { xGrids, yGrids, gridStates, gridDirty } = state
    if (gridDirty) return null
    const totalCount = xGrids * yGrids
    let blockCount = 0
    let emptyCount = totalCount
    let totalCost = totalCount
    gridStates.forEach(state => {
      if (state > 100) {
        blockCount++
        emptyCount--
        totalCost--
      } else if (state > 0) {
        emptyCount--
        totalCost += Math.exp(state / 20) - 1
      }
    })
    return {
      blockCount,
      blockPercent: (blockCount / totalCount) * 100,
      emptyCount,
      emptyPercent: (emptyCount / totalCount) * 100,
      totalCost,
      averageCost: totalCost / (totalCount - blockCount)
    }
  },

  // 寻路算法对象
  pathFinder (state) {
    const { xGrids, yGrids, gridStates, gridDirty } = state
    if (gridDirty) return null

    // 节点生成函数
    const genNode = id => {
      genCount++
      const [x, y] = PathNode.idToXY(id)
      if (x < 0 || x >= xGrids || y < 0 || y >= yGrids) return
      const state = gridStates.get(id) || 0
      if (state > 100) return
      const cost = Math.exp(state / 20)
      return new PathNode(x, y, cost)
    }

    // 创建算法对象
    const { algorithm, heapSort, diagonalMove } = state
    const options = {
      diagonalMove,
      heapSort
    }
    switch (algorithm) {
      case 'astar_h':
        options.heuristic = 'manhattan'
        return new AStarPathFinder(genNode, options)
      case 'astar_e':
        options.heuristic = 'euclidean'
        return new AStarPathFinder(genNode, options)
      case 'astar_o':
        options.heuristic = 'octile'
        return new AStarPathFinder(genNode, options)
      case 'astar_c':
        options.heuristic = 'chebyshev'
        return new AStarPathFinder(genNode, options)
      case 'dijkstra':
        return new DijkstraPathFinder(genNode, options)
    }
    return null
  }
}

// ----------------------------------------------------------------------------【mutations】
const mutations = {
  ...genMutations([
    'xGrids',
    'yGrids',
    'gridSize',
    'gridStates',
    'gridDirty',
    'findPathId',
    'findingPath',
    'pathStates',
    'pathDirty',
    'algorithm',
    'heapSort',
    'diagonalMove',
    'showState',
    'showDelay',
    'pointMode',
    'startPos',
    'endPos',
    'autoFind',
    'findPaused',
    'brushMode',
    'brushType',
    'brushSize',
    'brushSoft',
    'brushState',
    'brushStatesRefresh',
    'brushPos',
    'lockBrushDir'
  ])
}

// ----------------------------------------------------------------------------【actions】
const actions = {
  // 将当前格子状态表转为图片数据URL
  // - @return 图片数据URL
  async gridStatesToDataURL ({ state }) {
    const { xGrids, yGrids, gridStates } = state

    // 先转为图片数据（每3行格子状态分别记到各像素的RGB分量中，可最大程度形成连续同色点，提高PNG压缩率）
    const imageData = new ImageData(xGrids, Math.ceil(yGrids / 3))
    const data = imageData.data
    for (let i = data.length - 1; i > 0; i -= 4) {
      data[i] = 255 // Alpha统一用255（不用Alpha通道存格子状态，否则会造成RGB分量丢失）
    }
    for (const id of gridStates.keys()) {
      const state = gridStates.get(id)
      if (!state) continue
      const [x, y] = PathNode.idToXY(id)
      data[(x + Math.floor(y / 3) * xGrids) * 4 + (y % 3)] = state
    }

    // 再画到临时画布上
    const canvas = document.createElement('canvas')
    canvas.width = imageData.width
    canvas.height = imageData.height
    const ctx = canvas.getContext('2d')
    ctx.putImageData(imageData, 0, 0)

    return canvas.toDataURL()
  },

  // 将图片数据URL转为格子状态表
  // - @dataURL 图片数据URL
  // - @return 格子状态表
  async dataURLToGridStates (_, dataURL) {
    return new Promise(resolve => {
      const image = new Image()
      image.onload = () => {
        const w = image.naturalWidth
        const h = image.naturalHeight

        // 加载成功后，将图片画到临时画布上
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx.drawImage(image, 0, 0)

        // 再从每个像素中取出RGB分量，分别对应3行格子的状态
        const { data } = ctx.getImageData(0, 0, w, h)
        const states = new Map()
        for (let i = data.length - 1; i >= 0; i--) {
          if (!data[i] || (i & 3) === 3) continue // 跳过状态为0的点和透明度分量
          const index = i >> 2
          const id = PathNode.xyToId(
            index % w,
            Math.floor(index / w) * 3 + (i & 3)
          )
          states.set(id, data[i])
        }

        resolve(states)
      }
      image.src = dataURL
    })
  },

  // 加载格子状态
  async loadGrids ({ commit, dispatch }) {
    const info = LocalStorage.getItem('FindPathGrids-1')
    if (info) {
      const [w, h] = info.size
      const states = await dispatch('dataURLToGridStates', info.states)
      commit('xGrids', w)
      commit('yGrids', h)
      await dispatch('clearGrids', true)
      commit('gridStates', states)
      setTimeout(notify, 100, '加载完成')
    } else {
      showMsg('加载失败！')
    }
  },

  // 保存格子状态
  async saveGrids ({ state, dispatch }) {
    LocalStorage.set('FindPathGrids-1', {
      size: [state.xGrids, state.yGrids],
      states: await dispatch('gridStatesToDataURL')
    })
    notify('保存成功')
  },

  // 复制格子状态
  async copyGrids ({ dispatch }) {
    setClipboardText(await dispatch('gridStatesToDataURL'))
    notify('已复制到剪贴板')
  },

  // 清空状态
  // - @name 状态属性名
  // - @dirtyName 脏区域属性名
  // - @forceReset 是否强制重置（否则会根据状态数量智能选择重置或按项清除）
  async clearStates ({ state, commit }, [name, dirtyName, forceReset]) {
    const size = state[name].size
    if (forceReset || size > (state.xGrids * state.yGrids) / 100) {
      commit(name, new Map())
      commit(dirtyName, 'all')
    } else if (size > 0) {
      if (state[dirtyName] === 'all') {
        state[name].clear()
      } else {
        const dirtyArea = state[dirtyName] || new Map()
        for (const id of state[name].keys()) {
          dirtyArea.set(id, true)
        }
        state[name].clear()
        commit(dirtyName, dirtyArea)
      }
    }
  },

  // 清空格子状态
  async clearGrids ({ dispatch }, forceReset) {
    await dispatch('clearStates', ['gridStates', 'gridDirty', forceReset])
    await dispatch('clearPath', forceReset)
    await dispatch('clearPoints', null)
  },

  // 清空路径状态
  async clearPath ({ state, commit, dispatch }, forceReset) {
    await dispatch('clearStates', ['pathStates', 'pathDirty', forceReset])
    if (state.findingPath) {
      commit('findingPath', false)
      commit('findPathId', state.findPathId + 1)
    }
  },

  // 清除起点终点（包括寻路状态，若正在寻路中则仅清除寻路状态）
  // - @mode 指定起止点模式
  async clearPoints ({ state, commit, dispatch }, mode = 1) {
    if (!state.findingPath) {
      commit('startPos', null)
      commit('endPos', null)
      commit('pointMode', mode)
    }
    await dispatch('clearPath')
  },

  // 笔刷涂点
  // - @pos 指定坐标（未指定则取当前笔刷位置）
  async brushDraw ({ state, getters, commit, dispatch }, pos) {
    const { brushMode } = state
    if (!brushMode) return

    // 清除当前寻路状态
    await dispatch('clearPath')
    const { xGrids, yGrids, gridStates, gridDirty, brushSize } = state

    // 计算要绘制的位置（单点时取指定位置或当前笔刷位置，散布时取能覆盖1%区域的随机点）
    const posList = []
    if (state.brushType > 3) {
      const num = Math.ceil((xGrids * yGrids) / brushSize ** 2 / 100)
      for (let i = num; i > 0; i--) {
        posList.push({
          x: Math.floor(Math.random() * xGrids),
          y: Math.floor(Math.random() * yGrids)
        })
      }
    } else {
      posList.push(pos || state.brushPos)
    }

    // 进行绘制
    const offset = Math.floor(brushSize / 2)
    const newDirty = gridDirty === 'all' ? null : gridDirty || new Map()
    posList.forEach(({ x, y }) => {
      getters.brushStates.forEach((state, index) => {
        if (!state) return
        const bx = x - offset + (index % brushSize)
        if (bx < 0 || bx >= xGrids) return
        const by = y - offset + Math.floor(index / brushSize)
        if (by < 0 || by >= yGrids) return

        // 更新格子状态
        const id = PathNode.xyToId(bx, by)
        const oldState = gridStates.get(id) || 0
        let newState = 0
        switch (brushMode) {
          case 1: // 叠加
            newState = Math.min(200, oldState + state)
            break
          case 2: // 扣除
            newState = Math.max(0, oldState - state)
            break
          case 3: // 合并
            newState = Math.max(oldState, state)
            break
        }
        if (newState === oldState) return
        gridStates.set(id, newState)
        newDirty && newDirty.set(id, true)
      })
    })
    if (newDirty && newDirty !== gridDirty) {
      commit('gridDirty', newDirty)
    }

    // 若笔刷样式为随机杂点，则每画一笔刷新一次
    if (state.brushType === 3) {
      commit('brushStatesRefresh', state.brushStatesRefresh + 1)
    }
  },

  // 寻路
  // - @times 重复次数（0表示自动寻路）
  async findPath ({ state, getters, commit, dispatch }, times = 1) {
    const { startPos, endPos } = state
    const pf = getters.pathFinder
    if (process.env.DEBUGGING) {
      window.$p = pf
    }
    const startNode = pf.getNodeAt(startPos.x, startPos.y)
    if (!startNode) return notify('起点不可用', 'warn')
    const targetNode = pf.getNodeAt(endPos.x, endPos.y)
    if (!targetNode) return notify('终点不可用', 'warn')

    // 清除当前寻路状态
    await dispatch('clearPath')
    const id = state.findPathId + 1
    commit('findPathId', id)
    let tm, path

    // 开始寻路
    commit('findingPath', true)
    commit('findPaused', false)
    if (times > 1) {
      // 若重复次数>1，则不加节点状态通知，以便保证最高性能
      commit('main/loading', '正在处理... 请稍候', ROOT)
      await sleep(100)
      tm = Date.now()
      let last = tm
      for (let i = 1; i <= times; i++) {
        path = await pf.findPath(startNode, targetNode)
        if (Date.now() - last < 200) continue
        const progress = ((i / times) * 100).toFixed(1)
        commit('main/loading', `正在处理... ${progress}%`, ROOT)
        await sleep(20)
        if (id !== state.findPathId) break // 中途取消
        tm += 20
        last = Date.now()
      }
      commit('main/loading', false, ROOT)
    } else {
      // 添加节点状态通知，以统计节点状态计数和处理寻路状态显示
      fpCtx = { state, getters, commit }
      genCount = 0
      openCount = 0
      updateCount = 0
      closeCount = 0
      delaySum = 0
      pf.openNotify = findPathNotify
      pf.updateNotify = findPathNotify
      pf.closeNotify = findPathNotify
      tm = Date.now()
      path = await pf.findPath(startNode, targetNode)
      pf.openNotify = null
      pf.updateNotify = null
      pf.closeNotify = null
    }
    if (id !== state.findPathId || pf !== getters.pathFinder) return // 中途取消
    commit('findingPath', false)

    // 显示路径
    if (path) {
      const { pathStates, pathDirty } = state
      const newDirty = pathDirty === 'all' ? null : pathDirty || new Map()
      path.forEach(node => {
        pathStates.set(node.id, 201)
        newDirty && newDirty.set(node.id, true)
      })
      if (newDirty && newDirty !== pathDirty) {
        commit('pathDirty', newDirty)
      }
    }

    // 显示结果（自动寻路时不显示）
    // console.log(path && path.map(i => `${i.x},${i.y}`).join(' > '))
    if (times > 0) {
      const len = path && path.length - 1
      notify(
        `用时${B((Date.now() - tm) / 1000)}秒，${
          path
            ? `成功找到路径，共${B(len)}步，距离${B(
                path[len].distance.toFixed(3)
              )}`
            : '未找到路径'
        }${
          times > 1
            ? ''
            : `，节点生成${B(genCount)}次，开启${B(openCount)}次` +
              `，更新${B(updateCount)}次，关闭${B(closeCount)}次`
        }`,
        'info',
        { timeout: 5000, closeBtn: true }
      )
    }
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
