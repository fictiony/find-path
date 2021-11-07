import Vue from 'vue'
import { showDlg } from 'boot/utils'

// 浮动面板表
export const FLOAT_PANEL = {
  // xxx: XxxPanel,
}

// 浮动面板名称列表
export const FLOAT_PANEL_NAMES = Object.keys(FLOAT_PANEL)

// 浮动面板自定义参数
const FLOAT_PANEL_PARAMS = {
  // xxx: {}
}

// 显示浮动面板
export function showFloatPanel (name) {
  showDlg(FLOAT_PANEL[name], null, false, {
    minWidth: 300,
    minHeight: 200,
    resizable: true,
    okBtn: false,
    cancelBtn: false,
    ...Vue.store.state.main[name + 'PanelRect'],
    ...FLOAT_PANEL_PARAMS[name]
  })
}
