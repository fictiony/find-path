import Vue from 'vue'

// 【自定义选项表合并策略】
const PROP_TYPES = ['props', 'computed', 'inject']
const strats = Vue.config.optionMergeStrategies
const oldStrats = Object.assign({}, strats)
PROP_TYPES.forEach(type => {
  strats[type] = function (parent, child, vm, key) {
    const ret = oldStrats[type](parent, child, vm, key)
    for (const i in child) {
      const def = child[i]
      switch (type) {
        case 'props':
          if (def.type === null) delete ret[i]
          break
        case 'computed':
          if (def === null) delete ret[i]
          break
        case 'inject':
          if (def.from === null) delete ret[i]
          break
      }
    }
    return ret
  }
})

// 【工具方法】
const VUE_FILENAME_FORMAT = /[^./\\]+(?=\.vue$)/
Object.assign(Vue.prototype, {
  // 输出日志（用于解决模板中无法使用console.log的缺陷）
  $log (...args) {
    console.log(...args)
  },

  // 获取组件名
  // - @options 组件选项表（若未指定则取当前组件的选项表）
  $getName (options) {
    options ||= this.$options
    const name = options.name || options._componentTag
    if (name) return name
    if (options.__file) {
      const filename = options.__file.match(VUE_FILENAME_FORMAT)[0]
      return filename ? `<${filename}.vue>` : '<Unknown Component>'
    }
    return this.$parent ? '<Anonymous Component>' : '<Root>'
  },

  // 转换驼峰命名
  $toCamelCase (name) {
    return name.replace(/-\w/g, m => m[1].toUpperCase())
  },

  // 转换中划线命名
  $toKebabCase (name) {
    return name.replace(/[A-Z]/g, m => '-' + m.toLowerCase()).replace(/^-/, '')
  },

  // 强制设置属性（屏蔽Vue警告）
  $forceSet (prop, value) {
    if (process.env.NODE_ENV === 'production') {
      this[prop] = value
    } else {
      const silent = Vue.config.silent
      Vue.config.silent = true
      try {
        this[prop] = value
      } finally {
        Vue.config.silent = silent
      }
    }
    // 同时触发更新事件，以模拟原单向数据流效果
    if (prop === ((this.$options.model || {}).prop || 'value')) {
      this.$emit((this.$options.model || {}).event || 'input', value)
    } else {
      this.$emit('update:' + prop, value)
    }
  },

  // 获取插槽内容
  // - @slot 插槽名
  // - @defaults 默认虚拟节点列表（插槽未指定时取）
  // - @after 要合并到的已有虚拟节点列表，若指定，则将插槽内容合并到该列表后面，并返回合并后的列表
  // - @return 虚拟节点列表
  $getSlot (slot, defaults, after) {
    const f = this.$scopedSlots[slot]
    const nodes = f == null ? defaults || [] : f()
    return after == null ? nodes : after.concat(nodes)
  },

  // 注入插槽
  // - @slot 插槽名
  // - @id 注入ID（相同ID的注入将被替换而非新增，但一前一后则可共存）
  // - @nodes 要注入的虚拟节点列表（null表示删除该注入），亦可为一个返回虚拟节点列表的函数（参数为注入前的虚拟节点列表），表示整体替换
  // - @before 是否加到最前面（否则加到最后面），替换时位置不变（当nodes为函数时忽略此参数）
  $injectSlot (slot, id, nodes, before = false) {
    const injection = { id, nodes }
    const f = this.$scopedSlots[slot]
    if (f && f.__origSlot) {
      let side
      if (nodes instanceof Function) {
        side = f.__injectSwap
        before = false
      } else if (before) {
        side = f.__injectBefore
      } else {
        side = f.__injectAfter
      }
      const index = side.findIndex(item => item.id === id)
      if (index < 0) {
        if (nodes == null) return
        if (before) {
          side.unshift(injection)
        } else {
          side.push(injection)
        }
      } else {
        if (nodes == null) {
          side.splice(index, 1)
        } else {
          side[index] = injection
        }
      }
    } else {
      if (nodes == null) return
      const injected = props => {
        const nodes = [
          injected.__injectBefore.flatMap(item => item.nodes || []),
          (injected.__origSlot && injected.__origSlot(props)) || [],
          injected.__injectAfter.flatMap(item => item.nodes || [])
        ]
        return injected.__injectSwap.reduce((all, item) => {
          return item.nodes(all) || []
        }, nodes.flat())
      }
      injected.__origSlot = f
      injected.__injectBefore = []
      injected.__injectAfter = []
      injected.__injectSwap = []
      if (nodes instanceof Function) {
        injected.__injectSwap.push(injection)
      } else if (before) {
        injected.__injectBefore.push(injection)
      } else {
        injected.__injectAfter.push(injection)
      }
      this.$scopedSlots[slot] = injected
    }
  }
})
