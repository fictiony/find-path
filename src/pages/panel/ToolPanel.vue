<template>
  <div class="q-px-sm q-py-xs row justify-center no-scroll">
    <template v-for="i in TOOL_BTNS">
      <q-btn
        :key="i.id"
        :style="btnStyle(i.id)"
        round
        flat
        dense
        :icon="i.icon"
        @click="brushMode = i.value"
        @mouseover="hoverBtnId = i.id"
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
import { BRUSH_MODES } from 'boot/draw'

// 工具按钮
const TOOL_BTNS = [
  { id: 'M@null', value: null, icon: 'pan_tool', tips: '自由拖拽视图（按住空格键时自动进入）' },
  's1',
  ...BRUSH_MODES.map(i => ({ id: 'M@' + i.value, value: i.value, icon: i.icon, tips: '笔刷模式 - ' + i.name }))
]

export default {
  data: () => ({
    TOOL_BTNS,
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
