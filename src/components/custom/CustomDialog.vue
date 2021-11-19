<template>
  <q-dialog
    ref="dialog"
    :style="dialogStyle"
    v-bind="dialogParams"
    v-on="$listeners"
    :maximized="realMaximized"
    @before-show="bindKeys"
    @before-hide="unbindKeys"
  >
    <q-card ref="frame" class="absolute column no-wrap overflow-hidden" :class="cardClass" :style="realCardStyle">
      <q-bar
        class="relative-position q-pr-none overflow-hidden"
        :class="$q.dark.isActive ? '' : 'bg-grey-3 text-primary'"
        :style="titleStyle"
        v-if="title != null"
      >
        <div class="_mover absolute-full" v-touch-pan.mouse.prevent.preserveCursor="dragMove" v-if="movable && !realMaximized" />
        <div class="q-space ellipsis" v-html="title" />
        <q-btn class="q-pa-xs" flat dense @click="realMaximized = !realMaximized" v-if="maximizeBtn">
          <q-icon :name="realMaximized ? 'filter_none' : 'crop_square'" size="xs" />
        </q-btn>
        <q-btn class="q-pa-xs" flat dense @click="hide" v-if="closeBtn">
          <q-icon name="close" size="xs" />
        </q-btn>
      </q-bar>

      <div class="q-space relative-position">
        <div class="_mover absolute-full" v-touch-pan.mouse.prevent.preserveCursor="dragMove" v-if="title === null && movable && !realMaximized" />
        <slot>
          <div v-html="content" v-bind="contentParams" v-if="typeof content === 'string'" />
          <component ref="content" :is="content" v-bind="contentParams" @close="hide" v-else />
        </slot>
      </div>

      <template v-if="okBtn || yesBtn || noBtn || cancelBtn">
        <q-separator />
        <q-card-actions class="q-px-md" align="right">
          <CommonForm
            :form="actionForm"
            :input-params="{ t: 'btn', class: $q.dark.isActive ? 'bg-grey-9' : 'bg-grey-2 text-primary', style: 'min-width: 90px', flat: true }"
          />
        </q-card-actions>
      </template>

      <template v-if="resizable && !realMaximized">
        <div class="_resizer-tb absolute-top" v-touch-pan.mouse.prevent.preserveCursor="e => dragResize(e, 0, -1)" />
        <div class="_resizer-tb absolute-bottom" v-touch-pan.mouse.prevent.preserveCursor="e => dragResize(e, 0, 1)" />
        <div class="_resizer-lr absolute-left" v-touch-pan.mouse.prevent.preserveCursor="e => dragResize(e, -1, 0)" />
        <div class="_resizer-lr absolute-right" v-touch-pan.mouse.prevent.preserveCursor="e => dragResize(e, 1, 0)" />
        <div class="_resizer-tlbr absolute-top-left" v-touch-pan.mouse.prevent.preserveCursor="e => dragResize(e, -1, -1)" />
        <div class="_resizer-trbl absolute-top-right" v-touch-pan.mouse.prevent.preserveCursor="e => dragResize(e, 1, -1)" />
        <div class="_resizer-trbl absolute-bottom-left" v-touch-pan.mouse.prevent.preserveCursor="e => dragResize(e, -1, 1)" />
        <div class="_resizer-tlbr absolute-bottom-right" v-touch-pan.mouse.prevent.preserveCursor="e => dragResize(e, 1, 1)" />
      </template>
    </q-card>
  </q-dialog>
</template>

<script>
// 【自定义对话框】
import Vue from 'vue'
import { mapState } from 'vuex'
import key from 'keymaster'
import { QDialog } from 'quasar'
import { swapProp } from 'components/thirdparty/plus/mixins'
import { exposeChildMethods } from 'boot/utils'

export default {
  mixins: [
    swapProp('maximized', 'realMaximized'),
    swapProp('x', 'curX'),
    swapProp('y', 'curY'),
    swapProp('width', 'curWidth'),
    swapProp('height', 'curHeight')
  ],

  props: {
    ...QDialog.options.props,

    model: Boolean, // 是否模态对话框（可使用独立快捷键）

    // 位置和宽高
    x: Number,
    y: Number,
    width: Number,
    height: Number,

    // 外框样式
    cardClass: [String, Array, Object],
    cardStyle: Object,

    // 标题栏样式
    titleStyle: [String, Array, Object],

    // 标题（null表示无标题栏）
    title: String,

    // 关闭按钮是否显示
    closeBtn: {
      type: Boolean,
      default: true
    },

    // 最大化按钮是否显示
    maximizeBtn: {
      type: Boolean,
      default: false
    },

    // 确定按钮是否显示，或按钮文字（空表示不显示）
    okBtn: {
      type: [Boolean, String],
      default: true
    },

    // 是按钮是否显示，或按钮文字（空表示不显示）
    yesBtn: {
      type: [Boolean, String],
      default: false
    },

    // 否按钮是否显示，或按钮文字（空表示不显示）
    noBtn: {
      type: [Boolean, String],
      default: false
    },

    // 取消按钮是否显示，或按钮文字（空表示不显示）
    cancelBtn: {
      type: [Boolean, String],
      default: true
    },

    // 是否可移动
    movable: {
      type: Boolean,
      default: true
    },

    // 是否可缩放
    resizable: Boolean,

    // 缩放限制最小最大宽高
    minWidth: {
      type: Number,
      default: 200
    },
    minHeight: {
      type: Number,
      default: 50
    },
    maxWidth: Number,
    maxHeight: Number,

    // 内容（可为组件或HTML）
    content: {
      required: true
    },

    // 内容组件参数（内容为HTML时，表示外层div元素的属性）
    contentParams: {
      type: Object,
      default: () => ({})
    }
  },

  computed: {
    $store: () => Vue.store, // 解决弹出窗口没有自动注入$store的问题
    ...mapState('main', ['uiZoom']),

    // 对话框样式
    dialogStyle() {
      return {
        zoom: 1 / this.uiZoom,
        zIndex: this.model ? 6000 : 5999
      }
    },

    // 对话框参数
    dialogParams() {
      const params = {}
      Object.keys(QDialog.options.props).forEach(i => {
        params[i] = this[i]
      })
      return params
    },

    // 实际外框样式
    realCardStyle() {
      const style = {
        ...this.cardStyle,
        zoom: this.uiZoom
      }
      if (this.realMaximized) {
        style.maxWidth = 100 / this.uiZoom + 'vw !important'
        style.maxHeight = 100 / this.uiZoom + 'vh !important'
      } else {
        if (this.curX != null) {
          style.left = Math.max(0, Math.min(this.getClientWidth() - (this.curWidth || this.minWidth), this.curX)) + 'px'
        }
        if (this.curY != null) {
          style.top = Math.max(0, Math.min(this.getClientHeight() - (this.curHeight || this.minHeight), this.curY)) + 'px'
        }
        if (this.curWidth != null) {
          style.width = Math.min(this.getClientWidth(), this.curWidth) + 'px'
        }
        if (this.curHeight != null) {
          style.height = Math.min(this.getClientHeight(), this.curHeight) + 'px'
        }
      }
      return style
    },

    // 操作按钮表单
    actionForm() {
      const btns = {}
      if (this.okBtn) btns.ok = { label: typeof this.okBtn === 'string' ? this.okBtn : '确定', onInput: () => this.ok() }
      if (this.yesBtn) btns.yes = { label: typeof this.yesBtn === 'string' ? this.yesBtn : '是', onInput: () => this.answer(true) }
      if (this.noBtn) btns.no = { label: typeof this.noBtn === 'string' ? this.noBtn : '否', onInput: () => this.answer(false) }
      if (this.cancelBtn) btns.cancel = { label: typeof this.cancelBtn === 'string' ? this.cancelBtn : '取消', onInput: () => this.hide() }
      return [btns]
    }
  },

  provide() {
    return {
      dialog: this
    }
  },

  methods: {
    ...exposeChildMethods('dialog', ['show', 'hide', 'toggle', 'focus', 'shake']),

    // 获取当前客户区域宽高
    getClientWidth() {
      return document.documentElement.clientWidth / this.uiZoom
    },
    getClientHeight() {
      return document.documentElement.clientHeight / this.uiZoom
    },

    // 点击确定
    ok() {
      // 先执行内容组件中的onOk方法（若返回false则中止）
      const contentComponent = this.$refs.content
      if (contentComponent && contentComponent.onOk instanceof Function) {
        const success = contentComponent.onOk()
        if (success === false) return
      }
      this.$emit('ok', contentComponent)
      this.hide()
    },

    // 点击答复
    answer(result) {
      this.$emit('ok', result)
      this.hide()
    },

    // 拖拽处理
    // - @cursor 鼠标指针
    // - @handler 处理函数
    dragDeal(e, cursor, handler) {
      document.documentElement.style.cursor = e.isFinal ? '' : cursor
      if (e.isFirst) {
        this.__initialRect = this.$refs.frame.$el.getBoundingClientRect()
      }
      handler()
      if (e.isFinal) {
        delete this.__initialRect
      }
    },

    // 拖拽移动
    dragMove(e, cursor = 'move') {
      this.dragDeal(e, cursor, () => {
        const maxX = this.getClientWidth() - this.__initialRect.width
        this.curX = Math.round(Math.max(0, Math.min(maxX, this.__initialRect.x + e.offset.x / this.uiZoom)))
        const maxY = this.getClientHeight() - this.__initialRect.height
        this.curY = Math.round(Math.max(0, Math.min(maxY, this.__initialRect.y + e.offset.y / this.uiZoom)))
      })
    },

    // 拖拽缩放
    dragResize(e, dx = 1, dy = 1) {
      const cursor = (dx ? (!dy ? '' : dx === dy ? 's' : 'n') + 'e' : 's') + '-resize'
      this.dragDeal(e, cursor, () => {
        if (dx) {
          const maxWidth = Math.min(this.maxWidth || Infinity, this.getClientWidth())
          this.curWidth = Math.round(Math.max(this.minWidth, Math.min(maxWidth, this.__initialRect.width + (e.offset.x * dx) / this.uiZoom)))
          if (dx < 0 && !(this.cardStyle && this.cardStyle.right && this.curX == null)) {
            const maxX = this.getClientWidth() - this.curWidth
            this.curX = Math.round(Math.max(0, Math.min(maxX, this.__initialRect.x + e.offset.x / this.uiZoom)))
          }
        }
        if (dy) {
          const maxHeight = Math.min(this.maxHeight || Infinity, this.getClientHeight())
          this.curHeight = Math.round(Math.max(this.minHeight, Math.min(maxHeight, this.__initialRect.height + (e.offset.y * dy) / this.uiZoom)))
          if (dy < 0 && !(this.cardStyle && this.cardStyle.bottom && this.curY == null)) {
            const maxY = this.getClientHeight() - this.curHeight
            this.curY = Math.round(Math.max(0, Math.min(maxY, this.__initialRect.y + e.offset.y / this.uiZoom)))
          }
        }
      })
    },

    // 绑定快捷键
    bindKeys() {
      if (this.__newScope || !this.model) return
      this.__oldScope = key.getScope()
      this.__newScope = 'dialog' + Math.random()
      key.setScope(this.__newScope)
      if (this.closeBtn || this.cancelBtn) {
        key('esc', this.__newScope, e => {
          e.stopPropagation()
          // 先执行内容组件中的onCancel方法（若返回false则中止）
          const contentComponent = this.$refs.content
          if (contentComponent && contentComponent.onCancel instanceof Function) {
            const success = contentComponent.onCancel()
            if (success === false) return
          }
          this.hide()
        })
      }
      if (this.okBtn) {
        key('enter', this.__newScope, e => {
          e.stopPropagation()
          this.ok()
        })
      }
    },

    // 解绑快捷键
    unbindKeys() {
      if (!this.__newScope) return
      key.unbind('esc', this.__newScope)
      key.unbind('enter', this.__newScope)
      key.setScope(this.__oldScope)
      delete this.__oldScope
      delete this.__newScope
    }
  }
}
</script>

<style lang="scss" scoped>
._mover {
  cursor: move;
}
._resizer-tb {
  width: 100%;
  height: 10px;
  cursor: s-resize;
}
._resizer-lr {
  width: 10px;
  height: 100%;
  cursor: e-resize;
}
._resizer-tlbr {
  width: 15px;
  height: 15px;
  cursor: se-resize;
}
._resizer-trbl {
  width: 15px;
  height: 15px;
  cursor: ne-resize;
}
</style>
