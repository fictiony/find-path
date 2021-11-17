<template>
  <div>
    <canvas ref="bg" class="absolute-center" :style="canvasStyle" :width="xGrids" :height="yGrids" />
    <canvas ref="state" class="absolute-center" :style="canvasStyle" :width="xGrids" :height="yGrids" />
    <div class="absolute" :style="layerStyle">
      <MarkLayer ref="mark" />
      <BrushCursor ref="cursor" />
    </div>
  </div>
</template>

<script>
// 【网格视图】
import { mapState, mapGetters } from 'vuex'
import { mapStateRW } from 'boot/utils'
import { debounce } from 'quasar'
// eslint-disable-next-line no-unused-vars
import { stateToColor, setPixel, intersectRect, mergeRect } from 'boot/draw'

export default {
  data: () => ({
    bgPattern: null // 背景图案（半透明黑白相间棋盘格）
  }),

  computed: {
    ...mapState('edit', ['xGrids', 'yGrids', 'gridSize', 'gridStates', 'brushSize', 'brushPos']),
    ...mapStateRW('edit', ['dirtyArea']),
    ...mapGetters('edit', ['halfGridWidth', 'halfGridHeight']),

    // 画布样式
    canvasStyle() {
      const border = 2 * this.gridSize
      return {
        width: this.xGrids * this.gridSize + border * 2 + 'px',
        height: this.yGrids * this.gridSize + border * 2 + 'px',
        border: border + 'px solid #6666',
        imageRendering: 'pixelated'
      }
    },

    // 图层样式
    layerStyle() {
      return {
        left: -this.halfGridWidth + 'px',
        top: -this.halfGridHeight + 'px'
      }
    }
  },

  watch: {
    // 网格数量和状态表改变后刷新全部网格
    xGrids: 'refreshGrids',
    yGrids: 'refreshGrids',
    gridStates: 'refreshGrids',

    // 脏区域更改后自动刷新
    dirtyArea: 'refreshDirtyArea',

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
      ctx.clearRect(0, 0, this.xGrids, this.yGrids)
      ctx.fillStyle = this.bgPattern
      ctx.fillRect(0, 0, this.xGrids, this.yGrids)
    },

    // 刷新指定区域网格
    // - @left, top, width, height 区域范围
    refreshArea(left, top, width, height) {
      const { xGrids, yGrids, gridStates } = this
      const [x, y, w, h] = intersectRect(left, top, width, height, 0, 0, xGrids, yGrids)
      if (!w || !h) return
      // console.log('刷新区域', x, y, w, h)

      // 绘制格子
      const imageData = new ImageData(w, h)
      const data = imageData.data
      for (let j = 0, index = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
          const pos = i + x + (j + y) * xGrids
          const state = gridStates[pos]
          state && setPixel(data, index, ...stateToColor(state))
          index += 4
        }
      }
      const ctx = this.$refs.state.getContext('2d')
      ctx.putImageData(imageData, x, y)
    },

    // 刷新全部网格
    refreshGrids: debounce(function () {
      const tm = Date.now()
      this.refreshBg()
      this.refreshArea(0, 0, this.xGrids, this.yGrids)
      console.log('用时', Date.now() - tm)
    }, 100),

    // 刷新脏区域网格
    refreshDirtyArea() {
      if (this.dirtyArea) {
        this.refreshArea(...this.dirtyArea)
        this.dirtyArea = null
      }
    }
  },

  mounted() {
    this.initBgPattern()
    this.refreshGrids()
  }
}
</script>
