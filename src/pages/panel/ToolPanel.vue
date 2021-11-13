<template>
  <div class="q-px-sm q-py-xs row justify-center">
    <template v-for="i in BRUSH_MODES">
      <q-btn
        :key="'M@' + i.mode"
        :style="btnStyle('M@' + i.mode)"
        round
        flat
        dense
        :icon="i.icon"
        @click="brushMode = i.mode"
        @mouseover="hoverBtnId = 'M@' + i.mode"
        @mouseout="hoverBtnId = null"
        v-if="typeof i === 'object'"
      >
        <q-tooltip>{{ i.tips }}</q-tooltip>
      </q-btn>
      <div class="q-pa-xs" :key="i" v-else />
    </template>
  </div>
</template>

<script>
// 【工具栏】
import { mapState } from 'vuex'
import { mapStateRW } from 'boot/utils'

// 笔刷模式
const BRUSH_MODES = [
  { mode: null, icon: 'pan_tool', tips: '自由拖拽视图（按住空格键时自动进入）' },
  's1',
  { mode: 1, icon: 'add_circle_outline', tips: '笔刷模式：叠加' },
  { mode: 2, icon: 'remove_circle_outline', tips: '笔刷模式：扣除' },
  { mode: 3, icon: 'edit', tips: '笔刷模式：合并' },
  { mode: 4, icon: 'cleaning_services', tips: '笔刷模式：清除' }
]

export default {
  data: () => ({
    BRUSH_MODES,
    hoverBtnId: null // 当前鼠标悬停的按钮标识
  }),

  inject: {
    dialog: {
      from: 'dialog',
      default: null
    }
  },

  computed: {
    ...mapState('main', ['toolPanelFloat']),
    ...mapStateRW('edit', ['brushMode'])
  },

  watch: {
    // 隐藏浮动面板
    toolPanelFloat(val) {
      if (val || !this.dialog) return
      this.dialog.hide()
    }
  },

  methods: {
    // 按钮样式
    // - @btnId 按钮标识
    btnStyle(btnId) {
      const selected = btnId === 'M@' + this.brushMode
      const hover = btnId === this.hoverBtnId
      return {
        marginLeft: selected ? '4px' : null,
        marginRight: selected ? '4px' : null,
        opacity: selected || hover ? 1 : 0.3,
        transform: this.$makeTransform(selected ? 1.2 : 0.8)
      }
    }
  }
}
</script>
