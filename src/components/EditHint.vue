<template>
  <div class="q-space text-center ellipsis">{{ editHint }}</div>
</template>

<script>
// 【编辑状态信息】
import { mapState } from 'vuex'

export default {
  computed: {
    ...mapState('edit', ['xGrids', 'yGrids', 'brushMode', 'brushType', 'brushSize', 'brushSoft', 'brushState', 'brushPos']),

    // 编辑状态信息
    editHint() {
      const parts = []
      parts.push(`⬜ ${this.xGrids} * ${this.yGrids}`)
      parts.push(`🖌️ [${this.brushMode || 0}-${this.brushType}] ${this.brushSize} * ${this.brushSoft} * ${this.brushState}`)
      if (this.brushPos) {
        parts.push(`🖱️ ${this.brushPos.x}, ${this.brushPos.y}`)
      }
      return parts.join(' - ')
    }
  }
}
</script>
