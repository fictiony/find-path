<template>
  <ZoomView
    ref="view"
    class="absolute-full"
    :class="`bg-grey-${$q.dark.isActive ? 9 : 5}`"
    :min-x="Math.min(0, halfViewWidth - halfGridWidth - margin / viewZoom)"
    :max-x="Math.max(0, halfGridWidth + margin / viewZoom - halfViewWidth)"
    :min-y="Math.min(0, halfViewHeight - halfGridHeight - margin / viewZoom)"
    :max-y="Math.max(0, halfGridHeight + margin / viewZoom - halfViewHeight)"
    :zoom.sync="viewZoom"
    :min-zoom="minViewZoom"
    :max-zoom="maxViewZoom"
    @resize="(w, h) => ((halfViewWidth = w / 2), (halfViewHeight = h / 2))"
  >
    <router-view name="grid" />
  </ZoomView>
</template>

<script>
// 【主视图区】
import { mapGetters } from 'vuex'
import { mapStateRW } from 'boot/utils'
import key from 'keymaster'

export default {
  data: () => ({
    margin: 50, // 边缘留白
    halfViewWidth: 100, // 视图宽度的一半
    halfViewHeight: 100 // 视图高度的一半
  }),

  computed: {
    ...mapStateRW('main', ['viewZoom']),
    ...mapGetters('main', ['maxViewZoom', 'minViewZoom']),
    ...mapGetters('edit', ['halfGridWidth', 'halfGridHeight'])
  },

  mounted() {
    if (process.env.DEBUGGING) {
      window.$m = this
    }

    // 绑定快捷键
    key.setScope('main')
  }
}
</script>
