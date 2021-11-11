<template>
  <div>
    <canvas ref="bg" class="absolute-center" :style="canvasStyle" :width="xGrids" :height="yGrids" />
    <canvas ref="state" class="absolute-center" :style="canvasStyle" :width="xGrids" :height="yGrids" />
    <BrushCursor />
  </div>
</template>

<script>
// 【网格视图】
import { mapState } from 'vuex'
import { debounce } from 'quasar'
// eslint-disable-next-line no-unused-vars
import { setPixel, intersectRect, mergeRect } from 'boot/draw'

export default {
  data: () => ({
    bgPattern: null // 背景图案（半透明黑白相间棋盘格）
  }),

  computed: {
    ...mapState('edit', ['xGrids', 'yGrids', 'gridSize', 'brushSize', 'brushPos']),

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
      // const size = this.brushSize
      // const offset = Math.floor(size / 2)
      // if (val && oldVal) {
      //   const { x, y } = val
      //   const { x: oldX, y: oldY } = oldVal
      //   const rects = mergeRect(x - offset, y - offset, size, size, oldX - offset, oldY - offset, size, size)
      //   rects.forEach(rect => this.refreshArea(...rect))
      // } else {
      //   const { x, y } = val || oldVal
      //   this.refreshArea(x - offset, y - offset, size, size)
      // }
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

    // 刷新背景
    refreshBg() {
      const ctx = this.$refs.bg.getContext('2d')
      ctx.fillStyle = this.bgPattern
      ctx.fillRect(0, 0, this.xGrids, this.yGrids)
    },

    // 刷新指定区域网格
    // - @left, top, width, height 区域范围
    refreshArea(left, top, width, height) {
      const [x, y, w, h] = intersectRect(left, top, width, height, 0, 0, this.xGrids, this.yGrids)
      if (!w || !h) return
      // console.log('刷新区域', , x, y, w, h)

      // 绘制格子
      const ctx = this.$refs.state.getContext('2d')
      const imageData = ctx.createImageData(w, h)
      const data = imageData.data
      for (let j = 0, index = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
          const color = this.getGridColor(i + x, j + y)
          if (color) {
            setPixel(data, index, ...color)
          }
          index += 4
        }
      }
      ctx.putImageData(imageData, x, y)
    },

    // 获取指定坐标的格子颜色
    // - @x, y 格子坐标
    // - @return [红色0~255, 绿色0~255, 蓝色0~255, 不透明度0~255]，无则返回null
    getGridColor(x, y) {
      if (x % 10 && y % 10) return null
      return [0, 255, 0, 200]
    },

    // 刷新全部网格
    refreshGrids: debounce(function () {
      const tm = Date.now()
      this.refreshBg()
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
