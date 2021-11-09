// 【编辑相关】
import { genMutations } from 'boot/utils'

// ----------------------------------------------------------------------------【state】
const state = () => ({
  xGrids: 100, // 横向格数
  yGrids: 100, // 纵向格数
  gridSize: 20, // 格子边长
  gridStates: {} // 格子状态表：{ 'X-Y': 状态 }，状态可为：1~100-不同程度的阻碍/200-绝对阻挡/其他-空
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
  }
}

// ----------------------------------------------------------------------------【mutations】
const mutations = {
  ...genMutations(['xGrids', 'yGrids', 'gridSize'])
}

// ----------------------------------------------------------------------------【actions】
const actions = {}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
