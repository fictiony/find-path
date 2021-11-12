// 【组件监视器】
import Vue from 'vue'
import Plugin from '@quasar/quasar-ui-qmarkdown'
import '@quasar/quasar-ui-qmarkdown/dist/index.css'
Vue.use(Plugin)
import { inspect, PropPanel } from 'components/thirdparty/inspect'
import { showDlg } from 'boot/utils'

// 添加额外API文档
Object.assign(inspect.extraApi, {
  MySplitter: import('components/thirdparty/plus/MySplitter.json'),
  MyDrawer: import('components/thirdparty/plus/MyDrawer.json')
})

// 打开监视器
export function openInspector () {
  if (inspect.propPanel) return
  inspect.hideClose = true
  showDlg(PropPanel, '组件监视器', false, {
    class: 'text-select',
    style: {
      right: '0px',
      bottom: '0px'
    },
    okBtn: false,
    cancelBtn: false,
    resizable: true,
    width: 300,
    height: 600,
    minWidth: 200,
    minHeight: 200,
    maxWidth: 500
  }).onDismiss(() => {
    inspect.selecting = false
    inspect.target = null

    // 自动销毁组件选择器
    setTimeout(() => {
      if (!inspect.selector) return
      const el = inspect.selector.$el
      inspect.selector.$destroy()
      el.remove()
    })
  })
}
Vue.prototype.$inspector = openInspector

// 打印对象的所有属性
// - @onlyTypes 限制只打印指定类型（可为函数或字符串：string|number|boolean|function|symbol|null|undefined）
export function traceProps (obj = this, ...onlyTypes) {
  const props = {}
  const protos = []
  let proto = obj
  while (proto != null) {
    protos.push(proto)
    Object.getOwnPropertyNames(proto).forEach(name => {
      if (name in props) return
      const value = obj[name]
      if (onlyTypes.length > 0) {
        let match = false
        for (let i = 0; i < onlyTypes.length; i++) {
          const type = onlyTypes[i]
          if (type === 'null') {
            match = value === null
          } else if (typeof type === 'string') {
            const t = typeof value
            match = t === type
          } else if (type instanceof Function) {
            match = value instanceof type
          }
          if (match) break
        }
        if (!match) return
      }
      props[name] = value
    })
    proto = Object.getPrototypeOf(obj)
    if (protos.includes(proto)) break // 避免死循环
  }
  Object.keys(props)
    .sort()
    .forEach(name => {
      console.log(name + ':', props[name])
    })
}
Vue.prototype.$traceProps = traceProps

// 监视Vue组件渲染
// - @filter 组件名筛选（可为字符串、RegExp或 数组，'*'表示监视所有组件，空表示取消监视）
// - @watcher 监视函数（默认为console.log），参数为组件名称
let oldRender = null
let watchRenderFilter = ''
let renderWatcher = null
export function watchRender (filter = '*', watcher = console.log) {
  watchRenderFilter = filter
  renderWatcher = watcher
  if (oldRender) {
    if (filter) return
    Vue.prototype._render = oldRender
    oldRender = null
  } else {
    if (!filter) return
    oldRender = Vue.prototype._render
    Vue.prototype._render = function () {
      if (watchingVue(this)) {
        renderWatcher(vueName(this))
      }
      return oldRender.call(this)
    }
  }
}
Vue.prototype.$watchRender = watchRender

// 判断Vue组件是否要监视
function watchingVue (component) {
  if (watchRenderFilter === '*') return true
  const name = vueName(component)
  if (typeof watchRenderFilter === 'string') return watchRenderFilter === name
  if (watchRenderFilter instanceof RegExp) return watchRenderFilter.test(name)
  if (watchRenderFilter instanceof Array) {
    return (
      watchRenderFilter.findIndex(i => {
        if (typeof i === 'string') return i === name
        if (i instanceof RegExp) return i.test(name)
        return false
      }) >= 0
    )
  }
  return false
}

// 获取Vue组件名称
function vueName (component) {
  const options = component.$options
  return (
    options.name ||
    options._componentTag ||
    `<${options.__file || 'Anonymous Component'}>`
  )
}

// 统计操作次数
// - @info 操作信息（统一转为字符串）
// - @delay 打印间隔（毫秒），不同间隔的统计将分开进行
const stats = {}
export function statTimes (info, delay = 1000) {
  const stat = stats[delay] || {}
  stat[info] = (stat[info] || 0) + 1
  if (delay in stats) return
  stats[delay] = stat
  setTimeout(() => {
    Object.keys(stat).forEach(info => {
      console.log(info, '=', stat[info])
    })
    delete stats[delay]
  }, delay)
}
Vue.prototype.$statTimes = statTimes

// 统计Vue组件渲染次数
// - @filter 同上
// - @delay 打印间隔（毫秒）
export function statRender (filter = '*', delay = 1000) {
  watchRender(filter, filter ? name => statTimes('渲染 ' + name, delay) : null)
}
Vue.prototype.$statRender = statRender
