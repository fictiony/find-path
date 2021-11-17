<template>
  <div class="absolute no-pointer-events" :style="cursorStyle" v-if="visible">
    <BrushPattern ref="pattern" class="absolute" :style="patternStyle" />
  </div>
</template>

<script>
// 【笔刷光标】
import { mapState, mapGetters } from 'vuex'

export default {
  inject: ['page'],

  computed: {
    ...mapState('edit', ['gridSize', 'pointMode', 'brushMode', 'brushSize', 'brushPos']),
    ...mapGetters('edit', ['halfGridWidth', 'halfGridHeight']),

    // 是否显示
    visible() {
      return !this.pointMode && !!this.brushMode && !!this.brushPos && !this.page.isDragging && !this.page.brushDown
    },

    // 光标样式
    cursorStyle() {
      if (!this.brushPos) return
      return {
        left: this.brushPos.x * this.gridSize - this.halfGridWidth + 'px',
        top: this.brushPos.y * this.gridSize - this.halfGridHeight + 'px',
        opacity: 0.8
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
        height: size + 'px'
      }
    }
  }
}
</script>
