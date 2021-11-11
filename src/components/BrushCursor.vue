<template>
  <div class="absolute" :style="cursorStyle" v-show="brushPos">
    <BrushPattern class="absolute no-pointer-events" :style="patternStyle" />
  </div>
</template>

<script>
// 【笔刷光标】
import { mapState, mapGetters } from 'vuex'

export default {
  computed: {
    ...mapState('edit', ['gridSize', 'brushMode', 'brushSize', 'brushPos', 'brushDown']),
    ...mapGetters('edit', ['halfGridWidth', 'halfGridHeight']),

    // 光标样式
    cursorStyle() {
      if (!this.brushPos) return
      return {
        left: this.brushPos.x * this.gridSize - this.halfGridWidth + 'px',
        top: this.brushPos.y * this.gridSize - this.halfGridHeight + 'px'
      }
    },

    // 图案样式
    patternStyle() {
      const offset = -Math.floor(this.brushSize / 2) * this.gridSize
      const size = this.brushSize * this.gridSize
      return {
        left: offset + 'px',
        top: offset + 'px',
        width: size + 'px',
        height: size + 'px',
        opacity: this.brushDown ? 1 : 0.5
      }
    }
  }
}
</script>
