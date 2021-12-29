<template>
  <div>
    <canvas ref="bg" class="absolute-center" :style="bgStyle" :width="xGrids" :height="yGrids" />
    <canvas ref="grid" class="absolute-center" :style="canvasStyle" :width="xGrids" :height="yGrids" />
    <canvas ref="path" class="absolute-center" :style="canvasStyle" :width="xGrids" :height="yGrids" />
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
import { gridToColor, pathToColor, setPixel } from 'boot/draw'
import PathNode from 'src/core/PathNode'

export default {
  data: () => ({
    bgPattern: null // 背景图案（半透明黑白相间棋盘格）
  }),

  computed: {
    ...mapState('edit', ['xGrids', 'yGrids', 'gridSize', 'gridStates', 'pathStates', 'brushSize', 'brushPos']),
    ...mapStateRW('edit', ['gridDirty', 'pathDirty']),
    ...mapGetters('edit', ['halfGridWidth', 'halfGridHeight']),

    // 背景样式
    bgStyle() {
      const border = 2 * this.gridSize
      return {
        width: this.xGrids * this.gridSize + border * 2 + 'px',
        height: this.yGrids * this.gridSize + border * 2 + 'px',
        border: border + 'px solid #8886',
        imageRendering: 'pixelated'
      }
    },

    // 画布样式
    canvasStyle() {
      return {
        width: this.xGrids * this.gridSize + 'px',
        height: this.yGrids * this.gridSize + 'px',
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

    // 格子图案数据
    gridImageData() {
      if (!this.gridStates) return // 格子状态表更改后也要重建
      return new ImageData(this.xGrids, this.yGrids)
    },

    // 路径图案数据
    pathImageData() {
      if (!this.pathStates) return // 路径状态表更改后也要重建
      return new ImageData(this.xGrids, this.yGrids)
    }
  },

  watch: {
    // 网格数量改变后刷新背景
    xGrids: 'refreshBgLater',
    yGrids: 'refreshBgLater',

    // 脏区域更改后自动刷新
    gridDirty: 'refreshDirtyGridLater',
    pathDirty: 'refreshDirtyPathLater'
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
    refreshBgLater: debounce(function () {
      this.refreshBg()
    }, 0),

    // 刷新脏区域格子
    refreshDirtyGrid() {
      if (!this.gridDirty) return
      const all = this.gridDirty === 'all'
      const dirtyArea = all ? this.gridStates : this.gridDirty
      this.gridDirty = null
      // const tm = Date.now()
      this.refreshDirtyArea(this.$refs.grid, this.gridImageData, this.gridStates, dirtyArea, all, gridToColor)
      // all && console.log('用时', Date.now() - tm)
    },
    refreshDirtyGridLater: debounce(function () {
      this.refreshDirtyGrid()
    }, 0),

    // 刷新脏区域路径
    refreshDirtyPath() {
      if (!this.pathDirty) return
      const all = this.pathDirty === 'all'
      const dirtyArea = all ? this.pathStates : this.pathDirty
      this.pathDirty = null
      this.refreshDirtyArea(this.$refs.path, this.pathImageData, this.pathStates, dirtyArea, all, pathToColor)
    },
    refreshDirtyPathLater: debounce(function () {
      this.refreshDirtyPath()
    }, 0),

    // 刷新脏区域
    // - @canvas 画布
    // - @imageData 图案数据
    // - @states 状态表
    // - @dirtyArea 脏区域
    // - @all 是否全脏
    // - @stateColor 状态转颜色函数
    refreshDirtyArea(canvas, imageData, states, dirtyArea, all, stateColor) {
      if (!all && dirtyArea.size === 0) return
      const { data, width, height } = imageData
      let [minX, maxX, minY, maxY] = [width, 0, height, 0]

      // 遍历脏区域更新像素颜色
      for (const id of dirtyArea.keys()) {
        const [x, y] = PathNode.idToXY(id)
        const state = states.get(id) || 0
        setPixel(data, (x + y * width) * 4, ...stateColor(state))

        // 更新脏区域范围（全脏时无需处理）
        if (all) continue
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }

      // 将脏区域内容绘制到画布上
      const ctx = canvas.getContext('2d')
      if (all) {
        ctx.putImageData(imageData, 0, 0)
      } else {
        ctx.putImageData(imageData, 0, 0, minX, minY, maxX - minX + 1, maxY - minY + 1)
      }
    }
  },

  mounted() {
    this.initBgPattern()
    this.refreshBg()
    this.gridDirty = 'all'
    this.pathDirty = 'all'
  }
}
</script>
