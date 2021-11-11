<template>
  <canvas style="imagerendering: pixelated" />
</template>

<script>
// 【笔刷图案】
import { mapState, mapGetters } from 'vuex'

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
      this.$el.width = this.brushSize
      this.$el.height = this.brushSize
      const ctx = this.$el.getContext('2d')
      ctx.fillStyle = '#f008'
      ctx.fillRect(0, 0, size, size)
    }
  },

  mounted() {
    this.refreshPattern()
  }
}
</script>
