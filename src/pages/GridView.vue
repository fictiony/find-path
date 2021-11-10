<template>
  <canvas class="absolute-center" :style="canvasStyle" :width="xGrids" :height="yGrids" />
</template>

<script>
// 【网格视图】
import { mapState, mapGetters } from 'vuex'
import { debounce } from 'quasar'
// import { setPixel } from 'boot/draw'

export default {
  data: () => ({
    bgPattern: null // 背景图案（半透明黑白相间棋盘格）
  }),

  computed: {
    ...mapState('edit', ['xGrids', 'yGrids', 'gridSize', 'brushPos']),
    ...mapGetters('edit', ['brushStates']),

    // 画布样式
    canvasStyle() {
      return {
        width: this.xGrids * this.gridSize + 'px',
        height: this.yGrids * this.gridSize + 'px',
        imageRendering: 'pixelated'
      }
    }
  },

  watch: {
    xGrids: 'refreshGrids',
    yGrids: 'refreshGrids',
    brushPos: 'refreshBrushGrids',
    brushStates: 'refreshBrushGrids'
  },

  methods: {
    // 初始化背景图案
    initBgPattern() {
      const canvas = document.createElement('canvas')
      canvas.width = 2
      canvas.height = 2
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#0001'
      ctx.fillRect(0, 0, 1, 1)
      ctx.fillRect(1, 1, 1, 1)
      ctx.fillStyle = '#fff1'
      ctx.fillRect(0, 1, 1, 1)
      ctx.fillRect(1, 0, 1, 1)
      this.bgPattern = ctx.createPattern(canvas, 'repeat')
    },

    // 刷新指定区域网格
    // - @x, y, width, height 区域范围
    refreshArea(x, y, width, height) {
      const ctx = this.$el.getContext('2d')
      ctx.clearRect(x, y, width, height)
      ctx.fillStyle = this.bgPattern
      ctx.fillRect(x, y, width, height)

      // const imageData = ctx.createImageData(width, height)
      // const data = imageData.data
      // for (let j = 0, index = 0; j < height; j++) {
      //   for (let i = 0, t = x + y + j; i < width; i++) {
      //     // 绘制格点颜色
      //     //
      //     index += 4
      //   }
      // }
      // ctx.putImageData(imageData, x, y)
    },

    // 刷新全部网格
    refreshGrids: debounce(function () {
      const tm = Date.now()
      this.refreshArea(0, 0, this.xGrids, this.yGrids)
      console.log('用时', Date.now() - tm)
    }, 10),

    // 刷新笔刷区域网格
    refreshBrushGrids: debounce(function () {
      // this.refreshArea(0, 0, this.brushSize, this.brushSize)
    }, 10)
  },

  mounted() {
    this.initBgPattern()
    this.refreshGrids()
  }
}
</script>
