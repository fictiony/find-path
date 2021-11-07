import { QDrawer, QSplitter } from 'quasar'
import { swapProp } from './mixins'

// 【扩展侧滑栏】
// - 增加边缘可拖拽拉伸大小的功能，并可设置最大最小宽度
export default {
  name: 'MyDrawer',
  extends: QDrawer,
  mixins: [
    swapProp('width', 'realWidth')
  ],
  components: {
    'my-drawer-resizer': QSplitter.extend({ // 把QSplitter定制成边缘拖拽条
      methods: {
        __pan(evt) {
          QSplitter.options.methods.__pan.call(this, evt)
          this.__maxValue = Infinity // 最大范围改为不限，这样拖拽时就可以不受div宽度限制
        }
      }
    })
  },

  props: {
    // [ 最小宽度, 最大宽度 ]，可直接借用QSplitter的limits定义
    limits: QSplitter.options.props.limits,

    // 边缘拖拽条自定义样式
    resizerClass: [Array, String, Object],
    resizerStyle: {
      type: [Array, String, Object],
      default: 'width: 0px'
    }
  },

  computed: {
    // 重载size，改从realWidth取值
    size () {
      return this.isMini ? this.miniWidth : this.realWidth
    }
  },

  render(h) {
    this.$injectSlot('default', 'splitter', nodes => { // 在默认插槽外层注入一个分隔条
      return [
        h('div', { // 多加一层div以防止出现横向滚动条
          staticClass: 'fit no-scroll'
        }, [
          h('my-drawer-resizer', {
            staticClass: 'q-drawer__resizer fit',
            props: {
              value: this.realWidth,
              limits: this.limits,
              unit: 'px',
              reverse: this.side === 'right',
              emitImmediately: true,
              separatorClass: this.resizerClass,
              separatorStyle: this.resizerStyle
            },
            on: {
              input: value => {
                this.realWidth = value
              }
            },
            scopedSlots: { // 把原先的插槽内容，改放到分隔条的一侧插槽内
              [this.side === 'right' ? 'after' : 'before']: () => nodes,
              separator: () => this.$getSlot('resizer')
            }
          })
        ])
      ]
    })
    return QDrawer.options.render.call(this, h)
  }
}
