<template>
  <canvas class="absolute-center" :style="canvasStyle" :width="xGrids" :height="yGrids" />
</template>

<script>
// 【网格视图】
import { mapState } from 'vuex'
import { debounce } from 'quasar'

// 设置单个像素颜色
// - @data 位图数据
// - @index 像素序号
// - @r, g, b, a 颜色分量
function setPixel(data, index, r, g, b, a = 255) {
  data[index] = r
  data[index + 1] = g
  data[index + 2] = b
  data[index + 3] = a
}

export default {
  props: {
    show: {
      type: Boolean,
      default: true
    }
  },

  computed: {
    ...mapState('edit', ['xGrids', 'yGrids', 'gridSize']),

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
    yGrids: 'refreshGrids'
  },

  methods: {
    // 刷新全部网格
    refreshGrids: debounce(function () {
      const tm = Date.now()
      this.refreshArea(0, 0, this.xGrids, this.yGrids)
      console.log('用时', Date.now() - tm)
    }, 100),

    // 刷新指定区域网格
    // - @x, y, width, height 区域范围
    refreshArea(x, y, width, height) {
      const ctx = this.$el.getContext('2d')
      const imageData = ctx.createImageData(width, height)
      const data = imageData.data
      for (let j = 0, index = 0; j < height; j++) {
        for (let i = 0, t = x + y + j; i < width; i++) {
          if (!ctx) {
            // 若格点非空，则绘制格点颜色
            //
          } else {
            // 否则绘制底色（半透明黑白相间棋盘格）
            const r = (t + i) % 2 ? 255 : 0
            setPixel(data, index, r, r, r, 32)
          }
          index += 4
        }
      }
      ctx.putImageData(imageData, x, y)
    }
  },

  mounted() {
    this.refreshGrids()
  }
}
</script>
