import { QSplitter, QResizeObserver } from 'quasar'
import { swapProp } from './mixins'

// 【扩展分隔条】
// - 增加二区最小像素范围限制的支持
// - 增加区域大小改变后的实时响应
// - 重定义value属性，并新增position属性，以实现组件的封装性（即无需依赖v-model）
export default {
  name: 'MySplitter',
  extends: QSplitter,
  mixins: [
    swapProp('position', 'value', 'input')
  ],

  props: {
    // 取消value属性（改为data类属性），并新增position属性来代替，且非必须提供
    value: null,
    position: {
      type: Number,
      default: 50
    },

    // [ 一区最小像素范围, 二区最小像素范围 ]，若设置则limits无效
    limits2: {
      type: Array,
      validator: v => {
        if (v.length !== 2) return false
        if (typeof v[0] !== 'number' || typeof v[1] !== 'number') return false
        return v[0] >= 0 && v[1] >= 0
      }
    }
  },

  model: {
    prop: 'position' // v-model也改为指向position属性
  },

  computed: {
    // 重载区域范围计算
    computedLimits() {
      // console.log('【computedLimits】', this.$el)
      if (this.$el) { // limits2依赖于整体大小来计算二区大小，故必须挂载后才能计算
        let v = this.limits2
        if (v !== undefined) {
          if (this.reverse) {
            v = [v[1], v[0]]
          }
          const total = this.$el.getBoundingClientRect()[this.prop]
          v = [v[0], Math.max(v[0], total - v[1])]
          return this.unit === '%' ? v.map(i => i / total * 100) : v
        }
      }
      // limits2未指定或未挂载时，保持原样
      return QSplitter.options.computed.computedLimits.call(this)
    }
  },

  watch: {
    limits2: QSplitter.options.watch.limits // limits2变了也要矫正value
  },

  methods: {
    __onResize() {
      this._computedWatchers.computedLimits.dirty = true // 由于DOM元素大小不可响应，故需手动强制重算
      this.__normalize(this.value, this.computedLimits) // 矫正value
    }
  },

  mounted() {
    this.$on('input', value => { // 监听input事件并自动更新value，以解除对v-model的依赖
      this.value = value
    })
  },

  render(h) {
    this.$injectSlot('default', 'QResizeObserver', [ // 解决div无法监听resize事件的问题
      h(QResizeObserver, {
        props: { debounce: 0 },
        on: { resize: this.__onResize }
      })
    ])
    return QSplitter.options.render.call(this, h)
  }
}
