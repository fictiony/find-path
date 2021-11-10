// 【编辑相关】
import { genMutations } from 'boot/utils'

// ----------------------------------------------------------------------------【state】
const state = () => ({
  xGrids: 100, // 横向格数
  yGrids: 100, // 纵向格数
  gridSize: 20, // 格子边长
  gridStates: {}, // 格子状态表：{ 'X-Y': 状态 }，状态可为：1~100-不同程度的阻碍/101~200-绝对阻挡不可通过/其他-无阻挡

  brushMode: null, // 笔刷模式：1-叠加/2-扣除/3-覆盖/4-清除/null-无
  brushType: 1, // 笔刷样式：1-正方形/2-圆形/3-随机杂点
  brushSize: 1, // 笔刷大小（1~200）
  brushSoft: 0, // 笔刷软度（0~100），值越大表示边缘越快渐变到1，0表示不渐变
  // 计算公式为：(cos(π * D^(1-ln(S/50))^2) + 1) / 2，其中D/S分别表示距离/软度
  brushState: 200, // 笔刷状态值（1~200）
  brushStatesRefresh: 1, // 用于手动刷新笔刷格子状态列表（当笔刷类型为随机杂点时有用）
  brushPos: null // 笔刷当前位置：{x, y}
})

// ----------------------------------------------------------------------------【getters】
const getters = {
  // 编辑状态信息
  editHint (state) {
    const {
      xGrids,
      yGrids,
      brushMode,
      brushType,
      brushSize,
      brushSoft,
      brushState,
      brushPos
    } = state
    return (
      `⬜ ${xGrids} * ${yGrids} - 🖌️ [${brushMode || 0}-${brushType}] ${brushSize} * ${brushSoft} * ${brushState}` +
      (brushPos ? ` - 🖱️ ${brushPos.x}, ${brushPos.y}` : '')
    )
  },

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
      const { xGrids: w, yGrids: h, gridSize: sz } = state
      return [Math.floor(x / sz + w / 2), Math.floor(y / sz + h / 2)]
    }
  },

  // 笔刷格子状态列表（预先计算好）
  brushStates (state) {
    if (!state.brushStatesRefresh) return
    const {
      brushType: ty,
      brushSize: sz,
      brushSoft: so,
      brushState: st
    } = state
    const states = new Array(sz * sz)
    if (ty === 1 && so === 0) {
      states.fill(st)
    } else {
      const c = (sz - 1) / 2
      for (let y = 0, i = 0; y < sz; y++) {
        for (let x = 0; x < sz; x++) {
          let d
          let s = st
          if (ty > 1) {
            d = Math.hypot(x - c, y - c)
            if (d > c) {
              s = 0
            } else if (ty === 3) {
              const p = (1 - d / c) ** 2 * 0.5
              if (Math.random() >= p) {
                s = 0
              }
            }
          } else if (so > 0) {
            d = Math.max(Math.abs(x - c), Math.abs(y - c))
          }
          if (s > 0 && so > 0) {
            s *=
              (Math.cos(Math.PI * d ** ((1 - Math.log(so / 50)) ** 2)) + 1) / 2
          }
          states[i++] = s
        }
      }
    }
    return states
  }
}

// ----------------------------------------------------------------------------【mutations】
const mutations = {
  ...genMutations([
    'xGrids',
    'yGrids',
    'gridSize',
    'brushMode',
    'brushType',
    'brushSize',
    'brushSoft',
    'brushState',
    'brushStatesRefresh',
    'brushPos'
  ])
}

// ----------------------------------------------------------------------------【actions】
const actions = {
  // 笔刷涂点
  // - @x, y 涂点坐标
  async brushDraw ({ state, commit }, [x, y]) {}
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
