<template>
  <div class="q-space text-center ellipsis">{{ editHint }}</div>
</template>

<script>
// 【编辑状态信息】
import { mapState } from 'vuex'

export default {
  computed: {
    ...mapState('edit', ['xGrids', 'yGrids', 'gridStates', 'brushMode', 'brushType', 'brushSize', 'brushSoft', 'brushState', 'brushPos']),

    // 编辑状态信息
    editHint() {
      const parts = []
      parts.push(`⬜ ${this.xGrids} * ${this.yGrids}`)
      parts.push(`🖌️ [${this.brushMode || 0}-${this.brushType}] ${this.brushSize} * ${this.brushSoft} * ${this.brushState}`)
      if (this.brushPos) {
        const { x, y } = this.brushPos
        parts.push(`🖱️ ${x}, ${y}`)
        parts.push(`0️⃣ ${this.gridStates[x + y * this.xGrids] || 0}`)
      }
      return parts.join(' - ')
    }
  }
}
</script>
