<template>
  <div class="absolute-full column no-wrap no-scroll" @click="bringToFront">
    <q-bar class="_bar q-pr-none sticky-top" :class="$q.dark.isActive ? '' : 'bg-grey-3 text-primary'" dense v-if="title">
      <div
        class="_mover absolute-full"
        @mousedown="bringToFront"
        v-touch-pan.mouse.prevent.preserveCursor="dialog.dragMove"
        @dblclick="canFold ? toggleFold() : canFloat && toggleFloat()"
        v-if="dialog && dialog.movable"
      />
      <div class="q-space ellipsis" @dblclick="dialog && canFold ? toggleFold() : canFloat && toggleFloat()">{{ title }}</div>
      <div
        class="_resizer absolute-top"
        v-touch-pan.mouse.prevent.preserveCursor="e => dialog.dragResize(e, 0, -1)"
        v-if="dialog && dialog.resizable && !isFold"
      />
      <q-btn flat dense @click="toggleFold" v-if="dialog && canFold">
        <q-icon :name="isFold ? 'expand_more' : 'expand_less'" size="xs" />
        <q-tooltip>{{ isFold ? '展开面板' : '收拢面板' }}</q-tooltip>
      </q-btn>
      <q-btn flat dense @click="toggleFloat" v-if="canFloat">
        <q-icon :name="isFloat ? 'south_west' : 'north_east'" size="xs" />
        <q-tooltip>{{ isFloat ? '嵌入侧栏' : '面板浮动' }}</q-tooltip>
      </q-btn>
      <q-btn flat dense @click="hide" v-if="state">
        <q-icon name="close" size="xs" />
      </q-btn>
    </q-bar>

    <div
      class="absolute-full"
      @mousedown="bringToFront"
      v-touch-pan.mouse.prevent.preserveCursor="dialog.dragMove"
      v-else-if="dialog && dialog.movable"
    />

    <template v-if="!dialog || !isFold">
      <template v-if="tabs">
        <q-tabs
          inline-label
          no-caps
          :content-class="$q.dark.isActive ? 'bg-grey-8' : 'bg-primary text-white'"
          breakpoint="0"
          align="left"
          active-color="primary"
          active-bg-color="white"
          indicator-color="white"
          v-model="curTab"
        >
          <q-tab v-for="tab in tabs" :key="tab.name" class="q-px-xs" style="height: 28px; min-height: 0px" v-bind="tab" />
        </q-tabs>

        <q-tab-panels class="q-space" keep-alive v-model="curTab" v-if="tabs">
          <q-tab-panel v-for="tab in tabs" :key="tab.name" :name="tab.name" class="q-pa-none">
            <slot :name="tab.name" />
            <slot />
          </q-tab-panel>
        </q-tab-panels>
      </template>

      <div class="absolute-full" :class="title ? '_panel' : dialog && dialog.movable ? 'no-pointer-events' : ''" v-else>
        <slot />
      </div>
    </template>
  </div>
</template>

<script>
// 【浮动面板】
import { debounce } from 'quasar'

export default {
  data: () => ({
    tab: '' // 当前分页名（仅用于tabState属性未指定时）
  }),

  props: {
    title: String, // 面板标题（若未指定则无标题栏）
    state: String, // 关联状态（对应到store.main中的状态名，若未指定，则无关闭按钮和切换浮动按钮）
    canFloat: {
      // 是否可浮动
      type: Boolean,
      default: true
    },
    canFold: {
      // 是否可收拢
      type: Boolean,
      default: true
    },
    tabs: Array, // 分页列表（若未指定，则无分页），每项格式：{ name: 分页名, label: 分页标题, icon: 分页图标 }
    tabState: String // 当前选中分页的关联状态（对应到store.main中的状态名，若未指定，则不关联）
  },

  inject: {
    dialog: {
      from: 'dialog',
      default: null
    }
  },

  computed: {
    // 是否浮动
    isFloat() {
      return this.$store.state.main[this.state] && this.$store.state.main[this.state + 'Float']
    },

    // 是否收拢面板
    isFold() {
      return this.$store.state.main[this.state + 'Fold']
    },

    // 浮动面板位置大小
    floatRect() {
      return this.$store.state.main[this.state + 'Rect']
    },

    // 当前选中的分页名
    curTab: {
      get() {
        return this.tabState ? this.$store.state.main[this.tabState] : this.tabs ? this.tab || this.tabs[0].name : ''
      },
      set(val) {
        if (this.tabState) {
          this.$store.commit('main/' + this.tabState, val)
        } else {
          this.tab = val
        }
      }
    }
  },

  watch: {
    // 隐藏浮动面板
    isFloat(val) {
      if (val || !this.dialog) return
      this.dialog.hide()
    },

    // 收拢展开浮动面板
    isFold: {
      handler(val) {
        if (!this.dialog) return
        this.dialog.curHeight = val ? 22 : this.floatRect.height
      },
      immediate: true
    },

    // 更新浮动面板位置大小
    floatRect(val) {
      this.__floatRect = val
      if (!this.dialog) return
      this.dialog.curX = val.x
      this.dialog.curY = val.y
      this.dialog.curWidth = val.width
      this.dialog.curHeight = this.isFold ? 22 : val.height
    },

    // 浮动面板位置大小变化后更新记录
    'dialog.curX'(val) {
      this.updateFloatRect('x', val)
    },
    'dialog.curY'(val) {
      this.updateFloatRect('y', val)
    },
    'dialog.curWidth'(val) {
      this.updateFloatRect('width', val)
    },
    'dialog.curHeight'(val) {
      if (this.isFold) return
      this.updateFloatRect('height', val)
    }
  },

  methods: {
    // 鼠标点击时移到最上层
    bringToFront() {
      this.dialog && this.dialog.$bringToFront()
    },

    // 隐藏
    hide() {
      this.$store.commit('main/' + this.state, false)
    },

    // 切换浮动
    toggleFloat() {
      this.$store.commit('main/' + this.state + 'Float', !this.isFloat)
    },

    // 切换收拢
    toggleFold() {
      this.$store.commit('main/' + this.state + 'Fold', !this.isFold)
    },

    // 更新浮动面板位置大小记录
    // - @prop 属性名
    // - @value 取值
    updateFloatRect(prop, value) {
      if (!this.state) return
      const rect = this.__floatRect || this.floatRect
      if (rect[prop] === value) return
      this.__floatRect = {
        ...rect,
        [prop]: value
      }
      this.recordFloatRect()
    },

    // 记录浮动面板位置大小
    recordFloatRect: debounce(function () {
      this.$store.commit('main/' + this.state + 'Rect', this.__floatRect)
    }, 100)
  }
}
</script>

<style lang="scss" scoped>
._bar {
  height: 22px;
  z-index: 99999999;
}
._mover {
  cursor: move;
}
._resizer {
  width: 100%;
  height: 5px;
  cursor: s-resize;
}
._panel {
  margin: 22px 0 0 0;
}
</style>
