import Vue from 'vue'
import { showDlg } from 'boot/utils'

import ToolPanel from './ToolPanel.vue'
import OperatePanel from './OperatePanel.vue'

// 浮动面板表
export const FLOAT_PANEL = {
  tool: ToolPanel,
  operate: OperatePanel
}

// 浮动面板名称列表
export const FLOAT_PANEL_NAMES = Object.keys(FLOAT_PANEL)

// 浮动面板自定义参数
const FLOAT_PANEL_PARAMS = {
  tool: {
    y: 32,
    width: 200,
    height: 42,
    minWidth: 0,
    minHeight: 0,
    resizable: false,
    movable: false,
    cardStyle: {
      backgroundColor: '#0000',
      backdropFilter: 'blur(6px)',
      boxShadow: 'none'
    }
  },
  operate: {
    minWidth: 180,
    maxWidth: 500,
    cardStyle: {
      backgroundColor: '#0000',
      backdropFilter: 'blur(6px)'
    }
  }
}

// 显示浮动面板
export function showFloatPanel (name) {
  showDlg(FLOAT_PANEL[name], null, false, {
    minWidth: 300,
    minHeight: 200,
    resizable: true,
    okBtn: false,
    cancelBtn: false,
    transitionShow: '',
    transitionHide: '',
    ...Vue.store.state.main[name + 'PanelRect'],
    ...FLOAT_PANEL_PARAMS[name]
  })
}
