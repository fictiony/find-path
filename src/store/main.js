// 【主框架】
import { debounce } from 'quasar'
import { genMutations, mapProps, loadConfig, saveConfig } from 'boot/utils'
import cfg from '../../package.json'

// 界面状态参数
const UI_STATE_INIT = {
  maximized: false, // 窗口是否最大化
  darkTheme: false, // 是否暗色界面
  toolPanel: true, // 工具栏是否显示
  operatePanel: true, // 操作面板是否显示
  toolPanelFloat: true, // 工具栏是否浮动
  operatePanelFloat: true, // 操作面板是否浮动
  operatePanelFold: false, // 操作面板是否收拢
  operatePanelRect: { x: 10, y: 40, width: 260, height: 600 }, // 操作面板位置大小
  viewZoom: 1.0, // 视图缩放比率
  uiZoom: 1.0 // 界面缩放比率
}
const UI_STATE = Object.keys(UI_STATE_INIT)

// 是否要自动保存界面状态（用于避免启动时保存）
let autoSaveUIState = false

// ----------------------------------------------------------------------------【state】
const state = () => ({
  appTitle: cfg.productName, // 应用标题
  appVer: cfg.version, // 应用版本号
  appDesc: cfg.description, // 应用介绍
  appAuthor: cfg.author, // 应用作者
  loading: false, // 是否显示加载等待（可为：true/false/提示信息）

  ...UI_STATE_INIT
})

// ----------------------------------------------------------------------------【getters】
const getters = {
  // 视图最大缩放比率
  maxViewZoom (state) {
    return 2.0
  },

  // 视图最小缩放比率
  minViewZoom (state) {
    return 0.05
  },

  // 界面最大缩放比率
  maxUIZoom (state) {
    return 2.0
  },

  // 界面最小缩放比率
  minUIZoom (state) {
    return 0.5
  }
}

// ----------------------------------------------------------------------------【mutations】
const mutations = {
  ...genMutations(['loading']),
  ...genMutations(
    UI_STATE,
    debounce((name, val, state) => {
      if (!autoSaveUIState) return
      saveConfig('uiState', mapProps(UI_STATE, '', state))
    }, 1000)
  )
}

// ----------------------------------------------------------------------------【actions】
const actions = {
  // 加载界面状态
  async loadUIState ({ commit }) {
    const cfg = (await loadConfig('uiState')) || {}
    UI_STATE.forEach(name => {
      if (name in cfg) commit(name, cfg[name])
    })
    setTimeout(() => {
      autoSaveUIState = true
    }, 2000)
  },

  // 重置界面状态
  async resetUIState ({ commit }) {
    UI_STATE.forEach(name => {
      commit(name, UI_STATE_INIT[name])
    })
  },

  // 缩放视图
  // - @zoom 新缩放比率
  async zoomView ({ getters, commit }, zoom) {
    zoom = Math.min(getters.maxViewZoom, Math.max(getters.minViewZoom, zoom))
    commit('viewZoom', zoom)
  },

  // 缩放界面
  // - @zoom 新缩放比率
  async zoomUI ({ getters, commit }, zoom) {
    zoom = Math.min(getters.maxUIZoom, Math.max(getters.minUIZoom, zoom))
    commit('uiZoom', zoom)
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
