// 【主框架】
import { debounce } from 'quasar'
import { genMutations, mapProps, loadConfig, saveConfig } from 'boot/utils'
import cfg from '../../package.json'

// 界面状态参数
const UI_STATE_INIT = {
  maximized: false, // 窗口是否最大化
  darkTheme: false, // 是否暗色界面
  // xxxPanel: true, // xxx面板是否显示
  // xxxPanelFloat: false, // xxx面板是否浮动
  // xxxPanelFold: false, // xxx面板是否收拢
  // xxxPanelRect: { x: 100, y: 100, width: 350, height: 400 }, // xxx面板位置大小
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
  loading: false, // 是否显示加载等待（可为：true/false/

  ...UI_STATE_INIT
})

// ----------------------------------------------------------------------------【getters】
const getters = {
  // UI最大缩放比率
  maxUIZoom (state) {
    return 2.0
  },

  // UI最小缩放比率
  minUIZoom (state) {
    return 0.5
  }
}

// ----------------------------------------------------------------------------【mutations】
const mutations = {
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
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
