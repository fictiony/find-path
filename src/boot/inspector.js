// 【组件监视器】
import Vue from 'vue'
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
