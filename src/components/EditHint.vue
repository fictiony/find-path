<template>
  <div class="q-space text-center ellipsis">{{ editHint }}</div>
</template>

<script>
// 【编辑状态信息】
import { mapState } from 'vuex'
import PathNode from 'src/core/PathNode'

export default {
  computed: {
    ...mapState('edit', ['xGrids', 'yGrids', 'gridStates', 'pathStates']),
    ...mapState('edit', ['brushMode', 'brushType', 'brushSize', 'brushSoft', 'brushState', 'brushPos']),

    // 编辑状态信息
    editHint() {
      const parts = []
      parts.push(`⬜ ${this.xGrids} * ${this.yGrids}`)
      parts.push(`🖌️ [${this.brushMode || 0}-${this.brushType}] ${this.brushSize} * ${this.brushSoft} * ${this.brushState}`)
      if (this.brushPos) {
        const { x, y } = this.brushPos
        const id = PathNode.xyToId(x, y)
        parts.push(`🖱️ ${x}, ${y}`)
        parts.push(`🅱️ ${this.gridStates.get(id) || 0}`)
        const state = this.pathStates.get(id)
        state && parts.push(`🔀 ${state}`)
      }
      return parts.join('　')
    }
  }
}
</script>
