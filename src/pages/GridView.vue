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
import { stateToColor, setPixel } from 'boot/draw'
import PathNode from 'src/core/PathNode'

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
    },

    // 画布图案数据
    canvasData() {
      if (!this.gridStates) return
      return new ImageData(this.xGrids, this.yGrids)
    }
  },

  watch: {
    // 网格数量改变后刷新全部网格
    xGrids: 'refreshGrids',
    yGrids: 'refreshGrids',

    // 脏区域更改后自动刷新
    dirtyArea: 'refreshDirtyArea'
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

    // 刷新全部网格
    refreshGrids: debounce(function () {
      const tm = Date.now()
      this.refreshBg()
      this.refreshDirtyArea()
      console.log('用时', Date.now() - tm)
    }, 100),

    // 刷新脏区域网格
    refreshDirtyArea() {
      const { dirtyArea, gridStates } = this
      if (!dirtyArea) return
      const all = dirtyArea === 'all'
      const area = all ? gridStates : dirtyArea
      this.dirtyArea = null

      // 遍历脏区域更新像素颜色
      const { data, width, height } = this.canvasData
      let [minX, maxX, minY, maxY] = [width, 0, height, 0]
      for (const id of area.keys()) {
        const [x, y] = PathNode.idToXY(id)
        const state = gridStates.get(id) || 0
        // TODO 叠加寻路状态
        setPixel(data, (x + y * width) * 4, ...stateToColor(state))

        // 更新脏区域范围（全脏时无需处理）
        if (all) continue
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }

      // 将脏区域内容放到画布上
      if (!all && (minX > maxX || minY > maxY)) return
      const ctx = this.$refs.state.getContext('2d')
      if (all) {
        ctx.putImageData(this.canvasData, 0, 0)
      } else {
        ctx.putImageData(this.canvasData, 0, 0, minX, minY, maxX - minX, maxY - minY)
      }
    }
  },

  mounted() {
    this.initBgPattern()
    this.refreshGrids()
  }
}
</script>
