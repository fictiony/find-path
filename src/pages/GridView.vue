<template>
  <div>
    <canvas ref="canvas" class="absolute-center" :style="canvasStyle" :width="xGrids" :height="yGrids" />
    <!-- <div
      v-for="([x, y, w, h], i) in rects"
      :key="i"
      class="absolute"
      style="border: 1px solid red"
      :style="`left: ${(x - xGrids / 2) * gridSize}px; top: ${(y - yGrids / 2) * gridSize}px; width: ${w * gridSize}px; height: ${h * gridSize}px`"
    /> -->
  </div>
</template>

<script>
// 【网格视图】
import { mapState, mapGetters } from 'vuex'
import { debounce } from 'quasar'
import { intersectRect, mergeRect } from 'boot/draw'

export default {
  data: () => ({
    rects: [],
    bgPattern: null // 背景图案（半透明黑白相间棋盘格）
  }),

  computed: {
    ...mapState('edit', ['xGrids', 'yGrids', 'gridSize', 'brushSize', 'brushPos']),
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
    // 网格数量改变后刷新全部网格
    xGrids: 'refreshGrids',
    yGrids: 'refreshGrids',

    // 笔刷位置改变后刷新笔刷区域网格（前后两个区域都要刷）
    brushPos(val, oldVal) {
      const size = this.brushSize
      const offset = Math.floor(size / 2)
      if (val && oldVal) {
        const { x, y } = val
        const { x: oldX, y: oldY } = oldVal
        const rects = mergeRect(x - offset, y - offset, size, size, oldX - offset, oldY - offset, size, size)
        this.rects = rects
        rects.forEach(rect => this.refreshArea(...rect))
      } else {
        const { x, y } = val || oldVal
        this.rects = [[x - offset, y - offset, size, size]]
        this.refreshArea(x - offset, y - offset, size, size)
      }
    },

    // 笔刷状态改变后刷新笔刷区域网格（只需刷较大的那个区域）
    brushStates(val, oldVal) {
      if (!this.brushPos) return
      const { x, y } = this.brushPos
      const size = Math.sqrt(Math.max(val.length, oldVal.length))
      const offset = Math.floor(size / 2)
      this.refreshArea(x - offset, y - offset, size, size)
    }
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
    // - @left, top, width, height 区域范围
    refreshArea(left, top, width, height) {
      const [x, y, w, h] = intersectRect(left, top, width, height, 0, 0, this.xGrids, this.yGrids)
      if (!w || !h) return
      // console.log(x, y, w, h)
      const ctx = this.$refs.canvas.getContext('2d')
      ctx.clearRect(x, y, w, h)
      ctx.fillStyle = this.bgPattern
      ctx.fillRect(x, y, w, h)

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
    }, 10)
  },

  mounted() {
    this.initBgPattern()
    this.refreshGrids()
  }
}
</script>
