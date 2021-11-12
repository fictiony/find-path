<template>
  <canvas style="image-rendering: pixelated" />
</template>

<script>
// 【笔刷图案】
import { mapState, mapGetters } from 'vuex'
import { OBSTACLE_COLOR, WALL_COLOR, setPixel } from 'boot/draw'

export default {
  computed: {
    ...mapState('edit', ['brushSize']),
    ...mapGetters('edit', ['brushStates'])
  },

  watch: {
    // 笔刷状态改变后刷新笔刷图案
    brushStates: 'refreshPattern'
  },

  methods: {
    // 刷新笔刷图案
    refreshPattern() {
      if (!this.$el) return
      const size = this.brushSize
      this.$el.width = size
      this.$el.height = size

      const ctx = this.$el.getContext('2d')
      const imageData = ctx.createImageData(size, size)
      const data = imageData.data
      this.brushStates.forEach((state, index) => {
        if (state > 100) {
          setPixel(data, index * 4, ...WALL_COLOR)
        } else if (state > 0) {
          setPixel(data, index * 4, ...OBSTACLE_COLOR, 30 + state * 2)
        }
      })
      ctx.putImageData(imageData, 0, 0)
    }
  },

  mounted() {
    this.refreshPattern()
  }
}
</script>
