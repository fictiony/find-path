import Vue from 'vue'
import Plugin from '@quasar/quasar-ui-qmarkdown'
import '@quasar/quasar-ui-qmarkdown/dist/index.css'
Vue.use(Plugin)

import PropPanel from './PropPanel'
import ComponentSelector from './ComponentSelector'

const inspect = {
  extraApi: {}, // 额外的API文档：{ 类名: import('API文档.json') }
  hideClose: true, // 是否隐藏关闭按钮
  getDocUrl: null, // 获取API文档网址的函数：类名 => 网址
  selectorHolder: 'body', // 自动创建组件选择器的容器id

  apiCache: {}, // API缓存表
  propPanel: null, // 属性面板
  selector: null, // 组件选择器
  selecting: false, // 是否正在选择组件
  target: null // 当前选中的目标（可为组件或API信息）
}

export {
  inspect,
  PropPanel,
  ComponentSelector
}
