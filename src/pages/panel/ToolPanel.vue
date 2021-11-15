<template>
  <div class="q-px-sm q-py-xs row justify-center no-scroll">
    <template v-for="i in TOOL_BTNS">
      <q-btn
        :key="i.id"
        :style="btnStyle(i)"
        round
        flat
        dense
        :icon="i.icon"
        @click="onClick(i)"
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
import { POINT_MODES, BRUSH_MODES } from 'boot/draw'

// 工具按钮
const TOOL_BTNS = [
  { id: 0, value: null, icon: 'pan_tool', tips: '自由拖拽视图（按住空格键时自动进入）' },
  's1',
  ...POINT_MODES.map(i => ({ id: 'P@' + i.value, value: i.value, icon: i.icon, tips: '指定' + i.name })),
  's2',
  ...BRUSH_MODES.map(i => ({ id: 'B@' + i.value, value: i.value, icon: i.icon, tips: '笔刷模式 - ' + i.name }))
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
    ...mapStateRW('edit', ['pointMode', 'brushMode'])
  },

  watch: {
    // 隐藏浮动面板
    toolPanelFloat(val) {
      if (val || !this.dialog) return
      this.dialog.hide()
    }
  },

  methods: {
    // 按钮信息
    // - @btn 按钮信息
    btnStyle(btn) {
      const hover = btn.id === this.hoverBtnId
      let selected = false
      if (this.pointMode) {
        if (btn.id === 'P@' + this.pointMode) selected = true
      } else if (this.brushMode) {
        if (btn.id === 'B@' + this.brushMode) selected = true
      } else {
        if (btn.id === 0) selected = true
      }
      return {
        marginLeft: selected ? '4px' : null,
        marginRight: selected ? '4px' : null,
        opacity: selected || hover ? 1 : 0.3,
        transform: this.$makeTransform(selected ? 1.2 : 0.8)
      }
    },

    // 按钮点击处理
    onClick(btn) {
      if (btn.id === 0) {
        this.pointMode = null
        this.brushMode = null
      } else {
        const tag = btn.id.substr(0, 2)
        if (tag === 'P@') {
          this.pointMode = btn.value
        } else if (tag === 'B@') {
          this.pointMode = null
          this.brushMode = btn.value
        }
      }
    }
  }
}
</script>
